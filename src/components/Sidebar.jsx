import { motion } from 'framer-motion';

/**
 * Sidebar Navigation Component
 * Simplified sidebar with only functional pages
 */
export default function Sidebar({ currentPage, onNavigate, user }) {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
        { id: 'history', label: 'History', icon: 'history' },
    ];

    return (
        <aside className="glass-sidebar w-72 flex-shrink-0 flex-col justify-between hidden lg:flex h-full z-20">
            <div>
                {/* Logo Area */}
                <div className="p-8 pb-10">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-primary to-[#856504] shadow-glow-primary text-black">
                            <span className="material-symbols-outlined text-[28px]">token</span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-white leading-none">Creda</h1>
                            <p className="text-xs text-primary/80 font-medium tracking-wide uppercase mt-1">Recruiter Portal</p>
                        </div>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex flex-col px-4 gap-2">
                    {navItems.map((item) => (
                        <motion.button
                            key={item.id}
                            onClick={() => onNavigate?.(item.id)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={currentPage === item.id ? 'nav-link-active' : 'nav-link group'}
                        >
                            <span className={`material-symbols-outlined ${currentPage === item.id ? 'text-primary fill-1' : 'group-hover:text-primary transition-colors'}`}>
                                {item.icon}
                            </span>
                            <span className={`text-sm ${currentPage === item.id ? 'font-semibold' : 'font-medium'}`}>
                                {item.label}
                            </span>
                        </motion.button>
                    ))}
                </nav>

                {/* Active Screening Indicator */}
                {currentPage === 'screenings' && (
                    <div className="mx-4 mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="size-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-xs font-bold text-primary uppercase">Screening in Progress</span>
                        </div>
                        <p className="text-xs text-text-muted">Complete the current screening or return to dashboard.</p>
                    </div>
                )}
            </div>

            {/* User Profile Snippet */}
            <div className="p-4 border-t border-white/5 mx-4 mb-4">
                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors">
                    <div
                        className="size-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-xs font-bold text-white border border-white/10"
                    >
                        {user?.initials || 'AS'}
                    </div>
                    <div className="flex flex-col">
                        <p className="text-sm font-bold text-white leading-tight">{user?.name || 'Alex Sterling'}</p>
                        <p className="text-xs text-text-muted">{user?.role || 'Head Recruiter'}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
