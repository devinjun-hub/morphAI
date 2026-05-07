// Cloudflare Pages Function — POST /api/upload-image
// Uploads base64 image to Cloudinary
// Requires env vars: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    let body;
    try { body = await request.json(); } catch (_) {
      return new Response(JSON.stringify({ ok: false, error: '无效的请求体' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    const { data } = body || {};
    if (!data || typeof data !== 'string') {
      return new Response(JSON.stringify({ ok: false, error: '缺少图片数据' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    // Upload to Cloudinary
    const cloudName = env.CLOUDINARY_CLOUD_NAME;
    const apiKey = env.CLOUDINARY_API_KEY;
    const apiSecret = env.CLOUDINARY_API_SECRET;

    if (cloudName && apiKey && apiSecret) {
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', data);
      formData.append('upload_preset', 'ml_default');
      formData.append('folder', 'morphai_uploads');

      const resp = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formData }
      );
      const result = await resp.json();

      if (resp.ok && result.secure_url) {
        return new Response(JSON.stringify({ ok: true, path: result.secure_url }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // Fallback: return the base64 data directly (will be stored inline in KV data)
    return new Response(JSON.stringify({ ok: true, path: data }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}
