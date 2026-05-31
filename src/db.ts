import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Define a unified database interface
export interface IDatabase {
  query(sql: string, params?: any[]): Promise<[any, any]>;
  execute(sql: string, params?: any[]): Promise<[any, any]>;
}

class InMemoryDb implements IDatabase {
  // Simple in-memory replicas of our tables
  public users = [
    { id: 1, phone: '919000000001', name: 'Anji Reddy', role: 'FARMER', primary_language: 'te', token_version: 1, kyc_status: 'APPROVED', created_at: new Date() },
    { id: 2, phone: '919000000002', name: 'Bala Krishna', role: 'LAND_OWNER', primary_language: 'te', token_version: 1, kyc_status: 'APPROVED', created_at: new Date() },
    { id: 3, phone: '919000000003', name: 'Chandrasekhar', role: 'INVESTOR', primary_language: 'en', token_version: 1, kyc_status: 'APPROVED', created_at: new Date() },
    { id: 4, phone: '919000000004', name: 'Dileep Kumar', role: 'AGENT', primary_language: 'en', token_version: 1, kyc_status: 'APPROVED', created_at: new Date() },
    { id: 5, phone: '919000000005', name: 'Eswar Rao', role: 'STAFF', primary_language: 'en', token_version: 1, kyc_status: 'APPROVED', created_at: new Date() },
    { id: 6, phone: '919000000006', name: 'Farmora Admin', role: 'ADMIN', primary_language: 'en', token_version: 1, kyc_status: 'APPROVED', created_at: new Date() },
    { id: 7, phone: '919000000007', name: 'Ganesh (Pending Farmer)', role: 'FARMER', primary_language: 'te', token_version: 1, kyc_status: 'PENDING', created_at: new Date() },
    { id: 8, phone: '919000000008', name: 'Hari (Submitted Land Owner)', role: 'LAND_OWNER', primary_language: 'te', token_version: 1, kyc_status: 'SUBMITTED', created_at: new Date() }
  ];

  public kyc_details = [
    { id: 1, user_id: 1, document_type: 'AADHAAR', document_number: '543210987654', otp_verified: 1, file_url: null, verified_by_id: 6, remarks: 'Aadhaar OTP verified' },
    { id: 2, user_id: 2, document_type: 'LAND_DEED', document_number: 'DEED-AP-GUNTUR-9921', otp_verified: 0, file_url: 'https://storage.googleapis.com/farmora-kyc/deed_9921.pdf', verified_by_id: 5, remarks: 'Verified Guntur survey document #42B' },
    { id: 3, user_id: 3, document_type: 'PAN', document_number: 'ABCDE1234F', otp_verified: 0, file_url: 'https://storage.googleapis.com/farmora-kyc/pan_3.jpg', verified_by_id: 6, remarks: 'PAN verified' },
    { id: 4, user_id: 4, document_type: 'AADHAAR', document_number: '123456789012', otp_verified: 1, file_url: null, verified_by_id: 6, remarks: 'Agent Aadhaar verified' },
    { id: 5, user_id: 8, document_type: 'LAND_DEED', document_number: 'DEED-AP-ANANTAPUR-8812', otp_verified: 0, file_url: 'https://storage.googleapis.com/farmora-kyc/deed_8812.pdf', verified_by_id: null, remarks: 'Awaiting document audit' }
  ];

  public otp_verifications: any[] = [];

