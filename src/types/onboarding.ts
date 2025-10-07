// types/onboarding.ts
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<Record<string, unknown>>;
  props?: Record<string, unknown>;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  targetElement?: string; // CSS selector for element to highlight
}

export interface OnboardingState {
  currentStep: number;
  isActive: boolean;
  isCompleted: boolean;
  steps: OnboardingStep[];
  dismissed: boolean;
}