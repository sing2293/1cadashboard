import {
  clerkClient,
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { canOpenApp, isHubAdmin, type HubAccess } from "@/lib/hub-access";

// Vercel Cron checks CRON_SECRET inside the route itself
const isCronRoute = createRouteMatcher(["/api/cron(.*)"]);
const isAdminRoute = createRouteMatcher(["/admin(.*)", "/api/admin(.*)"]);
const isApiRoute = createRouteMatcher(["/api(.*)"]);

function forbidden(req: NextRequest, pageFallback: URL) {
  return isApiRoute(req)
    ? NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 })
    : pageFallback;
}

export default clerkMiddleware(async (auth, req) => {
  if (isCronRoute(req)) return;

  // Signed-out visitors are sent to the hub's sign-in and come back here after
  const { userId, sessionClaims } = await auth.protect();

  // Grants ride in the session token; fall back to the API if the claim is missing
  const meta: HubAccess =
    sessionClaims.metadata ??
    ((await (await clerkClient()).users.getUser(userId))
      .publicMetadata as HubAccess);

  if (!canOpenApp(meta)) {
    const res = forbidden(req, new URL("/no-access", req.url));
    return res instanceof URL ? NextResponse.rewrite(res) : res;
  }
  if (isAdminRoute(req) && !isHubAdmin(meta)) {
    const res = forbidden(req, new URL("/", req.url));
    return res instanceof URL ? NextResponse.redirect(res) : res;
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
