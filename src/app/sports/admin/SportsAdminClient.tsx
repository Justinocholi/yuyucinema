"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Plus,
  Trash2,
  Edit,
  Save,
  Server,
  Trophy,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Radio,
  Eye,
} from "lucide-react";
import { SportsEvent, SPORTS_CATEGORIES, POPULAR_COMPETITIONS } from "@/lib/sports";

export default function SportsAdminClient() {
  const [passkey, setPasskey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [events, setEvents] = useState<SportsEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Form State for New / Edited Event
  const [formEvent, setFormEvent] = useState<Partial<SportsEvent>>({
    sport: "football",
    competition: "English Premier League",
    competitionId: "eng.1",
    status: "LIVE",
    statusText: "60'",
    homeTeam: { name: "", score: 0 },
    awayTeam: { name: "", score: 0 },
    venue: "",
    isFeatured: false,
    streams: [
      { id: "srv-1", name: "Server 1 (VIP Ultra HD)", url: "https://cbsn-us-cedexis.cbsnstream.cbsnews.com/out/v1/55a864888f334590ab223048b61cf446/master.m3u8", type: "hls", quality: "1080p FHD", isOfficial: true },
      { id: "srv-2", name: "Server 2 (Global Sports CDN)", url: "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8", type: "hls", quality: "720p HD", isOfficial: true },
    ],
  });

  const [streamUrl1, setStreamUrl1] = useState("https://cbsn-us-cedexis.cbsnstream.cbsnews.com/out/v1/55a864888f334590ab223048b61cf446/master.m3u8");
  const [streamUrl2, setStreamUrl2] = useState("https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8");

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/sports");
      const d = await res.json();
      if (d.events) setEvents(d.events);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default passkey for verification or environment
    if (passkey.trim() === "yuyu-sports-admin-2026" || passkey.trim() === "admin") {
      setIsAuthenticated(true);
      setLoginError("");
      loadEvents();
    } else {
      setLoginError("Invalid Administrator Passkey. Access Denied.");
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEvent.homeTeam?.name || !formEvent.awayTeam?.name) {
      alert("Please enter both home and away team names.");
      return;
    }

    const eventId = formEvent.id || `custom-${Date.now()}`;
    const payload: SportsEvent = {
      id: eventId,
      sport: formEvent.sport || "football",
      competition: formEvent.competition || "Exhibition",
      competitionId: formEvent.competitionId,
      homeTeam: {
        name: formEvent.homeTeam.name,
        score: formEvent.homeTeam.score || 0,
      },
      awayTeam: {
        name: formEvent.awayTeam.name,
        score: formEvent.awayTeam.score || 0,
      },
      status: formEvent.status || "LIVE",
      statusText: formEvent.statusText || "LIVE",
      startTime: formEvent.startTime || new Date().toISOString(),
      venue: formEvent.venue,
      isFeatured: formEvent.isFeatured || false,
      streams: [
        { id: "srv-1", name: "Server 1 (VIP Ultra HD)", url: streamUrl1, type: streamUrl1.includes(".m3u8") ? "hls" : "embed", quality: "1080p FHD", isOfficial: true },
        { id: "srv-2", name: "Server 2 (Global Sports CDN)", url: streamUrl2, type: streamUrl2.includes(".m3u8") ? "hls" : "embed", quality: "720p HD", isOfficial: true },
      ],
    };

    try {
      const res = await fetch("/api/sports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer yuyu-sports-admin-2026`,
        },
        body: JSON.stringify({ action: "create", event: payload }),
      });
      const d = await res.json();
      if (d.success) {
        setStatusMessage("Sporting event and authorized streams saved successfully!");
        setTimeout(() => setStatusMessage(null), 3000);
        loadEvents();
        // Reset form
        setFormEvent({
          sport: "football",
          competition: "English Premier League",
          competitionId: "eng.1",
          status: "LIVE",
          statusText: "60'",
          homeTeam: { name: "", score: 0 },
          awayTeam: { name: "", score: 0 },
          venue: "",
          isFeatured: false,
        });
      } else {
        alert(d.error || "Save failed");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Are you sure you want to remove this event and its streams?")) return;
    try {
      const res = await fetch("/api/sports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer yuyu-sports-admin-2026`,
        },
        body: JSON.stringify({ action: "delete", eventId: id }),
      });
      const d = await res.json();
      if (d.success) {
        setStatusMessage("Event removed.");
        setTimeout(() => setStatusMessage(null), 3000);
        loadEvents();
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-20 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#0c1527]/85 border border-sky-500/20 backdrop-blur-xl shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Gateway</span>
            </span>
            <span className="text-xs text-sky-300 font-semibold">Authorized Personnel Only</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Sports Stream Management Portal
          </h1>
          <p className="text-xs text-yugito-muted">
            Configure live fixtures, manage multi-server stream URLs, and toggle authorized broadcasts.
          </p>
        </div>

        <Link
          href="/sports"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#101d36] hover:bg-[#152545] border border-sky-500/20 text-sky-300 text-xs font-semibold self-start sm:self-auto transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit to Sports</span>
        </Link>
      </div>

      {!isAuthenticated ? (
        /* Passkey Login Gate */
        <div className="max-w-md mx-auto p-8 rounded-3xl bg-[#0c1527]/90 border border-sky-500/25 shadow-2xl backdrop-blur-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white">Administrator Authentication</h2>
            <p className="text-xs text-yugito-muted">
              Enter your secure management passkey to access sports streaming controls.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                placeholder="Enter Admin Passkey..."
                className="w-full bg-[#101d36] text-white text-xs px-4 py-3 rounded-xl border border-sky-500/30 focus:border-sky-400 focus:outline-none"
                autoFocus
              />
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold text-xs shadow-lg shadow-sky-500/25 transition-all"
            >
              Verify Passkey & Access
            </button>
          </form>
        </div>
      ) : (
        /* Authenticated Admin Management Workspace */
        <div className="space-y-8">
          {statusMessage && (
            <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <CheckCircle className="w-4 h-4" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Create / Edit Form */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0c1527]/85 border border-sky-500/20 backdrop-blur-xl shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-sky-500/15">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-sky-400" />
                <h2 className="text-base font-bold text-white">Create / Update Sporting Event</h2>
              </div>
              <span className="text-xs text-sky-300 font-semibold">Authorized Source Control</span>
            </div>

            <form onSubmit={handleSaveEvent} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Sport Category */}
              <div>
                <label className="block text-yugito-muted font-bold uppercase mb-1">Sport Category</label>
                <select
                  value={formEvent.sport}
                  onChange={(e) => setFormEvent({ ...formEvent, sport: e.target.value as any })}
                  className="w-full bg-[#101d36] text-white p-2.5 rounded-xl border border-sky-500/30"
                >
                  {SPORTS_CATEGORIES.filter((c) => c.id !== "all").map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Competition */}
              <div>
                <label className="block text-yugito-muted font-bold uppercase mb-1">Competition / League</label>
                <input
                  type="text"
                  value={formEvent.competition}
                  onChange={(e) => setFormEvent({ ...formEvent, competition: e.target.value })}
                  placeholder="e.g. English Premier League, UEFA Champions League"
                  className="w-full bg-[#101d36] text-white p-2.5 rounded-xl border border-sky-500/30"
                />
              </div>

              {/* Home Team */}
              <div>
                <label className="block text-yugito-muted font-bold uppercase mb-1">Home Participant / Team</label>
                <input
                  type="text"
                  value={formEvent.homeTeam?.name || ""}
                  onChange={(e) =>
                    setFormEvent({
                      ...formEvent,
                      homeTeam: { ...formEvent.homeTeam, name: e.target.value },
                    })
                  }
                  placeholder="e.g. Arsenal"
                  className="w-full bg-[#101d36] text-white p-2.5 rounded-xl border border-sky-500/30"
                />
              </div>

              {/* Away Team */}
              <div>
                <label className="block text-yugito-muted font-bold uppercase mb-1">Away Participant / Team</label>
                <input
                  type="text"
                  value={formEvent.awayTeam?.name || ""}
                  onChange={(e) =>
                    setFormEvent({
                      ...formEvent,
                      awayTeam: { ...formEvent.awayTeam, name: e.target.value },
                    })
                  }
                  placeholder="e.g. Chelsea"
                  className="w-full bg-[#101d36] text-white p-2.5 rounded-xl border border-sky-500/30"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-yugito-muted font-bold uppercase mb-1">Event Status</label>
                <select
                  value={formEvent.status}
                  onChange={(e) => setFormEvent({ ...formEvent, status: e.target.value as any })}
                  className="w-full bg-[#101d36] text-white p-2.5 rounded-xl border border-sky-500/30"
                >
                  <option value="LIVE">LIVE (Ongoing)</option>
                  <option value="UPCOMING">UPCOMING (Scheduled)</option>
                  <option value="FINISHED">FINISHED (Post-Match)</option>
                </select>
              </div>

              {/* Match Clock / Status Text */}
              <div>
                <label className="block text-yugito-muted font-bold uppercase mb-1">Status Text / Match Clock</label>
                <input
                  type="text"
                  value={formEvent.statusText || ""}
                  onChange={(e) => setFormEvent({ ...formEvent, statusText: e.target.value })}
                  placeholder="e.g. 68', HT, Q3 04:12, Today 20:00"
                  className="w-full bg-[#101d36] text-white p-2.5 rounded-xl border border-sky-500/30"
                />
              </div>

              {/* Server 1 Stream URL */}
              <div className="md:col-span-2">
                <label className="block text-yugito-muted font-bold uppercase mb-1">
                  Server 1 Authorized Stream URL (HLS / M3U8 or Embed)
                </label>
                <input
                  type="text"
                  value={streamUrl1}
                  onChange={(e) => setStreamUrl1(e.target.value)}
                  placeholder="https://.../master.m3u8 or embed URL"
                  className="w-full bg-[#101d36] text-white p-2.5 rounded-xl border border-sky-500/30 font-mono text-[11px]"
                />
              </div>

              {/* Server 2 Stream URL */}
              <div className="md:col-span-2">
                <label className="block text-yugito-muted font-bold uppercase mb-1">
                  Server 2 Backup Stream URL
                </label>
                <input
                  type="text"
                  value={streamUrl2}
                  onChange={(e) => setStreamUrl2(e.target.value)}
                  placeholder="https://.../backup.m3u8"
                  className="w-full bg-[#101d36] text-white p-2.5 rounded-xl border border-sky-500/30 font-mono text-[11px]"
                />
              </div>

              {/* Featured Checkbox */}
              <div className="md:col-span-2 flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="featuredToggle"
                  checked={formEvent.isFeatured}
                  onChange={(e) => setFormEvent({ ...formEvent, isFeatured: e.target.checked })}
                  className="rounded border-sky-500/40 text-sky-500 focus:ring-sky-400"
                />
                <label htmlFor="featuredToggle" className="text-white font-semibold cursor-pointer">
                  Pin as Hero Featured Event on Sports Homepage
                </label>
              </div>

              <div className="md:col-span-2 pt-2">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold text-xs shadow-lg shadow-sky-500/25 transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Sporting Event</span>
                </button>
              </div>
            </form>
          </div>

          {/* Active Events List */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0c1527]/85 border border-sky-500/20 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-sky-500/15">
              <h2 className="text-base font-bold text-white">Configured Sporting Events ({events.length})</h2>
              <button
                type="button"
                onClick={loadEvents}
                className="text-xs text-sky-400 hover:text-white font-semibold"
              >
                Refresh List
              </button>
            </div>

            <div className="space-y-3">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sky-300 uppercase">{ev.competition}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ev.status === "LIVE" ? "bg-red-500/20 text-red-400" : "bg-white/10 text-yugito-muted"
                      }`}>
                        {ev.statusText || ev.status}
                      </span>
                      {ev.isFeatured && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                          FEATURED
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-bold text-white">
                      {ev.homeTeam.name} vs {ev.awayTeam.name}
                    </div>
                    <div className="text-[10px] text-yugito-subtle">
                      Streams: {ev.streams.length} available
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Link
                      href={`/sports/watch/${ev.id}`}
                      target="_blank"
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Test Stream</span>
                    </Link>

                    {ev.id.startsWith("custom-") && (
                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(ev.id)}
                        className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                        title="Delete custom event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
