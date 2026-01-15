import { motion } from 'framer-motion';
import StatCard from './ui/StatCard';
import Badge from './ui/Badge';
import Button from './ui/Button';

/**
 * Dashboard Component
 * Main landing page with real stats from database
 */
export default function Dashboard({
    onStartScreening,
    recentScreenings = [],
    stats = {},
    isLoading = false,
    onViewScreening,
    showHistoryView = false
}) {
    const getStatusVariant = (status) => {
        switch (status) {
            case 'pass': return 'verified';
            case 'hold': return 'review';
            case 'fail': return 'flagged';
            default: return 'default';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'pass': return 'Verified';
            case 'hold': return 'Review Needed';
            case 'fail': return 'Flagged';
            case 'completed': return 'Completed';
            case 'in_progress': return 'In Progress';
            default: return status || 'Pending';
        }
    };

    const getScoreIcon = (score) => {
        if (score >= 80) return { icon: 'shield', color: 'text-verified border-verified/30' };
        if (score >= 50) return { icon: 'gpp_maybe', color: 'text-primary border-primary/30' };
        if (score > 0) return { icon: 'warning', color: 'text-flagged border-flagged/30' };
        return { icon: 'pending', color: 'text-text-muted border-white/20' };
    };

    const getInitials = (name) => {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Show empty state if no screenings
    const hasScreenings = recentScreenings.length > 0;

    return (
        <div className="space-y-10">
            {/* Hero Section */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                <div className="space-y-3 max-w-2xl">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-[1.1]"
                    >
                        {showHistoryView ? 'Screening History' : 'Trust in '}<span className="gradient-text">{showHistoryView ? '' : 'Every Hire'}</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-text-muted text-lg max-w-lg font-light leading-relaxed"
                    >
                        {showHistoryView
                            ? `View all ${stats.total || 0} completed screenings and their results.`
                            : stats.total > 0
                                ? `AI-powered verification is active. ${stats.total} screenings completed with ${stats.avgTrustScore || 0}% average trust score.`
                                : 'Start your first AI-powered candidate screening to see insights here.'
                        }
                    </motion.p>
                </div>

                {!showHistoryView && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex-shrink-0"
                    >
                        <Button
                            variant="primary"
                            size="lg"
                            icon="add_circle"
                            onClick={onStartScreening}
                            className="group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full skew-y-12 group-hover:translate-y-[-150%] transition-transform duration-700 ease-in-out" />
                            <span className="relative z-10">Start New Screening</span>
                        </Button>
                    </motion.div>
                )}
            </header>

            {/* Stats Row - Only show on main dashboard with data */}
            {!showHistoryView && (
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        icon="group"
                        label="Candidates Screened"
                        value={isLoading ? '...' : (stats.total || 0).toLocaleString()}
                        trend={stats.total > 0 ? 'up' : undefined}
                        trendValue={stats.total > 0 ? `+${stats.total}` : undefined}
                    />
                    <StatCard
                        icon="verified_user"
                        label="Avg Trust Score"
                        value={isLoading ? '...' : `${stats.avgTrustScore || 0}%`}
                        trend={stats.avgTrustScore >= 70 ? 'up' : undefined}
                        trendValue={stats.avgTrustScore >= 70 ? 'Healthy' : undefined}
                    />
                    <StatCard
                        icon="avg_time"
                        label="Time Saved"
                        value={isLoading ? '...' : (stats.timeSaved || 0).toLocaleString()}
                        suffix="min"
                        trend={stats.timeSaved > 0 ? 'up' : undefined}
                        trendValue={stats.timeSaved > 0 ? '45min/screening' : undefined}
                    />
                </section>
            )}

            {/* Recent Screenings Section */}
            <section className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-2xl font-bold text-white tracking-tight">
                        {showHistoryView ? 'All Screenings' : 'Recent Screenings'}
                    </h3>
                    {!showHistoryView && stats.total > recentScreenings.length && (
                        <span className="text-sm text-text-muted">
                            Showing {recentScreenings.length} of {stats.total}
                        </span>
                    )}
                </div>

                {isLoading ? (
                    <div className="glass-panel rounded-2xl p-12 text-center">
                        <div className="w-12 h-12 mx-auto mb-4 border-4 border-card-dark border-t-primary rounded-full animate-spin" />
                        <p className="text-text-muted">Loading screenings...</p>
                    </div>
                ) : !hasScreenings ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-panel rounded-2xl p-12 text-center"
                    >
                        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/5 flex items-center justify-center">
                            <span className="material-symbols-outlined text-4xl text-text-muted">person_search</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No screenings yet</h3>
                        <p className="text-text-muted mb-6 max-w-md mx-auto">
                            Start your first AI-powered screening to see candidates here. Each screening takes about 15-20 minutes.
                        </p>
                        <Button variant="primary" icon="add_circle" onClick={onStartScreening}>
                            Start First Screening
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass-panel rounded-2xl overflow-hidden shadow-glow-card"
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10 bg-white/5">
                                        <th className="px-6 py-5 text-xs font-bold text-text-muted uppercase tracking-wider">Candidate</th>
                                        <th className="px-6 py-5 text-xs font-bold text-text-muted uppercase tracking-wider">Role Applied</th>
                                        <th className="px-6 py-5 text-xs font-bold text-text-muted uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-5 text-xs font-bold text-text-muted uppercase tracking-wider text-right">Trust Score</th>
                                        <th className="px-6 py-5 text-xs font-bold text-text-muted uppercase tracking-wider text-center">Status</th>
                                        <th className="px-6 py-5 text-xs font-bold text-text-muted uppercase tracking-wider text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {recentScreenings.map((screening, index) => {
                                        const scoreStyle = getScoreIcon(screening.trust_score);
                                        return (
                                            <motion.tr
                                                key={screening.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.05 * index }}
                                                className="hover:bg-white/[0.02] transition-colors group"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-xs font-bold text-white ring-2 ring-transparent group-hover:ring-primary/50 transition-all">
                                                            {getInitials(screening.candidate_name)}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-white text-sm">{screening.candidate_name || 'Unknown'}</p>
                                                            <p className="text-xs text-text-muted">{screening.candidate_email || 'No email'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-300 font-medium">{screening.role_title}</td>
                                                <td className="px-6 py-4 text-sm text-text-muted">{formatDate(screening.created_at)}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="inline-flex items-center gap-2">
                                                        <span className="text-sm font-bold text-white">
                                                            {screening.trust_score != null ? screening.trust_score : '--'}
                                                        </span>
                                                        <div className={`size-8 rounded-full border-[3px] ${scoreStyle.color} flex items-center justify-center`}>
                                                            <span className={`material-symbols-outlined text-[16px] ${scoreStyle.color.split(' ')[0]}`}>
                                                                {scoreStyle.icon}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <Badge
                                                        variant={getStatusVariant(screening.verdict || screening.status)}
                                                        pulse={screening.status === 'in_progress'}
                                                    >
                                                        {getStatusLabel(screening.verdict || screening.status)}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => onViewScreening?.(screening)}
                                                        disabled={screening.status === 'in_progress'}
                                                        className="p-2 rounded-lg hover:bg-white/10 text-text-muted hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <span className="material-symbols-outlined">visibility</span>
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Table Footer */}
                        <div className="px-6 py-4 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
                            <span className="text-xs text-text-muted">
                                {recentScreenings.length} screening{recentScreenings.length !== 1 ? 's' : ''} shown
                            </span>
                            <div className="text-xs text-primary">
                                {stats.verified || 0} verified • {stats.review || 0} review • {stats.flagged || 0} flagged
                            </div>
                        </div>
                    </motion.div>
                )}
            </section>

            {/* Footer */}
            <div className="flex justify-center text-text-muted text-xs opacity-50 pt-8">
                <p>© 2024 Creda Intelligence Systems. Confidential.</p>
            </div>
        </div>
    );
}
