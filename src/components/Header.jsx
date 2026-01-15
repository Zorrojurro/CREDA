import { motion } from 'framer-motion';

/**
 * Header Component
 * Contextual header with progress indicator (used in mobile view)
 */
export default function Header({ currentStep = 1, title, subtitle }) {
  const steps = [
    { label: 'Define Role', icon: 'edit_note' },
    { label: 'Resume', icon: 'description' },
    { label: 'Interview', icon: 'chat' },
    { label: 'Results', icon: 'analytics' },
  ];

  return (
    <header className="border-b border-white/10 bg-background-dark/95 backdrop-blur-md py-4 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          {/* Left: Title */}
          <div>
            {title && (
              <h1 className="text-xl font-bold text-white">{title}</h1>
            )}
            {subtitle && (
              <p className="text-sm text-text-muted">{subtitle}</p>
            )}
          </div>

          {/* Right: Step Indicator */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-primary font-bold">Step {currentStep}</span>
            <span className="text-text-muted">of 4</span>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const stepNum = index + 1;
            const isActive = stepNum === currentStep;
            const isCompleted = stepNum < currentStep;

            return (
              <div
                key={step.label}
                className={`flex items-center gap-2 ${isActive ? 'text-primary' :
                    isCompleted ? 'text-verified' :
                      'text-text-muted opacity-50'
                  }`}
              >
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                  ${isActive ? 'bg-primary text-black' :
                    isCompleted ? 'bg-verified text-white' :
                      'bg-card-dark text-text-muted'}
                `}>
                  {isCompleted ? (
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  ) : (
                    stepNum
                  )}
                </div>
                <span className="text-xs font-medium hidden sm:inline">{step.label}</span>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className={`
                    w-8 sm:w-16 h-0.5 mx-2
                    ${stepNum < currentStep ? 'bg-verified' : 'bg-card-dark'}
                  `} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </header>
  );
}
