// Follow-Up Engine - Adaptive follow-up logic for generic answers
import { FOLLOWUP_TEMPLATES } from '../utils/constants';
import { detectGenericPatterns, calculateSpecificityScore, countFirstPersonIndicators } from '../utils/textAnalysis';

/**
 * Analyze if a follow-up question is needed
 * @param {string} answer - The candidate's answer
 * @param {object} question - The original question
 * @returns {object} - Analysis result with follow-up recommendation
 */
export function analyzeNeedForFollowUp(answer, _question) {
    const { isGeneric, genericScore } = detectGenericPatterns(answer);
    const specificityScore = calculateSpecificityScore(answer);
    const firstPersonCount = countFirstPersonIndicators(answer);

    const analysis = {
        needsFollowUp: false,
        reason: null,
        followUpType: null,
        confidence: 0,
        metrics: {
            isGeneric,
            genericScore,
            specificityScore,
            firstPersonCount,
            answerLength: answer.length,
        },
    };

    // Check for various triggers
    if (isGeneric && genericScore > 30) {
        analysis.needsFollowUp = true;
        analysis.reason = 'Answer contains generic patterns';
        analysis.followUpType = 'specificity';
        analysis.confidence = 85;
    } else if (specificityScore < 30) {
        analysis.needsFollowUp = true;
        analysis.reason = 'Answer lacks specific details';
        analysis.followUpType = 'specificity';
        analysis.confidence = 80;
    } else if (firstPersonCount < 2 && answer.length > 100) {
        analysis.needsFollowUp = true;
        analysis.reason = 'Answer lacks personal context';
        analysis.followUpType = 'depth';
        analysis.confidence = 70;
    } else if (answer.length < 75) {
        analysis.needsFollowUp = true;
        analysis.reason = 'Answer is too brief';
        analysis.followUpType = 'depth';
        analysis.confidence = 75;
    }

    // Check if answer is suspiciously perfect
    const perfectIndicators = [
        'seamlessly', 'flawlessly', 'perfectly', 'without any issues',
        'everything worked', 'no problems', 'exactly as planned'
    ];

    const hasPerfectLanguage = perfectIndicators.some(p =>
        answer.toLowerCase().includes(p)
    );

    if (hasPerfectLanguage) {
        analysis.needsFollowUp = true;
        analysis.reason = 'Answer is suspiciously perfect';
        analysis.followUpType = 'consistency';
        analysis.confidence = 90;
    }

    return analysis;
}

/**
 * Extract key topics/phrases from the candidate's answer
 * @param {string} answer - The candidate's answer
 * @returns {string[]} - Array of key topics found
 */
function extractKeyTopics(answer) {
    const topics = [];

    // Common topic patterns to look for
    const businessTopics = [
        'sales', 'marketing', 'B2B', 'B2C', 'startup', 'revenue', 'growth',
        'customer', 'client', 'strategy', 'analytics', 'statistics', 'data',
        'team', 'leadership', 'management', 'project', 'campaign', 'budget',
        'partnership', 'negotiation', 'presentation', 'communication'
    ];

    const technicalTopics = [
        'coding', 'programming', 'development', 'debugging', 'testing',
        'deployment', 'architecture', 'database', 'API', 'frontend', 'backend',
        'optimization', 'performance', 'security', 'integration'
    ];

    const allTopics = [...businessTopics, ...technicalTopics];
    const lowerAnswer = answer.toLowerCase();

    // Find matching topics
    for (const topic of allTopics) {
        if (lowerAnswer.includes(topic.toLowerCase())) {
            topics.push(topic);
        }
    }

    // Also extract specific phrases that might be relevant
    const phrases = [];

    // Look for "worked for/at/with X" patterns
    const workPatterns = [
        /worked (?:for|at|with) (?:a |an |my |the )?([^,.]+?)(?:,|\.|$)/gi,
        /(?:my |a |the )?friend'?s? (\w+ ?\w*)/gi,
        /helped (?:me |us )?(?:understand |learn |with )?([^,.]+?)(?:,|\.|$)/gi,
    ];

    for (const pattern of workPatterns) {
        const matches = answer.matchAll(pattern);
        for (const match of matches) {
            if (match[1] && match[1].trim().length > 2 && match[1].trim().length < 30) {
                phrases.push(match[1].trim());
            }
        }
    }

    return [...topics.slice(0, 3), ...phrases.slice(0, 2)];
}

/**
 * Generate a follow-up question based on analysis
 * @param {object} analysis - The follow-up analysis
 * @param {object} originalQuestion - The original question
 * @param {string} answer - The candidate's answer
 * @returns {object} - The follow-up question
 */
