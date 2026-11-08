import { NextRequest, NextResponse } from "next/server";
import {
  fetchLiveSportsEvents,
  getSportsEventById,
  SPORTS_CATEGORIES,
  POPULAR_COMPETITIONS,
  SPORTS_LIVE_CHANNELS,
  addCustomAdminEvent,
  removeCustomAdminEvent,
  SportsEvent,
} from "@/lib/sports";

const ADMIN_SECRET = process.env.SPORTS_ADMIN_KEY || "yuyu-sports-admin-2026";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    const category = searchParams.get("category");
    const competition = searchParams.get("competition");
    const status = searchParams.get("status");

    // Single event query
    if (eventId) {
      const event = await getSportsEventById(eventId);
      if (!event) {
        return NextResponse.json({ error: "Sports event not found" }, { status: 404 });
      }
      return NextResponse.json({ event });
    }

    const allEvents = await fetchLiveSportsEvents();
    let filtered = allEvents;

    if (category && category !== "all" && category !== "football") {
      if (category === "epl") {
        filtered = filtered.filter((e) => e.competitionId === "eng.1" || e.competition.toLowerCase().includes("premier"));
      } else if (category === "ucl") {
        filtered = filtered.filter((e) => e.competitionId === "uefa.champions" || e.competition.toLowerCase().includes("champions"));
      } else if (category === "uel") {
        filtered = filtered.filter((e) => e.competitionId === "uefa.europa" || e.competition.toLowerCase().includes("europa"));
      } else if (category === "laliga") {
        filtered = filtered.filter((e) => e.competitionId === "esp.1" || e.competition.toLowerCase().includes("la liga") || e.competition.toLowerCase().includes("spanish"));
      } else if (category === "seriea") {
        filtered = filtered.filter((e) => e.competitionId === "ita.1" || e.competition.toLowerCase().includes("serie a") || e.competition.toLowerCase().includes("italian"));
      } else if (category === "bundesliga") {
        filtered = filtered.filter((e) => e.competitionId === "ger.1" || e.competition.toLowerCase().includes("bundesliga") || e.competition.toLowerCase().includes("german"));
      } else if (category === "ligue1") {
        filtered = filtered.filter((e) => e.competitionId === "fra.1" || e.competition.toLowerCase().includes("ligue 1") || e.competition.toLowerCase().includes("french"));
      } else {
        filtered = filtered.filter((e) => e.sport === category);
      }
    }

    if (competition && competition !== "all") {
      filtered = filtered.filter((e) => e.competitionId === competition);
    }

    if (status && status !== "all") {
      filtered = filtered.filter((e) => e.status.toLowerCase() === status.toLowerCase());
    }

    const liveCount = allEvents.filter((e) => e.status === "LIVE").length;
    const upcomingCount = allEvents.filter((e) => e.status === "UPCOMING").length;

    return NextResponse.json({
      events: filtered,
      total: filtered.length,
      liveCount,
      upcomingCount,
      categories: SPORTS_CATEGORIES,
      competitions: POPULAR_COMPETITIONS,
      channels: SPORTS_LIVE_CHANNELS,
    });
  } catch (err: any) {
    console.error("Sports API Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch sports events", details: err?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || req.headers.get("x-admin-key");
    const providedKey = authHeader?.replace(/^Bearer\s+/i, "") || "";

    if (providedKey !== ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { action, event, eventId } = body;

    if (action === "create" || action === "update") {
      if (!event || !event.id || !event.homeTeam || !event.awayTeam) {
        return NextResponse.json({ error: "Invalid event payload" }, { status: 400 });
      }
      addCustomAdminEvent(event as SportsEvent);
      return NextResponse.json({ success: true, message: "Event saved successfully", event });
    }

    if (action === "delete") {
      if (!eventId) {
        return NextResponse.json({ error: "Missing eventId to delete" }, { status: 400 });
      }
      removeCustomAdminEvent(eventId);
      return NextResponse.json({ success: true, message: "Event removed successfully" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: "Admin operation failed", details: err?.message }, { status: 500 });
  }
}
