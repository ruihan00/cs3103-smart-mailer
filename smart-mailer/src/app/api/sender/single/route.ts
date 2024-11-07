import nodemailer from "nodemailer";
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /api/sender/single:
 *   post:
 *     summary: Send an email immediately with email logs.
 *     requestBody:
 *       description: Sends an email using provided SMTP credentials.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               senderEmailAddress:
 *                 type: string
 *                 description: The email address of the sender.
 *                 example: "your-email@example.com"
 *               senderEmailPassword:
 *                 type: string
 *                 description: The password of the sender's email address.
 *                 example: "your-email-password"
 *               receiverEmailAddress:
 *                 type: string
 *                 description: The email address of the receiver.
 *                 example: "receiver-email@example.com"
 *               subject:
 *                 type: string
 *                 description: The subject of the email.
 *                 example: "Hello from Next.js"
 *               msg:
 *                 type: string
 *                 description: The HTML content of the email.
 *                 example: "<p>This is a test email</p>"
 *     responses:
 *       200:
 *         description: Email sent successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Bad request, missing fields.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Missing required fields"
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Error message"
 */
export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    // Extract required fields from the request body
    const {
      senderEmailAddress,
      senderEmailPassword,
      receiverEmailAddress,
      subject,
      msg,
    } = json;
    // Validate required fields
    if (
      !senderEmailAddress ||
      !senderEmailPassword ||
      !receiverEmailAddress ||
      !subject ||
      !msg
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }
    await sendMailTo(
      senderEmailAddress,
      senderEmailPassword,
      receiverEmailAddress,
      subject,
      msg
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

async function sendMailTo(
  senderEmailAddress,
  senderEmailPassword,
  receiverEmailAddress,
  subject,
  msg,
  maxRetries = 3
) {
  // Configure the email transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_SERVER,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: true,
    auth: {
      user: senderEmailAddress,
      pass: senderEmailPassword,
    },
  });

  // Define the email options
  const mailOptions = {
    from: senderEmailAddress,
    to: receiverEmailAddress,
    subject,
    html: msg,
  };

  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      // Attempt to send the email
      await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${receiverEmailAddress} on attempt ${attempt + 1}`);
      return true; // Return true if successful
    } catch (error) {
      attempt++;
      console.warn(`Attempt ${attempt} to send email to ${receiverEmailAddress} failed. Error: ${error.message}`);
      
      if (attempt < maxRetries) {
        // Wait with exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await sleep(delay);
      } else {
        console.error(`Max retries reached. Failed to send email to ${receiverEmailAddress}`);
        return false; // Return false after max retries
      }
    }
  }
}

// Sleep function to add delay between email sends
function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }