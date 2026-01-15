import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Card from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';
import StatCard from './ui/StatCard';
import { fetchRecruiterStats, fetchRecruiterCodes, fetchCodeSubmissions, logout } from '../services/api';

/**
 * Recruiter Dashboard Component
 * Shows screening codes, stats, and submissions
 */
export default function RecruiterDashboard({ recruiter: _recruiter, onCreateNew, onLogout, onViewSubmission }) {
    const [stats, setStats] = useState({ totalCodes: 0, totalScreenings: 0, avgTrustScore: 0, timeSaved: 0 });
    const [codes, setCodes] = useState([]);
    const [selectedCode, setSelectedCode] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [statsData, codesData] = await Promise.all([
                fetchRecruiterStats().catch(() => ({})),
                fetchRecruiterCodes().catch(() => []),
            ]);
            setStats(statsData);
            setCodes(codesData);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadSubmissions = async (code) => {
        setSelectedCode(code);
        try {
            const subs = await fetchCodeSubmissions(code);
            setSubmissions(subs);
        } catch (error) {
            console.error('Failed to load submissions:', error);
        }
    };

    const handleLogout = async () => {
        await logout();
        onLogout();
    };

    const getVerdictConfig = (verdict, status) => {
        // First check verdict from completed screenings
        switch (verdict) {
            case 'pass': return { label: 'Verified', variant: 'verified' };
            case 'hold': return { label: 'Review', variant: 'review' };
            case 'fail': return { label: 'Flagged', variant: 'flagged' };
        }
        // If no verdict, check the status field
        if (status === 'in_progress') {
            return { label: 'In Progress', variant: 'default' };
        }
        if (status === 'completed') {
            return { label: 'Completed', variant: 'verified' };
        }
        // Fallback for edge cases
        return { label: 'Pending', variant: 'default' };
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const isExpired = (expiresAt) => new Date(expiresAt) < new Date();

    return (
        <div className="space-y-8">
            {/* Hero Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                <div className="space-y-3 max-w-2xl">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-[1.1]"
                    >
                        Trust in <span className="gradient-text">Every Hire</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-text-muted text-lg max-w-lg font-light leading-relaxed"
                    >
                        {codes.length > 0
                            ? `Managing ${codes.length} screening codes with ${stats.totalScreenings || 0} candidates assessed.`
                            : 'Start your first AI-powered candidate screening to see insights here.'
                        }
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex-shrink-0 flex items-center gap-3"
                >
                    <Button
                        variant="primary"
                        size="lg"
                        icon="add_circle"
                        onClick={onCreateNew}
                        className="group relative overflow-hidden"
                    >
                        {/* Subtle sheen effect */}
                        <div className="absolute inset-0 bg-white/20 translate-y-full skew-y-12 group-hover:translate-y-[-150%] transition-transform duration-700 ease-in-out" />
                        <span className="relative z-10">Start New Screening</span>
                    </Button>
                    <Button variant="ghost" onClick={handleLogout} title="Logout">
                        <span className="material-symbols-outlined">logout</span>
                    </Button>
                </motion.div>
            </header>

            {/* Stats */}
            <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard icon="group" label="Candidates Screened" value={stats.totalScreenings || 0} />
                <StatCard icon="verified_user" label="Avg Trust Score" value={`${stats.avgTrustScore || 0}%`} />
                <StatCard icon="avg_time" label="Time Saved" value={stats.timeSaved || 0} suffix="min" />
                <StatCard icon="qr_code_2" label="Active Codes" value={stats.totalCodes || 0} />
            </section>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Codes List */}
                <div className="lg:col-span-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-white">Screening Codes</h2>
                        <span className="text-sm text-text-muted">{codes.length} codes</span>
                    </div>

                    {isLoading ? (
                        <Card padding="lg" className="text-center">
                            <div className="w-10 h-10 mx-auto border-4 border-card-dark border-t-primary rounded-full animate-spin" />
                            <p className="text-text-muted mt-4">Loading...</p>
                        </Card>
                    ) : codes.length === 0 ? (
                        <Card padding="lg" className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                                <span className="material-symbols-outlined text-3xl text-text-muted">qr_code_2</span>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">No screening codes yet</h3>
                            <p className="text-text-muted text-sm mb-4">Create your first test to generate a code</p>
                            <Button variant="primary" icon="add" onClick={onCreateNew}>Create Test</Button>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {codes.map((codeData) => (
                                <motion.div
                                    key={codeData.code}
                                    whileHover={{ scale: 1.01 }}
                                    onClick={() => loadSubmissions(codeData.code)}
                                    className={`glass-panel rounded-xl p-4 cursor-pointer transition-all ${selectedCode === codeData.code ? 'ring-2 ring-primary' : 'hover:bg-white/5'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-mono font-bold text-primary">{codeData.code}</span>
                                                {isExpired(codeData.expires_at) && (
                                                    <Badge variant="flagged">Expired</Badge>
                                                )}
                                            </div>
                                            <p className="text-white font-medium">{codeData.role_title}</p>
                                            <p className="text-xs text-text-muted mt-1">
                                                Created {formatDate(codeData.created_at)} • Expires {formatDate(codeData.expires_at)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-white">{codeData.submission_count || 0}</div>
                                            <p className="text-xs text-text-muted">submissions</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Submissions Panel */}
                <div className="lg:col-span-7">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-white">
                            {selectedCode ? `Submissions for ${selectedCode}` : 'Select a code'}
                        </h2>
                    </div>

                    {!selectedCode ? (
                        <Card padding="lg" className="text-center min-h-[300px] flex items-center justify-center">
                            <div>
                                <span className="material-symbols-outlined text-4xl text-text-muted mb-4">touch_app</span>
                                <p className="text-text-muted">Select a screening code to view submissions</p>
                            </div>
                        </Card>
                    ) : submissions.length === 0 ? (
                        <Card padding="lg" className="text-center min-h-[300px] flex items-center justify-center">
                            <div>
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-3xl text-text-muted">inbox</span>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">No submissions yet</h3>
                                <p className="text-text-muted text-sm mb-4">Share the code with applicants to receive submissions</p>
                                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 inline-block">
                                    <p className="text-xs text-text-muted mb-1">Share this code:</p>
                                    <p className="font-mono text-2xl font-bold text-primary">{selectedCode}</p>
                                </div>
                            </div>
                        </Card>
                    ) : (
                        <Card padding="none">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10 bg-white/5">
                                        <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase">Candidate</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-text-muted uppercase">Date</th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-text-muted uppercase">Score</th>
                                        <th className="px-4 py-3 text-center text-xs font-bold text-text-muted uppercase">Status</th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-text-muted uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {submissions.map((sub) => {
                                        const verdictConfig = getVerdictConfig(sub.verdict, sub.status);
                                        return (
                                            <tr key={sub.id} className="hover:bg-white/[0.02]">
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-white">{sub.candidate_name}</p>
                                                    <p className="text-xs text-text-muted">{sub.applicant_email}</p>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-text-muted">{formatDate(sub.created_at)}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="text-lg font-bold text-white">{sub.trust_score ?? '--'}</span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <Badge variant={verdictConfig.variant}>{verdictConfig.label}</Badge>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        onClick={() => onViewSubmission?.(sub)}
                                                        disabled={sub.status !== 'completed'}
                                                        className="p-2 rounded-lg hover:bg-white/10 text-text-muted hover:text-white transition-colors disabled:opacity-30"
                                                    >
                                                        <span className="material-symbols-outlined">visibility</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
