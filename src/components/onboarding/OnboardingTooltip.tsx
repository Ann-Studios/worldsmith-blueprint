// components/onboarding/OnboardingTooltip.tsx
import React, { useEffect, useRef } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';

interface OnboardingTooltipProps {
    children: React.ReactNode;
}

export const OnboardingTooltip: React.FC<OnboardingTooltipProps> = ({ children }) => {
    const { state, nextStep, prevStep, dismissOnboarding, completeOnboarding } = useOnboarding();
    const { currentStep, isActive, steps } = state;

    const tooltipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isActive && steps[currentStep]?.targetElement) {
            // Scroll to and highlight target element
            const target = document.querySelector(steps[currentStep].targetElement!);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // Add highlight effect
                target.classList.add('onboarding-highlight');
                return () => target.classList.remove('onboarding-highlight');
            }
        }
    }, [isActive, currentStep, steps]);

    if (!isActive || currentStep >= steps.length) return null;

    const currentStepData = steps[currentStep];
    const StepComponent = currentStepData.component;

    return (
        <>
            {/* Overlay */}
            <div className="onboarding-overlay" onClick={dismissOnboarding} />

            {/* Tooltip */}
            <div
                ref={tooltipRef}
                className="onboarding-tooltip"
                data-position={currentStepData.position || 'center'}
            >
                <div className="onboarding-content">
                    <StepComponent {...currentStepData.props} />
                </div>

                <div className="onboarding-navigation">
                    <div className="onboarding-progress">
                        Step {currentStep + 1} of {steps.length}
                    </div>

                    <div className="onboarding-buttons">
                        {currentStep > 0 && (
                            <button onClick={prevStep} className="btn-secondary">
                                Back
                            </button>
                        )}

                        <button onClick={dismissOnboarding} className="btn-secondary">
                            Skip
                        </button>

                        {currentStep < steps.length - 1 ? (
                            <button onClick={nextStep} className="btn-primary">
                                Next
                            </button>
                        ) : (
                            <button onClick={completeOnboarding} className="btn-primary">
                                Get Started
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};