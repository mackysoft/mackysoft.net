import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import * as cheerio from "cheerio";
import TurndownService from "turndown";
import turndownPluginGfm from "turndown-plugin-gfm";

const { gfm } = turndownPluginGfm;

const SITE_URL = "https://mackysoft.net";
const SITE_ORIGIN = new URL(SITE_URL).origin;
const JST_OFFSET = "+09:00";

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const articlesRoot = path.join(repoRoot, "src/content/articles");
const migrationRoot = path.join(repoRoot, "docs/migration");

const articlePageRedirects = new Map([
  ["/", "/"],
  ["/about/", "/about/"],
  ["/assets/", "/assets/"],
  ["/games/", "/games/"],
  ["/blog/", "/articles/"],
  ["/treasure-rogue/", "/games/treasure-rogue/"],
  ["/treasure-rogue/privacy-policy/", "/privacy-policy/"],
]);

async function main() {
  const [posts, pages, categories, tags] = await Promise.all([
    fetchAll("/wp-json/wp/v2/posts?_embed=wp:featuredmedia"),
    fetchAll("/wp-json/wp/v2/pages?_embed=wp:featuredmedia"),
    fetchAll("/wp-json/wp/v2/categories"),
    fetchAll("/wp-json/wp/v2/tags"),
  ]);

  const categoriesById = new Map(categories.map((term) => [term.id, term]));
  const tagsById = new Map(tags.map((term) => [term.id, term]));

  await rm(articlesRoot, { recursive: true, force: true });
  await rm(migrationRoot, { recursive: true, force: true });
  await mkdir(articlesRoot, { recursive: true });
  await mkdir(migrationRoot, { recursive: true });

  const urlMapRows = buildUrlMapRows({ posts, pages, categories, tags });
  const redirectMap = new Map(urlMapRows.map((row) => [row.legacy_path, row.new_path]));

  const mediaAuditMap = new Map();
  collectMediaAuditFromEntries(posts, "post", mediaAuditMap);
  collectMediaAuditFromEntries(pages, "page", mediaAuditMap);

  for (const post of posts) {
    await importPost({
      post,
      categoriesById,
      tagsById,
      redirectMap,
    });
  }

  await writeFile(
    path.join(migrationRoot, "url-map.csv"),
    toCsv(
      ["legacy_path", "new_path", "content_type", "redirect_kind", "status"],
      urlMapRows,
    ),
    "utf8",
  );

  await writeFile(
    path.join(migrationRoot, "taxonomy-map.yaml"),
    toTaxonomyYaml({ categories, tags }),
    "utf8",
  );

  await writeFile(
    path.join(migrationRoot, "media-audit.csv"),
    toCsv(
      ["legacy_url", "filename", "referenced_from", "source_types", "status", "notes"],
      Array.from(mediaAuditMap.values())
        .sort((left, right) => left.legacy_url.localeCompare(right.legacy_url, "ja"))
        .map((entry) => ({
          legacy_url: entry.legacy_url,
          filename: entry.filename,
          referenced_from: Array.from(entry.referenced_from).sort((left, right) => left.localeCompare(right, "ja")).join("|"),
          source_types: Array.from(entry.source_types).sort((left, right) => left.localeCompare(right, "ja")).join("|"),
          status: "referenced",
          notes: "",
        })),
    ),
    "utf8",
  );

  console.log(`Imported ${posts.length} articles, ${categories.length} categories, ${tags.length} tags.`);
}

async function fetchAll(initialPath) {
  const collected = [];
  let page = 1;

  while (true) {
    const connector = initialPath.includes("?") ? "&" : "?";
    const endpoint = `${initialPath}${connector}per_page=100&page=${page}`;
    const response = await fetch(`${SITE_URL}${endpoint}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch ${endpoint}: ${response.status} ${response.statusText}`);
    }

    const items = await response.json();
    collected.push(...items);

    const totalPages = Number(response.headers.get("x-wp-totalpages") ?? "1");
    if (page >= totalPages) {
      break;
    }

    page += 1;
  }

  return collected;
}

