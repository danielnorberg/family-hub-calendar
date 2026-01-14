import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FamilyMember, useCreateMember, useUpdateMember } from '@/hooks/useFamilyMembers';
import { useToast } from '@/hooks/use-toast';

interface FamilyMemberFormProps {
  isOpen: boolean;
  onClose: () => void;
  editMember?: FamilyMember | null;
}

const COLORS = [
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#3B82F6', label: 'Blue' },
  { value: '#22C55E', label: 'Green' },
  { value: '#F97316', label: 'Orange' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#06B6D4', label: 'Cyan' },
  { value: '#EF4444', label: 'Red' },
  { value: '#F59E0B', label: 'Amber' },
];

const EMOJIS = ['👨', '👩', '👦', '👧', '🧒', '👶', '🧑', '🐶', '🐱', '🦁', '🐻', '🐼', '🦊', '🐰', '🐸', '🦄'];

export function FamilyMemberForm({ isOpen, onClose, editMember }: FamilyMemberFormProps) {
  const createMember = useCreateMember();
  const updateMember = useUpdateMember();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [role, setRole] = useState<'parent' | 'child'>('child');
  const [pinCode, setPinCode] = useState('');
  const [color, setColor] = useState(COLORS[0].value);
  const [emoji, setEmoji] = useState('🧒');

  useEffect(() => {
    if (isOpen) {
      if (editMember) {
        setName(editMember.name);
        setRole(editMember.role);
        setPinCode(editMember.pin_code || '');
        setColor(editMember.color);
        setEmoji(editMember.avatar_emoji);
      } else {
        setName('');
        setRole('child');
        setPinCode('');
        setColor(COLORS[Math.floor(Math.random() * COLORS.length)].value);
        setEmoji('🧒');
      }
    }
  }, [isOpen, editMember]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const memberData = {
      name,
      role,
      pin_code: role === 'child' && pinCode ? pinCode : undefined,
      color,
      avatar_emoji: emoji,
    };

    try {
      if (editMember) {
        await updateMember.mutateAsync({ id: editMember.id, ...memberData });
        toast({ title: 'Member updated! ✏️' });
      } else {
        await createMember.mutateAsync(memberData);
        toast({ title: 'Family member added! 🎉' });
      }
      onClose();
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {editMember ? '✏️ Edit Family Member' : '➕ Add Family Member'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Emma"
              required
              className="h-12 text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select 
              value={role} 
              onValueChange={(v) => setRole(v as 'parent' | 'child')}
              disabled={!!editMember} // Can't change role after creation
            >
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="parent">👨‍👩‍👧 Parent (can edit)</SelectItem>
                <SelectItem value="child">🧒 Child (view only)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {role === 'child' && (
            <div className="space-y-2">
              <Label htmlFor="pin">PIN Code (4 digits)</Label>
              <Input
                id="pin"
                type="text"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="e.g., 1234"
                maxLength={4}
                className="h-12 text-lg font-mono tracking-widest"
              />
              <p className="text-xs text-muted-foreground">
                Kids will use this PIN to view their schedule
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Avatar</Label>
            <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-xl">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`w-10 h-10 rounded-lg text-2xl flex items-center justify-center transition-all ${
                    emoji === e ? 'bg-primary text-primary-foreground scale-110' : 'hover:bg-background'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-xl">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-10 h-10 rounded-lg transition-all ${
                    color === c.value ? 'ring-2 ring-foreground ring-offset-2 scale-110' : ''
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMember.isPending || updateMember.isPending}>
              {editMember ? 'Save Changes' : 'Add Member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
