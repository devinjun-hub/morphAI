// Cloudflare Pages Function — proxy images through Cloudflare
// Improves accessibility in regions where Cloudinary is blocked
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const imageUrl = url.searchParams.get('url');

  if (!imageUrl) {
    return new Response('Missing url parameter', { status: 400 });
  }

  try {
    const response = await fetch(imageUrl);
    const headers = new Headers(response.headers);

    // Only keep essential headers
    const safeHeaders = new Headers();
    safeHeaders.set('Content-Type', headers.get('Content-Type') || 'image/jpeg');
    safeHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');
    safeHeaders.set('Access-Control-Allow-Origin', '*');

    return new Response(response.body, {
      status: response.status,
      headers: safeHeaders
    });
  } catch (e) {
    return new Response('Image proxy error: ' + e.message, { status: 502 });
  }
}
