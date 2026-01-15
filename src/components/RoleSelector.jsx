import { motion } from 'framer-motion';

/**
 * Role Selector Component
 * Premium split-screen landing page to choose between Recruiter and Applicant
 */
export default function RoleSelector({ onSelectRole }) {
    return (
        <div className="relative min-h-screen flex flex-col lg:flex-row w-full overflow-hidden">
            {/* Central Logo Anchor (Absolute) */}
            <div className="absolute z-50 left-1/2 top-8 -translate-x-1/2 lg:top-1/2 lg:-translate-y-1/2 flex items-center justify-center pointer-events-none">
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="relative group"
                >
                    {/* Decorative glow behind logo */}
                    <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full animate-pulse"></div>

                    {/* Logo Container */}
                    <div className="relative bg-card border-4 border-card-dark rounded-full h-20 w-20 lg:h-28 lg:w-28 flex items-center justify-center shadow-2xl">
                        <span className="material-symbols-outlined text-primary text-4xl lg:text-5xl">verified</span>
                    </div>

                    {/* Brand Name (Floating below logo) */}
                    <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-center">
                        <span className="font-bold text-2xl tracking-[0.2em] text-white uppercase">Creda</span>
                        <p className="text-xs text-text-muted mt-1 hidden lg:block">Trust in Every Hire</p>
                    </div>
                </motion.div>
            </div>

            {/* Left Panel: Recruiters */}
            <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative w-full lg:w-1/2 bg-card-dark flex flex-col justify-center px-6 py-32 lg:py-12 lg:px-16 xl:px-24 border-b lg:border-b-0 lg:border-r border-white/5 min-h-[50vh] lg:min-h-screen"
            >
                <div className="max-w-md mx-auto w-full flex flex-col h-full justify-center lg:pr-8">
                    {/* Header */}
                    <div className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="h-px w-8 bg-primary"></span>
                            <span className="text-primary text-xs font-bold tracking-[0.2em] uppercase">For Teams</span>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black leading-tight text-white mb-3">
                            Finding <span className="text-text-muted">Trusted</span> Talent
                        </h1>
                        <p className="text-text-muted text-lg">
                            AI-Driven Screening for the modern era.
                        </p>
                    </div>

                    {/* Feature List */}
                    <div className="space-y-4 mb-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-xl">add_circle</span>
                            </div>
                            <div>
                                <p className="text-white font-medium">Create Screening Tests</p>
                                <p className="text-text-muted text-sm">Define roles, skills, and requirements</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-xl">qr_code_2</span>
                            </div>
                            <div>
                                <p className="text-white font-medium">Generate Unique Codes</p>
                                <p className="text-text-muted text-sm">Share with candidates instantly</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-xl">insights</span>
                            </div>
                            <div>
                                <p className="text-white font-medium">Trust Score Analytics</p>
                                <p className="text-text-muted text-sm">AI-powered authenticity verification</p>
                            </div>
                        </div>
                    </div>

                    {/* CTA Button with Sheen Effect */}
                    <button
                        onClick={() => onSelectRole('recruiter')}
                        className="relative w-full bg-primary hover:bg-primary/90 text-black font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(255,191,0,0.15)] hover:shadow-[0_0_30px_rgba(255,191,0,0.3)] flex items-center justify-center gap-2 group overflow-hidden"
                    >
                        {/* Sheen Effect */}
                        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"></span>

                        <span className="material-symbols-outlined text-xl">business_center</span>
                        <span>Login / Register as Recruiter</span>
                        <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>

                    <p className="text-center text-text-muted text-sm mt-4">
                        Start screening candidates in minutes
                    </p>
                </div>

                {/* Background Gradient */}
                <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
            </motion.div>

            {/* Right Panel: Candidates */}
            <motion.div
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="relative w-full lg:w-1/2 bg-card flex flex-col justify-center px-6 py-20 lg:py-12 lg:px-16 xl:px-24 min-h-[50vh] lg:min-h-screen"
            >
                <div className="max-w-md mx-auto w-full flex flex-col h-full justify-center lg:pl-8">
                    {/* Header */}
                    <div className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="h-px w-8 bg-verified"></span>
                            <span className="text-verified text-xs font-bold tracking-[0.2em] uppercase">For Candidates</span>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black leading-tight text-white mb-3">
                            Showcase Your <span className="text-primary italic">True Potential</span>
                        </h1>
                        <p className="text-text-muted text-lg">
                            Accelerate your career with verification.
                        </p>
                    </div>

                    {/* Feature List */}
                    <div className="space-y-4 mb-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-verified/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-verified text-xl">key</span>
                            </div>
                            <div>
                                <p className="text-white font-medium">Enter Your Code</p>
                                <p className="text-text-muted text-sm">Use the code from your recruiter</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-verified/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-verified text-xl">upload_file</span>
                            </div>
                            <div>
                                <p className="text-white font-medium">Upload Your Resume</p>
                                <p className="text-text-muted text-sm">AI extracts your skills automatically</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-verified/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-verified text-xl">smart_toy</span>
                            </div>
                            <div>
                                <p className="text-white font-medium">AI Interview</p>
                                <p className="text-text-muted text-sm">Experience-based questions, fair assessment</p>
                            </div>
                        </div>
                    </div>

                    {/* CTA Button with Sheen Effect */}
                    <button
                        onClick={() => onSelectRole('applicant')}
                        className="relative w-full bg-transparent border-2 border-verified/50 hover:border-verified hover:bg-verified/10 text-verified font-bold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group overflow-hidden"
                    >
                        {/* Sheen Effect */}
                        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-verified/20 to-transparent skew-x-12"></span>

                        <span className="material-symbols-outlined text-xl">person</span>
                        <span>Enter Screening Code</span>
                        <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">login</span>
                    </button>

                    <p className="text-center text-text-muted text-sm mt-4">
                        Complete your assessment in under 15 minutes
                    </p>
                </div>

                {/* Decorative Element */}
                <div className="absolute top-10 right-10 opacity-5 pointer-events-none hidden lg:block">
                    <span className="material-symbols-outlined text-[180px]">fingerprint</span>
                </div>

                {/* Background Pattern */}
                <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-verified/5 to-transparent pointer-events-none"></div>
            </motion.div>

            {/* Footer - Desktop Only */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center text-text-muted text-xs hidden lg:block">
                <p>© 2025 Creda Intelligence Systems • AI-Powered Verification</p>
            </div>
        </div>
    );
}
