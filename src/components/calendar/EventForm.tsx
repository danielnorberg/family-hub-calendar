import { useState, useEffect } from 'react';
import { format, addHours, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useCategories, CalendarEvent, useCreateEvent, useUpdateEvent, useDeleteEvent } from '@/hooks/useEvents';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import { useToast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';

interface EventFormProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
  editEvent?: CalendarEvent | null;
}

const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
];

export function EventForm({ isOpen, onClose, selectedDate, editEvent }: EventFormProps) {
  const { data: categories } = useCategories();
  const { data: members } = useFamilyMembers();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [isAllDay, setIsAllDay] = useState(false);
  const [recurrence, setRecurrence] = useState('none');
  const [location, setLocation] = useState('');
  const [assignedMembers, setAssignedMembers] = useState<string[]>([]);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (editEvent) {
        setTitle(editEvent.title);
        setDescription(editEvent.description || '');
        setCategoryId(editEvent.category_id || '');
        setStartDate(format(parseISO(editEvent.start_time), 'yyyy-MM-dd'));
        setStartTime(format(parseISO(editEvent.start_time), 'HH:mm'));
        setEndTime(format(parseISO(editEvent.end_time), 'HH:mm'));
        setIsAllDay(editEvent.is_all_day);
        setRecurrence(editEvent.recurrence_rule || 'none');
        setLocation(editEvent.location || '');
        setAssignedMembers(editEvent.assignments?.map(a => a.member_id) || []);
      } else {
        const date = selectedDate || new Date();
        setTitle('');
        setDescription('');
        setCategoryId('');
        setStartDate(format(date, 'yyyy-MM-dd'));
        setStartTime('09:00');
        setEndTime('10:00');
        setIsAllDay(false);
        setRecurrence('none');
        setLocation('');
        setAssignedMembers([]);
      }
    }
  }, [isOpen, selectedDate, editEvent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const startDateTime = isAllDay 
      ? `${startDate}T00:00:00` 
      : `${startDate}T${startTime}:00`;
    
    const endDateTime = isAllDay 
      ? `${startDate}T23:59:59` 
      : `${startDate}T${endTime}:00`;

    const eventData = {
      title,
      description: description || undefined,
      category_id: categoryId || undefined,
      start_time: new Date(startDateTime).toISOString(),
      end_time: new Date(endDateTime).toISOString(),
      is_all_day: isAllDay,
      is_recurring: recurrence !== 'none',
      recurrence_rule: recurrence !== 'none' ? recurrence : undefined,
      location: location || undefined,
      assigned_members: assignedMembers,
    };

    try {
      if (editEvent) {
        // Extract the base ID for recurring events
        const baseId = editEvent.id.includes('-') ? editEvent.id.split('-')[0] : editEvent.id;
        await updateEvent.mutateAsync({ id: baseId, ...eventData });
        toast({ title: 'Event updated! ✏️' });
      } else {
        await createEvent.mutateAsync(eventData);
        toast({ title: 'Event created! 🎉' });
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

  const handleDelete = async () => {
    if (!editEvent) return;
    
    try {
      const baseId = editEvent.id.includes('-') ? editEvent.id.split('-')[0] : editEvent.id;
      await deleteEvent.mutateAsync(baseId);
      toast({ title: 'Event deleted! 🗑️' });
      onClose();
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  };

  const toggleMember = (memberId: string) => {
    setAssignedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {editEvent ? '✏️ Edit Event' : '✨ New Event'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Soccer Practice"
              required
              className="h-12 text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2">
                      {cat.icon} {cat.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
            <Label htmlFor="all-day" className="cursor-pointer">All-day event</Label>
            <Switch
              id="all-day"
              checked={isAllDay}
              onCheckedChange={setIsAllDay}
            />
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="h-12"
            />
          </div>

          {!isAllDay && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="h-12"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Repeat</Label>
            <Select value={recurrence} onValueChange={setRecurrence}>
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECURRENCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Assign to Family Members</Label>
            <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded-xl">
              {members?.map((member) => (
                <label
                  key={member.id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-background cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={assignedMembers.includes(member.id)}
                    onCheckedChange={() => toggleMember(member.id)}
                  />
                  <span className="text-lg">{member.avatar_emoji}</span>
                  <span className="text-sm font-medium">{member.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location (optional)</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Community Center"
              className="h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Notes (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any additional details..."
              rows={3}
            />
          </div>

          <DialogFooter className="flex gap-2 pt-4">
            {editEvent && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                className="mr-auto"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createEvent.isPending || updateEvent.isPending}>
              {editEvent ? 'Save Changes' : 'Create Event'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
