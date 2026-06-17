// Utility to extract a product's preview image from its purchase link.
//
// Most retailers (IKEA, Amazon, etc.) expose an Open Graph image (og:image)
// on their product pages. We resolve it live, client-side, through a
// CORS-friendly metadata service so the browser can read it without a
// dedicated backend. Nothing is persisted — images are always fetched fresh
// from the link. A short-lived in-memory map only de-duplicates requests
// within the current session so the same link isn't fetched twice at once.
//
// Some sites (e.g. Wayfair) block scrapers and expose no usable og:image. For
// those we fall back to a rendered screenshot of the product page, which the
// metadata service hosts on its own CDN (so it isn't hotlink-protected).

const METADATA_ENDPOINT = 'https://api.microlink.io';

// Per-session memo of resolved links -> image URL (or null). Cleared on reload.
const sessionMemo = new Map();
// In-flight requests so concurrent cards sharing a link fetch only once.
const inFlight = new Map();

export function isValidLink(link) {
  if (!link) return false;
  try {
    const url = new URL(link);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Wrap an image URL in a public image proxy. Many retailer CDNs hotlink-protect
// their images (they reject cross-origin <img> requests with a 403 based on the
// Referer/Origin). The proxy fetches the image server-side — without our site's
// referrer — and re-serves it with open CORS, which recovers those images.
export function proxiedImageUrl(url) {
  if (!url) return url;
  const stripped = url.replace(/^https?:\/\//, '');
  return `https://images.weserv.nl/?url=${encodeURIComponent(stripped)}`;
}

// Single metadata request. When `screenshot` is true, asks the service to
// render the page and returns the screenshot URL (hosted on its own CDN).
async function requestImage(link, screenshot) {
  const params = new URLSearchParams({ url: link });
  if (screenshot) params.set('screenshot', 'true');

  const res = await fetch(`${METADATA_ENDPOINT}/?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Metadata request failed (${res.status})`);

  const payload = await res.json();
  const data = payload && payload.data ? payload.data : {};

  if (screenshot) {
    return (data.screenshot && data.screenshot.url) || (data.image && data.image.url) || null;
  }
  return (data.image && data.image.url) || (data.logo && data.logo.url) || null;
}

// Returns the already-resolved image URL for a link this session, or undefined
// if it hasn't been fetched yet. A value of `null` means "looked, found none".
export function getResolvedImage(link) {
  if (!link) return undefined;
  return sessionMemo.has(link) ? sessionMemo.get(link) : undefined;
}

// Resolve the product image for a link. Returns the image URL string, or null
// if none could be found. Never throws.
export async function fetchProductImage(link) {
  if (!isValidLink(link)) return null;

  if (sessionMemo.has(link)) return sessionMemo.get(link);
  if (inFlight.has(link)) return inFlight.get(link);

  const request = (async () => {
    try {
      // 1. Fast path: read the page's Open Graph / logo image.
      let image = await requestImage(link, false);

      // 2. Fall back to a rendered screenshot for pages that expose no usable
      //    image (e.g. scraper-blocked retailers like Wayfair).
      if (!image) {
        image = await requestImage(link, true);
      }

      sessionMemo.set(link, image);
      return image;
    } catch (err) {
      console.warn('Could not extract product image for', link, err);
      return null;
    } finally {
      inFlight.delete(link);
    }
  })();

  inFlight.set(link, request);
  return request;
}
