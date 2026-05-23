const GioHang = require('../models/GioHang');
const SanPhamSon = require('../models/SanPhamSon');

// Helper tính tổng tiền
const calculateTotal = async (items) => {
  let total = 0;
  for (let item of items) {
    const sp = await SanPhamSon.findById(item.SanPham);
    if (sp) {
      total += (sp.DonGiaCoSo || 0) * item.SoLuong;
    }
  }
  return total;
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
    const { SanPhamId, SoLuong } = req.body;
    
    let cart = await GioHang.findOne({ SessionId: sessionId });
    if (!cart) {
      cart = new GioHang({ SessionId: sessionId, Items: [] });
    }

    const itemIndex = cart.Items.findIndex(i => i.SanPham.toString() === SanPhamId);
    
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
        cart.Items.push({ SanPham: SanPhamId, SoLuong });
      }
    }

    // Tính tổng tiền
    cart.TongTienTamTinh = await calculateTotal(cart.Items);
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
