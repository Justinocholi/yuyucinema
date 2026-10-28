import { NextRequest, NextResponse } from "next/server";

const flixImageSegmentXorKey = Uint8Array.from([
  157, 42, 241, 71, 179, 142, 92, 112,
  166, 25, 228, 59, 216, 98, 15, 197,
]);

function decryptFlixManifest(bodyBuffer: Buffer | ArrayBuffer, playlistKey?: string | null): string {
  const raw = Buffer.isBuffer(bodyBuffer) ? bodyBuffer : Buffer.from(bodyBuffer);
  const trimmed = raw.toString("utf8").trim();

  if (trimmed.startsWith("#EXTM3U")) return trimmed;
  if (!playlistKey) return trimmed;

  try {
    const key = Buffer.from(playlistKey, "base64");
    const payload = Buffer.from(trimmed, "base64");
    const out = Buffer.alloc(payload.length);

    for (let i = 0; i < payload.length; i++) {
      out[i] = payload[i] ^ key[i % key.length];
    }

    const text = out.toString("utf8").trim();
    if (text.startsWith("#EXTM3U")) return text;
  } catch {}

  return trimmed;
}

function unwrapFlixImageSegment(bodyBuffer: Buffer | ArrayBuffer): Buffer {
  const body = Buffer.isBuffer(bodyBuffer) ? bodyBuffer : Buffer.from(bodyBuffer);
  let offset = 0;
  let needsXor = false;

  const isWebp =
    body.length > 12 &&
    body[0] === 0x52 && body[1] === 0x49 && body[2] === 0x46 && body[3] === 0x46 &&
    body[8] === 0x57 && body[9] === 0x45 && body[10] === 0x42 && body[11] === 0x50;

  const isPng =
    body.length > 8 &&
    body[0] === 0x89 && body[1] === 0x50 && body[2] === 0x4e && body[3] === 0x47 &&
    body[4] === 0x0d && body[5] === 0x0a && body[6] === 0x1a && body[7] === 0x0a;

  if (isWebp) {
    offset = 12;
    needsXor = body[offset] !== 0x47;
  } else if (isPng) {
    offset = 8;
    needsXor = body[offset] !== 0x47;
  }

  if (!offset) return body;

  const out = Buffer.from(body.subarray(offset));
  if (needsXor) {
    for (let i = 0; i < out.length; i++) {
      out[i] ^= flixImageSegmentXorKey[i % flixImageSegmentXorKey.length];
    }
  }

  return out;
}

function getUpstreamHeaders(targetUrl: string, customReferer?: string | null): Record<string, string> {
  let referer = customReferer || "";
  let origin = "";

  const u = targetUrl.toLowerCase();
  if (u.includes("echovideo.to") || u.includes("echovideo.ru") || u.includes("roburnt10.store")) {
    referer = "https://play.echovideo.ru/";
    origin = "https://play.echovideo.ru";
  } else if (u.includes("anime-dunya.com")) {
    referer = "https://anime-dunya.com/";
    origin = "https://anime-dunya.com";
  } else if (u.includes("flixcloud.cc") || u.includes("fallencdn.top") || u.includes("rundowncdn.top") || u.includes("vortexcdn.top")) {
    referer = "https://flixcloud.cc/";
    origin = "https://flixcloud.cc";
  } else if (u.includes("vid-cdn.xyz") || u.includes("anizone")) {
    referer = "https://anizone.to/";
    origin = "https://anizone.to";
  } else if (u.includes("settlar.io") || u.includes("ani.pm")) {
    referer = "https://ani.pm/";
    origin = "https://ani.pm";
  } else if (!referer) {
    try {
      const parsed = new URL(targetUrl);
      referer = `${parsed.protocol}//${parsed.host}/`;
      origin = `${parsed.protocol}//${parsed.host}`;
    } catch {}
  }

  const headers: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    Accept: "*/*",
    "Accept-Language": "en-US,en;q=0.9",
  };

  if (referer) headers["Referer"] = referer;
  if (origin) headers["Origin"] = origin;

  return headers;
}

// Convert ASS (Advanced SubStation Alpha) subtitle text to standard WebVTT
function convertAssToVtt(assText: string): string {
  let vtt = "WEBVTT\n\n";
  const lines = assText.replace(/^\uFEFF/, "").split(/\r?\n/);

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!/^Dialogue:/i.test(trimmedLine)) continue;
    const parts = trimmedLine.replace(/^Dialogue:\s*/i, "").split(",");
    if (parts.length < 10) continue;

    const start = parts[1].trim();
    const end = parts[2].trim();
    const text = parts.slice(9).join(",").trim();

    // Clean ASS tags like {\pos(100,200)}, {\an8}, \N
    const cleanText = text
      .replace(/\{[^}]+\}/g, "")
      .replace(/\\N/g, "\n")
      .replace(/\\n/g, "\n")
      .trim();

    if (!cleanText) continue;

    const formatTime = (t: string) => {
      try {
        const p = t.trim().split(":");
        if (p.length === 3) {
          const [h, m, sWithMs] = p;
          const [s, cs] = (sWithMs || "00.00").split(".");
          const hh = (h || "0").padStart(2, "0");
          const mm = (m || "0").padStart(2, "0");
          const ss = (s || "0").padStart(2, "0");
          const ms = (cs || "0").padEnd(3, "0").slice(0, 3);
          return `${hh}:${mm}:${ss}.${ms}`;
        } else if (p.length === 2) {
          const [m, sWithMs] = p;
          const [s, cs] = (sWithMs || "00.00").split(".");
          const mm = (m || "0").padStart(2, "0");
          const ss = (s || "0").padStart(2, "0");
          const ms = (cs || "0").padEnd(3, "0").slice(0, 3);
          return `00:${mm}:${ss}.${ms}`;
        }
      } catch {}
      return "00:00:00.000";
    };

    vtt += `${formatTime(start)} --> ${formatTime(end)}\n`;
    vtt += `${cleanText}\n\n`;
  }

  return vtt;
}

