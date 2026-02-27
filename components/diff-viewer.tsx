"use client";

import { useState, useEffect } from "react";
import { X, Loader2, GitCompare } from "lucide-react";

interface DiffLine {
  type: "context" | "added" | "removed";
  content: string;
  oldNum?: number;
  newNum?: number;
}

interface DiffData {
  hasDiff: boolean;
  message?: string;
  diff?: DiffLine[];
  oldCommit?: { sha: string; message: string; date: string };
  newCommit?: { sha: string; message: string; date: string };
}

export default function DiffViewer({
  repo,
  filePath,
  onClose,
}: {
  repo: string;
  filePath: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<DiffData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const resp = await fetch(`/api/github/diff?repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(filePath)}`);
        const json = await resp.json();
        if (!resp.ok) {
          setError(json.error || "Failed to load diff");
        } else {
          setData(json);
        }
      } catch {
        setError("Failed to load diff");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [repo, filePath]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--t-bg-secondary)] rounded-lg border border-[var(--t-border)] w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--t-border)] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <GitCompare className="w-4 h-4 text-[var(--t-accent-blue)] shrink-0" />
            <span className="text-sm font-medium text-[var(--t-text-primary)] truncate">{filePath}</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[var(--t-bg-hover)] rounded shrink-0">
            <X className="w-5 h-5 text-[var(--t-text-muted)]" />
          </button>
        </div>

        {/* Commit info */}
        {data?.hasDiff && data.oldCommit && data.newCommit && (
          <div className="flex items-center gap-4 px-4 py-2 border-b border-[var(--t-border)] text-xs text-[var(--t-text-muted)] shrink-0 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="text-red-400">-</span>
              <code className="text-[var(--t-text-faint)]">{data.oldCommit.sha}</code>
              <span className="truncate max-w-[200px]">{data.oldCommit.message}</span>
            </span>
            <span className="text-[var(--t-text-faint)]">{'-->'}</span>
            <span className="flex items-center gap-1.5">
              <span className="text-green-400">+</span>
              <code className="text-[var(--t-text-faint)]">{data.newCommit.sha}</code>
              <span className="truncate max-w-[200px]">{data.newCommit.message}</span>
            </span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {loading && (
            <div className="flex items-center justify-center py-12 gap-2 text-[var(--t-text-muted)]">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading diff...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-12 text-[var(--t-text-muted)]">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {data && !data.hasDiff && (
            <div className="text-center py-12 text-[var(--t-text-muted)]">
              <GitCompare className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">{data.message || "No changes to show"}</p>
            </div>
          )}

          {data?.hasDiff && data.diff && (
            <pre className="text-xs font-mono leading-5">
              {data.diff.map((line, i) => (
                <div
                  key={i}
                  className={`flex ${
                    line.type === "added"
                      ? "bg-green-500/10"
                      : line.type === "removed"
                      ? "bg-red-500/10"
                      : ""
                  }`}
                >
                  <span className="inline-block w-10 text-right pr-1 text-[var(--t-text-faint)] select-none opacity-40 shrink-0">
                    {line.oldNum || ""}
                  </span>
                  <span className="inline-block w-10 text-right pr-1 text-[var(--t-text-faint)] select-none opacity-40 shrink-0">
                    {line.newNum || ""}
                  </span>
                  <span
                    className={`inline-block w-5 text-center shrink-0 select-none ${
                      line.type === "added"
                        ? "text-green-400"
                        : line.type === "removed"
                        ? "text-red-400"
                        : "text-[var(--t-text-faint)]"
                    }`}
                  >
                    {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
                  </span>
                  <span className="flex-1 whitespace-pre">{line.content}</span>
                </div>
              ))}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
