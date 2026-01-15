/* eslint-disable no-undef */
import express from 'express';
import cors from 'cors';
import {
    createRecruiter,
    authenticateRecruiter,
    createScreeningCode,
    validateCode,
    getCodesByRecruiter,
    checkApplicantExists,
    startScreening,
    updateScreening,
    getScreening,
    getScreeningsByCode,
    getRecruiterStats,
} from './database.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Simple session store (in-memory for demo - use Redis in production)
const sessions = new Map();

function generateSessionToken() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !sessions.has(token)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    req.recruiter = sessions.get(token);
    next();
}

// ============================================
// HEALTH CHECK
// ============================================

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// RECRUITER AUTH ENDPOINTS
// ============================================

// Register
app.post('/api/auth/register', (req, res) => {
    try {
        const { email, password, name, company } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, password, and name are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const id = createRecruiter(email, password, name, company);
        const token = generateSessionToken();
        const recruiter = { id, email, name, company };
        sessions.set(token, recruiter);

        res.status(201).json({ token, recruiter });
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
app.post('/api/auth/login', (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const recruiter = authenticateRecruiter(email, password);
        if (!recruiter) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = generateSessionToken();
        sessions.set(token, recruiter);

        res.json({ token, recruiter });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
        sessions.delete(token);
    }
    res.json({ message: 'Logged out' });
});

// Get current user
app.get('/api/auth/me', authMiddleware, (req, res) => {
    res.json({ recruiter: req.recruiter });
});

// ============================================
// RECRUITER DASHBOARD ENDPOINTS
// ============================================

// Get recruiter stats
app.get('/api/recruiter/stats', authMiddleware, (req, res) => {
    try {
        const stats = getRecruiterStats(req.recruiter.id);
        res.json(stats);
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Get all screening codes for recruiter
app.get('/api/recruiter/codes', authMiddleware, (req, res) => {
    try {
        const codes = getCodesByRecruiter(req.recruiter.id);
        res.json(codes);
    } catch (error) {
        console.error('Codes error:', error);
        res.status(500).json({ error: 'Failed to fetch codes' });
    }
});

// Create new screening code
app.post('/api/recruiter/codes', authMiddleware, (req, res) => {
    try {
        const { roleTitle, experienceLevel, requiredSkills, preferredSkills, jobDescription } = req.body;

        if (!roleTitle) {
            return res.status(400).json({ error: 'Role title is required' });
        }

        const code = createScreeningCode(req.recruiter.id, {
            roleTitle,
            experienceLevel,
            requiredSkills,
            preferredSkills,
            jobDescription,
        });

        res.status(201).json({ code, message: 'Screening code created' });
    } catch (error) {
        console.error('Create code error:', error);
        res.status(500).json({ error: 'Failed to create code' });
    }
});

// Get submissions for a code
app.get('/api/recruiter/codes/:code/submissions', authMiddleware, (req, res) => {
    try {
        const submissions = getScreeningsByCode(req.params.code);
        res.json(submissions);
    } catch (error) {
        console.error('Submissions error:', error);
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
});

// ============================================
// APPLICANT ENDPOINTS (No auth needed, just code)
// ============================================

// Validate code
app.get('/api/codes/:code', (req, res) => {
    try {
        const result = validateCode(req.params.code);
        if (!result.valid) {
            return res.status(400).json({ error: result.error });
        }
        res.json(result.screening);
    } catch (error) {
        console.error('Validate code error:', error);
        res.status(500).json({ error: 'Failed to validate code' });
    }
});

// Check if applicant already took test
app.post('/api/codes/:code/check', (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const exists = checkApplicantExists(req.params.code, email);
        res.json({ alreadyTaken: exists });
    } catch (error) {
        console.error('Check error:', error);
        res.status(500).json({ error: 'Failed to check applicant' });
    }
});

// Start screening (applicant)
app.post('/api/codes/:code/start', (req, res) => {
    try {
        const { email, candidateName, resumeText } = req.body;

        if (!email || !candidateName) {
            return res.status(400).json({ error: 'Email and name are required' });
        }

        // Validate code first
        const codeValidation = validateCode(req.params.code);
        if (!codeValidation.valid) {
            return res.status(400).json({ error: codeValidation.error });
        }

        const result = startScreening(req.params.code, email, candidateName, resumeText || '');

        if (!result.success) {
            return res.status(400).json({ error: result.error });
        }

        res.status(201).json({
            screeningId: result.screeningId,
            screening: codeValidation.screening,
        });
    } catch (error) {
        console.error('Start screening error:', error);
        res.status(500).json({ error: 'Failed to start screening' });
    }
});

// Update screening results (applicant completes)
app.put('/api/screenings/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const {
            candidateName,
            trustScore,
            skillMatchScore,
            authenticityScore,
            communicationScore,
            verdict,
            verdictSummary,
            skillMapping,
            authenticityReport,
            qaPairs,
            recruiterReport,
            candidateFeedback,
        } = req.body;

        updateScreening(id, {
            candidateName,
            status: 'completed',
            completedAt: new Date().toISOString(),
            trustScore,
            skillMatchScore,
            authenticityScore,
            communicationScore,
            verdict,
            verdictSummary,
            skillMapping,
            authenticityReport,
            qaPairs,
            recruiterReport,
            candidateFeedback,
        });

        res.json({ id, message: 'Screening updated' });
    } catch (error) {
        console.error('Update screening error:', error);
        res.status(500).json({ error: 'Failed to update screening' });
    }
});

// Get screening details
app.get('/api/screenings/:id', (req, res) => {
    try {
        const screening = getScreening(parseInt(req.params.id));
        if (!screening) {
            return res.status(404).json({ error: 'Screening not found' });
        }
        res.json(screening);
    } catch (error) {
        console.error('Get screening error:', error);
        res.status(500).json({ error: 'Failed to fetch screening' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🔶 Creda API Server running on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health`);
});
