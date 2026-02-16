import { createRequestHandler } from "@remix-run/cloudflare";
import * as build from "./build/server/index.js";
import { getLoadContext } from "./load-context";

const handleRequest = createRequestHandler(build, process.env.NODE_ENV);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Try to serve static assets for build/ assets or public/ files
    if (url.pathname.startsWith("/build/") || url.pathname.startsWith("/assets/") || url.pathname === "/favicon.svg") {
      try {
        // @ts-ignore - env.ASSETS is provided by Cloudflare Pages
        return await env.ASSETS.fetch(request);
      } catch (e) {
        // Fall through to Remix
      }
    }

    const loadContext = getLoadContext({
        request,
        context: { cloudflare: { use: () => {}, ...env, ...ctx, cf: request.cf, caches } }
    });
    return handleRequest(request, loadContext);
  }
};
