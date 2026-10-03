/**
 * SNT 光耀星樞 — LINE 對話機器人 Webhook
 * Vercel Serverless Function
 *
 * 環境變數（在 Vercel 控制台設定）：
 *   LINE_CHANNEL_ACCESS_TOKEN  — Messaging API Channel Access Token
 *   LINE_CHANNEL_SECRET        — Channel Secret（用於簽章驗證）
 */

const LINE_API = 'https://api.line.me/v2/bot';

// ─── 網站知識庫：機器人知道的一切 ───
const KNOWLEDGE = {
  services: {
    keywords: ['服務', '能做什麼', '做什麼', '項目', '業務', '幫忙', '提供', '功能'],
    reply: `我們提供 6 大服務：

🌐 架網站 — 響應式設計，手機電腦都好看
🤖 AI 客服 — 24 小時自動回覆，3 秒內回應
📈 SEO + GEO 霸榜 — Google + ChatGPT 都搜得到你
💳 線上收款 — 綠界、Stripe、信用卡、ATM 都能收
📱 廣告 + 社群代操 — IG、Threads 自動發文
🔧 網域 + 主機代管 — DNS、SSL、Vercel 部署全包

想了解哪個？直接問我就好 👍`
  },
  pricing: {
    keywords: ['價格', '費用', '多少錢', '方案', '收費', '報價', '預算', '定價', '月費'],
    reply: `我們有三個方案，透明公開：

💡 入門版 NT$ 9,800（+維護 1,500/月）
→ 1-3 頁網站 + AI 客服基礎版 + SEO + 5 天交付

⭐ 專業版 NT$ 28,000（+維護 3,000/月）最多人選
→ 多頁客製 + 2 組 AI Agent + 金流 + GEO/SEO

🚀 旗艦版 NT$ 58,000（+維運 8,000/月）
→ 完整 6 大 AI + 戰情室 + 全自動化 + 社群推播

所有方案含 5 天快速上線 + 專屬顧問。
想進一步了解哪個方案？`
  },
  aiCustomerService: {
    keywords: ['AI客服', '客服', '自動回覆', '回覆', '聊天機器人', '機器人', '24小時'],
    reply: `我們的 AI 客服可以：

✅ 24 小時自動回覆客戶問題
✅ 支援中、英、日三語
✅ 3 秒內回應，不漏單
✅ 可設定 FAQ、推薦方案、引導預約
✅ 串接 LINE、IG、網站

半夜客戶私訊也不用擔心，AI 幫你自動回 👍
想試用看看嗎？`
  },
  seo: {
    keywords: ['SEO', '搜尋', 'Google', '排名', 'GEO', 'ChatGPT', '霸榜', '曝光', '流量'],
    reply: `我們提供雙重搜尋優化：

🔍 SEO（傳統搜尋引擎優化）
→ 讓你在 Google 搜得到
→ 含技術 SEO + 內容優化 + 結構化資料

🤖 GEO（AI 搜尋引擎優化）
→ 讓 ChatGPT、Perplexity 主動推薦你
→ 2026 年最重要的流量來源

已有客戶反馈：GEO 上線後每月多 20+ 新客！
要免費幫你做 GEO 檢測嗎？`
  },
  payment: {
    keywords: ['收款', '付款', '金流', '刷卡', '信用卡', 'ATM', '綠界', 'Stripe', '對帳'],
    reply: `我們支援多種金流方式：

💳 信用卡（VISA / Master / JCB）
🏧 ATM 轉帳
🏪 超商代碼繳費
📱 行動支付

串接平台：綠界、Stripe、Payoneer
自動對帳，每筆款項清清楚楚，不用再手動核對 💪`
  },
  website: {
    keywords: ['架網站', '網站', '網頁', '官網', '設計', '建置', '套版', '客製'],
    reply: `架網站我們從頭包到尾：

📐 規劃 — 了解你的需求與目標
🎨 設計 — 響應式設計，手機電腦都好看
💻 開發 — 含 AI 客服、表單、金流
🚀 部署 — Vercel 全球加速，秒開
📈 優化 — SEO + GEO 完整設定

模板方案 3-5 天，客製化 7-10 天。
想看案例嗎？https://xingdeng.tw/exhibition.html`
  },
  socialMedia: {
    keywords: ['社群', 'IG', 'Instagram', 'Threads', 'FB', 'Facebook', '發文', '代操', '廣告'],
    reply: `社群代操服務：

📝 AI 自動寫文案
📅 自動排程發文
📊 廣告成效分析
🎯 Google / Meta 廣告代操

平台涵蓋 IG、Threads、Facebook。
AI 幫你寫文案、排程、下廣告，你只需要做生意 💼`
  },
  cases: {
    keywords: ['案例', '作品', '成果', '客戶', '好評', '推薦', '評價'],
    reply: `我們已服務 300+ 企業，幾位客戶的回饋：

⭐ 陳老闆（餐飲業）
「上線第一個月，線上訂位量增加 40%」

⭐ 林老師（命理業）
「GEO 上線後，ChatGPT 真的會推薦我！每月多 20+ 新客」

⭐ 王經理（房仲業）
「廣告歸因讓我 ROI 提升了 3 倍」

更多案例：https://xingdeng.tw/exhibition.html`
  },
  contact: {
    keywords: ['聯絡', '聯繫', '電話', '地址', 'email', '信箱', '怎麼找', '在哪'],
    reply: `聯絡方式：

📧 Email：service@xingdeng.tw
🌐 官網：www.xingdeng.tw
💬 LINE：你現在就在跟我們聊天！

通常 5 分鐘內回覆（AI 秒回，人工也很快）
有什麼想問的儘管說 😊`
  },
  faq: {
    keywords: ['FAQ', '常見', '問題', '多久', '上線', '合約', '試用', '免費'],
    reply: `常見問題一次看：

Q: 多久可以上線？
A: 模板 3-5 天，客製 7-10 天，全自动 10-15 天

Q: 不懂技術可以用嗎？
A: 完全可以！從設計到維運我們全包

Q: 有合約嗎？
A: 無長期合約，月繳可隨時停止

Q: 可以先試用嗎？
A: 提供免費 GEO 檢測 + LINE 顧問諮詢

還有其他問題嗎？`
  },
  industries: {
    keywords: ['產業', '行業', '適合', '餐飲', '命理', '醫美', '房仲', '零售', '教育'],
    reply: `我們服務各種產業：

🍽️ 餐飲業 — 線上訂位、AI 回覆
🔮 命理業 — 預約系統、SEO 霸榜
💉 醫美業 — 案例展示、客戶管理
🏠 房仲業 — 物件展示、廣告歸因
🛍️ 零售業 — 線上收款、庫存同步
📚 教育業 — 課程管理、學員追蹤

任何需要線上攬客的行業都適合！
你的產業是什麼？我幫你評估最適合的方案 💡`
  }
};

