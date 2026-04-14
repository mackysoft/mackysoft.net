import { ogImageWidth } from "./shared.mjs";

export const articleTitleFontSize = 56;
export const articleTitleCondensedFontSize = 48;
export const articleTitleMinFontSize = 40;
export const articleTitleLineHeight = 1.48;
export const articleTitleCompactMaxLines = 3;
export const articleTitleMaxLines = 4;
export const articleTitleSidePadding = 84;
export const articleTitleMaxWidth = ogImageWidth - articleTitleSidePadding * 2;

function isWideCharacter(character) {
  return /[\u1100-\u11ff\u2e80-\u9fff\uac00-\ud7af\u3040-\u30ff\u3400-\u4dbf\uf900-\ufaff\uff01-\uff60\uffe0-\uffee]/u.test(
    character,
  );
}

function estimateCharacterWidth(character) {
  if (character === " ") {
    return 0.34;
  }

  if (character === "\t") {
    return 0.68;
  }

  if (isWideCharacter(character)) {
    return 1;
  }

  if (/[A-Z]/.test(character)) {
    return 0.69;
  }

  if (/[a-z]/.test(character)) {
    return 0.56;
  }

  if (/[0-9]/.test(character)) {
    return 0.58;
  }

  if (/[()[\]{}]/.test(character)) {
    return 0.4;
  }

  if (/[.,:;'"`]/.test(character)) {
    return 0.28;
  }

  if (/[!?]/.test(character)) {
    return 0.36;
  }

  if (/[+\-_=/*\\|]/.test(character)) {
    return 0.42;
  }

  return 0.62;
}

export function estimateTextWidth(text, fontSize) {
  return Array.from(text).reduce((total, character) => total + estimateCharacterWidth(character) * fontSize, 0);
}

function splitTitleTokens(title, locale) {
  if (locale === "en") {
    return title.split(/(\s+)/).filter((token) => token.length > 0);
  }

  return title.match(/[A-Za-z0-9][A-Za-z0-9+#./_-]*(?:\s+[A-Za-z0-9][A-Za-z0-9+#./_-]*)*|\s+|./gu) ?? [];
}

function wrapLongToken(token, fontSize, maxWidth) {
  const segments = [];
  let current = "";

  for (const character of Array.from(token)) {
    const next = `${current}${character}`;

    if (current && estimateTextWidth(next, fontSize) > maxWidth) {
      segments.push(current);
      current = character;
      continue;
    }

    current = next;
  }

  if (current) {
    segments.push(current);
  }

  return segments;
}

function wrapTitleLines(title, locale, fontSize, maxWidth) {
  const rawTokens = splitTitleTokens(title, locale);
  const tokens = rawTokens.flatMap((token) => {
    if (!token.trim()) {
      return [token];
    }

    if (estimateTextWidth(token, fontSize) <= maxWidth) {
      return [token];
    }

    return wrapLongToken(token, fontSize, maxWidth);
  });
  const lines = [];
  let currentLine = "";

  for (const token of tokens) {
    if (!token.trim()) {
      if (currentLine && estimateTextWidth(`${currentLine}${token}`, fontSize) <= maxWidth) {
        currentLine += token;
      }

      continue;
    }

    const candidate = `${currentLine}${token}`;

    if (!currentLine || estimateTextWidth(candidate, fontSize) <= maxWidth) {
      currentLine = candidate;
      continue;
    }

    lines.push(currentLine.trimEnd());
    currentLine = token.trimStart();
  }

  if (currentLine) {
    lines.push(currentLine.trimEnd());
  }

  return lines;
}

export function calculateArticleTitleLayout(
  title,
  locale,
  {
    compactMaxLines = articleTitleCompactMaxLines,
    maxWidth = articleTitleMaxWidth,
    maxLines = articleTitleMaxLines,
    lineHeight = articleTitleLineHeight,
  } = {},
) {
  const createLayout = (fontSize, lines) => {
    const lineWidths = lines.map((line) => estimateTextWidth(line, fontSize));

    return {
      lines,
      lineWidths,
      maxLineWidth: Math.max(...lineWidths, 0),
      fontSize,
      lineHeight: Number((fontSize * lineHeight).toFixed(2)),
      maxWidth,
      maxLines,
    };
  };

  const defaultLines = wrapTitleLines(title, locale, articleTitleFontSize, maxWidth);

  if (defaultLines.length <= compactMaxLines) {
    return createLayout(articleTitleFontSize, defaultLines);
  }

  for (let fontSize = articleTitleCondensedFontSize; fontSize >= articleTitleMinFontSize; fontSize -= 2) {
    const lines = wrapTitleLines(title, locale, fontSize, maxWidth);

    if (lines.length <= maxLines) {
      return createLayout(fontSize, lines);
    }
  }

  throw new Error(
    `Unable to fit article title within ${maxLines} lines between ${articleTitleCondensedFontSize}px and ${articleTitleMinFontSize}px: ${title}`,
  );
}
