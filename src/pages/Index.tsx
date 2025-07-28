import { useState } from "react";
import Navigation from "@/components/Navigation";
import Dashboard from "@/components/Dashboard";
import StudyTracker from "@/components/StudyTracker";
import Schedule from "@/components/Schedule";
import FocusTimer from "@/components/FocusTimer";
import { Toaster } from "sonner";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

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
      case "goals":
        return <div className="p-6">Goals feature coming soon!</div>;
      case "ai":
        return <div className="p-6">AI Assistant feature coming soon!</div>;
      case "settings":
        return <div className="p-6">Settings feature coming soon!</div>;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="lg:ml-64 p-4 lg:p-6">
        {renderContent()}
      </main>
      <Toaster richColors position="top-right" />
    </div>
  );
};

export default Index;
