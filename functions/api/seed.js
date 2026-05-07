export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response(`
<!DOCTYPE html>
<html><body style="font-family:sans-serif;padding:40px">
<h2>数据迁移工具</h2>
<p>运行以下命令来迁移数据到 KV：</p>
<pre style="background:#f5f5f5;padding:16px;border-radius:8px">
curl -X POST https://27ac006b.morphai.pages.dev/api/seed \\
  -H "Content-Type: application/json" \\
  -d @data/site-data.json
</pre>
<p>或者打开终端，在项目目录执行：</p>
<pre style="background:#f5f5f5;padding:16px;border-radius:8px">
node -e "require('fs').readFile('data/site-data.json','utf8',(e,d)=>{fetch('https://27ac006b.morphai.pages.dev/api/seed',{method:'POST',headers:{'Content-Type':'application/json'},body:d}).then(r=>r.json()).then(console.log).catch(console.error)})"
</pre>
</body></html>`, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  if (!env.MORPHAI_KV) {
    return new Response(JSON.stringify({ ok: false, error: 'KV not bound' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const data = await request.json();
    await env.MORPHAI_KV.put('site_data', JSON.stringify(data));
    const count = (data.projects || []).length;
    return new Response(JSON.stringify({ ok: true, projects: count,
      message: `迁移成功！${count} 个项目` }),
      { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
