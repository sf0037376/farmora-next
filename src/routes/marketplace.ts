import { Router, Request, Response } from 'express';
import { authenticateToken, requireRole, requireApprovedKYC, AuthenticatedRequest } from '../middleware/auth';
import { db } from '../db';
import jwt from 'jsonwebtoken';

const router = Router();

/**
 * 1. GET /api/marketplace/land
 * Retrieves all approved land listings.
 * Admins/Staff can read all listings.
 */
router.get('/land', async (req: AuthenticatedRequest, res: Response) => {
  // If authorization token exists, parse it optionally to allow role-based read adjustments
  const authHeader = req.headers['authorization'];
  let showAll = false;

  if (authHeader) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt_verify_payload_safely(token);
      if (decoded && (decoded.role === 'ADMIN' || decoded.role === 'STAFF')) {
        showAll = true;
      }
    } catch (_) {}
  }

  try {
    let listings;
    if (showAll) {
      [listings] = await db.query('SELECT l.*, u.name as owner_name FROM land_listings l JOIN users u ON l.created_by_id = u.id ORDER BY l.created_at DESC');
    } else {
      [listings] = await db.query('SELECT l.*, u.name as owner_name FROM land_listings l JOIN users u ON l.created_by_id = u.id WHERE l.status = "APPROVED" ORDER BY l.created_at DESC');
    }

    return res.status(200).json({ success: true, listings });
  } catch (err: any) {
    console.error('Error fetching land listings:', err);
    return res.status(500).json({ error: 'Server error reading land marketplace listings.' });
  }
});

/**
 * 2. GET /api/marketplace/land/my-listings
 * Returns listings created by or assigned to the active user.
 * Authenticated users.
 */
router.get('/land/my-listings', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  try {
    let listings;
    if (user.role === 'AGENT') {
      [listings] = await db.query('SELECT l.*, u.name as owner_name FROM land_listings l JOIN users u ON l.created_by_id = u.id WHERE l.agent_id = ? ORDER BY l.created_at DESC', [user.id]);
    } else {
      [listings] = await db.query('SELECT l.*, u.name as owner_name FROM land_listings l JOIN users u ON l.created_by_id = u.id WHERE l.created_by_id = ? ORDER BY l.created_at DESC', [user.id]);
    }
    return res.status(200).json({ success: true, listings });
  } catch (err: any) {
    console.error('Error reading personal land listings:', err);
    return res.status(500).json({ error: 'Server error parsing user-linked land assets.' });
  }
});

/**
 * 3. POST /api/marketplace/land
 * Creates a land listing.
 * Authenticated + eKYC Approved + Role must be LAND_OWNER, AGENT or ADMIN.
 */
router.post(
  '/land',
  authenticateToken,
  requireApprovedKYC,
  requireRole(['LAND_OWNER', 'AGENT', 'ADMIN']),
  async (req: AuthenticatedRequest, res: Response) => {
    const { title, location, size_acres, lease_price_yearly, water_availability, description, agent_id, landlord_phone } = req.body;
    const user = req.user!;

    if (!title || !location || !size_acres || !lease_price_yearly || !water_availability) {
      return res.status(400).json({ error: 'Missing required field parameters for land creation.' });
    }

    try {
      let finalOwnerId = user.id;
      let finalAgentId = agent_id ? parseInt(agent_id) : null;

      // Special case: AGENT creates listing. They must link it to a LAND_OWNER via landlord_phone
      if (user.role === 'AGENT') {
        finalAgentId = user.id; // Self assigned

        if (!landlord_phone) {
          return res.status(400).json({ error: 'Agents must provide the landlord mobile number to link the asset.' });
        }

        const cleanLandlordPhone = landlord_phone.replace(/[+\s-]/g, '').trim();
        const [owners] = await db.query('SELECT id, role FROM users WHERE phone = ?', [cleanLandlordPhone]);

        if (!owners || owners.length === 0) {
          // Dynamically auto-create pending landowner user so agent can continue
          const [insertRes] = await db.query(
            'INSERT INTO users (phone, name, role, kyc_status) VALUES (?, ?, "LAND_OWNER", "PENDING")',
            [cleanLandlordPhone, `Landlord (+${cleanLandlordPhone})`]
          );
          finalOwnerId = insertRes.insertId;
          console.log(`👤 [Agent Action] Auto-registered Landowner Profile: ID ${finalOwnerId} for Phone +${cleanLandlordPhone}`);
        } else {
          finalOwnerId = owners[0].id;
        }
      }

      const [result] = await db.query(
        'INSERT INTO land_listings (title, location, size_acres, lease_price_yearly, water_availability, description, status, created_by_id, agent_id) VALUES (?, ?, ?, ?, ?, ?, "PENDING_APPROVAL", ?, ?)',
        [
          title,
          location,
          parseFloat(size_acres),
          parseFloat(lease_price_yearly),
          water_availability,
          description || '',
          finalOwnerId,
          finalAgentId
        ]
      );

      console.log(`🌾 [Land Listing Created] Title: "${title}" - ID: ${result.insertId} by user: ${user.name}`);

      return res.status(200).json({
        success: true,
        message: 'Land listing submitted successfully! Awaiting Staff review and approval.',
        listingId: result.insertId
      });
    } catch (err: any) {
      console.error('Error listing land:', err);
      return res.status(500).json({ error: 'Server error saving land marketplace assets.' });
    }
  }
);

