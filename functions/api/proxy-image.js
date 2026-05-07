// Cloudflare Pages Function — GET /api/proxy-image?url=...
// Simple passthrough proxy for Cloudinary images

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const imageUrl = url.searchParams.get('url');

  if (!imageUrl) {
    return new Response('Missing url', { status: 400 });
  }

  // Only proxy Cloudinary images
  if (!imageUrl.includes('res.cloudinary.com') && !imageUrl.includes('cloudinary.com')) {
    return new Response('Not allowed', { status: 403 });
  }

  try {
    const resp = await fetch(imageUrl, {
      headers: { 'Accept': 'image/*' },
      cf: { cacheTtl: 86400, cacheEverything: true }
    });

    if (!resp.ok) {
      return new Response('Image not found', { status: resp.status });
    }

    const headers = new Headers(resp.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Cache-Control', 'public, max-age=86400');

    return new Response(resp.body, {
      status: resp.status,
      headers,
    });
  } catch (e) {
    return new Response('Proxy error', { status: 502 });
  }
}
