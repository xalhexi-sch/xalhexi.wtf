"use client";

import { useState, useEffect, useRef } from "react";
import { useXThread, XThreadPost } from "@/lib/xthread-context";
import { formatDistanceToNow } from "date-fns";
import {
  MessageSquare,
  Share2,
  ChevronUp,
  ChevronDown,
  Plus,
  SlidersHorizontal,
  Hash,
  TrendingUp,
  Clock,
  Search,
  X,
  Check,
  Code,
  LogIn,
  UserPlus,
  LogOut,
  Copy,
  Bell,
  ArrowLeft,
  Paperclip,
  Download,
  FileCode,
  Edit3,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import Image from "next/image";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface Attachment {
  id: string;
  post_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  file_url: string;
  content?: string;
  created_at: string;
}

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message?: string;
  post_id?: string;
  is_read: boolean;
  created_at: string;
}

interface UserProfile {
  user: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
    bio?: string;
    created_at: string;
  };
  posts: XThreadPost[];
  stats: {
    posts: number;
    comments: number;
    upvotes: number;
  };
}

function CodeBlock({
  language,
  code,
  filename,
  isPreview = false,
}: {
  language: string;
  code: string;
  filename?: string;
  isPreview?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayCode = isPreview ? code.split("\n").slice(0, 8).join("\n") : code;
  const hasMore = isPreview && code.split("\n").length > 8;

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-white/10 bg-[#1e1e1e] shadow-lg">
      <div className="flex items-center justify-between bg-[#2d2d2d] px-4 py-2 text-xs font-medium text-gray-400">
        <div className="flex items-center gap-2">
          {filename && <span className="text-gray-300">{filename}</span>}
          <span className="rounded-md bg-indigo-500/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-indigo-400">
            {language}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
      <div className={`relative overflow-auto ${isPreview ? "max-h-52" : "max-h-[500px]"}`}>
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          customStyle={{ margin: 0, padding: "1rem", background: "transparent", fontSize: "13px", lineHeight: "1.5" }}
          showLineNumbers
          lineNumberStyle={{ minWidth: "2.5em", paddingRight: "1em", color: "#6e7681", textAlign: "right" }}
        >
          {displayCode}
        </SyntaxHighlighter>
        {hasMore && (
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#1e1e1e] to-transparent pointer-events-none" />
        )}
      </div>
    </div>
  );
}

function AttachmentBadge({ attachments, onClick }: { attachments: Attachment[]; onClick?: () => void }) {
  if (!attachments || attachments.length === 0) return null;
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-400 transition-colors hover:bg-orange-500/20"
    >
      <Paperclip className="h-3 w-3" />
      <span>
        {attachments.length} Attachment{attachments.length > 1 ? "s" : ""}
      </span>
    </button>
  );
}

