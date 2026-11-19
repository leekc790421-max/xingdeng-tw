/* 統一收單端點 —— 轉送到 tower.xingdeng.tw/api/leads（已實測寫入 Neon）
 *
 * 為什麼用轉送而不是各站自己接 DB：
 *   1. Neon 連線字串在 Vercel 是加密的，無法複製到其他專案。
 *   2. 名單分散在四個 DB 等於四份要對帳，出錯時沒人知道哪份是真的。
 *   3. 轉送只有一個寫入點，tower 的 /api/leads 已實測回 persisted:true。
 *
 * 失敗處理原則：
 *   上游掛掉時回 502 並附白話訊息，不回 200 假成功。
 *   前端看到非 200 會顯示「請直接加 LINE」，不會讓客人以為留到了。
 */

const UPSTREAM = process.env.LEADS_UPSTREAM || 'https://tower.xingdeng.tw/api/leads';
const SITE = process.env.SITE_KEY || 'xingdeng';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
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
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, endpoint: 'leads', site: SITE, accepts: 'POST', upstream: UPSTREAM });
  }
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: '只接受 POST' });

  let b;
  try { b = await readBody(req); }
  catch { return res.status(400).json({ ok: false, error: '資料格式不對，請重新整理後再送一次。' }); }

  const email = clip(b.email, 120);
  const name = clip(b.name, 80);
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ ok: false, field: 'email', error: 'Email 看起來不對，請確認有沒有打錯字。' });
  }
  if (name.length < 1) {
    return res.status(400).json({ ok: false, field: 'name', error: '請填一下怎麼稱呼你。' });
  }

  const payload = {
    kind: 'lead',
    name,
    email,
    phone: clip(b.phone, 40),
    company: clip(b.company, 120),
    role: clip(b.role, 60),
    topic: clip(b.topic, 120),
    message: clip(b.message, 2000),
    page: clip(b.page || req.headers.referer, 300),
    lang: clip(b.lang, 12) || 'zh-Hant',
    source: SITE,
    at: new Date().toISOString(),
  };

  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 9000);
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
      return res.status(502).json({
        ok: false,
        error: '我們這邊收件暫時卡住了，不是你的問題。請直接加 LINE，會有人馬上接手。',
        upstream_status: r.status,
      });
    }

    const ref = j.ref || j.id || ('L' + Date.now().toString(36).toUpperCase());
    return res.status(200).json({
      ok: true,
      ref,
      persisted: j.persisted !== false,
      backend: j.backend || 'upstream',
      note: '收到了。我們會在一個工作日內跟你聯絡。',
    });
  } catch (e) {
    return res.status(502).json({
      ok: false,
      error: '連線不穩，資料沒送出去。請直接加 LINE，或稍後再試一次。',
      detail: String(e && e.name || e).slice(0, 60),
    });
  } finally {
    clearTimeout(timer);
  }
};
