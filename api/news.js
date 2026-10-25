/* 集團公告中樁・CHANGELOG API（重建版 v1）
   職責：全站 AI／機器人取得「最新產品與系統變更」的端點（先讀簡報機制的一部分）。
   機密防呆：僅輸出已公開條目（public:true 或未標記）；資料源 = data/news.json。
   GET /api/news → {ok,kind:'changelog',count,latest,items[]}；?limit=&tag= 過濾。 */
const news = require('../data/news.json');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('cache-control', 'public, max-age=60');
  const u = new URL(req.url, 'http://x');
  const limit = Math.min(+(u.searchParams.get('limit') || 20), 100);
  const tag = (u.searchParams.get('tag') || '').toLowerCase();
  const items = (news.items || [])
    .filter(i => i.public !== false)
    .filter(i => !tag || (i.tags || []).join(',').toLowerCase().includes(tag))
    .slice(0, limit);
  res.status(200).json({
    ok: true,
    kind: 'changelog',
    product: 'xingdeng-main',
    source: 'data/news.json',
    version: news.version,
    updated: news.updated,
    count: items.length,
    total: (news.items || []).length,
    latest: (news.items || [])[0] || null,
    items,
    note: '各機器人與站內AI請读本檔與 fleet-brief 取得最新範圍；價格以報價單為準。',
  });
};
