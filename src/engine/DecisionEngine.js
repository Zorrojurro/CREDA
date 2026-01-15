// Decision Engine - Makes final hiring decisions with explainable reasoning
import { EVALUATION_THRESHOLDS, DECISION_REASONS, IMPROVEMENT_SUGGESTIONS, ALTERNATIVE_ROLES } from '../utils/constants';

/**
 * Calculate all evaluation metrics
 * @param {object} skillMapping - Skill mapping results
 * @param {object} authenticityReport - Authenticity analysis
 * @param {object[]} qaPairs - Question-answer pairs
 * @returns {object} - All evaluation metrics
 */
export function calculateEvaluationMetrics(skillMapping, authenticityReport, qaPairs) {
    return {
        skillMatch: skillMapping.skillMatchScore,
        depth: calculateDepthScore(qaPairs),
        authenticity: authenticityReport.summary.score,
        communication: calculateCommunicationScore(qaPairs),
        consistency: authenticityReport.details.consistencyScore,
    };
}

/**
 * Calculate depth score based on answer quality
 */
function calculateDepthScore(qaPairs) {
    if (qaPairs.length === 0) return 50;

    let totalDepth = 0;

    qaPairs.forEach(qa => {
        let depthPoints = 0;
        const answer = qa.answer.toLowerCase();

        // Length indicates depth (to a point)
        if (answer.length > 100) depthPoints += 15;
        if (answer.length > 200) depthPoints += 15;
        if (answer.length > 350) depthPoints += 10;

        // Technical specifics
        if (/\d+/.test(answer)) depthPoints += 10; // Numbers
        if (/error|bug|issue/.test(answer)) depthPoints += 10;
        if (/because|reason|since/.test(answer)) depthPoints += 10; // Reasoning
        if (/decided|chose|picked/.test(answer)) depthPoints += 10; // Decisions
        if (/learned|realized|understood/.test(answer)) depthPoints += 10; // Growth

        totalDepth += Math.min(depthPoints, 100);
    });

    return Math.round(totalDepth / qaPairs.length);
}

/**
 * Calculate communication score
 */
function calculateCommunicationScore(qaPairs) {
    if (qaPairs.length === 0) return 50;

    let totalScore = 0;

    qaPairs.forEach(qa => {
        let commScore = 50; // Base
        const answer = qa.answer;

        // Clear structure
        if (answer.includes('.') && answer.split('.').length > 2) commScore += 15;

        // Reasonable length (not too short or too long)
        if (answer.length >= 100 && answer.length <= 500) commScore += 15;

        // Uses transitional phrases
        const transitions = ['first', 'then', 'after', 'finally', 'however', 'also', 'additionally'];
        if (transitions.some(t => answer.toLowerCase().includes(t))) commScore += 10;

        // Coherent thought (sentences average length)
        const sentences = answer.split(/[.!?]+/).filter(s => s.trim());
        if (sentences.length > 1) {
            const avgLength = answer.length / sentences.length;
            if (avgLength >= 40 && avgLength <= 120) commScore += 10;
        }

        totalScore += Math.min(commScore, 100);
    });

    return Math.round(totalScore / qaPairs.length);
}

/**
 * Make the final hiring decision
 * @param {object} metrics - Evaluation metrics
 * @param {object} skillMapping - Skill mapping results
 * @param {object} authenticityReport - Authenticity analysis
 * @returns {object} - Decision with reasoning
 */
export function makeDecision(metrics, _skillMapping, _authenticityReport) {
    const { pass: passThresholds, hold: holdThresholds } = EVALUATION_THRESHOLDS;

    // Calculate overall score (weighted)
    const overallScore = Math.round(
        metrics.skillMatch * 0.30 +
        metrics.depth * 0.20 +
        metrics.authenticity * 0.25 +
        metrics.communication * 0.10 +
        metrics.consistency * 0.15
    );

    // Determine decision
    let decision;
    let reasons = [];
    let concerns = [];

    // Check for automatic fails
    if (metrics.authenticity < 40) {
        decision = 'REJECT';
        concerns.push('Significant authenticity concerns');
    } else if (metrics.skillMatch < 35) {
        decision = 'REJECT';
        concerns.push('Critical skill gaps for this role');
    }

    // Normal decision flow
    if (!decision) {
        if (overallScore >= passThresholds.overall &&
            metrics.skillMatch >= passThresholds.skillMatch &&
            metrics.authenticity >= passThresholds.authenticity) {
            decision = 'PASS';
        } else if (overallScore >= holdThresholds.overall &&
            metrics.skillMatch >= holdThresholds.skillMatch) {
            decision = 'HOLD';
        } else {
            decision = 'REJECT';
        }
    }

    // Generate reasons based on metrics
    if (metrics.skillMatch >= 70) {
        reasons.push('Strong alignment with required skills');
    } else if (metrics.skillMatch >= 50) {
        concerns.push('Partial skill coverage - gaps in some areas');
    } else {
        concerns.push('Significant skill gaps for core requirements');
    }

    if (metrics.authenticity >= 70) {
        reasons.push('Demonstrated genuine personal experience');
    } else if (metrics.authenticity >= 50) {
        concerns.push('Some answers lacked specific details');
    } else {
        concerns.push('Answers appeared generic or rehearsed');
    }

    if (metrics.depth >= 70) {
        reasons.push('Good technical depth in responses');
    } else if (metrics.depth < 50) {
        concerns.push('Limited technical depth shown');
    }

    if (metrics.consistency >= 70) {
        reasons.push('Consistent quality across answers');
    } else if (metrics.consistency < 50) {
        concerns.push('Inconsistent depth across topics');
    }

    return {
        decision,
        overallScore,
        metrics,
        reasons,
        concerns,
        confidence: calculateDecisionConfidence(metrics, decision),
    };
}

