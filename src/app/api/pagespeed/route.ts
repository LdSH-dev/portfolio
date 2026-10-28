import type { NextRequest } from "next/server";
import { runPageSpeed, type Strategy } from "@/lib/pagespeed";

// Always tests the deployed site, never an arbitrary URL, so this endpoint
// can't be used as a free PageSpeed proxy.
export async function GET(request: NextRequest) {
  const strategy: Strategy = request.nextUrl.searchParams.get("strategy") === "desktop" ? "desktop" : "mobile";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) {
    return Response.json({ error: "not-deployed" }, { status: 503 });
  }

  try {
    return Response.json(await runPageSpeed(siteUrl, strategy));
  } catch {
    return Response.json({ error: "pagespeed-unavailable" }, { status: 502 });
  }
}
