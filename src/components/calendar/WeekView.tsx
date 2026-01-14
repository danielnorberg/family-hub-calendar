import { useMemo } from 'react';
import { 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  eachHourOfInterval, 
  startOfDay, 
  endOfDay,
  format,
  isSameDay,
  isToday,
  parseISO,
  getHours,
  getMinutes
} from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarEvent } from '@/hooks/useEvents';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export function WeekView({ currentDate, events, onDateClick, onEventClick }: WeekViewProps) {
  const { currentMember, isParent } = useAuth();

  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentDate);
    const weekEnd = endOfWeek(currentDate);
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentDate]);

  const hours = eachHourOfInterval({ 
    start: startOfDay(currentDate), 
    end: endOfDay(currentDate) 
  }).slice(6, 22); // Show 6 AM to 10 PM

  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventDate = parseISO(event.start_time);
      const isOnDay = isSameDay(eventDate, day);
      
      if (!isParent && currentMember) {
        const isAssigned = event.assignments?.some(a => a.member_id === currentMember.id);
        return isOnDay && isAssigned;
      }
      
      return isOnDay;
    });
  };

  const getEventPosition = (event: CalendarEvent) => {
    const startTime = parseISO(event.start_time);
    const endTime = parseISO(event.end_time);
    
    const startHour = getHours(startTime) + getMinutes(startTime) / 60;
    const endHour = getHours(endTime) + getMinutes(endTime) / 60;
    
    const top = ((startHour - 6) / 16) * 100; // 6 AM is hour 0, 16 hours total
    const height = ((endHour - startHour) / 16) * 100;
    
    return { 
      top: `${Math.max(0, top)}%`, 
      height: `${Math.min(100 - Math.max(0, top), Math.max(height, 4))}%` 
    };
  };

  return (
    <div className="bg-card rounded-2xl shadow-playful border border-border overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-8 bg-muted/50 border-b">
        <div className="p-3 text-center text-sm font-semibold text-muted-foreground" />
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            onClick={() => onDateClick(day)}
            className={cn(
              'p-3 text-center cursor-pointer hover:bg-muted/50 transition-colors',
              isToday(day) && 'bg-primary/10'
            )}
          >
            <div className="text-xs text-muted-foreground">{format(day, 'EEE')}</div>
            <div className={cn(
              'text-lg font-bold w-8 h-8 flex items-center justify-center mx-auto rounded-full',
              isToday(day) && 'bg-primary text-primary-foreground'
            )}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <ScrollArea className="h-[600px]">
        <div className="grid grid-cols-8">
          {/* Time labels */}
          <div className="border-r">
            {hours.map((hour) => (
              <div key={hour.toISOString()} className="h-16 border-b text-xs text-muted-foreground p-1">
                {format(hour, 'h a')}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day) => {
            const dayEvents = getEventsForDay(day).filter(e => !e.is_all_day);
            
            return (
              <div 
                key={day.toISOString()} 
                className="relative border-r"
                onClick={() => onDateClick(day)}
              >
                {hours.map((hour) => (
                  <div 
                    key={hour.toISOString()} 
                    className="h-16 border-b hover:bg-muted/30 transition-colors cursor-pointer"
                  />
                ))}
                
                {/* Events */}
                {dayEvents.map((event) => {
                  const position = getEventPosition(event);
                  return (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                      className="absolute left-1 right-1 px-2 py-1 rounded-lg text-white text-xs cursor-pointer overflow-hidden hover:scale-[1.02] transition-transform z-10"
                      style={{ 
                        backgroundColor: event.category?.color || '#8B5CF6',
                        top: position.top,
                        height: position.height,
                        minHeight: '20px'
                      }}
                    >
                      <div className="font-semibold truncate">{event.title}</div>
                      <div className="opacity-80 truncate">
                        {format(parseISO(event.start_time), 'h:mm a')}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
