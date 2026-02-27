"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import hljs from "highlight.js";
import AIAssistant from "@/components/ai-assistant";
import DiffViewer from "@/components/diff-viewer";
import {
  Minus,
  Search,
  Send,
  Loader2,
  MessageSquare,
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
  Monitor,
  Maximize2,
  Minimize2,
  RefreshCw,
  FolderIcon,
  FileIcon,
  ChevronLeft,
  GitBranch,
  Sun,
  Moon,
  Zap,
  Star,
  GripVertical,
  Crown,
  GitCompare,
  History,
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
  starred?: boolean;
  vipOnly?: boolean;
}

interface SearchResult {
  tutorialId: string;
  tutorialTitle: string;
  step: Step;
  matchType: "heading" | "code" | "explanation";
}

interface GithubRepo {
  name: string;
  description: string;
  language: string | null;
  languages: string[];
  updated_at: string;
  html_url: string;
  default_branch: string;
}

interface RepoItem {
  name: string;
  type: "file" | "dir";
  path: string;
  size: number;
}

interface FileContent {
  name: string;
  path: string;
  size: number;
  content: string | null;
  download_url?: string;
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
  {
    id: "10",
    title: "App1 – Minimal Python Web App (WSGI + Jinja2 + Gunicorn)",
    description: "Build a plain Python WSGI app using Jinja2 and Gunicorn inside a virtual environment",
    steps: [
      {
        id: "10-1",
        heading: "Go to Home Directory",
        explanation: "Start by navigating to your home directory.",
        code: "cd ~",
      },
      {
        id: "10-2",
        heading: "Copy the Virtual Environment",
        explanation: "Copy the preconfigured Python virtual environment to your home directory. This must be done first before activating.",
        code: "cp -r /opt/virt ~/",
      },
      {
        id: "10-3",
        heading: "Activate the Virtual Environment",
        explanation: "Activate the virtual environment. You should see (virt) at the start of your prompt when activated.",
        code: "source ~/virt/bin/activate\n\n# You should see:\n# (virt) username@server:~$",
      },
      {
        id: "10-4",
        heading: "Create webapps Directory",
        explanation: "Create and navigate into the webapps directory where your applications will live.",
        code: "mkdir webapps\ncd webapps",
      },
      {
        id: "10-5",
        heading: "Create app1 Directory",
        explanation: "Create and navigate into the app1 directory for this specific application.",
        code: "mkdir app1\ncd app1",
      },
      {
        id: "10-6",
        heading: "Create Empty GitHub Repository and Clone It",
        explanation: "Create an empty repository on GitHub, then clone it. The 'empty repository' warning is expected and fine.",
        code: "git clone git@github.com:xalhexi-sch/App1.git\n\n# You may see:\n# warning: You appear to have cloned an empty repository.\n# This is expected and fine.",
      },
      {
        id: "10-7",
        heading: "Create app.py",
        explanation: "Create the main application file using nano. This is a pure WSGI app using Jinja2 for templating. Save with Ctrl+O then Enter, exit with Ctrl+X.",
        code: "nano app.py\n\n# Paste this code:\nfrom jinja2 import Environment, FileSystemLoader\nimport os\n\nBASE_DIR = os.path.dirname(os.path.abspath(__file__))\n\nenv = Environment(\n    loader=FileSystemLoader(os.path.join(BASE_DIR, \"templates\")),\n    autoescape=True\n)\n\ndef app(environ, start_response):\n    path = environ.get(\"PATH_INFO\", \"/\")\n\n    if path.endswith(\"/hello\"):\n        title = \"Hello Page\"\n        message = \"Rendered using Jinja2\"\n    else:\n        title = \"Home\"\n        message = \"Plain Python + Gunicorn + Nginx\"\n\n    template = env.get_template(\"home.html\")\n    html = template.render(title=title, message=message)\n\n    start_response(\"200 OK\", [(\"Content-Type\", \"text/html; charset=utf-8\")])\n    return [html.encode(\"utf-8\")]",
      },
      {
        id: "10-8",
        heading: "Create Templates Folder and HTML File",
        explanation: "Create the templates directory and the home.html template file. This uses Jinja2 syntax with {{ variable }} placeholders.",
        code: "mkdir templates\ncd templates\nnano home.html\n\n# Paste this HTML:\n<!DOCTYPE html>\n<html>\n<head>\n    <title>{{ title }}</title>\n</head>\n<body>\n    <h1>{{ title }}</h1>\n    <p>{{ message }}</p>\n</body>\n</html>",
      },
      {
        id: "10-9",
        heading: "Return to App Root",
        explanation: "Navigate back to the app1 directory and verify your location with pwd.",
        code: "cd ..\npwd\n\n# Expected output:\n# ~/webapps/app1",
      },
      {
        id: "10-10",
        heading: "Run the App Using Gunicorn",
        explanation: "Start the application using Gunicorn. You can change the port (5000) if needed. The app:app refers to the app function inside app.py.",
        code: "gunicorn --bind 127.0.0.1:5000 app:app",
      },
      {
        id: "10-11",
        heading: "Access the App",
        explanation: "Access your app through the server URL. The exact URL depends on your server/proxy setup.",
        code: "# Example URL (depends on your server setup):\n# http://172.17.100.15:9899/it21_banas/webapps/app1\n\n# Final folder structure:\n# webapps/\n# └── app1/\n#     ├── app.py\n#     └── templates/\n#         └── home.html",
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
      className={`fixed bottom-5 left-1/2 -translate-x-1/2 bg-[var(--t-accent-green)] text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all duration-300 z-50 ${
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
      <div className="rounded-md border border-[var(--t-border)] overflow-hidden bg-[var(--t-bg-primary)]">
        {showTopCaption && (
          <div className="px-3 py-2 border-b border-[var(--t-border)] bg-[var(--t-bg-secondary)]">
            <p className="text-xs text-[var(--t-text-muted)] italic">{img.caption}</p>
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
          <div className="px-3 py-2 border-t border-[var(--t-border)] bg-[var(--t-bg-secondary)]">
            <p className="text-xs text-[var(--t-text-muted)] italic">{img.caption}</p>
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
// Code block with copy and hljs syntax highlighting
function CodeBlock({ code, onCopy }: { code: string; onCopy: (text: string) => void }) {
  const [copied, setCopied] = useState(false);
  const [animating, setAnimating] = useState(false);

  const highlightedLines = useMemo(() => {
    try {
      const html = hljs.highlightAuto(code).value;
      return html.split("\n");
    } catch {
      return code.split("\n").map((l) => l.replace(/</g, "&lt;").replace(/>/g, "&gt;"));
    }
  }, [code]);

  const handleCopy = () => {
    onCopy(code);
    setCopied(true);
    setAnimating(true);
    setTimeout(() => setCopied(false), 1200);
    setTimeout(() => setAnimating(false), 300);
  };

  return (
    <div className="rounded-md overflow-hidden border border-[var(--t-border)] bg-[var(--t-bg-primary)]">
      <pre className="text-sm font-mono overflow-x-auto leading-relaxed py-3 pr-4">
        <code className="hljs block">
          {highlightedLines.map((line, i) => (
            <div key={i} className="flex">
              <span className="inline-block w-10 pr-3 text-right text-[var(--t-text-faint)] select-none opacity-50 shrink-0">{i + 1}</span>
              <span dangerouslySetInnerHTML={{ __html: line || " " }} />
            </div>
          ))}
        </code>
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
      className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-[var(--t-bg-primary)] border border-[var(--t-border)] rounded-md text-left hover:border-[var(--t-text-faint)] transition-colors group"
    >
      <code className="text-xs font-mono text-[#7ee787] truncate">{command}</code>
      {copied ? (
        <Check className="w-4 h-4 text-[var(--t-accent-green-text)] shrink-0" />
      ) : (
        <Copy className="w-4 h-4 text-[var(--t-text-faint)] group-hover:text-[var(--t-text-muted)] shrink-0" />
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
  onLogin: (u: string, p: string) => Promise<boolean>;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const ok = await onLogin(username, password);
    if (ok) {
      setUsername("");
      setPassword("");
      setError("");
      onClose();
    } else {
      setError("Invalid credentials");
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--t-bg-secondary)] rounded-lg border border-[var(--t-border)] w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold text-[var(--t-text-primary)]">Sign In</h2>
          <button onClick={onClose} className="p-1 hover:bg-[var(--t-bg-hover)] rounded">
            <X className="w-5 h-5 text-[var(--t-text-muted)]" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full px-3 py-2 bg-[var(--t-bg-primary)] border border-[var(--t-border)] rounded-md text-[var(--t-text-primary)] placeholder-[var(--t-text-faint)] focus:ring-2 focus:ring-[var(--t-accent-blue)] focus:border-transparent outline-none"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-3 py-2 bg-[var(--t-bg-primary)] border border-[var(--t-border)] rounded-md text-[var(--t-text-primary)] placeholder-[var(--t-text-faint)] focus:ring-2 focus:ring-[var(--t-accent-blue)] focus:border-transparent outline-none"
          />
          {error && <p className="text-[#f85149] text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--t-accent-green)] hover:bg-[#2ea043] text-white font-medium py-2 rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
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
      <div className="bg-[var(--t-bg-secondary)] rounded-lg border border-[var(--t-border)] w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold text-[var(--t-text-primary)]">
            {tutorial ? "Edit Tutorial" : "New Tutorial"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-[var(--t-bg-hover)] rounded">
            <X className="w-5 h-5 text-[var(--t-text-muted)]" />
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
            <label className="block text-xs text-[var(--t-text-muted)] mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tutorial title"
              className="w-full px-3 py-2 bg-[var(--t-bg-primary)] border border-[var(--t-border)] rounded-md text-[var(--t-text-primary)] placeholder-[var(--t-text-faint)] focus:ring-2 focus:ring-[var(--t-accent-blue)] outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--t-text-muted)] mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description"
              rows={2}
              className="w-full px-3 py-2 bg-[var(--t-bg-primary)] border border-[var(--t-border)] rounded-md text-[var(--t-text-primary)] placeholder-[var(--t-text-faint)] focus:ring-2 focus:ring-[var(--t-accent-blue)] outline-none resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-[var(--t-border)] text-[var(--t-text-secondary)] rounded-md hover:bg-[var(--t-bg-tertiary)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-[var(--t-accent-green)] hover:bg-[#2ea043] text-white rounded-md transition-colors"
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
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const uploadImage = async (imageId: string, file: File) => {
    setUploadingImageId(imageId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const resp = await fetch("/api/github/upload-image", {
        method: "POST",
        body: formData,
      });
      const data = await resp.json();
      if (resp.ok && data.url) {
        setImages((prev) =>
          prev.map((img) => (img.id === imageId ? { ...img, url: data.url } : img))
        );
      } else {
        alert(data.error || "Failed to upload image");
      }
    } catch {
      alert("Failed to upload image");
    } finally {
      setUploadingImageId(null);
    }
  };

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
      <div className="bg-[var(--t-bg-secondary)] rounded-lg border border-[var(--t-border)] w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold text-[var(--t-text-primary)]">
            {step ? "Edit Step" : "New Step"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-[var(--t-bg-hover)] rounded">
            <X className="w-5 h-5 text-[var(--t-text-muted)]" />
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
            <label className="block text-xs text-[var(--t-text-muted)] mb-1.5">Step Heading</label>
            <input
              type="text"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              placeholder="e.g., Initialize Repository"
              className="w-full px-3 py-2 bg-[var(--t-bg-primary)] border border-[var(--t-border)] rounded-md text-[var(--t-text-primary)] placeholder-[var(--t-text-faint)] focus:ring-2 focus:ring-[var(--t-accent-blue)] outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--t-text-muted)] mb-1.5">Explanation</label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Explain what this step does..."
              rows={2}
              className="w-full px-3 py-2 bg-[var(--t-bg-primary)] border border-[var(--t-border)] rounded-md text-[var(--t-text-primary)] placeholder-[var(--t-text-faint)] focus:ring-2 focus:ring-[var(--t-accent-blue)] outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--t-text-muted)] mb-1.5">Code / Command</label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="git init"
              rows={4}
              className="w-full px-3 py-2 bg-[var(--t-bg-primary)] border border-[var(--t-border)] rounded-md text-[var(--t-text-primary)] placeholder-[var(--t-text-faint)] focus:ring-2 focus:ring-[var(--t-accent-blue)] focus:border-[var(--t-accent-blue)] outline-none resize-none font-mono text-sm"
            />
          </div>

          {/* Screenshots Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-[var(--t-text-muted)] flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                Screenshots <span className="text-[var(--t-text-faint)]">(optional)</span>
              </label>
              <button
                type="button"
                onClick={addImage}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-[var(--t-bg-tertiary)] hover:bg-[var(--t-bg-hover)] text-[var(--t-text-muted)] hover:text-[var(--t-text-primary)] rounded transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add Image
              </button>
            </div>

            {images.length === 0 && (
              <div className="text-center py-6 border border-dashed border-[var(--t-border)] rounded-md">
                <ImageIcon className="w-8 h-8 mx-auto text-[var(--t-text-faint)] mb-2" />
                <p className="text-xs text-[var(--t-text-faint)]">No screenshots added yet</p>
                <p className="text-[10px] text-[var(--t-text-faint)] mt-1">Paste a URL or upload from your PC (PNG, JPEG, WEBP)</p>
              </div>
            )}

            <div className="space-y-3">
              {images.map((img, index) => (
                <div key={img.id} className="bg-[var(--t-bg-primary)] border border-[var(--t-border)] rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs text-[var(--t-text-muted)] font-medium">Image {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      className="p-1 hover:bg-[var(--t-bg-tertiary)] rounded text-[var(--t-text-muted)] hover:text-[#f85149] transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Image URL or Upload */}
                  <div className="flex gap-1.5 mb-2">
                    <input
                      type="url"
                      value={img.url}
                      onChange={(e) => updateImage(img.id, { url: e.target.value })}
                      placeholder="Paste URL or upload from PC"
                      className="flex-1 px-2.5 py-1.5 bg-[var(--t-bg-secondary)] border border-[var(--t-border)] rounded text-sm text-[var(--t-text-primary)] placeholder-[var(--t-text-faint)] focus:ring-1 focus:ring-[var(--t-accent-blue)] outline-none"
                    />
                    <input
                      type="file"
                      ref={(el) => { fileInputRefs.current[img.id] = el; }}
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadImage(img.id, file);
                        e.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRefs.current[img.id]?.click()}
                      disabled={uploadingImageId === img.id}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--t-bg-tertiary)] hover:bg-[var(--t-bg-hover)] border border-[var(--t-border)] rounded text-xs text-[var(--t-text-secondary)] transition-colors disabled:opacity-50 shrink-0"
                      title="Upload from PC"
                    >
                      {uploadingImageId === img.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      {uploadingImageId === img.id ? "Uploading..." : "Upload"}
                    </button>
                  </div>

                  {/* Image Preview */}
                  {img.url && (
                    <div className="mb-3 rounded border border-[var(--t-border)] overflow-hidden bg-[var(--t-bg-secondary)] p-1">
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
                      <label className="block text-[10px] text-[var(--t-text-faint)] mb-1">Position</label>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => updateImage(img.id, { position: "before" })}
                          className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded transition-colors ${
                            img.position === "before"
                              ? "bg-[#1f6feb] text-white"
                              : "bg-[var(--t-bg-tertiary)] text-[var(--t-text-muted)] hover:text-[var(--t-text-primary)]"
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
                              ? "bg-[var(--t-accent-green)] text-white"
                              : "bg-[var(--t-bg-tertiary)] text-[var(--t-text-muted)] hover:text-[var(--t-text-primary)]"
                          }`}
                        >
                          <ArrowDown className="w-3 h-3" />
                          After
                        </button>
                      </div>
                    </div>

                    {/* Caption Position */}
                    <div>
                      <label className="block text-[10px] text-[var(--t-text-faint)] mb-1">Caption Position</label>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => updateImage(img.id, { captionPosition: "top" })}
                          className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors ${
                            img.captionPosition === "top"
                              ? "bg-[#8957e5] text-white"
                              : "bg-[var(--t-bg-tertiary)] text-[var(--t-text-muted)] hover:text-[var(--t-text-primary)]"
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
                              : "bg-[var(--t-bg-tertiary)] text-[var(--t-text-muted)] hover:text-[var(--t-text-primary)]"
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
                      <Type className="w-3 h-3 text-[var(--t-text-faint)]" />
                      <label className="text-[10px] text-[var(--t-text-faint)]">Caption</label>
                    </div>
                    <input
                      type="text"
                      value={img.caption || ""}
                      onChange={(e) => updateImage(img.id, { caption: e.target.value })}
                      placeholder="After running this command, you should see..."
                      className="w-full px-2.5 py-1.5 bg-[var(--t-bg-secondary)] border border-[var(--t-border)] rounded text-xs text-[var(--t-text-primary)] placeholder-[var(--t-text-faint)] focus:ring-1 focus:ring-[var(--t-accent-blue)] outline-none"
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
              className="flex-1 py-2 border border-[var(--t-border)] text-[var(--t-text-secondary)] rounded-md hover:bg-[var(--t-bg-tertiary)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-[var(--t-accent-green)] hover:bg-[#2ea043] text-white rounded-md transition-colors"
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
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [userRole, setUserRole] = useState<"admin" | "vip" | null>(null);
  const isAdmin = userRole === "admin";
  const isVip = userRole === "vip" || userRole === "admin";
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
  const [showAIChat, setShowAIChat] = useState(false);
  const [draggedTutorial, setDraggedTutorial] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(320); // 20rem = 320px default
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const MIN_SIDEBAR_WIDTH = 200;
  const MAX_SIDEBAR_WIDTH = 500;
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [colorTheme, setColorTheme] = useState<"dark" | "light" | "cyber">("dark");
  const [isLoadingTutorials, setIsLoadingTutorials] = useState(true);
  const [activeTab, setActiveTab] = useState<"tutorials" | "repositories" | "history">("tutorials");
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [reposLoaded, setReposLoaded] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [repoContents, setRepoContents] = useState<RepoItem[]>([]);
  const [repoPath, setRepoPath] = useState<string[]>([]);
  const [isLoadingContents, setIsLoadingContents] = useState(false);
  const [viewingFile, setViewingFile] = useState<FileContent | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [changelog, setChangelog] = useState<{ id: number; pushed_at: string; changes: { type: string; title: string; details?: string }[] }[]>([]);
  const [isLoadingChangelog, setIsLoadingChangelog] = useState(false);
  const lastPushedSnapshot = useRef<Tutorial[]>([]);

  // Hash-based routing: read hash on mount
  useEffect(() => {
    const parseHash = () => {
      const hash = window.location.hash.slice(1); // remove #
      if (hash.startsWith("/tutorials/")) {
        const id = hash.replace("/tutorials/", "");
        setActiveTab("tutorials");
        setSelectedTutorial(id);
        setSelectedRepo(null);
        setViewingFile(null);
      } else if (hash.startsWith("/repos/")) {
        const rest = hash.replace("/repos/", "");
        const parts = rest.split("/");
        const repoName = parts[0];
        setActiveTab("repositories");
        setSelectedRepo(repoName);
        if (parts.length > 1) {
          setRepoPath(parts.slice(1));
        }
      }
    };
    parseHash();
    window.addEventListener("hashchange", parseHash);
    return () => window.removeEventListener("hashchange", parseHash);
  }, []);

  // Update hash when navigation changes
  useEffect(() => {
    if (activeTab === "tutorials" && selectedTutorial) {
      const newHash = `#/tutorials/${selectedTutorial}`;
      if (window.location.hash !== newHash) {
        window.history.replaceState(null, "", newHash);
      }
    } else if (activeTab === "repositories" && selectedRepo) {
      const path = repoPath.length > 0 ? `/${repoPath.join("/")}` : "";
      const newHash = `#/repos/${selectedRepo}${path}`;
      if (window.location.hash !== newHash) {
        window.history.replaceState(null, "", newHash);
      }
    }
  }, [activeTab, selectedTutorial, selectedRepo, repoPath]);

  // Load tutorials from server cache on mount (serves GitHub data to everyone globally)
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Verify stored JWT token on mount
      const token = localStorage.getItem("auth_token");
      if (token) {
        fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        })
          .then((r) => r.json())
          .then((d) => { if (d.valid && d.role) setUserRole(d.role); else localStorage.removeItem("auth_token"); })
          .catch(() => localStorage.removeItem("auth_token"));
      }
      const savedTerminalUrl = localStorage.getItem("terminalUrl");
      if (savedTerminalUrl) setTerminalUrl(savedTerminalUrl);
      const savedTerminalLocked = localStorage.getItem("terminalLocked");
      if (savedTerminalLocked !== null) setTerminalLocked(savedTerminalLocked === "true");
      const savedTheme = localStorage.getItem("colorTheme") as "dark" | "light" | "cyber" | null;
      if (savedTheme) setColorTheme(savedTheme);
    }

