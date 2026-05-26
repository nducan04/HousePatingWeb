const express = require('express');
const router = express.Router();
const doiTraController = require('../controllers/doiTraController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // Tất cả các route đổi trả đều cần đăng nhập

router.get('/', doiTraController.getReturns);
router.post('/', doiTraController.createReturn);
router.get('/:id', doiTraController.getReturnById);
router.patch('/:id/status', doiTraController.updateStatus);

module.exports = router;
