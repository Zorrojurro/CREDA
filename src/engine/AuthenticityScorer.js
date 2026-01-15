// Authenticity Scorer - Calculates authenticity score and detects malpractice
import { AUTHENTICITY_WEIGHTS, RED_FLAG_PATTERNS } from '../utils/constants';
import {
    calculateAuthenticityScore,
    analyzeConsistency,
    extractTopics
} from '../utils/textAnalysis';

/**
 * Score a single answer for authenticity
 * @param {string} answer - The candidate's answer
 * @param {object} question - The question that was asked
 * @returns {object} - Authenticity analysis
 */
export function scoreAnswerAuthenticity(answer, question) {
    const baseAnalysis = calculateAuthenticityScore(answer);

    // Add question-specific analysis
    const skillMentions = countSkillMentions(answer, question.skill);
    const relevanceScore = calculateRelevanceScore(answer, question);

    // Adjust score based on question type
    let typeMultiplier = 1.0;
    if (question.type === 'failure' && !hasFailureIndicators(answer)) {
        typeMultiplier = 0.8; // Penalize if failure question doesn't discuss failures
    }

    const adjustedScore = Math.round(baseAnalysis.overall * typeMultiplier);

    return {
        score: adjustedScore,
        breakdown: baseAnalysis.breakdown,
        flags: {
            ...baseAnalysis.flags,
            skillMentions,
            relevanceScore,
            typeMatch: typeMultiplier === 1.0,
        },
        redFlags: identifyRedFlags(answer),
    };
}

/**
 * Count mentions of the target skill in answer
 */
function countSkillMentions(answer, skill) {
    const regex = new RegExp(`\\b${skill}\\b`, 'gi');
    const matches = answer.match(regex);
    return matches ? matches.length : 0;
}

/**
 * Calculate how relevant the answer is to the question
 */
function calculateRelevanceScore(answer, question) {
    const answerTopics = extractTopics(answer);
    const questionTopics = extractTopics(question.text);

    const overlap = answerTopics.filter(t => questionTopics.includes(t)).length;
    const relevant = overlap > 0 || answer.toLowerCase().includes(question.skill.toLowerCase());

    return relevant ? 80 : 40;
}

/**
 * Check if answer discusses failures/challenges as expected
 */
function hasFailureIndicators(answer) {
    const indicators = [
        'failed', 'mistake', 'error', 'wrong', 'problem', 'issue',
        'struggled', 'difficult', 'challenge', 'bug', 'crash',
        'didn\'t work', 'broke', 'fixed', 'debug'
    ];

    const lower = answer.toLowerCase();
    return indicators.some(i => lower.includes(i));
}

/**
 * Identify specific red flags in an answer
 * @param {string} answer - The answer to analyze
 * @returns {object[]} - Array of red flags found
 */
export function identifyRedFlags(answer) {
    const redFlags = [];
    const lower = answer.toLowerCase();

    // Check each category of red flags
    RED_FLAG_PATTERNS.generic.forEach(pattern => {
        if (lower.includes(pattern)) {
            redFlags.push({
                type: 'generic',
                pattern: pattern,
                severity: 'medium',
                message: 'Uses generic phrasing',
            });
        }
    });

    RED_FLAG_PATTERNS.textbook.forEach(pattern => {
        if (lower.includes(pattern)) {
            redFlags.push({
                type: 'textbook',
                pattern: pattern,
                severity: 'high',
                message: 'Uses textbook-style language',
            });
        }
    });

    RED_FLAG_PATTERNS.overlyPolished.forEach(pattern => {
        if (lower.includes(pattern)) {
            redFlags.push({
                type: 'polished',
                pattern: pattern,
                severity: 'medium',
                message: 'Answer is suspiciously polished',
            });
        }
    });

    // Check for high confidence but no specifics
    if (answer.length > 150) {
        const hasSpecifics = /\d+|error|bug|version|file|function|method/i.test(answer);
        if (!hasSpecifics) {
            redFlags.push({
                type: 'vague',
                severity: 'high',
                message: 'Long answer without specific details',
            });
        }
    }

    return redFlags;
}

/**
 * Calculate overall authenticity for an interview session
 * @param {object[]} qaPairs - Array of question-answer pairs with scores
 * @returns {object} - Overall authenticity assessment
 */
