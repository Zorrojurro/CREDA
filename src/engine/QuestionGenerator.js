// Question Generator Engine - Creates experience-based, anti-cheat questions
import { QUESTION_TEMPLATES, SKILL_CATEGORIES } from '../utils/constants';

// Fallback questions when no specific skills are found - personal and experience-based
const GENERIC_QUESTIONS = [
    { text: "Tell me about the last project you shipped to production. What was your specific role and what did YOU build?", type: 'experience', priority: 'high' },
    { text: "Describe a bug that took you hours to fix. Walk me through your debugging process step by step.", type: 'failure', priority: 'high' },
    { text: "What's a piece of code you're proud of? Why did you write it that way?", type: 'depth', priority: 'medium' },
    { text: "Tell me about a time your code caused a problem in production. What happened and how did you fix it?", type: 'failure', priority: 'high' },
    { text: "What's a technical decision you made that you later regretted? What would you do differently?", type: 'experience', priority: 'medium' },
    { text: "Describe your workflow when starting a new feature. What tools do you use?", type: 'depth', priority: 'medium' },
    { text: "Tell me about a time you had to push back on a technical requirement. What was the situation?", type: 'collaboration', priority: 'medium' },
    { text: "What's the hardest code review feedback you've received? How did you respond?", type: 'collaboration', priority: 'low' },
];


/**
 * Generate interview questions based on skill mapping
 * @param {object} skillMapping - The skill mapping from SkillMapper
 * @param {object[]} focusSkills - Priority skills to focus on
 * @param {number} questionCount - Number of questions to generate
 * @returns {object[]} - Array of generated questions
 */
export function generateInterviewQuestions(skillMapping, focusSkills, questionCount = 5) {
    const questions = [];
    const usedSkills = new Set();
    const usedQuestionTexts = new Set(); // Prevent duplicate questions

    // Question distribution
    const distribution = {
        experience: Math.ceil(questionCount * 0.4),
        depth: Math.ceil(questionCount * 0.3),
        failure: Math.ceil(questionCount * 0.2),
        collaboration: questionCount - Math.ceil(questionCount * 0.4) -
            Math.ceil(questionCount * 0.3) - Math.ceil(questionCount * 0.2),
    };

    // Prioritize focus skills
    focusSkills.forEach(focus => {
        if (questions.length >= questionCount) return;
        if (usedSkills.has(focus.skill)) return;

        const questionType = focus.priority === 'high' ? 'experience' : 'depth';
        let template = getRandomTemplate(questionType);
        let text = formatQuestion(template, focus.skill);

        // Ensure unique question text
        let attempts = 0;
        while (usedQuestionTexts.has(text) && attempts < 5) {
            template = getRandomTemplate(questionType);
            text = formatQuestion(template, focus.skill);
            attempts++;
        }

        if (!usedQuestionTexts.has(text)) {
            usedQuestionTexts.add(text);
            questions.push({
                id: `q-${questions.length + 1}`,
                skill: focus.skill,
                type: questionType,
                priority: focus.priority,
                text,
                reason: focus.reason,
                followUpTriggered: false,
            });
            usedSkills.add(focus.skill);
        }
    });

    // Fill remaining with strong skills (validation)
    (skillMapping.strong || [])
        .filter(s => s.importance === 'required' && !usedSkills.has(s.skill))
        .forEach(skill => {
            if (questions.length >= questionCount) return;

            const type = getBalancedType(questions, distribution);
            let template = getRandomTemplate(type);
            let text = formatQuestion(template, skill.skill);

            // Ensure unique question text
            let attempts = 0;
            while (usedQuestionTexts.has(text) && attempts < 5) {
                template = getRandomTemplate(type);
                text = formatQuestion(template, skill.skill);
                attempts++;
            }

            if (!usedQuestionTexts.has(text)) {
                usedQuestionTexts.add(text);
                questions.push({
                    id: `q-${questions.length + 1}`,
                    skill: skill.skill,
                    type: type,
                    priority: 'medium',
                    text,
                    reason: 'Validating claimed expertise',
                    followUpTriggered: false,
                });
                usedSkills.add(skill.skill);
            }
        });

    // Add failure/challenge questions for depth
    if (questions.length < questionCount) {
        const allSkills = [...(skillMapping.strong || []), ...(skillMapping.weak || [])];
        allSkills
            .filter(s => !usedSkills.has(s.skill))
            .slice(0, questionCount - questions.length)
            .forEach(skill => {
                if (questions.length >= questionCount) return;

                let template = getRandomTemplate('failure');
                let text = formatQuestion(template, skill.skill);

                // Ensure unique question text
                if (!usedQuestionTexts.has(text)) {
                    usedQuestionTexts.add(text);
                    questions.push({
                        id: `q-${questions.length + 1}`,
                        skill: skill.skill,
                        type: 'failure',
                        priority: 'low',
                        text,
                        reason: 'Testing problem-solving experience',
                        followUpTriggered: false,
                    });
                }
            });
    }

    // FALLBACK: If still not enough questions, use generic questions
    if (questions.length < questionCount) {
        const shuffled = [...GENERIC_QUESTIONS].sort(() => Math.random() - 0.5);
        shuffled.forEach(gq => {
            if (questions.length >= questionCount) return;
            if (usedQuestionTexts.has(gq.text)) return;

            usedQuestionTexts.add(gq.text);
            questions.push({
                id: `q-${questions.length + 1}`,
                skill: 'general',
                type: gq.type,
                priority: 'medium',
                text: gq.text,
                reason: 'General assessment question',
                followUpTriggered: false,
            });
        });
    }

    // Shuffle questions slightly but keep high priority first
    return sortByPriority(questions);
}

