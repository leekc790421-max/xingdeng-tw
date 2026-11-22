/* 匿名流量事件端點 —— 轉送到 tower.xingdeng.tw/api/track
 *
 * 為什麼用轉送而不是各站自己接 DB（與 api/leads.js 同一套理由）：
 *   1. Neon 連線字串在 Vercel 是加密的，無法複製到其他專案。
 *   2. 事件分散在四個 DB 等於四份要對帳，出錯時沒人知道哪份是真的。
 *   3. 轉送只有一個寫入點，tower 的 growth_event 表已存在。
 *
 * 失敗處理原則：
 *   事件上報失敗不影響使用者體驗，一律回 200 並標 degraded，
 *   但絕不回「已記錄」假成功——前端可據 ok 判斷是否重送。
 */

const UPSTREAM = process.env.TRACK_UPSTREAM || 'https://tower.xingdeng.tw/api/track';
const SITE = process.env.SITE_KEY || 'xingdeng';

const clip = (v, n) => String(v == null ? '' : v).trim().slice(0, n);

async function readBody(req) {
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length) return req.body;
  const chunks = [];
  await new Promise((r) => { req.on('data', (x) => chunks.push(x)); req.on('end', r); });
  const raw = Buffer.concat(chunks).toString('utf8') || '{}';
  return JSON.parse(raw);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, endpoint: 'track', site: SITE, accepts: 'POST', upstream: UPSTREAM });
  }
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: '只接受 POST' });

  let b;
  try { b = await readBody(req); }
  catch { return res.status(400).json({ ok: false, error: '資料格式不對' }); }

  // 只轉送白名單欄位，避免任意內容被寫進事件表
  const payload = {
    site: SITE,
    event: clip(b.event, 40) || 'unknown',
    path: clip(b.path, 200),
    vid: clip(b.vid, 40),
    dwell: Number(b.dwell) || 0,
    title: clip(b.title, 120),
    ref: clip(b.ref, 300),
    utm_source: clip(b.utm_source, 60),
    utm_medium: clip(b.utm_medium, 60),
    utm_campaign: clip(b.utm_campaign, 80),
    utm_content: clip(b.utm_content, 80),
    landing: clip(b.landing, 200),
    target: clip(b.target, 200),
  };

  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 6000);
  try {
    const r = await fetch(UPSTREAM, {
      method: 'POST',
      signal: ctl.signal,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const txt = await r.text();
    let j = {};
    try { j = JSON.parse(txt); } catch { /* 上游回非 JSON */ }
    if (!r.ok) {
      return res.status(200).json({ ok: false, degraded: true, upstream_status: r.status });
    }
    return res.status(200).json({ ok: true, backend: j.backend || 'upstream' });
  } catch (e) {
    return res.status(200).json({ ok: false, degraded: true, detail: String((e && e.name) || e).slice(0, 60) });
  } finally {
    clearTimeout(timer);
  }
};
