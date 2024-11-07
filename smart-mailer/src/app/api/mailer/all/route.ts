import MailerService from "@/lib/database/mailerService";
import { NextResponse } from "next/server";
/**
 *
 * @swagger
 * /api/mailer/all:
 *  get:
 *    summary: Returns all mailerIds
 *    responses:
 *      200:
 *        description: All mailers
 *        schema:
 *          type: object
 *          properties:
 *            mailers:
 *              type: array
 *              items:
 *                type: object
 *                properties:
 *                  id:
 *                    type: string
 *                  created_at:
 *                    type: string
 *      500:
 *        description: Internal server error
 *
 */
export async function GET() {
  try {
    const mailerService = MailerService.getInstance();
    const mailers = await mailerService.getAllMailers();
    return NextResponse.json({ mailers }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
