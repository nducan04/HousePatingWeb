const cron = require('node-cron');
const SalesTarget = require('../models/SalesTarget');
const sendAlertEmail = require('../utils/mailer');

const startRiskAlertJob = () => {
  cron.schedule('0 8 * * *', async () => {
    console.log('[Cronjob] Running Risk Alert Check at ' + new Date().toISOString());

    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      // Lấy danh sách Target có Actual < 80%
      const atRiskTargets = await SalesTarget.find({
        'period.month': currentMonth,
        'period.year': currentYear,
        $expr: { $lt: [ "$actualKg", { $multiply: [ "$targetKg", 0.8 ] } ] }
      }).populate('customer');

      if (atRiskTargets.length === 0) {
        console.log('[Cronjob] Không có rủi ro sản lượng nào hôm nay.');
        return;
      }

      console.log(`[Cronjob] Phát hiện ${atRiskTargets.length} rủi ro. Đang gửi email...`);

      for (const target of atRiskTargets) {
        const khachHang = target.customer;
        if (!khachHang) continue;

        const actualPct = Math.round((target.actualKg / target.targetKg) * 100);

        const emailHtml = `
          <h2>⚠️ Cảnh báo Rủi ro Sản lượng (Risk Alert)</h2>
          <p>Hệ thống phát hiện sản lượng của khách hàng có dấu hiệu tụt giảm nghiêm trọng:</p>
          <table border="1" cellpadding="8" style="border-collapse: collapse;">
            <tr><th>Khách hàng</th><td>${khachHang.TenKhachHang} (${khachHang.MaKH})</td></tr>
            <tr><th>Phân loại</th><td>${khachHang.PhanLoai}</td></tr>
            <tr><th>Mục tiêu tháng ${currentMonth}</th><td>${target.targetKg.toLocaleString()} kg</td></tr>
            <tr><th>Thực tế đạt được</th><td style="color: red"><b>${target.actualKg.toLocaleString()} kg (${actualPct}%)</b></td></tr>
          </table>
          <p>Vui lòng liên hệ khách hàng để tìm hiểu nguyên nhân và có phương án xử lý kịp thời.</p>
          <br>
          <p><small>Email này được tự động gửi từ Hệ thống quản lý VTSC PaintPro.</small></p>
        `;

        await sendAlertEmail({
          email: 'phibinhminh@vtsc.vn', // Mặc định gửi cho Trưởng phòng KD
          subject: `[VTSC-ALERT] Cảnh báo Sản lượng - ${khachHang.TenKhachHang}`,
          message: emailHtml
        });
      }

    } catch (error) {
      console.error('[Cronjob Error]', error);
    }
  });
  
  console.log('Risk Alert Cronjob scheduled (Runs daily at 08:00 AM)');
};

module.exports = startRiskAlertJob;
