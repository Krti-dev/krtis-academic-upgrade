import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Clock, MapPin, Trash2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { useSupabaseData, Subject, TimetableEntry } from "@/hooks/useSupabaseData";

const DAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" }
];

const COLORS = [
  "#3B82F6", "#EF4444", "#10B981", "#F59E0B", 
  "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"
];

interface TimetableSetupProps {
  onComplete: () => void;
}

const TimetableSetup = ({ onComplete }: TimetableSetupProps) => {
  const { subjects, timetable, addSubject, addTimetableEntry, loading } = useSupabaseData();
  
  const [newSubject, setNewSubject] = useState({
    name: "",
    code: "",
    instructor: "",
    credits: 3,
    color: COLORS[0],
    expected_classes: 30
  });

  const [newClass, setNewClass] = useState({
    subject_id: "",
    day_of_week: 1,
    start_time: "",
    end_time: "",
    location: ""
  });

  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [classDialogOpen, setClassDialogOpen] = useState(false);

  const handleAddSubject = async () => {
    try {
      if (!newSubject.name.trim()) {
        toast.error("Subject name is required");
        return;
      }

      await addSubject({
        name: newSubject.name,
        code: newSubject.code || undefined,
        instructor: newSubject.instructor || undefined,
        credits: newSubject.credits,
        color: newSubject.color,
        expected_classes: newSubject.expected_classes
      });

      setNewSubject({
        name: "",
        code: "",
        instructor: "",
        credits: 3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        expected_classes: 30
      });
      
      setSubjectDialogOpen(false);
      toast.success("Subject added successfully!");
    } catch (error) {
      toast.error("Failed to add subject");
    }
  };

  const handleAddClass = async () => {
    try {
      if (!newClass.subject_id || !newClass.start_time || !newClass.end_time) {
        toast.error("Please fill in all required fields");
        return;
      }

      if (newClass.start_time >= newClass.end_time) {
        toast.error("End time must be after start time");
        return;
      }

      await addTimetableEntry({
        subject_id: newClass.subject_id,
        day_of_week: newClass.day_of_week,
        start_time: newClass.start_time,
        end_time: newClass.end_time,
        location: newClass.location || undefined
      });

      setNewClass({
        subject_id: "",
        day_of_week: 1,
        start_time: "",
        end_time: "",
        location: ""
      });
      
      setClassDialogOpen(false);
      toast.success("Class added to timetable!");
    } catch (error) {
      toast.error("Failed to add class");
    }
  };

  const canComplete = subjects.length > 0 && timetable.length > 0;

  const getTimetableByDay = () => {
    const dayMap: { [key: number]: TimetableEntry[] } = {};
    DAYS.forEach(day => {
      dayMap[day.value] = timetable
        .filter(entry => entry.day_of_week === day.value)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));
    });
    return dayMap;
  };

  const timetableByDay = getTimetableByDay();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Welcome to Academia! 🎓</h1>
          <p className="text-muted-foreground text-lg">
            Let's set up your timetable first. Add your subjects and class schedule to get started.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Subjects Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Your Subjects ({subjects.length})
              </CardTitle>
              <CardDescription>
                Add all the subjects you're studying this semester
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4">
                {subjects.map((subject) => (
                  <div key={subject.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <div 
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: subject.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{subject.name}</p>
                      {subject.code && (
                        <p className="text-sm text-muted-foreground">{subject.code}</p>
                      )}
                    </div>
                    {subject.credits && (
                      <span className="text-sm bg-background px-2 py-1 rounded">
                        {subject.credits} credits
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Subject
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Subject</DialogTitle>
                    <DialogDescription>
                      Enter the details for your new subject
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Subject Name *</Label>
                      <Input
                        id="name"
                        value={newSubject.name}
                        onChange={(e) => setNewSubject(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Mathematics"
                      />
                    </div>
                    <div>
                      <Label htmlFor="code">Subject Code</Label>
                      <Input
                        id="code"
                        value={newSubject.code}
                        onChange={(e) => setNewSubject(prev => ({ ...prev, code: e.target.value }))}
                        placeholder="e.g., MATH101"
                      />
                    </div>
                    <div>
                      <Label htmlFor="instructor">Instructor</Label>
                      <Input
                        id="instructor"
                        value={newSubject.instructor}
                        onChange={(e) => setNewSubject(prev => ({ ...prev, instructor: e.target.value }))}
                        placeholder="e.g., Dr. Smith"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="credits">Credits</Label>
                        <Input
                          id="credits"
                          type="number"
                          min="1"
                          max="6"
                          value={newSubject.credits}
                          onChange={(e) => setNewSubject(prev => ({ ...prev, credits: parseInt(e.target.value) || 3 }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="expected-classes">Expected Classes</Label>
                        <Input
                          id="expected-classes"
                          type="number"
                          min="10"
                          max="100"
                          value={newSubject.expected_classes}
                          onChange={(e) => setNewSubject(prev => ({ ...prev, expected_classes: parseInt(e.target.value) || 30 }))}
                          placeholder="Total classes in semester"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Color</Label>
                      <div className="flex gap-2 mt-2">
                        {COLORS.map((color) => (
                          <button
                            key={color}
                            className={`w-8 h-8 rounded-full border-2 ${newSubject.color === color ? 'border-foreground' : 'border-transparent'}`}
                            style={{ backgroundColor: color }}
                            onClick={() => setNewSubject(prev => ({ ...prev, color }))}
                          />
                        ))}
                      </div>
                    </div>
                    <Button onClick={handleAddSubject} className="w-full">
                      Add Subject
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Timetable Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Weekly Timetable
              </CardTitle>
              <CardDescription>
                Schedule your classes for each day of the week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                {DAYS.map((day) => {
                  const dayClasses = timetableByDay[day.value];
                  if (!dayClasses || dayClasses.length === 0) return null;
                  
                  return (
                    <div key={day.value} className="border border-border rounded-lg p-3">
                      <h4 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                        {day.label} ({dayClasses.length} {dayClasses.length === 1 ? 'class' : 'classes'})
                      </h4>
                      <div className="space-y-2">
                        {dayClasses.map((entry) => (
                          <div key={entry.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <div 
                              className="w-4 h-4 rounded-full flex-shrink-0"
                              style={{ backgroundColor: entry.subject?.color }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{entry.subject?.name}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <span>{entry.start_time} - {entry.end_time}</span>
                                {entry.location && (
                                  <>
                                    <span>•</span>
                                    <span>{entry.location}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {timetable.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No classes scheduled yet</p>
                  </div>
                )}
              </div>

              <Dialog open={classDialogOpen} onOpenChange={setClassDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" disabled={subjects.length === 0}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Class
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Class to Timetable</DialogTitle>
                    <DialogDescription>
                      Schedule a class for your timetable
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Subject *</Label>
                      <Select value={newClass.subject_id} onValueChange={(value) => setNewClass(prev => ({ ...prev, subject_id: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id}>
                              {subject.name} {subject.code && `(${subject.code})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Day of Week *</Label>
                      <Select value={newClass.day_of_week.toString()} onValueChange={(value) => setNewClass(prev => ({ ...prev, day_of_week: parseInt(value) }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS.map((day) => (
                            <SelectItem key={day.value} value={day.value.toString()}>
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="start-time">Start Time *</Label>
                        <Input
                          id="start-time"
                          type="time"
                          value={newClass.start_time}
                          onChange={(e) => setNewClass(prev => ({ ...prev, start_time: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="end-time">End Time *</Label>
                        <Input
                          id="end-time"
                          type="time"
                          value={newClass.end_time}
                          onChange={(e) => setNewClass(prev => ({ ...prev, end_time: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={newClass.location}
                        onChange={(e) => setNewClass(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="e.g., Room 101, Building A"
                      />
                    </div>
                    <Button onClick={handleAddClass} className="w-full">
                      Add to Timetable
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Complete Setup */}
        <Card className="border-primary/20">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-semibold mb-2">Ready to start your academic journey?</h3>
            <p className="text-muted-foreground mb-4">
              {!canComplete 
                ? "Add at least one subject and one class to continue"
                : "Your timetable is set up! You can always modify it later in settings."
              }
            </p>
            <Button 
              onClick={onComplete} 
              disabled={!canComplete}
              size="lg"
              className="px-8"
            >
              Complete Setup & Enter Academia
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TimetableSetup;