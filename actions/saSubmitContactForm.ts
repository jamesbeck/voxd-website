"use server";

import { ServerActionResponse } from "@/types/types";
import sendgrid from "@sendgrid/mail";

const saSubmitContactForm = async ({
  name,
  email,
  phone,
  message,
}: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}): Promise<ServerActionResponse> => {
  // Validate required fields
  if (!name || !email || !message) {
    return {
      success: false,
      error: "Please fill in all required fields",
    };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      success: false,
      error: "Please enter a valid email address",
    };
  }

  try {
    sendgrid.setApiKey(process.env.SENDGRID_API_KEY!);

    const submittedAt = new Date().toLocaleString("en-GB", {
      dateStyle: "full",
      timeStyle: "short",
    });

    await sendgrid.send({
      from: "Voxd Website <website@voxd.ai>",
      replyTo: email,
      to: ["james.beck@voxd.ai"],
      subject: `Contact Form: ${name}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Contact Form Submission</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; width: 120px;">Name:</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">
                <a href="mailto:${email}" style="color: #2563eb;">${email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Phone:</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">
                ${phone ? `<a href="tel:${phone}" style="color: #2563eb;">${phone}</a>` : "Not provided"}
              </td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Submitted:</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${submittedAt}</td>
            </tr>
          </table>
          
          <div style="margin-top: 20px; padding: 15px; background-color: #f9fafb; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #374151;">Message:</h3>
            <p style="white-space: pre-wrap; margin-bottom: 0;">${message}</p>
          </div>
          
          <p style="margin-top: 30px; font-size: 12px; color: #6b7280;">
            This message was sent from the contact form on voxd.ai
          </p>
        </body>
        </html>
      `,
    });

    return {
      success: true,
      data: { message: "Contact form submitted successfully" },
    };
  } catch (error) {
    console.error("Error submitting contact form:", error);
    return {
      success: false,
      error: "Failed to submit contact form. Please try again.",
    };
  }
};

export default saSubmitContactForm;
