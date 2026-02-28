import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Thread | xalhexi.wtf",
  description: "Join the developer community. Share your code, ask questions, and connect with developers worldwide.",
};

export default function ThreadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
