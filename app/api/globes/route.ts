import { NextResponse } from "next/server";
import { fileStore } from "@/lib/store/fileStore";
import { sanitiseIds } from "@/lib/countries";

export const runtime = "nodejs";

const MAX_COUNTRIES = 200;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }

  const raw = (body as { countries?: unknown })?.countries;
  if (!Array.isArray(raw)) {
    return NextResponse.json({ error: "countries must be an array" }, { status: 400 });
  }
  if (raw.length > MAX_COUNTRIES) {
    return NextResponse.json({ error: "Too many countries" }, { status: 400 });
  }

  // Unknown ids are dropped rather than rejected: a stale client should still publish.
  const countries = sanitiseIds(raw as string[]);
  if (countries.length === 0) {
    return NextResponse.json({ error: "Add at least one country" }, { status: 400 });
  }

  const globe = await fileStore.create({ countries });
  return NextResponse.json(globe, { status: 201 });
}