    // Load tutorials: instant from cache, then refresh from API in background
    const cached = localStorage.getItem("xalhexi-tutorials-cache");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTutorials(parsed);
          if (!window.location.hash) setSelectedTutorial(parsed[0].id);
          setIsLoadingTutorials(false);
        }
      } catch { /* corrupt cache, ignore */ }
    }

    const loadTutorials = async () => {
      try {
        const resp = await fetch("/api/tutorials");
        const data = await resp.json();
        if (resp.ok && Array.isArray(data.tutorials) && data.tutorials.length > 0) {
          setTutorials(data.tutorials);
          lastPushedSnapshot.current = JSON.parse(JSON.stringify(data.tutorials));
          localStorage.setItem("xalhexi-tutorials-cache", JSON.stringify(data.tutorials));
          if (!cached && !window.location.hash) setSelectedTutorial(data.tutorials[0].id);
        }
      } catch {
        if (!cached) {
          setTutorials(defaultTutorials);
          setSelectedTutorial(defaultTutorials[0]?.id || null);
        }
      } finally {
        setIsLoadingTutorials(false);
      }
    };
    loadTutorials();
  }, []);

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

  // Apply color theme
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove("dark", "light", "cyber");
    html.classList.add(colorTheme);
    localStorage.setItem("colorTheme", colorTheme);
  }, [colorTheme]);

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

  const currentTutorial = tutorials.find((t) => t.id === selectedTutorial) || tutorials[0] || null;
  const currentStepForAI = currentTutorial?.steps?.[0] || null;

  const handleLogin = async (u: string, p: string): Promise<boolean> => {
    try {
      const resp = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p }),
      });
      const data = await resp.json();
      if (resp.ok && data.token && data.role) {
        localStorage.setItem("auth_token", data.token);
        setUserRole(data.role);
        showToast(`Logged in as ${data.role}`);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleLogout = () => {
    setUserRole(null);
    localStorage.removeItem("auth_token");
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

  // Filter tutorials for sidebar
  // Admin: sees everything | VIP: sees all (read-only) | Guest: no locked, no vipOnly
  const filteredTutorials = useMemo(() => {
    let filtered = tutorials;
    if (!isAdmin && !isVip) {
      // Guests: hide locked and vipOnly
      filtered = filtered.filter((t) => !t.locked && !t.vipOnly);
    } else if (!isAdmin && isVip) {
      // VIP: hide locked but show vipOnly
      filtered = filtered.filter((t) => !t.locked);
    }
    // Admin: no filtering
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
  }, [tutorials, searchQuery, isAdmin, isVip]);

  // Search results - find all matching steps across visible tutorials (exclude locked for non-admin)
  const searchResults = useMemo((): SearchResult[] => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results: SearchResult[] = [];
    const visibleTutorials = isAdmin ? tutorials : tutorials.filter((t) => !t.locked);

    visibleTutorials.forEach((tutorial) => {
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
  }, [tutorials, searchQuery, isAdmin]);

  const isSearching = searchQuery.trim().length > 0;

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

  const toggleStar = (id: string) => {
    setTutorials((prev) =>
      prev.map((t) => (t.id === id ? { ...t, starred: !t.starred } : t))
    );
  };

  const toggleCrown = (id: string) => {
    setTutorials((prev) =>
      prev.map((t) => (t.id === id ? { ...t, vipOnly: !t.vipOnly } : t))
    );
  };

  const toggleTerminalLock = () => {
    setTerminalLocked((prev) => !prev);
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

  // Save tutorials to GitHub and update the global server cache
  const pushToGithub = async () => {
    const confirmed = window.confirm(
      "This will save your current tutorials to GitHub.\nEveryone will see these tutorials.\n\nContinue?"
    );
    if (!confirmed) return;

    setIsPushing(true);
    try {
      console.log("[v0] Pushing to /api/github/push...");
      const resp = await fetch("/api/github/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tutorials }),
      });
      console.log("[v0] Push response status:", resp.status, resp.statusText);
      const text = await resp.text();
      console.log("[v0] Push response body:", text.substring(0, 500));
      let data;
      try { data = JSON.parse(text); } catch { throw new Error(`Server returned non-JSON (status ${resp.status}): ${text.substring(0, 200)}`); }
      if (!resp.ok) {
        throw new Error(data.error || `HTTP ${resp.status}`);
      }
      localStorage.setItem("xalhexi-tutorials-cache", JSON.stringify(tutorials));

      // Auto-detect changes: compare snapshot vs current
      const prev = lastPushedSnapshot.current;
      const changes: { type: string; title: string; details?: string }[] = [];
      const prevMap = new Map(prev.map((t) => [t.id, t]));
      const currMap = new Map(tutorials.map((t) => [t.id, t]));

      // Detect added
      for (const t of tutorials) {
        if (!prevMap.has(t.id)) {
          changes.push({ type: "added", title: t.title });
        }
      }
      // Detect deleted
      for (const t of prev) {
        if (!currMap.has(t.id)) {
          changes.push({ type: "deleted", title: t.title });
        }
      }
      // Detect modified
      for (const t of tutorials) {
        const old = prevMap.get(t.id);
        if (!old) continue;
        const mods: string[] = [];
        if (old.title !== t.title) mods.push("title");
        if (old.description !== t.description) mods.push("description");
        if (old.locked !== t.locked) mods.push(t.locked ? "locked" : "unlocked");
        if (old.starred !== t.starred) mods.push(t.starred ? "starred" : "unstarred");
        if (old.vipOnly !== t.vipOnly) mods.push(t.vipOnly ? "crowned VIP" : "removed VIP");
        if (old.steps.length !== t.steps.length) {
          mods.push(`steps: ${old.steps.length} -> ${t.steps.length}`);
        } else {
          for (let i = 0; i < t.steps.length; i++) {
            if (old.steps[i]?.heading !== t.steps[i]?.heading || old.steps[i]?.code !== t.steps[i]?.code || old.steps[i]?.explanation !== t.steps[i]?.explanation) {
              mods.push(`step ${i + 1} edited`);
              break;
            }
          }
        }
        if (mods.length > 0) {
          changes.push({ type: "modified", title: t.title, details: mods.join(", ") });
        }
      }

      // Save changelog to Supabase if there are changes
      if (changes.length > 0) {
        fetch("/api/changelog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ changes }),
        }).catch(() => {});
      }

      // Update snapshot
      lastPushedSnapshot.current = JSON.parse(JSON.stringify(tutorials));

      showToast(changes.length > 0 ? `Saved! ${changes.length} change(s) detected.` : "Saved! No changes detected.");
    } catch (error) {
      showToast("Failed to save: " + (error instanceof Error ? error.message : "Unknown error"));
      console.error("Push error:", error);
    } finally {
      setIsPushing(false);
    }
  };

  // Pull from GitHub: revalidate the server cache, then re-fetch fresh data
  // This updates what EVERYONE sees globally, not just this browser
  const pullFromGithub = async () => {
    setIsSyncing(true);
    try {
      // Step 1: Tell the server to bust the cache and re-fetch from GitHub
      console.log("[v0] Pulling from /api/github/pull...");
      const revalidateResp = await fetch("/api/github/pull", { method: "POST" });
      console.log("[v0] Pull response status:", revalidateResp.status, revalidateResp.statusText);
      const pullText = await revalidateResp.text();
      console.log("[v0] Pull response body:", pullText.substring(0, 500));
      if (!revalidateResp.ok) {
        let err;
        try { err = JSON.parse(pullText); } catch { throw new Error(`Server returned non-JSON (status ${revalidateResp.status}): ${pullText.substring(0, 200)}`); }
        throw new Error(err.error || "Failed to revalidate");
      }

      // Step 2: Fetch the now-fresh tutorials from the server cache
      const resp = await fetch("/api/tutorials");
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || `HTTP ${resp.status}`);
      }
      if (Array.isArray(data.tutorials) && data.tutorials.length > 0) {
        setTutorials(data.tutorials);
        lastPushedSnapshot.current = JSON.parse(JSON.stringify(data.tutorials));
        localStorage.setItem("xalhexi-tutorials-cache", JSON.stringify(data.tutorials));
        setSelectedTutorial(data.tutorials[0].id);
        showToast("Synced! All users now see the latest tutorials.");
      } else {
        showToast("No tutorials found on GitHub");
      }
    } catch (error) {
      showToast("Failed to sync: " + (error instanceof Error ? error.message : "Unknown error"));
      console.error("Pull error:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Fetch public repos when switching to repositories tab
  // - default: uses server-side cache (5min) to avoid GitHub rate limits
  // - force=true (admin-only button): bypasses cache and pulls fresh from GitHub
  const loadRepos = async (force: boolean = false): Promise<boolean> => {
    if (!force && reposLoaded) return true;
    setIsLoadingRepos(true);
    try {
      const url = force
        ? `/api/github/repos?force=1&ts=${Date.now()}`
        : "/api/github/repos";
      const resp = await fetch(url, force ? { cache: "no-store" } : undefined);
      const data = await resp.json();
      if (resp.ok && Array.isArray(data.repos)) {
        setRepos(data.repos);
        setReposLoaded(true);
        return true;
      } else {
        showToast(data.error || "Failed to load repositories");
        return false;
      }
    } catch {
      showToast("Failed to load repositories");
      return false;
    } finally {
      setIsLoadingRepos(false);
    }
  };

  // Admin-only: refresh repos RIGHT NOW (bypass cache)
  const refreshReposNow = async () => {
    const ok = await loadRepos(true);
    if (!ok) return;
    // If user is already browsing a repo, refresh the current directory too
    if (selectedRepo) {
      await loadRepoContents(selectedRepo, repoPath.join("/"), true);
    }
    showToast("Repositories refreshed!");
  };

  // Fetch contents of a repo directory
  const loadRepoContents = async (repo: string, path: string = "", force: boolean = false) => {
    setIsLoadingContents(true);
    setViewingFile(null);
    try {
      const url = `/api/github/contents?repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(path)}${
        force ? `&force=1&ts=${Date.now()}` : ""
      }`;
      const resp = await fetch(url, force ? { cache: "no-store" } : undefined);
      const data = await resp.json();
      if (resp.ok && data.type === "dir") {
        setRepoContents(data.items);
      }
    } catch {
      showToast("Failed to load contents");
    } finally {
      setIsLoadingContents(false);
    }
  };

  // Fetch a single file's content
  const loadFileContent = async (repo: string, path: string, force: boolean = false) => {
    setIsLoadingFile(true);
    try {
      const url = `/api/github/contents?repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(path)}${
        force ? `&force=1&ts=${Date.now()}` : ""
      }`;
      const resp = await fetch(url, force ? { cache: "no-store" } : undefined);
      const data = await resp.json();
      if (resp.ok && data.type === "file") {
        setViewingFile(data);
      }
    } catch {
      showToast("Failed to load file");
    } finally {
      setIsLoadingFile(false);
    }
  };

  // Navigate into a folder
  const enterFolder = (folderName: string) => {
    if (!selectedRepo) return;
    const newPath = [...repoPath, folderName];
    setRepoPath(newPath);
    loadRepoContents(selectedRepo, newPath.join("/"));
  };

  // Navigate back up
  const goBack = () => {
    if (!selectedRepo) return;
    if (viewingFile) {
      setViewingFile(null);
      return;
    }
    const newPath = [...repoPath];
    newPath.pop();
    setRepoPath(newPath);
    loadRepoContents(selectedRepo, newPath.join("/"));
  };

  // Open a repo
  const openRepo = (repoName: string) => {
    setSelectedRepo(repoName);
    setRepoPath([]);
    setViewingFile(null);
    loadRepoContents(repoName);
  };

  // Go back to repo list
  const backToRepoList = () => {
    setSelectedRepo(null);
    setRepoPath([]);
    setRepoContents([]);
    setViewingFile(null);
  };

  // Handle tab switch
  const switchTab = (tab: "tutorials" | "repositories" | "history") => {
    setActiveTab(tab);
    if (tab === "repositories" && !reposLoaded) {
      loadRepos();
    }
    if (tab === "history" && changelog.length === 0) {
      loadChangelog();
    }
  };

  // Load changelog from Supabase
  const loadChangelog = async () => {
    setIsLoadingChangelog(true);
    try {
      const resp = await fetch("/api/changelog");
      const data = await resp.json();
      if (resp.ok && Array.isArray(data.entries)) {
        setChangelog(data.entries);
      }
    } catch { /* silent */ }
    setIsLoadingChangelog(false);
  };

  const [fileCopied, setFileCopied] = useState(false);

  // Copy file content to clipboard
  const copyFileContent = (content: string) => {
    navigator.clipboard.writeText(content);
    setFileCopied(true);
    setTimeout(() => setFileCopied(false), 2000);
  };

  // Get highlight.js language from filename
  const getLanguage = (filename: string): string | undefined => {
    const ext = filename.split(".").pop()?.toLowerCase();
    const map: Record<string, string> = {
      js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
      py: "python", rb: "ruby", rs: "rust", go: "go", java: "java",
      c: "c", cpp: "cpp", cs: "csharp", swift: "swift", kt: "kotlin",
      html: "html", htm: "html", css: "css", scss: "scss", less: "less",
      json: "json", xml: "xml", yaml: "yaml", yml: "yaml", toml: "ini",
      md: "markdown", sh: "bash", bash: "bash", zsh: "bash",
      sql: "sql", php: "php", lua: "lua", r: "r",
      dockerfile: "dockerfile", makefile: "makefile",
    };
    return ext ? map[ext] : undefined;
  };

  // Highlight code content
  const highlightCode = (content: string, filename: string): string => {
    const lang = getLanguage(filename);
    if (lang) {
      try {
        return hljs.highlight(content, { language: lang }).value;
      } catch {
        // fallback to auto-detect
      }
    }
    try {
      return hljs.highlightAuto(content).value;
    } catch {
      return content;
    }
  };

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Language color map
  const langColor: Record<string, string> = {
    TypeScript: "#3178c6",
    JavaScript: "#f1e05a",
    Python: "#3572A5",
    HTML: "#e34c26",
    CSS: "#563d7c",
    Java: "#b07219",
    "C++": "#f34b7d",
    C: "#555555",
    Shell: "#89e051",
    Rust: "#dea584",
    Go: "#00ADD8",
    PHP: "#4F5D95",
  };

  return (
    <div className="min-h-screen bg-[var(--t-bg-primary)] text-[var(--t-text-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--t-bg-secondary)] border-b border-[var(--t-border)]">
        <div className="px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-[var(--t-bg-tertiary)] rounded-md"
            >
              <Menu className="w-5 h-5 text-[var(--t-text-muted)]" />
            </button>
  <a
    href="https://github.com/xalhexi-sch"
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
  >
    <Github className="w-5 h-5 text-[var(--t-text-primary)]" />
    <span className="font-semibold text-[var(--t-text-primary)]">xalhexi.wtf</span>
  </a>
          </div>

          {/* Mobile tab switcher */}
          <div className="flex items-center gap-1 lg:hidden">
            <button
              onClick={() => switchTab("tutorials")}
              className={`px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide rounded-md transition-colors ${
                activeTab === "tutorials"
                  ? "bg-[var(--t-accent-green)] text-white"
                  : "bg-[var(--t-bg-tertiary)] text-[var(--t-text-muted)]"
              }`}
            >
              Tutorials
            </button>
            <button
              onClick={() => switchTab("repositories")}
              className={`px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide rounded-md transition-colors ${
                activeTab === "repositories"
                  ? "bg-[var(--t-accent-green)] text-white"
                  : "bg-[var(--t-bg-tertiary)] text-[var(--t-text-muted)]"
              }`}
            >
              Repos
            </button>
            <button
              onClick={() => switchTab("history")}
              className={`px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide rounded-md transition-colors ${
                activeTab === "history"
                  ? "bg-[var(--t-accent-green)] text-white"
                  : "bg-[var(--t-bg-tertiary)] text-[var(--t-text-muted)]"
              }`}
            >
              History
            </button>
          </div>

          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--t-text-faint)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tutorials..."
                className="w-full pl-9 pr-3 py-1.5 bg-[var(--t-bg-primary)] border border-[var(--t-border)] rounded-md text-sm text-[var(--t-text-primary)] placeholder-[var(--t-text-faint)] focus:ring-1 focus:ring-[var(--t-accent-blue)] focus:border-[var(--t-accent-blue)] outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
  {/* Terminal button - only show if URL is configured AND (admin OR unlocked) */}
  {terminalUrl && (isAdmin || !terminalLocked) && (
    <button
      onClick={() => setShowTerminal(true)}
      className="p-2 hover:bg-[var(--t-bg-tertiary)] rounded-md transition-colors"
      title="Open Terminal"
    >
      <Monitor className="w-5 h-5 text-[var(--t-accent-blue)]" />
    </button>
  )}
  <button
    onClick={() => setColorTheme(colorTheme === "dark" ? "light" : colorTheme === "light" ? "cyber" : "dark")}
    className="p-2 hover:bg-[var(--t-bg-tertiary)] rounded-md transition-colors"
    title={`Theme: ${colorTheme} (click to switch)`}
  >
    {colorTheme === "dark" && <Moon className="w-5 h-5 text-[var(--t-text-muted)]" />}
    {colorTheme === "light" && <Sun className="w-5 h-5 text-[var(--t-accent-orange)]" />}
    {colorTheme === "cyber" && <Zap className="w-5 h-5 text-[#a855f7]" />}
  </button>
  {userRole ? (
    <>
      {userRole === "vip" && (
        <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-amber-500/10 text-amber-400 rounded-md">
          <Crown className="w-3 h-3" />
          VIP
        </span>
      )}
      {isAdmin && (
        <button
          onClick={() => setTerminalSettingsOpen(true)}
          className="p-2 hover:bg-[var(--t-bg-tertiary)] rounded-md transition-colors"
          title="Terminal Settings"
        >
          <Terminal className="w-5 h-5 text-[var(--t-text-muted)]" />
        </button>
      )}
      <button
        onClick={handleLogout}
        className="p-2 hover:bg-[var(--t-bg-tertiary)] rounded-md transition-colors"
        title="Logout"
      >
        <LogOut className="w-5 h-5 text-[var(--t-text-muted)]" />
      </button>
    </>
  ) : (
    <button
      onClick={() => setLoginModalOpen(true)}
      className="p-2 hover:bg-[var(--t-bg-tertiary)] rounded-md transition-colors"
      title="Sign In"
    >
      <Settings className="w-4 h-4 text-[var(--t-text-faint)]" />
    </button>
  )}
          </div>
        </div>

        {/* Mobile search */}
        <div className="px-4 pb-3 sm:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--t-text-faint)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tutorials..."
              className="w-full pl-9 pr-3 py-2 bg-[var(--t-bg-primary)] border border-[var(--t-border)] rounded-md text-sm text-[var(--t-text-primary)] placeholder-[var(--t-text-faint)] focus:ring-1 focus:ring-[var(--t-accent-blue)] focus:border-[var(--t-accent-blue)] outline-none"
            />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Left Sidebar - Tutorial List */}
        <aside
          ref={sidebarRef}
          style={{ width: sidebarWidth }}
          className={`fixed lg:sticky top-14 left-0 z-30 h-[calc(100vh-3.5rem)] bg-[var(--t-bg-secondary)] border-r border-[var(--t-border)] overflow-hidden transition-transform lg:translate-x-0 shrink-0 ${
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
          <div className="flex flex-col h-full">
          {/* Sidebar top: tabs */}
          <div className="p-4 pb-0 shrink-0">
            {/* Tab buttons */}
            <div className="flex items-center gap-1 mb-4">
              <button
                onClick={() => switchTab("tutorials")}
                className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide rounded-md transition-colors ${
                  activeTab === "tutorials"
                    ? "bg-[var(--t-accent-green)] text-white"
                    : "bg-[var(--t-bg-tertiary)] text-[var(--t-text-muted)] hover:bg-[var(--t-bg-hover)] hover:text-[var(--t-text-primary)]"
                }`}
              >
                Tutorials
              </button>
              <button
                onClick={() => switchTab("repositories")}
                className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide rounded-md transition-colors ${
                  activeTab === "repositories"
                    ? "bg-[var(--t-accent-green)] text-white"
                    : "bg-[var(--t-bg-tertiary)] text-[var(--t-text-muted)] hover:bg-[var(--t-bg-hover)] hover:text-[var(--t-text-primary)]"
                }`}
              >
                Repositories
              </button>
              <button
                onClick={() => switchTab("history")}
                className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wide rounded-md transition-colors ${
                  activeTab === "history"
                    ? "bg-[var(--t-accent-green)] text-white"
                    : "bg-[var(--t-bg-tertiary)] text-[var(--t-text-muted)] hover:bg-[var(--t-bg-hover)] hover:text-[var(--t-text-primary)]"
                }`}
              >
                History
              </button>
              {activeTab === "tutorials" && isAdmin && (
                <button
                  onClick={() => {
                    setEditingTutorial(null);
                    setTutorialModalOpen(true);
                  }}
                  className="ml-auto p-1 hover:bg-[var(--t-bg-tertiary)] rounded text-[var(--t-text-muted)] hover:text-[var(--t-text-primary)]"
                  title="Add Tutorial"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Sidebar middle: scrollable content */}
          <div className="flex-1 overflow-y-auto px-4 py-2 min-h-0">
            {/* Tutorials list */}
            {activeTab === "tutorials" && (
            <nav className="space-y-1">
              {!isLoadingTutorials && filteredTutorials.map((tutorial) => (
                <div
                  key={tutorial.id}
                  draggable={isAdmin}
                  onDragStart={() => isAdmin && handleDragStart(tutorial.id)}
                  onDragOver={(e) => { if (isAdmin) handleDragOver(e); }}
                  onDrop={() => isAdmin && handleDrop(tutorial.id)}
                  className={`group flex items-center rounded-md transition-colors cursor-pointer ${
                    selectedTutorial === tutorial.id
                      ? "bg-[var(--t-bg-tertiary)] text-[var(--t-text-primary)]"
                      : "text-[var(--t-text-muted)] hover:bg-[var(--t-bg-tertiary)] hover:text-[var(--t-text-primary)]"
                  }`}
                >
                  {isAdmin && (
                    <div className="shrink-0 pl-1 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-60 transition-opacity">
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedTutorial(tutorial.id)}
                    className={`flex-1 flex items-center gap-2 ${isAdmin ? "pl-1 pr-1" : "px-3"} py-2 text-sm text-left min-w-0`}
                  >
                    {tutorial.starred && (
                      <Star className="w-3 h-3 shrink-0 fill-yellow-400 text-yellow-400" />
                    )}
                    {tutorial.vipOnly && (
                      <Crown className="w-3 h-3 shrink-0 text-amber-400" />
                    )}
                    <span className="truncate" title={tutorial.title}>{tutorial.title}</span>
                  </button>
                  {isAdmin && (
                    <div className="flex items-center shrink-0 mr-1 gap-0.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleStar(tutorial.id); }}
                        className={`p-1 hover:bg-[var(--t-bg-hover)] rounded transition-all ${
                          tutorial.starred ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        }`}
                        title={tutorial.starred ? "Unstar" : "Star as priority"}
                      >
                        <Star className={`w-3 h-3 ${tutorial.starred ? "fill-yellow-400 text-yellow-400" : "text-[var(--t-text-faint)]"}`} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleCrown(tutorial.id); }}
                        className={`p-1 hover:bg-[var(--t-bg-hover)] rounded transition-all ${
                          tutorial.vipOnly ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        }`}
                        title={tutorial.vipOnly ? "Remove VIP" : "Mark as VIP only"}
                      >
                        <Crown className={`w-3 h-3 ${tutorial.vipOnly ? "text-amber-400" : "text-[var(--t-text-faint)]"}`} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleLock(tutorial.id); }}
                        className={`p-1 hover:bg-[var(--t-bg-hover)] rounded transition-all ${
                          tutorial.locked ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        }`}
                        title={tutorial.locked ? "Unlock tutorial" : "Lock tutorial"}
                      >
                        {tutorial.locked ? (
                          <Lock className="w-3 h-3 text-[var(--t-accent-orange)]" />
                        ) : (
                          <Unlock className="w-3 h-3 text-[var(--t-accent-green-text)]" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {isLoadingTutorials && (
                <div className="space-y-2 py-2">
                  <div className="skeleton-shimmer h-9 w-full" />
                  <div className="skeleton-shimmer h-9 w-4/5" />
                  <div className="skeleton-shimmer h-9 w-11/12" />
                </div>
              )}
              {!isLoadingTutorials && filteredTutorials.length === 0 && (
                <p className="text-sm text-[var(--t-text-faint)] text-center py-4">No tutorials found</p>
              )}
            </nav>
            )}

            {/* Repositories list */}
            {activeTab === "repositories" && (
              <nav className="space-y-1">
                {isLoadingRepos && (
                  <div className="space-y-2 py-2">
                    <div className="skeleton-shimmer h-12 w-full" />
                    <div className="skeleton-shimmer h-12 w-4/5" />
                    <div className="skeleton-shimmer h-12 w-11/12" />
                  </div>
                )}
                {!isLoadingRepos && repos.map((repo) => (
                  <button
                    key={repo.name}
                    onClick={() => openRepo(repo.name)}
                    className={`w-full text-left px-3 py-2.5 rounded-md transition-colors ${
                      selectedRepo === repo.name
                        ? "bg-[var(--t-bg-tertiary)] text-[var(--t-text-primary)]"
                        : "text-[var(--t-text-muted)] hover:bg-[var(--t-bg-tertiary)] hover:text-[var(--t-text-primary)]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-3.5 h-3.5 shrink-0 text-[var(--t-text-muted)]" />
                      <span className="text-sm font-medium truncate">{repo.name}</span>
                    </div>
                    {repo.description && (
                      <p className="text-[11px] text-[var(--t-text-faint)] mt-0.5 ml-6 truncate">{repo.description}</p>
                    )}
  {repo.languages && repo.languages.length > 0 && (
  <div className="flex items-center gap-2 mt-1 ml-6 flex-wrap">
    {repo.languages.slice(0, 4).map((lang) => (
      <div key={lang} className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: langColor[lang] || "#8b949e" }} />
        <span className="text-[10px] text-[var(--t-text-faint)]">{lang}</span>
      </div>
    ))}
    {repo.languages.length > 4 && (
      <span className="text-[10px] text-[var(--t-text-faint)]">+{repo.languages.length - 4}</span>
    )}
  </div>
  )}
  </button>
  ))}
  {!isLoadingRepos && repos.length === 0 && (
                  <p className="text-sm text-[var(--t-text-faint)] text-center py-4">No public repos found</p>
                )}
              </nav>
            )}
          </div>

          {/* Sidebar bottom: pinned footer */}
          <div className="shrink-0 p-4 pt-2 border-t border-[var(--t-border)] bg-[var(--t-bg-secondary)] space-y-2">
            {isAdmin && activeTab === "tutorials" && (
              <>
                {/* GitHub Push/Pull */}
                <div className="flex gap-2">
                  <button
                    onClick={pushToGithub}
                    disabled={isPushing}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-[var(--t-accent-green)] hover:bg-[#2ea043] text-white rounded-md transition-colors disabled:opacity-50"
                  >
                    <Upload className={`w-3.5 h-3.5 ${isPushing ? "animate-pulse" : ""}`} />
                    {isPushing ? "Saving..." : "Save to GitHub"}
                  </button>
                  <button
                    onClick={pullFromGithub}
                    disabled={isSyncing}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-md transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                    {isSyncing ? "Syncing..." : "Sync from GitHub"}
                  </button>
                </div>
                {/* File Export/Import */}
                <div className="flex gap-2">
                  <button
                    onClick={exportTutorials}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-medium bg-[var(--t-bg-tertiary)] hover:bg-[var(--t-bg-hover)] text-[var(--t-text-muted)] border border-[var(--t-border)] rounded-md transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    Export
                  </button>
                  <button
                    onClick={importTutorials}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-medium bg-[var(--t-bg-tertiary)] hover:bg-[var(--t-bg-hover)] text-[var(--t-text-muted)] border border-[var(--t-border)] rounded-md transition-colors"
                  >
                    <Upload className="w-3 h-3" />
                    Import
                  </button>
                </div>
              </>
            )}

            {isAdmin && activeTab === "repositories" && (
              <div className="flex gap-2">
                <button
                  onClick={refreshReposNow}
                  disabled={isLoadingRepos || isLoadingContents || isLoadingFile}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-md transition-colors disabled:opacity-50"
                  title="Admin: bypass cache and pull fresh repos/contents from GitHub"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${(isLoadingRepos || isLoadingContents || isLoadingFile) ? "animate-spin" : ""}`} />
                  {(isLoadingRepos || isLoadingContents || isLoadingFile) ? "Refreshing..." : "Refresh Repos Now"}
                </button>
              </div>
            )}
            {/* History / Changelog */}
            {activeTab === "history" && (
              <div className="space-y-3">
                {isLoadingChangelog ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-[var(--t-text-faint)]" />
                  </div>
                ) : changelog.length === 0 ? (
                  <p className="text-sm text-[var(--t-text-faint)] text-center py-8">No changes recorded yet. Push tutorials to start tracking.</p>
                ) : (
                  changelog.map((entry) => (
                    <div key={entry.id} className="border border-[var(--t-border)] rounded-lg overflow-hidden">
                      <div className="px-3 py-2 bg-[var(--t-bg-tertiary)] border-b border-[var(--t-border)] flex items-center gap-2">
                        <History className="w-3.5 h-3.5 text-[var(--t-text-faint)]" />
                        <span className="text-xs text-[var(--t-text-muted)] font-medium">
                          {new Date(entry.pushed_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                          {" "}
                          {new Date(entry.pushed_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span className="ml-auto text-[10px] text-[var(--t-text-faint)] bg-[var(--t-bg-primary)] px-1.5 py-0.5 rounded">
                          {entry.changes.length} change{entry.changes.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="divide-y divide-[var(--t-border)]">
                        {entry.changes.map((ch, ci) => (
                          <div key={ci} className="px-3 py-2 flex items-start gap-2">
                            <span className={`mt-0.5 inline-block w-2 h-2 rounded-full shrink-0 ${
                              ch.type === "added" ? "bg-[var(--t-accent-green)]" :
                              ch.type === "deleted" ? "bg-[#f85149]" :
                              "bg-[var(--t-accent-blue)]"
                            }`} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[10px] font-semibold uppercase ${
                                  ch.type === "added" ? "text-[var(--t-accent-green-text)]" :
                                  ch.type === "deleted" ? "text-[#f85149]" :
                                  "text-[var(--t-accent-blue)]"
                                }`}>
                                  {ch.type}
                                </span>
                                <span className="text-sm text-[var(--t-text-primary)] truncate">{ch.title}</span>
                              </div>
                              {ch.details && (
                                <p className="text-xs text-[var(--t-text-faint)] mt-0.5">{ch.details}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Terminal button */}
            {(isAdmin || !terminalLocked) && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowTerminal(true)}
                  className="flex-1 flex items-center gap-2 px-3 py-2 rounded-md text-sm text-[var(--t-accent-blue)] hover:bg-[var(--t-bg-tertiary)] transition-colors"
                >
                  <Terminal className="w-4 h-4" />
                  <span>Terminal</span>
                </button>
                {isAdmin && (
                  <button
                    onClick={toggleTerminalLock}
                    className="p-1.5 hover:bg-[var(--t-bg-tertiary)] rounded transition-all"
                    title={terminalLocked ? "Unlock terminal" : "Lock terminal"}
                  >
                    {terminalLocked ? (
                      <Lock className="w-3.5 h-3.5 text-[var(--t-accent-orange)]" />
                    ) : (
                      <Unlock className="w-3.5 h-3.5 text-[var(--t-accent-green-text)]" />
                    )}
                  </button>
                )}
              </div>
            )}
            {/* AI Assistant button */}
            <button
              onClick={() => setShowAIChat(true)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                showAIChat
                  ? "bg-[var(--t-accent-blue)]/10 text-[var(--t-accent-blue)]"
                  : "text-[var(--t-accent-purple,#a78bfa)] hover:bg-[var(--t-bg-tertiary)]"
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>AI Assistant</span>
              {showAIChat && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--t-accent-green)]" />}
            </button>
            <a
              href="https://github.com/xalhexi-sch"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-[var(--t-text-faint)] hover:text-[var(--t-text-muted)] transition-colors"
            >
              <Heart className="w-3 h-3" />
              <span>Made by xalhexi-sch</span>
            </a>
          </div>
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

          {/* Loading skeleton for main content */}
          {activeTab === "tutorials" && isLoadingTutorials ? (
            <div className="max-w-3xl mx-auto">
              {/* Title skeleton */}
              <div className="mb-6">
                <div className="skeleton-shimmer h-7 w-2/5 mb-3" />
                <div className="skeleton-shimmer h-4 w-3/5" />
              </div>
              {/* Step skeletons */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-[var(--t-bg-secondary)] border border-[var(--t-border)] rounded-lg overflow-hidden mb-4">
                  <div className="px-4 py-3 border-b border-[var(--t-border)]">
                    <div className="skeleton-shimmer h-5 w-1/3" />
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="skeleton-shimmer h-4 w-full" />
                    <div className="skeleton-shimmer h-4 w-4/5" />
                    <div className="skeleton-shimmer h-4 w-3/5" />
                    <div className="skeleton-shimmer h-20 w-full mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : activeTab === "repositories" ? (
            <div className="max-w-3xl mx-auto">
              {!selectedRepo ? (
                /* Repo list view */
                <div>
                  <div className="mb-6">
                    <h1 className="text-2xl font-bold text-[var(--t-text-primary)] mb-1">Public Repositories</h1>
                    <p className="text-[var(--t-text-muted)] text-sm">Public repositories from xalhexi-sch</p>
                  </div>
                  {isLoadingRepos ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="p-4 bg-[var(--t-bg-secondary)] border border-[var(--t-border)] rounded-lg">
                          <div className="skeleton-shimmer h-5 w-2/5 mb-3" />
                          <div className="skeleton-shimmer h-4 w-4/5 mb-2 ml-6" />
                          <div className="skeleton-shimmer h-3 w-1/4 ml-6" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {repos.map((repo) => (
                        <button
                          key={repo.name}
                          onClick={() => openRepo(repo.name)}
                          className="w-full text-left p-4 bg-[var(--t-bg-secondary)] border border-[var(--t-border)] rounded-lg hover:border-[var(--t-text-faint)] transition-colors"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <GitBranch className="w-4 h-4 text-[var(--t-text-muted)]" />
                            <span className="text-[var(--t-accent-blue)] font-semibold text-sm hover:underline">{repo.name}</span>
                          </div>
                          {repo.description && (
                            <p className="text-sm text-[var(--t-text-muted)] mb-2 ml-6">{repo.description}</p>
                          )}
  <div className="flex items-center gap-4 ml-6 flex-wrap">
  {repo.languages && repo.languages.length > 0 && (
    <div className="flex items-center gap-2 flex-wrap">
      {repo.languages.map((lang) => (
        <div key={lang} className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: langColor[lang] || "#8b949e" }} />
          <span className="text-xs text-[var(--t-text-muted)]">{lang}</span>
        </div>
      ))}
    </div>
  )}
  <span className="text-xs text-[var(--t-text-faint)]">
  Updated {new Date(repo.updated_at).toLocaleDateString()}
  </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : viewingFile ? (
                /* File content view */
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={goBack}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[var(--t-bg-tertiary)] hover:bg-[var(--t-bg-hover)] text-[var(--t-text-secondary)] border border-[var(--t-border)] rounded-md transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </button>
                    <div className="flex items-center gap-1.5 text-sm text-[var(--t-text-muted)] min-w-0">
                      <button onClick={backToRepoList} className="text-[var(--t-accent-blue)] hover:underline shrink-0">{selectedRepo}</button>
                      {repoPath.map((part, i) => (
                        <React.Fragment key={i}>
                          <span className="text-[var(--t-text-faint)]">/</span>
                          <button
                            onClick={() => {
                              const newPath = repoPath.slice(0, i + 1);
                              setRepoPath(newPath);
                              setViewingFile(null);
                              loadRepoContents(selectedRepo, newPath.join("/"));
                            }}
                            className="text-[var(--t-accent-blue)] hover:underline"
                          >
                            {part}
                          </button>
                        </React.Fragment>
                      ))}
                      <span className="text-[var(--t-text-faint)]">/</span>
                      <span className="text-[var(--t-text-primary)] truncate">{viewingFile.name}</span>
                    </div>
                  </div>
                  {isLoadingFile ? (
                    <div className="bg-[var(--t-bg-secondary)] border border-[var(--t-border)] rounded-lg p-4 space-y-3">
                      <div className="skeleton-shimmer h-4 w-3/5" />
                      <div className="skeleton-shimmer h-4 w-full" />
                      <div className="skeleton-shimmer h-4 w-4/5" />
                      <div className="skeleton-shimmer h-4 w-2/3" />
                      <div className="skeleton-shimmer h-4 w-full" />
                      <div className="skeleton-shimmer h-4 w-1/2" />
                    </div>
                  ) : (
                  <div className="bg-[var(--t-bg-secondary)] border border-[var(--t-border)] rounded-lg overflow-hidden">
                    <div className="px-4 py-2 border-b border-[var(--t-border)] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileIcon className="w-4 h-4 text-[var(--t-text-muted)]" />
                        <span className="text-sm font-medium text-[var(--t-text-primary)]">{viewingFile.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--t-text-faint)]">{formatSize(viewingFile.size)}</span>
                        <button
                          onClick={() => setShowDiff(true)}
                          className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-[var(--t-bg-tertiary)] hover:bg-[var(--t-bg-hover)] text-[var(--t-accent-blue)] border border-[var(--t-border)] rounded-md transition-colors"
                          title="View recent changes"
                        >
                          <GitCompare className="w-3.5 h-3.5" />
                          Changes
                        </button>
                        {viewingFile.content && (
                          <button
                            onClick={() => copyFileContent(viewingFile.content!)}
                            className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-[var(--t-bg-tertiary)] hover:bg-[var(--t-bg-hover)] text-[var(--t-text-secondary)] border border-[var(--t-border)] rounded-md transition-colors"
                          >
                            {fileCopied ? <Check className="w-3.5 h-3.5 text-[var(--t-accent-green-text)]" /> : <Copy className="w-3.5 h-3.5" />}
                            {fileCopied ? "Copied!" : "Copy"}
                          </button>
                        )}
                      </div>
                    </div>
                    {viewingFile.content ? (
                      <pre className="text-sm overflow-x-auto font-mono leading-relaxed">
                        <code className="block">
                          {viewingFile.content.split("\n").map((line, i) => (
                            <div key={i} className="flex hover:bg-[var(--t-bg-tertiary)] transition-colors">
                              <span className="inline-block w-12 pr-3 pl-3 text-right text-[var(--t-text-faint)] select-none opacity-40 shrink-0 border-r border-[var(--t-border-subtle)]">{i + 1}</span>
                              <span className="pl-3 whitespace-pre" dangerouslySetInnerHTML={{ __html: highlightCode(line, viewingFile.name) || " " }} />
                            </div>
                          ))}
                        </code>
                      </pre>
                    ) : (
                      <div className="p-6 text-center">
                        <p className="text-[var(--t-text-muted)] mb-2">File too large to display inline</p>
                        {viewingFile.download_url && (
                          <a
                            href={viewingFile.download_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[var(--t-bg-tertiary)] hover:bg-[var(--t-bg-hover)] text-[var(--t-accent-blue)] border border-[var(--t-border)] rounded-md transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  )}
                </div>
              ) : (
                /* Directory listing view */
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    {repoPath.length > 0 ? (
                      <button
                        onClick={goBack}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[var(--t-bg-tertiary)] hover:bg-[var(--t-bg-hover)] text-[var(--t-text-secondary)] border border-[var(--t-border)] rounded-md transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                      </button>
                    ) : (
                      <button
                        onClick={backToRepoList}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[var(--t-bg-tertiary)] hover:bg-[var(--t-bg-hover)] text-[var(--t-text-secondary)] border border-[var(--t-border)] rounded-md transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        All Repos
                      </button>
                    )}
                    <div className="flex items-center gap-1.5 text-sm text-[var(--t-text-muted)] min-w-0">
                      <button onClick={backToRepoList} className="text-[var(--t-accent-blue)] hover:underline font-semibold shrink-0">{selectedRepo}</button>
                      {repoPath.map((part, i) => (
                        <React.Fragment key={i}>
                          <span className="text-[var(--t-text-faint)]">/</span>
                          <button
                            onClick={() => {
                              const newPath = repoPath.slice(0, i + 1);
                              setRepoPath(newPath);
                              loadRepoContents(selectedRepo, newPath.join("/"));
                            }}
                            className={`hover:underline ${i === repoPath.length - 1 ? "text-[var(--t-text-primary)] font-semibold" : "text-[var(--t-accent-blue)]"}`}
                          >
                            {part}
                          </button>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {isLoadingContents ? (
                    <div className="bg-[var(--t-bg-secondary)] border border-[var(--t-border)] rounded-lg overflow-hidden">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className={`flex items-center gap-3 px-4 py-2.5 ${i < 5 ? "border-b border-[var(--t-border-subtle)]" : ""}`}>
                          <div className="skeleton-shimmer h-4 w-4 shrink-0" />
                          <div className="skeleton-shimmer h-4" style={{ width: `${30 + i * 10}%` }} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-[var(--t-bg-secondary)] border border-[var(--t-border)] rounded-lg overflow-hidden">
                      {repoContents.map((item, i) => (
                        <button
                          key={item.path}
                          onClick={() => {
                            if (item.type === "dir") {
                              enterFolder(item.name);
                            } else {
                              loadFileContent(selectedRepo, item.path);
                            }
                          }}
                          className={`w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--t-bg-tertiary)] transition-colors ${
                            i < repoContents.length - 1 ? "border-b border-[var(--t-border-subtle)]" : ""
                          }`}
                        >
                          {item.type === "dir" ? (
                            <FolderIcon className="w-4 h-4 text-[#54aeff] shrink-0" />
                          ) : (
                            <FileIcon className="w-4 h-4 text-[var(--t-text-muted)] shrink-0" />
                          )}
                          <span className={`text-sm ${item.type === "dir" ? "text-[var(--t-text-primary)]" : "text-[var(--t-text-secondary)]"}`}>
                            {item.name}
                          </span>
                          {item.type === "file" && item.size > 0 && (
                            <span className="text-xs text-[var(--t-text-faint)] ml-auto">{formatSize(item.size)}</span>
                          )}
                        </button>
                      ))}
                      {repoContents.length === 0 && (
                        <p className="text-sm text-[var(--t-text-faint)] text-center py-6">Empty directory</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* GitHub Attribution Footer */}
              <div className="mt-8 pt-4 border-t border-[var(--t-border-subtle)] text-center space-y-1">
                <p className="text-xs text-[var(--t-text-faint)]">
                  Repositories from{" "}
                  <a
                    href="https://github.com/xalhexi-sch"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--t-accent-blue)] hover:underline"
                  >
                    xalhexi-sch
                  </a>
                </p>
                {selectedRepo && (
                  <p className="text-xs text-[var(--t-text-faint)]">
                    <a
                      href={`https://github.com/xalhexi-sch/${selectedRepo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--t-accent-blue)] hover:underline"
                    >
                      View this repository on GitHub
                    </a>
                  </p>
                )}
              </div>
            </div>
          ) : isSearching ? (
            /* Search Results View */
            <div className={`${(showTerminal && !terminalFullscreen && (isAdmin || !terminalLocked)) ? '' : 'max-w-3xl mx-auto'}`}>
              <div className="mb-6">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <h1 className="text-xl font-bold text-[var(--t-text-primary)]">
                    Search Results for "{searchQuery}"
                  </h1>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="px-3 py-1.5 text-sm border border-[var(--t-border)] rounded-md text-[var(--t-text-muted)] hover:bg-[var(--t-bg-tertiary)] hover:text-[var(--t-text-primary)] transition-colors"
                  >
                    Clear search
                  </button>
                </div>
                <p className="text-[var(--t-text-muted)] text-sm">
                  Found {searchResults.length} matching {searchResults.length === 1 ? "result" : "results"}
                </p>
              </div>

              {searchResults.length > 0 ? (
                <div className="space-y-4">
                  {searchResults.map((result, index) => (
                    <div
                      key={`${result.tutorialId}-${result.step.id}-${index}`}
                      className="bg-[var(--t-bg-secondary)] border border-[var(--t-border)] rounded-lg overflow-hidden"
                    >
                      {/* Result header with tutorial name */}
                      <div className="px-4 py-2 border-b border-[var(--t-border)] bg-[var(--t-bg-tertiary)] flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-[var(--t-text-muted)] min-w-0 flex-1">
                          <BookOpen className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate max-w-[120px]" title={result.tutorialTitle}>{result.tutorialTitle}</span>
                          <span className="text-[var(--t-text-faint)] shrink-0">/</span>
                          <span className="text-[var(--t-accent-blue)] truncate" title={result.step.heading}>{result.step.heading}</span>
                        </div>
                        <button
                          onClick={() => clearSearchAndGoToTutorial(result.tutorialId)}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-[var(--t-accent-green)] hover:bg-[#2ea043] text-white rounded transition-colors"
                        >
                          <ChevronRight className="w-3 h-3" />
                          View full tutorial
                        </button>
                      </div>
                      
                      {/* Step content */}
                      <div className="p-4 space-y-3">
                        {result.step.explanation && (
                          <p className="text-sm text-[var(--t-text-muted)]">{result.step.explanation}</p>
                        )}
                        {/* Show images before code */}
                        {result.step.images?.filter(img => img.position === "before").map((img) => (
                          <div key={img.id} className="rounded-md overflow-hidden border border-[var(--t-border)]">
                            <img src={img.url} alt={img.caption || "Step image"} className="max-w-full h-auto" />
                            {img.caption && <p className="text-xs text-[var(--t-text-muted)] p-2 bg-[var(--t-bg-primary)]">{img.caption}</p>}
                          </div>
                        ))}
                        {/* Legacy single image */}
                        {result.step.image && !result.step.images?.length && (
                          <div className="rounded-md overflow-hidden border border-[var(--t-border)]">
                            <img src={result.step.image} alt="Step screenshot" className="max-w-full h-auto" />
                          </div>
                        )}
                        {result.step.code && <CodeBlock code={result.step.code} onCopy={handleCopy} />}
                        {/* Show images after code */}
                        {result.step.images?.filter(img => img.position === "after").map((img) => (
                          <div key={img.id} className="rounded-md overflow-hidden border border-[var(--t-border)]">
                            <img src={img.url} alt={img.caption || "Step image"} className="max-w-full h-auto" />
                            {img.caption && <p className="text-xs text-[var(--t-text-muted)] p-2 bg-[var(--t-bg-primary)]">{img.caption}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-[var(--t-text-faint)]">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg mb-1">No results found</p>
                  <p className="text-sm">Try searching for different keywords</p>
                </div>
              )}
            </div>
          ) : currentTutorial ? (
            /* Normal Tutorial View */
            <div className={`${(showTerminal && !terminalFullscreen && (isAdmin || !terminalLocked)) ? '' : 'max-w-3xl mx-auto'}`}>
              {/* Tutorial header */}
              <div className="mb-6">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <h1 className="text-2xl font-bold text-[var(--t-text-primary)] truncate" title={currentTutorial.title}>{currentTutorial.title}</h1>
                    {currentTutorial.vipOnly && (
                      <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-400 rounded-full shrink-0">
                        <Crown className="w-3 h-3" />
                        VIP
                      </span>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => toggleCrown(currentTutorial.id)}
                        className={`p-1.5 hover:bg-[var(--t-bg-tertiary)] rounded transition-colors ${currentTutorial.vipOnly ? "text-amber-400" : "text-[var(--t-text-muted)] hover:text-amber-400"}`}
                        title={currentTutorial.vipOnly ? "Remove VIP" : "Mark VIP only"}
                      >
                        <Crown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingTutorial(currentTutorial);
                          setTutorialModalOpen(true);
                        }}
                        className="p-1.5 hover:bg-[var(--t-bg-tertiary)] rounded text-[var(--t-text-muted)] hover:text-[var(--t-text-primary)]"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTutorial(currentTutorial.id)}
                        className="p-1.5 hover:bg-[var(--t-bg-tertiary)] rounded text-[var(--t-text-muted)] hover:text-[#f85149]"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-[var(--t-text-muted)]">{currentTutorial.description}</p>
              </div>

              {/* Steps */}
              <div className="space-y-4">
                {currentTutorial.steps.map((step, index) => (
                  <div
                    key={step.id}
                    className="bg-[var(--t-bg-secondary)] border border-[var(--t-border)] rounded-lg overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-[var(--t-border)] flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--t-accent-green)] text-white text-xs font-bold shrink-0">
                          {index + 1}
                        </span>
                        <h3 className="font-semibold text-[var(--t-text-primary)] truncate">{step.heading}</h3>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {step.code && (
                          <button
                            onClick={() => handleCopy(step.code)}
                            className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-[var(--t-bg-tertiary)] hover:bg-[var(--t-bg-hover)] text-[var(--t-text-muted)] border border-[var(--t-border)] rounded-md transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                            Copy
                          </button>
                        )}
                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveStep(currentTutorial.id, step.id, "up")}
                            disabled={index === 0}
                            className="p-1 hover:bg-[var(--t-bg-tertiary)] rounded text-[var(--t-text-muted)] hover:text-[var(--t-text-primary)] disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => moveStep(currentTutorial.id, step.id, "down")}
                            disabled={index === currentTutorial.steps.length - 1}
                            className="p-1 hover:bg-[var(--t-bg-tertiary)] rounded text-[var(--t-text-muted)] hover:text-[var(--t-text-primary)] disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingStep({ tutorialId: currentTutorial.id, step });
                              setStepModalOpen(true);
                            }}
                            className="p-1 hover:bg-[var(--t-bg-tertiary)] rounded text-[var(--t-text-muted)] hover:text-[var(--t-text-primary)]"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteStep(currentTutorial.id, step.id)}
                            className="p-1 hover:bg-[var(--t-bg-tertiary)] rounded text-[var(--t-text-muted)] hover:text-[#f85149]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      {step.explanation && (
                        <p className="text-sm text-[var(--t-text-muted)]">{step.explanation}</p>
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
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-[var(--t-border)] rounded-lg text-[var(--t-text-muted)] hover:border-[var(--t-text-faint)] hover:text-[var(--t-text-primary)] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Step
                  </button>
                )}

                {currentTutorial.steps.length === 0 && !isAdmin && (
                  <div className="text-center py-12 text-[var(--t-text-faint)]">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No steps in this tutorial yet</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center">
              <BookOpen className="w-16 h-16 text-[var(--t-bg-hover)] mb-4" />
              <h2 className="text-xl font-semibold text-[var(--t-text-primary)] mb-2">Select a Tutorial</h2>
              <p className="text-[var(--t-text-muted)]">Choose a tutorial from the sidebar to get started</p>
            </div>
          )}
        </main>

          {/* Terminal Panel - Split Screen Right Side (only show if admin OR unlocked) */}
          {showTerminal && !terminalFullscreen && (isAdmin || !terminalLocked) && (
            <div className="w-1/2 border-l border-[var(--t-border)] flex flex-col bg-[var(--t-bg-primary)]">
              {/* Terminal Header */}
              <div className="flex items-center justify-between px-3 py-2 bg-[var(--t-bg-secondary)] border-b border-[var(--t-border)]">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[var(--t-accent-blue)]" />
                  <span className="text-xs text-[var(--t-text-primary)] font-mono">
                    {terminalUrl ? "student@itp-server" : "Terminal"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setTerminalFullscreen(true)}
                    className="p-1.5 hover:bg-[var(--t-bg-tertiary)] rounded transition-colors"
                    title="Fullscreen"
                  >
                    <Maximize2 className="w-4 h-4 text-[var(--t-text-muted)]" />
                  </button>
                  <button
                    onClick={() => setShowTerminal(false)}
                    className="p-1.5 hover:bg-[var(--t-bg-tertiary)] rounded transition-colors"
                    title="Close"
                  >
                    <X className="w-4 h-4 text-[var(--t-text-muted)]" />
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
                  <div className="text-[var(--t-text-muted)] mb-4">Error: No Linux VPS available</div>
                  <div className="text-[var(--t-text-faint)] mb-2">-------------------------------------------</div>
                  <div className="text-[var(--t-text-muted)] mb-1">The web terminal is not configured yet.</div>
                  {isAdmin ? (
                    <div className="text-[var(--t-accent-blue)]">
                      <span className="text-[var(--t-text-muted)]">Admin: </span>
                      Click the Terminal icon in header to configure.
                    </div>
                  ) : (
                    <div className="text-[var(--t-text-muted)]">Contact administrator to enable terminal.</div>
                  )}
                  <div className="mt-4 text-[#27c93f] animate-pulse">$ _</div>
                </div>
              )}
            </div>
          )}

          {/* AI Chat - rendered as full-screen overlay via portal */}
        </div>

        {/* Right Sidebar - Connection Info (hidden when AI chat is open) */}
        <aside className={`${showAIChat ? 'hidden' : 'hidden xl:block'} w-80 shrink-0 p-4 lg:p-6`}>
          <div className="sticky top-20 space-y-4">
            {/* SSH Connection Card */}
            <div className="bg-[var(--t-bg-secondary)] border border-[var(--t-border)] rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--t-border)] flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[var(--t-accent-orange)]" />
                <h3 className="font-semibold text-sm text-[var(--t-text-primary)]">SSH Connection</h3>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-xs text-[var(--t-text-muted)] mb-1.5">Connect to server:</p>
                  <CopyableCommand
                    command="ssh it21_lastname@172.17.100.15 -p 9898"
                    onCopy={handleCopy}
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--t-text-muted)]">
                  <Server className="w-3.5 h-3.5" />
                  <span>Port: 9898</span>
                </div>
              </div>
            </div>

            {/* Quick Links Card */}
            <div className="bg-[var(--t-bg-secondary)] border border-[var(--t-border)] rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--t-border)] flex items-center gap-2">
                <Link2 className="w-4 h-4 text-[var(--t-accent-blue)]" />
                <h3 className="font-semibold text-sm text-[var(--t-text-primary)]">Quick Links</h3>
              </div>
              <div className="p-2">
                <a
                  href="http://172.17.107.168/PORTS.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--t-text-muted)] hover:bg-[var(--t-bg-tertiary)] hover:text-[var(--t-text-primary)] rounded-md transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Port List</span>
                </a>
                <a
                  href="http://172.17.107.168/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--t-text-muted)] hover:bg-[var(--t-bg-tertiary)] hover:text-[var(--t-text-primary)] rounded-md transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Class Resources</span>
                </a>
                <a
                  href="https://github.com/xalhexi-sch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--t-text-muted)] hover:bg-[var(--t-bg-tertiary)] hover:text-[var(--t-text-primary)] rounded-md transition-colors"
                >
                  <Github className="w-4 h-4" />
                  <span>xalhexi-sch</span>
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

      {/* Diff Viewer Modal */}
      {showDiff && selectedRepo && viewingFile && (
        <DiffViewer
          repo={selectedRepo}
          filePath={viewingFile.path}
          onClose={() => setShowDiff(false)}
        />
      )}

      {/* Terminal Settings Modal (Admin) */}
      {terminalSettingsOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--t-bg-secondary)] rounded-lg border border-[var(--t-border)] w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-[var(--t-text-primary)]">Terminal Settings</h2>
              <button onClick={() => setTerminalSettingsOpen(false)} className="p-1 hover:bg-[var(--t-bg-hover)] rounded">
                <X className="w-5 h-5 text-[var(--t-text-muted)]" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[var(--t-text-muted)] mb-1.5">Terminal URL (ttyd/gotty)</label>
                <input
                  type="text"
                  value={terminalUrl}
                  onChange={(e) => setTerminalUrl(e.target.value)}
                  placeholder="http://your-vps-ip:7681"
                  className="w-full px-3 py-2 bg-[var(--t-bg-primary)] border border-[var(--t-border)] rounded-md text-[var(--t-text-primary)] placeholder-[var(--t-text-faint)] focus:ring-2 focus:ring-[var(--t-accent-blue)] outline-none text-sm"
                />
                <p className="text-xs text-[var(--t-text-faint)] mt-1">Enter the URL where ttyd is running on your VPS</p>
              </div>
              
              {/* Lock/Unlock Toggle */}
              <div className="flex items-center justify-between gap-4 p-3 bg-[var(--t-bg-primary)] border border-[var(--t-border)] rounded-md">
                <div className="flex items-center gap-3 min-w-0">
                  {terminalLocked ? (
                    <Lock className="w-5 h-5 text-[var(--t-accent-orange)] shrink-0" />
                  ) : (
                    <Unlock className="w-5 h-5 text-[var(--t-accent-green-text)] shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--t-text-primary)]">
                      {terminalLocked ? "Terminal Locked" : "Terminal Unlocked"}
                    </p>
                    <p className="text-xs text-[var(--t-text-faint)]">
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
                      ? "bg-[var(--t-accent-green)] hover:bg-[#2ea043] text-white"
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
                  className="flex-1 py-2 border border-[var(--t-border)] text-[var(--t-text-secondary)] rounded-md hover:bg-[var(--t-bg-tertiary)] transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => {
                    setTerminalSettingsOpen(false);
                    showToast("Terminal URL saved");
                  }}
                  className="flex-1 py-2 bg-[var(--t-accent-green)] hover:bg-[#2ea043] text-white rounded-md transition-colors"
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
        <div className="fixed inset-0 z-50 flex flex-col bg-[var(--t-bg-primary)]">
          {/* Fullscreen Terminal Header */}
          <div className="flex items-center justify-between px-4 py-2 bg-[var(--t-bg-secondary)] border-b border-[var(--t-border)]">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[var(--t-accent-blue)]" />
              <span className="text-sm text-[var(--t-text-primary)] font-mono">
                {terminalUrl ? "student@itp-server: ~" : "Terminal"}
              </span>
              <span className="text-xs text-[var(--t-text-faint)]">(Only 1 user at a time)</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setTerminalFullscreen(false)}
                className="p-1.5 hover:bg-[var(--t-bg-tertiary)] rounded transition-colors"
                title="Exit Fullscreen"
              >
                <Minimize2 className="w-4 h-4 text-[var(--t-text-muted)]" />
              </button>
              <button
                onClick={() => { setShowTerminal(false); setTerminalFullscreen(false); }}
                className="p-1.5 hover:bg-[var(--t-bg-tertiary)] rounded transition-colors"
                title="Close"
              >
                <X className="w-4 h-4 text-[var(--t-text-muted)]" />
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
              <div className="text-[var(--t-text-muted)] mb-4">Error: No Linux VPS available</div>
              <div className="text-[var(--t-text-faint)] mb-2">-------------------------------------------</div>
              <div className="text-[var(--t-text-muted)] mb-1">The web terminal is not configured yet.</div>
              {isAdmin ? (
                <div className="text-[var(--t-accent-blue)]">
                  <span className="text-[var(--t-text-muted)]">Admin: </span>
                  Click the Terminal icon in header to configure VPS URL.
                  <br />
                  <span className="text-[var(--t-text-muted)]">See locked tutorial: </span>
                  <span className="text-[var(--t-accent-orange)]">&quot;Setting Up Web Terminal&quot;</span>
                </div>
              ) : (
                <div className="text-[var(--t-text-muted)]">Contact administrator to enable terminal access.</div>
              )}
              <div className="mt-4 text-[#27c93f] animate-pulse">$ _</div>
            </div>
          )}
        </div>
      )}

      {/* AI Assistant - Full-screen overlay */}
      {showAIChat && (
        <AIAssistant
          isAdmin={isAdmin}
          tutorialTitle={currentTutorial?.title}
          tutorialDescription={currentTutorial?.description}
          currentStepTitle={currentStepForAI?.heading}
          currentStepContent={currentStepForAI?.explanation}
          onClose={() => setShowAIChat(false)}
          onOpenTutorials={() => setShowAIChat(false)}
          showToast={showToast}
        />
      )}

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
