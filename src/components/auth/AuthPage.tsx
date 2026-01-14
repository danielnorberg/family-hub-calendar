import { useState } from 'react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { PinEntry } from './PinEntry';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

type AuthMode = 'login' | 'signup' | 'pin';

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const { user, family } = useAuth();

  // If user is logged in but viewing auth page, show kid PIN option
  const showKidOption = user && family;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex flex-col items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 text-6xl opacity-20 animate-bounce-gentle">📅</div>
        <div className="absolute top-20 right-20 text-5xl opacity-20 animate-bounce-gentle" style={{ animationDelay: '0.5s' }}>⚽</div>
        <div className="absolute bottom-20 left-20 text-5xl opacity-20 animate-bounce-gentle" style={{ animationDelay: '1s' }}>🎵</div>
        <div className="absolute bottom-10 right-10 text-6xl opacity-20 animate-bounce-gentle" style={{ animationDelay: '1.5s' }}>📚</div>
      </div>

      {mode === 'login' && (
        <LoginForm onToggleMode={() => setMode('signup')} />
      )}
      
      {mode === 'signup' && (
        <SignupForm onToggleMode={() => setMode('login')} />
      )}
      
      {mode === 'pin' && (
        <PinEntry onBack={() => setMode('login')} />
      )}

      {/* Kid login button - only show on login/signup screens */}
      {(mode === 'login' || mode === 'signup') && (
        <div className="mt-8 text-center">
          <p className="text-muted-foreground mb-2">Are you a kid?</p>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setMode('pin')}
            className="text-lg px-8 py-6 border-2 border-secondary/50 hover:bg-secondary/10"
          >
            🧒 Use PIN Code
          </Button>
        </div>
      )}
    </div>
  );
}
