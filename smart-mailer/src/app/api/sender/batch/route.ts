import nodemailer from 'nodemailer';
import MailerService from "@/lib/database/mailerService";
import { NextRequest, NextResponse } from 'next/server';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

/**
 * @swagger
 * /api/sender/batch:
 *   post:
 *     summary: Send personalized emails to multiple recipients
 *     requestBody:
 *       description: Sends personalized emails using provided SMTP credentials, a CSV file of recipient details, and an HTML file as the email template.
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
 *                 example: "your-email@example.com"
 *               senderEmailPassword:
 *                 type: string
 *                 description: The password of the sender's email address.
 *                 example: "your-email-password"
 *               receiverDetailsCSV:
 *                 type: string
 *                 format: binary
 *                 description: A CSV file containing receiver details (email, name, department).
 *               htmlContent:
 *                 type: string
 *                 format: binary
 *                 description: An HTML file containing the email template.
 *               subject:
 *                 type: string
 *                 description: The subject of the email.
 *                 example: "Hello from Next.js"
 *               mailerId:
 *                 type: string
 *                 description: Optional mailerId for tracking. If not provided or left empty, a new one will be generated.
 *                 default: ""
 *               departments:
 *                 type: string
 *                 description: Comma-separated list of departments to send emails to (e.g., "Math, Science" or "All").
 *                 example: "Math, Science"
 *                 defult: "All"
 *     responses:
 *       200:
 *         description: Emails sent successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 countsByDepartment:
 *                   type: object
 *                   additionalProperties:
 *                     type: integer
 *                   description: A dictionary with department names as keys and counts as values.
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

        const senderEmailAddress = formData.get('senderEmailAddress') as string;
        const senderEmailPassword = formData.get('senderEmailPassword') as string;
        const subject = formData.get('subject') as string;
        const receiverDetailsCSVFile = formData.get('receiverDetailsCSV') as File;
        const htmlContentFile = formData.get('htmlContent') as File;
        const departmentsField = formData.get('departments') as string;

        let mailerId = formData.get('mailerId') as string;

        if (
            !senderEmailAddress ||
            !senderEmailPassword ||
            !receiverDetailsCSVFile ||
            !subject ||
            !htmlContentFile
        ) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }
        
        //TODO: Validate email address

        const departments = departmentsField.split(',').map(dep => dep.trim().toLowerCase());

        if (!mailerId) {
            const mailerService = MailerService.getInstance();
            mailerId = await mailerService.createMailer();
        }

        //TODO: Make sure that mailerId is in database (if user send in mailerId)
        
        const htmlTemplate = await htmlContentFile.text();

        const csvContent = await receiverDetailsCSVFile.text();
        const recipients = await parseCSV(csvContent);

        if (!recipients || recipients.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No recipient details found in CSV' },
                { status: 400 }
            );
        }

        const countsByDepartment = {};

        for (const recipient of recipients) {
            if (!recipient.email || !recipient.name || !recipient.department) {
                return NextResponse.json(
                    { success: false, error: 'Invalid recipient data in CSV.' },
                    { status: 400 }
                );
            }

            const recipientDepartment = recipient.department.toLowerCase();
            if (!departments.includes('all') && !departments.includes(recipientDepartment)) {
                continue; // Skip this recipient
            }

            const personalizedHtmlContent = htmlTemplate
                .replace(/{{name}}/g, recipient.name)
                .replace(/{{department}}/g, recipient.department)
                + `<img src="http://${process.env.MAILER_PROGRAM_IP}/api/files/${mailerId}" width="1" height="1" alt="" style="display:none;" />`;

            const success = await sendMailTo(senderEmailAddress, senderEmailPassword, recipient.email, subject, personalizedHtmlContent);

            // Update countsByDepartment
            if (success) {
                countsByDepartment[recipient.department] = (countsByDepartment[recipient.department] || 0) + 1;
            }
        }
        return NextResponse.json({ success: true, countsByDepartment, mailerId});
    } catch (error) {
        console.error('Error sending emails:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// Function to send the email
export async function sendMailTo(senderEmailAddress, senderEmailPassword, receiverEmailAddress, subject, msg) {
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

    // Send the email
    await transporter.sendMail(mailOptions);
    return true;
}

async function parseCSV(csvContent) {
    const recipients = [];
    const stream = Readable.from(csvContent);

    return new Promise((resolve, reject) => {
        stream.pipe(csvParser())
            .on('data', (row) => {
                recipients.push({
                    email: row.email?.trim(),
                    name: row.name?.trim(),
                    department: row.department?.trim(),
                });
            })
            .on('end', () => {
                resolve(recipients);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}