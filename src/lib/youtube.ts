const supportedYouTubeHosts = new Set(["youtu.be", "youtube.com", "www.youtube.com", "m.youtube.com"]);

export function getYouTubeVideoId(url: string) {
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

export function isSupportedYouTubeUrl(url: string) {
  return getYouTubeVideoId(url) !== null;
}

export function getYouTubeEmbedUrl(url: string) {
  const videoId = getYouTubeVideoId(url);
  return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
}
