// AI Service - OpenAI integration for resume parsing and report generation
import OpenAI from 'openai';

// Initialize OpenAI - API key from environment variable
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

let openai = null;

/**
 * Initialize the OpenAI client
 */
function initializeAI() {
    if (!API_KEY) {
        console.warn('VITE_OPENAI_API_KEY not set - AI features disabled');
        return false;
    }

    if (!openai) {
        openai = new OpenAI({
            apiKey: API_KEY,
            dangerouslyAllowBrowser: true // Required for client-side usage
        });
    }
    return true;
}

/**
 * Check if AI is available
 */
export function isAIAvailable() {
    return !!API_KEY;
}

/**
 * Parse resume with AI to extract structured data
 * Called once at resume upload - results are cached
 * @param {string} resumeText - Raw resume text
 * @param {object} jobDescription - Job requirements for context
 * @returns {object} - Structured resume data
 */
export async function parseResumeWithAI(resumeText, jobDescription) {
    if (!initializeAI()) {
        return null; // Fall back to regex-based parsing
    }

    const prompt = `Analyze this resume for a ${jobDescription.roleName || 'software'} position.

RESUME:
${resumeText.slice(0, 4000)}

JOB REQUIREMENTS:
- Required Skills: ${jobDescription.requiredSkills?.join(', ') || 'Not specified'}
- Experience Level: ${jobDescription.experienceLevel || 'Not specified'}

Extract and return ONLY a valid JSON object (no markdown, no explanation):
{
    "candidate": {
        "name": "extracted name or null",
        "email": "extracted email or null",
        "yearsOfExperience": number or null
    },
    "skills": [
        {
            "name": "skill name",
            "proficiency": "expert|intermediate|beginner",
            "yearsUsed": number or null,
            "context": "brief context of how they used it"
        }
    ],
    "relevantExperience": [
        {
            "title": "job title",
            "company": "company name",
            "duration": "time period",
            "highlights": ["key achievement 1", "key achievement 2"]
        }
    ],
    "skillMatch": {
        "matched": ["skills that match requirements"],
        "missing": ["required skills not found"],
        "additional": ["extra relevant skills"]
    },
    "overallStrength": "strong|moderate|weak",
    "suggestedQuestions": ["question 1 to probe weak areas", "question 2"]
}`;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 2000,
        });

        const text = response.choices[0]?.message?.content || '';

        // Extract JSON from response (handle markdown code blocks)
        let jsonStr = text;
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1];
        }

        const parsed = JSON.parse(jsonStr.trim());
        return {
            success: true,
            data: parsed,
            source: 'openai'
        };
    } catch (error) {
        console.error('AI Resume parsing error:', error);
        return {
            success: false,
            error: error.message,
            source: 'openai'
        };
    }
}

/**
 * Generate AI-powered interview report
 * Called after interview completion
 * @param {object} interviewData - Complete interview Q&A data
 * @param {object} resumeData - Parsed resume data
 * @param {object} jobDescription - Job requirements
 * @returns {object} - Enhanced report with AI insights
 */
export async function generateAIReport(interviewData, resumeData, jobDescription) {
    if (!initializeAI()) {
        return null;
    }

    const qaText = interviewData.questions?.map((q, i) =>
        `Q${i + 1}: ${q.text}\nA${i + 1}: ${interviewData.answers?.[i] || 'No answer'}`
    ).join('\n\n') || '';

    const prompt = `Analyze this technical interview and generate an assessment report.

CANDIDATE: ${resumeData?.candidate?.name || 'Unknown'}
ROLE: ${jobDescription.roleName || 'Software Position'}
REQUIRED SKILLS: ${jobDescription.requiredSkills?.join(', ') || 'Not specified'}

INTERVIEW Q&A:
${qaText.slice(0, 3000)}

Evaluate using the STAR method (Situation, Task, Action, Result) and provide ONLY a valid JSON response:
{
    "overallScore": 0-100,
    "verdict": "pass|hold|fail",
    "confidence": 0-100,
    "summary": "2-3 sentence executive summary",
    "starAnalysis": {
        "situationDetail": "strong|moderate|weak",
        "taskClarity": "strong|moderate|weak", 
        "actionSpecificity": "strong|moderate|weak",
        "resultsMeasurable": "strong|moderate|weak"
    },
    "strengths": [
        {"title": "strength area", "evidence": "specific example from answers"}
    ],
    "concerns": [
        {"title": "concern area", "reason": "why this is a concern"}
    ],
    "skillVerification": [
        {"skill": "skill name", "verified": true|false, "confidence": 0-100}
    ],
    "redFlags": ["any concerning patterns detected"],
    "recommendation": "detailed hiring recommendation",
    "suggestedFollowUp": ["topics for next interview round"]
}`;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 2000,
        });

        const text = response.choices[0]?.message?.content || '';

        let jsonStr = text;
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1];
        }

        const parsed = JSON.parse(jsonStr.trim());
        return {
            success: true,
            data: parsed,
            source: 'openai'
        };
    } catch (error) {
        console.error('AI Report generation error:', error);
        return {
            success: false,
            error: error.message,
            source: 'openai'
        };
    }
}

/**
 * Generate contextual follow-up question using AI
 * Only used when local templates are exhausted
 * @param {string} originalQuestion - The original question asked
 * @param {string} answer - Candidate's answer
 * @param {string} skill - The skill being tested
 * @returns {string} - AI-generated follow-up question
 */
export async function generateAIFollowUp(originalQuestion, answer, skill) {
    if (!initializeAI()) {
        return null;
    }

    const prompt = `You're conducting a technical interview. The candidate gave a vague answer.

Question: ${originalQuestion}
Answer: ${answer.slice(0, 500)}
Skill being tested: ${skill}

Generate ONE short, specific follow-up question that:
1. References something specific from their answer
2. Asks for measurable results or concrete examples
3. Cannot be answered with generic knowledge

Return ONLY the question text, no quotes or explanation.`;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 100,
        });

        return response.choices[0]?.message?.content?.trim().replace(/^["']|["']$/g, '') || null;
    } catch (error) {
        console.error('AI Follow-up generation error:', error);
        return null;
    }
}

export default {
    isAIAvailable,
    parseResumeWithAI,
    generateAIReport,
    generateAIFollowUp,
};
