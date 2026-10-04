/**
 * SNT 光耀星樞 — 聯絡表單處理 API
 * Vercel Serverless Function
 *
 * 環境變數（在 Vercel 控制台設定）：
 *   RESEND_API_KEY           — Resend Email API Key
 *   LINE_CHANNEL_ACCESS_TOKEN — LINE Bot Token（用於通知）
 *   ADMIN_EMAIL              — 管理者 Email（接收表單通知）
 *   GOOGLE_SHEETS_ID         — Google Sheets ID（用於儲存表單資料）
 */

const RESEND_API = 'https://api.resend.com/emails';
const LINE_API = 'https://api.line.me/v2/bot';

// 驗證表單資料
function validateForm(data) {
  const errors = [];
  
  if (!data.name || data.name.trim().length < 2) {
    errors.push('姓名至少需要 2 個字元');
  }
  
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('請提供有效的 Email');
  }
  
  if (!data.message || data.message.trim().length < 10) {
    errors.push('需求描述至少需要 10 個字元');
  }
  
  return errors;
}

// 發送 Email 通知（使用 Resend）
async function sendEmailNotification(formData) {
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL || 'service@xingdeng.tw';
  
  if (!apiKey) {
    console.log('RESEND_API_KEY not set, skipping email notification');
    return;
  }
  
  const emailContent = `
新諮詢表單提交

━━━━━━━━━━━━━━━━━━━━━
📋 基本資料
━━━━━━━━━━━━━━━━━━━━━
姓名：${formData.name}
公司：${formData.company || '未填寫'}
Email：${formData.email}
電話/LINE：${formData.phone || '未填寫'}

━━━━━━━━━━━━━━━━━━━━━
💼 需求資訊
━━━━━━━━━━━━━━━━━━━━━
感興趣方案：${formData.plan || '未選擇'}
需求描述：
${formData.message}

━━━━━━━━━━━━━━━━━━━━━
📊 來源追蹤
━━━━━━━━━━━━━━━━━━━━━
來源頁面：${formData.source || '未知'}
提交時間：${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}
UTM 來源：${formData.utm_source || '無'}
UTM 媒介：${formData.utm_medium || '無'}
UTM 活動：${formData.utm_campaign || '無'}

━━━━━━━━━━━━━━━━━━━━━
🔗 快速操作
━━━━━━━━━━━━━━━━━━━━━
回覆 Email：mailto:${formData.email}
LINE 聯繫：https://line.me/R/ti/p/@559julyu
  `.trim();
  
  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: 'SNT 光耀星樞 <noreply@xingdeng.tw>',
        to: [adminEmail],
        subject: `[新諮詢] ${formData.name} — ${formData.plan || '未選擇方案'}`,
        text: emailContent,
        reply_to: formData.email
      })
    });
    
    if (!res.ok) {
      const err = await res.text();
      console.error('Resend API error:', err);
    } else {
      console.log('Email notification sent successfully');
    }
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

// 發送 LINE 通知
async function sendLineNotification(formData) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const adminGroupId = process.env.LINE_ADMIN_GROUP_ID; // 管理者群組 ID
  
  if (!token || !adminGroupId) {
    console.log('LINE notification not configured, skipping');
    return;
  }
  
  const message = `🔔 新諮詢表單提交

👤 ${formData.name}
🏢 ${formData.company || '未填寫'}
📧 ${formData.email}
📱 ${formData.phone || '未填寫'}

💼 方案：${formData.plan || '未選擇'}
📝 需求：${formData.message.substring(0, 100)}${formData.message.length > 100 ? '...' : ''}

⏰ ${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}`;
  
  try {
    await fetch(`${LINE_API}/message/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        to: adminGroupId,
        messages: [{
          type: 'text',
          text: message
        }]
      })
    });
    console.log('LINE notification sent successfully');
  } catch (error) {
    console.error('Failed to send LINE notification:', error);
  }
}

// 自動回覆 Email 給客戶
async function sendAutoReply(formData) {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) return;
  
  const replyContent = `
${formData.name} 您好，

感謝您聯繫光耀星樞 SNT！我們已收到您的諮詢，專屬顧問將於 24 小時內與您聯繫。

━━━━━━━━━━━━━━━━━━━━━
📋 您的諮詢內容
━━━━━━━━━━━━━━━━━━━━━
感興趣方案：${formData.plan || '未選擇'}
需求摘要：${formData.message.substring(0, 100)}...

━━━━━━━━━━━━━━━━━━━━━
🚀 在等待期間，您可以：
━━━━━━━━━━━━━━━━━━━━━
1. 加入 LINE 官方帳號 @559julyu，立即與 AI 顧問對話
   👉 https://line.me/R/ti/p/@559julyu

2. 瀏覽我們的服務介紹
   👉 https://xingdeng.tw/solutions

3. 查看 8K 科技藝廊，了解我們的技術實力
   👉 https://xingdeng.tw/lab

4. 免費進行 GEO 檢測，了解您的網站在 AI 搜尋中的表現
   👉 https://xingdeng.tw/#geo-detector

━━━━━━━━━━━━━━━━━━━━━
💡 常見問題
━━━━━━━━━━━━━━━━━━━━━
Q: 多久會收到回覆？
A: 通常 24 小時內，緊急案件可加 LINE 立即處理

Q: 可以先免費諮詢嗎？
A: 當然可以！我們提供免費 GEO 檢測 + 30 分鐘視訊諮詢

Q: 方案可以客製化嗎？
A: 完全可以，我們會根據您的需求提供最佳方案

如有任何問題，歡迎隨時聯繫我們。

祝 商祺

光耀星樞 SNT 團隊
━━━━━━━━━━━━━━━━━━━━━
📧 service@xingdeng.tw
🌐 https://xingdeng.tw
💬 LINE: @559julyu
  `.trim();
  
  try {
    await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: 'SNT 光耀星樞 <service@xingdeng.tw>',
        to: [formData.email],
        subject: '感謝您的諮詢 — 光耀星樞 SNT',
        text: replyContent
      })
    });
    console.log('Auto-reply sent to customer');
  } catch (error) {
    console.error('Failed to send auto-reply:', error);
  }
}

// 儲存到 Google Sheets（可選）
async function saveToGoogleSheets(formData) {
  const sheetId = process.env.GOOGLE_SHEETS_ID;
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  
  if (!sheetId || !apiKey) {
    console.log('Google Sheets not configured, skipping');
    return;
  }
  
  // 這裡需要實作 Google Sheets API 整合
  // 為簡化，暫時跳過
  console.log('Google Sheets integration placeholder');
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
    const formData = req.body;
    
    // 驗證表單
    const errors = validateForm(formData);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors: errors
      });
    }
    
    // 並行執行所有通知
    await Promise.all([
      sendEmailNotification(formData),
      sendLineNotification(formData),
      sendAutoReply(formData),
      saveToGoogleSheets(formData)
    ]);
    
    // 記錄到 console（可在 Vercel Logs 查看）
    console.log('Form submission:', {
      name: formData.name,
      email: formData.email,
      plan: formData.plan,
      timestamp: new Date().toISOString()
    });
    
    return res.status(200).json({
      success: true,
      message: '表單提交成功，我們將盡快與您聯繫',
      data: {
        name: formData.name,
        email: formData.email
      }
    });
    
  } catch (error) {
    console.error('Form submission error:', error);
    return res.status(500).json({
      success: false,
      error: '表單提交失敗，請稍後再試',
      message: error.message
    });
  }
};
