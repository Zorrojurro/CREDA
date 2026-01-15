// Text analysis utilities for authenticity detection

/**
 * Count first-person indicators in text
 * @param {string} text - The text to analyze
 * @returns {number} - Count of first-person indicators
 */
export function countFirstPersonIndicators(text) {
    const firstPersonPatterns = /\b(I|my|me|we|our|us|myself|ourselves)\b/gi;
    const matches = text.match(firstPersonPatterns);
    return matches ? matches.length : 0;
}

/**
 * Calculate specificity score based on concrete details
 * @param {string} text - The text to analyze
 * @returns {number} - Specificity score (0-100)
 */
export function calculateSpecificityScore(text) {
    let score = 0;
    const textLower = text.toLowerCase();

    // Check for specific technical terms
    const technicalPatterns = [
        /error:\s*[^\s]+/i,           // error messages
        /version\s*\d+\.\d+/i,        // version numbers
        /\d+\s*(ms|seconds|minutes)/i, // time measurements
        /\d+%/i,                       // percentages
        /\b(bug|issue|ticket)\s*#?\d+/i, // issue references
        /localhost:\d+/i,              // local server ports
        /https?:\/\/[^\s]+/i,          // URLs
        /\.(js|py|java|ts|css|html)/i, // file extensions
    ];

    technicalPatterns.forEach(pattern => {
        if (pattern.test(textLower)) {
            score += 12;
        }
    });

    // Check for specific tool/library names
    const toolMentions = [
        "npm", "pip", "docker", "git", "webpack", "vite", "babel", "eslint",
        "postman", "chrome devtools", "vs code", "intellij", "terminal", "console"
    ];

    toolMentions.forEach(tool => {
        if (textLower.includes(tool)) {
            score += 8;
        }
    });

    // Longer, detailed answers get bonus
    if (text.length > 200) score += 10;
    if (text.length > 400) score += 10;

    return Math.min(score, 100);
}

/**
 * Detect generic/textbook patterns in text
 * @param {string} text - The text to analyze
 * @returns {object} - { isGeneric: boolean, patterns: string[] }
 */
export function detectGenericPatterns(text) {
    const textLower = text.toLowerCase();
    const foundPatterns = [];

    const genericPhrases = [
        "in general",
        "typically",
        "usually",
        "best practice",
        "standard approach",
        "most developers",
        "it depends",
        "is defined as",
        "refers to",
        "allows developers",
        "is used for",
        "is a technique",
        "is a method",
        "helps in",
        "enables",
        "facilitates",
    ];

    genericPhrases.forEach(phrase => {
        if (textLower.includes(phrase)) {
            foundPatterns.push(phrase);
        }
    });

    // Check for overly polished language
    const polishedPhrases = [
        "seamlessly",
        "flawlessly",
        "perfectly",
        "without any issues",
        "worked as expected",
        "no problems",
        "everything went smoothly",
    ];

    polishedPhrases.forEach(phrase => {
        if (textLower.includes(phrase)) {
            foundPatterns.push(phrase);
        }
    });

    return {
        isGeneric: foundPatterns.length >= 2,
        patterns: foundPatterns,
        genericScore: Math.min(foundPatterns.length * 15, 100),
    };
}

/**
 * Check for imperfect/realistic narrative
 * @param {string} text - The text to analyze
 * @returns {number} - Imperfection score (0-100)
 */
export function calculateImperfectionScore(text) {
    const textLower = text.toLowerCase();
    let score = 0;

    // Positive indicators - admits mistakes, confusion, learning
    const positiveIndicators = [
        "mistake",
        "error",
        "wrong",
        "confused",
        "struggle",
        "difficult",
        "challenge",
        "learned",
        "realized",
        "should have",
        "could have",
        "in hindsight",
        "looking back",
        "at first",
        "initially",
        "didn't know",
        "wasn't aware",
        "took time",
        "failed",
        "broke",
        "crashed",
    ];

    positiveIndicators.forEach(indicator => {
        if (textLower.includes(indicator)) {
            score += 12;
        }
    });

    return Math.min(score, 100);
}

/**
 * Calculate overall authenticity score
 * @param {string} text - The text to analyze
 * @returns {object} - Detailed authenticity analysis
 */
export function calculateAuthenticityScore(text) {
    const firstPersonCount = countFirstPersonIndicators(text);
    const specificityScore = calculateSpecificityScore(text);
    const { isGeneric, patterns, genericScore } = detectGenericPatterns(text);
    const imperfectionScore = calculateImperfectionScore(text);

    // Calculate individual component scores
    const personalContextScore = Math.min(firstPersonCount * 10, 100);
    const naturalLanguageScore = 100 - genericScore;

    // Weighted average
    const weights = {
        personalContext: 0.25,
        specificDetails: 0.25,
        imperfectNarrative: 0.20,
        naturalLanguage: 0.20,
        depthConsistency: 0.10, // This would need multiple answers to calculate
    };

    const overallScore = Math.round(
        personalContextScore * weights.personalContext +
        specificityScore * weights.specificDetails +
        imperfectionScore * weights.imperfectNarrative +
        naturalLanguageScore * weights.naturalLanguage +
        50 * weights.depthConsistency // Default to neutral
    );

    return {
        overall: Math.min(Math.max(overallScore, 0), 100),
        breakdown: {
            personalContext: personalContextScore,
            specificDetails: specificityScore,
            imperfectNarrative: imperfectionScore,
            naturalLanguage: naturalLanguageScore,
        },
        flags: {
            isGeneric,
            genericPatterns: patterns,
            firstPersonCount,
            textLength: text.length,
        },
    };
}

/**
 * Analyze multiple answers for consistency
 * @param {string[]} answers - Array of answer texts
 * @returns {number} - Consistency score (0-100)
 */
export function analyzeConsistency(answers) {
    if (answers.length < 2) return 50;

    // Calculate average detail level
    const detailLevels = answers.map(a => calculateSpecificityScore(a));
    const avgDetail = detailLevels.reduce((a, b) => a + b, 0) / detailLevels.length;

    // Calculate variance
    const variance = detailLevels.reduce((sum, level) => {
        return sum + Math.pow(level - avgDetail, 2);
    }, 0) / detailLevels.length;

    // Lower variance = higher consistency
    const consistencyScore = 100 - Math.min(Math.sqrt(variance) * 2, 50);

    return Math.round(consistencyScore);
}

/**
 * Extract key topics from text
 * @param {string} text - The text to analyze
 * @returns {string[]} - Array of extracted topics
 */
export function extractTopics(text) {
    const textLower = text.toLowerCase();
    const topics = [];

    // Common technologies and concepts
    const techKeywords = [
        "api", "database", "frontend", "backend", "server", "client",
        "authentication", "authorization", "testing", "deployment",
        "debugging", "optimization", "refactoring", "architecture",
        "performance", "security", "scalability", "cache", "queue",
    ];

    techKeywords.forEach(keyword => {
        if (textLower.includes(keyword)) {
            topics.push(keyword);
        }
    });

    return [...new Set(topics)];
}
