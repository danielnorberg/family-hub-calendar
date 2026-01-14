import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface LoginFormProps {
  onToggleMode: () => void;
}

export function LoginForm({ onToggleMode }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: 'Login failed',
        description: error.message,
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-md shadow-playful border-2 border-primary/20">
      <CardHeader className="text-center space-y-2">
        <div className="text-6xl mb-2">👨‍👩‍👧‍👦</div>
        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Family Calendar
        </CardTitle>
        <CardDescription className="text-lg">
          Welcome back! Sign in to manage your family's schedule
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="parent@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 text-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12 text-lg"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full h-12 text-lg font-semibold"
            disabled={isLoading}
          >
            {isLoading ? '🔄 Signing in...' : '🚀 Sign In'}
          </Button>
        </form>
        <div className="mt-6 text-center">
          <p className="text-muted-foreground">
            Don't have an account?{' '}
            <button
              onClick={onToggleMode}
              className="text-primary font-semibold hover:underline"
            >
              Create one
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
