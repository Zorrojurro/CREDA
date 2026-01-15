/**
 * API Service Layer
 * Handles all communication with the Creda backend
 */

// Use environment variable for production, fallback to /api for local dev (Vite proxy)
const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Session token storage
let authToken = localStorage.getItem('creda_token');

// Update auth token
export function setAuthToken(token) {
    authToken = token;
    if (token) {
        localStorage.setItem('creda_token', token);
    } else {
        localStorage.removeItem('creda_token');
    }
}

export function getAuthToken() {
    return authToken;
}

// Generic fetch wrapper with error handling
async function apiRequest(endpoint, options = {}) {
    try {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        // Add auth token if available
        if (authToken) {
            headers.Authorization = `Bearer ${authToken}`;
        }

        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers,
            ...options,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`API Error [${endpoint}]:`, error.message);
        throw error;
    }
}

// ============================================
// AUTH ENDPOINTS
// ============================================

export async function register(email, password, name, company) {
    const result = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name, company }),
    });
    setAuthToken(result.token);
    return result;
}

export async function login(email, password) {
    const result = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    setAuthToken(result.token);
    return result;
}

export async function logout() {
    await apiRequest('/auth/logout', { method: 'POST' }).catch(() => { });
    setAuthToken(null);
}

export async function getCurrentUser() {
    if (!authToken) return null;
    try {
        const result = await apiRequest('/auth/me');
        return result.recruiter;
    } catch {
        setAuthToken(null);
        return null;
    }
}

// ============================================
// RECRUITER ENDPOINTS
// ============================================

export async function fetchRecruiterStats() {
    return apiRequest('/recruiter/stats');
}

export async function fetchRecruiterCodes() {
    return apiRequest('/recruiter/codes');
}

export async function createScreeningCode(data) {
    return apiRequest('/recruiter/codes', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function fetchCodeSubmissions(code) {
    return apiRequest(`/recruiter/codes/${code}/submissions`);
}

// ============================================
// APPLICANT ENDPOINTS
// ============================================

export async function validateScreeningCode(code) {
    return apiRequest(`/codes/${code}`);
}

export async function checkApplicantExists(code, email) {
    const result = await apiRequest(`/codes/${code}/check`, {
        method: 'POST',
        body: JSON.stringify({ email }),
    });
    return result.alreadyTaken;
}

export async function startApplicantScreening(code, email, candidateName, resumeText) {
    return apiRequest(`/codes/${code}/start`, {
        method: 'POST',
        body: JSON.stringify({ email, candidateName, resumeText }),
    });
}

export async function updateScreening(id, data) {
    return apiRequest(`/screenings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function fetchScreening(id) {
    return apiRequest(`/screenings/${id}`);
}

// Health check
export async function checkHealth() {
    return apiRequest('/health');
}

export default {
    setAuthToken,
    getAuthToken,
    register,
    login,
    logout,
    getCurrentUser,
    fetchRecruiterStats,
    fetchRecruiterCodes,
    createScreeningCode,
    fetchCodeSubmissions,
    validateScreeningCode,
    checkApplicantExists,
    startApplicantScreening,
    updateScreening,
    fetchScreening,
    checkHealth,
};
