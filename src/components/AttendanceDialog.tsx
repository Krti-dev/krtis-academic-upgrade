import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Clock, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useSupabaseData, TimetableEntry } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";

interface AttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  todaysClasses: TimetableEntry[];
  currentDate: string;
}

const AttendanceDialog = ({ open, onOpenChange, todaysClasses, currentDate }: AttendanceDialogProps) => {
  const { addAttendanceEntry } = useSupabaseData();
  const [attendanceData, setAttendanceData] = useState<{ [key: string]: { present: boolean; note: string } }>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Initialize attendance data for today's classes
    const initialData: { [key: string]: { present: boolean; note: string } } = {};
    todaysClasses.forEach(classItem => {
      initialData[classItem.id] = { present: true, note: "" };
    });
    setAttendanceData(initialData);
  }, [todaysClasses]);

  const handleAttendanceChange = (classId: string, present: boolean) => {
    setAttendanceData(prev => ({
      ...prev,
      [classId]: { ...prev[classId], present }
    }));
  };

  const handleNoteChange = (classId: string, note: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [classId]: { ...prev[classId], note }
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Check for existing attendance entries for today
      const { data: existingAttendance, error: fetchError } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', currentDate);

      if (fetchError) throw fetchError;

      const promises = todaysClasses.map(async (classItem) => {
        const attendance = attendanceData[classItem.id];
        
        // Check if attendance already exists for this subject today
        const existing = existingAttendance?.find(a => a.subject_id === classItem.subject_id);
        
        if (existing) {
          // Update existing attendance
          const { error: updateError } = await supabase
            .from('attendance')
            .update({
              present: attendance.present,
              note: attendance.note || null
            })
            .eq('id', existing.id);
            
          if (updateError) throw updateError;
          return existing;
        } else {
          // Create new attendance entry
          return addAttendanceEntry({
            subject_id: classItem.subject_id,
            date: currentDate,
            present: attendance.present,
            note: attendance.note || undefined
          });
        }
      });

      await Promise.all(promises);
      
      toast.success("Attendance recorded successfully!");
      onOpenChange(false);
    } catch (error) {
      console.error('Error recording attendance:', error);
      toast.error("Failed to record attendance");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (time: string) => {
    return new Date(`1970-01-01T${time}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (todaysClasses.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Daily Attendance
            </DialogTitle>
            <DialogDescription>
              No classes scheduled for today. Enjoy your free day! 🎉
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Mark Today's Attendance
          </DialogTitle>
          <DialogDescription>
            Please mark your attendance for all classes today ({new Date(currentDate).toLocaleDateString()})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {todaysClasses.map((classItem) => (
            <div key={classItem.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: classItem.subject?.color }}
                    />
                    <h3 className="font-semibold">{classItem.subject?.name}</h3>
                    {classItem.subject?.code && (
                      <Badge variant="secondary">{classItem.subject.code}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatTime(classItem.start_time)} - {formatTime(classItem.end_time)}
                    </div>
                    {classItem.location && (
                      <span>📍 {classItem.location}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant={attendanceData[classItem.id]?.present ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleAttendanceChange(classItem.id, true)}
                  className="flex items-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Present
                </Button>
                <Button
                  variant={!attendanceData[classItem.id]?.present ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => handleAttendanceChange(classItem.id, false)}
                  className="flex items-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Absent
                </Button>
              </div>

              <div>
                <Label htmlFor={`note-${classItem.id}`} className="text-sm">
                  Note (optional)
                </Label>
                <Textarea
                  id={`note-${classItem.id}`}
                  placeholder="Add a note about this class..."
                  value={attendanceData[classItem.id]?.note || ""}
                  onChange={(e) => handleNoteChange(classItem.id, e.target.value)}
                  className="mt-1"
                  rows={2}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1"
          >
            {submitting ? "Recording..." : "Record Attendance"}
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AttendanceDialog;