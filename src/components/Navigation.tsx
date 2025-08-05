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
}

const Navigation = ({ activeTab, setActiveTab }: NavigationProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "schedule", label: "Schedule", icon: Calendar },
    { id: "focus", label: "Focus Timer", icon: Brain },
    { id: "goals", label: "Goals", icon: Target },
    { id: "hobbies", label: "Hobbies", icon: Heart },
    { id: "budget", label: "Budget Tracker", icon: Wallet },
    { id: "ai", label: "AI Assistant", icon: Clock },
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
        "fixed left-0 top-0 h-screen w-64 bg-card border-r border-border z-40 transition-transform duration-300 flex flex-col",
        "lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex items-center gap-2 mb-8 mt-12 lg:mt-0 px-6 pt-6">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold">Academia</h1>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-12",
                    activeTab === item.id && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navigation;