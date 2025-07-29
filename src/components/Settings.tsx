import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Settings as SettingsIcon, RefreshCw, Trash2, Calendar, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useSupabaseData } from "@/hooks/useSupabaseData";

const Settings = () => {
  const { clearTimetable, refetch } = useSupabaseData();
  const [clearing, setClearing] = useState(false);

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
              Clearing your timetable will remove all your scheduled classes and you'll need to set it up again. 
              This action cannot be undone.
            </AlertDescription>
          </Alert>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Timetable & Reset
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your current timetable
                  and you will need to set it up again from the beginning.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearTimetable}
                  disabled={clearing}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {clearing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Clearing...
                    </>
                  ) : (
                    "Yes, clear timetable"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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