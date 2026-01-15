import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize database
const db = new Database(path.join(__dirname, 'creda.db'));

// Create tables
db.exec(`
  -- Recruiters table
  CREATE TABLE IF NOT EXISTS recruiters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    company TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Screening codes table
  CREATE TABLE IF NOT EXISTS screening_codes (
    code TEXT PRIMARY KEY,
    recruiter_id INTEGER NOT NULL,
    role_title TEXT NOT NULL,
    experience_level TEXT,
    required_skills TEXT,
    preferred_skills TEXT,
    job_description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    status TEXT DEFAULT 'active',
    FOREIGN KEY (recruiter_id) REFERENCES recruiters(id)
  );

  -- Screenings table (updated)
  CREATE TABLE IF NOT EXISTS screenings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL,
    applicant_email TEXT,
    candidate_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    status TEXT DEFAULT 'in_progress',
    trust_score INTEGER,
    skill_match_score INTEGER,
    authenticity_score INTEGER,
    communication_score INTEGER,
    verdict TEXT,
    verdict_summary TEXT,
    resume_text TEXT,
    skill_mapping TEXT,
    authenticity_report TEXT,
    qa_pairs TEXT,
    recruiter_report TEXT,
    candidate_feedback TEXT,
    FOREIGN KEY (code) REFERENCES screening_codes(code)
  );

  CREATE INDEX IF NOT EXISTS idx_screenings_code ON screenings(code);
  CREATE INDEX IF NOT EXISTS idx_codes_status ON screening_codes(status);
  CREATE INDEX IF NOT EXISTS idx_codes_recruiter ON screening_codes(recruiter_id);
`);

// ============================================
// RECRUITER FUNCTIONS
// ============================================

const recruiterStatements = {
  create: db.prepare(`
    INSERT INTO recruiters (email, password_hash, name, company)
    VALUES (@email, @passwordHash, @name, @company)
  `),
  findByEmail: db.prepare(`SELECT * FROM recruiters WHERE email = ?`),
  findById: db.prepare(`SELECT id, email, name, company, created_at FROM recruiters WHERE id = ?`),
};

export function createRecruiter(email, password, name, company = null) {
  const passwordHash = bcrypt.hashSync(password, 10);
  const result = recruiterStatements.create.run({
    email: email.toLowerCase(),
    passwordHash,
    name,
    company,
  });
  return result.lastInsertRowid;
}

export function authenticateRecruiter(email, password) {
  const recruiter = recruiterStatements.findByEmail.get(email.toLowerCase());
  if (!recruiter) return null;

  if (bcrypt.compareSync(password, recruiter.password_hash)) {
    return {
      id: recruiter.id,
      email: recruiter.email,
      name: recruiter.name,
      company: recruiter.company,
    };
  }
  return null;
}

export function getRecruiterById(id) {
  return recruiterStatements.findById.get(id);
}

