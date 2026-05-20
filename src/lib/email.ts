import { Resend } from "resend";
import prisma from "@/lib/prisma";

const resend = new Resend(process.env.RESEND_API_KEY || "re_RTTq8tQq_PADSs83bSNaPhyJHtKdy9TYV");

const SENDER = "CruxDoc Portal <onboarding@aiclex.in>"; // Updated to verified domain

const brandColor = "#2563eb"; // blue-600

const getBaseStyle = () => `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background-color: #f4f4f5;
    margin: 0;
    padding: 0;
    -webkit-font-smoothing: antialiased;
  }
  .container {
    max-width: 600px;
    margin: 40px auto;
    background-color: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  .header {
    background-color: ${brandColor};
    padding: 32px 24px;
    text-align: center;
    color: #ffffff;
  }
  .header h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 800;
    letter-spacing: -0.5px;
  }
  .content {
    padding: 32px 24px;
    color: #3f3f46;
    line-height: 1.6;
    font-size: 16px;
  }
  .btn {
    display: inline-block;
    background-color: ${brandColor};
    color: #ffffff !important;
    text-decoration: none;
    padding: 14px 28px;
    border-radius: 8px;
    font-weight: 600;
    margin-top: 24px;
    margin-bottom: 24px;
  }
  .footer {
    background-color: #fafafa;
    padding: 24px;
    text-align: center;
    color: #71717a;
    font-size: 13px;
    border-top: 1px solid #f4f4f5;
  }
`;

export async function sendDropoffReminder(to: string, name: string | null, candidateId: string, clientSlug?: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://doc.cruxlearn.in';
  const applyLink = clientSlug ? `${baseUrl}/apply/${clientSlug}` : baseUrl;

  const html = `
    <!DOCTYPE html>
    <html>
      <head><style>${getBaseStyle()}</style></head>
      <body>
        <div class="container">
          <div class="header">
            <h1>CruxDoc</h1>
          </div>
          <div class="content">
            <p>Hi ${name ? name.split(' ')[0] : 'there'},</p>
            <p>We noticed you started your document submission but didn't get a chance to finish uploading your documents.</p>
            <p>To ensure your onboarding proceeds smoothly, please complete the process by uploading the required documents.</p>
            <center>
              <a href="${applyLink}" class="btn">Resume Uploading</a>
            </center>
            <p>If you need any help, please reach out to your reporting manager.</p>
          </div>
          <div class="footer">
            <p>Secure Document Portal &copy; ${new Date().getFullYear()} CruxDoc</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const data = await resend.emails.send({
      from: SENDER,
      to,
      subject: "Action Required: Complete your document submission",
      html,
    });

    await prisma.emailLog.create({
      data: {
        candidateId,
        type: "REMINDER_DROP",
        status: data.error ? "FAILED" : "SENT",
        error: data.error ? data.error.message : null,
      }
    });

    return data;
  } catch (error: any) {
    console.error("Dropoff email error:", error);
    await prisma.emailLog.create({
      data: {
        candidateId,
        type: "REMINDER_DROP",
        status: "FAILED",
        error: error.message,
      }
    });
  }
}

export async function sendPartialUploadReminder(to: string, name: string | null, uploadedDocs: string[], candidateId: string, clientSlug?: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://doc.cruxlearn.in';
  const applyLink = clientSlug ? `${baseUrl}/apply/${clientSlug}` : baseUrl;

  const html = `
    <!DOCTYPE html>
    <html>
      <head><style>${getBaseStyle()}</style></head>
      <body>
        <div class="container">
          <div class="header">
            <h1>CruxDoc</h1>
          </div>
          <div class="content">
            <p>Hi ${name ? name.split(' ')[0] : 'there'},</p>
            <p>Thank you for uploading your <strong>${uploadedDocs.join(", ")}</strong>.</p>
            <p>However, we noticed you haven't uploaded the rest of the required documents or haven't clicked the final submit button.</p>
            <p>Please log back in and complete the submission so we can verify your profile.</p>
            <center>
              <a href="${applyLink}" class="btn">Complete Submission</a>
            </center>
          </div>
          <div class="footer">
            <p>Secure Document Portal &copy; ${new Date().getFullYear()} CruxDoc</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const data = await resend.emails.send({
      from: SENDER,
      to,
      subject: "Action Required: Missing Documents",
      html,
    });

    await prisma.emailLog.create({
      data: {
        candidateId,
        type: "REMINDER_PARTIAL",
        status: data.error ? "FAILED" : "SENT",
        error: data.error ? data.error.message : null,
      }
    });

    return data;
  } catch (error: any) {
    await prisma.emailLog.create({
      data: {
        candidateId,
        type: "REMINDER_PARTIAL",
        status: "FAILED",
        error: error.message,
      }
    });
  }
}

export async function sendSuccessEmail(to: string, name: string | null, candidateId: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head><style>${getBaseStyle()}</style></head>
      <body>
        <div class="container">
          <div class="header" style="background-color: #10b981;">
            <h1>Submission Complete!</h1>
          </div>
          <div class="content">
            <p>Hi ${name ? name.split(' ')[0] : 'there'},</p>
            <p>Thank you! We have successfully received all your documents.</p>
            <p>Your profile is now under review by our operations team. We will notify your manager once the verification is completed.</p>
            <p>No further action is required from your side at this time.</p>
          </div>
          <div class="footer">
            <p>Secure Document Portal &copy; ${new Date().getFullYear()} CruxDoc</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const data = await resend.emails.send({
      from: SENDER,
      to,
      subject: "Documents Received Successfully",
      html,
    });

    await prisma.emailLog.create({
      data: {
        candidateId,
        type: "SUCCESS_SUBMIT",
        status: data.error ? "FAILED" : "SENT",
        error: data.error ? data.error.message : null,
      }
    });

    return data;
  } catch (error: any) {
    await prisma.emailLog.create({
      data: {
        candidateId,
        type: "SUCCESS_SUBMIT",
        status: "FAILED",
        error: error.message,
      }
    });
  }
}
