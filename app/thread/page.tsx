"use client";

import { XThreadProvider } from "@/lib/xthread-context";
import XThreadMain from "@/components/xthread/XThreadMain";
import Link from "next/link";
import { ArrowLeft, MessageSquare } from "lucide-react";

export default function ThreadPage() {
  return (
    <div className="min-h-screen bg-[#0d1117]">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0d1117]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Main
              </Link>
              <div className="h-6 w-px bg-white/10" />
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                  <MessageSquare className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-bold text-white">Thread</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <XThreadProvider>
          <XThreadMain />
        </XThreadProvider>
      </main>
    </div>
  );
}
