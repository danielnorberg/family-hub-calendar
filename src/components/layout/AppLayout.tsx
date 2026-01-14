import { useState } from 'react';
import { AppHeader } from './AppHeader';
import { CalendarViewComponent } from '@/components/calendar/CalendarView';
import { FamilySettings } from '@/components/family/FamilySettings';
import { useAuth } from '@/contexts/AuthContext';

export function AppLayout() {
  const [activeTab, setActiveTab] = useState<'calendar' | 'family'>('calendar');
  const { isParent } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <AppHeader activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="container mx-auto px-4 py-6">
        {activeTab === 'calendar' && <CalendarViewComponent />}
        {activeTab === 'family' && isParent && <FamilySettings />}
      </main>
    </div>
  );
}