  public land_listings = [
    { id: 1, title: 'Fertile Red Soil Farmland in Guntur', location: 'Guntur, India', size_acres: 5.50, lease_price_yearly: 45000.00, water_availability: 'Borewell active with motor, near canal link', description: 'High organic carbon content, ideal for Chilli, Cotton, or Moringa cultivation. Excellent road access.', status: 'APPROVED', created_by_id: 2, agent_id: 4, created_at: new Date() },
    { id: 2, title: 'Flat Black Cotton Soil Land in Anantapur', location: 'Anantapur, India', size_acres: 12.00, lease_price_yearly: 32000.00, water_availability: 'Drip irrigation infrastructure, needs new borewell pump', description: 'Suitable for Groundnut or Fruit orchards like Pomegranate/Dragon Fruit. Available for immediate lease.', status: 'PENDING_APPROVAL', created_by_id: 8, agent_id: 4, created_at: new Date() },
    { id: 3, title: 'Irrigated Clay Soil Plot in Chittoor', location: 'Chittoor, India', size_acres: 3.20, lease_price_yearly: 50000.00, water_availability: 'Open well with active natural spring', description: 'Extremely fertile. Formerly cultivated for sugarcane. Perfect for greenhouse or high-yield vegetables.', status: 'APPROVED', created_by_id: 2, agent_id: null, created_at: new Date() }
  ];

  public farm_opportunities = [
    { id: 1, title: 'Commercial Moringa Agro-Forestry Project', category: 'MORINGA', capital_required: 150000.00, risk_score: 30, expected_roi: 24.50, time_horizon_months: 36, description: 'High-yield Moringa oleifera plantation. Earn stable returns from powder and seed oil export contracts. Managed by Farmora Naturals processing division.', agent_id: 4, status: 'ACTIVE', created_at: new Date() },
    { id: 2, title: 'Dragon Fruit Orchard Partnership', category: 'DRAGON_FRUIT', capital_required: 350000.00, risk_score: 45, expected_roi: 32.00, time_horizon_months: 60, description: 'Premium organic dragon fruit orchard in Anantapur. High capital returns starting from year 2. Low water requirement and highly resilient crop.', agent_id: 4, status: 'ACTIVE', created_at: new Date() },
    { id: 3, title: 'Farmora Agri-Nursery Network', category: 'NURSERY', capital_required: 80000.00, risk_score: 15, expected_roi: 18.00, time_horizon_months: 12, description: 'Local sapling nursery providing high-quality fruit and timber saplings to farmers. Rapid turnarounds and extremely low biological risk.', agent_id: 4, status: 'ACTIVE', created_at: new Date() },
    { id: 4, title: 'Precision Hydroponic Tomato Greenhouse', category: 'HYDROPONICS', capital_required: 600000.00, risk_score: 50, expected_roi: 28.00, time_horizon_months: 24, description: 'Advanced automated greenhouse using cocopeat substrate. Supplies top-tier restaurants and retail brands in Hyderabad and Bangalore.', agent_id: null, status: 'ACTIVE', created_at: new Date() }
  ];

  public user_courses = [
    { id: 1, user_id: 1, course_id: 'soil_basics', current_level: 3, experience_points: 450, completed_lessons: ['lesson_1', 'lesson_2', 'lesson_3', 'lesson_4'], badges: ['soil_explorer', 'earthworm_friend'] },
    { id: 2, user_id: 1, course_id: 'crop_selection', current_level: 1, experience_points: 120, completed_lessons: ['lesson_1'], badges: [] },
    { id: 3, user_id: 7, course_id: 'soil_basics', current_level: 1, experience_points: 80, completed_lessons: ['lesson_1'], badges: [] }
  ];

  public ai_consultations: any[] = [];

  public farming_jobs = [
    { id: 1, land_listing_id: 1, employer_id: 3, title: 'Sowing & Maintenance of Moringa Crop', description: 'Need experienced farmer to perform deep ploughing, raised bed creation, and sowing PKM-1 Moringa seeds. Organic inputs provided by Farmora.', daily_wage: 750.00, status: 'OPEN', farmer_id: null, created_at: new Date() },
    { id: 2, land_listing_id: 3, employer_id: 2, title: 'Greenhouse Tomato Fertigation Supervisor', description: 'Supervise nutrient feed injection and trellis training for vertical hybrid tomatoes in Chittoor greenhouse. Needs intermediate knowledge.', daily_wage: 900.00, status: 'ASSIGNED', farmer_id: 1, created_at: new Date() },
    { id: 3, land_listing_id: 1, employer_id: 3, title: 'Soil Amendment & Compost Application', description: 'Apply cow dung compost and bio-stimulants across 5 acres of red soil plot in Guntur to build organic carbon.', daily_wage: 650.00, status: 'OPEN', farmer_id: null, created_at: new Date() }
  ];

