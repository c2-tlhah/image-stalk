import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/cloudflare";

import styles from "./styles/globals.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styles },
  { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="terminal-border bg-black p-8 max-w-md scanline">
          <div className="flex space-x-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <h1 className="text-2xl font-mono font-bold text-red-500 mb-4 terminal-glow">
            [ERROR_{error.status}] {error.statusText}
          </h1>
          <p className="text-green-400 font-mono text-sm">&gt; {error.data}</p>
          <a href="/" className="inline-block mt-6 terminal-button text-xs px-4 py-2">
            [RETURN_HOME]
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="terminal-border bg-black p-8 max-w-md scanline">
        <div className="flex space-x-2 mb-4">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <h1 className="text-2xl font-mono font-bold text-red-500 mb-4 terminal-glow">
          [SYSTEM_ERROR]
        </h1>
        <p className="text-green-400 font-mono text-sm">
          &gt; {error instanceof Error ? error.message : "Unknown error"}
        </p>
        <a href="/" className="inline-block mt-6 terminal-button text-xs px-4 py-2">
          [RETURN_HOME]
        </a>
      </div>
    </div>
  );
}
