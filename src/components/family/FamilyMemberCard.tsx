import { useState } from 'react';
import { FamilyMember } from '@/hooks/useFamilyMembers';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, Key } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FamilyMemberCardProps {
  member: FamilyMember;
  onEdit: (member: FamilyMember) => void;
  onDelete: (id: string) => void;
  isCurrentUser?: boolean;
}

export function FamilyMemberCard({ member, onEdit, onDelete, isCurrentUser }: FamilyMemberCardProps) {
  const [showPin, setShowPin] = useState(false);

  return (
    <Card className={cn(
      'overflow-hidden transition-all hover:shadow-lg',
      isCurrentUser && 'ring-2 ring-primary'
    )}>
      <div 
        className="h-3"
        style={{ backgroundColor: member.color }}
      />
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
              style={{ backgroundColor: `${member.color}20` }}
            >
              {member.avatar_emoji}
            </div>
            <div>
              <h3 className="font-bold text-lg">{member.name}</h3>
              <Badge variant={member.role === 'parent' ? 'default' : 'secondary'}>
                {member.role === 'parent' ? '👨‍👩‍👧 Parent' : '🧒 Child'}
              </Badge>
            </div>
          </div>
          
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(member)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            {!isCurrentUser && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(member.id)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        </div>

        {member.role === 'child' && member.pin_code && (
          <div className="mt-4 p-3 bg-muted rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Key className="h-4 w-4" />
                <span>PIN Code:</span>
              </div>
              <button
                onClick={() => setShowPin(!showPin)}
                className="font-mono font-bold text-lg tracking-wider"
              >
                {showPin ? member.pin_code : '••••'}
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
