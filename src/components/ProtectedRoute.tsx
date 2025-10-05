// components/ProtectedRoute.tsx
import { useAuth } from '@/hooks/useAuth';
import { LoginForm } from './LoginForm';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <LoginForm />;
    }

    return <>{children}</>;
};