export function calculateOverallAuthenticity(qaPairs) {
    if (!qaPairs || qaPairs.length === 0) {
        return { score: 50, confidence: 0, assessment: 'No data' };
    }

    // Calculate weighted average of individual scores
    let totalWeight = 0;
    let weightedSum = 0;

    qaPairs.forEach(qa => {
        // Handle both 'authenticity' and 'authenticityScore' property names
        const authScore = qa.authenticity || qa.authenticityScore || { score: 50, redFlags: [] };
        const weight = qa.question?.priority === 'high' ? 1.5 :
            qa.question?.priority === 'medium' ? 1.0 : 0.7;
        weightedSum += (authScore.score || 50) * weight;
        totalWeight += weight;
    });

    const averageScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 50;

    // Analyze consistency across answers
    const answers = qaPairs.map(qa => qa.answer || '').filter(a => a.length > 0);
    const consistencyScore = answers.length > 0 ? analyzeConsistency(answers) : 70;

    // Count total red flags
    const totalRedFlags = qaPairs.reduce((sum, qa) => {
        const authScore = qa.authenticity || qa.authenticityScore || { redFlags: [] };
        return sum + (authScore.redFlags?.length || 0);
    }, 0);

    // Adjust score based on consistency and red flags
    let finalScore = averageScore;
    finalScore = Math.round(finalScore * (consistencyScore / 100));
    finalScore = Math.max(finalScore - (totalRedFlags * 3), 20);

    // Determine assessment
    let assessment;
    let riskLevel;

    if (finalScore >= 75) {
        assessment = 'High authenticity - Answers show genuine personal experience';
        riskLevel = 'low';
    } else if (finalScore >= 55) {
        assessment = 'Moderate authenticity - Some answers may need verification';
        riskLevel = 'medium';
    } else {
        assessment = 'Low authenticity - Answers appear generic or rehearsed';
        riskLevel = 'high';
    }

    return {
        score: finalScore,
        averageScore,
        consistencyScore,
        totalRedFlags,
        assessment,
        riskLevel,
        confidence: Math.min(qaPairs.length * 15, 95),
    };
}

/**
 * Generate authenticity report for recruiter
 * @param {object} overallAuth - Overall authenticity assessment
 * @param {object[]} qaPairs - Question-answer pairs
 * @returns {object} - Detailed report
 */
export function generateAuthenticityReport(overallAuth, qaPairs) {
    if (!qaPairs || qaPairs.length === 0) {
        return {
            summary: { score: 50, riskLevel: 'medium', assessment: 'No data available' },
            details: { totalQuestions: 0, concerningCount: 0, strongCount: 0, consistencyScore: 70 },
            concerningAnswers: [],
            strongAnswers: [],
            recommendation: 'Unable to assess - no data provided.',
        };
    }

    const getAuthScore = (qa) => qa.authenticity || qa.authenticityScore || { score: 50, redFlags: [] };

    const concerningAnswers = qaPairs.filter(qa => {
        const auth = getAuthScore(qa);
        return (auth.score || 50) < 50 || (auth.redFlags?.length || 0) > 1;
    });

    const strongAnswers = qaPairs.filter(qa => {
        const auth = getAuthScore(qa);
        return (auth.score || 50) >= 70 && (auth.redFlags?.length || 0) === 0;
    });

    return {
        summary: {
            score: overallAuth?.score || 50,
            riskLevel: overallAuth?.riskLevel || 'medium',
            assessment: overallAuth?.assessment || 'Assessment pending',
        },
        details: {
            totalQuestions: qaPairs.length,
            concerningCount: concerningAnswers.length,
            strongCount: strongAnswers.length,
            consistencyScore: overallAuth?.consistencyScore || 70,
        },
        concerningAnswers: concerningAnswers.map(qa => {
            const auth = getAuthScore(qa);
            return {
                question: qa.question?.text || 'Unknown',
                skill: qa.question?.skill || 'general',
                score: auth.score || 50,
                redFlags: auth.redFlags || [],
            };
        }),
        strongAnswers: strongAnswers.map(qa => {
            const auth = getAuthScore(qa);
            return {
                question: qa.question?.text || 'Unknown',
                skill: qa.question?.skill || 'general',
                score: auth.score || 50,
            };
        }),
        recommendation: generateAuthRecommendation(overallAuth, concerningAnswers),
    };
}

/**
 * Generate recommendation based on authenticity analysis
 */
function generateAuthRecommendation(overallAuth, concerningAnswers) {
    if (overallAuth.riskLevel === 'low') {
        return 'Authenticity appears genuine. Proceed with confidence.';
    } else if (overallAuth.riskLevel === 'medium') {
        return `Consider follow-up on ${concerningAnswers.length} answer(s) in next round.`;
    } else {
        return 'High authenticity risk. Recommend additional screening or verification.';
    }
}

export default {
    scoreAnswerAuthenticity,
    identifyRedFlags,
    calculateOverallAuthenticity,
    generateAuthenticityReport,
};
