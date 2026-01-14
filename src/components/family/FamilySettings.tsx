import { useState } from 'react';
import { useFamilyMembers, useDeleteMember, FamilyMember } from '@/hooks/useFamilyMembers';
import { useAuth } from '@/contexts/AuthContext';
import { FamilyMemberCard } from './FamilyMemberCard';
import { FamilyMemberForm } from './FamilyMemberForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus, Users } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function FamilySettings() {
  const { data: members, isLoading } = useFamilyMembers();
  const deleteMember = useDeleteMember();
  const { currentMember, family } = useAuth();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editMember, setEditMember] = useState<FamilyMember | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleEdit = (member: FamilyMember) => {
    setEditMember(member);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await deleteMember.mutateAsync(deleteId);
      toast({ title: 'Member removed 👋' });
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
    setDeleteId(null);
  };

  const parents = members?.filter(m => m.role === 'parent') || [];
  const kids = members?.filter(m => m.role === 'child') || [];

  return (
    <div className="space-y-6">
      <Card className="shadow-playful">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{family?.name || 'My Family'}</CardTitle>
                <CardDescription>Manage who's in your family calendar</CardDescription>
              </div>
            </div>
            <Button onClick={() => { setEditMember(null); setIsFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </div>
        </CardHeader>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="text-4xl animate-bounce-gentle mb-2">👨‍👩‍👧‍👦</div>
          <p className="text-muted-foreground">Loading family members...</p>
        </div>
      ) : (
        <>
          {/* Parents Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              👨‍👩‍👧 Parents
              <span className="text-muted-foreground font-normal text-sm">
                ({parents.length})
              </span>
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {parents.map((member) => (
                <FamilyMemberCard
                  key={member.id}
                  member={member}
                  onEdit={handleEdit}
                  onDelete={setDeleteId}
                  isCurrentUser={member.id === currentMember?.id}
                />
              ))}
            </div>
          </div>

          {/* Kids Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              🧒 Kids
              <span className="text-muted-foreground font-normal text-sm">
                ({kids.length})
              </span>
            </h3>
            {kids.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <div className="text-4xl mb-2">👶</div>
                  <p className="text-muted-foreground mb-4">
                    No kids added yet. Add your children so they can view their schedules!
                  </p>
                  <Button variant="outline" onClick={() => { setEditMember(null); setIsFormOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Child
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {kids.map((member) => (
                  <FamilyMemberCard
                    key={member.id}
                    member={member}
                    onEdit={handleEdit}
                    onDelete={setDeleteId}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <FamilyMemberForm
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditMember(null); }}
        editMember={editMember}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove family member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove this person from your family calendar. Their events will remain but won't be assigned to them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