/**
 * 4. POST /api/marketplace/land/:id/approve
 * Toggles land listings status.
 * Admins and Staff only.
 */
router.post(
  '/land/:id/approve',
  authenticateToken,
  requireRole(['ADMIN', 'STAFF']),
  async (req: AuthenticatedRequest, res: Response) => {
    const listingId = parseInt(req.params.id);
    const { status } = req.body; // status: 'APPROVED' | 'REJECTED' | 'LEASED'

    if (!status || !['APPROVED', 'REJECTED', 'LEASED'].includes(status)) {
      return res.status(400).json({ error: 'Valid status change parameter is required.' });
    }

    try {
      const [listings] = await db.query('SELECT id FROM land_listings WHERE id = ?', [listingId]);
      if (!listings || listings.length === 0) {
        return res.status(404).json({ error: 'Land listing not found.' });
      }

      await db.query('UPDATE land_listings SET status = ? WHERE id = ?', [status, listingId]);
      console.log(`⚖️  [Market Audit] Land listing ID: ${listingId} updated to [${status}] by auditor: ${req.user!.name}`);

      return res.status(200).json({
        success: true,
        message: `Land listing successfully transition to status [${status}].`
      });
    } catch (err: any) {
      console.error('Error auditing land listing:', err);
      return res.status(500).json({ error: 'Server error updating land listing audit status.' });
    }
  }
);

/**
 * 5. GET /api/marketplace/opportunities
 * Returns all active capital/business opportunities.
 */
router.get('/opportunities', async (req: Request, res: Response) => {
  try {
    const [opps] = await db.query('SELECT * FROM farm_opportunities WHERE status = "ACTIVE" ORDER BY created_at DESC');
    return res.status(200).json({ success: true, listings: opps });
  } catch (err: any) {
    console.error('Error fetching opportunities:', err);
    return res.status(500).json({ error: 'Server error loading investment schemes.' });
  }
});

/**
 * 6. POST /api/marketplace/opportunities
 * Registers a new project opportunity.
 * Admins, Staff, and Agents with approved eKYC can create projects.
 */
router.post(
  '/opportunities',
  authenticateToken,
  requireApprovedKYC,
  requireRole(['ADMIN', 'STAFF', 'AGENT']),
  async (req: AuthenticatedRequest, res: Response) => {
    const { title, category, capital_required, risk_score, expected_roi, time_horizon_months, description } = req.body;
    const user = req.user!;

    if (!title || !category || !capital_required || !risk_score || !expected_roi || !time_horizon_months || !description) {
      return res.status(400).json({ error: 'All fields are mandatory to list a farm opportunity.' });
    }

    const validCategories = ['MORINGA', 'NURSERY', 'DRAGON_FRUIT', 'GREENHOUSE', 'HYDROPONICS'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid business category selected.' });
    }

    try {
      const agentId = user.role === 'AGENT' ? user.id : null;
      const [result] = await db.query(
        'INSERT INTO farm_opportunities (title, category, capital_required, risk_score, expected_roi, time_horizon_months, description, agent_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, "ACTIVE")',
        [
          title,
          category,
          parseFloat(capital_required),
          parseInt(risk_score),
          parseFloat(expected_roi),
          parseInt(time_horizon_months),
          description,
          agentId
        ]
      );

      console.log(`📈 [Opportunity Added] Category: ${category} - Title: "${title}" by agent/staff: ${user.name}`);

      return res.status(200).json({
        success: true,
        message: 'Farm opportunity created successfully!',
        opportunityId: result.insertId
      });
    } catch (err: any) {
      console.error('Error creating opportunity:', err);
      return res.status(500).json({ error: 'Server error saving agricultural project.' });
    }
  }
);

