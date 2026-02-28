"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageCircle,
  X,
  Maximize2,
  Minimize2,
  Send,
  Paperclip,
  Download,
  Trash2,
  FileText,
  FileCode,
  FileArchive,
  File,
  Hash,
  Crown,
  User,
  Shield,
  ChevronDown,
} from "lucide-react";

interface CommunityMessage {
  id: string;
  channel: string;
  sender_name: string;
  sender_role: string;
  message: string | null;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  file_type: string | null;
  created_at: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string | null, name: string | null) {
  const ext = name?.split(".").pop()?.toLowerCase() || "";
  const codeExts = ["js", "ts", "tsx", "jsx", "py", "sh", "bash", "json", "yml", "yaml", "toml", "cfg", "conf", "env", "sql", "html", "css", "scss", "go", "rs", "java", "c", "cpp", "h", "rb", "php", "lua", "vue", "svelte"];
  const archiveExts = ["zip", "tar", "gz", "bz2", "7z", "rar", "xz", "tgz"];
  if (archiveExts.includes(ext)) return <FileArchive className="w-4 h-4" />;
  if (codeExts.includes(ext) || type?.includes("text/") || type?.includes("application/json")) return <FileCode className="w-4 h-4" />;
  if (type?.includes("pdf") || ext === "pdf" || ext === "doc" || ext === "docx" || ext === "ppt" || ext === "pptx") return <FileText className="w-4 h-4" />;
  return <File className="w-4 h-4" />;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function CommunityChat({
  isAdmin,
  isVip,
  userRole,
}: {
  isAdmin: boolean;
  isVip: boolean;
  userRole: "admin" | "vip" | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [channel, setChannel] = useState<"public" | "vip">("public");
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [chatName, setChatName] = useState("");
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [msgInput, setMsgInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load name from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem("xalhexi-chat-name");
    if (saved) setChatName(saved);
  }, []);

  // Fetch messages for current channel
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/community/messages?channel=${channel}&limit=100`);
      const data = await res.json();
      if (data.messages) {
        setMessages((prev) => {
          if (JSON.stringify(prev.map(m => m.id)) !== JSON.stringify(data.messages.map((m: CommunityMessage) => m.id))) {
            const newCount = data.messages.length - prev.length;
            if (!isOpen && newCount > 0 && prev.length > 0) {
              setUnreadCount((c) => c + newCount);
            }
            return data.messages;
          }
          return prev;
        });
      }
    } catch { /* ignore */ }
  }, [channel, isOpen]);

  // Poll messages every 4 seconds when open
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchMessages().finally(() => setLoading(false));
      pollRef.current = setInterval(fetchMessages, 4000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isOpen, fetchMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, autoScroll]);

  // Track scroll position for auto-scroll
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setAutoScroll(isNearBottom);
  };

  // Open chat
  const openChat = () => {
    setIsOpen(true);
    setUnreadCount(0);
    if (!chatName) setShowNamePrompt(true);
  };

  // Save name
  const saveName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setChatName(trimmed);
    sessionStorage.setItem("xalhexi-chat-name", trimmed);
    setShowNamePrompt(false);
  };

  // Send message
  const sendMessage = async (fileData?: { url: string; name: string; size: number; type: string }) => {
    if (!chatName) { setShowNamePrompt(true); return; }
    if (!msgInput.trim() && !fileData) return;

    setSending(true);
    try {
      const body: Record<string, unknown> = {
        channel,
        sender_name: chatName,
        sender_role: userRole || "user",
        message: msgInput.trim() || null,
      };
      if (fileData) {
        body.file_url = fileData.url;
        body.file_name = fileData.name;
        body.file_size = fileData.size;
        body.file_type = fileData.type;
      }
      const res = await fetch("/api/community/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setMsgInput("");
        setAutoScroll(true);
        await fetchMessages();
      }
    } catch { /* ignore */ }
    setSending(false);
  };

  // Upload file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!chatName) { setShowNamePrompt(true); return; }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/community/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.url) {
        await sendMessage({ url: data.url, name: data.filename, size: data.size, type: data.type });
      }
    } catch { /* ignore */ }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Admin delete message
  const deleteMessage = async (id: string) => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;
    try {
      await fetch("/api/community/messages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, token }),
      });
      await fetchMessages();
    } catch { /* ignore */ }
  };

  const getRoleIcon = (role: string) => {
    if (role === "admin") return <Shield className="w-3 h-3 text-[#f85149]" />;
    if (role === "vip") return <Crown className="w-3 h-3 text-amber-400" />;
    return null;
  };

  const getRoleColor = (role: string) => {
    if (role === "admin") return "text-[#f85149] font-semibold";
    if (role === "vip") return "text-amber-400 font-semibold";
    return "text-[var(--t-accent-blue)]";
  };

  // Chat bubble (floating button)
  if (!isOpen) {
    return (
      <button
        onClick={openChat}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[var(--t-accent-green)] hover:brightness-110 text-white shadow-lg flex items-center justify-center transition-all hover:scale-105"
        title="Community Chat"
      >
        <MessageCircle className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center px-1 text-[10px] font-bold bg-[#f85149] text-white rounded-full">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
    );
  }

  // Panel classes
  const panelClasses = isFullscreen
    ? "fixed inset-0 z-[90]"
    : "fixed bottom-6 right-6 z-[90] w-[400px] h-[550px] max-h-[80vh] rounded-xl shadow-2xl";

  return (
    <>
      {/* Click-outside backdrop (only when not fullscreen) */}
      {!isFullscreen && (
        <div
          className="fixed inset-0 z-[89]"
          onClick={() => { setIsOpen(false); setIsFullscreen(false); }}
        />
      )}
      <div className={`${panelClasses} flex flex-col bg-[var(--t-bg-secondary)] border border-[var(--t-border)] overflow-hidden ${isFullscreen ? "" : "rounded-xl"}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--t-border)] bg-[var(--t-bg-tertiary)] shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <MessageCircle className="w-5 h-5 text-[var(--t-accent-green)] shrink-0" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[var(--t-text-primary)]">Community Chat</h3>
            {chatName && (
              <button
                onClick={() => setShowNamePrompt(true)}
                className="text-[10px] text-[var(--t-text-faint)] hover:text-[var(--t-text-muted)] transition-colors"
              >
                as {chatName} (change)
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 hover:bg-[var(--t-bg-hover)] rounded transition-colors text-[var(--t-text-muted)]"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => { setIsOpen(false); setIsFullscreen(false); }}
            className="p-1.5 hover:bg-[var(--t-bg-hover)] rounded transition-colors text-[var(--t-text-muted)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Channel tabs */}
      <div className="flex border-b border-[var(--t-border)] shrink-0">
        <button
          onClick={() => setChannel("public")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
            channel === "public"
              ? "text-[var(--t-accent-green-text)] border-b-2 border-[var(--t-accent-green)] bg-[var(--t-accent-green)]/5"
              : "text-[var(--t-text-muted)] hover:text-[var(--t-text-primary)] hover:bg-[var(--t-bg-hover)]"
          }`}
        >
          <Hash className="w-3.5 h-3.5" />
          Public
        </button>
        {isVip && (
          <button
            onClick={() => setChannel("vip")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
              channel === "vip"
                ? "text-amber-400 border-b-2 border-amber-400 bg-amber-500/5"
                : "text-[var(--t-text-muted)] hover:text-[var(--t-text-primary)] hover:bg-[var(--t-bg-hover)]"
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            VIP
          </button>
        )}
      </div>

      {/* Name prompt overlay */}
      {showNamePrompt && (
        <div className="absolute inset-0 z-10 bg-[var(--t-bg-secondary)]/95 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-xs space-y-4 text-center">
            <User className="w-10 h-10 mx-auto text-[var(--t-accent-green)]" />
            <h3 className="text-lg font-semibold text-[var(--t-text-primary)]">What is your name?</h3>
            <p className="text-xs text-[var(--t-text-faint)]">This will be shown to others in chat. Saved until you close the browser.</p>
            <form onSubmit={(e) => { e.preventDefault(); saveName(); }} className="space-y-3">
              <input
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Enter your name..."
                className="w-full px-3 py-2 bg-[var(--t-bg-primary)] border border-[var(--t-border)] rounded-md text-sm text-[var(--t-text-primary)] placeholder-[var(--t-text-faint)] outline-none focus:ring-2 focus:ring-[var(--t-accent-green)] focus:border-[var(--t-accent-green)]"
                maxLength={30}
              />
              <div className="flex gap-2">
                {chatName && (
                  <button
                    type="button"
                    onClick={() => setShowNamePrompt(false)}
                    className="flex-1 px-3 py-2 text-sm bg-[var(--t-bg-tertiary)] hover:bg-[var(--t-bg-hover)] text-[var(--t-text-muted)] border border-[var(--t-border)] rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!nameInput.trim()}
                  className="flex-1 px-3 py-2 text-sm bg-[var(--t-accent-green)] hover:brightness-110 text-white rounded-md transition-all disabled:opacity-50"
                >
                  Start Chatting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-1 min-h-0"
      >
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-sm text-[var(--t-text-faint)] animate-pulse">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="w-10 h-10 text-[var(--t-text-faint)] opacity-30 mb-3" />
            <p className="text-sm text-[var(--t-text-faint)]">No messages yet in #{channel}</p>
            <p className="text-xs text-[var(--t-text-faint)] opacity-60 mt-1">Be the first to say something!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const prevMsg = i > 0 ? messages[i - 1] : null;
            const isSameAuthor = prevMsg && prevMsg.sender_name === msg.sender_name;
            const timeDiff = prevMsg ? new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() : Infinity;
            const showHeader = !isSameAuthor || timeDiff > 300000; // 5 min gap

            return (
              <div key={msg.id} className={`group ${showHeader ? "mt-3" : "mt-0.5"}`}>
                {showHeader && (
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {getRoleIcon(msg.sender_role)}
                    <span className={`text-xs ${getRoleColor(msg.sender_role)}`}>{msg.sender_name}</span>
                    <span className="text-[10px] text-[var(--t-text-faint)]">{timeAgo(msg.created_at)}</span>
                    {isAdmin && (
                      <button
                        onClick={() => deleteMessage(msg.id)}
                        className="ml-auto opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-500/10 rounded transition-all"
                        title="Delete message"
                      >
                        <Trash2 className="w-3 h-3 text-[#f85149]" />
                      </button>
                    )}
                  </div>
                )}
                <div className="pl-0">
                  {msg.message && (
                    <p className="text-sm text-[var(--t-text-primary)] break-words whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                  )}
                  {msg.file_url && (
                    <div className="mt-1 inline-flex items-center gap-2 px-3 py-2 bg-[var(--t-bg-tertiary)] border border-[var(--t-border)] rounded-lg max-w-full">
                      <span className="text-[var(--t-text-muted)] shrink-0">{getFileIcon(msg.file_type, msg.file_name)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-[var(--t-text-primary)] truncate">{msg.file_name}</div>
                        <div className="text-[10px] text-[var(--t-text-faint)]">
                          {msg.file_size ? formatFileSize(msg.file_size) : ""}
                          {msg.file_type ? ` \u00b7 ${msg.file_type.split("/").pop()}` : ""}
                        </div>
                      </div>
                      <a
                        href={msg.file_url}
                        download={msg.file_name || undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 hover:bg-[var(--t-bg-hover)] rounded transition-colors shrink-0"
                        title="Download file"
                      >
                        <Download className="w-3.5 h-3.5 text-[var(--t-accent-blue)]" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {!autoScroll && messages.length > 0 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2">
          <button
            onClick={() => {
              setAutoScroll(true);
              messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-[var(--t-bg-tertiary)] border border-[var(--t-border)] rounded-full shadow-lg text-[var(--t-text-muted)] hover:text-[var(--t-text-primary)] transition-colors"
          >
            <ChevronDown className="w-3 h-3" />
            New messages
          </button>
        </div>
      )}

      {/* Input area */}
      {chatName && !showNamePrompt && (
        <div className="border-t border-[var(--t-border)] px-3 py-2 shrink-0">
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
            className="flex items-end gap-2"
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="p-2 hover:bg-[var(--t-bg-hover)] rounded-md transition-colors text-[var(--t-text-muted)] shrink-0 disabled:opacity-50"
              title="Upload file"
            >
              <Paperclip className={`w-4 h-4 ${uploading ? "animate-pulse" : ""}`} />
            </button>
            <input
              value={msgInput}
              onChange={(e) => setMsgInput(e.target.value)}
              placeholder={`Message #${channel}...`}
              className="flex-1 px-3 py-2 bg-[var(--t-bg-primary)] border border-[var(--t-border)] rounded-md text-sm text-[var(--t-text-primary)] placeholder-[var(--t-text-faint)] outline-none focus:ring-1 focus:ring-[var(--t-accent-green)] focus:border-[var(--t-accent-green)]"
              disabled={sending || uploading}
            />
            <button
              type="submit"
              disabled={sending || uploading || (!msgInput.trim())}
              className="p-2 bg-[var(--t-accent-green)] hover:brightness-110 text-white rounded-md transition-all disabled:opacity-50 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          {uploading && (
            <div className="mt-1 text-[10px] text-[var(--t-text-faint)] animate-pulse">Uploading file...</div>
          )}
        </div>
      )}
    </div>
    </>
  );
}