// ============================================
// SCREENING CODE FUNCTIONS
// ============================================

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CREDA-${code}`;
}

const codeStatements = {
  create: db.prepare(`
    INSERT INTO screening_codes (code, recruiter_id, role_title, experience_level, required_skills, preferred_skills, job_description, expires_at)
    VALUES (@code, @recruiterId, @roleTitle, @experienceLevel, @requiredSkills, @preferredSkills, @jobDescription, @expiresAt)
  `),
  findByCode: db.prepare(`SELECT * FROM screening_codes WHERE code = ?`),
  findByRecruiter: db.prepare(`
    SELECT sc.*, 
           (SELECT COUNT(*) FROM screenings s WHERE s.code = sc.code) as submission_count,
           (SELECT COUNT(*) FROM screenings s WHERE s.code = sc.code AND s.status = 'completed') as completed_count
    FROM screening_codes sc 
    WHERE sc.recruiter_id = ? 
    ORDER BY sc.created_at DESC
  `),
  updateStatus: db.prepare(`UPDATE screening_codes SET status = ? WHERE code = ?`),
};

export function createScreeningCode(recruiterId, data) {
  let code;
  let attempts = 0;

  // Try to generate unique code
  while (attempts < 10) {
    code = generateCode();
    const existing = codeStatements.findByCode.get(code);
    if (!existing) break;
    attempts++;
  }

  // Expires in 7 days
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  codeStatements.create.run({
    code,
    recruiterId,
    roleTitle: data.roleTitle,
    experienceLevel: data.experienceLevel || 'mid',
    requiredSkills: JSON.stringify(data.requiredSkills || []),
    preferredSkills: JSON.stringify(data.preferredSkills || []),
    jobDescription: data.jobDescription || '',
    expiresAt: expiresAt.toISOString(),
  });

  return code;
}

export function validateCode(code) {
  const screening = codeStatements.findByCode.get(code.toUpperCase());
  if (!screening) {
    return { valid: false, error: 'Invalid code' };
  }

  // Check expiration
  if (new Date(screening.expires_at) < new Date()) {
    codeStatements.updateStatus.run('expired', code);
    return { valid: false, error: 'This code has expired' };
  }

  if (screening.status === 'expired') {
    return { valid: false, error: 'This code has expired' };
  }

  return {
    valid: true,
    screening: {
      code: screening.code,
      roleTitle: screening.role_title,
      experienceLevel: screening.experience_level,
      requiredSkills: JSON.parse(screening.required_skills || '[]'),
      preferredSkills: JSON.parse(screening.preferred_skills || '[]'),
      jobDescription: screening.job_description,
      expiresAt: screening.expires_at,
    }
  };
}

export function getCodesByRecruiter(recruiterId) {
  return codeStatements.findByRecruiter.all(recruiterId).map(row => ({
    ...row,
    required_skills: JSON.parse(row.required_skills || '[]'),
    preferred_skills: JSON.parse(row.preferred_skills || '[]'),
  }));
}

// ============================================
// SCREENING FUNCTIONS
// ============================================

const screeningStatements = {
  create: db.prepare(`
    INSERT INTO screenings (code, applicant_email, candidate_name, resume_text)
    VALUES (@code, @applicantEmail, @candidateName, @resumeText)
  `),
  findByCodeAndEmail: db.prepare(`
    SELECT * FROM screenings WHERE code = ? AND applicant_email = ?
  `),
  update: db.prepare(`
    UPDATE screenings SET
      candidate_name = COALESCE(@candidateName, candidate_name),
      completed_at = @completedAt,
      status = @status,
      trust_score = @trustScore,
      skill_match_score = @skillMatchScore,
      authenticity_score = @authenticityScore,
      communication_score = @communicationScore,
      verdict = @verdict,
      verdict_summary = @verdictSummary,
      skill_mapping = @skillMapping,
      authenticity_report = @authenticityReport,
      qa_pairs = @qaPairs,
      recruiter_report = @recruiterReport,
      candidate_feedback = @candidateFeedback
    WHERE id = @id
  `),
  findById: db.prepare(`SELECT * FROM screenings WHERE id = ?`),
  findByCode: db.prepare(`
    SELECT * FROM screenings WHERE code = ? ORDER BY created_at DESC
  `),
};

export function checkApplicantExists(code, email) {
  const existing = screeningStatements.findByCodeAndEmail.get(code.toUpperCase(), email.toLowerCase());
  return !!existing;
}

export function startScreening(code, applicantEmail, candidateName, resumeText) {
  // Check if applicant already took this test
  if (checkApplicantExists(code, applicantEmail)) {
    return { success: false, error: 'You have already taken this screening' };
  }

  const result = screeningStatements.create.run({
    code: code.toUpperCase(),
    applicantEmail: applicantEmail.toLowerCase(),
    candidateName,
    resumeText,
  });

  return { success: true, screeningId: result.lastInsertRowid };
}

export function updateScreening(id, data) {
  return screeningStatements.update.run({
    id,
    candidateName: data.candidateName || null,
    completedAt: data.completedAt || new Date().toISOString(),
    status: data.status || 'completed',
    trustScore: data.trustScore,
    skillMatchScore: data.skillMatchScore,
    authenticityScore: data.authenticityScore,
    communicationScore: data.communicationScore,
    verdict: data.verdict,
    verdictSummary: data.verdictSummary,
    skillMapping: JSON.stringify(data.skillMapping),
    authenticityReport: JSON.stringify(data.authenticityReport),
    qaPairs: JSON.stringify(data.qaPairs),
    recruiterReport: JSON.stringify(data.recruiterReport),
    candidateFeedback: JSON.stringify(data.candidateFeedback),
  });
}

export function getScreening(id) {
  const row = screeningStatements.findById.get(id);
  if (!row) return null;

  return {
    ...row,
    skill_mapping: row.skill_mapping ? JSON.parse(row.skill_mapping) : null,
    authenticity_report: row.authenticity_report ? JSON.parse(row.authenticity_report) : null,
    qa_pairs: row.qa_pairs ? JSON.parse(row.qa_pairs) : null,
    recruiter_report: row.recruiter_report ? JSON.parse(row.recruiter_report) : null,
    candidate_feedback: row.candidate_feedback ? JSON.parse(row.candidate_feedback) : null,
  };
}

export function getScreeningsByCode(code) {
  return screeningStatements.findByCode.all(code.toUpperCase()).map(row => ({
    ...row,
    skill_mapping: row.skill_mapping ? JSON.parse(row.skill_mapping) : null,
    recruiter_report: row.recruiter_report ? JSON.parse(row.recruiter_report) : null,
  }));
}

// ============================================
// STATS FUNCTIONS
// ============================================

export function getRecruiterStats(recruiterId) {
  const stats = db.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM screening_codes WHERE recruiter_id = ?) as total_codes,
      (SELECT COUNT(*) FROM screenings s 
       JOIN screening_codes sc ON s.code = sc.code 
       WHERE sc.recruiter_id = ?) as total_screenings,
      (SELECT AVG(trust_score) FROM screenings s 
       JOIN screening_codes sc ON s.code = sc.code 
       WHERE sc.recruiter_id = ? AND s.trust_score IS NOT NULL) as avg_trust_score,
      (SELECT COUNT(*) FROM screenings s 
       JOIN screening_codes sc ON s.code = sc.code 
       WHERE sc.recruiter_id = ? AND s.verdict = 'pass') as verified_count
  `).get(recruiterId, recruiterId, recruiterId, recruiterId);

  return {
    totalCodes: stats.total_codes || 0,
    totalScreenings: stats.total_screenings || 0,
    avgTrustScore: Math.round(stats.avg_trust_score || 0),
    verifiedCount: stats.verified_count || 0,
    timeSaved: (stats.total_screenings || 0) * 45,
  };
}

export default db;
