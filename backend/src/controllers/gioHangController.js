const GioHang = require('../models/GioHang');
const SanPhamSon = require('../models/SanPhamSon');

// Helper tính tổng tiền
const calculateTotal = async (items) => {
  let subtotal = 0;
  for (let item of items) {
    const spId = item.SanPham?._id || item.SanPham;
    const sp = await SanPhamSon.findById(spId);
    if (sp) {
      subtotal += (sp.DonGiaCoSo || 0) * item.SoLuong;
    }
  }
  const tax = subtotal >= 5000000 ? subtotal * 0.08 : 0;
  return {
    TongTienTamTinh: subtotal,
    TienThue: tax,
    TongThanhToan: subtotal + tax
  };
};

// @desc    Lấy giỏ hàng theo SessionId
// @route   GET /api/gio-hang/:sessionId
exports.getCart = async (req, res) => {
  try {
    const { sessionId } = req.params;
    let cart = await GioHang.findOne({ SessionId: sessionId }).populate({
      path: 'Items.SanPham',
      select: 'MaSanPham TenDongSon DonGiaCoSo HinhAnh TongTonKho PhanLoai'
    });

    if (!cart) {
      cart = await GioHang.create({ SessionId: sessionId, Items: [], TongTienTamTinh: 0 });
    } else {
      // Merge any duplicate items resulting from previous bugs
      let hasDuplicates = false;
      const mergedItems = [];
      for (const item of cart.Items) {
        if (!item.SanPham) continue;
        const itemMaMau = item.MaMau || 'N/A';
        const existing = mergedItems.find(i => i.SanPham._id.toString() === item.SanPham._id.toString() && (i.MaMau || 'N/A') === itemMaMau);
        if (existing) {
          existing.SoLuong += item.SoLuong;
          hasDuplicates = true;
        } else {
          mergedItems.push(item);
        }
      }
      if (hasDuplicates) {
        cart.Items = mergedItems;
        const totals = await calculateTotal(cart.Items);
        cart.TongTienTamTinh = totals.TongTienTamTinh;
        cart.TienThue = totals.TienThue;
        cart.TongThanhToan = totals.TongThanhToan;
        await cart.save();
      }
    }

    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Thêm/Cập nhật item trong giỏ
// @route   POST /api/gio-hang/:sessionId
exports.updateCart = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { SanPhamId, SoLuong, MaMau = 'N/A' } = req.body;

    let cart = await GioHang.findOne({ SessionId: sessionId });
    if (!cart) {
      cart = new GioHang({ SessionId: sessionId, Items: [] });
    }

    // Tìm theo SanPhamId và MaMau (nếu có)
    const itemIndex = cart.Items.findIndex(i => {
      const sameProduct = i.SanPham.toString() === SanPhamId;
      const itemMaMau = i.MaMau || 'N/A';
      if (MaMau) {
        return sameProduct && itemMaMau === MaMau;
      }
      return sameProduct;
    });

    if (itemIndex > -1) {
      if (SoLuong <= 0) {
        // Remove item if SoLuong is 0 or less
        cart.Items.splice(itemIndex, 1);
      } else {
        // Update quantity
        cart.Items[itemIndex].SoLuong = SoLuong;
      }
    } else {
      if (SoLuong > 0) {
        cart.Items.push({ SanPham: SanPhamId, MaMau, SoLuong });
      }
    }

    // Tính tổng tiền
    const totals = await calculateTotal(cart.Items);
    cart.TongTienTamTinh = totals.TongTienTamTinh;
    cart.TienThue = totals.TienThue;
    cart.TongThanhToan = totals.TongThanhToan;
    await cart.save();

    // Lấy lại cart info với populate
    const updatedCart = await GioHang.findById(cart._id).populate({
      path: 'Items.SanPham',
      select: 'MaSanPham TenDongSon DonGiaCoSo HinhAnh TongTonKho PhanLoai'
    });

    res.status(200).json({ success: true, data: updatedCart });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Xóa giỏ (Checkout or Clear)
// @route   DELETE /api/gio-hang/:sessionId
exports.clearCart = async (req, res) => {
  try {
    const { sessionId } = req.params;
    await GioHang.findOneAndDelete({ SessionId: sessionId });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Gộp giỏ hàng khách vào giỏ hàng user
// @route   POST /api/gio-hang/merge
exports.mergeCart = async (req, res) => {
  try {
    const { guestSessionId } = req.body;
    const userSessionId = req.user.id || req.user._id;

    if (!guestSessionId) {
      return res.status(400).json({ success: false, message: 'Thiếu guestSessionId' });
    }

    // Nếu guestSessionId trùng với userSessionId thì không gộp
    if (guestSessionId === userSessionId.toString()) {
      const currentCart = await GioHang.findOne({ SessionId: userSessionId }).populate({
        path: 'Items.SanPham',
        select: 'MaSanPham TenDongSon DonGiaCoSo HinhAnh TongTonKho PhanLoai'
      });
      return res.status(200).json({ success: true, data: currentCart || { SessionId: userSessionId, Items: [] } });
    }

    // Tìm giỏ hàng của khách (guest)
    const guestCart = await GioHang.findOne({ SessionId: guestSessionId });
    if (!guestCart || guestCart.Items.length === 0) {
      // Không có gì để gộp, trả về giỏ hàng hiện tại của user hoặc giỏ hàng trống mới
      let userCart = await GioHang.findOne({ SessionId: userSessionId }).populate({
        path: 'Items.SanPham',
        select: 'MaSanPham TenDongSon DonGiaCoSo HinhAnh TongTonKho PhanLoai'
      });
      if (!userCart) {
        userCart = await GioHang.create({ SessionId: userSessionId, Items: [], TongTienTamTinh: 0 });
      }
      return res.status(200).json({ success: true, data: userCart });
    }

    // Tìm hoặc tạo giỏ hàng của user
    let userCart = await GioHang.findOne({ SessionId: userSessionId });
    if (!userCart) {
      userCart = new GioHang({ SessionId: userSessionId, Items: [] });
    }

    // Gộp items từ giỏ hàng khách sang giỏ hàng user
    for (const guestItem of guestCart.Items) {
      if (!guestItem.SanPham) continue;
      const guestProductStr = guestItem.SanPham.toString();
      const guestMaMau = guestItem.MaMau || 'N/A';

      const itemIndex = userCart.Items.findIndex(i => {
        return i.SanPham.toString() === guestProductStr && (i.MaMau || 'N/A') === guestMaMau;
      });

      if (itemIndex > -1) {
        // Cộng dồn số lượng
        userCart.Items[itemIndex].SoLuong += guestItem.SoLuong;
      } else {
        // Thêm mới
        userCart.Items.push({
          SanPham: guestItem.SanPham,
          MaMau: guestMaMau,
          SoLuong: guestItem.SoLuong
        });
      }
    }

    // Tính toán lại tổng tiền cho giỏ hàng của user
    const totals = await calculateTotal(userCart.Items);
    userCart.TongTienTamTinh = totals.TongTienTamTinh;
    userCart.TienThue = totals.TienThue;
    userCart.TongThanhToan = totals.TongThanhToan;
    await userCart.save();

    // Xóa giỏ hàng của khách (guest) sau khi gộp
    await GioHang.findOneAndDelete({ SessionId: guestSessionId });

    // Populate và trả về giỏ hàng đã cập nhật
    const updatedCart = await GioHang.findById(userCart._id).populate({
      path: 'Items.SanPham',
      select: 'MaSanPham TenDongSon DonGiaCoSo HinhAnh TongTonKho PhanLoai'
    });

    res.status(200).json({ success: true, data: updatedCart });
  } catch (error) {
    console.error('Merge cart error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
