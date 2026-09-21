import { NextRequest, NextResponse } from "next/server";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export const runtime = "nodejs";
export const maxDuration = 30;
const MAX_BYTES = 3 * 1024 * 1024;
const MAX_REDIRECTS = 3;

function isPublicIp(ip: string): boolean {
  const normalized = ip.toLowerCase();
  if (normalized.startsWith("::ffff:")) return isPublicIp(normalized.slice(7));
  if (isIP(ip) === 4) {
    const n = ip.split(".").map(Number);
    return !(n[0] === 0 || n[0] === 10 || n[0] === 127 || n[0] >= 224 ||
      (n[0] === 169 && n[1] === 254) || (n[0] === 172 && n[1] >= 16 && n[1] <= 31) ||
      (n[0] === 192 && n[1] === 168) || (n[0] === 100 && n[1] >= 64 && n[1] <= 127) ||
      (n[0] === 192 && n[1] === 0) || (n[0] === 198 && (n[1] === 18 || n[1] === 19)) ||
      (n[0] === 198 && n[1] === 51 && n[2] === 100) ||
      (n[0] === 203 && n[1] === 0 && n[2] === 113));
  }
  if (isIP(ip) !== 6) return false;
  return normalized !== "::1" && normalized !== "::" && !normalized.startsWith("fc") &&
    !normalized.startsWith("fd") && !normalized.startsWith("fe8") &&
    !normalized.startsWith("fe9") && !normalized.startsWith("fea") &&
    !normalized.startsWith("feb") && !normalized.startsWith("ff") &&
    !normalized.startsWith("2001:db8:");
}

async function validateUrl(value: string): Promise<URL> {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.port && url.port !== "443") {
    throw new Error("Only public HTTPS images are supported.");
  }
  if (url.hostname === "localhost" || url.hostname.endsWith(".localhost") ||
    url.hostname.endsWith(".local") || url.hostname.endsWith(".internal") ||
    url.hostname.endsWith(".test") || url.hostname.endsWith(".invalid")) {
    throw new Error("Private host is not allowed.");
  }
  const addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some(a => !isPublicIp(a.address))) {
    throw new Error("Private address is not allowed.");
  }
  return url;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (typeof body.url !== "string" || body.url.length > 2048) {
      return NextResponse.json({ error: "Invalid image URL." }, { status: 400 });
    }
    let next = body.url;
    let response: Response | undefined;
    for (let i = 0; i <= MAX_REDIRECTS; i++) {
      const url = await validateUrl(next);
      response = await fetch(url, {
        headers: { Accept: "image/avif,image/webp,image/png,image/jpeg" },
        redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(12000),
      });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        await response.body?.cancel();
        if (!location || i === MAX_REDIRECTS) throw new Error("Too many redirects");
        next = new URL(location, url).href;
        continue;
      }
      break;
    }
    if (!response?.ok || !response.body) throw new Error("Image unavailable");
    const mime = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
    const length = Number(response.headers.get("content-length") || 0);
    if (!mime || !["image/jpeg", "image/png", "image/webp"].includes(mime) ||
      length > MAX_BYTES) {
      await response.body.cancel();
      return NextResponse.json({ error: "Unsupported image format or image over 3MB." }, { status: 415 });
    }
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let count = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        count += value.byteLength;
        if (count > MAX_BYTES) {
          await reader.cancel();
          return NextResponse.json({ error: "Image exceeds 3MB." }, { status: 413 });
        }
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
    const bytes = Buffer.concat(chunks.map(chunk => Buffer.from(chunk)));
    const isJpg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    const isPng = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
    const isWebp = bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
    if (!(isJpg || isPng || isWebp)) throw new Error("Response is not an image.");
    const actual = isJpg ? "image/jpeg" : isPng ? "image/png" : "image/webp";
    return NextResponse.json({ image: `data:${actual};base64,${bytes.toString("base64")}` });
  } catch {
    return NextResponse.json({ error: "Could not import this image. Save it and upload the file instead." }, { status: 422 });
  }
}
