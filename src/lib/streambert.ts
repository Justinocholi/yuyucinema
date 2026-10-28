import { StreamSource, SubtitleTrack } from "@/types/anime";
import { wrapWithStreamProxy } from "./streaming";

const OBFUSCATION_KEY = Buffer.from("otaku-embed-v1", "utf8");
const HIANIME_BASE = "https://hianime.at";
const ANISKIP_API = "https://api.aniskip.com/v2";

// ── 1. AniSkip Timings Resolver ──────────────────────────────────────────────
export interface AniSkipTiming {
  intro?: { startTime: number; endTime: number };
  outro?: { startTime: number; endTime: number };
}

const aniskipCache = new Map<string, { data: AniSkipTiming | null; expiresAt: number }>();
const ANISKIP_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function fetchAniSkipTimings(
  malId?: number | null,
  episodeNumber?: number
): Promise<AniSkipTiming | null> {
  if (!malId || !episodeNumber) return null;

  const key = `${malId}:${episodeNumber}`;
  const hit = aniskipCache.get(key);
  if (hit && Date.now() < hit.expiresAt) return hit.data;

  try {
    const url = `${ANISKIP_API}/skip-times/${malId}/${episodeNumber}?types[]=op&types[]=ed&types[]=mixed-op&types[]=mixed-ed&episodeLength=0`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.status === 404 || !res.ok) {
      aniskipCache.set(key, { data: null, expiresAt: Date.now() + ANISKIP_TTL });
      return null;
    }

    const data = await res.json();
    if (!data.found || !Array.isArray(data.results)) {
      aniskipCache.set(key, { data: null, expiresAt: Date.now() + ANISKIP_TTL });
      return null;
    }

    const result: AniSkipTiming = {};
    for (const item of data.results) {
      const { skipType, interval } = item;
      if (!interval || interval.startTime == null || interval.endTime == null) continue;

      if (skipType === "op" || skipType === "mixed-op") {
        result.intro = { startTime: interval.startTime, endTime: interval.endTime };
      } else if (skipType === "ed" || skipType === "mixed-ed") {
        result.outro = { startTime: interval.startTime, endTime: interval.endTime };
      }
    }

    const finalData = Object.keys(result).length > 0 ? result : null;
    aniskipCache.set(key, { data: finalData, expiresAt: Date.now() + ANISKIP_TTL });
    return finalData;
  } catch {
    return null;
  }
}

// ── 2. Streambert HiAnime Scraper & De-obfuscation ───────────────────────────
function deobfuscateBlob(blob: string): string {
  const buf = Buffer.from(blob, "base64");
  const out = Buffer.alloc(buf.length);
  for (let i = 0; i < buf.length; i++) {
    out[i] = buf[i] ^ OBFUSCATION_KEY[i % OBFUSCATION_KEY.length];
  }
  return out.toString("utf8");
}

