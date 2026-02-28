"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";

export interface XThreadUser {
  id: string;
  username: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
}

export interface XThreadPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  upvotes: number;
  downvotes: number;
  comment_count: number;
  is_pinned: boolean;
  created_at: string;
  updated_at?: string;
  author?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
  codeBlocks?: { language: string; code: string; filename?: string }[];
  attachments?: { id: string; filename: string; file_type: string }[];
}

export interface XThreadComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  upvotes: number;
  downvotes: number;
  created_at: string;
  author: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}

interface XThreadContextType {
  user: XThreadUser | null;
  posts: XThreadPost[];
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string, displayName?: string) => Promise<boolean>;
  logout: () => void;
  fetchPosts: (options?: { page?: number; category?: string; sortBy?: string }) => Promise<void>;
  createPost: (title: string, content: string, category?: string, tags?: string[], codeBlocks?: { language: string; code: string; filename?: string }[]) => Promise<string | null>;
  editPost: (postId: string, data: { title?: string; content?: string; category?: string; tags?: string[]; codeBlocks?: { language: string; code: string; filename?: string }[] }) => Promise<boolean>;
  votePost: (postId: string, voteType: 1 | -1) => Promise<void>;
  addComment: (postId: string, content: string, parentId?: string) => Promise<boolean>;
}

const XThreadContext = createContext<XThreadContextType | null>(null);

export function XThreadProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<XThreadUser | null>(null);
  const [posts, setPosts] = useState<XThreadPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("xthread_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        /* ignore */
      }
    }
  }, []);

  const login = useCallback(async (usernameOrEmail: string, password: string): Promise<boolean> => {
    try {
      const resp = await fetch("/api/xthread/auth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernameOrEmail, password }),
      });
      const data = await resp.json();
      if (!resp.ok) return false;
      setUser(data.user);
      localStorage.setItem("xthread_user", JSON.stringify(data.user));
      return true;
    } catch {
      return false;
    }
  }, []);

  const register = useCallback(async (
    username: string,
    email: string,
    password: string,
    displayName?: string
  ): Promise<boolean> => {
    try {
      const resp = await fetch("/api/xthread/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, displayName }),
      });
      const data = await resp.json();
      if (!resp.ok) return false;
      setUser(data.user);
      localStorage.setItem("xthread_user", JSON.stringify(data.user));
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("xthread_user");
  }, []);

  const fetchPosts = useCallback(async (options?: { page?: number; category?: string; sortBy?: string }) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (options?.page) params.set("page", String(options.page));
      if (options?.category) params.set("category", options.category);
      if (options?.sortBy) params.set("sortBy", options.sortBy);
      const resp = await fetch(`/api/xthread/posts?${params.toString()}`);
      const data = await resp.json();
      if (resp.ok) {
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createPost = useCallback(async (
    title: string,
    content: string,
    category?: string,
    tags?: string[],
    codeBlocks?: { language: string; code: string; filename?: string }[]
  ): Promise<string | null> => {
    if (!user) return null;
    try {
      const resp = await fetch("/api/xthread/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, title, content, category, tags, codeBlocks }),
      });
      const data = await resp.json();
      if (!resp.ok) return null;
      setPosts((prev) => [data.post, ...prev]);
      return data.post?.id || null;
    } catch {
      return null;
    }
  }, [user]);

  const editPost = useCallback(async (
    postId: string,
    data: { title?: string; content?: string; category?: string; tags?: string[]; codeBlocks?: { language: string; code: string; filename?: string }[] }
  ): Promise<boolean> => {
    if (!user) return false;
    try {
      const resp = await fetch("/api/xthread/posts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, userId: user.id, ...data }),
      });
      if (!resp.ok) return false;
      const result = await resp.json();
      setPosts((prev) => prev.map((p) => (p.id === postId ? result.post : p)));
      return true;
    } catch {
      return false;
    }
  }, [user]);

  const votePost = useCallback(async (postId: string, voteType: 1 | -1) => {
    if (!user) return;
    try {
      const resp = await fetch("/api/xthread/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, postId, voteType }),
      });
      if (resp.ok) {
        fetchPosts();
      }
    } catch (error) {
      console.error("Error voting:", error);
    }
  }, [user, fetchPosts]);

  const addComment = useCallback(async (
    postId: string,
    content: string,
    parentId?: string
  ): Promise<boolean> => {
    if (!user) return false;
    try {
      const resp = await fetch("/api/xthread/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, postId, content, parentId }),
      });
      if (!resp.ok) return false;
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, comment_count: (p.comment_count || 0) + 1 } : p
        )
      );
      return true;
    } catch {
      return false;
    }
  }, [user]);

  return (
    <XThreadContext.Provider
      value={{ user, posts, isLoading, login, register, logout, fetchPosts, createPost, editPost, votePost, addComment }}
    >
      {children}
    </XThreadContext.Provider>
  );
}

export function useXThread() {
  const context = useContext(XThreadContext);
  if (!context) {
    throw new Error("useXThread must be used within an XThreadProvider");
  }
  return context;
}
