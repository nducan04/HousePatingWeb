const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/danhMucSonController');

const router = express.Router();

router.get('/', getAllCategories);
router.post('/', protect, authorize('Admin', 'Director'), createCategory);
router.put('/:id', protect, authorize('Admin', 'Director'), updateCategory);
router.delete('/:id', protect, authorize('Admin', 'Director'), deleteCategory);

module.exports = router;
