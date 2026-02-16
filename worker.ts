import { createRequestHandler } from "@remix-run/cloudflare";
import * as build from "./build/server/index.js";
import { getLoadContext } from "./load-context";

const handleRequest = createRequestHandler(build, process.env.NODE_ENV);

export default {
  async fetch(request, env, ctx) {
    const loadContext = getLoadContext({
        request,
        context: { cloudflare: { use: () => {}, ...env, ...ctx, cf: request.cf, caches } }
    });
    return handleRequest(request, loadContext);
  }
};
