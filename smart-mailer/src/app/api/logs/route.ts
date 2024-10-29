import { NextResponse } from "next/server";
import EmailLogService from "@/lib/database/emailLogService";
import MailerService from "@/lib/database/mailerService";
import { NextRequest } from "next/server";

/**
 * @swagger
 * /api/logs:
 *   get:
 *     summary: Get email logs and statistics for a given mailerId
 *     description: Retrieves the total number of emails sent and successfully delivered for a specific mailerId, aggregated by department, along with detailed email logs.
 *     parameters:
 *       - in: query
 *         name: mailerId
 *         schema:
 *           type: string
 *         required: true
 *         description: The mailerId to retrieve logs for.
 *     responses:
 *       200:
 *         description: Email logs retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mailerId:
 *                   type: string
 *                   description: The mailerId used for tracking.
 *                   example: "mailer_abc123xyz"
 *                 totalEmailSent:
 *                   type: object
 *                   description: Total emails sent, aggregated by department.
 *                   additionalProperties:
 *                     type: integer
 *                   example:
 *                     Sales: 50
 *                     Marketing: 30
 *                 successfulEmailSent:
 *                   type: object
 *                   description: Successful emails sent, aggregated by department.
 *                   additionalProperties:
 *                     type: integer
 *                   example:
 *                     Sales: 48
 *                     Marketing: 29
 *                 emailLogs:
 *                   type: array
 *                   description: Detailed logs of each email sent.
 *                   items:
 *                     type: object
 *                     properties:
 *                       recipient_email:
 *                         type: string
 *                         description: The recipient's email address.
 *                         example: "john.doe@example.com"
 *                       success:
 *                         type: boolean
 *                         description: Indicates if the email was sent successfully.
 *                         example: true
 *                       log_message:
 *                         type: string
 *                         description: Log message or error details.
 *                         example: "Email sent successfully."
 *       400:
 *         description: Bad request, missing mailerId parameter.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Missing mailerId parameter"
 *       401:
 *         description: Unauthorized, invalid mailerId.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid mailerId"
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
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

      const emailLogService = EmailLogService.getInstance();
      const totalEmailSent = await emailLogService.getEmailCountByDepartment(mailerId);
      const successfulEmailSent = await emailLogService.getSuccessfulEmailCountByDepartment(mailerId);
      const emailLogs = await emailLogService.getAllLogsByMailerId(mailerId);

    return NextResponse.json(
      {
        mailerId,
        totalEmailSent,
        successfulEmailSent,
        emailLogs
      },
      { status: 200 }
    );

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error }, { status: 500 });
    }
}