export async function resolveHiAnimeStream(
  animeTitle: string,
  episodeNumber: number,
  audio: "sub" | "dub" = "sub",
  malId?: number | null
): Promise<{ stream: StreamSource | null; skip?: AniSkipTiming | null }> {
  try {
    const cleanQuery = animeTitle
      .replace(/[^a-zA-Z0-9\s]/g, " ")
      .trim()
      .split(/\s+/)
      .slice(0, 4)
      .join(" ");

    // 1. Search show on HiAnime
    const searchUrl = `${HIANIME_BASE}/search?keyword=${encodeURIComponent(cleanQuery)}`;
    const searchRes = await fetch(searchUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    });
    if (!searchRes.ok) return { stream: null };

    const searchHtml = await searchRes.text();
    const showMatch = searchHtml.match(/<h3 class="film-name">[\s\S]*?<a\s+href="([^"]+)"/);
    if (!showMatch) return { stream: null };

    const showHref = showMatch[1];
    const numericShowId = showHref.split("-").pop();
    if (!numericShowId || !/^\d+$/.test(numericShowId)) return { stream: null };

    // 2. Fetch episodes list
    const epRes = await fetch(`${HIANIME_BASE}/api/theme/episode/list/${numericShowId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: `${HIANIME_BASE}/`,
      },
    });
    if (!epRes.ok) return { stream: null };

    const epJson = await epRes.json();
    const epHtml = epJson.html || JSON.stringify(epJson);

    // Find target episode item (data-number="X" ... data-id="Y" or data-id="Y" ... data-number="X")
    const epRegex = new RegExp(
      `(?:data-number="${episodeNumber}"[\\s\\S]*?data-id="(\\d+)"|data-id="(\\d+)"[\\s\\S]*?data-number="${episodeNumber}")`
    );
    const epMatch = epHtml.match(epRegex);
    const targetEpisodeId = epMatch ? epMatch[1] || epMatch[2] : null;

    if (!targetEpisodeId) return { stream: null };

    // 3. Fetch servers
    const srvRes = await fetch(`${HIANIME_BASE}/api/theme/episode/servers?episodeId=${targetEpisodeId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: `${HIANIME_BASE}/`,
      },
    });
    if (!srvRes.ok) return { stream: null };

    const srvJson = await srvRes.json();
    const srvHtml = srvJson.html || JSON.stringify(srvJson);

    // Look for ZokoAnime or other server matching chosen audio
    const hashMatches = [
      ...srvHtml.matchAll(/server-item"\s+data-type="([^"]+)"[^>]*data-server-name="([^"]+)"[^>]*data-hash="([^"]+)"/g),
      ...srvHtml.matchAll(/data-hash="([^"]+)"[^>]*data-server-name="([^"]+)"[^>]*data-type="([^"]+)"/g),
    ];

    let chosenHash: string | null = null;
    let fallbackHash: string | null = null;

    for (const m of hashMatches) {
      const type = m[1] === "sub" || m[1] === "dub" ? m[1] : m[3];
      const srvName = m[2];
      const hash = m[1].length > 10 ? m[1] : m[3];

      if (srvName === "ZokoAnime" && type === audio) {
        chosenHash = hash;
        break;
      }
      if (srvName === "ZokoAnime" && !fallbackHash) {
        fallbackHash = hash;
      }
    }

    const targetHash = chosenHash || fallbackHash;
    if (!targetHash) return { stream: null };

    const embedUrl = Buffer.from(targetHash, "base64").toString("utf8").trim();
    if (!embedUrl.startsWith("http")) return { stream: null };

    // 4. Fetch embed page and deobfuscate window.__P
    const embedRes = await fetch(embedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: `${HIANIME_BASE}/`,
      },
    });
    if (!embedRes.ok) return { stream: null };

    const embedHtml = await embedRes.text();
    const blobMatch = embedHtml.match(/window\.__P="([^"]*)"/);
    if (!blobMatch) return { stream: null };

    const decoded = JSON.parse(deobfuscateBlob(blobMatch[1]));
    if (!decoded.src) return { stream: null };

    const rawM3u8 = decoded.src;
    const embedReferer = embedUrl.replace(/^(https?:\/\/[^/]*).*$/, "$1/");

    const subtitles: SubtitleTrack[] = (decoded.subtitles || []).map((sub: any, i: number) => ({
      url: wrapWithStreamProxy(sub.src, embedReferer, "subtitle"),
      label: sub.label || (i === 0 ? "English" : `Track ${i + 1}`),
      srclang: sub.lang || "en",
      format: "vtt",
      default: !!sub.default || i === 0,
    }));

    const skipTimings: AniSkipTiming | null = decoded.skip
      ? {
          intro: decoded.skip.intro ? { startTime: decoded.skip.intro.start, endTime: decoded.skip.intro.end } : undefined,
          outro: decoded.skip.outro ? { startTime: decoded.skip.outro.start, endTime: decoded.skip.outro.end } : undefined,
        }
      : null;

    const stream: StreamSource = {
      url: wrapWithStreamProxy(rawM3u8, embedReferer, "stream"),
      rawUrl: rawM3u8,
      type: "hls",
      server: "HiAnime (Streambert)",
      quality: "1080p FHD",
      subtitles,
      priority: 1,
      isActive: true,
      audio,
      headers: { Referer: embedReferer },
    };

    return { stream, skip: skipTimings };
  } catch (err) {
    return { stream: null };
  }
}

// ── 3. Streambert Multi-Provider Embed Channels ─────────────────────────────
export interface StreambertChannel {
  id: string;
  name: string;
  tag: string;
  note: string;
  getUrl: (params: { anilistId: number; malId?: number; episodeNumber: number; audio: "sub" | "dub" }) => string;
}

export const STREAMBERT_CHANNELS: StreambertChannel[] = [
  {
    id: "streambert-vidsrc-to",
    name: "VidSrc.to (Ultra)",
    tag: "STREAMBERT",
    note: "High Speed 1080p",
    getUrl: ({ anilistId, episodeNumber }) =>
      `https://vidsrc.to/embed/tv/${anilistId}/1/${episodeNumber}`,
  },
  {
    id: "streambert-multiembed",
    name: "MultiEmbed (Cinema HD)",
    tag: "STREAMBERT",
    note: "Multi-Server Failover",
    getUrl: ({ anilistId, episodeNumber }) =>
      `https://multiembed.mov/?video_id=${anilistId}&tmdb=1&s=1&e=${episodeNumber}`,
  },
  {
    id: "streambert-2embed",
    name: "2Embed (Fast Mirror)",
    tag: "STREAMBERT",
    note: "Global CDN",
    getUrl: ({ anilistId, episodeNumber }) =>
      `https://www.2embed.cc/embedtv/${anilistId}&s=1&e=${episodeNumber}`,
  },
  {
    id: "streambert-nontongo",
    name: "NontonGo (Cinema)",
    tag: "STREAMBERT",
    note: "Direct 1080p Stream",
    getUrl: ({ anilistId, episodeNumber }) =>
      `https://www.nontongo.win/embed/tv/${anilistId}/1/${episodeNumber}`,
  },
  {
    id: "streambert-vidnest",
    name: "Vidnest (Streambert HD)",
    tag: "STREAMBERT",
    note: "Multi-Dub, 1080p",
    getUrl: ({ anilistId, episodeNumber, audio }) =>
      `https://vidnest.fun/anime/${anilistId}/${episodeNumber}/${audio}`,
  },
];
