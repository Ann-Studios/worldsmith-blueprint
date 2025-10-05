// components/onboarding/WelcomeBanner.tsx
import React from 'react';
import { useOnboarding } from '../../contexts/OnboardingContext';

export const WelcomeBanner: React.FC = () => {
    const { state, startOnboarding, resetOnboarding } = useOnboarding();

    if (state.dismissed || state.isCompleted) {
        return (
            <div className="welcome-banner">
                <span>Welcome to Worldsmith! </span>
                <button onClick={() => resetOnboarding()}>
                    Show Tutorial Again
                </button>
            </div>
        );
    }

    return null;
};