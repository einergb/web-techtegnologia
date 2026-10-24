const allowedHosts = (process.env.IMAGE_HOSTS || "img.codeconheiner.com").split(",").map((host) => host.trim().toLowerCase()).filter(Boolean);

export function allowedImageUrl(value?: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !allowedHosts.includes(url.hostname.toLowerCase())) return null;
    return value;
  } catch {
    return null;
  }
}
