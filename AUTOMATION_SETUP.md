# SNT 光耀星樞 — 自動化行銷系統設定指南

## 🚀 快速開始

本指南將協助您完成 SNT 網站的自動化行銷系統設定。

---

## 📋 環境變數設定

在 Vercel 控制台 → 專案設定 → 環境變數，新增以下變數：

### 必要環境變數

```bash
# Email 服務（Resend）
RESEND_API_KEY=re_xxxxxxxxxxxxx          # 從 resend.com 取得
ADMIN_EMAIL=service@xingdeng.tw          # 接收表單通知的 Email

# LINE Bot
LINE_CHANNEL_ACCESS_TOKEN=xxxxxxxxx      # 從 LINE Developers Console 取得
LINE_CHANNEL_SECRET=xxxxxxxxx            # 用於簽章驗證
LINE_ADMIN_GROUP_ID=xxxxxxxxx            # 管理者群組 ID（用於接收通知）

# Google Analytics（可選）
# 在 HTML 中替換 G-XXXXXXXXXX 為您的 GA4 Measurement ID
```

### 選配環境變數

```bash
# 電子報系統（Resend Audience）
RESEND_AUDIENCE_ID=xxxxxxxxx             # 從 Resend 取得

# Google Sheets（用於儲存表單資料）
GOOGLE_SHEETS_ID=xxxxxxxxx
GOOGLE_SHEETS_API_KEY=xxxxxxxxx
```

---

## 🔧 設定步驟

### 1. Resend Email 服務

1. 前往 [resend.com](https://resend.com) 註冊
2. 驗證您的網域 `xingdeng.tw`
3. 取得 API Key
4. 建立 Audience（訂閱者名單）
5. 將 API Key 和 Audience ID 加入 Vercel 環境變數

### 2. LINE Bot 設定

1. 前往 [LINE Developers Console](https://developers.line.biz)
2. 建立 Messaging API Channel
3. 取得 Channel Access Token（長期授權）
4. 取得 Channel Secret
5. 設定 Webhook URL: `https://xingdeng.tw/api/line/webhook`
6. 開啟「使用 Webhook」開關
7. 將 Token 和 Secret 加入 Vercel 環境變數

### 3. Google Analytics 4

1. 前往 [Google Analytics](https://analytics.google.com)
2. 建立 GA4 資源
3. 取得 Measurement ID（格式：`G-XXXXXXXXXX`）
4. 在所有 HTML 檔案中替換 `G-XXXXXXXXXX` 為您的 ID

### 4. Google Sheets（選配）

1. 建立新的 Google Sheet
2. 從 URL 取得 Sheet ID（格式：`https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`）
3. 啟用 Google Sheets API
4. 建立 API Key
5. 將 ID 和 Key 加入 Vercel 環境變數

---

## 📊 自動化流程

### 表單提交流程

```
用戶提交表單
    ↓
/api/contact 處理
    ↓
├─ 發送 Email 通知給管理者（Resend）
├─ 發送 LINE 通知給管理者群組
├─ 發送自動回覆 Email 給用戶
└─ 儲存到 Google Sheets（選配）
```

### 電子報訂閱流程

```
用戶訂閱電子報
    ↓
/api/newsletter 處理
    ↓
├─ 新增到 Resend Audience
└─ 發送歡迎郵件（含專屬好禮）
```

### LINE Bot 互動流程

```
用戶發送訊息
    ↓
/api/line/webhook 接收
    ↓
意圖辨識（知識庫匹配）
    ↓
自動回覆（服務/價格/案例/FAQ...）
```

---

## 🎯 行銷追蹤

### UTM 參數追蹤

在所有行銷連結中加入 UTM 參數：

```
https://xingdeng.tw/?utm_source=facebook&utm_medium=social&utm_campaign=launch
```

表單會自動捕捉 UTM 參數並記錄。

### Google Analytics 事件追蹤

表單提交會自動觸發 GA4 事件：

```javascript
gtag('event', 'form_submit', {
    event_category: 'contact',
    event_label: '全自動化方案'
});
```

---

## 📱 Chatbot 整合

網站已內建 Chat Widget，位於右下角。

### 自訂回覆

編輯 `contact.html` 中的 `sendChatMessage()` 函數，或串接您的 AI API（如 OpenAI、Gemini）。

### 與 LINE Bot 連動

可以將 Chat Widget 的訊息轉發到 LINE Bot，實現跨平台整合。

---

## 🔍 SEO 優化

### 已內建功能

- ✅ Structured Data (JSON-LD)
- ✅ Open Graph Tags
- ✅ Twitter Card
- ✅ Canonical URLs
- ✅ Sitemap.xml
- ✅ Robots.txt
- ✅ Clean URLs（無 .html 尾綴）

### 建議加強

1. 定期更新部落格內容
2. 建立內部連結結構
3. 優化圖片 alt 文字
4. 提交到 Google Search Console

---

## 📈 數據分析

### 關鍵指標追蹤

1. **轉換率**：表單提交 / 訪客數
2. **來源分析**：UTM 參數追蹤
3. **方案偏好**：哪些方案最受歡迎
4. **回應時間**：從提交到回覆的時間

### 建議工具

- Google Analytics 4（流量分析）
- Google Search Console（SEO 表現）
- Resend Dashboard（Email 開啟率）
- LINE Official Account Manager（LINE 互動數據）

---

## 🛠️ 疑難排解

### 表單提交失敗

1. 檢查 Vercel Logs：`vercel logs`
2. 確認環境變數已正確設定
3. 檢查 Resend API Key 是否有效
4. 確認網域已驗證

### LINE Bot 無回應

1. 檢查 Webhook URL 是否正確
2. 確認 Channel Access Token 未過期
3. 查看 LINE Developers Console 的 Webhook 測試結果
4. 檢查 Vercel Logs 中的錯誤訊息

### Email 未送達

1. 檢查 Resend Dashboard 的發送狀態
2. 確認收件人 Email 未進入垃圾郵件
3. 檢查網域 DNS 設定（SPF、DKIM、DMARC）

---

## 📞 技術支援

如有任何問題，請聯繫：

- 📧 Email: service@xingdeng.tw
- 💬 LINE: @559julyu
- 🌐 官網: https://xingdeng.tw

---

## 📝 更新日誌

### 2026-10-05
- ✅ 建立表單後端 API（/api/contact）
- ✅ 建立電子報訂閱 API（/api/newsletter）
- ✅ 整合 Resend Email 服務
- ✅ 整合 LINE Bot 通知
- ✅ 加入 Google Analytics 4
- ✅ 加入網站內 Chat Widget
- ✅ 優化 SEO structured data
- ✅ 建立自動化行銷流程

---

**光耀星樞 SNT — 讓 AI 幫你處理重複工作，讓團隊專注創造價值。**
