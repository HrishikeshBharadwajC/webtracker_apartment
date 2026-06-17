// Utility to extract a product's preview image from its purchase link.
//
// Most retailers (IKEA, Amazon, etc.) expose an Open Graph image (og:image)
// on their product pages. We resolve it live, client-side, through a
// CORS-friendly metadata service so the browser can read it without a
// dedicated backend. Nothing is persisted — images are always fetched fresh
// from the link. A short-lived in-memory map only de-duplicates requests
// within the current session so the same link isn't fetched twice at once.

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
      const endpoint = `${METADATA_ENDPOINT}/?url=${encodeURIComponent(link)}`;
      const res = await fetch(endpoint, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`Metadata request failed (${res.status})`);

      const payload = await res.json();
      const data = payload && payload.data ? payload.data : {};
      const image =
        (data.image && data.image.url) ||
        (data.logo && data.logo.url) ||
        null;

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
