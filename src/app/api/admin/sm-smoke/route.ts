import { NextResponse } from "next/server";
import { SmClient } from "@/lib/sm/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug") ?? "1cleanair";

  try {
    const sm = SmClient.fromEnv(slug);
    const accounts = await sm.get<unknown>("accounts", { limit: 1, page: 1 });
    return NextResponse.json({ slug, accounts });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