/**
 * 7. GET /api/marketplace/jobs
 * Retrieves all farming jobs listed.
 */
router.get('/jobs', async (req: Request, res: Response) => {
  try {
    const [jobs] = await db.query(
      'SELECT j.*, l.title as land_title, l.location as land_location, u.name as employer_name FROM farming_jobs j JOIN land_listings l ON j.land_listing_id = l.id JOIN users u ON j.employer_id = u.id ORDER BY j.created_at DESC'
    );
    return res.status(200).json({ success: true, listings: jobs });
  } catch (err: any) {
    console.error('Error fetching jobs:', err);
    return res.status(500).json({ error: 'Server error loading farming jobs.' });
  }
});

/**
 * 8. POST /api/marketplace/jobs
 * Publishes a job for a verified farmer to claim.
 * Requires: Landowner, Investor, Agent, or Admin. eKYC Approved.
 */
router.post(
  '/jobs',
  authenticateToken,
  requireApprovedKYC,
  requireRole(['LAND_OWNER', 'INVESTOR', 'AGENT', 'ADMIN']),
  async (req: AuthenticatedRequest, res: Response) => {
    const { land_listing_id, title, description, daily_wage } = req.body;
    const user = req.user!;

    if (!land_listing_id || !title || !description || !daily_wage) {
      return res.status(400).json({ error: 'All fields (land listing ID, title, description, daily wage) are required.' });
    }

    try {
      const [result] = await db.query(
        'INSERT INTO farming_jobs (land_listing_id, employer_id, title, description, daily_wage, status) VALUES (?, ?, ?, ?, ?, "OPEN")',
        [parseInt(land_listing_id), user.id, title, description, parseFloat(daily_wage)]
      );

      console.log(`💼 [Job Published] Title: "${title}" - ID: ${result.insertId} by employer: ${user.name}`);

      return res.status(200).json({
        success: true,
        message: 'Farming support job published successfully!',
        jobId: result.insertId
      });
    } catch (err: any) {
      console.error('Error publishing job:', err);
      return res.status(500).json({ error: 'Server error saving farming support job.' });
    }
  }
);

/**
 * 9. POST /api/marketplace/jobs/:id/claim
 * Allows a verified farmer to claim an open farming job.
 * Requires: Farmer or Admin. eKYC Approved.
 */
router.post(
  '/jobs/:id/claim',
  authenticateToken,
  requireApprovedKYC,
  requireRole(['FARMER', 'ADMIN']),
  async (req: AuthenticatedRequest, res: Response) => {
    const jobId = parseInt(req.params.id);
    const user = req.user!;

    try {
      const [jobs] = await db.query('SELECT id, status FROM farming_jobs WHERE id = ?', [jobId]);
      if (!jobs || jobs.length === 0) {
        return res.status(404).json({ error: 'Farming job not found.' });
      }

      if (jobs[0].status !== 'OPEN') {
        return res.status(400).json({ error: 'This farming job is already assigned or completed.' });
      }

      await db.query(
        'UPDATE farming_jobs SET farmer_id = ?, status = "ASSIGNED" WHERE id = ?',
        [user.id, jobId]
      );

      console.log(`🤝 [Job Claimed] Job ID: ${jobId} claimed by verified farmer: ${user.name}`);

      return res.status(200).json({
        success: true,
        message: 'Farming job claimed successfully! Start working and get supported!'
      });
    } catch (err: any) {
      console.error('Error claiming job:', err);
      return res.status(500).json({ error: 'Server error assigning farming job.' });
    }
  }
);


// Safe helper to decode JWT payload without raising exceptions
function jwt_verify_payload_safely(token: string): any {
  const secret = process.env.JWT_SECRET || 'super_secret_farmora_key_2026_nature';
  try {
    return jwt.verify(token, secret);
  } catch (_) {
    return null;
  }
}

export { router as marketplaceRouter };
export default router;
