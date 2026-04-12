export function isInternalHref(href: string) {
  return href.startsWith("/") && !href.startsWith("//");
}

function isSafeExternalHttpHref(href: string) {
  try {
    const parsedUrl = new URL(href);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
}

export function isValidActionHref(href: string) {
  return isInternalHref(href) || isSafeExternalHttpHref(href);
}

export function isExternalHttpHref(href: string) {
  return isSafeExternalHttpHref(href);
}