// 預設回覆
const DEFAULT_REPLIES = [
  '感謝你的訊息！你可以問我關於：\n\n🔹 服務項目\n🔹 方案價格\n🔹 AI 客服\n🔹 SEO / GEO 霸榜\n🔹 架網站\n🔹 客戶案例\n\n或直接說你的需求，我來幫你評估 😊',
  '你好！我是 SNT 光耀星樞的 AI 助手 🤖\n\n我可以幫你了解我們的服務、價格、或者回答任何關於 AI 雲端辦公室的問題。\n\n想先了解什麼呢？',
];

const GREETING_REPLIES = [
  '你好！歡迎來到光耀星樞 SNT 👋\n\n我是 AI 助手，可以幫你了解：\n🔹 我們的服務（架網站、AI 客服、SEO...）\n🔹 方案價格\n🔹 客戶案例\n\n直接問我就好，不用客氣！',
  '嗨！很高興收到你的訊息 😊\n\n你是想了解一下我們的服務，還是有具體的問題想問？\n\n我可以幫你快速媒合最適合的方案 💡',
];

// ─── 簽章驗證 ───
async function verifySignature(body, signature, secret) {
  if (!secret) return true; // 未設定 secret 則跳過驗證
  const crypto = await import('crypto');
  const hash = crypto.createHmac('sha256', secret).update(body).digest('base64');
  return hash === signature;
}

