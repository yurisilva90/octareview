"use client";

import { Camera, Play } from "lucide-react";

export default function BrandIcon({ type, className = "size-6" }: { type: string; className?: string }) {
  if (type === "instagram") return <span aria-hidden className={`grid place-items-center rounded-[28%] bg-[radial-gradient(circle_at_30%_105%,#feda75_0_12%,#fa7e1e_28%,#d62976_55%,#962fbf_76%,#4f5bd5_100%)] text-white ${className}`}><Camera className="size-[65%]" strokeWidth={2.5} /></span>;
  if (type === "facebook") return <span aria-hidden className={`grid place-items-center rounded-full bg-[#1877f2] font-sans text-[75%] font-black leading-none text-white ${className}`}>f</span>;
  if (type === "tiktok") return <span aria-hidden className={`grid place-items-center rounded-full bg-black font-sans text-[65%] font-black leading-none text-white shadow-[inset_1px_0_0_#25f4ee,inset_-1px_0_0_#fe2c55] ${className}`}>♪</span>;
  if (type === "youtube") return <span aria-hidden className={`grid place-items-center rounded-[28%] bg-[#ff0000] text-white ${className}`}><Play className="size-[55%] fill-current" /></span>;
  if (type === "linkedin") return <span aria-hidden className={`grid place-items-center rounded-[20%] bg-[#0a66c2] font-sans text-[48%] font-black leading-none text-white ${className}`}>in</span>;
  return null;
}
