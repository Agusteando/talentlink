import { google } from 'googleapis';
import nodemailer from 'nodemailer';

export async function sendEmail({ to, subject, html }) {
  try {
    // 1. Load the Service Account Credentials
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/gmail.send'],
      // IMPORTANT: This allows the service account to impersonate the user
      clientOptions: {
        subject: process.env.GOOGLE_DELEGATED_USER, 
      },
    });

    // 2. Create a Transporter
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.GOOGLE_DELEGATED_USER,
        clientId: process.env.AUTH_GOOGLE_ID, // Optional if using Service Account key
        clientSecret: process.env.AUTH_GOOGLE_SECRET, // Optional if using Service Account key
        refreshToken: null, 
        accessToken: accessToken.token,
        // For Service Account pure usage w/o OAuth Client ID flow, sometimes we use direct API:
      },
    });

    // *Alternative*: If standard Nodemailer OAuth2 fails with Service Accounts (common issue),
    // we use the raw Gmail API. Below is a Raw Gmail API implementation which is more robust for SAs.
    
    const gmail = google.gmail({ version: 'v1', auth: client });

    const messageParts = [
      `From: <${process.env.GOOGLE_DELEGATED_USER}>`,
      `To: <${to}>`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=utf-8`,
      ``,
      html,
    ];
    
    const message = messageParts.join('\n');
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log(`Email sent to ${to}`);
    return { success: true };

  } catch (error) {
    console.error("Email Error:", error);
    return { success: false, error: error.message };
  }
}