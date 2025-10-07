// components/onboarding/OnboardingManager.tsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/hooks/useAuth';
import { OnboardingTooltip } from './OnboardingTooltip';
import { CanvasStep } from './steps/CanvasStep';
import { ToolbarStep } from './steps/ToolbarStep';
import { CardEditingStep } from './steps/CardEditingStep';
import { WelcomeStep } from './steps/WelcomeStep';

export const OnboardingManager: React.FC = () => {
    const { state, startOnboarding } = useOnboarding();
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    // Only show onboarding on the main canvas page when authenticated
    const shouldShowOnboarding = isAuthenticated && location.pathname === '/app';

    // Auto-start onboarding for new users
    React.useEffect(() => {
        if (!shouldShowOnboarding) return;

        const hasSeenOnboarding = localStorage.getItem('worldsmith-onboarding');
        if (!hasSeenOnboarding) {
            // Define onboarding steps
            const onboardingSteps = [
                {
                    id: 'welcome',
                    title: 'Welcome',
                    description: 'Get started with Worldsmith',
                    component: WelcomeStep,
                    position: 'center' as const,
                },
                {
                    id: 'canvas',
                    title: 'Canvas',
                    description: 'Your main workspace',
                    component: CanvasStep,
                    position: 'center' as const,
                    targetElement: '.canvas-container',
                },
                {
                    id: 'toolbar',
                    title: 'Tools',
                    description: 'Create new elements',
                    component: ToolbarStep,
                    position: 'bottom-right' as const,
                    targetElement: '.toolbar',
                },
                {
                    id: 'editing',
                    title: 'Editing',
                    description: 'Customize your cards',
                    component: CardEditingStep,
                    position: 'top-right' as const,
                    targetElement: '.card-editor',
                },
            ];

            // Delay slightly to let the app load
            setTimeout(() => {
                startOnboarding(onboardingSteps);
            }, 1000);
        }
    }, [startOnboarding, shouldShowOnboarding]);

    return <OnboardingTooltip>{null}</OnboardingTooltip>;
};