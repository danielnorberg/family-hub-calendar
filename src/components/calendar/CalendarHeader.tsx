import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar, CalendarDays, CalendarRange } from 'lucide-react';

export type CalendarView = 'month' | 'week' | 'day';

interface CalendarHeaderProps {
  currentDate: Date;
  view: CalendarView;
  onDateChange: (date: Date) => void;
  onViewChange: (view: CalendarView) => void;
}

export function CalendarHeader({ currentDate, view, onDateChange, onViewChange }: CalendarHeaderProps) {
  const navigatePrev = () => {
    switch (view) {
      case 'month':
        onDateChange(subMonths(currentDate, 1));
        break;
      case 'week':
        onDateChange(subWeeks(currentDate, 1));
        break;
      case 'day':
        onDateChange(subDays(currentDate, 1));
        break;
    }
  };

  const navigateNext = () => {
    switch (view) {
      case 'month':
        onDateChange(addMonths(currentDate, 1));
        break;
      case 'week':
        onDateChange(addWeeks(currentDate, 1));
        break;
      case 'day':
        onDateChange(addDays(currentDate, 1));
        break;
    }
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const getTitle = () => {
    switch (view) {
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      case 'week':
        return `Week of ${format(currentDate, 'MMM d, yyyy')}`;
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy');
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-card rounded-2xl shadow-playful border border-border">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={navigatePrev}
          className="rounded-full h-10 w-10"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl sm:text-2xl font-bold min-w-[200px] text-center">
          {getTitle()}
        </h2>
        <Button
          variant="outline"
          size="icon"
          onClick={navigateNext}
          className="rounded-full h-10 w-10"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={goToToday}
          className="rounded-full"
        >
          Today
        </Button>
        
        <div className="flex bg-muted rounded-full p-1">
          <Button
            variant={view === 'month' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('month')}
            className="rounded-full gap-1"
          >
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Month</span>
          </Button>
          <Button
            variant={view === 'week' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('week')}
            className="rounded-full gap-1"
          >
            <CalendarRange className="h-4 w-4" />
            <span className="hidden sm:inline">Week</span>
          </Button>
          <Button
            variant={view === 'day' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('day')}
            className="rounded-full gap-1"
          >
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">Day</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
