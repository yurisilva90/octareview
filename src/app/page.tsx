"use client";

import Link from "next/link";
import { useEffect } from "react";
import { withBasePath } from "@/lib/site";

export default function Home() {
  useEffect(() => {
    window.location.replace(withBasePath("/comercial/"));
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f3f7fa] p-6 text-center text-[#082944]">
      <div>
        <p className="text-sm text-[#708592]">Abrindo a OctaReview…</p>
        <Link href="/comercial" className="mt-4 inline-flex rounded-xl bg-[#075f6a] px-4 py-2 text-sm font-semibold text-white">Continuar</Link>
      </div>
    </main>
  );
}
