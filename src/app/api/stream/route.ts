import { NextRequest, NextResponse } from "next/server";
import { fetchStreamSourcesFromAPI } from "@/lib/streaming";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const idStr = searchParams.get("id");
  const episodeStr = searchParams.get("episode") || "1";
  const audio = (searchParams.get("audio") as "sub" | "dub") || "sub";
  const provider = searchParams.get("provider") || (audio === "dub" ? "aniwaves" : "anizone");
  const title = searchParams.get("title") || undefined;
  const malIdStr = searchParams.get("malId");
  const malId = malIdStr ? parseInt(malIdStr, 10) : undefined;

  if (!idStr) {
    return NextResponse.json({ error: "Missing anime id" }, { status: 400 });
  }

  const anilistId = parseInt(idStr, 10);
  const episodeNumber = parseInt(episodeStr, 10);

  if (isNaN(anilistId) || isNaN(episodeNumber)) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  try {
    const result = await fetchStreamSourcesFromAPI(
      anilistId,
      episodeNumber,
      audio,
      provider,
      title,
      malId
    );
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to resolve stream" },
      { status: 500 }
    );
  }
}
