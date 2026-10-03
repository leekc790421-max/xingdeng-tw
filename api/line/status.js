/**
 * LINE Bot 狀態檢查 API
 * GET /api/line/status
 */
module.exports = async function handler(req, res) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!token) {
    return res.status(200).json({
      status: 'not_configured',
      message: 'LINE_CHANNEL_ACCESS_TOKEN 尚未設定',
      setup: {
        step1: '至 LINE Developers Console (developers.line.biz) 建立 Messaging API Channel',
        step2: '取得 Channel Access Token（長期授權）',
        step3: '在 Vercel 控制台 → 專案設定 → 環境變數，新增 LINE_CHANNEL_ACCESS_TOKEN',
        step4: '設定 Webhook URL: https://xingdeng.tw/api/line/webhook',
        step5: '開啟「使用 Webhook」開關'
      }
    });
  }

  try {
    // 檢查 token 是否有效
    const verifyRes = await fetch('https://api.line.me/v2/bot/message/quota', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (verifyRes.ok) {
      const quota = await verifyRes.json();
      return res.status(200).json({
        status: 'active',
        message: 'LINE Bot 運作正常',
        webhook: 'https://xingdeng.tw/api/line/webhook',
        quota: quota,
        botInfo: {
          basicInfo: '已連線',
          lineOfficialAccount: '@559julyu'
        }
      });
    } else {
      return res.status(200).json({
        status: 'token_invalid',
        message: 'Channel Access Token 無效或已過期',
        hint: '請至 LINE Developers Console 重新產生 Token'
      });
    }
  } catch (error) {
    return res.status(200).json({
      status: 'error',
      message: error.message
    });
  }
};