/**
 * Get a random question template of given type
 */
function getRandomTemplate(type) {
    const templates = QUESTION_TEMPLATES[type] || QUESTION_TEMPLATES.experience;
    return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Format question template with skill
 */
function formatQuestion(template, skill) {
    return template.replace(/{skill}/g, skill);
}

/**
 * Get balanced question type based on current distribution
 */
function getBalancedType(questions, distribution) {
    const counts = {
        experience: questions.filter(q => q.type === 'experience').length,
        depth: questions.filter(q => q.type === 'depth').length,
        failure: questions.filter(q => q.type === 'failure').length,
        collaboration: questions.filter(q => q.type === 'collaboration').length,
    };

    // Find type that needs more questions
    for (const [type, target] of Object.entries(distribution)) {
        if (counts[type] < target) {
            return type;
        }
    }

    return 'experience';
}

/**
 * Sort questions by priority
 */
function sortByPriority(questions) {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return questions.sort((a, b) =>
        priorityOrder[a.priority] - priorityOrder[b.priority]
    );
}

/**
 * Generate an opening/warm-up question
 * @param {object} jobDescription - The job description
 * @returns {object} - Opening question
 */
export function generateOpeningQuestion(_jobDescription) {
    const templates = [
        `Let's start with something you know best. Tell me about a recent project where you wrote code you're really proud of. What did you build?`,
        `I'd love to hear about your most challenging technical project so far. Walk me through what made it tough and how you handled it.`,
        `Tell me about a time you had to figure something out without much guidance. What was the problem and how did you solve it?`,
    ];

    return {
        id: 'q-opening',
        type: 'opening',
        priority: 'high',
        text: templates[Math.floor(Math.random() * templates.length)],
        reason: 'Warm-up and general assessment',
        skill: 'general',
        followUpTriggered: false,
    };
}

/**
 * Generate a closing question
 * @returns {object} - Closing question
 */
export function generateClosingQuestion() {
    const templates = [
        "Before we wrap up - is there something about your experience that we didn't cover that you think is important?",
        "Last question: What's something you've learned recently that changed how you approach coding?",
        "We're almost done. What would your ideal tech stack look like for a new project and why?",
    ];

    return {
        id: 'q-closing',
        type: 'closing',
        priority: 'low',
        text: templates[Math.floor(Math.random() * templates.length)],
        reason: 'Closing and final assessment',
        skill: 'general',
        followUpTriggered: false,
    };
}

/**
 * Check if a question is anti-cheat (not easily Googleable)
 * @param {string} questionText - The question text
 * @returns {boolean} - True if anti-cheat
 */
export function isAntiCheatQuestion(questionText) {
    const textLower = questionText.toLowerCase();

    // Red flags - definitions or textbook questions
    const badPatterns = [
        'what is',
        'define',
        'explain the concept',
        'what are the advantages',
        'what are the disadvantages',
        'what is the difference between',
        'list the',
        'name the',
        'how does * work',
    ];

    for (const pattern of badPatterns) {
        if (textLower.includes(pattern.replace('*', ''))) {
            return false;
        }
    }

    // Good indicators - experience-based
    const goodPatterns = [
        'describe a time',
        'tell me about',
        'walk me through',
        'what was your',
        'how did you',
        'what went wrong',
        'what would you change',
        'what did you learn',
    ];

    for (const pattern of goodPatterns) {
        if (textLower.includes(pattern)) {
            return true;
        }
    }

    return true; // Default to true for custom questions
}

export default {
    generateInterviewQuestions,
    generateOpeningQuestion,
    generateClosingQuestion,
    isAntiCheatQuestion,
};
