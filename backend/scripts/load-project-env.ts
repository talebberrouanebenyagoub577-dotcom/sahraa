import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

type DbKind = "local" | "easypanel-internal" | "remote";

function applyEnvFile(file: string) {
  const text = readFileSync(file, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function envCandidates() {
  const cwd = process.cwd();
  return [
    path.resolve(cwd, ".env"),
    path.resolve(cwd, "..", ".env"),
    path.resolve(cwd, "backend", ".env"),
    path.resolve(cwd, "prisma", ".env"),
    path.resolve(cwd, "..", "backend", ".env"),
  ];
}

export function describeDatabaseTarget(): { kind: DbKind; host: string; db: string } {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    throw new Error(
      "DATABASE_URL is missing. Locally it is loaded from the repo-root .env. On EasyPanel it must already exist in the Backend service environment."
    );
  }
  const url = new URL(raw.replace(/^postgres(ql)?:/i, "http:"));
  const host = url.hostname || "";
  const db = (url.pathname || "").replace(/^\//, "") || "(none)";
  const kind: DbKind = /^(localhost|127\.0\.0\.1|::1)$/i.test(host)
    ? "local"
    : host === "sahraaaaaaaaaaa_database" || host === "postgres"
      ? "easypanel-internal"
      : "remote";
  return { kind, host, db };
}

function inheritDatabaseUrlFromPid1() {
  const environPath = "/proc/1/environ";
  if (process.env.DATABASE_URL || !existsSync(environPath)) return;
  const pairs = readFileSync(environPath, "utf8").split("\0");
  for (const pair of pairs) {
    if (!pair.startsWith("DATABASE_URL=")) continue;
    process.env.DATABASE_URL = pair.slice("DATABASE_URL=".length);
    return;
  }
}

export function loadProjectEnv() {
  if (!process.env.DATABASE_URL) {
    for (const file of envCandidates()) {
      if (!existsSync(file)) continue;
      applyEnvFile(file);
      if (process.env.DATABASE_URL) break;
    }
  }
  inheritDatabaseUrlFromPid1();
  return describeDatabaseTarget();
}
