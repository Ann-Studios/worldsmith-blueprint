// pages/Index.tsx
import { useAuth } from '@/hooks/useAuth';
import { LoginForm } from '@/components/LoginForm';
import { Canvas } from '@/components/Canvas';

const Index = () => {
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

  return <Canvas />;
};

export default Index;