// Convert SRT subtitle text to standard WebVTT
function convertSrtToVtt(srtText: string): string {
  let vtt = "WEBVTT\n\n";
  const normalized = srtText
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
  return vtt + normalized;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");
  const customReferer = searchParams.get("referer");
  const playlistKey = searchParams.get("key");
  const isSubtitleType =
    searchParams.get("type") === "subtitle" ||
    targetUrl?.endsWith(".vtt") ||
    targetUrl?.endsWith(".ass") ||
    targetUrl?.endsWith(".srt") ||
    targetUrl?.includes("subtitles");

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    const upstreamHeaders = getUpstreamHeaders(targetUrl, customReferer);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(targetUrl, {
      headers: upstreamHeaders,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return new NextResponse(`Upstream HTTP ${res.status}: ${res.statusText}`, {
        status: res.status,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    const contentType = res.headers.get("content-type") || "";
    const parentUrl = new URL(targetUrl);
    // Read body once as buffer to avoid any double-read issues
    const rawBuffer = Buffer.from(await res.arrayBuffer());

    // 1. Handle Subtitles: Convert .ass, .srt, or deliver .vtt
    if (isSubtitleType) {
      const subText = rawBuffer.toString("utf8");
      let vttOutput = subText;

      if (targetUrl.endsWith(".ass") || subText.includes("[Script Info]") || subText.includes("Dialogue:")) {
        vttOutput = convertAssToVtt(subText);
      } else if (targetUrl.endsWith(".srt") || /^\d+\s*\n\d{2}:\d{2}:\d{2}/.test(subText)) {
        vttOutput = convertSrtToVtt(subText);
      } else if (!subText.startsWith("WEBVTT")) {
        vttOutput = `WEBVTT\n\n${subText}`;
      }

      return new NextResponse(vttOutput, {
        status: 200,
        headers: {
          "Content-Type": "text/vtt; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    // 2. Check if the response is an HLS playlist (m3u8) or encrypted FlixCloud manifest
    const isPlaylist =
      contentType.includes("mpegurl") ||
      contentType.includes("m3u8") ||
      targetUrl.includes(".m3u8") ||
      targetUrl.includes("m3u8");

    if (isPlaylist) {
      const text = decryptFlixManifest(rawBuffer, playlistKey);

      if (text.includes("#EXTM3U")) {
        const lines = text.split(/\r?\n/);
        const rewrittenLines = lines.map((line) => {
          const trimmed = line.trim();

          // Rewrite ANY URI attribute (audio tracks, encryption keys, subtitles)
          if (trimmed.includes('URI="')) {
            return trimmed.replace(/URI="([^"]+)"/g, (_, targetUri) => {
              const absUrl = new URL(targetUri, parentUrl.href).href;
              const keyParam = playlistKey ? `&key=${encodeURIComponent(playlistKey)}` : "";
              const proxiedUri = `/api/stream/proxy?url=${encodeURIComponent(absUrl)}&referer=${encodeURIComponent(upstreamHeaders["Referer"] || "")}${keyParam}`;
              return `URI="${proxiedUri}"`;
            });
          }

          if (trimmed.startsWith("#") || !trimmed) {
            return line;
          }

          // Relative or absolute video stream / segment URL
          try {
            const absoluteUrl = new URL(trimmed, parentUrl.href).href;
            const keyParam = playlistKey ? `&key=${encodeURIComponent(playlistKey)}` : "";
            return `/api/stream/proxy?url=${encodeURIComponent(absoluteUrl)}&referer=${encodeURIComponent(upstreamHeaders["Referer"] || "")}${keyParam}`;
          } catch {
            return line;
          }
        });

        const rewrittenPlaylist = rewrittenLines.join("\n");

        return new NextResponse(rewrittenPlaylist, {
          status: 200,
          headers: {
            "Content-Type": "application/vnd.apple.mpegurl; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Cache-Control": "public, max-age=60",
          },
        });
      }
    }

    // 3. Binary stream (video segment .ts, audio, or image-wrapped .webp/.png segment, or AES key)
    const unwrappedBuffer = unwrapFlixImageSegment(rawBuffer);
    const isKey = targetUrl.endsWith(".key") || targetUrl.includes("/keys/") || contentType.includes("octet-stream");
    const mime = isKey ? "application/octet-stream" : (contentType || "video/mp2t");

    return new NextResponse(new Uint8Array(unwrappedBuffer), {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err: any) {
    return new NextResponse(`Proxy error: ${err?.message || "Unknown error"}`, {
      status: 502,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }
}
