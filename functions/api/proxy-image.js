// Cloudflare Pages Function — GET /api/proxy-image?url=https://...
// Proxies images from Cloudinary (or other sources) through Cloudflare's cache
// for faster loading in China and other regions.

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const imageUrl = url.searchParams.get('url');

  if (!imageUrl) {
    return new Response('Missing url parameter', { status: 400 });
  }

  // Security: only allow known image domains
  const allowedHosts = [
    'res.cloudinary.com',
    'cloudinary.com',
  ];
  try {
    const parsed = new URL(imageUrl);
    if (!allowedHosts.some(h => parsed.hostname.endsWith(h))) {
      return new Response('Domain not allowed', { status: 403 });
    }
  } catch {
    return new Response('Invalid URL', { status: 400 });
  }

  // Try cache first
  const cacheKey = new Request(imageUrl, request);
  const cache = caches.default;
  let response = await cache.match(cacheKey);

  if (!response) {
    try {
      response = await fetch(imageUrl, {
        cf: {
          // Cache on Cloudflare edge for 30 days
          cacheTtl: 2592000,
          cacheEverything: true,
        }
      });

      if (!response.ok) {
        return new Response('Image fetch failed', { status: response.status });
      }

      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Vary', 'Accept-Encoding');

      response = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });

      // Store in cache asynchronously
      context.waitUntil(cache.put(cacheKey, response.clone()));
    } catch (e) {
      return new Response('Failed to fetch image: ' + e.message, { status: 502 });
    }
  }

  return response;
}
