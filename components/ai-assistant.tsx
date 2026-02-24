"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import hljs from "highlight.js";
import {
  Send,
  Loader2,
  Zap,
  X,
  Plus,
  Trash2,
  Copy,
  MessageSquare,
  AlertCircle,
  BookOpen,
  ChevronLeft,
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  tutorialId?: string;
  createdAt: number;
}

interface AIAssistantProps {
  isAdmin: boolean;
  tutorialTitle?: string;
  tutorialDescription?: string;
  currentStepTitle?: string;
  currentStepContent?: string;
  onClose: () => void;
  onOpenTutorials?: () => void;
  showToast: (msg: string) => void;
}

export default function AIAssistant({
  isAdmin,
  tutorialTitle,
  tutorialDescription,
  currentStepTitle,
  currentStepContent,
  onClose,
  onOpenTutorials,
  showToast,
}: AIAssistantProps) {
  // Chat sessions
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  // Current chat state
  const [aiInput, setAIInput] = useState("");
  const [aiStatus, setAIStatus] = useState<"ready" | "streaming">("ready");
  const [aiChatMode, setAIChatMode] = useState<"chat" | "debug" | "explain">("chat");
  const aiAbortRef = useRef<AbortController | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [loaded, setLoaded] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load sessions from public GitHub storage on mount
  useEffect(() => {
    async function loadChats() {
      try {
        const resp = await fetch("/api/chats");
        if (resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data.chats) && data.chats.length > 0) {
            setSessions(data.chats);
            setActiveSessionId(data.chats[0].id);
          }
        }
      } catch { /* fallback: no history */ }
      setLoaded(true);
    }
    loadChats();
  }, []);

  // Save sessions to public GitHub storage (debounced)
  useEffect(() => {
    if (!loaded || sessions.length === 0) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch("/api/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chats: sessions.slice(0, 100) }),
        });
      } catch { /* silent fail */ }
    }, 3000); // 3s debounce to avoid spamming GitHub API
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [sessions, loaded]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, activeSessionId]);

  // Focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, [activeSessionId]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;
  const activeMessages = activeSession?.messages || [];

  const createNewChat = useCallback(() => {
    const newSession: ChatSession = {
      id: `chat-${Date.now()}`,
      title: "New Chat",
      messages: [],
      tutorialId: undefined,
      createdAt: Date.now(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setAIInput("");
    setAIChatMode("chat");
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (filtered.length === 0) {
        localStorage.removeItem("xalhexi-ai-sessions");
      }
      return filtered;
    });
    if (activeSessionId === id) {
      setSessions((prev) => {
        if (prev.length > 0) setActiveSessionId(prev[0].id);
        else setActiveSessionId(null);
        return prev;
      });
    }
  }, [activeSessionId]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Copied!");
  };

  const handleSend = useCallback(async (textOverride?: string) => {
    const text = (textOverride || aiInput).trim();
    if (!text || aiStatus === "streaming") return;
    if (!textOverride) setAIInput("");

    // Create session if none active
    let sessionId = activeSessionId;
    if (!sessionId) {
      const newSession: ChatSession = {
        id: `chat-${Date.now()}`,
        title: text.length > 40 ? text.substring(0, 40) + "..." : text,
        messages: [],
        createdAt: Date.now(),
      };
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession.id);
      sessionId = newSession.id;
    }

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: text };
    const assistantMsg: ChatMessage = { id: `a-${Date.now()}`, role: "assistant", content: "" };

    // Update session title if first message
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === sessionId) {
          const isFirst = s.messages.length === 0;
          return {
            ...s,
            title: isFirst ? (text.length > 40 ? text.substring(0, 40) + "..." : text) : s.title,
            messages: [...s.messages, userMsg, assistantMsg],
          };
        }
        return s;
      })
    );

    setAIStatus("streaming");

    // Gather all messages for context
    const currentSession = sessions.find((s) => s.id === sessionId);
    const allMessages = [...(currentSession?.messages || []), userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      aiAbortRef.current = new AbortController();
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: allMessages,
          tutorialTitle: tutorialTitle || "",
          tutorialDescription: tutorialDescription || "",
          currentStepTitle: currentStepTitle || "",
          currentStepContent: currentStepContent || "",
          mode: aiChatMode,
        }),
        signal: aiAbortRef.current.signal,
      });

      if (!resp.ok) {
        let errMsg = "Something went wrong";
        try {
          const errText = await resp.text();
          // Try parse JSON error
          try { const j = JSON.parse(errText); errMsg = j.error || errText; } catch { errMsg = errText || `HTTP ${resp.status}`; }
        } catch { errMsg = `HTTP ${resp.status}`; }
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId
              ? { ...s, messages: s.messages.map((m) => (m.id === assistantMsg.id ? { ...m, content: `Sorry, I encountered an error: ${errMsg}` } : m)) }
              : s
          )
        );
        setAIStatus("ready");
        return;
      }

      const reader = resp.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) { setAIStatus("ready"); return; }

      let fullContent = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        // Plain text stream - just append the chunk directly
        fullContent += chunk;
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId
              ? { ...s, messages: s.messages.map((m) => (m.id === assistantMsg.id ? { ...m, content: fullContent } : m)) }
              : s
          )
        );
      }

      // If we got nothing at all, show a fallback
      if (!fullContent.trim()) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId
              ? { ...s, messages: s.messages.map((m) => (m.id === assistantMsg.id ? { ...m, content: "I received an empty response. Please try again." } : m)) }
              : s
          )
        );
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.name !== "AbortError") {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId
              ? { ...s, messages: s.messages.map((m) => (m.id === assistantMsg.id ? { ...m, content: `Error: ${e.message}` } : m)) }
              : s
          )
        );
      }
    } finally {
      setAIStatus("ready");
      aiAbortRef.current = null;
    }
  }, [aiInput, aiStatus, activeSessionId, sessions, tutorialTitle, tutorialDescription, currentStepTitle, currentStepContent, aiChatMode]);

  const handleQuickPrompt = (prompt: string, mode: "chat" | "debug" | "explain" = "chat") => {
    setAIChatMode(mode);
    setTimeout(() => handleSend(prompt), 50);
  };

  // Render markdown code blocks
  function renderContent(text: string) {
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, i) => {
      if (part.startsWith("```")) {
        const match = part.match(/```(\w+)?\n?([\s\S]*?)```/);
        if (match) {
          const lang = match[1] || "";
          const code = match[2].trim();
          let highlighted = code;
          try {
            highlighted = lang ? hljs.highlight(code, { language: lang }).value : hljs.highlightAuto(code).value;
          } catch { /* fallback */ }
          return (
            <div key={i} className="my-2 rounded-md overflow-hidden border border-[var(--t-border)]">
              <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--t-bg-tertiary)] text-xs text-[var(--t-text-faint)]">
                <span>{lang || "code"}</span>
                <button onClick={() => handleCopy(code)} className="flex items-center gap-1 hover:text-[var(--t-text-primary)] transition-colors">
                  <Copy className="w-3 h-3" /> Copy
                </button>
              </div>
              <pre className="p-3 bg-[var(--t-bg-primary)] overflow-x-auto text-xs">
                <code dangerouslySetInnerHTML={{ __html: highlighted }} />
              </pre>
            </div>
          );
        }
      }
      // Parse inline markdown: bold, italic, inline code
      const tokens = part.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
      return (
        <span key={i}>
          {tokens.map((tk, j) => {
            if (tk.startsWith("**") && tk.endsWith("**")) {
              return <strong key={j} className="font-semibold">{tk.slice(2, -2)}</strong>;
            }
            if (tk.startsWith("*") && tk.endsWith("*") && !tk.startsWith("**")) {
              return <em key={j}>{tk.slice(1, -1)}</em>;
            }
            if (tk.startsWith("`") && tk.endsWith("`")) {
              return (
                <code key={j} className="px-1.5 py-0.5 bg-[var(--t-bg-tertiary)] rounded text-[var(--t-accent-blue)] text-xs font-mono">
                  {tk.slice(1, -1)}
                </code>
              );
            }
            return <span key={j}>{tk}</span>;
          })}
        </span>
      );
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex bg-[var(--t-bg-primary)]">
      {/* Chat History Sidebar */}
      {showSidebar && (
        <div className="w-64 shrink-0 flex flex-col border-r border-[var(--t-border)] bg-[var(--t-bg-secondary)]">
          {/* Sidebar Header */}
          <div className="p-3 border-b border-[var(--t-border)]">
            <button
              onClick={createNewChat}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-[var(--t-accent-blue)] text-white hover:bg-[var(--t-accent-blue)]/80 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto py-2">
            {sessions.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <MessageSquare className="w-6 h-6 text-[var(--t-text-faint)] mx-auto mb-2 opacity-40" />
                <p className="text-xs text-[var(--t-text-faint)]">No chats yet</p>
              </div>
            ) : (
              <div className="space-y-0.5 px-2">
                <p className="px-2 py-1 text-[10px] uppercase tracking-wider text-[var(--t-text-faint)] font-semibold">Recent</p>
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`group flex items-center rounded-md transition-colors cursor-pointer ${
                      activeSessionId === session.id
                        ? "bg-[var(--t-bg-tertiary)] text-[var(--t-text-primary)]"
                        : "text-[var(--t-text-muted)] hover:bg-[var(--t-bg-tertiary)]/50"
                    }`}
                  >
                    <button
                      onClick={() => setActiveSessionId(session.id)}
                      className="flex-1 flex items-center gap-2 px-2 py-2 text-xs text-left truncate min-w-0"
                    >
                      <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-50" />
                      <span className="truncate">{session.title}</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-[#f85149] transition-all shrink-0"
                      title="Delete chat"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-[var(--t-border)] space-y-2">
            {onOpenTutorials && (
              <button
                onClick={onOpenTutorials}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs text-[var(--t-text-muted)] hover:bg-[var(--t-bg-tertiary)] transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Open Tutorials
              </button>
            )}
            <div className="flex items-center gap-2 px-2">
              <Zap className="w-3 h-3 text-[var(--t-accent-purple,#a78bfa)]" />
              <span className="text-[10px] text-[var(--t-text-faint)]">xalhexi AI</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--t-bg-secondary)] border-b border-[var(--t-border)]">
          <div className="flex items-center gap-3">
            {!showSidebar && (
              <button onClick={() => setShowSidebar(true)} className="p-1.5 hover:bg-[var(--t-bg-tertiary)] rounded transition-colors">
                <ChevronLeft className="w-4 h-4 text-[var(--t-text-muted)] rotate-180" />
              </button>
            )}
            {showSidebar && (
              <button onClick={() => setShowSidebar(false)} className="p-1.5 hover:bg-[var(--t-bg-tertiary)] rounded transition-colors">
                <ChevronLeft className="w-4 h-4 text-[var(--t-text-muted)]" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[var(--t-accent-purple,#a78bfa)]" />
              <span className="text-sm font-semibold text-[var(--t-text-primary)]">xalhexi AI</span>

            </div>

          </div>
          <div className="flex items-center gap-1">
            {isAdmin && activeMessages.length > 0 && (
              <button
                onClick={() => {
                  if (!activeSessionId) return;
                  setSessions((prev) => prev.map((s) => s.id === activeSessionId ? { ...s, messages: [] } : s));
                  showToast("Chat cleared");
                }}
                className="p-1.5 hover:bg-[var(--t-bg-tertiary)] rounded transition-colors"
                title="Clear messages"
              >
                <Trash2 className="w-4 h-4 text-[var(--t-text-muted)]" />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 hover:bg-[var(--t-bg-tertiary)] rounded transition-colors" title="Close AI">
              <X className="w-4 h-4 text-[var(--t-text-muted)]" />
            </button>
          </div>
        </div>

        {/* Quick Prompt Chips */}
        <div className="flex gap-1.5 px-4 py-2 border-b border-[var(--t-border)] overflow-x-auto">
          {[
            { label: "Debug error", mode: "debug" as const, prompt: "" },
            ...(currentStepTitle ? [{ label: "Explain this step", mode: "explain" as const, prompt: `Explain "${currentStepTitle}" briefly.` }] : []),
            { label: "Fix my code", mode: "chat" as const, prompt: "" },
            { label: "Quick example", mode: "chat" as const, prompt: `Give me a quick practical example${tutorialTitle ? ` for "${tutorialTitle}"` : ""}.` },
            { label: "Simplify", mode: "chat" as const, prompt: "Simplify your last answer. Shorter." },
          ].map((chip) => (
            <button
              key={chip.label}
              onClick={() => {
                if (chip.mode === "debug" || !chip.prompt) {
                  setAIChatMode(chip.mode === "debug" ? "debug" : "chat");
                  inputRef.current?.focus();
                } else {
                  handleQuickPrompt(chip.prompt, chip.mode);
                }
              }}
              className={`shrink-0 px-2.5 py-1 text-xs rounded-full border transition-colors ${
                chip.mode === "debug" && aiChatMode === "debug"
                  ? "border-[#f85149] text-[#f85149] bg-[#f85149]/10"
                  : "border-[var(--t-border)] text-[var(--t-text-muted)] hover:bg-[var(--t-bg-tertiary)] hover:text-[var(--t-text-primary)]"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="max-w-3xl mx-auto space-y-4">
            {activeMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-20">
                <Zap className="w-10 h-10 text-[var(--t-accent-purple,#a78bfa)] mb-4 opacity-30" />
                <p className="text-base text-[var(--t-text-muted)] mb-1">xalhexi AI</p>
                <p className="text-sm text-[var(--t-text-faint)] max-w-sm">
                  Ask anything. Code fixes, IT help, debugging, general questions. All chats are public and saved.
                </p>
              </div>
            )}
            {activeMessages.map((msg) => {
              if (!msg.content) return null;
              return (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-lg px-4 py-3 text-sm ${
                    msg.role === "user"
                      ? "bg-[var(--t-accent-blue)] text-white"
                      : "bg-[var(--t-bg-secondary)] border border-[var(--t-border)] text-[var(--t-text-primary)]"
                  }`}>
                    {msg.role === "user" ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="whitespace-pre-wrap leading-relaxed">{renderContent(msg.content)}</div>
                    )}
                    {msg.role === "assistant" && msg.content && (
                      <button
                        onClick={() => handleCopy(msg.content)}
                        className="mt-2 flex items-center gap-1 text-xs text-[var(--t-text-faint)] hover:text-[var(--t-text-muted)] transition-colors"
                      >
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {aiStatus === "streaming" && (
              <div className="flex justify-start">
                <div className="bg-[var(--t-bg-secondary)] border border-[var(--t-border)] rounded-lg px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--t-accent-purple,#a78bfa)]" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-[var(--t-border)] p-4">
          <div className="max-w-3xl mx-auto">
            {aiChatMode === "debug" && (
              <div className="flex items-center gap-1.5 mb-2 text-xs text-[#f85149]">
                <AlertCircle className="w-3 h-3" />
                <span>Debug Mode - Paste your error below</span>
                <button onClick={() => setAIChatMode("chat")} className="ml-auto text-[var(--t-text-faint)] hover:text-[var(--t-text-muted)]">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={aiInput}
                onChange={(e) => setAIInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={aiChatMode === "debug" ? "Paste your error message here..." : "Message xalhexi AI..."}
                className="flex-1 px-4 py-2.5 text-sm bg-[var(--t-bg-secondary)] border border-[var(--t-border)] rounded-lg text-[var(--t-text-primary)] placeholder:text-[var(--t-text-faint)] focus:outline-none focus:border-[var(--t-accent-blue)] transition-colors"
              />
              <button
                onClick={() => handleSend()}
                disabled={!aiInput.trim() || aiStatus === "streaming"}
                className="px-4 py-2.5 bg-[var(--t-accent-blue)] hover:bg-[var(--t-accent-blue)]/80 text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-[var(--t-text-faint)] text-center mt-2">
              xalhexi AI can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
