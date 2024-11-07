import { NextResponse } from "next/server";
import ClickService from "@/lib/database/clickService";
import MailerService from "@/lib/database/mailerService";
import { NextRequest } from "next/server";
/**
 *
 * @swagger
 * /api/clicks:
 *  get:
 *    summary: Returns the click count for a mailer and the click count for the last 5 days and 5 months
 *    parameters:
 *      - in: query
 *        name: mailerId
 *        required: true
 *        description: The ID of the mailer to retrieve click counts for
 *        type: string
 *    responses:
 *      200:
 *        description: Successfully retrieved click counts
 *        schema:
 *          type: object
 *          properties:
 *            clickCount:
 *              type: integer
 *              description: Total click count for the specified mailer
 *            last5Days:
 *              type: array
 *              items:
 *                type: object
 *                properties:
 *                  date:
 *                    type: string
 *                    format: date
 *                  count:
 *                    type: integer
 *            last5Months:
 *              type: array
 *              items:
 *                type: object
 *                properties:
 *                  month:
 *                    type: string
 *                    format: date
 *                  count:
 *                    type: integer
 *      400:
 *        description: Bad Request - Missing or invalid mailerId
 *      401:
 *       description: Bad Request - Invalid mailerId
 *      500:
 *        description: Internal server error
 *
 */
export async function GET(request: NextRequest) {
  try {
    // Extract mailerId from URL parameters
    const { searchParams } = new URL(request.url);
    const mailerId = searchParams.get("mailerId");

    if (!mailerId) {
      return NextResponse.json(
        { error: "Missing mailerId parameter" },
        { status: 400 }
      );
    }
    const mailerService = MailerService.getInstance();
    const mailer = await mailerService.getMailerById(mailerId);
    if (!mailer) {
      return NextResponse.json({ error: "Invalid mailerId" }, { status: 401 });
    }
    const clickService = ClickService.getInstance();
    const clickCount = await clickService.getClicks(mailerId);

    // Get last 5 days click count
    const last5DaysClicks = [];
    for (let i = 0; i < 5; i++) {
      const now = new Date();
      const date = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - i
      );
      const count = await clickService.getClicksByDate(mailerId, date);
      last5DaysClicks.push({ date, count });
    }

    // Get last 5 months click count
    const last5MonthsClicks = [];
    for (let i = 0; i < 5; i++) {
      const now = new Date();
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const count = await clickService.getClicksByMonth(mailerId, date);
      last5MonthsClicks.push({ date, count });
    }

    return NextResponse.json(
      {
        clickCount,
        last5Days: last5DaysClicks,
        last5Months: last5MonthsClicks,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
