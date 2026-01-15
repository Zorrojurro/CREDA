import { useState } from 'react';
import { motion } from 'framer-motion';
import Card from './ui/Card';
import Button from './ui/Button';
import { createScreeningCode } from '../services/api';

/**
 * Code Generator Component
 * Recruiter creates a new screening and gets a code
 */
export default function CodeGenerator({ onComplete, onBack }) {
    const [step, setStep] = useState('form'); // 'form' | 'code'
    const [isLoading, setIsLoading] = useState(false);
    const [generatedCode, setGeneratedCode] = useState('');
    const [copied, setCopied] = useState(false);

    const [formData, setFormData] = useState({
        roleTitle: '',
        experienceLevel: 'mid',
        requiredSkills: [],
        preferredSkills: [],
        jobDescription: '',
        skillInput: '',
    });

    const experienceLevels = [
        { id: 'entry', label: 'Entry Level', desc: '0-2 years' },
        { id: 'mid', label: 'Mid Level', desc: '3-5 years' },
        { id: 'senior', label: 'Senior', desc: '5+ years' },
        { id: 'lead', label: 'Lead/Manager', desc: '8+ years' },
    ];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSkillAdd = (type) => {
        if (!formData.skillInput.trim()) return;

        setFormData({
            ...formData,
            [type]: [...formData[type], formData.skillInput.trim()],
            skillInput: '',
        });
    };

    const handleSkillRemove = (type, index) => {
        setFormData({
            ...formData,
            [type]: formData[type].filter((_, i) => i !== index),
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.roleTitle) {
            return;
        }

        setIsLoading(true);
        try {
            const result = await createScreeningCode({
                roleTitle: formData.roleTitle,
                experienceLevel: formData.experienceLevel,
                requiredSkills: formData.requiredSkills,
                preferredSkills: formData.preferredSkills,
                jobDescription: formData.jobDescription,
            });

            setGeneratedCode(result.code);
            setStep('code');
        } catch (error) {
            console.error('Failed to create code:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const copyCode = () => {
        navigator.clipboard.writeText(generatedCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (step === 'code') {
        return (
            <div className="max-w-2xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <Card padding="lg" className="text-center">
                        {/* Success Icon */}
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-verified/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-4xl text-verified">check_circle</span>
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-2">Screening Code Generated!</h2>
                        <p className="text-text-muted mb-8">
                            Share this code with applicants to start their screening for <strong className="text-white">{formData.roleTitle}</strong>
                        </p>

                        {/* Code Display */}
                        <div className="p-6 rounded-2xl bg-card-dark border border-primary/30 mb-6">
                            <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Your Screening Code</p>
                            <p className="font-mono text-4xl font-black text-primary tracking-wider">{generatedCode}</p>
                            <p className="text-xs text-text-muted mt-2">Valid for 7 days</p>
                        </div>

                        {/* Copy Button */}
                        <Button
                            variant={copied ? 'secondary' : 'primary'}
                            icon={copied ? 'check' : 'content_copy'}
                            onClick={copyCode}
                            className="mb-8"
                        >
                            {copied ? 'Copied!' : 'Copy Code'}
                        </Button>

                        {/* Instructions */}
                        <div className="text-left p-4 rounded-xl bg-white/5 border border-white/10 mb-6">
                            <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">info</span>
                                How it works
                            </h4>
                            <ol className="text-sm text-text-muted space-y-2">
                                <li className="flex gap-2">
                                    <span className="text-primary font-bold">1.</span>
                                    Share the code with the applicant via email or message
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-primary font-bold">2.</span>
                                    They'll enter the code, upload their resume, and take the AI interview
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-primary font-bold">3.</span>
                                    You'll see their results in your dashboard when they complete
                                </li>
                            </ol>
                        </div>

                        <Button variant="secondary" onClick={onComplete}>
                            Back to Dashboard
                        </Button>
                    </Card>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            {/* Back Button */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-text-muted hover:text-white mb-6 transition-colors"
            >
                <span className="material-symbols-outlined">arrow_back</span>
                <span>Back to Dashboard</span>
            </button>

            <Card padding="lg">
                <h2 className="text-2xl font-bold text-white mb-2">Create New Screening</h2>
                <p className="text-text-muted mb-8">Define the role and requirements, then generate a code to share with applicants</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Role Title */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">Role Title *</label>
                        <input
                            type="text"
                            name="roleTitle"
                            value={formData.roleTitle}
                            onChange={handleChange}
                            placeholder="e.g., Senior Frontend Developer"
                            className="w-full px-4 py-3 rounded-xl bg-card-dark border border-white/10 text-white placeholder-text-muted focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                            required
                        />
                    </div>

                    {/* Experience Level */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-3">Experience Level</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {experienceLevels.map((level) => (
                                <button
                                    key={level.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, experienceLevel: level.id })}
                                    className={`p-4 rounded-xl border text-center transition-all ${formData.experienceLevel === level.id
                                            ? 'bg-primary/10 border-primary text-white'
                                            : 'bg-card-dark border-white/10 text-text-muted hover:border-white/30'
                                        }`}
                                >
                                    <p className="font-medium">{level.label}</p>
                                    <p className="text-xs opacity-70">{level.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Required Skills */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">Required Skills</label>
                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                value={formData.skillInput}
                                onChange={(e) => setFormData({ ...formData, skillInput: e.target.value })}
                                placeholder="Add a skill"
                                className="flex-1 px-4 py-2 rounded-lg bg-card-dark border border-white/10 text-white placeholder-text-muted focus:border-primary outline-none"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSkillAdd('requiredSkills');
                                    }
                                }}
                            />
                            <Button type="button" variant="secondary" onClick={() => handleSkillAdd('requiredSkills')}>
                                Add
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.requiredSkills.map((skill, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                                >
                                    {skill}
                                    <button
                                        type="button"
                                        onClick={() => handleSkillRemove('requiredSkills', index)}
                                        className="hover:bg-white/10 rounded-full p-0.5"
                                    >
                                        <span className="material-symbols-outlined text-[14px]">close</span>
                                    </button>
                                </span>
                            ))}
                            {formData.requiredSkills.length === 0 && (
                                <span className="text-sm text-text-muted italic">No required skills added</span>
                            )}
                        </div>
                    </div>

                    {/* Job Description */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-2">Job Description (Optional)</label>
                        <textarea
                            name="jobDescription"
                            value={formData.jobDescription}
                            onChange={handleChange}
                            placeholder="Describe the role, responsibilities, and expectations..."
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl bg-card-dark border border-white/10 text-white placeholder-text-muted focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors resize-none"
                        />
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                        <Button type="button" variant="ghost" onClick={onBack}>Cancel</Button>
                        <Button
                            type="submit"
                            variant="primary"
                            icon="qr_code_2"
                            disabled={isLoading || !formData.roleTitle}
                        >
                            {isLoading ? 'Generating...' : 'Generate Code'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
