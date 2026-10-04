/**
 * SNT 光耀星樞 — 電子報訂閱 API
 * Vercel Serverless Function
 *
 * 環境變數：
 *   RESEND_API_KEY           — Resend Email API Key
 *   RESEND_AUDIENCE_ID       — Resend Audience ID（訂閱者名單）
 */

const RESEND_API = 'https://api.resend.com';

// 驗證 Email
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 訂閱電子報
async function subscribeToNewsletter(email, name, source) {
  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  
  if (!apiKey) {
    console.log('RESEND_API_KEY not set');
    return { success: false, message: 'Email service not configured' };
  }
  
  try {
    // 新增訂閱者到 Audience
    const res = await fetch(`${RESEND_API}/audiences/${audienceId}/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        email: email,
        name: name || '',
        unsubscribed: false
      })
    });
    
    if (!res.ok) {
      const err = await res.text();
      console.error('Resend subscribe error:', err);
      return { success: false, message: '訂閱失敗' };
    }
    
    // 發送歡迎郵件
    await sendWelcomeEmail(email, name);
    
    return { success: true, message: '訂閱成功' };
  } catch (error) {
    console.error('Subscribe error:', error);
    return { success: false, message: error.message };
  }
}

// 發送歡迎郵件
async function sendWelcomeEmail(email, name) {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) return;
  
  const displayName = name || '您好';
  
  const welcomeContent = `
${displayName}，歡迎加入光耀星樞 SNT！

感謝您訂閱我們的電子報，您將定期收到：

━━━━━━━━━━━━━━━━━━━━━
📬 您將收到的內容
━━━━━━━━━━━━━━━━━━━━━
✅ AI 產業最新趨勢與應用案例
✅ 每月精選：SEO / GEO / 自動化行銷技巧
✅ 獨家優惠：早鳥方案、限時折扣
✅ 客戶成功故事：真實案例分享
✅ 免費資源：AI 導入評估工具、模板下載

━━━━━━━━━━━━━━━━━━━━━
🎁 立即好禮
━━━━━━━━━━━━━━━━━━━━━
作為新訂閱者，您專屬享有：

1. 免費 GEO 檢測（價值 NT$ 3,000）
   👉 https://xingdeng.tw/#geo-detector
   了解您的網站在 ChatGPT、Perplexity 等 AI 搜尋中的表現

2. 30 分鐘免費視訊諮詢
   👉 https://line.me/R/ti/p/@559julyu
   加 LINE 預約專屬顧問時間

3. AI 導入評估報告（PDF）
   👉 回覆此郵件索取

━━━━━━━━━━━━━━━━━━━━━
🔥 熱門文章推薦
━━━━━━━━━━━━━━━━━━━━━
1. 《2026 年 GEO 完全攻略：讓 ChatGPT 主動推薦你》
   👉 https://xingdeng.tw/blog/geo-guide

2. 《AI 客服實戰：如何減少 80% 人力成本》
   👉 https://xingdeng.tw/blog/ai-customer-service

3. 《從 0 到 1：企業 AI 自動化導入指南》
   👉 https://xingdeng.tw/blog/ai-automation-guide

━━━━━━━━━━━━━━━━━━━━━
💡 取消訂閱
━━━━━━━━━━━━━━━━━━━━━
如果您不想再收到我們的電子報，可以隨時取消：
👉 https://xingdeng.tw/unsubscribe?email=${encodeURIComponent(email)}

祝您 生意興隆！

光耀星樞 SNT 團隊
━━━━━━━━━━━━━━━━━━━━━
📧 service@xingdeng.tw
🌐 https://xingdeng.tw
💬 LINE: @559julyu
  `.trim();
  
  try {
    await fetch(`${RESEND_API}/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: 'SNT 光耀星樞 <service@xingdeng.tw>',
        to: [email],
        subject: '🎉 歡迎加入 SNT！立即領取您的專屬好禮',
        text: welcomeContent
      })
    });
    console.log('Welcome email sent to', email);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
}

// 主處理器
module.exports = async function handler(req, res) {
  // CORS 設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { email, name, source } = req.body;
    
    // 驗證 Email
    if (!email || !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: '請提供有效的 Email'
      });
    }
    
    // 訂閱
    const result = await subscribeToNewsletter(email, name, source);
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: '訂閱成功！請查收歡迎郵件'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
    
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return res.status(500).json({
      success: false,
      message: '訂閱失敗，請稍後再試'
    });
  }
};
