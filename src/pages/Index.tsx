import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Dashboard from "@/components/Dashboard";
import StudyTracker from "@/components/StudyTracker";
import Schedule from "@/components/Schedule";
import FocusTimer from "@/components/FocusTimer";
import TimetableSetup from "@/components/TimetableSetup";
import AttendanceDialog from "@/components/AttendanceDialog";
import Settings from "@/components/Settings";
import HobbyTracker from "@/components/HobbyTracker";
import BudgetTracker from "@/components/BudgetTracker";
import { Goals } from "@/components/Goals";
import { Toaster } from "sonner";
import { useSupabaseData } from "@/hooks/useSupabaseData";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [setupComplete, setSetupComplete] = useState(false);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const { timetable, subjects, loading } = useSupabaseData();

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
        return <HobbyTracker />;
      case "budget":
        return <BudgetTracker />;
      case "goals":
        return <Goals />;
      case "ai":
        return <div className="p-6">AI Assistant feature coming soon!</div>;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  // Show timetable setup if not complete
  if (!setupComplete && !loading) {
    return <TimetableSetup onComplete={() => setSetupComplete(true)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="lg:ml-64 p-4 lg:p-6">
        {renderContent()}
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