function PostCard({
  post,
  onVote,
  onSelect,
  onProfileClick,
  currentUserId,
  onEdit,
  onDelete,
}: {
  post: XThreadPost;
  onVote: (id: string, type: 1 | -1) => void;
  onSelect: (post: XThreadPost) => void;
  onProfileClick: (username: string) => void;
  currentUserId?: string;
  onEdit?: (post: XThreadPost) => void;
  onDelete?: (postId: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/thread?post=${post.id}`);
  };

  let textContent = post.content;
  let codeBlocks: { language: string; code: string; filename?: string }[] = [];
  try {
    const parsed = JSON.parse(post.content);
    if (parsed.text && parsed.codeBlocks) {
      textContent = parsed.text;
      codeBlocks = parsed.codeBlocks;
    }
  } catch {
    // plain text
  }

  const isOwner = currentUserId === post.user_id;

  return (
    <article
      className="group relative flex gap-4 rounded-2xl border border-white/5 bg-[#161b22]/50 p-5 transition-all hover:border-white/10 hover:bg-[#161b22] hover:shadow-xl hover:shadow-black/20 cursor-pointer"
      onClick={() => onSelect(post)}
    >
      <div className="flex flex-col items-center gap-1 pt-1" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => onVote(post.id, 1)} className="rounded-md p-1 text-gray-500 hover:bg-white/5 hover:text-indigo-400 transition-colors">
          <ChevronUp className="h-6 w-6" />
        </button>
        <span className="text-sm font-bold text-gray-300">{post.upvotes - post.downvotes}</span>
        <button onClick={() => onVote(post.id, -1)} className="rounded-md p-1 text-gray-500 hover:bg-white/5 hover:text-orange-400 transition-colors">
          <ChevronDown className="h-6 w-6" />
        </button>
      </div>

      <div className="flex-1 min-w-0">
        <div className="mb-2 flex items-center gap-2 text-sm">
          <button
            onClick={(e) => { e.stopPropagation(); onProfileClick(post.author?.username || ""); }}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            {post.author?.avatar_url ? (
              <Image src={post.author.avatar_url} alt={post.author.display_name || post.author.username} width={24} height={24} className="rounded-full" />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-semibold text-white">
                {(post.author?.display_name || post.author?.username || "?")[0].toUpperCase()}
              </div>
            )}
            <span className="font-medium text-gray-200 hover:text-indigo-400 transition-colors">
              {post.author?.display_name || post.author?.username}
            </span>
          </button>
          <span className="text-gray-500">@{post.author?.username}</span>
          <span className="text-gray-600">{"·"}</span>
          <span className="text-gray-500">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
          {post.updated_at && post.updated_at !== post.created_at && <span className="text-gray-600 text-xs">(edited)</span>}
        </div>

        <h3 className="mb-2 text-lg font-semibold text-white group-hover:text-indigo-400 transition-colors">{post.title}</h3>
        <p className="mb-3 text-sm text-gray-400 line-clamp-2">{textContent}</p>

        {codeBlocks.length > 0 && (
          <div onClick={(e) => e.stopPropagation()}>
            <CodeBlock language={codeBlocks[0].language} code={codeBlocks[0].code} filename={codeBlocks[0].filename} isPreview />
          </div>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-gray-400">{tag}</span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 text-sm text-gray-500" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4" />
            <span>{post.comment_count} Comments</span>
          </div>
          <button onClick={handleShare} className="flex items-center gap-1.5 hover:text-gray-300 transition-colors">
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </button>
          <AttachmentBadge attachments={(post.attachments as Attachment[]) || []} />
          {isOwner && (
            <div className="relative ml-auto" ref={menuRef}>
              <button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} className="rounded-md p-1 hover:bg-white/10 transition-colors">
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-8 z-50 w-32 rounded-lg border border-white/10 bg-[#1c2128] py-1 shadow-xl">
                  <button onClick={(e) => { e.stopPropagation(); onEdit?.(post); setShowMenu(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5">
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Are you sure you want to delete this post?")) onDelete?.(post.id);
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-white/5"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function AuthModal({ isOpen, onClose, mode, onModeSwitch }: { isOpen: boolean; onClose: () => void; mode: "login" | "register"; onModeSwitch: () => void }) {
  const { login, register } = useXThread();
  const [formData, setFormData] = useState({ username: "", email: "", password: "", displayName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        const success = await login(formData.email, formData.password);
        if (success) onClose();
        else setError("Invalid email or password");
      } else {
        const success = await register(formData.username, formData.email, formData.password, formData.displayName || undefined);
        if (success) onClose();
        else setError("Registration failed. Username or email may already exist.");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1117] p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{mode === "login" ? "Sign In to Thread" : "Join Thread"}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <>
              <input type="text" placeholder="Username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none" required />
              <input type="text" placeholder="Display Name (optional)" value={formData.displayName} onChange={(e) => setFormData({ ...formData, displayName: e.target.value })} className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none" />
            </>
          )}
          <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none" required />
          <input type="password" placeholder="Password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none" required />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50">
            {loading ? "Loading..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-400">
          {mode === "login" ? "Don't have an account? " : "Already have an account? "}
          <button onClick={onModeSwitch} className="text-indigo-400 hover:underline">
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

function PostModal({ isOpen, onClose, editPost }: { isOpen: boolean; onClose: () => void; editPost?: XThreadPost | null }) {
  const { user, createPost, editPost: updatePost } = useXThread();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [tags, setTags] = useState("");
  const [codeBlocks, setCodeBlocks] = useState<{ language: string; code: string; filename?: string }[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [codeFilename, setCodeFilename] = useState("");
  const [codeLanguage, setCodeLanguage] = useState("typescript");
  const [codeContent, setCodeContent] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editPost) {
      setTitle(editPost.title);
      setCategory(editPost.category);
      setTags(editPost.tags?.join(", ") || "");
      try {
        const parsed = JSON.parse(editPost.content);
        if (parsed.text && parsed.codeBlocks) {
          setContent(parsed.text);
          setCodeBlocks(parsed.codeBlocks);
        } else {
          setContent(editPost.content);
        }
      } catch {
        setContent(editPost.content);
      }
    } else {
      setTitle("");
      setContent("");
      setCategory("general");
      setTags("");
      setCodeBlocks([]);
      setAttachments([]);
    }
  }, [editPost]);

  const handleAddCodeBlock = () => {
    if (codeContent.trim()) {
      setCodeBlocks([...codeBlocks, { language: codeLanguage, code: codeContent, filename: codeFilename || undefined }]);
      setCodeContent("");
      setCodeFilename("");
      setShowCodeEditor(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments([...attachments, ...files]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !content.trim()) return;
    setLoading(true);
    try {
      const tagArray = tags.split(",").map((t) => t.trim()).filter(Boolean);
      if (editPost) {
        await updatePost(editPost.id, { title, content, category, tags: tagArray, codeBlocks: codeBlocks.length > 0 ? codeBlocks : undefined });
      } else {
        const postId = await createPost(title, content, category, tagArray, codeBlocks.length > 0 ? codeBlocks : undefined);
        if (postId && attachments.length > 0) {
          for (const file of attachments) {
            const fileContent = await file.text();
            await fetch("/api/xthread/attachments", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ post_id: postId, filename: file.name, file_type: file.name.split(".").pop() || "txt", file_size: file.size, file_url: "", content: fileContent }),
            });
          }
        }
      }
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#0d1117] p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">{editPost ? "Edit Thread" : "Create New Thread"}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Thread title..." value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none" required />
          <textarea placeholder="What's on your mind?" value={content} onChange={(e) => setContent(e.target.value)} rows={4} className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none resize-none" required />

          {codeBlocks.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-400">Code Snippets</h4>
              {codeBlocks.map((block, i) => (
                <div key={i} className="relative">
                  <CodeBlock language={block.language} code={block.code} filename={block.filename} isPreview />
                  <button type="button" onClick={() => setCodeBlocks(codeBlocks.filter((_, idx) => idx !== i))} className="absolute right-2 top-2 rounded-md bg-red-500/20 p-1 text-red-400 hover:bg-red-500/30">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {showCodeEditor && (
            <div className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="flex gap-2">
                <input type="text" placeholder="filename.ts" value={codeFilename} onChange={(e) => setCodeFilename(e.target.value)} className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none" />
                <select value={codeLanguage} onChange={(e) => setCodeLanguage(e.target.value)} className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none">
                  <option value="typescript">TypeScript</option>
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="rust">Rust</option>
                  <option value="go">Go</option>
                  <option value="css">CSS</option>
                  <option value="html">HTML</option>
                  <option value="bash">Bash</option>
                  <option value="sql">SQL</option>
                </select>
              </div>
              <textarea placeholder="Paste your code here..." value={codeContent} onChange={(e) => setCodeContent(e.target.value)} rows={8} className="w-full rounded-md border border-white/10 bg-[#1e1e1e] px-3 py-2 font-mono text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none resize-none" />
              <div className="flex gap-2">
                <button type="button" onClick={handleAddCodeBlock} className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">Add Code</button>
                <button type="button" onClick={() => setShowCodeEditor(false)} className="rounded-md bg-white/10 px-3 py-1.5 text-sm font-medium text-gray-300 hover:bg-white/20">Cancel</button>
              </div>
            </div>
          )}

          {attachments.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-400">Attachments</h4>
              <div className="flex flex-wrap gap-2">
                {attachments.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-md bg-white/5 px-3 py-1.5 text-sm text-gray-300">
                    <FileCode className="h-4 w-4 text-indigo-400" />
                    {file.name}
                    <button type="button" onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))} className="text-gray-500 hover:text-red-400">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none">
              <option value="general">General</option>
              <option value="questions">Questions</option>
              <option value="showcase">Showcase</option>
              <option value="tutorial">Tutorial</option>
            </select>
            <input type="text" placeholder="Tags (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)} className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none" />
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setShowCodeEditor(true)} className="flex items-center gap-2 rounded-md bg-white/5 px-3 py-2 text-sm text-gray-300 hover:bg-white/10">
              <Code className="h-4 w-4" />
              Add Code
            </button>
            <label className="flex cursor-pointer items-center gap-2 rounded-md bg-white/5 px-3 py-2 text-sm text-gray-300 hover:bg-white/10">
              <Paperclip className="h-4 w-4" />
              Attach File
              <input type="file" onChange={handleFileUpload} accept=".js,.jsx,.ts,.tsx,.py,.rs,.go,.css,.html,.json,.sql,.md,.txt" className="hidden" multiple />
            </label>
          </div>

          <button type="submit" disabled={loading || !title.trim() || !content.trim()} className="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50">
            {loading ? "Posting..." : editPost ? "Save Changes" : "Post Thread"}
          </button>
        </form>
      </div>
    </div>
  );
}

function ProfileView({ profile, onClose, onPostSelect, currentUserId }: { profile: UserProfile; onClose: () => void; onPostSelect: (post: XThreadPost) => void; currentUserId?: string }) {
  const isOwnProfile = currentUserId === profile.user.id;

  return (
    <div className="w-full">
      <button onClick={onClose} className="mb-6 flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to threads
      </button>

      <div className="mb-6 rounded-2xl border border-white/10 bg-[#161b22] p-6">
        <div className="flex items-start gap-4">
          {profile.user.avatar_url ? (
            <Image src={profile.user.avatar_url} alt={profile.user.display_name || profile.user.username} width={80} height={80} className="rounded-full" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-2xl font-bold text-white">
              {(profile.user.display_name || profile.user.username)[0].toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">{profile.user.display_name || profile.user.username}</h2>
            <p className="text-gray-400">@{profile.user.username}</p>
            {profile.user.bio && <p className="mt-2 text-gray-300">{profile.user.bio}</p>}
            <p className="mt-2 text-sm text-gray-500">Joined {formatDistanceToNow(new Date(profile.user.created_at), { addSuffix: true })}</p>
          </div>
          {isOwnProfile && <button className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5">Edit Profile</button>}
        </div>
        <div className="mt-6 flex gap-6 border-t border-white/10 pt-4">
          <div className="text-center">
            <div className="text-xl font-bold text-white">{profile.stats.posts}</div>
            <div className="text-sm text-gray-400">Posts</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-white">{profile.stats.comments}</div>
            <div className="text-sm text-gray-400">Comments</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-white">{profile.stats.upvotes}</div>
            <div className="text-sm text-gray-400">Upvotes</div>
          </div>
        </div>
      </div>

      <h3 className="mb-4 text-lg font-semibold text-white">Posts by {profile.user.username}</h3>
      <div className="space-y-4">
        {profile.posts.length === 0 ? (
          <p className="text-gray-500">No posts yet.</p>
        ) : (
          profile.posts.map((post) => (
            <div key={post.id} onClick={() => onPostSelect(post)} className="cursor-pointer rounded-xl border border-white/5 bg-[#161b22]/50 p-4 transition-all hover:border-white/10 hover:bg-[#161b22]">
              <h4 className="font-semibold text-white">{post.title}</h4>
              <p className="mt-1 text-sm text-gray-400 line-clamp-2">{post.content}</p>
              <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                <span>{post.upvotes - post.downvotes} points</span>
                <span>{post.comment_count} comments</span>
                <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function NotificationsDropdown({ notifications, onClose, onMarkAllRead, onNotificationClick }: { notifications: Notification[]; onClose: () => void; onMarkAllRead: () => void; onNotificationClick: (n: Notification) => void }) {
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-white/10 bg-[#161b22] shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        <h3 className="font-semibold text-white">Notifications</h3>
        {unreadCount > 0 && (
          <button onClick={onMarkAllRead} className="text-xs text-indigo-400 hover:underline">Mark all read</button>
        )}
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="p-4 text-center text-sm text-gray-500">No notifications yet</p>
        ) : (
          notifications.map((n) => (
            <button key={n.id} onClick={() => onNotificationClick(n)} className={`w-full border-b border-white/5 p-4 text-left transition-colors hover:bg-white/5 ${!n.is_read ? "bg-indigo-500/5" : ""}`}>
              <div className="flex items-start gap-3">
                {!n.is_read && <div className="mt-1.5 h-2 w-2 rounded-full bg-indigo-500" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200">{n.title}</p>
                  {n.message && <p className="mt-1 text-xs text-gray-500 truncate">{n.message}</p>}
                  <p className="mt-1 text-xs text-gray-600">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function PostDetailView({ post, onClose, onVote, onProfileClick, currentUserId }: { post: XThreadPost; onClose: () => void; onVote: (id: string, type: 1 | -1) => void; onProfileClick: (username: string) => void; currentUserId?: string }) {
  const { user, addComment } = useXThread();
  const [comments, setComments] = useState<{ id: string; content: string; author: { username: string; display_name?: string }; created_at: string }[]>([]);
  const [newComment, setNewComment] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(true);

  let textContent = post.content;
  let codeBlocks: { language: string; code: string; filename?: string }[] = [];
  try {
    const parsed = JSON.parse(post.content);
    if (parsed.text && parsed.codeBlocks) {
      textContent = parsed.text;
      codeBlocks = parsed.codeBlocks;
    }
  } catch {
    // plain text
  }

  useEffect(() => {
    fetch(`/api/xthread/comments?postId=${post.id}`)
      .then((res) => res.json())
      .then((data) => setComments(data.comments || []))
      .catch(console.error);

    fetch(`/api/xthread/attachments?post_id=${post.id}`)
      .then((res) => res.json())
      .then((data) => {
        setAttachments(data || []);
        setLoadingAttachments(false);
      })
      .catch(() => setLoadingAttachments(false));
  }, [post.id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;
    await addComment(post.id, newComment);
    setComments([
      ...comments,
      { id: Date.now().toString(), content: newComment, author: { username: user.username, display_name: user.display_name }, created_at: new Date().toISOString() },
    ]);
    setNewComment("");

    if (post.user_id !== user.id) {
      await fetch("/api/xthread/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: post.user_id, type: "comment", title: `${user.display_name || user.username} commented on your post`, message: newComment.substring(0, 100), post_id: post.id, from_user_id: user.id }),
      });
    }
  };

  const downloadAttachment = (attachment: Attachment) => {
    if (attachment.content) {
      const blob = new Blob([attachment.content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="w-full">
      <button onClick={onClose} className="mb-6 flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to threads
      </button>

      <article className="rounded-2xl border border-white/10 bg-[#161b22] p-6">
        <div className="mb-4 flex items-center gap-3">
          <button onClick={() => onProfileClick(post.author?.username || "")} className="hover:opacity-80">
            {post.author?.avatar_url ? (
              <Image src={post.author.avatar_url} alt={post.author.display_name || post.author.username} width={40} height={40} className="rounded-full" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 font-semibold text-white">
                {(post.author?.display_name || post.author?.username || "?")[0].toUpperCase()}
              </div>
            )}
          </button>
          <div>
            <button onClick={() => onProfileClick(post.author?.username || "")} className="font-semibold text-white hover:text-indigo-400">{post.author?.display_name || post.author?.username}</button>
            <p className="text-sm text-gray-500">@{post.author?.username} {"·"} {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}{post.updated_at && post.updated_at !== post.created_at && " (edited)"}</p>
          </div>
        </div>

        <h1 className="mb-4 text-2xl font-bold text-white">{post.title}</h1>
        <div className="mb-4 text-gray-300 whitespace-pre-wrap">{textContent}</div>

        {codeBlocks.map((block, i) => (
          <CodeBlock key={i} language={block.language} code={block.code} filename={block.filename} />
        ))}

        {post.tags && post.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-white/5 px-3 py-1 text-sm text-gray-400">{tag}</span>
            ))}
          </div>
        )}

        {!loadingAttachments && attachments.length > 0 && (
          <div className="mb-4 space-y-2">
            <h4 className="text-sm font-medium text-gray-400">Attachments</h4>
            <div className="flex flex-wrap gap-2">
              {attachments.map((att) => (
                <button key={att.id} onClick={() => downloadAttachment(att)} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300 hover:bg-white/10 transition-colors">
                  <FileCode className="h-4 w-4 text-indigo-400" />
                  {att.filename}
                  <Download className="h-3 w-3 text-gray-500" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 border-t border-white/10 pt-4">
          <div className="flex items-center gap-2">
            <button onClick={() => onVote(post.id, 1)} className="rounded-md p-1.5 text-gray-400 hover:bg-white/5 hover:text-indigo-400"><ChevronUp className="h-5 w-5" /></button>
            <span className="font-semibold text-white">{post.upvotes - post.downvotes}</span>
            <button onClick={() => onVote(post.id, -1)} className="rounded-md p-1.5 text-gray-400 hover:bg-white/5 hover:text-orange-400"><ChevronDown className="h-5 w-5" /></button>
          </div>
          <div className="flex items-center gap-1.5 text-gray-400">
            <MessageSquare className="h-4 w-4" />
            <span>{comments.length} Comments</span>
          </div>
        </div>
      </article>

      <div className="mt-6">
        <h3 className="mb-4 text-lg font-semibold text-white">Comments</h3>
        {user ? (
          <form onSubmit={handleAddComment} className="mb-6">
            <textarea placeholder="Write a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} rows={3} className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none resize-none" />
            <button type="submit" disabled={!newComment.trim()} className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">Post Comment</button>
          </form>
        ) : (
          <p className="mb-6 text-gray-500">Sign in to comment</p>
        )}
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="rounded-lg border border-white/5 bg-[#161b22]/50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm">
                <span className="font-medium text-gray-200">{comment.author.display_name || comment.author.username}</span>
                <span className="text-gray-500">{"·"}</span>
                <span className="text-gray-500">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
              </div>
              <p className="text-gray-300">{comment.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function XThreadMain() {
  const { posts, user, logout, votePost, fetchPosts } = useXThread();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<XThreadPost | null>(null);
  const [editingPost, setEditingPost] = useState<XThreadPost | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"created_at" | "upvotes">("created_at");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [viewingProfile, setViewingProfile] = useState<UserProfile | null>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const categories = [
    { name: "All Threads", value: "all", icon: Hash },
    { name: "Popular", value: "trending", icon: TrendingUp },
    { name: "Recent", value: "recent", icon: Clock },
    { name: "Discussions", value: "discussions", icon: MessageSquare },
  ];

  const popularTags = ["react", "nextjs", "python", "typescript", "javascript", "rust", "css", "devops"];

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (user) {
      fetch(`/api/xthread/notifications?user_id=${user.id}`)
        .then((res) => res.json())
        .then((data) => setNotifications(data || []))
        .catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleVote = (postId: string, voteType: 1 | -1) => {
    if (!user) {
      setAuthMode("login");
      setShowAuthModal(true);
      return;
    }
    votePost(postId, voteType);
  };

  const handleProfileClick = async (username: string) => {
    if (!username) return;
    try {
      const res = await fetch(`/api/xthread/profile?username=${username}`);
      const data = await res.json();
      if (data.user) {
        setViewingProfile(data);
        setSelectedPost(null);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!user) return;
    try {
      await fetch(`/api/xthread/posts?postId=${postId}&userId=${user.id}`, { method: "DELETE" });
      fetchPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await fetch("/api/xthread/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id, mark_all_read: true }),
    });
    setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
  };

  const filteredPosts = posts
    .filter((post) => {
      if (searchQuery) return post.title.toLowerCase().includes(searchQuery.toLowerCase()) || post.content.toLowerCase().includes(searchQuery.toLowerCase());
      return true;
    })
    .filter((post) => {
      if (activeFilter === "all" || activeFilter === "trending" || activeFilter === "recent") return true;
      return post.category === activeFilter;
    })
    .sort((a, b) => {
      if (activeFilter === "trending" || sortBy === "upvotes") return b.upvotes - b.downvotes - (a.upvotes - a.downvotes);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div>
      {/* Top bar with search and user actions */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="hidden md:flex flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input type="text" placeholder="Search threads..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="relative" ref={notifRef}>
                <button onClick={() => setShowNotifications(!showNotifications)} className="relative rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{unreadCount > 9 ? "9+" : unreadCount}</span>}
                </button>
                {showNotifications && <NotificationsDropdown notifications={notifications} onClose={() => setShowNotifications(false)} onMarkAllRead={handleMarkAllRead} onNotificationClick={(n) => { if (n.post_id) { const p = posts.find((pp) => pp.id === n.post_id); if (p) setSelectedPost(p); } setShowNotifications(false); }} />}
              </div>
              <button onClick={() => handleProfileClick(user.username)} className="flex items-center gap-2 rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
                {user.avatar_url ? (
                  <Image src={user.avatar_url} alt={user.username} width={28} height={28} className="rounded-full" />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-semibold text-white">{(user.display_name || user.username)[0].toUpperCase()}</div>
                )}
              </button>
              <button onClick={logout} className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white transition-colors"><LogOut className="h-5 w-5" /></button>
            </>
          ) : (
            <>
              <button onClick={() => { setAuthMode("login"); setShowAuthModal(true); }} className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-gray-300 hover:bg-white/5 transition-colors"><LogIn className="h-4 w-4" />Sign In</button>
              <button onClick={() => { setAuthMode("register"); setShowAuthModal(true); }} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"><UserPlus className="h-4 w-4" />Sign Up</button>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-8">
        {/* Left Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          {user && (
            <div className="mb-6 rounded-2xl border border-white/10 bg-[#161b22] p-4">
              <div className="flex items-center gap-3 mb-3">
                {user.avatar_url ? (
                  <Image src={user.avatar_url} alt={user.username} width={48} height={48} className="rounded-full" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-lg font-bold text-white">{(user.display_name || user.username)[0].toUpperCase()}</div>
                )}
                <div>
                  <p className="font-semibold text-white">{user.display_name || user.username}</p>
                  <p className="text-sm text-gray-500">@{user.username}</p>
                </div>
              </div>
              <button onClick={() => setShowPostModal(true)} className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-700 transition-colors">
                <Plus className="h-4 w-4" />
                Create Thread
              </button>
            </div>
          )}
          <div className="mb-6">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Categories</h3>
            <nav className="space-y-1">
              {categories.map((cat) => (
                <button key={cat.value} onClick={() => { setActiveFilter(cat.value); setViewingProfile(null); setSelectedPost(null); }} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${activeFilter === cat.value ? "bg-indigo-600/20 text-indigo-400" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}>
                  <cat.icon className="h-4 w-4" />
                  {cat.name}
                </button>
              ))}
            </nav>
          </div>
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Popular Tags</h3>
            <div className="flex flex-wrap gap-2">
              {popularTags.map((tag) => (
                <button key={tag} onClick={() => setSearchQuery(tag)} className="rounded-full bg-white/5 px-3 py-1 text-xs text-gray-400 hover:bg-white/10 hover:text-white transition-colors">{"#"} {tag}</button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Feed */}
        <div className="flex-1 min-w-0">
          {viewingProfile ? (
            <ProfileView profile={viewingProfile} onClose={() => setViewingProfile(null)} onPostSelect={setSelectedPost} currentUserId={user?.id} />
          ) : selectedPost ? (
            <PostDetailView post={selectedPost} onClose={() => setSelectedPost(null)} onVote={handleVote} onProfileClick={handleProfileClick} currentUserId={user?.id} />
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-gray-500 md:hidden" />
                  <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-40 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none md:hidden" />
                </div>
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-gray-500" />
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "created_at" | "upvotes")} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white focus:border-indigo-500 focus:outline-none">
                    <option value="created_at">Newest</option>
                    <option value="upvotes">Most Popular</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {filteredPosts.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-[#161b22] p-12 text-center">
                    <p className="text-gray-400">No threads found</p>
                    {user && (
                      <button onClick={() => setShowPostModal(true)} className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Create the first thread</button>
                    )}
                  </div>
                ) : (
                  filteredPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onVote={handleVote}
                      onSelect={setSelectedPost}
                      onProfileClick={handleProfileClick}
                      currentUserId={user?.id}
                      onEdit={(p) => { setEditingPost(p); setShowPostModal(true); }}
                      onDelete={handleDeletePost}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* Right Sidebar */}
        <aside className="hidden xl:block w-72 flex-shrink-0">
          <div className="rounded-2xl border border-white/10 bg-[#161b22] p-4">
            <h3 className="mb-4 text-sm font-semibold text-gray-200">Popular Discussions</h3>
            <div className="space-y-3">
              {posts.slice(0, 5).map((post) => (
                <button key={post.id} onClick={() => setSelectedPost(post)} className="block w-full text-left">
                  <p className="text-sm text-gray-300 hover:text-white line-clamp-2">{post.title}</p>
                  <p className="mt-1 text-xs text-gray-500">{post.comment_count} comments</p>
                </button>
              ))}
              {posts.length === 0 && <p className="text-sm text-gray-500">No popular discussions</p>}
            </div>
          </div>
          {!user && (
            <div className="mt-6 rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 p-4">
              <h3 className="mb-2 font-semibold text-white">Join the Community</h3>
              <p className="mb-4 text-sm text-gray-400">Share your code, ask questions, and connect with developers worldwide.</p>
              <button onClick={() => { setAuthMode("register"); setShowAuthModal(true); }} className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700">Get Started</button>
            </div>
          )}
        </aside>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} mode={authMode} onModeSwitch={() => setAuthMode(authMode === "login" ? "register" : "login")} />
      <PostModal isOpen={showPostModal} onClose={() => { setShowPostModal(false); setEditingPost(null); fetchPosts(); }} editPost={editingPost} />

      {user && !selectedPost && !viewingProfile && (
        <button onClick={() => setShowPostModal(true)} className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 lg:hidden">
          <Plus className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
