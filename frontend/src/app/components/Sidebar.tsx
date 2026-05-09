import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Calendar, 
  Clock, 
  Newspaper, 
  Mail, 
  BookOpen, 
  Settings, 
  LogOut,
  Sparkles,
  Brain,
  Moon,
  Sun,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Job Finder', path: '/job-finder', icon: Briefcase },
  { name: 'Availability', path: '/availability', icon: Clock },
  { name: 'Calendar', path: '/calendar', icon: Calendar },
  { name: 'Daily News', path: '/news', icon: Newspaper },
  { name: 'Smart Email', path: '/email', icon: Mail },
  { name: 'Classroom', path: '/classroom', icon: BookOpen },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();
  const { logout } = useAuth();
  const { mode, toggleMode } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Floating Sidebar */}
      <div 
        className={`fixed left-4 top-4 bottom-4 z-50 transition-all duration-300 ease-in-out ${
          isExpanded ? 'w-64' : 'w-16'
        }`}
      >
        <div className="h-full bg-background rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden">
          
          {/* Toggle Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="absolute -right-3 top-8 w-6 h-6 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl border-2 border-primary transition-all z-10"
          >
            {isExpanded ? (
              <ChevronLeft className="w-4 h-4 text-primary" />
            ) : (
              <ChevronRight className="w-4 h-4 text-primary" />
            )}
          </button>

          {/* Logo Section */}
          <div className="p-4 border-b border-border">
            <Link 
              to="/dashboard" 
              className="flex items-center gap-3 group"
              onClick={() => !isExpanded && setIsExpanded(true)}
            >
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative bg-primary p-2 rounded-xl">
                  <Brain className="w-6 h-6 text-primary-foreground" />
                  <Sparkles className="w-3 h-3 text-yellow-300 absolute -top-1 -right-1" />
                </div>
              </div>
              {isExpanded && (
                <div className="overflow-hidden">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent whitespace-nowrap">
                    AllignAI
                  </h1>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">Smart Productivity</p>
                </div>
              )}
            </Link>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => !isExpanded && setIsExpanded(true)}
                  className={`
                    flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                    group relative overflow-hidden
                    ${isExpanded ? '' : 'justify-center'}
                    ${isActive 
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' 
                      : 'text-muted-foreground hover:bg-primary/10 dark:hover:bg-card text-foreground'
                    }
                  `}
                  title={!isExpanded ? item.name : ''}
                >
                  {/* Glow effect for active item */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 blur-xl opacity-20 animate-pulse"></div>
                  )}
                  
                  <Icon className={`w-5 h-5 relative z-10 flex-shrink-0 ${isActive ? '' : 'group-hover:scale-110 transition-transform'}`} />
                  
                  {isExpanded && (
                    <span className="relative z-10 text-sm whitespace-nowrap">{item.name}</span>
                  )}
                  
                  {/* Hover glow */}
                  {!isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Theme Toggle & Logout */}
          <div className="p-3 border-t border-border space-y-1">
            <button
              onClick={toggleMode}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:bg-primary/10 dark:hover:bg-card hover:text-foreground transition-all duration-200 group ${
                isExpanded ? '' : 'justify-center'
              }`}
              title={!isExpanded ? (mode === 'light' ? 'Dark Mode' : 'Light Mode') : ''}
            >
              {mode === 'light' ? (
                <Moon className="w-5 h-5 group-hover:scale-110 transition-transform flex-shrink-0" />
              ) : (
                <Sun className="w-5 h-5 group-hover:scale-110 transition-transform flex-shrink-0" />
              )}
              {isExpanded && (
                <span className="text-sm whitespace-nowrap">{mode === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
              )}
            </button>
            
            <button
              onClick={logout}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-muted-foreground hover:bg-red-100 dark:hover:bg-destructive/20 hover:text-red-600 dark:hover:text-destructive transition-all duration-200 group ${
                isExpanded ? '' : 'justify-center'
              }`}
              title={!isExpanded ? 'Logout' : ''}
            >
              <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform flex-shrink-0" />
              {isExpanded && (
                <span className="text-sm whitespace-nowrap">Logout</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--primary);
        }
      `}</style>
    </>
  );
}