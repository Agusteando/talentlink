// --- src\lib\google.js ---
import { google } from 'googleapis';
import fs from 'fs/promises';
import path from 'path';

const SCOPES = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
];

// The target calendar ID provided
const CALENDAR_ID = "c_da63d40e47a211e70cdc9135f18d94a9da4dd4cb49ee87adcb983c69b42f6833@group.calendar.google.com";

async function getAuth() {
    const credentialsPath = path.join(process.cwd(), 'credentials.json');
    const fileContent = await fs.readFile(credentialsPath);
    const authConfig = JSON.parse(fileContent.toString());

    const jwtClient = new google.auth.JWT(
        authConfig.client_email,
        null,
        authConfig.private_key,
        SCOPES,
        process.env.GOOGLE_DELEGATED_USER || 'desarrollo.tecnologico@casitaiedis.edu.mx'
    );

    await jwtClient.authorize();
    return jwtClient;
}

export async function sendGmail({ to, subject, html }) {
    try {
        const auth = await getAuth();
        const gmail = google.gmail({ version: 'v1', auth });

        const toHeader = Array.isArray(to) ? to.join(", ") : to;
        const rawEmail = [
            "MIME-Version: 1.0",
            `From: TalentLink <${process.env.GOOGLE_DELEGATED_USER}>`,
            `To: ${toHeader}`,
            `Subject: ${subject}`,
            "Content-Type: text/html; charset=UTF-8",
            "",
            `<html><body>${html}</body></html>`
        ].join('\n');

        const encodedMessage = Buffer.from(rawEmail).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        
        await gmail.users.messages.send({ userId: 'me', requestBody: { raw: encodedMessage } });
        return { success: true };
    } catch (e) {
        console.error("Gmail Error:", e);
        return { success: false, error: e.message };
    }
}

export async function createCalendarEvent({ title, description, startTime, endTime, location, attendees = [] }) {
    try {
        const auth = await getAuth();
        const calendar = google.calendar({ version: 'v3', auth });

        const event = {
            summary: title,
            description: description,
            location: location,
            start: { dateTime: startTime.toISOString() },
            end: { dateTime: endTime.toISOString() },
            attendees: attendees.map(email => ({ email })),
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 24 * 60 },
                    { method: 'popup', minutes: 10 },
                ],
            },
        };

        const res = await calendar.events.insert({
            calendarId: CALENDAR_ID,
            resource: event,
        });

        console.log('✅ Calendar Event Created:', res.data.htmlLink);
        return { success: true, link: res.data.htmlLink };
    } catch (e) {
        console.error("Calendar Error:", e);
        return { success: false, error: e.message };
    }
}