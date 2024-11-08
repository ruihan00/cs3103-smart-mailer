import { NextRequest, NextResponse } from "next/server";
import ClickService from "@/lib/database/clickService";
import MailerService from "@/lib/database/mailerService";

const transparentPixel =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
/**
 * @swagger
 * /api/files/{mailerId}:
 *   get:
 *     summary: Increments mailerId visit count by 1 and returns a 1x1 pixel transparent image
 *     parameters:
 *           - in: path
 *             name: mailerId
 *             required: true
 *             schema:
 *               type: string
 *             description: Unique identifier for the mailer
 *     responses:
 *       200:
 *         description: 1x1 pixel transparent image
 *       400:
 *         description: Invalid mailerId
 *       500:
 *         description: Internal server error
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const imageBuffer = Buffer.from(transparentPixel, "base64");
  const { slug } = await params;
  const mailerId = slug[0];
  const clickService = ClickService.getInstance();
  const mailerService = MailerService.getInstance();
  const mailer = await mailerService.getMailerById(mailerId);
  if (!mailer) {
    return NextResponse.json({ error: "Invalid mailerId" }, { status: 400 });
  }
  try {
    await clickService.addClick({ mailerId });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error }, { status: 500 });
  }

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
