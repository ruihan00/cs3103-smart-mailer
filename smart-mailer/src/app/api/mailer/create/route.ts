import MailerService from "@/lib/database/mailerService";
import { NextResponse } from "next/server";
/**
 * @swagger
 * /api/mailer/create:
 *  get:
 *   summary: Creates a new mailerId and returns its unique identifier
 *  responses:
 *   200:
 *     description: Unique identifier for the new mailer
 *   500:
 *     description: Internal server error
 *
 *
 */
export async function GET() {
  try {
    const mailerService = MailerService.getInstance();
    const mailerId = await mailerService.createMailer();
    return NextResponse.json({ mailerId }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