function buildUrlMapRows({ posts, pages, categories, tags }) {
  const rows = [];

  for (const post of posts) {
    rows.push({
      legacy_path: normalizeSitePath(post.link),
      new_path: `/articles/${post.slug}/`,
      content_type: "article",
      redirect_kind: "exact",
      status: "mapped",
    });
  }

  for (const page of pages) {
    const legacyPath = normalizeSitePath(page.link);
    if (legacyPath === "/") {
      continue;
    }
    const newPath = articlePageRedirects.get(legacyPath);
    if (!newPath) {
      continue;
    }

    rows.push({
      legacy_path: legacyPath,
      new_path: newPath,
      content_type: legacyPath === "/treasure-rogue/" ? "game" : "page",
      redirect_kind: "exact",
      status: "mapped",
    });
  }

  for (const term of categories) {
    rows.push({
      legacy_path: normalizeSitePath(term.link),
      new_path: `/tags/${getNewTag(term)}/`,
      content_type: "category",
      redirect_kind: "taxonomy",
      status: "mapped",
    });
  }

  for (const term of tags) {
    rows.push({
      legacy_path: normalizeSitePath(term.link),
      new_path: `/tags/${getNewTag(term)}/`,
      content_type: "tag",
      redirect_kind: "taxonomy",
      status: "mapped",
    });
  }

  const years = new Set();
  const months = new Set();

  for (const post of posts) {
    const [year, month] = post.date.split("T")[0].split("-");
    years.add(year);
    months.add(`${year}/${month}`);
  }

  for (const year of Array.from(years).sort()) {
    rows.push({
      legacy_path: `/${year}/`,
      new_path: `/archive/${year}/`,
      content_type: "archive",
      redirect_kind: "archive",
      status: "mapped",
    });
  }

  for (const yearMonth of Array.from(months).sort()) {
    const [year, month] = yearMonth.split("/");
    rows.push({
      legacy_path: `/${year}/${month}/`,
      new_path: `/archive/${year}/${month}/`,
      content_type: "archive",
      redirect_kind: "archive",
      status: "mapped",
    });
  }

  return rows.sort((left, right) => {
    if (left.content_type === right.content_type) {
      return left.legacy_path.localeCompare(right.legacy_path, "ja");
    }
    return left.content_type.localeCompare(right.content_type, "ja");
  });
}

function collectMediaAuditFromEntries(entries, entryType, mediaAuditMap) {
  for (const entry of entries) {
    const entryPath = normalizeSitePath(entry.link);
    const html = entry.content?.rendered ?? "";
    const $ = cheerio.load(`<div id="root">${html}</div>`);

    for (const url of collectAssetUrls($)) {
      trackMediaUsage({
        mediaAuditMap,
        url,
        referencedFrom: entryPath,
        sourceType: `${entryType}-content`,
      });
    }

    const featuredMedia = entry._embedded?.["wp:featuredmedia"]?.[0];
    const featuredUrl = featuredMedia?.source_url;
    if (featuredUrl) {
      trackMediaUsage({
        mediaAuditMap,
        url: featuredUrl,
        referencedFrom: entryPath,
        sourceType: `${entryType}-featured-media`,
      });
    }
  }
}

