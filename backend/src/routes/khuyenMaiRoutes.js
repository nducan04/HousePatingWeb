const express = require('express');
const router = express.Router();
const khuyenMaiController = require('../controllers/khuyenMaiController');

router.get('/', khuyenMaiController.getAllKhuyenMai);
router.post('/', khuyenMaiController.createKhuyenMai);
router.put('/:khuyenMaiId/ap-dung', khuyenMaiController.apDungKhuyenMai);

module.exports = router;
