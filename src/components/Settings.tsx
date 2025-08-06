import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon, RefreshCw, Trash2, Calendar, AlertTriangle, RotateCcw, Sun, Moon, Palette } from "lucide-react";
import { toast } from "sonner";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const { clearTimetable, refetch } = useSupabaseData();
  const [clearing, setClearing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.remove('light');
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleClearTimetable = async () => {
    setClearing(true);
    try {
      await clearTimetable();
      toast.success("Timetable cleared successfully!");
      // Refresh the page to show timetable setup
      window.location.reload();
    } catch (error) {
      toast.error("Failed to clear timetable");
    } finally {
      setClearing(false);
    }
  };

  const handleResetSystem = async () => {
    setClearing(true);
    try {
      // Clear both timetable and subjects
      await clearTimetable();
      await supabase.from('subjects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      toast.success("System reset successfully!");
      // Refresh the page to show timetable setup
      window.location.reload();
    } catch (error) {
      toast.error("Failed to reset system");
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center">
          <SettingsIcon className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your Academia preferences</p>
        </div>
      </div>

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize your app's appearance and theme
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <Label htmlFor="theme-toggle" className="cursor-pointer">
                {isDarkMode ? 'Dark Mode' : 'Light Mode (Fairy Theme)'}
              </Label>
            </div>
            <Switch
              id="theme-toggle"
              checked={isDarkMode}
              onCheckedChange={setIsDarkMode}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {isDarkMode 
              ? "Dark mode provides a sleek, professional appearance for focused study sessions."
              : "Light mode features whimsical fairy colors to inspire creativity and enthusiasm!"
            }
          </div>
        </CardContent>
      </Card>

      {/* Timetable Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Timetable Management
          </CardTitle>
          <CardDescription>
            Manage your class schedule and timetable
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Choose between clearing just your timetable or resetting the entire system (subjects + timetable).
              Both actions cannot be undone.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  Clear Timetable Only
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear Timetable Only?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove all scheduled classes but keep your subjects. You can reschedule your classes without re-adding subjects.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearTimetable}
                    disabled={clearing}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {clearing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Clearing...
                      </>
                    ) : (
                      "Clear Timetable"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Entire System
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Entire System?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete ALL your subjects and timetable data. You'll need to start from scratch.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleResetSystem}
                    disabled={clearing}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {clearing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      "Reset Everything"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card>
        <CardHeader>
          <CardTitle>About Academia</CardTitle>
          <CardDescription>
            Your comprehensive academic companion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Version:</strong> 1.0.0</p>
            <p><strong>Features:</strong> Study tracking, Timetable management, Attendance tracking, Focus timer</p>
            <p><strong>Data:</strong> All your data is stored securely and synced in real-time</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;