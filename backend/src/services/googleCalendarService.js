import { google } from 'googleapis';
import { saveTokens, getTokenByUserId } from '../models/googleAuthModel.js';

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl(userId) {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    state: String(userId),
  });
}

export async function saveTokensFromCode(code, userId) {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);

  await saveTokens(userId, {
    refreshToken: tokens.refresh_token,
    accessToken: tokens.access_token,
    expiryDate: tokens.expiry_date,
  });
}

async function getAuthorizedClient(userId) {
  const row = await getTokenByUserId(userId);
  if (!row) throw new Error('User belum connect Google Calendar');

  const client = getOAuthClient();
  client.setCredentials({ refresh_token: row.refresh_token });
  return client;
}

export async function createJobEvent(userId, job) {
  const auth = await getAuthorizedClient(userId);
  const calendar = google.calendar({ version: 'v3', auth });

  const event = {
    summary: `${job.job_code} - ${job.operation_type}`,
    description: `Machine: ${job.machine_name}\nPriority Score: ${job.priority_score}`,
    start: { dateTime: job.start_time, timeZone: 'Asia/Jakarta' },
    end: { dateTime: job.end_time, timeZone: 'Asia/Jakarta' },
  };

  const res = await calendar.events.insert({ calendarId: 'primary', resource: event });
  return res.data.id;
}

// ─── Google Login (BARU) ─────────────────────────────────────────────────────
export function getLoginUrl(nonce) {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/calendar.events',
    ],
    redirect_uri: process.env.GOOGLE_LOGIN_REDIRECT_URI,
    state: nonce,
  });
}

export async function exchangeCodeForProfile(code) {
  const client = getOAuthClient();
  const { tokens } = await client.getToken({
    code,
    redirect_uri: process.env.GOOGLE_LOGIN_REDIRECT_URI,
  });

  client.setCredentials(tokens);
  const oauth2 = google.oauth2({ auth: client, version: 'v2' });
  const { data: profile } = await oauth2.userinfo.get();

  return { profile, tokens };
}