console.log('!!!!!!!!!!!! googleAuthModel.js LOADED !!!!!!!!!!!!');
import { db } from '../core/config/knex.js';

export async function saveTokens(userId, { refreshToken, accessToken, expiryDate }) {
  console.log('=== saveTokens dipanggil ===', {
    userId,
    hasRefreshToken: !!refreshToken,
    hasAccessToken: !!accessToken,
    expiryDate,
  });

  const payload = {
    user_id: userId,
    access_token: accessToken,
    token_expiry: expiryDate ? new Date(expiryDate) : null,
  };

  const mergeColumns = ['access_token', 'token_expiry'];

  if (refreshToken) {
    payload.refresh_token = refreshToken;
    mergeColumns.push('refresh_token');
  }

  try {
    const result = await db('user_google_tokens')
      .insert(payload)
      .onConflict('user_id')
      .merge(mergeColumns);

    console.log('=== saveTokens SUKSES ===', result);
    return result;
  } catch (err) {
    console.error('=== saveTokens GAGAL ===', err.message);
    console.error(err);
    throw err;
  }
}

export async function getTokenByUserId(userId) {
  return db('user_google_tokens').where({ user_id: userId }).first();
}

export async function isConnected(userId) {
  const row = await getTokenByUserId(userId);
  return !!row;
}