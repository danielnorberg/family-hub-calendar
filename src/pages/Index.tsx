import { useAuth } from '@/contexts/AuthContext';
import { AuthPage } from '@/components/auth/AuthPage';
import { AppLayout } from '@/components/layout/AppLayout';

const Index = () => {
  const { user, currentMember, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="text-center">
          <div className="text-6xl animate-bounce-gentle mb-4">📅</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Family Calendar</h2>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in at all
  if (!user) {
    return <AuthPage />;
  }

  // Logged in but no family member selected (shouldn't happen for parents)
  if (!currentMember) {
    return <AuthPage />;
  }

  // Fully authenticated
  return <AppLayout />;
};

export default Index;
