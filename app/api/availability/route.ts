import { NextResponse } from "next/server";
import { getAvailability } from "@/lib/server/availability";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const days = Math.min(90, Math.max(7, Number(new URL(request.url).searchParams.get("days")) || 60));
  try {
    return NextResponse.json(await getAvailability(days), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[availability]", e);
    return NextResponse.json({ error: "Availability is temporarily unavailable." }, { status: 500 });
  }
}
