import { useMemo } from 'react';
import { 
  format, 
  parseISO, 
  eachHourOfInterval, 
  startOfDay, 
  endOfDay,
  isSameDay,
  getHours,
  getMinutes
} from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarEvent } from '@/hooks/useEvents';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

export function DayView({ currentDate, events, onEventClick }: DayViewProps) {
  const { currentMember, isParent } = useAuth();
  const { data: members } = useFamilyMembers();

  const hours = eachHourOfInterval({ 
    start: startOfDay(currentDate), 
    end: endOfDay(currentDate) 
  }).slice(6, 22);

  const dayEvents = useMemo(() => {
    return events.filter(event => {
      const eventDate = parseISO(event.start_time);
      const isOnDay = isSameDay(eventDate, currentDate);
      
      if (!isParent && currentMember) {
        const isAssigned = event.assignments?.some(a => a.member_id === currentMember.id);
        return isOnDay && isAssigned;
      }
      
      return isOnDay;
    });
  }, [events, currentDate, isParent, currentMember]);

  const allDayEvents = dayEvents.filter(e => e.is_all_day);
  const timedEvents = dayEvents.filter(e => !e.is_all_day);

  const getEventPosition = (event: CalendarEvent) => {
    const startTime = parseISO(event.start_time);
    const endTime = parseISO(event.end_time);
    
    const startHour = getHours(startTime) + getMinutes(startTime) / 60;
    const endHour = getHours(endTime) + getMinutes(endTime) / 60;
    
    const top = ((startHour - 6) / 16) * 100;
    const height = ((endHour - startHour) / 16) * 100;
    
    return { 
      top: `${Math.max(0, top)}%`, 
      height: `${Math.min(100 - Math.max(0, top), Math.max(height, 6))}%` 
    };
  };

  const getAssignedMembers = (event: CalendarEvent) => {
    if (!event.assignments || !members) return [];
    return event.assignments
      .map(a => members.find(m => m.id === a.member_id))
      .filter(Boolean);
  };

  return (
    <div className="bg-card rounded-2xl shadow-playful border border-border overflow-hidden">
      {/* All-day events */}
      {allDayEvents.length > 0 && (
        <div className="p-4 border-b bg-muted/30">
          <div className="text-xs font-semibold text-muted-foreground mb-2">ALL DAY</div>
          <div className="flex flex-wrap gap-2">
            {allDayEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => onEventClick(event)}
                className="px-4 py-2 rounded-xl text-white font-medium cursor-pointer hover:scale-105 transition-transform flex items-center gap-2"
                style={{ backgroundColor: event.category?.color || '#8B5CF6' }}
              >
                {event.category?.icon && <span>{event.category.icon}</span>}
                {event.title}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Time grid */}
      <ScrollArea className="h-[600px]">
        <div className="flex">
          {/* Time labels */}
          <div className="w-20 flex-shrink-0 border-r bg-muted/20">
            {hours.map((hour) => (
              <div key={hour.toISOString()} className="h-20 border-b text-sm text-muted-foreground p-2 font-medium">
                {format(hour, 'h a')}
              </div>
            ))}
          </div>

          {/* Events area */}
          <div className="flex-1 relative">
            {hours.map((hour) => (
              <div key={hour.toISOString()} className="h-20 border-b hover:bg-muted/20 transition-colors" />
            ))}
            
            {/* Timed events */}
            {timedEvents.map((event) => {
              const position = getEventPosition(event);
              const assignedMembers = getAssignedMembers(event);
              
              return (
                <div
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className="absolute left-2 right-2 px-4 py-3 rounded-xl text-white cursor-pointer overflow-hidden hover:scale-[1.01] transition-transform shadow-lg"
                  style={{ 
                    backgroundColor: event.category?.color || '#8B5CF6',
                    top: position.top,
                    height: position.height,
                    minHeight: '50px'
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-lg flex items-center gap-2">
                        {event.category?.icon && <span>{event.category.icon}</span>}
                        {event.title}
                      </div>
                      <div className="opacity-90 text-sm mt-1">
                        {format(parseISO(event.start_time), 'h:mm a')} - {format(parseISO(event.end_time), 'h:mm a')}
                      </div>
                      {event.location && (
                        <div className="opacity-80 text-sm mt-1">📍 {event.location}</div>
                      )}
                    </div>
                    
                    {/* Assigned members avatars */}
                    {assignedMembers.length > 0 && (
                      <div className="flex -space-x-2">
                        {assignedMembers.slice(0, 3).map((member) => (
                          <div
                            key={member!.id}
                            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-lg border-2 border-white/30"
                            title={member!.name}
                          >
                            {member!.avatar_emoji}
                          </div>
                        ))}
                        {assignedMembers.length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold border-2 border-white/30">
                            +{assignedMembers.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
