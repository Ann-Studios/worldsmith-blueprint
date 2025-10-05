// contexts/OnboardingContext.tsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { OnboardingState, OnboardingStep } from '@/types/onboarding';

interface OnboardingContextType {
    state: OnboardingState;
    nextStep: () => void;
    prevStep: () => void;
    startOnboarding: (steps?: OnboardingStep[]) => void;
    completeOnboarding: () => void;
    dismissOnboarding: () => void;
    resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// Initial state
const initialState: OnboardingState = {
    currentStep: 0,
    isActive: false,
    isCompleted: false,
    dismissed: false,
    steps: [],
};

// Reducer
type OnboardingAction =
    | { type: 'START_ONBOARDING'; payload: OnboardingStep[] }
    | { type: 'NEXT_STEP' }
    | { type: 'PREV_STEP' }
    | { type: 'COMPLETE_ONBOARDING' }
    | { type: 'DISMISS_ONBOARDING' }
    | { type: 'RESET_ONBOARDING' };

function onboardingReducer(state: OnboardingState, action: OnboardingAction): OnboardingState {
    switch (action.type) {
        case 'START_ONBOARDING':
            return {
                ...state,
                isActive: true,
                currentStep: 0,
                steps: action.payload,
                dismissed: false,
            };
        case 'NEXT_STEP':
            if (state.currentStep >= state.steps.length - 1) {
                return { ...state, isActive: false, isCompleted: true };
            }
            return { ...state, currentStep: state.currentStep + 1 };
        case 'PREV_STEP':
            return { ...state, currentStep: Math.max(0, state.currentStep - 1) };
        case 'COMPLETE_ONBOARDING':
            return { ...state, isActive: false, isCompleted: true };
        case 'DISMISS_ONBOARDING':
            return { ...state, isActive: false, dismissed: true };
        case 'RESET_ONBOARDING':
            return { ...initialState };
        default:
            return state;
    }
}

// Provider component
export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(onboardingReducer, initialState);

    // Load onboarding state from localStorage
    useEffect(() => {
        const savedState = localStorage.getItem('worldsmith-onboarding');
        if (savedState) {
            const parsed = JSON.parse(savedState);
            if (parsed.dismissed || parsed.isCompleted) {
                dispatch({ type: 'DISMISS_ONBOARDING' });
            }
        }
    }, []);

    // Save to localStorage when state changes
    useEffect(() => {
        localStorage.setItem('worldsmith-onboarding', JSON.stringify({
            dismissed: state.dismissed,
            isCompleted: state.isCompleted,
        }));
    }, [state.dismissed, state.isCompleted]);

    const value: OnboardingContextType = {
        state,
        nextStep: () => dispatch({ type: 'NEXT_STEP' }),
        prevStep: () => dispatch({ type: 'PREV_STEP' }),
        startOnboarding: (steps) => dispatch({ type: 'START_ONBOARDING', payload: steps || [] }),
        completeOnboarding: () => dispatch({ type: 'COMPLETE_ONBOARDING' }),
        dismissOnboarding: () => dispatch({ type: 'DISMISS_ONBOARDING' }),
        resetOnboarding: () => dispatch({ type: 'RESET_ONBOARDING' }),
    };

    return (
        <OnboardingContext.Provider value={value}>
            {children}
        </OnboardingContext.Provider>
    );
};

// Hook
export const useOnboarding = () => {
    const context = useContext(OnboardingContext);
    if (context === undefined) {
        throw new Error('useOnboarding must be used within an OnboardingProvider');
    }
    return context;
};