// One-time: authorizes the site to read free/busy and create events on Leo's
// Google Calendar. Reads GOOGLE_CLIENT_ID/SECRET from .env.local and writes
// GOOGLE_REFRESH_TOKEN back into it, so the token never hits the terminal.
import { createServer } from "node:http";
import { exec } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const ENV = ".env.local";
const env = Object.fromEntries(
  readFileSync(ENV, "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
const { GOOGLE_CLIENT_ID: clientId, GOOGLE_CLIENT_SECRET: clientSecret } = env;
if (!clientId || !clientSecret) {
  console.error("Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local first.");
  process.exit(1);
}

const port = 53682;
const redirectUri = `http://localhost:${port}`;
const authUrl =
  "https://accounts.google.com/o/oauth2/v2/auth?" +
  new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.freebusy",
  });

const server = createServer(async (req, res) => {
  const code = new URL(req.url, redirectUri).searchParams.get("code");
  if (!code) return res.end("Waiting for Google…");
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
  });
  const token = await tokenRes.json();
  if (!token.refresh_token) {
    res.end("No refresh token returned. Check the terminal.");
    console.error("Google did not return a refresh token:", token.error ?? token);
    process.exit(1);
  }
  const lines = readFileSync(ENV, "utf8").split(/\r?\n/).filter((l) => !l.startsWith("GOOGLE_REFRESH_TOKEN="));
  writeFileSync(ENV, [...lines.filter(Boolean), `GOOGLE_REFRESH_TOKEN=${token.refresh_token}`, ""].join("\n"));
  res.end("Done. You can close this tab.");
  console.log("Saved GOOGLE_REFRESH_TOKEN to .env.local");
  server.close();
});

server.listen(port, () => {
  console.log("Opening Google consent screen…");
  exec(`${process.platform === "win32" ? "start \"\"" : "open"} "${authUrl}"`);
  console.log(`If it didn't open, visit:\n${authUrl}`);
});
