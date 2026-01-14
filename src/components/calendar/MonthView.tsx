import { useMemo } from 'react';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  format,
  parseISO
} from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarEvent } from '@/hooks/useEvents';
import { useAuth } from '@/contexts/AuthContext';

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export function MonthView({ currentDate, events, onDateClick, onEventClick }: MonthViewProps) {
  const { currentMember, isParent } = useAuth();

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventDate = parseISO(event.start_time);
      const isOnDay = isSameDay(eventDate, day);
      
      // If child, only show their events
      if (!isParent && currentMember) {
        const isAssigned = event.assignments?.some(a => a.member_id === currentMember.id);
        return isOnDay && isAssigned;
      }
      
      return isOnDay;
    });
  };

  return (
    <div className="bg-card rounded-2xl shadow-playful border border-border overflow-hidden">
      {/* Week day headers */}
      <div className="grid grid-cols-7 bg-muted/50">
        {weekDays.map((day) => (
          <div
            key={day}
            className="p-3 text-center text-sm font-semibold text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isDayToday = isToday(day);

          return (
            <div
              key={index}
              onClick={() => onDateClick(day)}
              className={cn(
                'min-h-[100px] p-2 border-t border-l first:border-l-0 cursor-pointer transition-colors hover:bg-muted/30',
                !isCurrentMonth && 'bg-muted/20 text-muted-foreground',
                isDayToday && 'bg-primary/5'
              )}
            >
              <div className={cn(
                'text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full',
                isDayToday && 'bg-primary text-primary-foreground'
              )}>
                {format(day, 'd')}
              </div>
              
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                    className={cn(
                      'text-xs px-2 py-1 rounded-md truncate cursor-pointer transition-transform hover:scale-[1.02]',
                      'text-white font-medium'
                    )}
                    style={{ backgroundColor: event.category?.color || '#8B5CF6' }}
                    title={event.title}
                  >
                    {event.is_all_day ? '' : format(parseISO(event.start_time), 'h:mm ')}
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground font-medium pl-2">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
