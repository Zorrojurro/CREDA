import { useState } from 'react';
import ProgressStepper from './ui/ProgressStepper';
import Button from './ui/Button';
import TagInput from './ui/TagInput';
import Card from './ui/Card';

/**
 * Job Description Input Component
 * Define Role & Requirements screen with live preview
 */
export default function JobDescriptionInput({
    onSubmit,
    currentStep = 1,
    steps = [],
    onBack
}) {
    const [formData, setFormData] = useState({
        title: '',
        experienceLevel: 'senior',
        requiredSkills: [],
        preferredSkills: [],
        description: '',
        roleExpectations: [],
    });

    const experienceLevels = [
        { value: 'entry', label: 'Entry' },
        { value: 'mid', label: 'Mid-Level' },
        { value: 'senior', label: 'Senior' },
        { value: 'executive', label: 'Executive' },
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.title || formData.requiredSkills.length === 0) return;

        onSubmit({
            title: formData.title,
            requiredSkills: formData.requiredSkills,
            preferredSkills: formData.preferredSkills,
            experienceLevel: formData.experienceLevel,
            description: formData.description,
            roleExpectations: formData.roleExpectations,
        });
    };

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Calculate a mock "Creda Score" based on form completeness
    const calculateCredaScore = () => {
        let score = 50;
        if (formData.title) score += 15;
        if (formData.requiredSkills.length > 0) score += 10;
        if (formData.requiredSkills.length >= 3) score += 10;
        if (formData.description.length > 50) score += 10;
        if (formData.description.length > 150) score += 5;
        return Math.min(score, 100);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <header className="flex flex-col gap-6">
                <div className="flex justify-between items-end">
                    <div>
                        <div className="flex items-center gap-2 text-primary text-sm font-bold mb-1 tracking-wider uppercase opacity-80">
                            <span className="material-symbols-outlined text-sm">add</span>
                            New Campaign
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight">
                            Define Role & Requirements
                        </h2>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={onBack}>
                            Save Draft
                        </Button>
                        <Button variant="secondary" onClick={onBack}>
                            Cancel
                        </Button>
                    </div>
                </div>

                {/* Progress Stepper */}
                <ProgressStepper steps={steps} currentStep={currentStep} />
            </header>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Form */}
                <div className="lg:col-span-8">
                    <form onSubmit={handleSubmit}>
                        <Card padding="lg" hover={false} className="space-y-8">
                            {/* Job Title */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-white/70">Role Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => updateField('title', e.target.value)}
                                    placeholder="e.g. Senior Product Designer"
                                    className="input-field"
                                />
                            </div>

                            {/* Experience Level */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-white/70">Experience Level</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {experienceLevels.map((level) => (
                                        <label key={level.value} className="cursor-pointer">
                                            <input
                                                type="radio"
                                                name="experience"
                                                value={level.value}
                                                checked={formData.experienceLevel === level.value}
                                                onChange={(e) => updateField('experienceLevel', e.target.value)}
                                                className="peer sr-only"
                                            />
                                            <div className="h-12 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-sm font-medium text-white/60 peer-checked:bg-primary/20 peer-checked:text-primary peer-checked:border-primary peer-checked:shadow-[0_0_10px_rgba(234,179,8,0.2)] transition-all hover:bg-white/10">
                                                {level.label}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Required Skills */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-white/70 flex justify-between">
                                    Required Skills
                                    <span className="text-xs text-primary/80">Press Enter to add</span>
                                </label>
                                <TagInput
                                    tags={formData.requiredSkills}
                                    onChange={(tags) => updateField('requiredSkills', tags)}
                                    placeholder="Add required skill..."
                                />
                            </div>

                            {/* Preferred Skills */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-white/70 flex justify-between">
                                    Preferred Skills
                                    <span className="text-xs text-white/40">Optional</span>
                                </label>
                                <TagInput
                                    tags={formData.preferredSkills}
                                    onChange={(tags) => updateField('preferredSkills', tags)}
                                    placeholder="Add preferred skill..."
                                />
                            </div>

                            {/* Job Description */}
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-end">
                                    <label className="text-sm font-medium text-white/70">Job Description</label>
                                    <button
                                        type="button"
                                        className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-white transition-colors bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-full border border-primary/20"
                                    >
                                        <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                        Auto-fill with AI
                                    </button>
                                </div>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => updateField('description', e.target.value)}
                                    placeholder="Describe the responsibilities and requirements..."
                                    className="glass-input w-full h-40 rounded-xl p-5 text-base placeholder:text-white/20 resize-none focus:ring-0 leading-relaxed"
                                />
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end pt-4">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="lg"
                                    icon="arrow_forward"
                                    iconPosition="right"
                                    disabled={!formData.title || formData.requiredSkills.length === 0}
                                >
                                    Save & Continue
                                </Button>
                            </div>
                        </Card>
                    </form>
                </div>

                {/* Right: Live Preview */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Live Preview Label */}
                    <div className="flex items-center gap-2 text-white/50 text-xs font-bold uppercase tracking-wider pl-2">
                        <span className="w-2 h-2 rounded-full bg-verified animate-pulse" />
                        Live Preview
                    </div>

                    {/* Preview Card */}
                    <Card accent padding="md" hover={false}>
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl">
                                🎨
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-xs text-white/40 font-medium">Creda Score</span>
                                <span className="text-2xl font-black text-primary">
                                    {calculateCredaScore()}
                                    <span className="text-sm text-white/40 font-normal">%</span>
                                </span>
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2">
                            {formData.title || 'Role Title'}
                        </h3>

                        <div className="flex flex-wrap gap-2 mb-6">
                            <span className="px-2 py-1 rounded bg-white/5 text-xs text-white/60 border border-white/5">
                                Full-time
                            </span>
                            <span className="px-2 py-1 rounded bg-white/5 text-xs text-white/60 border border-white/5">
                                Remote
                            </span>
                            <span className="px-2 py-1 rounded bg-white/5 text-xs text-white/60 border border-white/5 capitalize">
                                {formData.experienceLevel} Level
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div className="h-[1px] w-full bg-white/10" />

                            <div>
                                <h4 className="text-xs font-bold text-white/40 uppercase tracking-wide mb-3">
                                    Target Skills
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {formData.requiredSkills.slice(0, 3).map((skill) => (
                                        <span key={skill} className="text-xs font-medium text-white bg-white/10 px-2 py-1 rounded border border-white/10">
                                            {skill}
                                        </span>
                                    ))}
                                    {formData.requiredSkills.length > 3 && (
                                        <span className="text-xs font-medium text-white/40 px-2 py-1 border border-dashed border-white/20 rounded">
                                            +{formData.requiredSkills.length - 3} more
                                        </span>
                                    )}
                                    {formData.requiredSkills.length === 0 && (
                                        <span className="text-xs text-white/30 italic">No skills added yet</span>
                                    )}
                                </div>
                            </div>

                            <div className="h-[1px] w-full bg-white/10" />
                        </div>

                        {/* AI Analysis */}
                        <div className="mt-4 bg-primary/5 rounded-xl p-4 border border-primary/10">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-primary text-sm">psychology</span>
                                <span className="text-xs font-bold text-primary uppercase">AI Analysis</span>
                            </div>
                            <p className="text-xs text-white/60 leading-relaxed">
                                {formData.title && formData.requiredSkills.length >= 2 ? (
                                    <>
                                        This role description is <span className="text-white font-bold">highly specific</span>.
                                        Expect strong matches from candidates with 5+ years experience in SaaS environments.
                                    </>
                                ) : (
                                    'Add more details to get AI-powered insights about your role.'
                                )}
                            </p>
                        </div>
                    </Card>

                    {/* Helper Tip Card */}
                    <Card padding="md" hover={false} className="bg-surface-dark/40">
                        <div className="flex gap-3">
                            <span className="material-symbols-outlined text-white/40">info</span>
                            <div>
                                <h4 className="text-sm font-bold text-white mb-1">Tip for better matching</h4>
                                <p className="text-xs text-white/50 leading-relaxed">
                                    Adding specific technical skills typically increases candidate quality by 15% for this role type.
                                </p>
                                <button className="mt-3 text-xs font-bold text-primary hover:text-white transition-colors">
                                    Learn more →
                                </button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
