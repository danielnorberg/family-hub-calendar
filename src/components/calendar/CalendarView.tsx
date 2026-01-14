import { useState, useMemo } from 'react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths } from 'date-fns';
import { CalendarHeader, CalendarView as ViewType } from './CalendarHeader';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { EventForm } from './EventForm';
import { useEvents, CalendarEvent } from '@/hooks/useEvents';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function CalendarViewComponent() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('month');
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);
  const { isParent } = useAuth();

  // Calculate date range for fetching events
  const dateRange = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    return {
      start: startOfWeek(monthStart),
      end: endOfWeek(addMonths(monthEnd, 1)),
    };
  }, [currentDate]);

  const { data: events = [], isLoading } = useEvents(dateRange.start, dateRange.end);

  const handleDateClick = (date: Date) => {
    if (view === 'month') {
      setCurrentDate(date);
      setView('day');
    } else if (isParent) {
      setSelectedDate(date);
      setEditEvent(null);
      setIsEventFormOpen(true);
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    if (isParent) {
      setEditEvent(event);
      setSelectedDate(undefined);
      setIsEventFormOpen(true);
    }
  };

  const handleAddEvent = () => {
    setSelectedDate(currentDate);
    setEditEvent(null);
    setIsEventFormOpen(true);
  };

  return (
    <div className="space-y-4">
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        onDateChange={setCurrentDate}
        onViewChange={setView}
      />

      {isLoading ? (
        <div className="flex items-center justify-center h-[500px] bg-card rounded-2xl">
          <div className="text-center">
            <div className="text-4xl animate-bounce-gentle mb-2">📅</div>
            <p className="text-muted-foreground">Loading calendar...</p>
          </div>
        </div>
      ) : (
        <>
          {view === 'month' && (
            <MonthView
              currentDate={currentDate}
              events={events}
              onDateClick={handleDateClick}
              onEventClick={handleEventClick}
            />
          )}
          {view === 'week' && (
            <WeekView
              currentDate={currentDate}
              events={events}
              onDateClick={handleDateClick}
              onEventClick={handleEventClick}
            />
          )}
          {view === 'day' && (
            <DayView
              currentDate={currentDate}
              events={events}
              onEventClick={handleEventClick}
            />
          )}
        </>
      )}

      {/* Floating add button for parents */}
      {isParent && (
        <Button
          onClick={handleAddEvent}
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg animate-pulse-ring"
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      <EventForm
        isOpen={isEventFormOpen}
        onClose={() => {
          setIsEventFormOpen(false);
          setEditEvent(null);
          setSelectedDate(undefined);
        }}
        selectedDate={selectedDate}
        editEvent={editEvent}
      />
    </div>
  );
}
