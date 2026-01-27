"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Minus } from "lucide-react";
import {
  Search,
  Copy,
  Check,
  Settings,
  LogOut,
  Plus,
  Trash2,
  Edit3,
  X,
  Github,
  BookOpen,
  ChevronRight,
  Terminal,
  Server,
  ExternalLink,
  Menu,
  Link2,
  Heart,
  AlertCircle,
  ImageIcon,
  Download,
  Upload,
  ArrowUp,
  ArrowDown,
  Type,
  Lock,
  Unlock,
  GripVertical,
  Monitor,
  Maximize2,
  Minimize2,
  RefreshCw,
} from "lucide-react";

interface StepImage {
  id: string;
  url: string;
  position: "before" | "after"; // before or after code
  caption?: string;
  captionPosition?: "top" | "bottom";
}

interface Step {
  id: string;
  heading: string;
  explanation: string;
  code: string;
  image?: string; // legacy single image support
  images?: StepImage[];
}

interface Tutorial {
  id: string;
  title: string;
  description: string;
  steps: Step[];
  locked?: boolean;
}

interface SearchResult {
  tutorialId: string;
  tutorialTitle: string;
  step: Step;
  matchType: "heading" | "code" | "explanation";
}

const defaultTutorials: Tutorial[] = [
  {
    id: "terminal-setup",
    title: "Setting Up Web Terminal (Admin)",
    description: "How to install and configure ttyd for web-based terminal access",
    locked: true,
    steps: [
      {
        id: "ts-1",
        heading: "Install ttyd on your VPS",
        explanation: "SSH into your VPS and install ttyd. This tool exposes a terminal session as a web page.",
        code: "# Ubuntu/Debian\nsudo apt update\nsudo apt install ttyd\n\n# Check version\nttyd --version",
      },
      {
        id: "ts-2",
        heading: "Kill existing ttyd process (if running)",
        explanation: "Before starting ttyd, make sure no other instance is using the port.",
        code: "# Kill any running ttyd\npkill ttyd\n\n# Or find and kill manually\nps aux | grep ttyd\nkill <PID>",
      },
      {
        id: "ts-3",
        heading: "Generate SSL Certificate (REQUIRED for HTTPS sites)",
        explanation: "Vercel uses HTTPS. Browsers block HTTP iframes in HTTPS pages. You MUST use SSL for embedding to work.",
        code: "# Generate self-signed certificate\nopenssl req -x509 -nodes -days 365 -newkey rsa:2048 \\\n  -keyout /root/ttyd-key.pem \\\n  -out /root/ttyd-cert.pem \\\n  -subj '/CN=localhost'\n\n# Or use Let's Encrypt for a real domain (recommended)",
      },
      {
        id: "ts-4",
        heading: "Run ttyd with SSL",
        explanation: "Start ttyd with SSL enabled and the -O flag to allow iframe embedding.",
        code: "# Run with SSL (REQUIRED for Vercel embedding)\nttyd -W -p 7681 -O \\\n  --ssl \\\n  --ssl-cert /root/ttyd-cert.pem \\\n  --ssl-key /root/ttyd-key.pem \\\n  bash\n\n# Run in background\nnohup ttyd -W -p 7681 -O --ssl --ssl-cert /root/ttyd-cert.pem --ssl-key /root/ttyd-key.pem bash &",
      },
      {
        id: "ts-5",
        heading: "With Authentication (Recommended)",
        explanation: "Add username/password protection to prevent unauthorized access.",
        code: "# With SSL + authentication\nttyd -W -p 7681 -O \\\n  --ssl \\\n  --ssl-cert /root/ttyd-cert.pem \\\n  --ssl-key /root/ttyd-key.pem \\\n  -c student:practice123 \\\n  bash",
      },
      {
        id: "ts-6",
        heading: "Configure Firewall",
        explanation: "Open the port on your VPS firewall.",
        code: "# UFW (Ubuntu)\nsudo ufw allow 7681\n\n# Or iptables\nsudo iptables -A INPUT -p tcp --dport 7681 -j ACCEPT",
      },
      {
        id: "ts-7",
        heading: "Test and Get Your URL",
        explanation: "First visit the URL directly in browser and accept the self-signed certificate warning. Then use this HTTPS URL in admin Terminal Settings.",
        code: "# Your terminal URL (MUST be HTTPS):\nhttps://YOUR_VPS_IP:7681\n\n# Example:\nhttps://104.64.209.151:7681\n\n# IMPORTANT: Visit this URL in browser first\n# and click 'Advanced' -> 'Proceed' to accept\n# the self-signed certificate!",
      },
    ],
  },
  {
    id: "1",
    title: "Getting Started with Git",
    description: "Learn the basics of version control with Git",
    steps: [
      {
        id: "1-1",
        heading: "Initialize a Repository",
        explanation: "Create a new Git repository in your project folder.",
        code: "git init",
      },
      {
        id: "1-2",
        heading: "Check Status",
        explanation: "See which files have been modified or staged.",
        code: "git status",
      },
      {
        id: "1-3",
        heading: "Stage Changes",
        explanation: "Add files to staging area before committing.",
        code: "git add .",
      },
      {
        id: "1-4",
        heading: "Commit Changes",
        explanation: "Save your staged changes with a descriptive message.",
        code: 'git commit -m "Your message"',
      },
    ],
  },
  {
    id: "2",
    title: "Git Branching",
    description: "Master branching strategies for collaboration",
    steps: [
      {
        id: "2-1",
        heading: "Create a Branch",
        explanation: "Create and switch to a new branch.",
        code: "git checkout -b feature-name",
      },
      {
        id: "2-2",
        heading: "Switch Branches",
        explanation: "Move between different branches.",
        code: "git checkout main",
      },
      {
        id: "2-3",
        heading: "Merge Branch",
        explanation: "Combine changes from another branch.",
        code: "git merge feature-name",
      },
    ],
  },
  {
    id: "3",
    title: "SSH Connection",
    description: "Connect to the ITP server via SSH",
    steps: [
      {
        id: "3-1",
        heading: "Basic SSH Command",
        explanation: "Connect to the server using your credentials.",
        code: "ssh it21_lastname@172.17.100.15 -p 9898",
      },
      {
        id: "3-2",
        heading: "First Time Setup",
        explanation: "Accept the fingerprint when prompted.",
        code: "# Type 'yes' when asked about authenticity",
      },
    ],
  },
  {
    id: "4",
    title: "SSH + GitHub SSH Setup (ed25519)",
    description: "Complete guide to SSH into server, generate ed25519 keys, configure GitHub SSH with Port 443, and set up Git",
    steps: [
      {
        id: "4-1",
        heading: "Connect to the Server",
        explanation: "Open Terminal and SSH into your school server. When prompted, type 'yes' if asked to continue connecting, then enter your password.",
        code: "ssh it21_lastname@172.17.100.15 -p 9898",
      },
      {
        id: "4-2",
        heading: "Switch to Bash (Optional)",
        explanation: "Switch to bash shell for better compatibility. This step is optional but recommended.",
        code: "bash",
      },
      {
        id: "4-3",
        heading: "Create .ssh Folder",
        explanation: "Create the .ssh directory if it doesn't exist and navigate into it. You can verify your location with pwd.",
        code: "mkdir -p ~/.ssh\ncd ~/.ssh\n\n# Optional: verify directory\npwd",
      },
      {
        id: "4-4",
        heading: "Generate SSH Key (ed25519)",
        explanation: "Generate a new SSH key using the ed25519 algorithm. Press Enter for default file location, and Enter again for no passphrase (or set one if you prefer).",
        code: 'ssh-keygen -t ed25519 -C "your_email@example.com"',
      },
      {
        id: "4-5",
        heading: "Show and Copy Public Key",
        explanation: "Display your public key and copy the entire output (starts with 'ssh-ed25519'). You'll need this for GitHub.",
        code: "cat ~/.ssh/id_ed25519.pub",
      },
      {
        id: "4-6",
        heading: "Add Public Key to GitHub",
        explanation: "On GitHub: Go to Settings > SSH and GPG keys > New SSH key. Give it a title like 'School Server Key', paste your public key, and click 'Add SSH key'.",
        code: "# No terminal command needed\n# 1. Go to GitHub Settings\n# 2. Click 'SSH and GPG keys'\n# 3. Click 'New SSH key'\n# 4. Title: School Server Key\n# 5. Paste your public key\n# 6. Click 'Add SSH key'",
      },
      {
        id: "4-7",
        heading: "Configure SSH for Port 443",
        explanation: "Create/edit the SSH config file to force GitHub SSH connections through Port 443. This bypasses firewall restrictions. Use Ctrl+O then Enter to save, and Ctrl+X to exit nano.",
        code: "nano ~/.ssh/config\n\n# Paste this content:\nHost github.com\n  HostName ssh.github.com\n  User git\n  Port 443\n  IdentityFile ~/.ssh/id_ed25519",
      },
      {
        id: "4-8",
        heading: "Fix SSH Permissions",
        explanation: "Set the correct permissions for your SSH files. This is important for security and proper SSH operation.",
        code: "chmod 700 ~/.ssh\nchmod 600 ~/.ssh/config\nchmod 600 ~/.ssh/id_ed25519\nchmod 644 ~/.ssh/id_ed25519.pub",
      },
      {
        id: "4-9",
        heading: "Set Git Global Config",
        explanation: "Configure Git with your name and email so your commits are properly attributed. Optionally set 'main' as your default branch.",
        code: 'git config --global user.name "Your Full Name"\ngit config --global user.email "your_email@example.com"\n\n# Optional: set default branch to main\ngit config --global init.defaultBranch main\n\n# Optional: verify your config\ngit config --global --list',
      },
      {
        id: "4-10",
        heading: "Verify GitHub SSH Connection",
        explanation: "Test your SSH connection to GitHub. If successful, you'll see a message like 'Hi USERNAME! You've successfully authenticated...' Type 'yes' if asked to trust the host.",
        code: "ssh -T git@github.com",
      },
      {
        id: "4-11",
        heading: "Return Home and Exit",
        explanation: "Navigate back to your home directory and exit the server when you're done. Remember: never share your private key (id_ed25519), only share the public key (id_ed25519.pub).",
        code: "cd ~\npwd  # Optional: confirm location\n\n# When done, exit the server\nexit",
      },
    ],
  },
  {
    id: "5",
    title: "Git Basics: Create Repo & Push",
    description: "Create a new repository, add files, commit changes, and push to GitHub",
    steps: [
      {
        id: "5-1",
        heading: "Create Project Folder",
        explanation: "Create a project folder and navigate into it. Use pwd to verify your location.",
        code: "mkdir my-project\ncd my-project\n\n# Optional: check where you are\npwd",
      },
      {
        id: "5-2",
        heading: "Initialize Git Repository",
        explanation: "Initialize Git in the folder and set the branch to 'main' (recommended).",
        code: "git init\n\n# Set branch to main\ngit branch -M main",
      },
      {
        id: "5-3",
        heading: "Create Files",
        explanation: "Create a README file using nano. Save with Ctrl+O then Enter, exit with Ctrl+X. You can also create files quickly with echo.",
        code: "# Create README with nano\nnano README.md\n\n# Or create file quickly\necho \"Hello world\" > hello.txt\n\n# Check your files\nls",
      },
      {
        id: "5-4",
        heading: "Check Status & Stage Files",
        explanation: "Check Git status to see untracked files, then add them to staging area.",
        code: "git status\n\n# Add all files\ngit add .\n\n# Or add specific file\ngit add README.md\n\n# Check status again\ngit status",
      },
      {
        id: "5-5",
        heading: "Commit Changes",
        explanation: "Commit your staged changes with a descriptive message.",
        code: "git commit -m \"Initial commit\"",
      },
      {
        id: "5-6",
        heading: "Create GitHub Repo & Connect",
        explanation: "On GitHub: Click 'New repository', name it, do NOT initialize with README. Copy the SSH link and connect your local repo.",
        code: "# Add remote (replace USERNAME and my-project)\ngit remote add origin git@github.com:USERNAME/my-project.git\n\n# Verify remote\ngit remote -v",
      },
      {
        id: "5-7",
        heading: "Push to GitHub",
        explanation: "Push your commits to GitHub. The -u flag sets upstream, so future pushes only need 'git push'.",
        code: "git push -u origin main\n\n# Future pushes:\ngit push",
      },
      {
        id: "5-8",
        heading: "Normal Workflow",
        explanation: "After initial setup, use this workflow when you make changes: status, add, commit, push.",
        code: "git status\ngit add .\ngit commit -m \"Describe what you changed\"\ngit push",
      },
    ],
  },
  {
    id: "6",
    title: "Clone Existing Repo from GitHub",
    description: "How to clone an existing repository and start working on it",
    steps: [
      {
        id: "6-1",
        heading: "Navigate to Projects Folder",
        explanation: "Go to the folder where you want the repo to be downloaded. Create a projects folder if needed.",
        code: "# Go to home directory\ncd ~\n\n# Or create a projects folder\nmkdir -p ~/projects\ncd ~/projects",
      },
      {
        id: "6-2",
        heading: "Clone the Repository",
        explanation: "Copy the SSH link from GitHub and clone the repo. This creates a folder with the repo name.",
        code: "# Clone using SSH (recommended)\ngit clone git@github.com:USERNAME/REPO_NAME.git\n\n# Example:\ngit clone git@github.com:octocat/Hello-World.git",
      },
      {
        id: "6-3",
        heading: "Enter & Verify",
        explanation: "Enter the cloned repo folder and verify the remote and branch.",
        code: "cd REPO_NAME\n\n# Check remote\ngit remote -v\n\n# Check branch\ngit branch",
      },
      {
        id: "6-4",
        heading: "Make Changes & Push",
        explanation: "Create or edit files, then stage, commit, and push your changes.",
        code: "# Create/edit a file\nnano notes.txt\n\n# Stage, commit, push\ngit add .\ngit commit -m \"Add notes\"\ngit push",
      },
      {
        id: "6-5",
        heading: "Useful Commands",
        explanation: "Handy commands for checking history, changes, and syncing with remote.",
        code: "# Check commit history\ngit log --oneline\n\n# See file changes\ngit diff\n\n# Pull latest updates\ngit pull\n\n# Check current branch\ngit branch",
      },
    ],
  },
  {
    id: "7",
    title: "Ubuntu: Rename & Move Files",
    description: "How to rename files and move them between folders in Ubuntu",
    steps: [
      {
        id: "7-1",
        heading: "Rename a File",
        explanation: "Use mv command to rename files. Same syntax works for folders.",
        code: "# Rename a file\nmv oldname.txt newname.txt\n\n# Example\nmv notes.txt notes-final.txt\n\n# Rename a folder\nmv oldfolder newfolder",
      },
      {
        id: "7-2",
        heading: "Move File to Parent Folder",
        explanation: "Use ../ to reference the parent folder. Move files one level up with mv.",
        code: "# Move file one level up\nmv file.txt ../\n\n# Move folder one level up\nmv myfolder ../\n\n# Move multiple files up\nmv a.txt b.txt c.txt ../",
      },
      {
        id: "7-3",
        heading: "Move Multiple Levels Up",
        explanation: "Use multiple ../ to go up several levels. Each ../ goes up one folder.",
        code: "# ../ = up 1 folder\n# ../../ = up 2 folders\n# ../../../ = up 3 folders\n\n# Move file up 2 levels\nmv file.txt ../../",
      },
      {
        id: "7-4",
        heading: "Move File Into Another Folder",
        explanation: "Move a file into a subfolder by specifying the folder name.",
        code: "mv file.txt foldername/\n\n# Example\nmv hello.txt src/",
      },
      {
        id: "7-5",
        heading: "Check Location & List Files",
        explanation: "Helpful commands to see where you are and what files exist.",
        code: "# Print working directory\npwd\n\n# List files\nls\n\n# List all files with details\nls -la",
      },
    ],
  },
  {
    id: "8",
    title: "Check GitHub Repo Contributors",
    description: "Three ways to check contributors of a GitHub repository",
    steps: [
      {
        id: "8-1",
        heading: "GitHub Web (Easiest)",
        explanation: "The simplest way - use the GitHub website to view contributors.",
        code: "# No terminal needed\n# On the repo page:\n# 1. Click 'Insights' tab\n# 2. Click 'Contributors' in sidebar",
      },
      {
        id: "8-2",
        heading: "Using Git Log",
        explanation: "Use git shortlog to see contributors and their commit counts. Works without GitHub CLI.",
        code: "# Inside the repo folder:\ngit shortlog -s -n\n\n# -s = show commit counts only\n# -n = sort by number of commits\n\n# Show names + emails:\ngit shortlog -sne",
      },
      {
        id: "8-3",
        heading: "Install GitHub CLI",
        explanation: "Install the GitHub CLI (gh) if not already installed, then login.",
        code: "# Check if installed\ngh --version\n\n# Install on Ubuntu\nsudo apt update\nsudo apt install gh -y\n\n# Login to GitHub\ngh auth login",
      },
      {
        id: "8-4",
        heading: "Using GitHub CLI",
        explanation: "Use gh api to fetch contributor data. Works for public repos or repos you have access to.",
        code: "# Get contributors\ngh api repos/OWNER/REPO/contributors\n\n# Show only usernames\ngh api repos/OWNER/REPO/contributors --jq '.[].login'\n\n# Show username + contributions\ngh api repos/OWNER/REPO/contributors --jq '.[] | \"\\(.login) - \\(.contributions)\"'",
      },
      {
        id: "8-5",
        heading: "Quick Tip for Screenshots",
        explanation: "If you need screenshot proof for a teacher, this command clearly shows contributors with commit counts.",
        code: "git shortlog -sne",
      },
    ],
  },
  {
    id: "9",
    title: "Common Git Errors & Fixes",
    description: "Quick fixes for common Git errors you might encounter",
    steps: [
      {
        id: "9-1",
        heading: "Permission Denied (publickey)",
        explanation: "This error means your SSH key is not set up or not added to GitHub.",
        code: "# Test SSH connection\nssh -T git@github.com\n\n# If it fails, check your SSH key setup\n# Refer to the SSH + GitHub Setup tutorial",
      },
      {
        id: "9-2",
        heading: "Remote Origin Already Exists",
        explanation: "Remove the existing remote and add it again with the correct URL.",
        code: "# Remove existing remote\ngit remote remove origin\n\n# Add new remote\ngit remote add origin git@github.com:USERNAME/REPO_NAME.git",
      },
      {
        id: "9-3",
        heading: "Branch is Master Instead of Main",
        explanation: "Rename your local branch to main and push to the main branch.",
        code: "# Rename branch to main\ngit branch -M main\n\n# Push to main\ngit push -u origin main",
      },
    ],
  },
];

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