async function importPost({ post, categoriesById, tagsById, redirectMap }) {
  const articleDir = path.join(articlesRoot, post.slug);
  await rm(articleDir, { recursive: true, force: true });
  await mkdir(articleDir, { recursive: true });

  const articleAssets = createArticleAssets(articleDir);
  const contentHtml = post.content?.rendered ?? "";
  const $ = cheerio.load(`<div id="root">${contentHtml}</div>`, {
    decodeEntities: false,
  });

  const featuredMedia = post._embedded?.["wp:featuredmedia"]?.[0];
  const firstImage = $("#root img").first();
  const coverSourceUrl = featuredMedia?.source_url ?? (firstImage.length ? getPreferredAssetUrl(firstImage) : "");
  let coverFilePath = "";
  let coverAlt = "";

  if (coverSourceUrl) {
    coverFilePath = `./${await articleAssets.downloadAsCover(coverSourceUrl)}`;
    coverAlt = normalizeWhitespace(featuredMedia?.alt_text || firstImage.attr("alt") || `${toPlainText(post.title?.rendered ?? "")} の記事画像`);
  }

  preprocessEmbeds($);
  preprocessFigures($);
  await rewriteImageNodes($, articleAssets);
  await rewriteAnchorNodes($, articleAssets, redirectMap);
  annotateCodeBlocks($);
  stripPresentationAttributes($);

  const markdown = htmlToMarkdown($("#root").html() ?? "");
  const title = toPlainText(post.title?.rendered ?? "");
  const description = toPlainText(post.excerpt?.rendered ?? "");
  const articleTags = collectArticleTags(post, categoriesById, tagsById);

  const frontmatter = [
    "---",
    `title: ${yamlString(title)}`,
    `description: ${yamlString(description)}`,
    `publishedAt: ${yamlString(toJstIso(post.date))}`,
  ];

  if (post.modified && post.modified !== post.date) {
    frontmatter.push(`updatedAt: ${yamlString(toJstIso(post.modified))}`);
  }

  if (articleTags.length > 0) {
    frontmatter.push("tags:");
    for (const tag of articleTags) {
      frontmatter.push(`  - ${yamlString(tag)}`);
    }
  }

  if (coverFilePath) {
    frontmatter.push(`cover: ${yamlString(coverFilePath)}`);
    frontmatter.push(`coverAlt: ${yamlString(coverAlt)}`);
  }

  frontmatter.push("---", "", markdown.trim(), "");

  await writeFile(path.join(articleDir, "index.md"), frontmatter.join("\n"), "utf8");
}

function createArticleAssets(articleDir) {
  const usedNames = new Set();
  const downloadedAssets = new Map();
  let coverName = "";

  return {
    async downloadAsCover(sourceUrl) {
      if (coverName) {
        return coverName;
      }

      const absoluteUrl = toAbsoluteSiteUrl(sourceUrl);
      const extension = getExtensionFromUrl(absoluteUrl) || ".png";
      coverName = `cover${extension}`;
      await downloadAsset(absoluteUrl, path.join(articleDir, coverName));
      usedNames.add(coverName);
      downloadedAssets.set(absoluteUrl, coverName);
      return coverName;
    },
    async downloadContentAsset(sourceUrl) {
      const absoluteUrl = toAbsoluteSiteUrl(sourceUrl);
      if (downloadedAssets.has(absoluteUrl)) {
        return downloadedAssets.get(absoluteUrl);
      }

      const originalName = getFileNameFromUrl(absoluteUrl);
      const fileName = allocateFileName(originalName, usedNames);
      await downloadAsset(absoluteUrl, path.join(articleDir, fileName));
      downloadedAssets.set(absoluteUrl, fileName);
      return fileName;
    },
  };
}

function preprocessEmbeds($) {
  $("figure.wp-block-embed").each((_, element) => {
    const wrapper = $(element).find(".wp-block-embed__wrapper").first();
    const iframe = $(element).find("iframe").first();
    const url = normalizeWhitespace(iframe.attr("src") || wrapper.text());
    if (!url) {
      $(element).remove();
      return;
    }

    const paragraph = $("<p></p>");
    paragraph.append($("<a></a>").attr("href", url).text(url));
    $(element).replaceWith(paragraph);
  });

  $("iframe").each((_, element) => {
    const src = normalizeWhitespace($(element).attr("src") || "");
    if (!src) {
      $(element).remove();
      return;
    }

    const paragraph = $("<p></p>");
    paragraph.append($("<a></a>").attr("href", src).text(src));
    $(element).replaceWith(paragraph);
  });
}

