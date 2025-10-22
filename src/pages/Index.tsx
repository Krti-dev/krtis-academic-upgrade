import { useState, useEffect } from "react";
import { scheduleClassReminder, sendAttendanceReminder } from "@/utils/notifications";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Dashboard from "@/components/Dashboard";
import StudyTracker from "@/components/StudyTracker";

import Schedule from "@/components/Schedule";
import FocusTimer from "@/components/FocusTimer";
import TimetableSetup from "@/components/TimetableSetup";
import AttendanceDialog from "@/components/AttendanceDialog";
import Settings from "@/components/Settings";
import HobbyTrackerWithTimer from "@/components/HobbyTrackerWithTimer";
import BudgetTrackerImproved from "@/components/BudgetTrackerImproved";
import { SimpleGoals } from "@/components/SimpleGoals";
import StudySage from "@/components/StudySage";
import SkillsTracker from "@/components/SkillsTracker";
import { Toaster } from "sonner";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, BookOpen } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [setupComplete, setSetupComplete] = useState(false);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const { timetable, subjects, loading } = useSupabaseData();

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, user, navigate]);

  // Check if setup is complete (has subjects and timetable)
  useEffect(() => {
    if (!loading) {
      const hasSetup = subjects.length > 0 && timetable.length > 0;
      setSetupComplete(hasSetup);
    }
  }, [subjects, timetable, loading]);

  // Check for attendance prompt after 5 PM on weekdays
  useEffect(() => {
    if (!setupComplete) return;

    const checkAttendancePrompt = () => {
      const now = new Date();
      const hour = now.getHours();
      const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Only prompt on weekdays (Monday-Friday) after 5 PM
      if (dayOfWeek >= 1 && dayOfWeek <= 5 && hour >= 17) {
        const today = now.toISOString().split('T')[0];
        const todaysClasses = timetable.filter(entry => entry.day_of_week === dayOfWeek);
        
        // Check if attendance already recorded for today
        const attendanceKey = `attendance_prompted_${today}`;
        const alreadyPrompted = localStorage.getItem(attendanceKey);
        
        if (!alreadyPrompted && todaysClasses.length > 0) {
          setTimeout(() => {
            setAttendanceDialogOpen(true);
            sendAttendanceReminder();
            localStorage.setItem(attendanceKey, 'true');
          }, 2000); // Small delay to let the app load
        }
      }
    };

    checkAttendancePrompt();
    
    // Check every hour
    const interval = setInterval(checkAttendancePrompt, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [setupComplete, timetable]);

  // Schedule class reminders
  useEffect(() => {
    if (!setupComplete) return;

    const today = new Date().getDay();
    const todaysClasses = timetable.filter(entry => entry.day_of_week === today);

    todaysClasses.forEach(classEntry => {
      if (classEntry.subject) {
        scheduleClassReminder(classEntry.subject.name, classEntry.start_time, 15);
      }
    });
  }, [setupComplete, timetable]);

  const getTodaysClasses = () => {
    const today = new Date().getDay();
    return timetable.filter(entry => entry.day_of_week === today);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "study":
        return <StudyTracker />;
      case "schedule":
        return <Schedule />;
      case "focus":
        return <FocusTimer />;
      case "hobbies":
        return <HobbyTrackerWithTimer />;
      case "budget":
        return <BudgetTrackerImproved />;
      case "goals":
        return <SimpleGoals />;
      case "skills":
        return <SkillsTracker />;
      case "ai":
        return <StudySage />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <BookOpen className="w-12 h-12 text-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground">Loading your study dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  // Show timetable setup if not complete
  if (!setupComplete && !loading) {
    return <TimetableSetup onComplete={() => setSetupComplete(true)} />;
  }

  return (
    <div className="min-h-screen bg-background mesh-background">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab}>
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </Navigation>
      <main className="lg:ml-64 min-h-screen">
        <div className="p-4 lg:p-6">
          {renderContent()}
        </div>
      </main>
      <AttendanceDialog
        open={attendanceDialogOpen}
        onOpenChange={setAttendanceDialogOpen}
        todaysClasses={getTodaysClasses()}
        currentDate={new Date().toISOString().split('T')[0]}
      />
      <Toaster richColors position="top-right" />
    </div>
  );
};

export default Index;
