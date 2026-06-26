"use client";

import { useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

type MuteOnlyVideoProps = {
  src: string;
  poster?: string;
  className?: string;
};

export function MuteOnlyVideo({ src, poster, className }: MuteOnlyVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;

    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setMuted(nextMuted);

    if (video.paused) {
      void video.play();
    }
  }

  return (
    <div className="group relative">
      <style jsx global>{`
        .mute-only-video::-webkit-media-controls,
        .mute-only-video::-webkit-media-controls-panel,
        .mute-only-video::-webkit-media-controls-play-button,
        .mute-only-video::-webkit-media-controls-timeline,
        .mute-only-video::-webkit-media-controls-current-time-display,
        .mute-only-video::-webkit-media-controls-time-remaining-display,
        .mute-only-video::-webkit-media-controls-mute-button,
        .mute-only-video::-webkit-media-controls-volume-slider {
          display: none !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `}</style>
      <video
        ref={videoRef}
        className={["mute-only-video", className].filter(Boolean).join(" ")}
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        controls={false}
        controlsList="nodownload noplaybackrate nofullscreen"
        disablePictureInPicture
      />
      <button
        type="button"
        aria-label={muted ? "Unmute video" : "Mute video"}
        onClick={toggleMute}
        className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-[#f9e8d2] px-4 py-2 text-sm font-bold text-[#172219] opacity-0 shadow-xl shadow-black/35 transition hover:bg-white group-hover:opacity-100"
      >
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        {muted ? "Unmute" : "Mute"}
      </button>
    </div>
  );
}
