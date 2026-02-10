import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".json": "application/json",
};

export async function GET(request: NextRequest) {
  const filePath = request.nextUrl.searchParams.get("path");

  if (!filePath) {
    return NextResponse.json({ error: "Missing path parameter" }, { status: 400 });
  }

  // Security: only allow files under the project output directory
  const resolved = path.resolve(filePath);
  const allowedRoots = [
    path.resolve(process.cwd(), "../output"),
    path.resolve(process.cwd(), "../test-output"),
  ];

  const isAllowed = allowedRoots.some((root) => resolved.startsWith(root));
  if (!isAllowed) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  if (!fs.existsSync(resolved)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const ext = path.extname(resolved).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  const fileBuffer = fs.readFileSync(resolved);

  return new NextResponse(fileBuffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(fileBuffer.length),
      "Cache-Control": "public, max-age=3600",
    },
  });
}