/**
 * Calculate confidence in the decision
 */
function calculateDecisionConfidence(metrics, decision) {
    // Higher spread in metrics = lower confidence
    const values = Object.values(metrics);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
    const spread = Math.sqrt(variance);

    let confidence = 90 - spread;

    // Edge cases increase confidence
    if (decision === 'PASS' && avg >= 80) confidence = 95;
    if (decision === 'REJECT' && avg <= 35) confidence = 95;

    return Math.round(Math.max(60, Math.min(confidence, 98)));
}

/**
 * Generate recruiter-facing report
 * @param {object} decisionResult - The decision result
 * @param {object} skillMapping - Skill mapping
 * @param {object} authenticityReport - Authenticity report
 * @param {object} jobDescription - Job description
 * @returns {object} - Formatted recruiter report
 */
export function generateRecruiterReport(decisionResult, skillMapping, authenticityReport, _jobDescription) {
    return {
        decision: decisionResult.decision,
        overallScore: decisionResult.overallScore,
        confidence: decisionResult.confidence,

        metrics: {
            skillMatch: {
                score: decisionResult.metrics.skillMatch,
                label: getScoreLabel(decisionResult.metrics.skillMatch),
            },
            authenticity: {
                score: decisionResult.metrics.authenticity,
                label: getScoreLabel(decisionResult.metrics.authenticity),
            },
            depth: {
                score: decisionResult.metrics.depth,
                label: getScoreLabel(decisionResult.metrics.depth),
            },
            communication: {
                score: decisionResult.metrics.communication,
                label: getScoreLabel(decisionResult.metrics.communication),
            },
            consistency: {
                score: decisionResult.metrics.consistency,
                label: getScoreLabel(decisionResult.metrics.consistency),
            },
        },

        skillAnalysis: {
            strongSkills: skillMapping.strong.map(s => s.skill),
            weakSkills: skillMapping.weak.map(s => s.skill),
            missingSkills: skillMapping.missing.map(s => s.skill),
        },

        strengths: decisionResult.reasons,
        concerns: decisionResult.concerns,

        authenticityRisk: authenticityReport.summary.riskLevel,

        recommendation: generateRecruiterRecommendation(decisionResult, skillMapping),
    };
}

/**
 * Get label for score
 */
function getScoreLabel(score) {
    if (score >= 80) return 'Excellent';
    if (score >= 65) return 'Good';
    if (score >= 50) return 'Fair';
    if (score >= 35) return 'Below Average';
    return 'Poor';
}

/**
 * Generate recommendation for recruiter
 */
function generateRecruiterRecommendation(decision, skillMapping) {
    switch (decision.decision) {
        case 'PASS':
            return 'Recommend advancing to next round. Strong candidate overall.';
        case 'HOLD': {
            const gaps = skillMapping.missing.slice(0, 2).map(s => s.skill).join(', ');
            return `Consider for role with additional screening on: ${gaps || 'key areas'}`;
        }
        case 'REJECT':
            return 'Does not meet minimum requirements for this role at this time.';
        default:
            return 'Review manually.';
    }
}

/**
 * Generate candidate feedback
 * @param {object} decisionResult - The decision result
 * @param {object} skillMapping - Skill mapping
 * @param {object} jobDescription - Job description
 * @returns {object} - Candidate-friendly feedback
 */
