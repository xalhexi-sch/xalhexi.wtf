import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { username, password } = await req.json();

  const ADMIN_U = process.env.ADMIN_USERNAME;
  const ADMIN_P = process.env.ADMIN_PASSWORD;
  const VIP_U = process.env.VIP_USERNAME;
  const VIP_P = process.env.VIP_PASSWORD;
  const SECRET = process.env.JWT_SECRET;

  if (!SECRET) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  let role: "admin" | "vip" | null = null;

  if (username === ADMIN_U && password === ADMIN_P) {
    role = "admin";
  } else if (username === VIP_U && password === VIP_P) {
    role = "vip";
  }

  if (!role) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Simple JWT: base64url(header).base64url(payload).base64url(signature)
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const payload = btoa(JSON.stringify({ role, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 86400 * 7 }))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`${header}.${payload}`));
  const signature = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const token = `${header}.${payload}.${signature}`;

  return NextResponse.json({ token, role });
}
