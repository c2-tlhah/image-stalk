import { createRequestHandler } from "@remix-run/cloudflare";
import * as build from "./build/server/index.js";
import { getLoadContext } from "./load-context";

const handleRequest = createRequestHandler(build, process.env.NODE_ENV);

export default {
  async fetch(request, env, ctx) {
    try {
      // Try to serve static assets first (CSS, JS, images, etc.)
      // @ts-ignore - env.ASSETS is provided by Cloudflare Pages
      return await env.ASSETS.fetch(request);
    } catch {
      // If not a static asset, fall back to Remix handler
    }

    const loadContext = getLoadContext({
        request,
        context: { cloudflare: { use: () => {}, ...env, ...ctx, cf: request.cf, caches } }
    });
    return handleRequest(request, loadContext);
  }
};
