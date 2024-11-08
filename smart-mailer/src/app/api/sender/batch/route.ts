import nodemailer from "nodemailer";
import MailerService from "@/lib/database/mailerService";
import EmailLogService from "@/lib/database/emailLogService"; // Import the EmailLogService
import { NextRequest, NextResponse } from "next/server";
import csvParser from "csv-parser";
import { Readable } from "stream";
import validator from "validator"; // Import the validator library
/**
 * @swagger
 * /api/sender/batch:
 *   post:
 *     summary: Send personalized emails to multiple recipients, with access to email logs and detailed statistics.
 *     requestBody:
 *       description: Sends personalized emails using provided SMTP credentials, a CSV file of recipient details and an HTML file as the email template.
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - senderEmailAddress
 *               - senderEmailPassword
 *               - receiverDetailsCSV
 *               - htmlContent
 *               - subject
 *             properties:
 *               senderEmailAddress:
 *                 type: string
 *                 description: The email address of the sender.
 *                 example: "smart.mailer.tester00@gmail.com"
 *               senderEmailPassword:
 *                 type: string
 *                 description: The password of the sender's email address.
 *                 example: "dhoptubmthmtmgnn"
 *               receiverDetailsCSV:
 *                 type: string
 *                 format: binary
 *                 description: A CSV file containing recipient details (email, name, department).
 *               htmlContent:
 *                 type: string
 *                 format: binary
 *                 description: An HTML file containing the email template. To use recipient name and department code given in the CSV, use {{name}} and {{department}} repectively.
 *               subject:
 *                 type: string
 *                 description: The subject of the email.
 *                 example: "Hello from Next.js"
 *               mailerId:
 *                 type: string
 *                 description: Optional mailerId for tracking. If not provided, a new one will be generated.
 *                 default: ""
 *               departments:
 *                 type: string
 *                 description: Comma-separated list of departments to send emails to (e.g., "Math, Science" or "All").
 *                 example: "Math, Science"
 *                 defult: "All"
 *     responses:
 *       200:
 *         description: Email sending initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 mailerId:
 *                   type: string
 *                   description: The mailerId used for tracking.
 *                   example: "mailer_abc123xyz"
 *       400:
 *         description: Bad request, missing fields or invalid CSV.
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
    const formData = await request.formData();

    const senderEmailAddress = formData.get("senderEmailAddress") as string;
    const senderEmailPassword = formData.get("senderEmailPassword") as string;
    const subject = formData.get("subject") as string;
    const receiverDetailsCSVFile = formData.get("receiverDetailsCSV") as File;
    const htmlContentFile = formData.get("htmlContent") as File;
    const departmentsField = formData.get("departments") as string;

    let mailerId = formData.get("mailerId") as string;

    if (!senderEmailAddress) {
      return NextResponse.json(
        { success: false, error: "Sender Email Address missing" },
        { status: 400 }
      );
    }

    if (!validator.isEmail(senderEmailAddress)) {
      return NextResponse.json(
        { success: false, error: "Invalid sender email address" },
        { status: 400 }
      );
    }

    if (!senderEmailPassword) {
      return NextResponse.json(
        { success: false, error: "Sender Email Password missing" },
        { status: 400 }
      );
    }

    if (!receiverDetailsCSVFile) {
      return NextResponse.json(
        { success: false, error: "Recipient Details CSV File missing" },
        { status: 400 }
      );
    }

    if (!subject) {
      return NextResponse.json(
        { success: false, error: "Email Subject missing" },
        { status: 400 }
      );
    }
    
    if (!htmlContentFile) {
      return NextResponse.json(
        { success: false, error: "HTML Content missing" },
        { status: 400 }
      );
    }

    const departments = departmentsField
      ? departmentsField.split(",").map((dep) => dep.trim().toLowerCase())
      : ["all"];

    const mailerService = MailerService.getInstance();
    const mailer = await mailerService.getMailerById(mailerId);

    if (!mailer) {
      mailerId = await mailerService.createMailer();
    } else {
      mailerId = mailer.id;
    }

    const htmlTemplate = await htmlContentFile.text();

    const csvContent = await receiverDetailsCSVFile.text();
    const recipients = await parseCSV(csvContent);

    if (!recipients || recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: "No recipient details found in CSV" },
        { status: 400 }
      );
    }

    // Start the email sending process in the background
    sendEmailsInBackground(
      senderEmailAddress,
      senderEmailPassword,
      subject,
      htmlTemplate,
      recipients,
      departments,
      mailerId
    );

    // Return success message immediately
    return NextResponse.json({ success: true, mailerId });
  } catch (error) {
    console.error("Error starting email sending:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Background email sending function
function sendEmailsInBackground(
  senderEmailAddress: string,
  senderEmailPassword: string,
  subject: string,
  htmlTemplate: string,
  recipients: any[],
  departments: string[],
  mailerId: string
) {
  (async () => {
    const emailLogService = EmailLogService.getInstance();
    for (const recipient of recipients) {
      try {
        const recipientDepartment = recipient.department.toLowerCase();
        if (
          !departments.includes("all") &&
          !departments.includes(recipientDepartment)
        ) {
          continue; // Skip this recipient
        }

        // Validate Recipient information including email address. If validation fails, error is thrown
        validateRecipient(recipient);

        const personalizedHtmlContent = htmlTemplate
            .replace(/{{name}}/g, recipient.name)
            .replace(/{{department}}/g, recipient.department)
            + `<img src="${process.env.MAILER_PROGRAM_IP}/api/files/${mailerId}" width="1" height="1" alt="" style="display:none;" />`;

        const success = await sendMailTo(
            senderEmailAddress,
            senderEmailPassword,
            recipient.email,
            subject,
            personalizedHtmlContent
        );

        if (success) {
            // Log the email sent
            await emailLogService.logEmailSent({
                mailerId,
                recipientEmail: recipient.email,
                recipientName: recipient.name,
                recipientDepartment: recipient.department,
                success: true,
                log_message: "Email sent successfully",
            });
        } else {
            await emailLogService.logEmailSent({
                mailerId,
                recipientEmail: recipient.email,
                recipientName: recipient.name,
                recipientDepartment: recipient.department,
                success: false,
                log_message: "Email not sent",
            });
        }
        // Wait for 2 seconds before sending the next email. Rate limiting
        await sleep(2000);
      } catch (error) {
        await emailLogService.logEmailSent({
            mailerId,
            recipientEmail: recipient.email,
            recipientName: recipient.name,
            recipientDepartment: recipient.department,
            success: false,
            log_message: `Email not sent - ${error}`,
        });
      }
    }
  })();
}

// Sleep function to add delay between email sends
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Throws an error if recipent data is not valid
function validateRecipient(recipient: any) {
  if (!recipient.email) {
    throw new Error("Recipient email is missing");
  }
  recipient.email = recipient.email.trim().toLowerCase();
  if (!validator.isEmail(recipient.email)) {
    throw new Error("Recipient email address is invalid");
  }
  if (!recipient.name) {
    throw new Error("Recipient name is missing");
  }
  if (!recipient.department) {
    throw new Error("Recipient department code is missing");
  }
}
// Function to send the email
async function sendMailTo(
  senderEmailAddress: string,
  senderEmailPassword: string,
  receiverEmailAddress: string,
  subject: string,
  msg: string,
  maxAttempts = 3
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
  while (attempt < maxAttempts) {
    try {
      // Attempt to send the email
      await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${receiverEmailAddress} on attempt ${attempt + 1}`);
      return true; // Return true if successful
    } catch (error) {
      attempt++;
      console.warn(`Attempt ${attempt} to send email to ${receiverEmailAddress} failed. Error: ${error.message}`);
      
      if (attempt < maxAttempts) {
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

async function parseCSV(csvContent: string) {
  const recipients = [];
  const stream = Readable.from(csvContent);

  return new Promise((resolve, reject) => {
    stream
      .pipe(csvParser())
      .on("data", (row) => {
        recipients.push({
          email: row.email?.trim(),
          name: row.name?.trim(),
          department: row.department?.trim(),
        });
      })
      .on("end", () => {
        resolve(recipients);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}
