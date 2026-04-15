import { describe, expect, test, vi } from "vitest";

import worker from "../../worker/index.mjs";

describe("worker host redirects", () => {
  test("redirects www requests to the canonical apex host while preserving path and query", async () => {
    const fetchAssets = vi.fn();

    const response = await worker.fetch(
      new Request("https://www.mackysoft.net/articles/?a=1"),
      { ASSETS: { fetch: fetchAssets } },
    );

    expect(response.status).toBe(301);
    expect(response.headers.get("Location")).toBe("https://mackysoft.net/articles/?a=1");
    expect(fetchAssets).not.toHaveBeenCalled();
  });

  test("serves assets directly for the canonical host", async () => {
    const assetResponse = new Response("ok", { status: 200 });
    const fetchAssets = vi.fn(async () => assetResponse);
    const request = new Request("https://mackysoft.net/articles/");

    const response = await worker.fetch(request, { ASSETS: { fetch: fetchAssets } });

    expect(fetchAssets).toHaveBeenCalledWith(request);
    expect(response).toBe(assetResponse);
  });
});
