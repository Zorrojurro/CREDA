import { useState } from 'react';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import Card from './ui/Card';
import Button from './ui/Button';
import ScoreCircle from './ui/ScoreCircle';

/**
 * Candidate Feedback View Component
 * Shows ACTUAL interview results and feedback to candidates
 */
export default function CandidateFeedbackView({ feedback, onBack, onReset }) {
    const [activeTab, setActiveTab] = useState('performance');
    const [shareMessage, setShareMessage] = useState('');

    // Extract actual data from feedback prop
    const candidateName = feedback?.candidateName || 'Candidate';
    const role = feedback?.jobTitle || 'Position';
    const date = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
    const matchScore = feedback?.overallScore || 0;
    const verdict = feedback?.verdict || 'pending';
    const summary = feedback?.summary || '';

    // Get strengths from feedback
    const strengths = feedback?.strengths || [];
    const improvements = feedback?.improvements || [];
    const skillsAssessed = feedback?.skillsAssessed || [];

    // Generate summary based on verdict
    const getSummaryText = () => {
        const name = candidateName.split(' ')[0];
        if (verdict === 'pass') {
            return `${name} demonstrated strong performance across the interview. Answers showed genuine experience with specific examples and personal insights.`;
        } else if (verdict === 'hold') {
            return `${name} showed potential with some strong answers. Consider follow-up on areas that lacked specific examples or depth.`;
        } else {
            return `${name}'s responses would benefit from more specific examples and personal experience. Consider additional preparation.`;
        }
    };

    // Professional PDF generation
    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        let yPos = 20;

        // Helper function to add text with word wrap
        const addWrappedText = (text, x, y, maxWidth, lineHeight = 6) => {
            const lines = doc.splitTextToSize(text, maxWidth);
            doc.text(lines, x, y);
            return y + (lines.length * lineHeight);
        };

        // Header
        doc.setFillColor(17, 24, 39); // Dark background color
        doc.rect(0, 0, pageWidth, 45, 'F');

        doc.setTextColor(245, 197, 24); // Gold/Primary color
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('CREDA', 20, 25);

        doc.setTextColor(156, 163, 175); // Gray
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('AI-Powered Assessment Report', 20, 33);

        // Date on right
        doc.setTextColor(255, 255, 255);
        doc.text(date, pageWidth - 20, 25, { align: 'right' });

        yPos = 55;

        // Candidate Info Section
        doc.setTextColor(17, 24, 39);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Candidate Assessment', 20, yPos);
        yPos += 12;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(75, 85, 99);
        doc.text(`Candidate: ${candidateName}`, 20, yPos);
        yPos += 7;
        doc.text(`Position: ${role}`, 20, yPos);
        yPos += 7;
        doc.text(`Date: ${date}`, 20, yPos);
        yPos += 15;

        // Score Box
        const verdictColors = {
            pass: [16, 185, 129], // Green
            hold: [245, 158, 11], // Yellow/Orange
            fail: [239, 68, 68]  // Red
        };
        const verdictLabels = {
            pass: 'RECOMMENDED',
            hold: 'NEEDS REVIEW',
            fail: 'NOT RECOMMENDED'
        };
        const [r, g, b] = verdictColors[verdict] || [156, 163, 175];

        doc.setFillColor(r, g, b);
        doc.roundedRect(20, yPos, pageWidth - 40, 35, 3, 3, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(32);
        doc.setFont('helvetica', 'bold');
        doc.text(`${matchScore}%`, 35, yPos + 23);

        doc.setFontSize(12);
        doc.text('Overall Score', 70, yPos + 15);
        doc.setFontSize(14);
        doc.text(verdictLabels[verdict] || 'PENDING', 70, yPos + 25);

        yPos += 45;

        // Summary
        doc.setTextColor(17, 24, 39);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Summary', 20, yPos);
        yPos += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(75, 85, 99);
        yPos = addWrappedText(getSummaryText(), 20, yPos, pageWidth - 40);
        yPos += 10;

        // Strengths Section
        if (strengths.length > 0) {
            doc.setTextColor(16, 185, 129);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('✓ Strengths', 20, yPos);
            yPos += 8;

            doc.setTextColor(55, 65, 81);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');

            strengths.forEach((s, i) => {
                if (yPos > 260) {
                    doc.addPage();
                    yPos = 20;
                }
                doc.setFont('helvetica', 'bold');
                doc.text(`${i + 1}. ${s.title}`, 25, yPos);
                yPos += 5;
                doc.setFont('helvetica', 'normal');
                yPos = addWrappedText(s.description, 25, yPos, pageWidth - 50);
                yPos += 5;
            });
            yPos += 5;
        }

        // Improvements Section
        if (improvements.length > 0) {
            if (yPos > 230) {
                doc.addPage();
                yPos = 20;
            }

            doc.setTextColor(245, 158, 11);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('↗ Areas for Improvement', 20, yPos);
            yPos += 8;

            doc.setTextColor(55, 65, 81);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');

            improvements.forEach((s, i) => {
                if (yPos > 260) {
                    doc.addPage();
                    yPos = 20;
                }
                doc.setFont('helvetica', 'bold');
                doc.text(`${i + 1}. ${s.title}`, 25, yPos);
                yPos += 5;
                doc.setFont('helvetica', 'normal');
                yPos = addWrappedText(s.description, 25, yPos, pageWidth - 50);
                yPos += 5;
            });
            yPos += 5;
        }

        // Skills Breakdown
        if (skillsAssessed.length > 0) {
            if (yPos > 200) {
                doc.addPage();
                yPos = 20;
            }

            doc.setTextColor(17, 24, 39);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Skills Assessment', 20, yPos);
            yPos += 10;

            skillsAssessed.forEach((skill) => {
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }

                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(55, 65, 81);
                doc.text(skill.skill, 25, yPos);
                doc.text(`${skill.score}%`, pageWidth - 35, yPos);

                // Progress bar background
                doc.setFillColor(229, 231, 235);
                doc.roundedRect(80, yPos - 4, 80, 5, 1, 1, 'F');

                // Progress bar fill
                const barColor = skill.score >= 70 ? [16, 185, 129] :
                    skill.score >= 50 ? [245, 158, 11] : [239, 68, 68];
                doc.setFillColor(...barColor);
                doc.roundedRect(80, yPos - 4, (skill.score / 100) * 80, 5, 1, 1, 'F');

                yPos += 12;
            });
        }

        // Footer
        const footerY = doc.internal.pageSize.getHeight() - 15;
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text('Generated by Creda AI • Confidential Assessment Report', pageWidth / 2, footerY, { align: 'center' });
        doc.text(new Date().toISOString(), pageWidth / 2, footerY + 5, { align: 'center' });

        // Save the PDF
        doc.save(`creda-assessment-${candidateName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
    };

    // Share functionality
    const handleShare = async () => {
        const shareData = {
            title: `Creda Assessment - ${candidateName}`,
            text: `I just completed my ${role} assessment with Creda AI and scored ${matchScore}%!`,
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                // User cancelled or error
                copyToClipboard();
            }
        } else {
            copyToClipboard();
        }
    };

    const copyToClipboard = () => {
        const text = `I completed my ${role} assessment with Creda AI and scored ${matchScore}%! 🎯`;
        navigator.clipboard.writeText(text);
        setShareMessage('Copied to clipboard!');
        setTimeout(() => setShareMessage(''), 2000);
    };

    const getVerdictStyle = () => {
        switch (verdict) {
            case 'pass': return { label: 'STRONG CANDIDATE', color: 'text-verified', bg: 'bg-verified/10' };
            case 'hold': return { label: 'POTENTIAL FIT', color: 'text-primary', bg: 'bg-primary/10' };
            default: return { label: 'NEEDS IMPROVEMENT', color: 'text-flagged', bg: 'bg-flagged/10' };
        }
    };

    const verdictStyle = getVerdictStyle();

    const tabs = [
        { id: 'performance', label: 'Performance' },
        { id: 'skills', label: 'Skills Breakdown' },
        { id: 'next', label: 'Next Steps' },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <header className="space-y-4">
                <div className="text-sm text-text-muted">
                    Assessment → Results
                </div>

                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-black text-white">Your Assessment Results</h1>
                        <p className="text-text-muted flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">person</span>
                                {candidateName}
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">work</span>
                                {role}
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">calendar_today</span>
                                {date}
                            </span>
                        </p>
                    </div>
                    <div className="flex gap-3 items-center">
                        {shareMessage && (
                            <span className="text-sm text-verified">{shareMessage}</span>
                        )}
                        <Button variant="secondary" icon="share" onClick={handleShare}>
                            Share
                        </Button>
                        <Button variant="primary" icon="download" onClick={handleDownloadPDF}>
                            Download Report
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Main Content */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Score Summary Card */}
                    <Card padding="lg" hover={false}>
                        <div className="flex items-start gap-6">
                            {/* Match Score Circle */}
                            <div className="text-center">
                                <ScoreCircle score={matchScore} size="lg" variant="auto" />
                                <p className="text-sm font-bold text-text-muted mt-2 uppercase">Overall</p>
                            </div>

                            {/* Summary */}
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${verdictStyle.bg} ${verdictStyle.color}`}>
                                        {verdictStyle.label}
                                    </span>
                                </div>
                                <p className="text-text-muted leading-relaxed">
                                    {getSummaryText()}
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Tabs */}
                    <div className="flex gap-2 border-b border-white/10">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-3 text-sm font-medium transition-colors relative ${activeTab === tab.id ? 'text-white' : 'text-text-muted hover:text-white'
                                    }`}
                            >
                                {tab.label}
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'performance' && (
                        <>
                            {/* Strengths */}
                            <Card padding="lg" hover={false}>
                                <div className="flex items-center gap-2 mb-6">
                                    <span className="material-symbols-outlined text-verified">thumb_up</span>
                                    <h3 className="text-lg font-bold text-white">What You Did Well</h3>
                                </div>

                                {strengths.length > 0 ? (
                                    <div className="space-y-4">
                                        {strengths.map((strength, index) => (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="flex gap-4 p-4 rounded-xl bg-verified/5 border border-verified/10"
                                            >
                                                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-verified/10 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-verified">check_circle</span>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-white mb-1">{strength.title}</h4>
                                                    <p className="text-sm text-text-muted leading-relaxed">{strength.description}</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-text-muted">No specific strengths recorded.</p>
                                )}
                            </Card>

                            {/* Improvements */}
                            <Card padding="lg" hover={false}>
                                <div className="flex items-center gap-2 mb-6">
                                    <span className="material-symbols-outlined text-primary">trending_up</span>
                                    <h3 className="text-lg font-bold text-white">Areas for Improvement</h3>
                                </div>

                                {improvements.length > 0 ? (
                                    <div className="space-y-4">
                                        {improvements.map((item, index) => (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10"
                                            >
                                                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-primary">lightbulb</span>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-white mb-1">{item.title}</h4>
                                                    <p className="text-sm text-text-muted leading-relaxed">{item.description}</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-text-muted">No specific improvements noted.</p>
                                )}
                            </Card>
                        </>
                    )}

                    {activeTab === 'skills' && (
                        <Card padding="lg" hover={false}>
                            <div className="flex items-center gap-2 mb-6">
                                <span className="material-symbols-outlined text-primary">analytics</span>
                                <h3 className="text-lg font-bold text-white">Skills Assessment</h3>
                            </div>

                            {skillsAssessed.length > 0 ? (
                                <div className="space-y-4">
                                    {skillsAssessed.map((skill, index) => (
                                        <div key={index} className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-white font-medium">{skill.skill}</span>
                                                <span className="text-text-muted">{skill.score}%</span>
                                            </div>
                                            <div className="h-2 bg-card-dark rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${skill.score}%` }}
                                                    transition={{ delay: index * 0.1, duration: 0.5 }}
                                                    className={`h-full ${skill.score >= 70 ? 'bg-verified' :
                                                        skill.score >= 50 ? 'bg-primary' : 'bg-flagged'
                                                        }`}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-text-muted">No skills data available.</p>
                            )}
                        </Card>
                    )}

                    {activeTab === 'next' && (
                        <Card padding="lg" hover={false}>
                            <div className="flex items-center gap-2 mb-6">
                                <span className="material-symbols-outlined text-primary">rocket_launch</span>
                                <h3 className="text-lg font-bold text-white">What's Next?</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                    <h4 className="font-bold text-white mb-2">📧 Check Your Email</h4>
                                    <p className="text-sm text-text-muted">
                                        The recruiter will review your assessment and may reach out for next steps.
                                    </p>
                                </div>

                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                    <h4 className="font-bold text-white mb-2">📥 Download Your Report</h4>
                                    <p className="text-sm text-text-muted">
                                        Keep a copy of your assessment for your records using the Download button above.
                                    </p>
                                </div>

                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                    <h4 className="font-bold text-white mb-2">🎯 Keep Practicing</h4>
                                    <p className="text-sm text-text-muted">
                                        Review the improvement areas and work on providing more specific examples in future interviews.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Right: Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Quick Stats */}
                    <Card padding="md" hover={false}>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Quick Stats</h3>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-text-muted">Questions Answered</span>
                                <span className="text-white font-bold">{feedback?.questionsCount || 4}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-text-muted">Overall Score</span>
                                <span className="text-white font-bold">{matchScore}%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-text-muted">Assessment Date</span>
                                <span className="text-white font-bold">{date}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-text-muted">Status</span>
                                <span className={`font-bold ${verdictStyle.color}`}>
                                    {verdict.charAt(0).toUpperCase() + verdict.slice(1)}
                                </span>
                            </div>
                        </div>
                    </Card>

                    {/* Feedback */}
                    <Card padding="md" hover={false}>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-text-muted">feedback</span>
                            <h3 className="text-sm font-bold text-white">How was your experience?</h3>
                        </div>

                        <div className="flex gap-3">
                            <button className="flex-1 p-3 rounded-lg bg-verified/10 hover:bg-verified/20 text-verified transition-colors flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined">thumb_up</span>
                                Good
                            </button>
                            <button className="flex-1 p-3 rounded-lg bg-white/5 hover:bg-white/10 text-text-muted hover:text-white transition-colors flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined">thumb_down</span>
                                Bad
                            </button>
                        </div>
                    </Card>

                    {/* Help */}
                    <Card padding="md" hover={false} className="border border-primary/20">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="material-symbols-outlined text-primary">help</span>
                            <h3 className="text-sm font-bold text-white">Need Help?</h3>
                        </div>
                        <p className="text-sm text-text-muted mb-3">
                            Have questions about your assessment? Contact the recruiter who sent you this test.
                        </p>
                    </Card>
                </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-center pt-6 border-t border-white/10">
                <Button variant="primary" onClick={onReset} icon="home">
                    Return to Start
                </Button>
            </div>
        </div>
    );
}
