export function normalizeGithubUrl(value) {
  const input = String(value || '').trim();
  if (!input) return null;
  const message = 'Use a complete https://github.com/owner/repository link.';
  let url;
  try { url = new URL(input); } catch { throw new Error(message); }
  const parts = url.pathname.slice(1).split('/');
  if (input.length > 2048 || url.protocol !== 'https:' ||
      !['github.com', 'www.github.com'].includes(url.hostname) ||
      url.username || url.password || url.port || parts.length < 2 ||
      !parts.slice(0, 2).every(part => /^[A-Za-z0-9_.-]+$/.test(part))) {
    throw new Error(message);
  }
  url.hostname = 'github.com';
  if (url.href.length > 2048) throw new Error(message);
  return url.href;
}
