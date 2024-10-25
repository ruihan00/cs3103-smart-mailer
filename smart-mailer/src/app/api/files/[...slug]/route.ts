import { NextRequest, NextResponse } from "next/server";

const transparentPixel =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
export async function GET(
  req: NextRequest,
  { params }: { params: Record<string, string> }
) {
  const imageBuffer = Buffer.from(transparentPixel, "base64");
  const { slug } = await params;
  const mailerId = slug[0];
  console.log(`mailerId: ${mailerId}`);
  return new NextResponse(imageBuffer, {
    headers: {
      "Content-Type": "image/png",
      "Content-Length": imageBuffer.length.toString(),
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      // Pragma for HTTP/1.0 compatibility
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
