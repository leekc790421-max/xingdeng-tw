/**
 * LINE Rich Menu 設定腳本
 * 執行方式：在 Vercel 上以 API route 觸發，或本地 node 執行
 *
 * 環境變數：
 *   LINE_CHANNEL_ACCESS_TOKEN — Messaging API Channel Access Token
 */

const LINE_API = 'https://api.line.me/v2/bot';
const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

const SITE = 'https://xingdeng.tw';

// Rich Menu 結構
const richMenu = {
  size: { width: 2500, height: 1686 },
  selected: true,
  name: 'SNT 主選單',
  areas: [
    // 左上：服務項目
    {
      bounds: { x: 0, y: 0, width: 833, height: 843 },
      action: { type: 'postback', data: '服務', label: '服務項目' }
    },
    // 中上：方案價格
    {
      bounds: { x: 833, y: 0, width: 834, height: 843 },
      action: { type: 'postback', data: '價格', label: '方案價格' }
    },
    // 右上：客戶案例
    {
      bounds: { x: 1667, y: 0, width: 833, height: 843 },
      action: { type: 'postback', data: '案例', label: '客戶案例' }
    },
    // 左下：免費健診
    {
      bounds: { x: 0, y: 843, width: 833, height: 843 },
      action: { type: 'uri', label: '免費健診', uri: `${SITE}/ai-checkup.html` }
    },
    // 中下：常見問題
    {
      bounds: { x: 833, y: 843, width: 834, height: 843 },
      action: { type: 'postback', data: 'FAQ', label: '常見問題' }
    },
    // 右下：預約諮詢
    {
      bounds: { x: 1667, y: 843, width: 833, height: 843 },
      action: { type: 'uri', label: '預約諮詢', uri: `${SITE}/booking.html` }
    }
  ]
};

async function setupRichMenu() {
  if (!TOKEN) {
    console.error('ERROR: LINE_CHANNEL_ACCESS_TOKEN not set');
    process.exit(1);
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TOKEN}`
  };

  // 1. 建立 Rich Menu
  console.log('1. 建立 Rich Menu...');
  const createRes = await fetch(`${LINE_API}/richmenu`, {
    method: 'POST',
    headers,
    body: JSON.stringify(richMenu)
  });
  const createData = await createRes.json();
  console.log('   Rich Menu ID:', createData.richMenuId);

  if (!createData.richMenuId) {
    console.error('   建立失敗:', JSON.stringify(createData));
    return;
  }

  // 2. 設定為預設 Rich Menu
  console.log('2. 設定為預設 Rich Menu...');
  const defaultRes = await fetch(`${LINE_API}/user/all/richmenu/${createData.richMenuId}`, {
    method: 'POST',
    headers
  });
  console.log('   狀態:', defaultRes.status);

  // 3. 上傳 Rich Menu 圖片（使用 SVG 轉 PNG 或預設圖片）
  console.log('3. 請手動上傳 Rich Menu 圖片至 LINE 後台');
  console.log(`   或使用 API: POST ${LINE_API}/richmenu/${createData.richMenuId}/content`);
  console.log('   圖片尺寸: 2500 x 1686 px');

  console.log('\n✅ Rich Menu 設定完成！');
  console.log(`   Menu ID: ${createData.richMenuId}`);
  console.log('   請至 LINE Official Account Manager 上傳對應的選單圖片');
}

// 列出目前所有 Rich Menu
async function listRichMenus() {
  const res = await fetch(`${LINE_API}/richmenu`, {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });
  const data = await res.json();
  console.log('目前 Rich Menu 列表:');
  console.log(JSON.stringify(data, null, 2));
}

// 刪除所有 Rich Menu
async function clearAllRichMenus() {
  const listRes = await fetch(`${LINE_API}/richmenu`, {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });
  const data = await listRes.json();

  for (const menu of (data.menus || [])) {
    console.log(`刪除: ${menu.richMenuId}`);
    await fetch(`${LINE_API}/richmenu/${menu.richMenuId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
  }
  console.log('✅ 已清除所有 Rich Menu');
}

// 主程式
const action = process.argv[2] || 'setup';
switch (action) {
  case 'setup': setupRichMenu(); break;
  case 'list': listRichMenus(); break;
  case 'clear': clearAllRichMenus(); break;
  default:
    console.log('用法: node line-richmenu.js [setup|list|clear]');
}
