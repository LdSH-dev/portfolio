import { NextResponse, type NextRequest } from "next/server";

// The stats dashboard is private: without the right key it simply doesn't exist.
export function proxy(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (!process.env.STATS_KEY || key !== process.env.STATS_KEY) {
    return new NextResponse("Not found", { status: 404, headers: { "X-Robots-Tag": "noindex" } });
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/stats",
};
