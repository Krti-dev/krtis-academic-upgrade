import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, 
  BarChart3, 
  Calendar, 
  Target, 
  Settings, 
  Menu,
  X,
  Brain,
  Clock,
  Heart,
  Wallet
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children?: React.ReactNode;
}

const Navigation = ({ activeTab, setActiveTab, children }: NavigationProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "study", label: "Study Tracker", icon: BookOpen },
    { id: "schedule", label: "Schedule", icon: Calendar },
    { id: "focus", label: "Focus Timer", icon: Brain },
    { id: "goals", label: "Goals", icon: Target },
    { id: "skills", label: "Skills", icon: Target },
    { id: "hobbies", label: "Hobbies", icon: Heart },
    { id: "budget", label: "Budget Tracker", icon: Wallet },
    { id: "ai", label: "StudySage", icon: Brain },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-background/95 backdrop-blur-sm"
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Navigation Sidebar */}
      <nav className={cn(
        "fixed left-0 top-0 h-screen w-64 bg-card/95 backdrop-blur-lg border-r border-border/50 z-40 transition-all duration-300 flex flex-col shadow-xl",
        "lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex items-center gap-3 mb-8 mt-12 lg:mt-0 px-6 pt-6">
          <div className="w-10 h-10 bg-gradient-to-br from-primary via-purple to-pink rounded-xl flex items-center justify-center shadow-lg">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">Academia</h1>
            <p className="text-xs text-muted-foreground">Smart Study Platform</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "gradient" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-12 text-left transition-all duration-200",
                    activeTab === item.id 
                      ? "bg-gradient-to-r from-primary to-purple text-white shadow-lg shadow-primary/25" 
                      : "hover:bg-accent/50 hover:translate-x-1"
                  )}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Additional children (like sign out button) */}
        {children && (
          <div className="px-6 pb-6 border-t border-border pt-6">
            {children}
          </div>
        )}
      </nav>
    </>
  );
};

export default Navigation;