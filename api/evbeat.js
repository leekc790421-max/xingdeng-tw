/* 辦公室站・時鐘心跳（Vercel cron 每小時 :23 UTC 觸發 GET）
   職責：向集團事件匯流排 corps?bot=ev 上報存活＋回讀熱開關 flags（維護遮欄下傳）。
   零金鑰、冪等、5 秒軟超時；失敗不阻塞回應（cron 端只認 2xx）。 */
module.exports = async (req, res) => {
  const hub = 'https://tower.xingdeng.tw/api/corps';
  const beat = {
    product: 'xingdeng-main',
    release: 'office-static-v1',
    events: [{ ty: 'beat', path: '/api/evbeat', ms: 0, msg: 'office cron heartbeat ' + new Date().toISOString() }],
  };
  let ack = null, flags = null;
  try {
    const p = fetch(hub + '?bot=ev', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(beat),
      signal: AbortSignal.timeout(5000),
    }).then(r => r.json()).catch(() => null);
    const f = fetch(hub + '?bot=flags', {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    }).then(r => r.json()).catch(() => null);
    const out = await Promise.all([p, f]);
    ack = out[0]; flags = out[1];
  } catch (e) { /* cron 端容忍 */ }
  res.setHeader('cache-control', 'no-store');
  res.status(200).json({
    ok: true, bot: 'office-evbeat-v1', at: new Date().toISOString(),
    hub_ack: ack && ack.accepted != null ? ack.accepted : 'offline',
    flags: !!(flags && flags.ok),
  });
};