function preprocessFigures($) {
  $("figure").each((_, element) => {
    const figure = $(element);
    const linkedImage = figure.find("a").has("img").first();
    const image = figure.find("img").first();
    const captionText = normalizeWhitespace(figure.find("figcaption").text());

    if (!linkedImage.length && !image.length) {
      figure.replaceWith(figure.contents());
      return;
    }

    const parts = [];
    if (linkedImage.length) {
      parts.push(`<p>${$.html(linkedImage)}</p>`);
    } else if (image.length) {
      parts.push(`<p>${$.html(image)}</p>`);
    }

    if (captionText) {
      parts.push(`<p><em>${escapeHtml(captionText)}</em></p>`);
    }

    figure.replaceWith(parts.join("\n"));
  });
}

function rewriteImageNodes($, articleAssets) {
  const tasks = [];

  $("img").each((_, element) => {
    tasks.push((async () => {
      const image = $(element);
      const sourceUrl = getPreferredAssetUrl(image);
      if (!sourceUrl) {
        image.remove();
        return;
      }

      const localPath = await articleAssets.downloadContentAsset(sourceUrl);
      const alt = normalizeWhitespace(image.attr("alt") || "");

      image.attr("src", `./${localPath}`);
      image.attr("alt", alt);
      image.removeAttr("srcset");
      image.removeAttr("sizes");
      image.removeAttr("class");
      image.removeAttr("style");
      image.removeAttr("width");
      image.removeAttr("height");
      image.removeAttr("loading");
      image.removeAttr("decoding");
      image.removeAttr("id");

      const parentLink = image.parent("a");
      if (parentLink.length) {
        const href = parentLink.attr("href") || "";
        if (isUploadUrl(href)) {
          const localHref = await articleAssets.downloadContentAsset(href);
          parentLink.attr("href", `./${localHref}`);
        }
      }
    })());
  });

  return Promise.all(tasks);
}

function rewriteAnchorNodes($, articleAssets, redirectMap) {
  const tasks = [];

  $("a").each((_, element) => {
    tasks.push((async () => {
      const anchor = $(element);
      const href = normalizeWhitespace(anchor.attr("href") || "");
      if (!href) {
        anchor.replaceWith(anchor.text());
        return;
      }

      if (isUploadUrl(href)) {
        const localPath = await articleAssets.downloadContentAsset(href);
        anchor.attr("href", `./${localPath}`);
      } else {
        const rewrittenHref = rewriteInternalLink(href, redirectMap);
        if (rewrittenHref) {
          anchor.attr("href", rewrittenHref);
        }
      }

      anchor.removeAttr("target");
      anchor.removeAttr("rel");
      anchor.removeAttr("class");
      anchor.removeAttr("style");
      anchor.removeAttr("aria-label");
      anchor.removeAttr("id");
    })());
  });

  return Promise.all(tasks);
}

