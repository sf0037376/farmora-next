import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_farmora_key_2026_nature';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    phone: string;
    name: string;
    role: 'ADMIN' | 'STAFF' | 'LAND_OWNER' | 'INVESTOR' | 'FARMER' | 'AGENT';
    primary_language: string;
    kyc_status: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  };
}

/**
 * Middleware to authenticate requests via JWT and enforce single-session validation.
 */
export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token missing. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number;
      phone: string;
      role: string;
      token_version: number;
    };

    // Query DB to fetch active user details and verify single active session
    const [users] = await db.query(
      'SELECT id, phone, name, role, primary_language, token_version, kyc_status FROM users WHERE id = ?',
      [decoded.id]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({ error: 'User account not found.' });
    }

    const dbUser = users[0];

    // Single active session check: verify token_version matches DB
    if (decoded.token_version !== dbUser.token_version) {
      return res.status(401).json({
        error: 'Session expired or revoked.',
        code: 'SESSION_REVOKED',
        message: 'You have logged in from another device. Single-session is enforced for security.'
      });
    }

    // Attach authenticated user payload to request object
    req.user = {
      id: dbUser.id,
      phone: dbUser.phone,
      name: dbUser.name,
      role: dbUser.role,
      primary_language: dbUser.primary_language,
      kyc_status: dbUser.kyc_status
    };

    return next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token. Access denied.' });
  }
}

/**
 * Role-Based Access Control (RBAC) middleware generator.
 * Assumes authenticateToken has already run and attached req.user.
 */
export function requireRole(allowedRoles: ('ADMIN' | 'STAFF' | 'LAND_OWNER' | 'INVESTOR' | 'FARMER' | 'AGENT')[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Access denied. Authenticated session required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access Forbidden',
        message: `Your current role (${req.user.role}) does not have permission to access this resource. Allowed roles: ${allowedRoles.join(', ')}`
      });
    }

    return next();
  };
}

/**
 * Optional check: Ensure the user's eKYC status is APPROVED before executing transactional items.
 */
export function requireApprovedKYC(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Access denied. Authenticated session required.' });
  }

  if (req.user.role !== 'ADMIN' && req.user.role !== 'STAFF' && req.user.kyc_status !== 'APPROVED') {
    return res.status(403).json({
      error: 'eKYC Verification Required',
      code: 'KYC_REQUIRED',
      message: `Your account registration status is currently [${req.user.kyc_status}]. You must complete your Aadhaar or identity verification first.`
    });
  }

  return next();
}
