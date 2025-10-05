// components/onboarding/OnboardingManager.tsx
import React from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { OnboardingTooltip } from './OnboardingTooltip';
import { CanvasStep } from './steps/CanvasStep';
import { ToolbarStep } from './steps/ToolbarStep';
import { CardEditingStep } from './steps/CardEditingStep';
import { WelcomeStep } from './steps/WelcomeStep';

export const OnboardingManager: React.FC = () => {
    const { state, startOnboarding } = useOnboarding();

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

    // Auto-start onboarding for new users
    React.useEffect(() => {
        const hasSeenOnboarding = localStorage.getItem('worldsmith-onboarding');
        if (!hasSeenOnboarding) {
            // Delay slightly to let the app load
            setTimeout(() => {
                startOnboarding(onboardingSteps);
            }, 1000);
        }
    }, [startOnboarding]);

    return <OnboardingTooltip>{null}</OnboardingTooltip>;
};