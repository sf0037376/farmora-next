import { Router, Response } from 'express';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { db } from '../db';

const router = Router();

// Simulated Aadhaar-OTP storage (in memory for easy matching)
const activeAadhaarOtps = new Map<number, string>();

/**
 * 1. POST /api/kyc/submit
 * Submits identity document for verification.
 * Authenticated users only.
 */
router.post('/submit', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { document_type, document_number, file_url } = req.body;
  const user = req.user!;

  if (user.kyc_status === 'APPROVED') {
    return res.status(400).json({ error: 'Your eKYC profile is already fully verified and approved.' });
  }

  if (!document_type || !document_number) {
    return res.status(400).json({ error: 'Document type and document number are required.' });
  }

  const validDocs = ['AADHAAR', 'PAN', 'LAND_DEED', 'VOTER_ID'];
  if (!validDocs.includes(document_type)) {
    return res.status(400).json({ error: 'Invalid document type selected.' });
  }

  try {
    // Check if document_number is already used by someone else
    const [existingDocs] = await db.query(
      'SELECT id FROM kyc_details WHERE document_type = ? AND document_number = ? AND user_id != ?',
      [document_type, document_number, user.id]
    );

    if (existingDocs && existingDocs.length > 0) {
      return res.status(400).json({ error: 'This document number is already registered under another account.' });
    }

    // Insert or update kyc_details record
    await db.query(
      'INSERT INTO kyc_details (user_id, document_type, document_number, file_url, otp_verified) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE document_type = VALUES(document_type), document_number = VALUES(document_number), file_url = VALUES(file_url), otp_verified = VALUES(otp_verified)',
      [user.id, document_type, document_number, file_url || null, false]
    );

    // Update user status
    await db.query('UPDATE users SET kyc_status = "SUBMITTED" WHERE id = ?', [user.id]);

    if (document_type === 'AADHAAR') {
      // Simulate Aadhaar OTP dispatch from UIDAI
      const aadhaarOtp = Math.floor(100000 + Math.random() * 900000).toString();
      activeAadhaarOtps.set(user.id, aadhaarOtp);

      console.log('\n┌────────────────────────────────────────────────────────┐');
      console.log('│ 🇮🇳  [UIDAI AADHAAR eKYC MOCK SYSTEM]                     │');
      console.log(`│ User ID:    ${user.id.toString().padEnd(42)} │`);
      console.log(`│ Aadhaar:    XXXX-XXXX-${document_number.slice(-4).padEnd(29)} │`);
      console.log(`│ eKYC OTP:   ${aadhaarOtp.padEnd(42)} │`);
      console.log('└────────────────────────────────────────────────────────┘\n');

      return res.status(200).json({
        success: true,
        aadhaarOtpTriggered: true,
        mockAadhaarOtp: aadhaarOtp,
        message: 'Identity record saved. Aadhaar-OTP simulated and printed to terminal.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'eKYC documents submitted successfully. Awaiting staff audit.'
    });
  } catch (err: any) {
    console.error('Error submitting eKYC:', err);
    return res.status(500).json({ error: 'Server error uploading verification forms.' });
  }
});

/**
 * 2. POST /api/kyc/verify-aadhaar-otp
 * Verifies simulated OTP linked to Aadhaar identity.
 * Authenticated users only.
 */
router.post('/verify-aadhaar-otp', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { otp } = req.body;
  const user = req.user!;

  if (!otp) {
    return res.status(400).json({ error: 'Please enter the 6-digit Aadhaar verification OTP.' });
  }

  const storedOtp = activeAadhaarOtps.get(user.id);

  if (!storedOtp || storedOtp !== otp.toString().trim()) {
    return res.status(400).json({ error: 'Invalid Aadhaar eKYC OTP. Please try again.' });
  }

  try {
    // Clean otp pool
    activeAadhaarOtps.delete(user.id);

    // Update kyc_details and users status
    await db.query(
      'UPDATE kyc_details SET otp_verified = TRUE, remarks = "Automated Aadhaar eKYC success" WHERE user_id = ?',
      [user.id]
    );

    await db.query('UPDATE users SET kyc_status = "APPROVED" WHERE id = ?', [user.id]);

    console.log(`✅ [eKYC Automated Approval] Aadhaar eKYC approved instantly for ${user.name} (ID: ${user.id})`);

    return res.status(200).json({
      success: true,
      message: 'Aadhaar eKYC verification completed successfully! Your profile is now APPROVED.'
    });
  } catch (err: any) {
    console.error('Error verifying Aadhaar eKYC:', err);
    return res.status(500).json({ error: 'Server error processing Aadhaar verification.' });
  }
});

/**
 * 3. POST /api/kyc/:id/approve
 * Manually audits and approves/rejects dynamic uploads (PAN / Deeds).
 * Staff and Admin access only.
 */
router.post('/:id/approve', authenticateToken, requireRole(['ADMIN', 'STAFF']), async (req: AuthenticatedRequest, res: Response) => {
  const targetUserId = parseInt(req.params.id);
  const { status, remarks } = req.body; // status: 'APPROVED' | 'REJECTED'
  const auditor = req.user!;

  if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ error: 'Valid audit status (APPROVED or REJECTED) is required.' });
  }

  try {
    // Check if target user exists and has a submitted KYC
    const [kycRecs] = await db.query(
      'SELECT id, document_type, document_number FROM kyc_details WHERE user_id = ?',
      [targetUserId]
    );

    if (!kycRecs || kycRecs.length === 0) {
      return res.status(404).json({ error: 'No eKYC record found for the requested user.' });
    }

    const kycDetail = kycRecs[0];

    // Update kyc details auditor trail
    await db.query(
      'UPDATE kyc_details SET verified_by_id = ?, remarks = ? WHERE id = ?',
      [auditor.id, remarks || `Manual audit processed by Staff ID: ${auditor.id}`, kycDetail.id]
    );

    // Update target user kyc status
    await db.query('UPDATE users SET kyc_status = ? WHERE id = ?', [status, targetUserId]);

    console.log(`⚖️  [Manual eKYC Audit] User ID: ${targetUserId} status set to [${status}] by auditor [${auditor.name}]`);

    return res.status(200).json({
      success: true,
      message: `User registration status successfully updated to [${status}].`
    });
  } catch (err: any) {
    console.error('Error auditing KYC:', err);
    return res.status(500).json({ error: 'Server error conducting manual validation.' });
  }
});

/**
 * 4. GET /api/kyc/pending
 * Retreives active pending submissions for auditor view.
 * Staff and Admin access only.
 */
router.get('/pending', authenticateToken, requireRole(['ADMIN', 'STAFF']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [pendings] = await db.query(
      'SELECT k.*, u.name as user_name, u.phone, u.role, u.kyc_status FROM kyc_details k JOIN users u ON k.user_id = u.id WHERE u.kyc_status = "SUBMITTED" OR u.kyc_status = "PENDING"'
    );

    return res.status(200).json({
      success: true,
      pendingCount: pendings.length,
      listings: pendings
    });
  } catch (err: any) {
    console.error('Error retrieving pending KYC:', err);
    return res.status(500).json({ error: 'Server error reading auditor lists.' });
  }
});

export { router as kycRouter };
export default router;
