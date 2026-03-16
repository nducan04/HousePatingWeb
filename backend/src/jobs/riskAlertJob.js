const cron = require('node-cron');
const SalesTarget = require('../models/SalesTarget');
const AlertLog = require('../models/AlertLog');
const sendAlertEmail = require('../utils/mailer');

// Run everyday at 08:00 AM
// "0 8 * * *"
// Using "* * * * *" for testing (runs every minute) if needed
const startRiskAlertJob = () => {
  cron.schedule('0 8 * * *', async () => {
    console.log('[Cronjob] Running Risk Alert Check at ' + new Date().toISOString());

    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      // Find targets for current month where actual kg is < 80% of target
      // (Simplified logic for milestone check - normally you'd check pro-rata)
      const atRiskTargets = await SalesTarget.find({
        'period.month': currentMonth,
        'period.year': currentYear,
        $expr: { $lt: [ "$actualKg", { $multiply: [ "$targetKg", 0.8 ] } ] }
      }).populate('customer');

      if (atRiskTargets.length === 0) {
        console.log('[Cronjob] No at-risk targets found today.');
        return;
      }

      console.log(`[Cronjob] Found ${atRiskTargets.length} at-risk targets. Dispatching alerts...`);

      for (const target of atRiskTargets) {
        // Prepare data
        const customer = target.customer;
        const actualPct = Math.round((target.actualKg / target.targetKg) * 100);
        
        // Log to database
        const alert = await AlertLog.create({
          customer: customer._id,
          alertType: 'VOLUME_DROP',
          threshold: target.targetKg * 0.8,
          actual: target.actualKg,
          message: `Sản lượng đạt ${actualPct}% (<80% mục tiêu). Cần follow-up gấp.`,
          sentTo: [customer.assignedSale, 'Trưởng phòng KD']
        });

        // Construct Email HTML
        const emailHtml = `
          <h2>⚠️ Cảnh báo Rủi ro Sản lượng (Risk Alert)</h2>
          <p>Kính gửi bộ phận kinh doanh, hệ thống phát hiện sản lượng của khách hàng có dấu hiệu tụt giảm nghiêm trọng:</p>
          <table border="1" cellpadding="8" style="border-collapse: collapse;">
            <tr><th>Khách hàng</th><td>${customer.name} (${customer.code})</td></tr>
            <tr><th>Sale phụ trách</th><td>${customer.assignedSale}</td></tr>
            <tr><th>Mục tiêu tháng ${currentMonth}</th><td>${target.targetKg.toLocaleString()} kg</td></tr>
            <tr><th>Thực tế đạt được</th><td style="color: red"><b>${target.actualKg.toLocaleString()} kg (${actualPct}%)</b></td></tr>
          </table>
          <p>Vui lòng liên hệ khách hàng để tìm hiểu nguyên nhân và có phương án xử lý kịp thời.</p>
          <br>
          <p><small>Email này được tự động gửi từ Hệ thống quản lý VTSC.</small></p>
        `;

        // Dispatch Email (using generic role emails based on assigned sale)
        await sendAlertEmail({
          email: `${customer.assignedSale.toLowerCase().replace(/ /g, '')}@vtsc.vn`, 
          subject: `[VTSC-ALERT] Cảnh báo Sản lượng - ${customer.name}`,
          message: emailHtml
        });
      }

    } catch (error) {
      console.error('[Cronjob Error]', error);
    }
  });
  
  console.log('Risk Alert Cronjob scheduled (Runs daily at 08:00 AM).');
};

module.exports = startRiskAlertJob;
