import { google } from 'googleapis';
import fs from 'fs/promises';
import path from 'path';

export async function sendEmail({ to, subject, html }) {
  try {
    // 1. Configuration
    const credentialsPath = path.join(process.cwd(), 'credentials.json');
    const DELEGATED_USER = process.env.GOOGLE_DELEGATED_USER || 'desarrollo.tecnologico@casitaiedis.edu.mx';
    const ALIAS = "TalentLink - IECS IEDIS";

    // 2. Read Credentials
    const fileContent = await fs.readFile(credentialsPath);
    const authConfig = JSON.parse(fileContent.toString());

    // 3. Authenticate (JWT)
    const scopes = ['https://www.googleapis.com/auth/gmail.send'];
    const gmailClient = new google.auth.JWT(
      authConfig.client_email,
      null,
      authConfig.private_key,
      scopes,
      DELEGATED_USER
    );

    await gmailClient.authorize();

    // 4. Initialize Gmail API
    const gmail = google.gmail({ version: 'v1', auth: gmailClient });

    // 5. Construct Raw Email manually (No Nodemailer needed)
    const toHeader = Array.isArray(to) ? to.join(", ") : to;
    
    const rawEmailParts = [
      "MIME-Version: 1.0",
      `From: =?UTF-8?B?${Buffer.from(ALIAS).toString('base64')}?= <${DELEGATED_USER}>`,
      `To: ${toHeader}`,
      `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
      "Content-Type: text/html; charset=UTF-8",
      "Content-Transfer-Encoding: 7bit",
      "", 
      `<html><body>${html}</body></html>`
    ];

    const rawEmailString = rawEmailParts.join('\n');

    // 6. Encode & Send
    const encodedMessage = Buffer.from(rawEmailString)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedMessage }
    });

    console.log(`✅ Email sent to: ${toHeader}`);
    return { success: true };

  } catch (error) {
    console.error('❌ Email API Error:', error);
    return { success: false, error: error.message };
  }
}