// Toast notification
function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      className={`fixed bottom-5 left-1/2 -translate-x-1/2 bg-[#238636] text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all duration-300 z-50 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
      }`}
    >
      <Check className="w-4 h-4" />
      {message}
    </div>
  );
}

// Discord-style image lightbox - double click to zoom, scroll to zoom, drag to pan
function ImageLightbox({ 
  src, 
  alt, 
  isOpen, 
  onClose 
}: { 
  src: string; 
  alt: string; 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setScale(s => Math.min(Math.max(s + delta, 1), 8));
  };

  const handleDoubleClick = () => {
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(3);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  if (!isOpen) return null;

  const handleClick = (e: React.MouseEvent) => {
    // Close if clicking outside the image (on backdrop)
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center overflow-hidden"
      onClick={handleClick}
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src || "/placeholder.svg"}
        alt={alt}
        className="select-none"
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        style={{ 
          transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
          transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          maxWidth: '100vw',
          maxHeight: '100vh',
          objectFit: 'contain'
        }}
        draggable={false}
      />
    </div>
  );
}

// Image display component - simple and direct with lightbox
function StepImageDisplay({ img, altText }: { img: StepImage; altText: string }) {
  const [error, setError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Reset error when URL changes
  useEffect(() => {
    setError(false);
  }, [img.url]);

  if (!img.url) return null;

  const showTopCaption = img.caption && img.captionPosition === 'top';
  const showBottomCaption = img.caption && img.captionPosition !== 'top';

  return (
    <>
      <div className="rounded-md border border-[#30363d] overflow-hidden bg-[#0d1117]">
        {showTopCaption && (
          <div className="px-3 py-2 border-b border-[#30363d] bg-[#161b22]">
            <p className="text-xs text-[#8b949e] italic">{img.caption}</p>
          </div>
        )}
        <div className="p-2">
          {error ? (
            <div className="min-h-[60px] flex items-center justify-center text-xs text-[#f85149] gap-1">
              <AlertCircle className="w-4 h-4" />
              Failed to load image
            </div>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={img.url || "/placeholder.svg"}
              alt={altText}
              className="max-w-full h-auto rounded mx-auto block cursor-pointer hover:opacity-90 transition-opacity"
              style={{ maxHeight: '400px', objectFit: 'contain' }}
              onError={() => setError(true)}
              onClick={() => setLightboxOpen(true)}
              title="Click to enlarge"
            />
          )}
        </div>
        {showBottomCaption && (
          <div className="px-3 py-2 border-t border-[#30363d] bg-[#161b22]">
            <p className="text-xs text-[#8b949e] italic">{img.caption}</p>
          </div>
        )}
      </div>
      
      <ImageLightbox 
        src={img.url || "/placeholder.svg"} 
        alt={altText} 
        isOpen={lightboxOpen} 
        onClose={() => setLightboxOpen(false)} 
      />
    </>
  );
}

// Syntax highlighting helper
function highlightSyntax(code: string): React.ReactNode[] {
  const lines = code.split('\n');
  return lines.map((line, lineIndex) => {
    // Parse each line for syntax highlighting
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let keyIndex = 0;

    // Comment (starts with #)
    if (remaining.trim().startsWith('#')) {
      parts.push(<span key={keyIndex++} className="text-[#8b949e] italic">{remaining}</span>);
      remaining = '';
    }

    // Process keywords and patterns
    while (remaining.length > 0) {
      // String patterns (double or single quotes)
      const stringMatch = remaining.match(/^("[^"]*"|'[^']*')/);
      if (stringMatch) {
        parts.push(<span key={keyIndex++} className="text-[#a5d6ff]">{stringMatch[0]}</span>);
        remaining = remaining.slice(stringMatch[0].length);
        continue;
      }

      // Git/SSH commands (at start of line or after space)
      const cmdMatch = remaining.match(/^(git|ssh|cd|ls|mkdir|rm|cp|mv|cat|echo|npm|yarn|pnpm|node|python|pip|sudo|apt|brew|chmod|chown|touch|nano|vim|code)\b/);
      if (cmdMatch && (parts.length === 0 || remaining === line.slice(line.indexOf(cmdMatch[0])))) {
        parts.push(<span key={keyIndex++} className="text-[#ff7b72]">{cmdMatch[0]}</span>);
        remaining = remaining.slice(cmdMatch[0].length);
        continue;
      }

      // Git subcommands
      const gitSubMatch = remaining.match(/^(init|clone|add|commit|push|pull|fetch|merge|rebase|branch|checkout|status|log|diff|remote|stash|reset|config)\b/);
      if (gitSubMatch) {
        parts.push(<span key={keyIndex++} className="text-[#d2a8ff]">{gitSubMatch[0]}</span>);
        remaining = remaining.slice(gitSubMatch[0].length);
        continue;
      }

      // Flags (-x or --xxx)
      const flagMatch = remaining.match(/^(-{1,2}[a-zA-Z][\w-]*)/);
      if (flagMatch) {
        parts.push(<span key={keyIndex++} className="text-[#79c0ff]">{flagMatch[0]}</span>);
        remaining = remaining.slice(flagMatch[0].length);
        continue;
      }

      // URLs and paths with @
      const urlMatch = remaining.match(/^([a-zA-Z0-9_-]+@[\w.-]+)/);
      if (urlMatch) {
        parts.push(<span key={keyIndex++} className="text-[#7ee787]">{urlMatch[0]}</span>);
        remaining = remaining.slice(urlMatch[0].length);
        continue;
      }

      // Numbers
      const numMatch = remaining.match(/^\b(\d+)\b/);
      if (numMatch) {
        parts.push(<span key={keyIndex++} className="text-[#f0883e]">{numMatch[0]}</span>);
        remaining = remaining.slice(numMatch[0].length);
        continue;
      }

      // Default: take one character
      parts.push(<span key={keyIndex++} className="text-[#c9d1d9]">{remaining[0]}</span>);
      remaining = remaining.slice(1);
    }

    return (
      <React.Fragment key={lineIndex}>
        {parts}
        {lineIndex < lines.length - 1 && '\n'}
      </React.Fragment>
    );
  });
}

// Code block with copy and syntax highlighting
function CodeBlock({ code, onCopy }: { code: string; onCopy: (text: string) => void }) {
  const [copied, setCopied] = useState(false);
  const [animating, setAnimating] = useState(false);

  const handleCopy = () => {
    onCopy(code);
    setCopied(true);
    setAnimating(true);
    setTimeout(() => setCopied(false), 1200);
    setTimeout(() => setAnimating(false), 300);
  };

  return (
    <div className="relative rounded-md overflow-hidden border border-[#30363d] bg-[#0d1117] group">
      <button
        onClick={handleCopy}
        className={`absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md transition-all duration-200 border ${
          copied 
            ? 'bg-[#238636] border-[#238636] text-white scale-105' 
            : 'bg-[#21262d] text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#30363d] border-[#30363d]'
        } ${animating ? 'scale-110' : ''}`}
      >
        <span className={`transition-transform duration-200 ${animating ? 'scale-125' : ''}`}>
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </span>
        <span className="font-medium">{copied ? "Copied!" : "Copy"}</span>
      </button>
      <pre className="p-4 pr-24 text-sm font-mono overflow-x-auto leading-relaxed">
        <code>{highlightSyntax(code)}</code>
      </pre>
    </div>
  );
}

// Copyable inline command
function CopyableCommand({ command, onCopy }: { command: string; onCopy: (text: string) => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <button
      onClick={handleCopy}
      className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-md text-left hover:border-[#484f58] transition-colors group"
    >
      <code className="text-xs font-mono text-[#7ee787] truncate">{command}</code>
      {copied ? (
        <Check className="w-4 h-4 text-[#3fb950] shrink-0" />
      ) : (
        <Copy className="w-4 h-4 text-[#484f58] group-hover:text-[#8b949e] shrink-0" />
      )}
    </button>
  );
}

// Login modal
function LoginModal({
  isOpen,
  onClose,
  onLogin,
}: {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (u: string, p: string) => boolean;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onLogin(username, password)) {
      setUsername("");
      setPassword("");
      setError("");
      onClose();
    } else {
      setError("Invalid credentials");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#161b22] rounded-lg border border-[#30363d] w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold text-[#e6edf3]">Admin Login</h2>
          <button onClick={onClose} className="p-1 hover:bg-[#30363d] rounded">
            <X className="w-5 h-5 text-[#8b949e]" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-md text-[#e6edf3] placeholder-[#484f58] focus:ring-2 focus:ring-[#1f6feb] focus:border-transparent outline-none"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-md text-[#e6edf3] placeholder-[#484f58] focus:ring-2 focus:ring-[#1f6feb] focus:border-transparent outline-none"
          />
          {error && <p className="text-[#f85149] text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-[#238636] hover:bg-[#2ea043] text-white font-medium py-2 rounded-md transition-colors"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}

// Tutorial edit modal
function TutorialModal({
  isOpen,
  onClose,
  onSave,
  tutorial,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, desc: string) => void;
  tutorial?: Tutorial | null;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    setTitle(tutorial?.title || "");
    setDescription(tutorial?.description || "");
  }, [tutorial, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#161b22] rounded-lg border border-[#30363d] w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold text-[#e6edf3]">
            {tutorial ? "Edit Tutorial" : "New Tutorial"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-[#30363d] rounded">
            <X className="w-5 h-5 text-[#8b949e]" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (title.trim()) {
              onSave(title.trim(), description.trim());
              onClose();
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs text-[#8b949e] mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tutorial title"
              className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-md text-[#e6edf3] placeholder-[#484f58] focus:ring-2 focus:ring-[#1f6feb] outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-[#8b949e] mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description"
              rows={2}
              className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-md text-[#e6edf3] placeholder-[#484f58] focus:ring-2 focus:ring-[#1f6feb] outline-none resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-[#30363d] text-[#c9d1d9] rounded-md hover:bg-[#21262d] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-[#238636] hover:bg-[#2ea043] text-white rounded-md transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Step edit modal with multiple images support
function StepModal({
  isOpen,
  onClose,
  onSave,
  step,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (heading: string, explanation: string, code: string, images: StepImage[]) => void;
  step?: Step | null;
}) {
  const [heading, setHeading] = useState("");
  const [explanation, setExplanation] = useState("");
  const [code, setCode] = useState("");
  const [images, setImages] = useState<StepImage[]>([]);

  useEffect(() => {
    setHeading(step?.heading || "");
    setExplanation(step?.explanation || "");
    setCode(step?.code || "");
    // Convert legacy single image to new format
    if (step?.images) {
      setImages(step.images);
    } else if (step?.image) {
      setImages([{ id: "legacy", url: step.image, position: "after", caption: "", captionPosition: "bottom" }]);
    } else {
      setImages([]);
    }
  }, [step, isOpen]);

  const addImage = () => {
    setImages([...images, { 
      id: `img-${Date.now()}`, 
      url: "", 
      position: "after",
      caption: "",
      captionPosition: "bottom"
    }]);
  };

  const updateImage = (id: string, updates: Partial<StepImage>) => {
    setImages(images.map(img => img.id === id ? { ...img, ...updates } : img));
  };

  const removeImage = (id: string) => {
    setImages(images.filter(img => img.id !== id));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#161b22] rounded-lg border border-[#30363d] w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold text-[#e6edf3]">
            {step ? "Edit Step" : "New Step"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-[#30363d] rounded">
            <X className="w-5 h-5 text-[#8b949e]" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (heading.trim()) {
              const validImages = images.filter(img => img.url.trim());
              onSave(heading.trim(), explanation.trim(), code.trim(), validImages);
              onClose();
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs text-[#8b949e] mb-1.5">Step Heading</label>
            <input
              type="text"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              placeholder="e.g., Initialize Repository"
              className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-md text-[#e6edf3] placeholder-[#484f58] focus:ring-2 focus:ring-[#1f6feb] outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-[#8b949e] mb-1.5">Explanation</label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Explain what this step does..."
              rows={2}
              className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-md text-[#e6edf3] placeholder-[#484f58] focus:ring-2 focus:ring-[#1f6feb] outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-xs text-[#8b949e] mb-1.5">Code / Command</label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="git init"
              rows={4}
              className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-md text-[#e6edf3] placeholder-[#484f58] focus:ring-2 focus:ring-[#1f6feb] focus:border-[#1f6feb] outline-none resize-none font-mono text-sm"
            />
          </div>

          {/* Screenshots Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-[#8b949e] flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                Screenshots <span className="text-[#484f58]">(optional)</span>
              </label>
              <button
                type="button"
                onClick={addImage}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#e6edf3] rounded transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add Image
              </button>
            </div>

            {images.length === 0 && (
              <div className="text-center py-6 border border-dashed border-[#30363d] rounded-md">
                <ImageIcon className="w-8 h-8 mx-auto text-[#484f58] mb-2" />
                <p className="text-xs text-[#484f58]">No screenshots added yet</p>
              </div>
            )}

            <div className="space-y-3">
              {images.map((img, index) => (
                <div key={img.id} className="bg-[#0d1117] border border-[#30363d] rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs text-[#8b949e] font-medium">Image {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      className="p-1 hover:bg-[#21262d] rounded text-[#8b949e] hover:text-[#f85149] transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Image URL */}
                  <input
                    type="url"
                    value={img.url}
                    onChange={(e) => updateImage(img.id, { url: e.target.value })}
                    placeholder="https://i.ibb.co/example.png"
                    className="w-full px-2.5 py-1.5 bg-[#161b22] border border-[#30363d] rounded text-sm text-[#e6edf3] placeholder-[#484f58] focus:ring-1 focus:ring-[#1f6feb] outline-none mb-2"
                  />

                  {/* Image Preview */}
                  {img.url && (
                    <div className="mb-3 rounded border border-[#30363d] overflow-hidden bg-[#161b22] p-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url || "/placeholder.svg"}
                        alt={`Preview ${index + 1}`}
                        className="max-h-24 w-auto object-contain mx-auto rounded"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.opacity = '0.3';
                        }}
                      />
                    </div>
                  )}

                  {/* Position & Caption Controls */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Position */}
                    <div>
                      <label className="block text-[10px] text-[#484f58] mb-1">Position</label>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => updateImage(img.id, { position: "before" })}
                          className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded transition-colors ${
                            img.position === "before"
                              ? "bg-[#1f6feb] text-white"
                              : "bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3]"
                          }`}
                        >
                          <ArrowUp className="w-3 h-3" />
                          Before
                        </button>
                        <button
                          type="button"
                          onClick={() => updateImage(img.id, { position: "after" })}
                          className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded transition-colors ${
                            img.position === "after"
                              ? "bg-[#238636] text-white"
                              : "bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3]"
                          }`}
                        >
                          <ArrowDown className="w-3 h-3" />
                          After
                        </button>
                      </div>
                    </div>

                    {/* Caption Position */}
                    <div>
                      <label className="block text-[10px] text-[#484f58] mb-1">Caption Position</label>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => updateImage(img.id, { captionPosition: "top" })}
                          className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors ${
                            img.captionPosition === "top"
                              ? "bg-[#8957e5] text-white"
                              : "bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3]"
                          }`}
                        >
                          Top
                        </button>
                        <button
                          type="button"
                          onClick={() => updateImage(img.id, { captionPosition: "bottom" })}
                          className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors ${
                            img.captionPosition === "bottom" || !img.captionPosition
                              ? "bg-[#8957e5] text-white"
                              : "bg-[#21262d] text-[#8b949e] hover:text-[#e6edf3]"
                          }`}
                        >
                          Bottom
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Caption */}
                  <div className="mt-2">
                    <div className="flex items-center gap-1 mb-1">
                      <Type className="w-3 h-3 text-[#484f58]" />
                      <label className="text-[10px] text-[#484f58]">Caption</label>
                    </div>
                    <input
                      type="text"
                      value={img.caption || ""}
                      onChange={(e) => updateImage(img.id, { caption: e.target.value })}
                      placeholder="After running this command, you should see..."
                      className="w-full px-2.5 py-1.5 bg-[#161b22] border border-[#30363d] rounded text-xs text-[#e6edf3] placeholder-[#484f58] focus:ring-1 focus:ring-[#1f6feb] outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-[#30363d] text-[#c9d1d9] rounded-md hover:bg-[#21262d] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-[#238636] hover:bg-[#2ea043] text-white rounded-md transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ITPTutorial() {
  const [tutorials, setTutorials] = useState<Tutorial[]>(defaultTutorials);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [toast, setToast] = useState({ message: "", visible: false });
  const [selectedTutorial, setSelectedTutorial] = useState<string>("1");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [tutorialModalOpen, setTutorialModalOpen] = useState(false);
  const [stepModalOpen, setStepModalOpen] = useState(false);
  const [editingTutorial, setEditingTutorial] = useState<Tutorial | null>(null);
  const [editingStep, setEditingStep] = useState<{ tutorialId: string; step: Step | null } | null>(null);
  const [terminalUrl, setTerminalUrl] = useState("");
  const [terminalSettingsOpen, setTerminalSettingsOpen] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalFullscreen, setTerminalFullscreen] = useState(false);
  const [terminalLocked, setTerminalLocked] = useState(true); // Terminal is locked by default
  const [draggedTutorial, setDraggedTutorial] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(288); // 18rem = 288px default
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const MIN_SIDEBAR_WIDTH = 200;
  const MAX_SIDEBAR_WIDTH = 450;
  const [githubSyncUrl, setGithubSyncUrl] = useState("https://raw.githubusercontent.com/xalhexi/xalhexi.com/main/tutorials.json");
  const [showSyncSettings, setShowSyncSettings] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (localStorage.getItem("isAdmin") === "true") setIsAdmin(true);
      const saved = localStorage.getItem("tutorialsOverride");
      if (saved) {
        try {
          const savedTutorials = JSON.parse(saved) as Tutorial[];
          // Merge: keep saved tutorials, add any new defaults that don't exist
          const savedIds = new Set(savedTutorials.map((t) => t.id));
          const newDefaults = defaultTutorials.filter((t) => !savedIds.has(t.id));
          if (newDefaults.length > 0) {
            setTutorials([...savedTutorials, ...newDefaults]);
          } else {
            setTutorials(savedTutorials);
          }
        } catch {
          // ignore
        }
      }
      const savedTerminalUrl = localStorage.getItem("terminalUrl");
      if (savedTerminalUrl) setTerminalUrl(savedTerminalUrl);
      const savedTerminalLocked = localStorage.getItem("terminalLocked");
      if (savedTerminalLocked !== null) setTerminalLocked(savedTerminalLocked === "true");
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("tutorialsOverride", JSON.stringify(tutorials));
    }
  }, [tutorials]);

  useEffect(() => {
    if (typeof window !== "undefined" && terminalUrl) {
      localStorage.setItem("terminalUrl", terminalUrl);
    }
  }, [terminalUrl]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("terminalLocked", String(terminalLocked));
    }
  }, [terminalLocked]);

  // Sidebar resize handlers
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      if (newWidth >= MIN_SIDEBAR_WIDTH && newWidth <= MAX_SIDEBAR_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  const handleDragStart = (tutorialId: string) => {
    setDraggedTutorial(tutorialId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetId: string) => {
    if (!draggedTutorial || draggedTutorial === targetId) {
      setDraggedTutorial(null);
      return;
    }
    setTutorials((prev) => {
      const dragIdx = prev.findIndex((t) => t.id === draggedTutorial);
      const targetIdx = prev.findIndex((t) => t.id === targetId);
      if (dragIdx === -1 || targetIdx === -1) return prev;
      const newList = [...prev];
      const [dragged] = newList.splice(dragIdx, 1);
      newList.splice(targetIdx, 0, dragged);
      return newList;
    });
    setDraggedTutorial(null);
  };

  const showToast = (msg: string) => {
    setToast({ message: msg, visible: true });
    setTimeout(() => setToast({ message: "", visible: false }), 2000);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Copied!");
  };

  const handleLogin = (u: string, p: string) => {
    if (u === "admin" && p === "1234") {
      setIsAdmin(true);
      localStorage.setItem("isAdmin", "true");
      showToast("Logged in!");
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem("isAdmin");
    showToast("Logged out");
  };

  const copyAllCommands = (tutorial: Tutorial) => {
    const commands = tutorial.steps
      .map((s) => s.code)
      .filter((c) => c && !c.startsWith("#"))
      .join("\n");
    navigator.clipboard.writeText(commands);
    showToast("All commands copied!");
  };

  // Filter tutorials for sidebar (hide locked for non-admin)
  const filteredTutorials = useMemo(() => {
    let filtered = tutorials;
    // Non-admin users cannot see locked tutorials
    if (!isAdmin) {
      filtered = filtered.filter((t) => !t.locked);
    }
    if (!searchQuery.trim()) return filtered;
    const q = searchQuery.toLowerCase();
    return filtered.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.steps.some(
          (s) =>
            s.heading.toLowerCase().includes(q) ||
            s.code.toLowerCase().includes(q) ||
            s.explanation.toLowerCase().includes(q)
        )
    );
  }, [tutorials, searchQuery, isAdmin]);

  // Search results - find all matching steps across all tutorials
  const searchResults = useMemo((): SearchResult[] => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    tutorials.forEach((tutorial) => {
      tutorial.steps.forEach((step) => {
        const headingMatch = step.heading.toLowerCase().includes(q);
        const codeMatch = step.code.toLowerCase().includes(q);
        const explanationMatch = step.explanation.toLowerCase().includes(q);

        if (headingMatch || codeMatch || explanationMatch) {
          results.push({
            tutorialId: tutorial.id,
            tutorialTitle: tutorial.title,
            step,
            matchType: codeMatch ? "code" : headingMatch ? "heading" : "explanation",
          });
        }
      });
    });

    return results;
  }, [tutorials, searchQuery]);

  const isSearching = searchQuery.trim().length > 0;

  const currentTutorial = tutorials.find((t) => t.id === selectedTutorial) || tutorials[0];

  const clearSearchAndGoToTutorial = (tutorialId: string) => {
    setSearchQuery("");
    setSelectedTutorial(tutorialId);
    setSidebarOpen(false);
  };

  // CRUD operations
const saveTutorial = (title: string, desc: string) => {
  if (editingTutorial) {
  setTutorials((prev) =>
  prev.map((t) => (t.id === editingTutorial.id ? { ...t, title, description: desc } : t))
  );
  } else {
  const newId = generateId();
  setTutorials((prev) => [...prev, { id: newId, title, description: desc, steps: [] }]);
  setSelectedTutorial(newId);
  }
  showToast(editingTutorial ? "Tutorial updated" : "Tutorial added");
  };

const deleteTutorial = (id: string) => {
  setTutorials((prev) => prev.filter((t) => t.id !== id));
  if (selectedTutorial === id && tutorials.length > 1) {
  setSelectedTutorial(tutorials.find((t) => t.id !== id)?.id || "");
  }
  showToast("Tutorial deleted");
  };

  const toggleLock = (id: string) => {
    setTutorials((prev) =>
      prev.map((t) => (t.id === id ? { ...t, locked: !t.locked } : t))
    );
  };

  const saveStep = (heading: string, explanation: string, code: string, images: StepImage[]) => {
    if (!editingStep) return;
    const { tutorialId, step } = editingStep;
    setTutorials((prev) =>
      prev.map((t) => {
        if (t.id !== tutorialId) return t;
        if (step) {
          return {
            ...t,
            steps: t.steps.map((s) =>
              s.id === step.id ? { ...s, heading, explanation, code, images: images.length > 0 ? images : undefined, image: undefined } : s
            ),
          };
        } else {
          return {
            ...t,
            steps: [...t.steps, { id: generateId(), heading, explanation, code, images: images.length > 0 ? images : undefined }],
          };
        }
      })
    );
    showToast(step ? "Step updated" : "Step added");
  };

  const deleteStep = (tutorialId: string, stepId: string) => {
    setTutorials((prev) =>
      prev.map((t) =>
        t.id === tutorialId ? { ...t, steps: t.steps.filter((s) => s.id !== stepId) } : t
      )
    );
    showToast("Step deleted");
  };

  const moveStep = (tutorialId: string, stepId: string, direction: "up" | "down") => {
    setTutorials((prev) =>
      prev.map((t) => {
        if (t.id !== tutorialId) return t;
        const idx = t.steps.findIndex((s) => s.id === stepId);
        if (idx === -1) return t;
        if (direction === "up" && idx === 0) return t;
        if (direction === "down" && idx === t.steps.length - 1) return t;
        const newSteps = [...t.steps];
        const swapIdx = direction === "up" ? idx - 1 : idx + 1;
        [newSteps[idx], newSteps[swapIdx]] = [newSteps[swapIdx], newSteps[idx]];
        return { ...t, steps: newSteps };
      })
    );
  };

  // Export tutorials as JSON
  const exportTutorials = () => {
    const dataStr = JSON.stringify(tutorials, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "tutorials.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Tutorials exported");
  };

  // Import tutorials from JSON
  const importTutorials = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          if (Array.isArray(imported)) {
            setTutorials(imported);
            if (imported.length > 0) {
              setSelectedTutorial(imported[0].id);
            }
            showToast("Tutorials imported");
          } else {
            showToast("Invalid file format");
          }
        } catch {
          showToast("Failed to parse file");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Sync from GitHub
  const syncFromGithub = async () => {
    if (!githubSyncUrl) {
      showToast("No GitHub URL configured");
      return;
    }
    
    const confirmed = window.confirm(
      "This will replace all your local tutorials with the version from GitHub.\n\nAre you sure? Any unsaved local changes will be lost."
    );
    
    if (!confirmed) return;
    
    setIsSyncing(true);
    try {
      const response = await fetch(githubSyncUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0 && data[0].id && data[0].title) {
        setTutorials(data);
        setSelectedTutorial(data[0].id);
        showToast("Synced from GitHub!");
      } else {
        showToast("Invalid JSON format");
      }
    } catch (error) {
      showToast("Failed to sync from GitHub");
      console.error("Sync error:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#161b22] border-b border-[#30363d]">
        <div className="px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-[#21262d] rounded-md"
            >
              <Menu className="w-5 h-5 text-[#8b949e]" />
            </button>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#58a6ff]" />
              <span className="font-semibold text-[#e6edf3]">ITP Subject Tutorial</span>
            </div>
          </div>

          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#484f58]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tutorials..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#0d1117] border border-[#30363d] rounded-md text-sm text-[#e6edf3] placeholder-[#484f58] focus:ring-1 focus:ring-[#1f6feb] focus:border-[#1f6feb] outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
  {/* Terminal button - only show if URL is configured AND (admin OR unlocked) */}
  {terminalUrl && (isAdmin || !terminalLocked) && (
    <button
      onClick={() => setShowTerminal(true)}
      className="p-2 hover:bg-[#21262d] rounded-md transition-colors"
      title="Open Terminal"
    >
      <Monitor className="w-5 h-5 text-[#58a6ff]" />
    </button>
  )}
  <a
  href="https://github.com/xalhexi-sch"
  target="_blank"
  rel="noopener noreferrer"
  className="p-2 hover:bg-[#21262d] rounded-md transition-colors"
  title="GitHub"
  >
  <Github className="w-5 h-5 text-[#8b949e]" />
  </a>
  {isAdmin ? (
    <>
      <button
        onClick={() => setTerminalSettingsOpen(true)}
        className="p-2 hover:bg-[#21262d] rounded-md transition-colors"
        title="Terminal Settings"
      >
        <Terminal className="w-5 h-5 text-[#8b949e]" />
      </button>
      <button
        onClick={handleLogout}
        className="p-2 hover:bg-[#21262d] rounded-md transition-colors"
        title="Logout"
      >
        <LogOut className="w-5 h-5 text-[#8b949e]" />
      </button>
    </>
  ) : (
  <button
  onClick={() => setLoginModalOpen(true)}
  className="p-2 hover:bg-[#21262d] rounded-md transition-colors"
  title="Admin"
  >
  <Settings className="w-4 h-4 text-[#484f58]" />
  </button>
  )}
          </div>
        </div>

        {/* Mobile search */}
        <div className="px-4 pb-3 sm:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#484f58]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tutorials..."
              className="w-full pl-9 pr-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-md text-sm text-[#e6edf3] placeholder-[#484f58] focus:ring-1 focus:ring-[#1f6feb] focus:border-[#1f6feb] outline-none"
            />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Left Sidebar - Tutorial List */}
        <aside
          ref={sidebarRef}
          style={{ width: sidebarWidth }}
          className={`fixed lg:sticky top-14 left-0 z-30 h-[calc(100vh-3.5rem)] bg-[#161b22] border-r border-[#30363d] overflow-y-auto transition-transform lg:translate-x-0 shrink-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Resize handle */}
          <div
            onMouseDown={startResizing}
            className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-[#58a6ff] transition-colors z-50 ${
              isResizing ? "bg-[#58a6ff]" : "bg-transparent"
            }`}
          />
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[#8b949e] uppercase tracking-wide">
                Tutorials
              </h2>
              {isAdmin && (
                <button
                  onClick={() => {
                    setEditingTutorial(null);
                    setTutorialModalOpen(true);
                  }}
                  className="p-1 hover:bg-[#21262d] rounded text-[#8b949e] hover:text-[#e6edf3]"
                  title="Add Tutorial"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            <nav className="space-y-1">
              {filteredTutorials.map((tutorial) => (
                <div
                  key={tutorial.id}
                  draggable={isAdmin}
                  onDragStart={() => isAdmin && handleDragStart(tutorial.id)}
                  onDragOver={handleDragOver}
                  onDrop={() => isAdmin && handleDrop(tutorial.id)}
                  className={`flex items-center gap-1 rounded-md transition-colors ${
                    selectedTutorial === tutorial.id
                      ? "bg-[#21262d] text-[#e6edf3]"
                      : "text-[#8b949e] hover:bg-[#21262d] hover:text-[#e6edf3]"
                  } ${draggedTutorial === tutorial.id ? "opacity-50" : ""}`}
                >
                  {isAdmin && (
                    <div className="cursor-grab active:cursor-grabbing p-1 shrink-0">
                      <GripVertical className="w-3.5 h-3.5 text-[#484f58]" />
                    </div>
                  )}
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLock(tutorial.id);
                      }}
                      className="p-1 shrink-0 hover:text-[#f0883e] transition-colors"
                      title={tutorial.locked ? "Unlock tutorial" : "Lock tutorial"}
                    >
                      {tutorial.locked ? (
                        <Lock className="w-3.5 h-3.5 text-[#f0883e]" />
                      ) : (
                        <Unlock className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedTutorial(tutorial.id);
                      setSidebarOpen(false);
                    }}
                    className="flex-1 flex items-center gap-2 py-2 pr-3 text-left text-sm"
                  >
                    <ChevronRight
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        selectedTutorial === tutorial.id ? "rotate-90 text-[#58a6ff]" : ""
                      }`}
                    />
                    <span className="truncate" title={tutorial.title}>{tutorial.title}</span>
                  </button>
                </div>
              ))}
            </nav>

            {filteredTutorials.length === 0 && (
              <p className="text-sm text-[#484f58] text-center py-4">No tutorials found</p>
            )}
          </div>

          {/* Sidebar footer */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#30363d] bg-[#161b22]">
            {isAdmin && (
              <>
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={exportTutorials}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-[#238636] hover:bg-[#2ea043] text-white rounded-md transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export
                  </button>
                  <button
                    onClick={importTutorials}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-md transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Import
                  </button>
                </div>
                <div className="mb-3">
                  <button
                    onClick={syncFromGithub}
                    disabled={isSyncing}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d] rounded-md transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                    {isSyncing ? "Syncing..." : "Sync from GitHub"}
                  </button>
                  <button
                    onClick={() => setShowSyncSettings(!showSyncSettings)}
                    className="w-full mt-1 text-[10px] text-[#484f58] hover:text-[#8b949e] transition-colors"
                  >
                    {showSyncSettings ? "Hide URL settings" : "Edit GitHub URL"}
                  </button>
                  {showSyncSettings && (
                    <input
                      type="text"
                      value={githubSyncUrl}
                      onChange={(e) => setGithubSyncUrl(e.target.value)}
                      placeholder="GitHub raw JSON URL"
                      className="w-full mt-2 px-2 py-1.5 text-xs bg-[#0d1117] border border-[#30363d] rounded-md text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-[#58a6ff]"
                    />
                  )}
                </div>
              </>
            )}
            {/* Terminal button - only show if admin OR unlocked */}
            {(isAdmin || !terminalLocked) && (
              <button
                onClick={() => setShowTerminal(true)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-[#58a6ff] hover:bg-[#21262d] transition-colors"
              >
                <Terminal className="w-4 h-4" />
                <span>Terminal</span>
                {terminalLocked && isAdmin && (
                  <Lock className="w-3 h-3 text-[#f0883e] ml-auto" />
                )}
              </button>
            )}
            <a
              href="https://github.com/xalhexi-sch"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-[#484f58] hover:text-[#8b949e] transition-colors"
            >
              <Heart className="w-3 h-3" />
              <span>Made by xalhexi-sch</span>
            </a>
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content + Terminal Split */}
        <div className={`flex-1 min-w-0 flex ${showTerminal && !terminalFullscreen && (isAdmin || !terminalLocked) ? '' : 'justify-center'}`}>
          <main className={`${showTerminal && !terminalFullscreen && (isAdmin || !terminalLocked) ? 'w-1/2' : 'w-full max-w-4xl'} min-w-0 p-4 lg:p-6 overflow-y-auto`}>
          {isSearching ? (
            /* Search Results View */
            <div className={`${showTerminal && !terminalFullscreen && (isAdmin || !terminalLocked) ? '' : 'max-w-3xl mx-auto'}`}>
              <div className="mb-6">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <h1 className="text-xl font-bold text-[#e6edf3]">
                    Search Results for "{searchQuery}"
                  </h1>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="px-3 py-1.5 text-sm border border-[#30363d] rounded-md text-[#8b949e] hover:bg-[#21262d] hover:text-[#e6edf3] transition-colors"
                  >
                    Clear search
                  </button>
                </div>
                <p className="text-[#8b949e] text-sm">
                  Found {searchResults.length} matching {searchResults.length === 1 ? "result" : "results"}
                </p>
              </div>

              {searchResults.length > 0 ? (
                <div className="space-y-4">
                  {searchResults.map((result, index) => (
                    <div
                      key={`${result.tutorialId}-${result.step.id}-${index}`}
                      className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden"
                    >
                      {/* Result header with tutorial name */}
                      <div className="px-4 py-2 border-b border-[#30363d] bg-[#21262d] flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-[#8b949e] min-w-0 flex-1">
                          <BookOpen className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate max-w-[120px]" title={result.tutorialTitle}>{result.tutorialTitle}</span>
                          <span className="text-[#484f58] shrink-0">/</span>
                          <span className="text-[#58a6ff] truncate" title={result.step.heading}>{result.step.heading}</span>
                        </div>
                        <button
                          onClick={() => clearSearchAndGoToTutorial(result.tutorialId)}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-[#238636] hover:bg-[#2ea043] text-white rounded transition-colors"
                        >
                          <ChevronRight className="w-3 h-3" />
                          View full tutorial
                        </button>
                      </div>
                      
                      {/* Step content */}
                      <div className="p-4 space-y-3">
                        {result.step.explanation && (
                          <p className="text-sm text-[#8b949e]">{result.step.explanation}</p>
                        )}
                        {result.step.code && <CodeBlock code={result.step.code} onCopy={handleCopy} />}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-[#484f58]">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg mb-1">No results found</p>
                  <p className="text-sm">Try searching for different keywords</p>
                </div>
              )}
            </div>
          ) : currentTutorial ? (
            /* Normal Tutorial View */
            <div className={`${showTerminal && !terminalFullscreen && (isAdmin || !terminalLocked) ? '' : 'max-w-3xl mx-auto'}`}>
              {/* Tutorial header */}
              <div className="mb-6">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h1 className="text-2xl font-bold text-[#e6edf3] truncate" title={currentTutorial.title}>{currentTutorial.title}</h1>
                  {isAdmin && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setEditingTutorial(currentTutorial);
                          setTutorialModalOpen(true);
                        }}
                        className="p-1.5 hover:bg-[#21262d] rounded text-[#8b949e] hover:text-[#e6edf3]"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTutorial(currentTutorial.id)}
                        className="p-1.5 hover:bg-[#21262d] rounded text-[#8b949e] hover:text-[#f85149]"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-[#8b949e]">{currentTutorial.description}</p>
              </div>

              {/* Steps */}
              <div className="space-y-4">
                {currentTutorial.steps.map((step, index) => (
                  <div
                    key={step.id}
                    className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-[#30363d] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#238636] text-white text-xs font-bold">
                          {index + 1}
                        </span>
                        <h3 className="font-semibold text-[#e6edf3]">{step.heading}</h3>
                      </div>
                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveStep(currentTutorial.id, step.id, "up")}
                            disabled={index === 0}
                            className="p-1 hover:bg-[#21262d] rounded text-[#8b949e] hover:text-[#e6edf3] disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => moveStep(currentTutorial.id, step.id, "down")}
                            disabled={index === currentTutorial.steps.length - 1}
                            className="p-1 hover:bg-[#21262d] rounded text-[#8b949e] hover:text-[#e6edf3] disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingStep({ tutorialId: currentTutorial.id, step });
                              setStepModalOpen(true);
                            }}
                            className="p-1 hover:bg-[#21262d] rounded text-[#8b949e] hover:text-[#e6edf3]"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteStep(currentTutorial.id, step.id)}
                            className="p-1 hover:bg-[#21262d] rounded text-[#8b949e] hover:text-[#f85149]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="p-4 space-y-3">
                      {step.explanation && (
                        <p className="text-sm text-[#8b949e]">{step.explanation}</p>
                      )}

                      {/* Images BEFORE code */}
                      {step.images && step.images
                        .filter(img => img.position === 'before' && img.url)
                        .map((img) => (
                          <StepImageDisplay key={img.id} img={img} altText={step.heading} />
                        ))}

                      {/* Code block */}
                      {step.code && <CodeBlock code={step.code} onCopy={handleCopy} />}

                      {/* Images AFTER code */}
                      {step.images && step.images
                        .filter(img => img.position === 'after' && img.url)
                        .map((img) => (
                          <StepImageDisplay key={img.id} img={img} altText={step.heading} />
                        ))}

                      {/* Legacy single image support */}
                      {!step.images && step.image && (
                        <StepImageDisplay 
                          img={{ id: 'legacy', url: step.image, position: 'after' }} 
                          altText={step.heading} 
                        />
                      )}
                    </div>
                  </div>
                ))}

                {/* Add step button */}
                {isAdmin && (
                  <button
                    onClick={() => {
                      setEditingStep({ tutorialId: currentTutorial.id, step: null });
                      setStepModalOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-[#30363d] rounded-lg text-[#8b949e] hover:border-[#484f58] hover:text-[#e6edf3] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Step
                  </button>
                )}

                {currentTutorial.steps.length === 0 && !isAdmin && (
                  <div className="text-center py-12 text-[#484f58]">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No steps in this tutorial yet</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center">
              <BookOpen className="w-16 h-16 text-[#30363d] mb-4" />
              <h2 className="text-xl font-semibold text-[#e6edf3] mb-2">Select a Tutorial</h2>
              <p className="text-[#8b949e]">Choose a tutorial from the sidebar to get started</p>
            </div>
          )}
        </main>

          {/* Terminal Panel - Split Screen Right Side (only show if admin OR unlocked) */}
          {showTerminal && !terminalFullscreen && (isAdmin || !terminalLocked) && (
            <div className="w-1/2 border-l border-[#30363d] flex flex-col bg-[#0d1117]">
              {/* Terminal Header */}
              <div className="flex items-center justify-between px-3 py-2 bg-[#161b22] border-b border-[#30363d]">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#58a6ff]" />
                  <span className="text-xs text-[#e6edf3] font-mono">
                    {terminalUrl ? "student@itp-server" : "Terminal"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setTerminalFullscreen(true)}
                    className="p-1.5 hover:bg-[#21262d] rounded transition-colors"
                    title="Fullscreen"
                  >
                    <Maximize2 className="w-4 h-4 text-[#8b949e]" />
                  </button>
                  <button
                    onClick={() => setShowTerminal(false)}
                    className="p-1.5 hover:bg-[#21262d] rounded transition-colors"
                    title="Close"
                  >
                    <X className="w-4 h-4 text-[#8b949e]" />
                  </button>
                </div>
              </div>
              
              {/* Terminal Content */}
              {terminalUrl ? (
                <iframe
                  src={terminalUrl}
                  className="flex-1 w-full border-0 bg-black"
                  title="Web Terminal"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                  allow="clipboard-read; clipboard-write"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex-1 p-4 font-mono text-sm">
                  <div className="text-[#f85149] mb-2">$ connect --server itp-vps</div>
                  <div className="text-[#8b949e] mb-4">Error: No Linux VPS available</div>
                  <div className="text-[#484f58] mb-2">-------------------------------------------</div>
                  <div className="text-[#8b949e] mb-1">The web terminal is not configured yet.</div>
                  {isAdmin ? (
                    <div className="text-[#58a6ff]">
                      <span className="text-[#8b949e]">Admin: </span>
                      Click the Terminal icon in header to configure.
                    </div>
                  ) : (
                    <div className="text-[#8b949e]">Contact administrator to enable terminal.</div>
                  )}
                  <div className="mt-4 text-[#27c93f] animate-pulse">$ _</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar - Connection Info */}
        <aside className="hidden xl:block w-80 shrink-0 p-4 lg:p-6">
          <div className="sticky top-20 space-y-4">
            {/* SSH Connection Card */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-[#30363d] flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#f0883e]" />
                <h3 className="font-semibold text-sm text-[#e6edf3]">SSH Connection</h3>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-xs text-[#8b949e] mb-1.5">Connect to server:</p>
                  <CopyableCommand
                    command="ssh it21_lastname@172.17.100.15 -p 9898"
                    onCopy={handleCopy}
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-[#8b949e]">
                  <Server className="w-3.5 h-3.5" />
                  <span>Port: 9898</span>
                </div>
              </div>
            </div>

            {/* Quick Links Card */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-[#30363d] flex items-center gap-2">
                <Link2 className="w-4 h-4 text-[#58a6ff]" />
                <h3 className="font-semibold text-sm text-[#e6edf3]">Quick Links</h3>
              </div>
              <div className="p-2">
                <a
                  href="https://github.com/xalhexi-sch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-[#8b949e] hover:bg-[#21262d] hover:text-[#e6edf3] rounded-md transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Port List</span>
                </a>
                <a
                  href="https://github.com/xalhexi-sch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-[#8b949e] hover:bg-[#21262d] hover:text-[#e6edf3] rounded-md transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Class Resources</span>
                </a>
                <a
                  href="https://github.com/xalhexi-sch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-[#8b949e] hover:bg-[#21262d] hover:text-[#e6edf3] rounded-md transition-colors"
                >
                  <Github className="w-4 h-4" />
                  <span>GitHub Repo</span>
                </a>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Modals */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLogin={handleLogin}
      />
      <TutorialModal
        isOpen={tutorialModalOpen}
        onClose={() => setTutorialModalOpen(false)}
        onSave={saveTutorial}
        tutorial={editingTutorial}
      />
      <StepModal
        isOpen={stepModalOpen}
        onClose={() => setStepModalOpen(false)}
        onSave={saveStep}
        step={editingStep?.step}
      />

      {/* Terminal Settings Modal (Admin) */}
      {terminalSettingsOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#161b22] rounded-lg border border-[#30363d] w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-[#e6edf3]">Terminal Settings</h2>
              <button onClick={() => setTerminalSettingsOpen(false)} className="p-1 hover:bg-[#30363d] rounded">
                <X className="w-5 h-5 text-[#8b949e]" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[#8b949e] mb-1.5">Terminal URL (ttyd/gotty)</label>
                <input
                  type="text"
                  value={terminalUrl}
                  onChange={(e) => setTerminalUrl(e.target.value)}
                  placeholder="http://your-vps-ip:7681"
                  className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-md text-[#e6edf3] placeholder-[#484f58] focus:ring-2 focus:ring-[#1f6feb] outline-none text-sm"
                />
                <p className="text-xs text-[#484f58] mt-1">Enter the URL where ttyd is running on your VPS</p>
              </div>
              
              {/* Lock/Unlock Toggle */}
              <div className="flex items-center justify-between gap-4 p-3 bg-[#0d1117] border border-[#30363d] rounded-md">
                <div className="flex items-center gap-3 min-w-0">
                  {terminalLocked ? (
                    <Lock className="w-5 h-5 text-[#f0883e] shrink-0" />
                  ) : (
                    <Unlock className="w-5 h-5 text-[#3fb950] shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#e6edf3]">
                      {terminalLocked ? "Terminal Locked" : "Terminal Unlocked"}
                    </p>
                    <p className="text-xs text-[#484f58]">
                      {terminalLocked 
                        ? "Only admins can access" 
                        : "All users can access"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTerminalLocked(!terminalLocked);
                    showToast(terminalLocked ? "Terminal unlocked" : "Terminal locked");
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 shrink-0 cursor-pointer ${
                    terminalLocked
                      ? "bg-[#238636] hover:bg-[#2ea043] text-white"
                      : "bg-[#da3633] hover:bg-[#f85149] text-white"
                  }`}
                >
                  {terminalLocked ? (
                    <>
                      <Unlock className="w-4 h-4" />
                      Unlock
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Lock
                    </>
                  )}
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setTerminalUrl("");
                    localStorage.removeItem("terminalUrl");
                    setTerminalSettingsOpen(false);
                    showToast("Terminal URL cleared");
                  }}
                  className="flex-1 py-2 border border-[#30363d] text-[#c9d1d9] rounded-md hover:bg-[#21262d] transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => {
                    setTerminalSettingsOpen(false);
                    showToast("Terminal URL saved");
                  }}
                  className="flex-1 py-2 bg-[#238636] hover:bg-[#2ea043] text-white rounded-md transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Terminal Fullscreen View (only show if admin OR unlocked) */}
      {showTerminal && terminalFullscreen && (isAdmin || !terminalLocked) && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#0d1117]">
          {/* Fullscreen Terminal Header */}
          <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-[#30363d]">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#58a6ff]" />
              <span className="text-sm text-[#e6edf3] font-mono">
                {terminalUrl ? "student@itp-server: ~" : "Terminal"}
              </span>
              <span className="text-xs text-[#484f58]">(Only 1 user at a time)</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setTerminalFullscreen(false)}
                className="p-1.5 hover:bg-[#21262d] rounded transition-colors"
                title="Exit Fullscreen"
              >
                <Minimize2 className="w-4 h-4 text-[#8b949e]" />
              </button>
              <button
                onClick={() => { setShowTerminal(false); setTerminalFullscreen(false); }}
                className="p-1.5 hover:bg-[#21262d] rounded transition-colors"
                title="Close"
              >
                <X className="w-4 h-4 text-[#8b949e]" />
              </button>
            </div>
          </div>
          
          {/* Fullscreen Terminal Content */}
          {terminalUrl ? (
            <iframe
              src={terminalUrl}
              className="flex-1 w-full border-0 bg-black"
              title="Web Terminal"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              allow="clipboard-read; clipboard-write"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex-1 p-6 font-mono text-sm">
              <div className="text-[#f85149] mb-2">$ connect --server itp-vps</div>
              <div className="text-[#8b949e] mb-4">Error: No Linux VPS available</div>
              <div className="text-[#484f58] mb-2">-------------------------------------------</div>
              <div className="text-[#8b949e] mb-1">The web terminal is not configured yet.</div>
              {isAdmin ? (
                <div className="text-[#58a6ff]">
                  <span className="text-[#8b949e]">Admin: </span>
                  Click the Terminal icon in header to configure VPS URL.
                  <br />
                  <span className="text-[#8b949e]">See locked tutorial: </span>
                  <span className="text-[#f0883e]">&quot;Setting Up Web Terminal&quot;</span>
                </div>
              ) : (
                <div className="text-[#8b949e]">Contact administrator to enable terminal access.</div>
              )}
              <div className="mt-4 text-[#27c93f] animate-pulse">$ _</div>
            </div>
          )}
        </div>
      )}

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
