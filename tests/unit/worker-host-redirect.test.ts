import { describe, expect, test, vi } from "vitest";

import worker from "../../worker/www-redirect.mjs";

describe("worker host redirects", () => {
  test("redirects www requests to the canonical apex host while preserving path and query", async () => {
    const response = await worker.fetch(new Request("https://www.mackysoft.net/articles/?a=1"));

    expect(response.status).toBe(301);
    expect(response.headers.get("Location")).toBe("https://mackysoft.net/articles/?a=1");
  });

  test("does not serve arbitrary hosts from the redirect worker", async () => {
    const response = await worker.fetch(new Request("https://site-www-redirect.example.workers.dev/articles/"));

    expect(response.status).toBe(404);
  });
});