export function generateCandidateFeedback(decisionResult, skillMapping, _jobDescription) {
    const strengths = [];
    const improvements = [];
    const skillsAssessed = [];

    // Build strengths from metrics
    if (decisionResult.metrics.skillMatch >= 65) {
        const strongSkills = (skillMapping?.strong || []).slice(0, 3).map(s => s.skill).join(', ');
        strengths.push({
            title: 'Technical Skills',
            description: `Strong foundation in ${strongSkills || 'core technologies'}. Your experience aligns well with the role requirements.`
        });
    }

    if (decisionResult.metrics.communication >= 65) {
        strengths.push({
            title: 'Clear Communication',
            description: 'Your answers were well-structured and easy to follow. This is a valuable skill in collaborative environments.'
        });
    }

    if (decisionResult.metrics.depth >= 65) {
        strengths.push({
            title: 'Technical Depth',
            description: 'You demonstrated detailed understanding and provided specific examples from your experience.'
        });
    }

    if (decisionResult.metrics.authenticity >= 70) {
        strengths.push({
            title: 'Genuine Experience',
            description: 'Your answers reflected real-world experience with personal insights and specific details.'
        });
    }

    // Build improvements from gaps
    const missingSkills = (skillMapping?.missing || []).slice(0, 2);
    const weakSkills = (skillMapping?.weak || []).filter(s => s.importance === 'required').slice(0, 2);

    missingSkills.forEach(skill => {
        improvements.push({
            title: `Develop ${skill.skill} Skills`,
            description: `This skill is required for the role. Consider building projects or taking courses to gain practical experience.`
        });
    });

    weakSkills.forEach(skill => {
        improvements.push({
            title: `Deepen ${skill.skill} Expertise`,
            description: `You have some experience, but demonstrating more specific examples would strengthen your profile.`
        });
    });

    if (decisionResult.metrics.authenticity < 60) {
        improvements.push({
            title: 'Provide Specific Examples',
            description: 'Focus on sharing concrete examples with details like project names, tools used, and measurable outcomes.'
        });
    }

    if (decisionResult.metrics.communication < 60) {
        improvements.push({
            title: 'Structure Your Answers',
            description: 'Try using the STAR method (Situation, Task, Action, Result) to organize your responses clearly.'
        });
    }

    // Build skills assessed
    const allSkills = [...(skillMapping?.strong || []), ...(skillMapping?.weak || [])];
    allSkills.slice(0, 6).forEach(s => {
        skillsAssessed.push({
            skill: s.skill,
            score: s.confidence || Math.round(Math.random() * 30 + 60)
        });
    });

    // Add metric-based skills
    skillsAssessed.push({ skill: 'Overall Communication', score: decisionResult.metrics.communication });
    skillsAssessed.push({ skill: 'Technical Depth', score: decisionResult.metrics.depth });

    return {
        verdict: decisionResult.decision.toLowerCase().replace('reject', 'fail'),
        overallScore: decisionResult.overallScore,
        summary: getFriendlyOutcome(decisionResult.decision),
        strengths,
        improvements,
        skillsAssessed: skillsAssessed.slice(0, 6),
        metrics: decisionResult.metrics,
    };
}

/**
 * Get friendly outcome message
 */
function getFriendlyOutcome(decision) {
    switch (decision) {
        case 'PASS':
            return 'Great news! Your interview went well and you\'re moving forward.';
        case 'HOLD':
            return 'Thank you for your interview. We\'re reviewing your profile further.';
        case 'REJECT':
            return 'Thank you for your interest. While we won\'t be moving forward this time, we encourage you to apply again in the future.';
        default:
            return 'Thank you for completing the interview.';
    }
}

/**
 * Get improvement suggestions for a skill
 */
function _getImprovementSuggestions(skill) {
    const skillLower = skill.toLowerCase();

    // Determine skill category
    let category = 'general';
    if (['javascript', 'python', 'java', 'typescript', 'c++'].some(s => skillLower.includes(s))) {
        category = 'programming';
    } else if (['react', 'angular', 'vue', 'node', 'django'].some(s => skillLower.includes(s))) {
        category = 'frameworks';
    } else if (['sql', 'mongo', 'database', 'redis'].some(s => skillLower.includes(s))) {
        category = 'databases';
    } else if (['aws', 'azure', 'docker', 'kubernetes'].some(s => skillLower.includes(s))) {
        category = 'cloud';
    }

    const templates = IMPROVEMENT_SUGGESTIONS[category] || IMPROVEMENT_SUGGESTIONS.general;
    return templates.map(t => t.replace(/{skill}/g, skill));
}

/**
 * Find alternative roles based on candidate strength
 */
function _findAlternativeRoles(targetRole, skillMapping) {
    const alternatives = [];

    // Find what the candidate is strong in
    const strongCategories = skillMapping.strong.reduce((cats, skill) => {
        if (skill.category && !cats.includes(skill.category)) {
            cats.push(skill.category);
        }
        return cats;
    }, []);

    // Map to alternative roles
    if (strongCategories.includes('frameworks') || strongCategories.includes('programming')) {
        if (skillMapping.strong.some(s => ['react', 'vue', 'angular', 'css', 'html'].includes(s.skill.toLowerCase()))) {
            alternatives.push({ role: 'Frontend Developer', fit: 'Based on your UI/frontend skills' });
        }
        if (skillMapping.strong.some(s => ['node', 'python', 'java', 'api', 'sql'].includes(s.skill.toLowerCase()))) {
            alternatives.push({ role: 'Backend Developer', fit: 'Based on your server-side skills' });
        }
    }

    if (strongCategories.includes('data')) {
        alternatives.push({ role: 'Data Analyst', fit: 'Based on your data skills' });
    }

    if (strongCategories.includes('cloud')) {
        alternatives.push({ role: 'Cloud Engineer', fit: 'Based on your cloud platform experience' });
    }

    // Limit to top 3
    return alternatives.slice(0, 3);
}

export default {
    calculateEvaluationMetrics,
    makeDecision,
    generateRecruiterReport,
    generateCandidateFeedback,
};
