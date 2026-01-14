import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';

interface PinEntryProps {
  onBack: () => void;
}

export function PinEntry({ onBack }: PinEntryProps) {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { loginWithPin } = useAuth();
  const { toast } = useToast();
  const { data: members } = useFamilyMembers();

  const kidsWithPins = members?.filter(m => m.role === 'child' && m.pin_code) || [];

  const handlePinComplete = async (value: string) => {
    setIsLoading(true);
    const { error } = await loginWithPin(value);

    if (error) {
      toast({
        title: 'Wrong PIN! 🤔',
        description: 'Try again or ask a parent for help.',
        variant: 'destructive',
      });
      setPin('');
    }
    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-md shadow-playful border-2 border-secondary/20">
      <CardHeader className="text-center space-y-2">
        <div className="text-6xl mb-2 animate-bounce-gentle">🔢</div>
        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
          Enter Your PIN
        </CardTitle>
        <CardDescription className="text-lg">
          Type your secret 4-digit code to see your schedule!
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6">
        {kidsWithPins.length > 0 ? (
          <>
            <div className="flex gap-2 flex-wrap justify-center mb-2">
              {kidsWithPins.map((kid) => (
                <div
                  key={kid.id}
                  className="flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-sm"
                >
                  <span>{kid.avatar_emoji}</span>
                  <span>{kid.name}</span>
                </div>
              ))}
            </div>
            <InputOTP
              value={pin}
              onChange={(value) => {
                setPin(value);
                if (value.length === 4) {
                  handlePinComplete(value);
                }
              }}
              maxLength={4}
              disabled={isLoading}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="w-16 h-16 text-2xl" />
                <InputOTPSlot index={1} className="w-16 h-16 text-2xl" />
                <InputOTPSlot index={2} className="w-16 h-16 text-2xl" />
                <InputOTPSlot index={3} className="w-16 h-16 text-2xl" />
              </InputOTPGroup>
            </InputOTP>
          </>
        ) : (
          <p className="text-muted-foreground text-center">
            No kids have been set up with PIN codes yet. Ask a parent to add you!
          </p>
        )}

        <Button 
          variant="ghost" 
          onClick={onBack}
          className="mt-4"
        >
          ← Back to parent login
        </Button>
      </CardContent>
    </Card>
  );
}