  async query(sql: string, params: any[] = []): Promise<[any, any]> {
    const cleanSql = sql.replace(/\s+/g, ' ').trim();
    
    // 1. Auth Endpoint: select user by phone
    if (cleanSql.includes('FROM users WHERE phone = ?')) {
      const phone = params[0];
      const match = this.users.find(u => u.phone === phone);
      return [match ? [match] : [], null];
    }
    
    // 2. Auth Endpoint: select user by ID
    if (cleanSql.includes('FROM users WHERE id = ?')) {
      const id = parseInt(params[0]);
      const match = this.users.find(u => u.id === id);
      return [match ? [match] : [], null];
    }

    // 3. Register user
    if (cleanSql.startsWith('INSERT INTO users')) {
      // INSERT INTO users (phone, name, role, primary_language) VALUES (?, ?, ?, ?)
      const phone = params[0];
      const name = params[1];
      const role = params[2];
      const primary_language = params[3] || 'en';
      const newUser = {
        id: this.users.length + 1,
        phone,
        name,
        role,
        primary_language,
        token_version: 1,
        kyc_status: 'PENDING' as any,
        created_at: new Date()
      };
      this.users.push(newUser);
      return [{ insertId: newUser.id }, null];
    }

    // 4. Update user token version (for single active session)
    if (cleanSql.includes('UPDATE users SET token_version = token_version + 1 WHERE id = ?')) {
      const id = parseInt(params[0]);
      const idx = this.users.findIndex(u => u.id === id);
      if (idx !== -1) {
        this.users[idx].token_version += 1;
        return [{ affectedRows: 1 }, null];
      }
      return [{ affectedRows: 0 }, null];
    }

    // 5. Update user language preference
    if (cleanSql.includes('UPDATE users SET primary_language = ? WHERE id = ?')) {
      const lang = params[0];
      const id = parseInt(params[1]);
      const idx = this.users.findIndex(u => u.id === id);
      if (idx !== -1) {
        this.users[idx].primary_language = lang;
        return [{ affectedRows: 1 }, null];
      }
      return [{ affectedRows: 0 }, null];
    }

    // 6. Update user KYC status (Direct API or manual Staff Audit)
    if (cleanSql.includes('UPDATE users SET kyc_status = ? WHERE id = ?')) {
      const status = params[0];
      const id = parseInt(params[1]);
      const idx = this.users.findIndex(u => u.id === id);
      if (idx !== -1) {
        this.users[idx].kyc_status = status;
        return [{ affectedRows: 1 }, null];
      }
      return [{ affectedRows: 0 }, null];
    }

    // 7. OTP Verifications
    if (cleanSql.startsWith('INSERT INTO otp_verifications')) {
      const phone = params[0];
      const otp = params[1];
      const expires_at = params[2];
      const newOtp = {
        id: this.otp_verifications.length + 1,
        phone,
        otp,
        expires_at,
        is_verified: false,
        created_at: new Date()
      };
      this.otp_verifications.push(newOtp);
      return [{ insertId: newOtp.id }, null];
    }

    if (cleanSql.includes('FROM otp_verifications WHERE phone = ? AND otp = ?')) {
      const phone = params[0];
      const otp = params[1];
      const matches = this.otp_verifications.filter(o => o.phone === phone && o.otp === otp && !o.is_verified);
      return [matches, null];
    }

    if (cleanSql.includes('UPDATE otp_verifications SET is_verified = TRUE WHERE id = ?')) {
      const id = parseInt(params[0]);
      const idx = this.otp_verifications.findIndex(o => o.id === id);
      if (idx !== -1) {
        this.otp_verifications[idx].is_verified = true;
        return [{ affectedRows: 1 }, null];
      }
      return [{ affectedRows: 0 }, null];
    }

    // 8. eKYC details
    if (cleanSql.includes('FROM kyc_details WHERE user_id = ?')) {
      const user_id = parseInt(params[0]);
      const match = this.kyc_details.find(k => k.user_id === user_id);
      return [match ? [match] : [], null];
    }

    if (cleanSql.startsWith('INSERT INTO kyc_details')) {
      // user_id, document_type, document_number, file_url, otp_verified
      const user_id = parseInt(params[0]);
      const docType = params[1];
      const docNum = params[2];
      const fileUrl = params[3] || null;
      const otpVerified = params[4] ? 1 : 0;
      
      const newKyc = {
        id: this.kyc_details.length + 1,
        user_id,
        document_type: docType as any,
        document_number: docNum,
        otp_verified: otpVerified,
        file_url: fileUrl,
        verified_by_id: null as any,
        remarks: null as any
      };
      // remove old one if exists
      this.kyc_details = this.kyc_details.filter(k => k.user_id !== user_id);
      this.kyc_details.push(newKyc);
      return [{ insertId: newKyc.id }, null];
    }

    if (cleanSql.includes('UPDATE kyc_details SET otp_verified = ?, verified_by_id = ?, remarks = ? WHERE id = ?')) {
      const otpVerified = params[0] ? 1 : 0;
      const verifierId = params[1];
      const remarks = params[2];
      const id = parseInt(params[3]);
      const idx = this.kyc_details.findIndex(k => k.id === id);
      if (idx !== -1) {
        this.kyc_details[idx].otp_verified = otpVerified;
        this.kyc_details[idx].verified_by_id = verifierId;
        this.kyc_details[idx].remarks = remarks;
        return [{ affectedRows: 1 }, null];
      }
      return [{ affectedRows: 0 }, null];
    }

    // eKYC list for Staff/Admin review
    if (cleanSql.includes('SELECT k.*, u.name as user_name')) {
      const list = this.kyc_details.map(k => {
        const u = this.users.find(usr => usr.id === k.user_id);
        return {
          ...k,
          user_name: u ? u.name : 'Unknown User',
          phone: u ? u.phone : '',
          role: u ? u.role : '',
          kyc_status: u ? u.kyc_status : ''
        };
      });
      return [list, null];
    }

    // 9. Land listings
    if (cleanSql.includes('FROM land_listings') && cleanSql.includes('WHERE status = ?')) {
      const status = params[0];
      const matches = this.land_listings.filter(l => l.status === status);
      return [matches, null];
    }

    if (cleanSql.includes('FROM land_listings WHERE id = ?')) {
      const id = parseInt(params[0]);
      const match = this.land_listings.find(l => l.id === id);
      return [match ? [match] : [], null];
    }

    if (cleanSql.includes('SELECT l.*, u.name as owner_name')) {
      // Join users for detailed land list
      const list = this.land_listings.map(l => {
        const u = this.users.find(usr => usr.id === l.created_by_id);
        const agent = l.agent_id ? this.users.find(usr => usr.id === l.agent_id) : null;
        return {
          ...l,
          owner_name: u ? u.name : 'Unknown Owner',
          owner_phone: u ? u.phone : '',
          agent_name: agent ? agent.name : null
        };
      });
      return [list, null];
    }

    if (cleanSql.startsWith('INSERT INTO land_listings')) {
      // title, location, size_acres, lease_price_yearly, water_availability, description, created_by_id, agent_id
      const newLand = {
        id: this.land_listings.length + 1,
        title: params[0],
        location: params[1],
        size_acres: parseFloat(params[2]),
        lease_price_yearly: parseFloat(params[3]),
        water_availability: params[4],
        description: params[5],
        status: 'PENDING_APPROVAL' as any,
        created_by_id: parseInt(params[6]),
        agent_id: params[7] ? parseInt(params[7]) : null,
        created_at: new Date()
      };
      this.land_listings.push(newLand);
      return [{ insertId: newLand.id }, null];
    }

    if (cleanSql.includes('UPDATE land_listings SET status = ? WHERE id = ?')) {
      const status = params[0];
      const id = parseInt(params[1]);
      const idx = this.land_listings.findIndex(l => l.id === id);
      if (idx !== -1) {
        this.land_listings[idx].status = status;
        return [{ affectedRows: 1 }, null];
      }
      return [{ affectedRows: 0 }, null];
    }

    // 10. Farm Opportunities
    if (cleanSql.includes('FROM farm_opportunities WHERE status = ?')) {
      const status = params[0];
      const matches = this.farm_opportunities.filter(f => f.status === status);
      return [matches, null];
    }

    if (cleanSql.startsWith('INSERT INTO farm_opportunities')) {
      // title, category, capital_required, risk_score, expected_roi, time_horizon_months, description, agent_id
      const newOpp = {
        id: this.farm_opportunities.length + 1,
        title: params[0],
        category: params[1],
        capital_required: parseFloat(params[2]),
        risk_score: parseInt(params[3]),
        expected_roi: parseFloat(params[4]),
        time_horizon_months: parseInt(params[5]),
        description: params[6],
        agent_id: params[7] ? parseInt(params[7]) : null,
        status: 'ACTIVE' as any,
        created_at: new Date()
      };
      this.farm_opportunities.push(newOpp);
      return [{ insertId: newOpp.id }, null];
    }

    // 11. Learning tracker
    if (cleanSql.includes('FROM user_courses WHERE user_id = ? AND course_id = ?')) {
      const user_id = parseInt(params[0]);
      const course_id = params[1];
      const match = this.user_courses.find(c => c.user_id === user_id && c.course_id === course_id);
      return [match ? [match] : [], null];
    }

    if (cleanSql.includes('FROM user_courses WHERE user_id = ?')) {
      const user_id = parseInt(params[0]);
      const matches = this.user_courses.filter(c => c.user_id === user_id);
      return [matches, null];
    }

    if (cleanSql.startsWith('INSERT INTO user_courses')) {
      // user_id, course_id, current_level, experience_points, completed_lessons, badges
      const user_id = parseInt(params[0]);
      const course_id = params[1];
      const level = parseInt(params[2]);
      const xp = parseInt(params[3]);
      const completed = JSON.parse(params[4] || '[]');
      const badges = JSON.parse(params[5] || '[]');
      
      const newCourse = {
        id: this.user_courses.length + 1,
        user_id,
        course_id,
        current_level: level,
        experience_points: xp,
        completed_lessons: completed,
        badges
      };
      this.user_courses = this.user_courses.filter(c => !(c.user_id === user_id && c.course_id === course_id));
      this.user_courses.push(newCourse);
      return [{ insertId: newCourse.id }, null];
    }

    if (cleanSql.includes('UPDATE user_courses SET current_level = ?, experience_points = ?, completed_lessons = ?, badges = ? WHERE id = ?')) {
      const level = parseInt(params[0]);
      const xp = parseInt(params[1]);
      const completed = JSON.parse(params[2]);
      const badges = JSON.parse(params[3]);
      const id = parseInt(params[4]);
      
      const idx = this.user_courses.findIndex(c => c.id === id);
      if (idx !== -1) {
        this.user_courses[idx].current_level = level;
        this.user_courses[idx].experience_points = xp;
        this.user_courses[idx].completed_lessons = completed;
        this.user_courses[idx].badges = badges;
        return [{ affectedRows: 1 }, null];
      }
      return [{ affectedRows: 0 }, null];
    }

    // 12. Polam AI crop consultations
    if (cleanSql.includes('FROM ai_consultations WHERE user_id = ?')) {
      const user_id = parseInt(params[0]);
      const matches = this.ai_consultations.filter(c => c.user_id === user_id);
      return [matches, null];
    }

    if (cleanSql.startsWith('INSERT INTO ai_consultations')) {
      // user_id, location, land_size, water_source, budget, experience_level, recommendations
      const newConsult = {
        id: this.ai_consultations.length + 1,
        user_id: parseInt(params[0]),
        location: params[1],
        land_size: parseFloat(params[2]),
        water_source: params[3],
        budget: parseFloat(params[4]),
        experience_level: params[5],
        recommendations: JSON.parse(params[6] || '{}'),
        created_at: new Date()
      };
      this.ai_consultations.push(newConsult);
      return [{ insertId: newConsult.id }, null];
    }

    // 13. Farming Jobs matching
    if (cleanSql.includes('FROM farming_jobs')) {
      const list = this.farming_jobs.map(j => {
        const land = this.land_listings.find(l => l.id === j.land_listing_id);
        const emp = this.users.find(u => u.id === j.employer_id);
        const farmer = j.farmer_id ? this.users.find(u => u.id === j.farmer_id) : null;
        return {
          ...j,
          land_title: land ? land.title : 'Procured Plot',
          land_location: land ? land.location : 'India',
          employer_name: emp ? emp.name : 'System Landlord',
          farmer_name: farmer ? farmer.name : null
        };
      });
      return [list, null];
    }

    if (cleanSql.startsWith('INSERT INTO farming_jobs')) {
      // land_listing_id, employer_id, title, description, daily_wage
      const newJob = {
        id: this.farming_jobs.length + 1,
        land_listing_id: parseInt(params[0]),
        employer_id: parseInt(params[1]),
        title: params[2],
        description: params[3],
        daily_wage: parseFloat(params[4]),
        status: 'OPEN',
        farmer_id: null,
        created_at: new Date()
      };
      this.farming_jobs.push(newJob);
      return [{ insertId: newJob.id }, null];
    }

    if (cleanSql.includes('UPDATE farming_jobs SET farmer_id = ?, status = "ASSIGNED" WHERE id = ?')) {
      const farmerId = parseInt(params[0]);
      const jobId = parseInt(params[1]);
      const idx = this.farming_jobs.findIndex(j => j.id === jobId);
      if (idx !== -1) {
        this.farming_jobs[idx].farmer_id = farmerId;
        this.farming_jobs[idx].status = 'ASSIGNED';
        return [{ affectedRows: 1 }, null];
      }
      return [{ affectedRows: 0 }, null];
    }

    if (cleanSql.includes('UPDATE farming_jobs SET status = ? WHERE id = ?')) {
      const status = params[0];
      const jobId = parseInt(params[1]);
      const idx = this.farming_jobs.findIndex(j => j.id === jobId);
      if (idx !== -1) {
        this.farming_jobs[idx].status = status;
        return [{ affectedRows: 1 }, null];
      }
      return [{ affectedRows: 0 }, null];
    }

    // Default empty array returns
    return [[], null];
  }

  async execute(sql: string, params: any[] = []): Promise<[any, any]> {
    return this.query(sql, params);
  }
}

// Set up MySQL connection pool with full robust fallback
let db: IDatabase = new InMemoryDb();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'rootpassword',
  database: process.env.DB_NAME || 'farmora_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection on launch to decide fallback
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ MySQL Database connected successfully with Connection Pool!');
    conn.release();
    db = pool;
  } catch (err: any) {
    console.warn('\n⚠️  [FARMORA RESILIENT ENGINE] MySQL connection failed. Error:', err.message);
    console.warn('⚡  Activating high-fidelity In-Memory Database Fallback for smooth out-of-the-box local testing!\n');
    db = new InMemoryDb();
  }
})();

export { db };
export default db;
