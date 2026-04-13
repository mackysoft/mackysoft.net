import { readFile } from "node:fs/promises";
import path from "node:path";

import { repoRoot } from "../activity-sync/shared.mjs";

export const urlMapPath = path.join(repoRoot, "docs/migration/url-map.csv");

const requiredHeaders = [
  "legacy_path",
  "new_path",
  "content_type",
  "redirect_kind",
  "status",
];

const validStatuses = new Set(["mapped", "excluded"]);

function createUrlMapError(source, message) {
  return new Error(`[${source}] ${message}`);
}

function normalizePathValue(value) {
  return value.trim();
}

export function isSiteAbsolutePath(value) {
  if (!value.startsWith("/") || !value.endsWith("/")) {
    return false;
  }

  if (value.startsWith("//")) {
    return false;
  }

  if (value.includes("?") || value.includes("#") || value.includes("\\")) {
    return false;
  }

  return !value.slice(1, -1).includes("//");
}

function assertRequiredHeaders(headers, source) {
  for (const header of requiredHeaders) {
    if (!headers.includes(header)) {
      throw createUrlMapError(source, `Missing required header "${header}".`);
    }
  }
}

function parseCsv(csvText, source) {
  const rows = [];
  let currentRow = [];
  let currentCell = "";
  let inQuotes = false;
  let justClosedQuote = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const character = csvText[index];

    if (inQuotes) {
      if (character === "\"") {
        if (csvText[index + 1] === "\"") {
          currentCell += "\"";
          index += 1;
        } else {
          inQuotes = false;
          justClosedQuote = true;
        }
      } else {
        currentCell += character;
      }

      continue;
    }

    if (justClosedQuote) {
      if (character === ",") {
        currentRow.push(currentCell);
        currentCell = "";
        justClosedQuote = false;
        continue;
      }

      if (character === "\n") {
        currentRow.push(currentCell);
        rows.push(currentRow);
        currentRow = [];
        currentCell = "";
        justClosedQuote = false;
        continue;
      }

      if (character === "\r") {
        continue;
      }

      throw createUrlMapError(source, `Malformed CSV: unexpected character "${character}" after closing quote.`);
    }

    if (character === "\"") {
      if (currentCell.length > 0) {
        throw createUrlMapError(source, "Malformed CSV: quotes must start at the beginning of a field.");
      }

      inQuotes = true;
      continue;
    }

    if (character === ",") {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if (character === "\n") {
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = "";
      continue;
    }

    if (character === "\r") {
      continue;
    }

    currentCell += character;
  }

  if (inQuotes) {
    throw createUrlMapError(source, "Malformed CSV: reached end of file before closing quote.");
  }

  if (justClosedQuote || currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows.filter((row) => row.some((cell) => cell.length > 0));
}

function getFieldIndexes(headers) {
  return Object.fromEntries(headers.map((header, index) => [header, index]));
}

function getFieldValue(cells, fieldIndexes, header) {
  return normalizePathValue(cells[fieldIndexes[header]] ?? "");
}

function assertPathField(value, fieldName, source, rowNumber) {
  if (!isSiteAbsolutePath(value)) {
    throw createUrlMapError(
      source,
      `Row ${rowNumber}: "${fieldName}" must be a site absolute path with leading and trailing slashes, received "${value}".`,
    );
  }
}

export function parseUrlMapCsv(csvText, { source = "url-map.csv" } = {}) {
  const rows = parseCsv(csvText, source);

  if (rows.length === 0) {
    throw createUrlMapError(source, "CSV is empty.");
  }

  const [headers, ...dataRows] = rows;
  assertRequiredHeaders(headers, source);
  const fieldIndexes = getFieldIndexes(headers);

  return dataRows.map((cells, index) => {
    const rowNumber = index + 2;
    const legacyPath = getFieldValue(cells, fieldIndexes, "legacy_path");
    const newPath = getFieldValue(cells, fieldIndexes, "new_path");
    const contentType = getFieldValue(cells, fieldIndexes, "content_type");
    const redirectKind = getFieldValue(cells, fieldIndexes, "redirect_kind");
    const status = getFieldValue(cells, fieldIndexes, "status");

    if (!legacyPath) {
      throw createUrlMapError(source, `Row ${rowNumber}: "legacy_path" is required.`);
    }

    assertPathField(legacyPath, "legacy_path", source, rowNumber);

    if (!contentType) {
      throw createUrlMapError(source, `Row ${rowNumber}: "content_type" is required.`);
    }

    if (!redirectKind) {
      throw createUrlMapError(source, `Row ${rowNumber}: "redirect_kind" is required.`);
    }

    if (!status) {
      throw createUrlMapError(source, `Row ${rowNumber}: "status" is required.`);
    }

    if (!validStatuses.has(status)) {
      throw createUrlMapError(source, `Row ${rowNumber}: unsupported status "${status}".`);
    }

    if (status === "mapped" && !newPath) {
      throw createUrlMapError(source, `Row ${rowNumber}: mapped rows must define "new_path".`);
    }

    if (newPath) {
      assertPathField(newPath, "new_path", source, rowNumber);
    }

    return {
      legacyPath,
      newPath,
      contentType,
      redirectKind,
      status,
    };
  });
}

export async function loadUrlMap({ filePath = urlMapPath } = {}) {
  const csvText = await readFile(filePath, "utf8");
  return parseUrlMapCsv(csvText, { source: filePath });
}

export function isGeneratedRedirectRow(row) {
  return row.status === "mapped" && row.legacyPath !== row.newPath;
}

export function getGeneratedRedirectRows(rows, { source = "url-map.csv" } = {}) {
  const generatedRows = rows.filter(isGeneratedRedirectRow);
  const seenLegacyPaths = new Set();

  for (const row of generatedRows) {
    if (seenLegacyPaths.has(row.legacyPath)) {
      throw createUrlMapError(source, `Duplicate legacy_path "${row.legacyPath}" found in redirect generation targets.`);
    }

    seenLegacyPaths.add(row.legacyPath);
  }

  return generatedRows;
}
