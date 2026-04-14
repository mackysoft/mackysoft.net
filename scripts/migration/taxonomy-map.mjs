import { readFile } from "node:fs/promises";
import path from "node:path";

import { repoRoot } from "../activity-sync/shared.mjs";

export const taxonomyMapPath = path.join(repoRoot, "docs/migration/taxonomy-map.yaml");

const validStatuses = new Set(["mapped", "excluded"]);

function createTaxonomyMapError(source, message) {
  return new Error(`[${source}] ${message}`);
}

function yamlString(value) {
  return JSON.stringify(String(value));
}

function camelizeTaxonomyKey(key) {
  return key.replace(/_([a-z])/g, (_, character) => character.toUpperCase());
}

function decamelizeTaxonomyKey(key) {
  return key.replace(/[A-Z]/g, (character) => `_${character.toLowerCase()}`);
}

export function parseTaxonomyMapYaml(yamlText, { source = "taxonomy-map.yaml" } = {}) {
  const entries = [];
  const lines = yamlText.split(/\r?\n/);
  let section = null;
  let current = null;

  function commitCurrent() {
    if (!current || !section) {
      return;
    }

    if (current.status && !validStatuses.has(current.status)) {
      throw createTaxonomyMapError(source, `Unsupported taxonomy status: ${current.status}`);
    }

    entries.push({
      kind: section === "categories" ? "category" : "tag",
      legacyPath: current.legacyPath ?? "",
      legacySlug: current.legacySlug ?? "",
      legacyName: current.legacyName ?? "",
      newTag: current.newTag ?? "",
      newPath: current.newPath ?? "",
      status: current.status ?? "excluded",
      notes: current.notes ?? "",
    });
  }

  for (const line of lines) {
    if (!line.trim()) {
      continue;
    }

    const sectionMatch = line.match(/^(categories|tags):$/);
    if (sectionMatch) {
      commitCurrent();
      section = sectionMatch[1];
      current = null;
      continue;
    }

    const itemMatch = line.match(/^  - ([a-z_]+): "(.*)"$/);
    if (itemMatch) {
      commitCurrent();
      current = {};
      const [, key, value] = itemMatch;
      current[camelizeTaxonomyKey(key)] = value;
      continue;
    }

    const fieldMatch = line.match(/^    ([a-z_]+): "(.*)"$/);
    if (fieldMatch && current) {
      const [, key, value] = fieldMatch;
      current[camelizeTaxonomyKey(key)] = value;
      continue;
    }

    throw createTaxonomyMapError(source, `Unsupported taxonomy-map.yaml line: ${line}`);
  }

  commitCurrent();
  return entries;
}

export function stringifyTaxonomyMapYaml(entries) {
  const lines = ["categories:"];
  const sections = [
    { kind: "category", heading: "categories" },
    { kind: "tag", heading: "tags" },
  ];

  for (const { kind, heading } of sections) {
    if (heading === "tags") {
      lines.push("tags:");
    }

    for (const entry of entries.filter((candidate) => candidate.kind === kind)) {
      const fields = [
        ["legacyPath", entry.legacyPath],
        ["legacySlug", entry.legacySlug],
        ["legacyName", entry.legacyName],
        ["newTag", entry.newTag],
        ["newPath", entry.newPath],
        ["status", entry.status],
        ["notes", entry.notes],
      ];

      const [[firstKey, firstValue], ...restFields] = fields;
      lines.push(`  - ${decamelizeTaxonomyKey(firstKey)}: ${yamlString(firstValue)}`);
      for (const [key, value] of restFields) {
        lines.push(`    ${decamelizeTaxonomyKey(key)}: ${yamlString(value)}`);
      }
    }
  }

  return `${lines.join("\n")}\n`;
}

export async function loadTaxonomyMap({ filePath = taxonomyMapPath } = {}) {
  const yamlText = await readFile(filePath, "utf8");
  return parseTaxonomyMapYaml(yamlText, { source: filePath });
}
