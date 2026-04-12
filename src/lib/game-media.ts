const supportedYouTubeHosts = new Set(["youtu.be", "youtube.com", "www.youtube.com", "m.youtube.com"]);

export function isInternalGameActionHref(href: string) {
  return href.startsWith("/") && !href.startsWith("//");
}

function isSafeExternalGameActionHref(href: string) {
  try {
    const parsedUrl = new URL(href);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
}

export function isValidGameActionHref(href: string) {
  return isInternalGameActionHref(href) || isSafeExternalGameActionHref(href);
}

export function isExternalGameActionHref(href: string) {
  return isSafeExternalGameActionHref(href);
}

export function getGameTrailerVideoId(url: string) {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    return null;
  }

  if (!supportedYouTubeHosts.has(parsedUrl.hostname)) {
    return null;
  }

  if (parsedUrl.hostname === "youtu.be") {
    const videoId = parsedUrl.pathname.split("/").filter(Boolean)[0];
    return videoId || null;
  }

  if (parsedUrl.pathname === "/watch") {
    return parsedUrl.searchParams.get("v");
  }

  if (parsedUrl.pathname.startsWith("/embed/")) {
    const videoId = parsedUrl.pathname.split("/")[2];
    return videoId || null;
  }

  return null;
}

export function isSupportedGameTrailerUrl(url: string) {
  return getGameTrailerVideoId(url) !== null;
}

export function getGameTrailerEmbedUrl(url: string) {
  const videoId = getGameTrailerVideoId(url);
  return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
}
