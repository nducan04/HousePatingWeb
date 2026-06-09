const DanhMucSon = require('../models/DanhMucSon');

// @desc    Lấy danh sách tất cả danh mục sơn
// @route   GET /api/danh-muc-son
// @access  Public or Private (tùy nghiệp vụ)
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await DanhMucSon.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Thêm danh mục sơn mới
// @route   POST /api/danh-muc-son
// @access  Private/Admin
exports.createCategory = async (req, res) => {
    try {
        const category = await DanhMucSon.create(req.body);
        res.status(201).json({ success: true, data: category });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Tên danh mục đã tồn tại' });
        }
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Cập nhật danh mục sơn
// @route   PUT /api/danh-muc-son/:id
// @access  Private/Admin
exports.updateCategory = async (req, res) => {
    try {
        const category = await DanhMucSon.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!category) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
        }

        res.status(200).json({ success: true, data: category });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Tên danh mục đã tồn tại' });
        }
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Xóa danh mục sơn
// @route   DELETE /api/danh-muc-son/:id
// @access  Private/Admin
exports.deleteCategory = async (req, res) => {
    try {
        const category = await DanhMucSon.findByIdAndDelete(req.params.id);

        if (!category) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
        }

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
