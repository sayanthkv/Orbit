const crypto = require('crypto');

// Base32 character set (RFC 4648)
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Encodes a buffer or string into a Base32 string
 */
function base32Encode(buffer) {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decodes a Base32 string into a Buffer
 */
function base32Decode(input) {
  const cleanInput = input.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const bytes = [];

  for (let i = 0; i < cleanInput.length; i++) {
    const val = BASE32_ALPHABET.indexOf(cleanInput[i]);
    if (val === -1) continue;

    value = (value << 5) | val;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generates a random Base32 secret for TOTP (160 bits / 20 bytes standard)
 */
function generateSecret(length = 20) {
  const buffer = crypto.randomBytes(length);
  return base32Encode(buffer);
}

/**
 * Generates an RFC 6238 TOTP code from a Base32 secret for a given counter/timestamp
 */
function generateTOTP(secret, timestamp = Date.now(), timeStep = 30) {
  const counter = Math.floor(timestamp / 1000 / timeStep);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const key = base32Decode(secret);
  const hmac = crypto.createHmac('sha1', key).update(counterBuffer).digest();

  // Dynamic truncation (RFC 4226)
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

/**
 * Verifies a 6-digit TOTP code against a secret within a drift window (+/- 1 timeStep)
 */
function verifyTOTP(token, secret, window = 1, timestamp = Date.now(), timeStep = 30) {
  if (!token || typeof token !== 'string' || token.trim().length !== 6) {
    return false;
  }

  const cleanToken = token.trim();
  const currentCounter = Math.floor(timestamp / 1000 / timeStep);

  for (let errorWindow = -window; errorWindow <= window; errorWindow++) {
    const stepTimestamp = (currentCounter + errorWindow) * timeStep * 1000;
    const generated = generateTOTP(secret, stepTimestamp, timeStep);
    if (crypto.timingSafeEqual(Buffer.from(cleanToken), Buffer.from(generated))) {
      return true;
    }
  }

  return false;
}

/**
 * Generates an otpauth:// URL for scanning in Authenticator apps (Google Authenticator, Authy, etc.)
 */
function getOtpAuthUrl(secret, email, issuer = 'Orbit') {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Generates emergency backup codes
 * Returns array of plain text codes for user and their hashed equivalents for DB storage
 */
function generateBackupCodes(count = 8) {
  const codes = [];
  const hashedCodes = [];

  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8-char hex code e.g. "A1B2C3D4"
    const hash = crypto.createHash('sha256').update(code).digest('hex');
    codes.push(code);
    hashedCodes.push({ codeHash: hash, used: false });
  }

  return { codes, hashedCodes };
}

/**
 * Verifies a backup code against user's stored hashed codes
 */
function verifyBackupCode(providedCode, backupCodesList) {
  if (!providedCode || !Array.isArray(backupCodesList)) return -1;
  const hash = crypto.createHash('sha256').update(providedCode.trim().toUpperCase()).digest('hex');

  for (let i = 0; i < backupCodesList.length; i++) {
    if (!backupCodesList[i].used && backupCodesList[i].codeHash === hash) {
      return i; // return index of matching unused code
    }
  }

  return -1;
}

module.exports = {
  generateSecret,
  generateTOTP,
  verifyTOTP,
  getOtpAuthUrl,
  generateBackupCodes,
  verifyBackupCode,
};