// ─── 意圖辨識 ───
function detectIntent(text) {
  const lower = text.toLowerCase().trim();

  // 打招呼
  if (/^(你好|hi|hello|hey|嗨|哈囉|安安|早|午|晚)/.test(lower)) {
    return { type: 'greeting' };
  }

  // 謝謝
  if (/^(謝謝|感謝|thanks|thank you|3q|thx)/.test(lower)) {
    return { type: 'thanks' };
  }

  // 再見
  if (/^(再見|bye|goodbye|掰掰|晚安)/.test(lower)) {
    return { type: 'bye' };
  }

  // 比對知識庫
  let bestMatch = null;
  let bestScore = 0;

  for (const [category, data] of Object.entries(KNOWLEDGE)) {
    let score = 0;
    for (const keyword of data.keywords) {
      if (lower.includes(keyword.toLowerCase())) {
        score += keyword.length; // 越長的關鍵字匹配，分數越高
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = category;
    }
  }

  if (bestMatch && bestScore > 0) {
    return { type: 'knowledge', category: bestMatch };
  }

  // 價格相關（額外處理）
  if (/比較|差異|區別|哪個|推薦|適合/.test(lower)) {
    return { type: 'knowledge', category: 'pricing' };
  }

  return { type: 'unknown' };
}

// ─── 產生回覆 ───
function generateReply(text) {
  const intent = detectIntent(text);

  switch (intent.type) {
    case 'greeting':
      return GREETING_REPLIES[Math.floor(Math.random() * GREETING_REPLIES.length)];
    case 'thanks':
      return '不客氣！有任何問題隨時找我 💪\n祝你生意興隆 🎉';
    case 'bye':
      return '再見！有需要隨時回來找我們 👋\n祝你今天順利 😊';
    case 'knowledge':
      return KNOWLEDGE[intent.category].reply;
    default:
      return DEFAULT_REPLIES[Math.floor(Math.random() * DEFAULT_REPLIES.length)];
  }
}

// ─── 發送回覆到 LINE ───
async function replyToLine(replyToken, messages) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    console.error('LINE_CHANNEL_ACCESS_TOKEN not set');
    return;
  }

  const res = await fetch(`${LINE_API}/message/reply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: messages.map(text => ({
        type: 'text',
        text: text.substring(0, 2000) // LINE 單則訊息上限 2000 字
      }))
    })
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('LINE API error:', res.status, err);
  }
}

// ─── 發送 push 訊息（主動通知） ───
async function pushToLine(userId, messages) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return;

  const res = await fetch(`${LINE_API}/message/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      to: userId,
      messages: messages.map(text => ({
        type: 'text',
        text: text.substring(0, 2000)
      }))
    })
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('LINE push error:', res.status, err);
  }
}

// ─── Webhook 主處理器 ───
module.exports = async function handler(req, res) {
  // 健康檢查
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      service: 'SNT LINE Bot',
      version: '1.0',
      endpoints: {
        webhook: 'POST /api/line/webhook',
        health: 'GET /api/line/webhook'
      }
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 簽章驗證
  const signature = req.headers['x-line-signature'];
  const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

  if (process.env.LINE_CHANNEL_SECRET) {
    const valid = await verifySignature(body, signature, process.env.LINE_CHANNEL_SECRET);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }

  // 處理事件
  const events = req.body?.events || [];

  for (const event of events) {
    const replyToken = event.replyToken;
    const sourceType = event.source?.type;
    const userId = event.source?.userId;

    switch (event.type) {
      case 'message': {
        const text = event.message?.text || '';
        if (!text || !replyToken) break;

        console.log(`[${sourceType}] User: ${userId}, Message: ${text}`);

        const reply = generateReply(text);
        await replyToLine(replyToken, [reply]);
        break;
      }

      case 'follow': {
        // 使用者加入好友
        console.log(`[follow] New friend: ${userId}`);
        if (replyToken) {
          await replyToLine(replyToken, [
            '歡迎加入光耀星樞 SNT 官方帳號 🎉\n\n我是 AI 助手，可以幫你了解：\n🔹 服務項目與價格\n🔹 AI 客服、SEO、架網站\n🔹 客戶案例與成果\n\n直接打字問我就好！\n或輸入「服務」查看所有服務項目 💡'
          ]);
        }
        break;
      }

      case 'unfollow': {
        console.log(`[unfollow] User left: ${userId}`);
        break;
      }

      case 'join': {
        if (replyToken) {
          await replyToLine(replyToken, [
            '大家好！我是 SNT 光耀星樞的 AI 助手 🤖\n有什麼可以幫你的嗎？'
          ]);
        }
        break;
      }

      case 'postback': {
        const data = event.postback?.data || '';
        console.log(`[postback] Data: ${data}`);
        // 可擴充：處理按鈕點擊等 postback 事件
        if (replyToken) {
          const reply = generateReply(data);
          await replyToLine(replyToken, [reply]);
        }
        break;
      }
    }
  }

  return res.status(200).json({ status: 'ok' });
};

// 匯出供其他模組使用
module.exports.generateReply = generateReply;
module.exports.detectIntent = detectIntent;
module.exports.pushToLine = pushToLine;
