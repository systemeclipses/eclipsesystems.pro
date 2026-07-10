"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";

const storageKey = "eclipse-liked-posts";

export function BlogLikeButton({ postId, title, likes, className = "" }: { postId: string; title: string; likes: number; className?: string }) {
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]") as string[];
      setIsLiked(stored.includes(postId));
    } catch {
      setIsLiked(false);
    }
  }, [postId]);

  function toggleLike() {
    setIsLiked((current) => {
      const nextLiked = !current;
      try {
        const stored = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]") as string[];
        const next = nextLiked ? Array.from(new Set([...stored, postId])) : stored.filter((id) => id !== postId);
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // The interaction still works for this visit when storage is unavailable.
      }
      return nextLiked;
    });
  }

  return (
    <button
      type="button"
      onClick={toggleLike}
      aria-pressed={isLiked}
      aria-label={`${isLiked ? "Unlike" : "Like"} ${title}`}
      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 transition ${isLiked ? "bg-[#f1ddd5] text-[#8c493d]" : "hover:bg-[#eef1e5] hover:text-[#314839]"} ${className}`}
    >
      <Heart className={`h-4 w-4 transition ${isLiked ? "fill-current" : ""}`} />
      {likes + (isLiked ? 1 : 0)}
    </button>
  );
}
