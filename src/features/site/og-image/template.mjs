import {
  articleTitleSidePadding,
  calculateArticleTitleLayout,
} from "./layout.mjs";
import {
  ogImageFontFamily,
  ogImageHeight,
  ogImageWidth,
} from "./shared.mjs";

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function createSvgDocument(defsMarkup, contentMarkup) {
  return `<svg width="${ogImageWidth}" height="${ogImageHeight}" viewBox="0 0 ${ogImageWidth} ${ogImageHeight}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <mask id="frame-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="${ogImageWidth}" height="${ogImageHeight}">
      <rect width="${ogImageWidth}" height="${ogImageHeight}" fill="white" />
      <rect x="32" y="32" width="1136" height="566" rx="64" fill="black" />
    </mask>
    <radialGradient id="frame-gradient-primary" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(236 142) scale(812 652)">
      <stop offset="0" stop-color="#8BD8F4" />
      <stop offset="0.28" stop-color="#79D1F0" />
      <stop offset="0.58" stop-color="#67C9EB" />
      <stop offset="1" stop-color="#67C9EB" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="frame-gradient-secondary" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(960 456) scale(824 664)">
      <stop offset="0" stop-color="#7DD4F1" />
      <stop offset="0.28" stop-color="#69C9EA" />
      <stop offset="0.6" stop-color="#58BFE5" />
      <stop offset="1" stop-color="#58BFE5" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="frame-gradient-soft" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(704 196) scale(1036 836)">
      <stop offset="0" stop-color="#AEE4F8" stop-opacity="0.1" />
      <stop offset="0.34" stop-color="#90DAF3" stop-opacity="0.05" />
      <stop offset="1" stop-color="#90DAF3" stop-opacity="0" />
    </radialGradient>
    ${defsMarkup}
  </defs>

  <rect width="${ogImageWidth}" height="${ogImageHeight}" fill="#EEF8FF" />
  <g mask="url(#frame-mask)">
    <rect width="${ogImageWidth}" height="${ogImageHeight}" fill="#63C6EA" />
    <rect width="${ogImageWidth}" height="${ogImageHeight}" fill="url(#frame-gradient-primary)" />
    <rect width="${ogImageWidth}" height="${ogImageHeight}" fill="url(#frame-gradient-soft)" />
    <rect width="${ogImageWidth}" height="${ogImageHeight}" fill="url(#frame-gradient-secondary)" />
  </g>
  <rect x="48" y="48" width="1104" height="534" rx="48" fill="none" stroke="#79D4F8" stroke-opacity="0.9" stroke-width="4" />
  ${contentMarkup}
</svg>`;
}

export function createDefaultSocialImageSvg(avatarDataUri) {
  return createSvgDocument(
    `<clipPath id="default-avatar-clip">
      <circle cx="940" cy="315" r="102" />
    </clipPath>`,
    `<text
      x="760"
      y="340"
      text-anchor="end"
      fill="#12314D"
      font-family="${ogImageFontFamily}"
      font-size="94"
      font-weight="700"
    >
      mackysoft.net
    </text>

    <circle cx="940" cy="315" r="110" fill="#DCF3FF" stroke="#3FAFEE" stroke-opacity="0.28" stroke-width="2" />
    <image
      href="${avatarDataUri}"
      x="838"
      y="213"
      width="204"
      height="204"
      preserveAspectRatio="xMidYMid slice"
      clip-path="url(#default-avatar-clip)"
    />`,
  );
}

function createArticleTitleMarkup(title, locale) {
  const layout = calculateArticleTitleLayout(title, locale);
  const titleAreaTop = 92;
  const titleX = articleTitleSidePadding;
  const titleY = titleAreaTop + layout.fontSize;
  const lineMarkup = layout.lines
    .map((line, index) => {
      const dy = index === 0 ? 0 : layout.lineHeight;
      return `<tspan x="${titleX}" dy="${dy}">${escapeXml(line)}</tspan>`;
    })
    .join("");

  return `<text
    x="${titleX}"
    y="${titleY.toFixed(2)}"
    fill="#12314D"
    font-family="${ogImageFontFamily}"
    font-size="${layout.fontSize}"
    font-weight="700"
  >${lineMarkup}</text>`;
}

function createArticleBrandLockupMarkup(avatarDataUri) {
  return `<text
      x="980"
      y="524"
      text-anchor="end"
      fill="#12314D"
      font-family="${ogImageFontFamily}"
      font-size="42"
      font-weight="700"
    >
      mackysoft.net
    </text>
    <circle cx="1040" cy="508" r="40" fill="#DCF3FF" stroke="#3FAFEE" stroke-opacity="0.28" stroke-width="2" />
    <image
      href="${avatarDataUri}"
      x="1004"
      y="472"
      width="72"
      height="72"
      preserveAspectRatio="xMidYMid slice"
      clip-path="url(#brand-avatar-clip)"
    />`;
}

export function createArticleSocialImageSvg({ avatarDataUri, title, locale }) {
  return createSvgDocument(
    `<clipPath id="brand-avatar-clip">
      <circle cx="1040" cy="508" r="36" />
    </clipPath>`,
    `${createArticleTitleMarkup(title, locale)}
    ${createArticleBrandLockupMarkup(avatarDataUri)}`,
  );
}
