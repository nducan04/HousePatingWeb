const express = require('express');
const router = express.Router();
const khuyenMaiController = require('../controllers/khuyenMaiController');

router.post('/validate', khuyenMaiController.validateKhuyenMai);
router.get('/', khuyenMaiController.getAllKhuyenMai);
router.post('/', khuyenMaiController.createKhuyenMai);
router.put('/:khuyenMaiId/ap-dung', khuyenMaiController.apDungKhuyenMai);
router.put('/:khuyenMaiId', khuyenMaiController.updateKhuyenMai);
router.delete('/:khuyenMaiId', khuyenMaiController.deleteKhuyenMai);

module.exports = router;
