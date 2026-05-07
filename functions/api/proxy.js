export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const img = url.searchParams.get('img');
  if (!img) return new Response('proxy ok', { status: 200 });
  if (!img.includes('res.cloudinary.com')) return new Response('not allowed', { status: 403 });
  try {
    const resp = await fetch(img, { headers: { 'Accept': 'image/*' } });
    const h = new Headers(resp.headers);
    h.set('access-control-allow-origin', '*');
    h.set('cache-control', 'public, max-age=86400');
    return new Response(resp.body, { status: resp.status, headers: h });
  } catch (e) {
    return new Response(e.message, { status: 502 });
  }
}
