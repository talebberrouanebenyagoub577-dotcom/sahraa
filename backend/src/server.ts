import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { NextRequest } from "next/server";
import { handleHealth } from "@/health";
import { handleRoot } from "@/root";
import { handleTrack } from "@/v1/track";
import { handleSheetSync } from "@/v1/sheet-sync";

type RouteHandler = (request: NextRequest, context: { params: Promise<Record<string, string>> }) => Promise<Response>;

interface Route {
  pattern: RegExp;
  keys: string[];
  file: string;
  specificity: number;
}

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

function allowedOrigin(origin: string | undefined): string | null {
  if (!origin) return null;
  const productionOrigin = process.env.FRONTEND_ORIGIN || "https://sahraaaaaaaaaaa.shop";
  if (origin === productionOrigin) return origin;
  if (process.env.NODE_ENV !== "production" && /^http:\/\/localhost:\d+$/.test(origin)) return origin;
  return null;
}

function applyCors(req: IncomingMessage, headers: Headers) {
  const origin = allowedOrigin(req.headers.origin);
  if (!origin) return;
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Vary", "Origin");
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Sheet-Secret");
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
}

async function readBody(req: IncomingMessage): Promise<Buffer | undefined> {
  if (!req.method || req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return undefined;
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  if (chunks.length === 0) return undefined;
  return Buffer.concat(chunks);
}

async function collectRoutes(dir: string, root: string, routes: Route[]) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectRoutes(full, root, routes);
      continue;
    }
    if (entry.name !== "route.ts") continue;
    const rel = path.relative(root, path.dirname(full)).split(path.sep).filter(Boolean);
    const keys: string[] = [];
    const parts = rel.map((segment) => {
      const dynamic = segment.match(/^\[(.+)\]$/);
      if (dynamic) {
        keys.push(dynamic[1]);
        return "([^/]+)";
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    });
    const source = parts.length ? `/api/${parts.join("/")}` : "/api";
    routes.push({
      pattern: new RegExp(`^${source}/?$`),
      keys,
      file: full,
      specificity: keys.length * 10 - parts.length,
    });
  }
}

async function toNextRequest(req: IncomingMessage, body: Buffer | undefined): Promise<NextRequest> {
  const host = req.headers.host || "localhost";
  const url = `http://${host}${req.url || "/"}`;
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) continue;
    if (Array.isArray(value)) value.forEach((item) => headers.append(key, item));
    else headers.set(key, value);
  }
  const init: RequestInit & { duplex?: "half" } = { method: req.method, headers };
  if (body) {
    init.body = new Uint8Array(body);
    init.duplex = "half";
  }
  return new NextRequest(url, init as ConstructorParameters<typeof NextRequest>[1]);
}

async function writeResponse(req: IncomingMessage, res: ServerResponse, response: Response) {
  const headers = new Headers(response.headers);
  applyCors(req, headers);
  const out: Record<string, string | string[]> = {};
  headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") return;
    out[key] = value;
  });
  const cookies = typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];
  if (cookies.length) out["set-cookie"] = cookies;
  res.writeHead(response.status, out);
  const payload = Buffer.from(await response.arrayBuffer());
  res.end(payload);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required. Set it in EasyPanel. The API will not start.");
    process.exit(1);
  }

  const apiRoot = path.join(process.cwd(), "src", "app", "api");
  const routes: Route[] = [];
  await collectRoutes(apiRoot, apiRoot, routes);
  routes.sort((a, b) => a.specificity - b.specificity);
  const modules = new Map<string, Record<string, RouteHandler>>();

  const port = Number(process.env.PORT || 4000);
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", "http://localhost");
      if (req.method === "OPTIONS") {
        const headers = new Headers();
        applyCors(req, headers);
        const out: Record<string, string> = {};
        headers.forEach((value, key) => {
          out[key] = value;
        });
        res.writeHead(204, out);
        res.end();
        return;
      }

      if (url.pathname === "/" && req.method === "GET") {
        await writeResponse(req, res, handleRoot());
        return;
      }

      if (url.pathname === "/health" && req.method === "GET") {
        await writeResponse(req, res, await handleHealth());
        return;
      }

      const body = await readBody(req);
      const request = await toNextRequest(req, body);

      if (url.pathname === "/v1/track" && req.method === "POST") {
        await writeResponse(req, res, await handleTrack(request));
        return;
      }
      if (url.pathname === "/v1/orders/sheet-sync" && req.method === "POST") {
        await writeResponse(req, res, await handleSheetSync(request));
        return;
      }

      const match = routes.find((route) => route.pattern.test(url.pathname));
      if (!match || !req.method || !METHODS.includes(req.method as (typeof METHODS)[number])) {
        await writeResponse(req, res, new Response(JSON.stringify({ success: false, error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } }));
        return;
      }

      let loaded = modules.get(match.file);
      if (!loaded) {
        loaded = (await import(pathToFileURL(match.file).href)) as Record<string, RouteHandler>;
        modules.set(match.file, loaded);
      }
      const handler = loaded[req.method];
      if (!handler) {
        await writeResponse(req, res, new Response(JSON.stringify({ success: false, error: "Method not allowed" }), { status: 405, headers: { "Content-Type": "application/json" } }));
        return;
      }

      const found = url.pathname.match(match.pattern);
      const params: Record<string, string> = {};
      match.keys.forEach((key, index) => {
        params[key] = decodeURIComponent(found?.[index + 1] || "");
      });
      const response = await handler(request, { params: Promise.resolve(params) });
      await writeResponse(req, res, response);
    } catch (error) {
      console.error("[api]", error instanceof Error ? error.message : "request failed");
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
      }
      res.end(JSON.stringify({ success: false, error: "Internal server error" }));
    }
  });

  server.listen(port, "0.0.0.0", () => {
    console.log(`[sahraa-api] listening on ${port}`);
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "failed to start");
  process.exit(1);
});