export function generateFollowUpQuestion(analysis, originalQuestion, answer) {
    const { followUpType, reason } = analysis;

    let templates;
    let question;

    // Extract key topics from the answer for contextual follow-ups
    const keyTopics = extractKeyTopics(answer);
    const hasMeaningfulTopics = keyTopics.length > 0;

    // Prioritize contextual follow-ups when we have good topics
    if (hasMeaningfulTopics && FOLLOWUP_TEMPLATES.contextual) {
        templates = FOLLOWUP_TEMPLATES.contextual;
        question = templates[Math.floor(Math.random() * templates.length)];
        // Replace {topic} with the most relevant extracted topic
        const selectedTopic = keyTopics[0];
        question = question.replace(/{topic}/g, selectedTopic);
    } else {
        switch (followUpType) {
            case 'specificity':
                templates = FOLLOWUP_TEMPLATES.specificity;
                question = templates[Math.floor(Math.random() * templates.length)];
                break;

            case 'depth':
                templates = FOLLOWUP_TEMPLATES.depth;
                question = templates[Math.floor(Math.random() * templates.length)];
                break;

            case 'consistency':
                templates = FOLLOWUP_TEMPLATES.consistency;
                question = templates[Math.floor(Math.random() * templates.length)];
                break;

            default:
                question = "Could you share more specific details about that experience?";
        }
    }

    // Replace placeholders
    question = question.replace(/{skill}/g, originalQuestion.skill || 'this skill');

    // Extract a detail from the answer to reference
    const detail = extractDetailFromAnswer(answer);
    if (detail) {
        question = question.replace(/{detail}/g, detail);
    }

    // Clean up any remaining unreplaced placeholders
    question = question.replace(/{topic}/g, 'that');
    question = question.replace(/{detail}/g, 'that point');

    return {
        id: `${originalQuestion.id}-followup`,
        type: 'followup',
        parentQuestionId: originalQuestion.id,
        text: question,
        reason: reason,
        skill: originalQuestion.skill,
        followUpType: followUpType,
    };
}

/**
 * Extract a specific detail from an answer to reference in follow-up
 */
function extractDetailFromAnswer(answer) {
    // Look for quoted text or specific terms
    const words = answer.split(' ');
    const technicalWords = words.filter(w => {
        const lower = w.toLowerCase().replace(/[.,!?]/g, '');
        return lower.length > 4 &&
            !['about', 'which', 'their', 'would', 'could', 'should', 'there'].includes(lower);
    });

    if (technicalWords.length > 0) {
        // Return a phrase around a technical word
        const idx = words.indexOf(technicalWords[0]);
        const start = Math.max(0, idx - 2);
        const end = Math.min(words.length, idx + 3);
        return words.slice(start, end).join(' ').replace(/[.,!?]/g, '');
    }

    return null;
}

/**
 * Determine maximum follow-ups allowed per question
 * @param {object} question - The question
 * @returns {number} - Maximum follow-ups
 */
export function getMaxFollowUps(question) {
    switch (question.priority) {
        case 'high':
            return 2;
        case 'medium':
            return 1;
        default:
            return 1;
    }
}

/**
 * Track follow-up history for a question
 */
export class FollowUpTracker {
    constructor() {
        this.history = new Map();
    }

    addFollowUp(questionId, followUp) {
        if (!this.history.has(questionId)) {
            this.history.set(questionId, []);
        }
        this.history.get(questionId).push(followUp);
    }

    getFollowUpCount(questionId) {
        return this.history.get(questionId)?.length || 0;
    }

    canAskMoreFollowUps(questionId, maxAllowed) {
        return this.getFollowUpCount(questionId) < maxAllowed;
    }

    getAllFollowUps() {
        const all = [];
        this.history.forEach((followUps, questionId) => {
            followUps.forEach(f => all.push({ questionId, ...f }));
        });
        return all;
    }
}

/**
 * Create adaptive probing strategy
 * @param {object[]} previousAnswers - Previous Q&A pairs
 * @returns {object} - Probing strategy
 */
export function createProbingStrategy(previousAnswers) {
    // Analyze patterns across answers
    const avgSpecificity = previousAnswers.reduce((sum, qa) => {
        return sum + calculateSpecificityScore(qa.answer);
    }, 0) / previousAnswers.length;

    const avgGenericScore = previousAnswers.reduce((sum, qa) => {
        return sum + detectGenericPatterns(qa.answer).genericScore;
    }, 0) / previousAnswers.length;

    return {
        shouldBeAggressive: avgGenericScore > 40,
        focusAreas: avgSpecificity < 40 ? ['specificity', 'details'] : ['depth', 'reasoning'],
        recommendation: avgGenericScore > 50
            ? 'Increase probing intensity - answers appear generic'
            : 'Standard probing - answers show reasonable detail',
    };
}

export default {
    analyzeNeedForFollowUp,
    generateFollowUpQuestion,
    getMaxFollowUps,
    FollowUpTracker,
    createProbingStrategy,
};
