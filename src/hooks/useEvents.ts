import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { addDays, addWeeks, addMonths, isSameDay, isWithinInterval, parseISO } from 'date-fns';

export interface EventCategory {
  id: string;
  family_id: string;
  name: string;
  color: string;
  icon: string | null;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  family_id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  is_recurring: boolean;
  recurrence_rule: string | null;
  location: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  category?: EventCategory;
  assignments?: { member_id: string }[];
}

export interface CreateEventInput {
  title: string;
  description?: string;
  category_id?: string;
  start_time: string;
  end_time: string;
  is_all_day?: boolean;
  is_recurring?: boolean;
  recurrence_rule?: string;
  location?: string;
  assigned_members: string[];
}

// Helper to generate recurring event instances
function generateRecurringInstances(event: CalendarEvent, startDate: Date, endDate: Date): CalendarEvent[] {
  if (!event.is_recurring || !event.recurrence_rule) return [event];

  const instances: CalendarEvent[] = [];
  const rule = event.recurrence_rule;
  let currentDate = parseISO(event.start_time);
  const eventDuration = parseISO(event.end_time).getTime() - parseISO(event.start_time).getTime();
  
  let count = 0;
  const maxInstances = 100; // Safety limit

  while (currentDate <= endDate && count < maxInstances) {
    if (currentDate >= startDate) {
      const instanceEnd = new Date(currentDate.getTime() + eventDuration);
      instances.push({
        ...event,
        id: `${event.id}-${count}`,
        start_time: currentDate.toISOString(),
        end_time: instanceEnd.toISOString(),
      });
    }

    // Move to next occurrence based on rule
    switch (rule) {
      case 'daily':
        currentDate = addDays(currentDate, 1);
        break;
      case 'weekly':
        currentDate = addWeeks(currentDate, 1);
        break;
      case 'biweekly':
        currentDate = addWeeks(currentDate, 2);
        break;
      case 'monthly':
        currentDate = addMonths(currentDate, 1);
        break;
      default:
        currentDate = addWeeks(currentDate, 1);
    }
    count++;
  }

  return instances;
}

export function useEvents(startDate?: Date, endDate?: Date) {
  const { family } = useAuth();

  return useQuery({
    queryKey: ['events', family?.id, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      if (!family) return [];

      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          category:event_categories(*),
          assignments:event_assignments(member_id)
        `)
        .eq('family_id', family.id)
        .order('start_time', { ascending: true });

      if (error) throw error;

      // Expand recurring events if date range provided
      if (startDate && endDate) {
        const allEvents: CalendarEvent[] = [];
        for (const event of data) {
          const instances = generateRecurringInstances(event as CalendarEvent, startDate, endDate);
          allEvents.push(...instances);
        }
        return allEvents.filter(event => {
          const eventStart = parseISO(event.start_time);
          return isWithinInterval(eventStart, { start: startDate, end: endDate });
        });
      }

      return data as CalendarEvent[];
    },
    enabled: !!family,
  });
}

export function useEventsByDate(date: Date) {
  const { family } = useAuth();

  return useQuery({
    queryKey: ['events-by-date', family?.id, date.toDateString()],
    queryFn: async () => {
      if (!family) return [];

      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          category:event_categories(*),
          assignments:event_assignments(member_id)
        `)
        .eq('family_id', family.id)
        .order('start_time', { ascending: true });

      if (error) throw error;

      // Filter and expand for the specific date
      const eventsForDate: CalendarEvent[] = [];
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      for (const event of data) {
        const instances = generateRecurringInstances(event as CalendarEvent, startOfDay, endOfDay);
        eventsForDate.push(...instances.filter(e => isSameDay(parseISO(e.start_time), date)));
      }

      return eventsForDate;
    },
    enabled: !!family,
  });
}

export function useCategories() {
  const { family } = useAuth();

  return useQuery({
    queryKey: ['categories', family?.id],
    queryFn: async () => {
      if (!family) return [];

      const { data, error } = await supabase
        .from('event_categories')
        .select('*')
        .eq('family_id', family.id)
        .order('name');

      if (error) throw error;
      return data as EventCategory[];
    },
    enabled: !!family,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const { family, currentMember } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateEventInput) => {
      if (!family || !currentMember) throw new Error('Not authenticated');

      const { assigned_members, ...eventData } = input;

      const { data: event, error } = await supabase
        .from('events')
        .insert({
          ...eventData,
          family_id: family.id,
          created_by: currentMember.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Create assignments
      if (assigned_members.length > 0) {
        const assignments = assigned_members.map(memberId => ({
          event_id: event.id,
          member_id: memberId,
        }));

        const { error: assignError } = await supabase
          .from('event_assignments')
          .insert(assignments);

        if (assignError) throw assignError;
      }

      return event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['events-by-date'] });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, assigned_members, ...input }: Partial<CreateEventInput> & { id: string }) => {
      // Update event
      const { data: event, error } = await supabase
        .from('events')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update assignments if provided
      if (assigned_members) {
        // Remove existing assignments
        await supabase.from('event_assignments').delete().eq('event_id', id);

        // Add new assignments
        if (assigned_members.length > 0) {
          const assignments = assigned_members.map(memberId => ({
            event_id: id,
            member_id: memberId,
          }));

          const { error: assignError } = await supabase
            .from('event_assignments')
            .insert(assignments);

          if (assignError) throw assignError;
        }
      }

      return event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['events-by-date'] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['events-by-date'] });
    },
  });
}
