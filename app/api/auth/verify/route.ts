import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { token } = await req.json();
  const SECRET = process.env.JWT_SECRET;

  if (!SECRET || !token) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  try {
    const parts = token.split(".");
    if (parts.length !== 3) throw new Error("Bad token");

    const [header, payload, signature] = parts;

    // Verify signature
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", enc.encode(SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    
    // Decode base64url signature
    const sigStr = atob(signature.replace(/-/g, "+").replace(/_/g, "/") + "==".slice(0, (4 - (signature.length % 4)) % 4));
    const sigBuf = new Uint8Array(sigStr.length);
    for (let i = 0; i < sigStr.length; i++) sigBuf[i] = sigStr.charCodeAt(i);
    
    const valid = await crypto.subtle.verify("HMAC", key, sigBuf, enc.encode(`${header}.${payload}`));
    if (!valid) throw new Error("Invalid signature");

    // Decode payload
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/") + "==".slice(0, (4 - (payload.length % 4)) % 4)));

    // Check expiry
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return NextResponse.json({ valid: false, error: "Token expired" }, { status: 401 });
    }

    return NextResponse.json({ valid: true, role: decoded.role });
  } catch {
    return NextResponse.json({ valid: false }, { status: 401 });
  }
}
