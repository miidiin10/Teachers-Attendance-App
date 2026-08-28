// Wraps fetch() with a cache-busting query param on top of `cache: "no-store"`.
// Belt and braces: no-store stops the browser from caching, and the unique
// URL on every call means even a CDN/edge layer that ignores our
// Cache-Control header has nothing matching to serve stale.
export function fetchFresh(url, options = {}) {
  const bustParam = `_=${Date.now()}`;
  const bustedUrl = url.includes("?") ? `${url}&${bustParam}` : `${url}?${bustParam}`;
  return fetch(bustedUrl, { ...options, cache: "no-store" });
}