function annotateCodeBlocks($) {
  $("pre").each((_, element) => {
    const pre = $(element);
    const code = pre.find("code").first();
    const className = code.attr("class") || "";
    const match = className.match(/language-([a-z0-9#+-]+)/i);
    if (match) {
      pre.attr("data-language", match[1].toLowerCase());
    }
  });
}

function stripPresentationAttributes($) {
  $("#root *").each((_, element) => {
    const node = $(element);
    for (const attributeName of Object.keys(element.attribs ?? {})) {
      if (attributeName === "href" || attributeName === "src" || attributeName === "alt" || attributeName === "data-language") {
        continue;
      }
      node.removeAttr(attributeName);
    }
  });

  $("#root p").each((_, element) => {
    const paragraph = $(element);
    if (!normalizeWhitespace(paragraph.text()) && paragraph.find("img, a, code, pre, table, hr").length === 0) {
      paragraph.remove();
    }
  });
}

function htmlToMarkdown(html) {
  const turndown = new TurndownService({
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    emDelimiter: "_",
    headingStyle: "atx",
  });

  turndown.use(gfm);
  turndown.keep(["table", "thead", "tbody", "tr", "th", "td"]);
  turndown.addRule("preformattedCode", {
    filter(node) {
      return node.nodeName === "PRE";
    },
    replacement(_content, node) {
      const language = node.getAttribute("data-language") || "";
      const code = normalizeLineEndings(node.textContent || "").replace(/\n$/, "");
      return `\n\n\`\`\`${language}\n${code}\n\`\`\`\n\n`;
    },
  });

  const markdown = turndown.turndown(html);
  return normalizeMarkdown(markdown);
}

function normalizeMarkdown(markdown) {
  return normalizeLineEndings(markdown)
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function collectArticleTags(post, categoriesById, tagsById) {
  const collected = [];
  const seen = new Set();

  for (const categoryId of post.categories ?? []) {
    const category = categoriesById.get(categoryId);
    if (!category) {
      continue;
    }
    const value = getNewTag(category);
    if (!seen.has(value)) {
      seen.add(value);
      collected.push(value);
    }
  }

  for (const tagId of post.tags ?? []) {
    const tag = tagsById.get(tagId);
    if (!tag) {
      continue;
    }
    const value = getNewTag(tag);
    if (!seen.has(value)) {
      seen.add(value);
      collected.push(value);
    }
  }

  return collected;
}

function toTaxonomyYaml({ categories, tags }) {
  const lines = ["categories:"];
  for (const category of categories.sort((left, right) => normalizeSitePath(left.link).localeCompare(normalizeSitePath(right.link), "ja"))) {
    lines.push(...toYamlEntry(category));
  }

  lines.push("tags:");
  for (const tag of tags.sort((left, right) => normalizeSitePath(left.link).localeCompare(normalizeSitePath(right.link), "ja"))) {
    lines.push(...toYamlEntry(tag));
  }

  return `${lines.join("\n")}\n`;
}

function toYamlEntry(term) {
  return [
    "  - legacy_path: " + yamlString(normalizeSitePath(term.link)),
    "    legacy_slug: " + yamlString(decodeLegacySlug(term.slug)),
    "    legacy_name: " + yamlString(normalizeWhitespace(term.name)),
    "    new_tag: " + yamlString(getNewTag(term)),
    "    new_path: " + yamlString(`/tags/${getNewTag(term)}/`),
    "    status: " + yamlString("mapped"),
    "    notes: " + yamlString(""),
  ];
}

function toCsv(headers, rows) {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => csvCell(row[header] ?? "")).join(","));
  }
  return `${lines.join("\n")}\n`;
}

function csvCell(value) {
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, "\"\"")}"`;
  }
  return stringValue;
}

function yamlString(value) {
  return JSON.stringify(String(value));
}

function normalizeSitePath(input) {
  const url = new URL(input, SITE_URL);
  const normalizedPath = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
  return normalizedPath === "//" ? "/" : normalizedPath.replace(/\/{2,}/g, "/");
}

function rewriteInternalLink(href, redirectMap) {
  if (!href) {
    return href;
  }

  let url;
  try {
    url = new URL(href, SITE_URL);
  } catch {
    return href;
  }

  if (url.origin !== SITE_ORIGIN) {
    return href;
  }

  const pathKey = normalizeSitePath(url.pathname);
  const nextPath = redirectMap.get(pathKey) ?? pathKey;
  return `${nextPath}${url.hash}`;
}

function collectAssetUrls($) {
  const urls = new Set();

  $("img").each((_, element) => {
    for (const url of collectAssetUrlsFromElement($(element))) {
      urls.add(url);
    }
  });

  $("a").each((_, element) => {
    const href = $(element).attr("href") || "";
    if (isUploadUrl(href)) {
      urls.add(toAbsoluteSiteUrl(href));
    }
  });

  $("source").each((_, element) => {
    const srcset = $(element).attr("srcset") || "";
    for (const candidate of parseSrcset(srcset)) {
      if (isUploadUrl(candidate.url)) {
        urls.add(toAbsoluteSiteUrl(candidate.url));
      }
    }
  });

  return urls;
}

