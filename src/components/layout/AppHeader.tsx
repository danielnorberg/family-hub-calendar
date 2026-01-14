import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar, Users, LogOut, Settings } from 'lucide-react';

interface AppHeaderProps {
  activeTab: 'calendar' | 'family';
  onTabChange: (tab: 'calendar' | 'family') => void;
}

export function AppHeader({ activeTab, onTabChange }: AppHeaderProps) {
  const { currentMember, family, signOut, isParent, setCurrentMember } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSwitchUser = () => {
    setCurrentMember(null);
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="text-3xl">📅</div>
            <div>
              <h1 className="font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {family?.name || 'Family Calendar'}
              </h1>
              <p className="text-xs text-muted-foreground">
                {isParent ? 'Parent View' : 'Kid View'}
              </p>
            </div>
          </div>

          {/* Navigation - Only for parents */}
          {isParent && (
            <nav className="hidden sm:flex bg-muted rounded-full p-1">
              <Button
                variant={activeTab === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onTabChange('calendar')}
                className="rounded-full gap-2"
              >
                <Calendar className="h-4 w-4" />
                Calendar
              </Button>
              <Button
                variant={activeTab === 'family' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onTabChange('family')}
                className="rounded-full gap-2"
              >
                <Users className="h-4 w-4" />
                Family
              </Button>
            </nav>
          )}

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 h-10 px-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback 
                    className="text-lg"
                    style={{ backgroundColor: currentMember?.color || '#8B5CF6' }}
                  >
                    {currentMember?.avatar_emoji || '👤'}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline font-medium">
                  {currentMember?.name || 'User'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{currentMember?.avatar_emoji}</span>
                  <span>{currentMember?.name}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Mobile navigation for parents */}
              {isParent && (
                <>
                  <DropdownMenuItem onClick={() => onTabChange('calendar')} className="sm:hidden">
                    <Calendar className="h-4 w-4 mr-2" />
                    Calendar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onTabChange('family')} className="sm:hidden">
                    <Users className="h-4 w-4 mr-2" />
                    Family Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="sm:hidden" />
                </>
              )}

              {!isParent && (
                <DropdownMenuItem onClick={handleSwitchUser}>
                  <Settings className="h-4 w-4 mr-2" />
                  Switch User
                </DropdownMenuItem>
              )}

              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
