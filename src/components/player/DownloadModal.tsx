"use client";

import React, { useState } from "react";
import {
  Download,
  X,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Film,
  HardDrive,
  Subtitles,
  Sparkles,
} from "lucide-react";

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  streamUrl?: string;
  subtitlesUrl?: string;
  quality?: string;
  type?: "movie" | "episode";
}

export default function DownloadModal({
  isOpen,
  onClose,
  title,
  streamUrl,
  subtitlesUrl,
  quality = "1080p FHD",
  type = "movie",
}: DownloadModalProps) {
  const [selectedQuality, setSelectedQuality] = useState(quality);
  const [copiedStream, setCopiedStream] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);

  if (!isOpen) return null;

  const downloadTargetUrl = streamUrl || (typeof window !== "undefined" ? window.location.href : "");
  const cleanFilename = `${title.replace(/[^a-zA-Z0-9\s-_]/g, "").trim()} - ${selectedQuality}.mp4`;

  const handleCopyStream = () => {
    if (downloadTargetUrl) {
      navigator.clipboard.writeText(downloadTargetUrl);
      setCopiedStream(true);
      setTimeout(() => setCopiedStream(false), 2000);
    }
  };

  const handleCopyCommand = () => {
    const cmd = `curl -L "${downloadTargetUrl}" -o "${cleanFilename}"`;
    navigator.clipboard.writeText(cmd);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2000);
  };

  const handleDirectDownload = () => {
    setDownloadStarted(true);
    // Trigger download anchor
    const link = document.createElement("a");
    link.href = downloadTargetUrl;
    link.download = cleanFilename;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloadStarted(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* Modal Card */}
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0c1527]/95 border border-sky-500/30 shadow-2xl p-6 sm:p-7 space-y-6 text-white overflow-hidden">
        {/* Glow background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-sky-500/15 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-400/40 text-sky-400 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 uppercase">
                  Fast Downloader
                </span>
                <span className="text-xs text-sky-400 font-semibold">{selectedQuality}</span>
              </div>
              <h2 className="text-lg font-black text-white mt-0.5 line-clamp-1">{title}</h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-yugito-muted hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quality Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-sky-300 uppercase tracking-wider">
            Select Resolution:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "1080p FHD", label: "1080p", note: "Best Quality" },
              { id: "720p HD", label: "720p", note: "Balanced" },
              { id: "480p SD", label: "480p", note: "Fastest / Mobile" },
            ].map((q) => {
              const isSelected = selectedQuality === q.id;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setSelectedQuality(q.id)}
                  className={`p-2.5 rounded-2xl border text-center transition-all ${
                    isSelected
                      ? "bg-sky-500/25 border-sky-400 text-white shadow-md shadow-sky-500/20"
                      : "bg-[#101d36]/70 border-sky-500/15 text-yugito-muted hover:text-white hover:bg-white/5"
                  }`}
                >
                  <div className="text-xs font-black">{q.label}</div>
                  <div className="text-[10px] text-yugito-subtle">{q.note}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Primary Download Actions */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleDirectDownload}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-black text-sm shadow-xl shadow-sky-500/30 transition-all hover:scale-[1.02] active:scale-95 border border-sky-400/40"
          >
            {downloadStarted ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Download Triggered!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Direct Download ({selectedQuality})</span>
              </>
            )}
          </button>

          {/* Quick Copy Stream URL for IDM / 1DM / VLC */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={handleCopyStream}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#101d36]/80 hover:bg-[#152545] border border-sky-500/20 text-sky-200 transition-colors font-semibold"
            >
              {copiedStream ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied Link!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-sky-400" />
                  <span>Copy for IDM / VLC</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopyCommand}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#101d36]/80 hover:bg-[#152545] border border-sky-500/20 text-sky-200 transition-colors font-semibold"
            >
              {copiedCommand ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied Command!</span>
                </>
              ) : (
                <>
                  <HardDrive className="w-3.5 h-3.5 text-sky-400" />
                  <span>Copy cURL Command</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Subtitles Download (if available) */}
        {subtitlesUrl && (
          <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-sky-300 font-semibold">
              <Subtitles className="w-4 h-4 text-sky-400" />
              <span>English Subtitles (.VTT / .SRT)</span>
            </div>
            <a
              href={subtitlesUrl}
              download={`${title}.vtt`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-white font-bold text-[11px] border border-sky-400/30 transition-colors"
            >
              Save Subs
            </a>
          </div>
        )}

        {/* Download Guide Note */}
        <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1 text-[11px] text-yugito-muted">
          <div className="flex items-center gap-1.5 text-sky-300 font-bold">
            <Sparkles className="w-3 h-3 text-sky-400" />
            <span>High-Speed Download Tip</span>
          </div>
          <p>
            Paste the copied link directly into <strong>IDM (Internet Download Manager)</strong> or <strong>1DM</strong> on mobile for accelerated multi-threaded downloading at your maximum internet speed.
          </p>
        </div>
      </div>
    </div>
  );
}