function collectAssetUrlsFromElement(image) {
  const urls = new Set();
  const src = image.attr("src") || "";
  if (isUploadUrl(src)) {
    urls.add(toAbsoluteSiteUrl(src));
  }

  const srcset = image.attr("srcset") || "";
  for (const candidate of parseSrcset(srcset)) {
    if (isUploadUrl(candidate.url)) {
      urls.add(toAbsoluteSiteUrl(candidate.url));
    }
  }

  return urls;
}

function trackMediaUsage({ mediaAuditMap, url, referencedFrom, sourceType }) {
  const absoluteUrl = toAbsoluteSiteUrl(url);
  const entry = mediaAuditMap.get(absoluteUrl) ?? {
    legacy_url: absoluteUrl,
    filename: getFileNameFromUrl(absoluteUrl),
    referenced_from: new Set(),
    source_types: new Set(),
  };

  entry.referenced_from.add(referencedFrom);
  entry.source_types.add(sourceType);
  mediaAuditMap.set(absoluteUrl, entry);
}

function getPreferredAssetUrl(image) {
  const srcset = image.attr("srcset") || "";
  const candidates = parseSrcset(srcset);
  if (candidates.length > 0) {
    const preferred = [...candidates].sort((left, right) => right.width - left.width)[0];
    return preferred.url;
  }

  return image.attr("src") || "";
}

function parseSrcset(srcset) {
  return srcset
    .split(",")
    .map((entry) => normalizeWhitespace(entry))
    .filter(Boolean)
    .map((entry) => {
      const [url, widthValue] = entry.split(/\s+/);
      return {
        url,
        width: Number.parseInt(widthValue?.replace(/w$/, "") || "0", 10) || 0,
      };
    });
}

function isUploadUrl(input) {
  if (!input) {
    return false;
  }

  try {
    const url = new URL(input, SITE_URL);
    return url.pathname.includes("/wp-content/uploads/");
  } catch {
    return false;
  }
}

function toAbsoluteSiteUrl(input) {
  return new URL(input, SITE_URL).toString();
}

function getNewTag(term) {
  const decodedSlug = decodeLegacySlug(term.slug);
  if (/^[a-z0-9-]+$/.test(decodedSlug)) {
    return decodedSlug;
  }
  return normalizeWhitespace(term.name);
}

function decodeLegacySlug(slug) {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

function toPlainText(html) {
  const $ = cheerio.load(html || "");
  return normalizeWhitespace($.text().replace(/もっと読む.*/g, ""));
}

function toJstIso(dateTime) {
  return `${dateTime}${JST_OFFSET}`;
}

function normalizeWhitespace(value) {
  return String(value).replace(/\s+/g, " ").trim();
}

function normalizeLineEndings(value) {
  return value.replace(/\r\n/g, "\n");
}

function getFileNameFromUrl(input) {
  const url = new URL(input, SITE_URL);
  const fileName = decodeURIComponent(path.basename(url.pathname));
  return sanitizeFileName(fileName || "asset.bin");
}

function getExtensionFromUrl(input) {
  const extension = path.extname(new URL(input, SITE_URL).pathname);
  return extension || ".bin";
}

function sanitizeFileName(fileName) {
  return fileName.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-");
}

function allocateFileName(originalName, usedNames) {
  const extension = path.extname(originalName);
  const baseName = extension ? originalName.slice(0, -extension.length) : originalName;
  let candidate = sanitizeFileName(originalName);
  let counter = 2;

  while (usedNames.has(candidate)) {
    candidate = `${baseName}-${counter}${extension}`;
    counter += 1;
  }

  usedNames.add(candidate);
  return candidate;
}

async function downloadAsset(sourceUrl, destinationPath) {
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Failed to download ${sourceUrl}: ${response.status} ${response.statusText}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(destinationPath, buffer);
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
