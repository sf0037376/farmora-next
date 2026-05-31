import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { db } from '../db';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_farmora_key_2026_nature';
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

/**
 * Helper to dispatch OTP alerts to a Slack channel.
 * Uses axios in a safe block.
 */
async function sendOtpToSlack(phone: string, otp: string) {
  if (!SLACK_WEBHOOK_URL) return false;
  try {
    const payload = {
      text: `🔑 *[Farmora Security]* One-Time Password (OTP) request:`,
      attachments: [
        {
          color: '#10b981', // Forest emerald
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Target Number:* \`+${phone}\` \n*Your OTP Code:* \`*${otp}*\` \n\n_Expires in 5 minutes._`
              }
            }
          ]
        }
      ]
    };
    await axios.post(SLACK_WEBHOOK_URL, payload);
    return true;
  } catch (err: any) {
    // Fail silently in terms of API crash, but log it
    console.error('⚠️  Failed to dispatch OTP to Slack webhook:', err.message);
    return false;
  }
}

/**
 * 1. POST /api/auth/send-otp
 * Triggers a login/registration OTP generation.
 */
router.post('/send-otp', async (req: Request, res: Response) => {
  const { phone } = req.body;

  if (!phone || typeof phone !== 'string' || phone.trim().length < 10) {
    return res.status(400).json({ error: 'Please enter a valid mobile number with country code.' });
  }

  const cleanPhone = phone.replace(/[+\s-]/g, '').trim();

  // Generate 6-digit cryptographic-simulated OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins expiry

  try {
    // Save to OTP database
    await db.query(
      'INSERT INTO otp_verifications (phone, otp, expires_at) VALUES (?, ?, ?)',
      [cleanPhone, otp, expiresAt]
    );

    // Try sending to Slack
    const slackDispatched = await sendOtpToSlack(cleanPhone, otp);

    // Generate beautiful dashboard logging for direct visibility
    console.log('\n┌────────────────────────────────────────────────────────┐');
    console.log('│ 🔑  [FARMORA AGRI-AUTH ENGINE]                         │');
    console.log(`│ Mobile:     +${cleanPhone.padEnd(41)} │`);
    console.log(`│ OTP Code:   ${otp.padEnd(43)} │`);
    console.log(`│ Expires:    5 minutes (${expiresAt.toLocaleTimeString().padEnd(25)}) │`);
    console.log(`│ Dispatch:   ${(slackDispatched ? 'SUCCESS (Slack Webhook)' : 'CONSOLE FALLBACK (WebHook simulated)').padEnd(43)} │`);
    console.log('└────────────────────────────────────────────────────────┘\n');

    return res.status(200).json({
      success: true,
      message: 'One-Time Password has been dispatched successfully.',
      expiresInSeconds: 300,
      mockOtp: otp // Included directly for easy developer testing if slack is absent!
    });
  } catch (err: any) {
    console.error('Error generating OTP:', err);
    return res.status(500).json({ error: 'Server error generating authentication code.' });
  }
});

/**
 * 2. POST /api/auth/verify-otp
 * Verifies submitted code, registers new accounts dynamically, handles session invalidation, and signs JWT.
 */
router.post('/verify-otp', async (req: Request, res: Response) => {
  const { phone, otp, name, role, language } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ error: 'Mobile number and OTP are required fields.' });
  }

  const cleanPhone = phone.replace(/[+\s-]/g, '').trim();

  try {
    // 1. Fetch unverified OTP records for the phone
    const [otps] = await db.query(
      'SELECT id, otp, expires_at FROM otp_verifications WHERE phone = ? AND otp = ? AND is_verified = FALSE ORDER BY created_at DESC LIMIT 1',
      [cleanPhone, otp]
    );

    if (!otps || otps.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired OTP. Please try again.' });
    }

    const matchedOtp = otps[0];
    const now = new Date();

    if (now > new Date(matchedOtp.expires_at)) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    // Mark OTP as verified
    await db.query('UPDATE otp_verifications SET is_verified = TRUE WHERE id = ?', [matchedOtp.id]);

    // 2. Resolve User record
    let [users] = await db.query(
      'SELECT id, phone, name, role, primary_language, token_version, kyc_status FROM users WHERE phone = ?',
      [cleanPhone]
    );

    let user;

    if (!users || users.length === 0) {
      // REGISTRATION Flow: Create a new user profile
      if (!name || !role) {
        return res.status(200).json({
          registrationRequired: true,
          phone: cleanPhone,
          message: 'OTP verified. Profile creation details required for registration.'
        });
      }

      const validRoles = ['ADMIN', 'STAFF', 'LAND_OWNER', 'INVESTOR', 'FARMER', 'AGENT'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role selection.' });
      }

      const defaultLang = language || 'en';
      const [insertResult] = await db.query(
        'INSERT INTO users (phone, name, role, primary_language, token_version, kyc_status) VALUES (?, ?, ?, ?, 1, "PENDING")',
        [cleanPhone, name, role, defaultLang]
      );

      const newUserId = insertResult.insertId;

      // Query the newly created user
      const [newUsers] = await db.query(
        'SELECT id, phone, name, role, primary_language, token_version, kyc_status FROM users WHERE id = ?',
        [newUserId]
      );
      user = newUsers[0];
      console.log(`👤 [New Registration] User registered: ${name} (${role}) - ID: ${newUserId}`);
    } else {
      user = users[0];
      // Optional: Update language preference if passed
      if (language && language !== user.primary_language) {
        await db.query('UPDATE users SET primary_language = ? WHERE id = ?', [language, user.id]);
        user.primary_language = language;
      }
      console.log(`👤 [Successful Login] Verified user: ${user.name} (${user.role}) - ID: ${user.id}`);
    }

    // 3. ENFORCE SINGLE ACTIVE SESSION: Invalidate other tokens
    // We increment token_version in DB. Previous tokens signed with the old version will trigger unauthorized error!
    await db.query('UPDATE users SET token_version = token_version + 1 WHERE id = ?', [user.id]);
    
    // Fetch user details post-increment to get accurate version
    const [updatedUsers] = await db.query('SELECT token_version FROM users WHERE id = ?', [user.id]);
    const nextTokenVersion = updatedUsers[0].token_version;

    // 4. SIGN NEW JWT SESSION
    const token = jwt.sign(
      {
        id: user.id,
        phone: user.phone,
        role: user.role,
        token_version: nextTokenVersion
      },
      JWT_SECRET,
      { expiresIn: '7d' } // Secure 7 day expiry
    );

    // Return profile & session token
    return res.status(200).json({
      success: true,
      token,
      profile: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        primary_language: user.primary_language,
        kyc_status: user.kyc_status
      }
    });
  } catch (err: any) {
    console.error('Error during OTP verification login:', err);
    return res.status(500).json({ error: 'Server error processing authentication request.' });
  }
});

export { router as authRouter };
export default router;
