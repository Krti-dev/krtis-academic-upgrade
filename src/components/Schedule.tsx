import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Target
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CalendarEvent {
  id: string;
  title: string;
  goalId?: string;
  goalName?: string;
  date: string;
  startTime: string;
  endTime: string;
  description?: string;
  type: "study" | "exam" | "assignment" | "break" | "goal-task";
  priority: "low" | "medium" | "high";
  completed?: boolean;
  repeat?: "none" | "daily" | "weekly" | "weekdays" | "weekends";
}

interface Goal {
  id: string;
  title: string;
  description: string | null;
  category: string;
  target_date: string | null;
  completed: boolean;
  created_at: string;
}

const Schedule = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  
  const [newEvent, setNewEvent] = useState<Partial<CalendarEvent>>({
    title: "",
    goalId: "",
    goalName: "",
    date: "",
    startTime: "",
    endTime: "",
    description: "",
    type: "study",
    priority: "medium",
    repeat: "none"
  });

  // Time slots from 6 AM to 11 PM in 1-hour intervals
  const timeSlots = [];
  for (let hour = 6; hour <= 23; hour++) {
    const time = `${hour.toString().padStart(2, '0')}:00`;
    timeSlots.push(time);
  }

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('study_goals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  const addTaskToGoal = async (goalId: string, taskText: string) => {
    try {
      // Get current goal data
      const { data: goalData, error: fetchError } = await supabase
        .from('study_goals')
        .select('description')
        .eq('id', goalId)
        .single();

      if (fetchError) throw fetchError;

      // Parse existing tasks or create new array
      let tasks = [];
      try {
        if (goalData.description) {
          const parsed = JSON.parse(goalData.description);
          tasks = Array.isArray(parsed) ? parsed : [];
        }
      } catch {
        tasks = [];
      }

      // Add new task
      const newTask = {
        id: Date.now().toString(),
        text: taskText,
        completed: false
      };
      tasks.push(newTask);

      // Update goal with new tasks
      const { error: updateError } = await supabase
        .from('study_goals')
        .update({ description: JSON.stringify(tasks) })
        .eq('id', goalId);

      if (updateError) throw updateError;
      
      toast.success("Task added to goal successfully!");
    } catch (error) {
      console.error('Error adding task to goal:', error);
      toast.error("Failed to add task to goal");
    }
  };

  const getWeekDates = () => {
    const startOfWeek = new Date(currentWeek);
    const dayOfWeek = startOfWeek.getDay();
    const difference = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Start from Monday
    startOfWeek.setDate(startOfWeek.getDate() + difference);

    const week = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      week.push(date.toISOString().split('T')[0]);
    }
    return week;
  };

  const getEventsForSlot = (date: string, time: string) => {
    return events.filter(event => {
      if (event.date !== date) return false;
      const eventStart = event.startTime;
      const eventEnd = event.endTime;
      return time >= eventStart && time < eventEnd;
    });
  };

  const handleSlotClick = (date: string, time: string) => {
    setSelectedSlot({ date, time });
    const endTime = addMinutesToTime(time, 60); // Default 1-hour slot
    setNewEvent({
      title: "",
      goalId: "",
      goalName: "",
      date,
      startTime: time,
      endTime,
      description: "",
      type: "study",
      priority: "medium"
    });
    setEditingEvent(null);
    setIsDialogOpen(true);
  };

  const handleDrop = (e: React.DragEvent, date: string, time: string) => {
    e.preventDefault();
    try {
      const eventData = JSON.parse(e.dataTransfer.getData('text/plain'));
      const updatedEvent = {
        ...eventData,
        date,
        startTime: time,
        endTime: addMinutesToTime(time, 60) // Keep same duration for now
      };
      
      setEvents(events.map(evt => evt.id === eventData.id ? updatedEvent : evt));
      toast.success("Event moved successfully!");
    } catch (error) {
      console.error('Error moving event:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const addMinutesToTime = (time: string, minutes: number) => {
    const [hours, mins] = time.split(':').map(Number);
    const totalMins = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMins / 60) % 24;
    const newMins = totalMins % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  };

  const handleSaveEvent = async () => {
    if (!newEvent.title) {
      toast.error("Please enter a title");
      return;
    }

    const eventToSave: CalendarEvent = {
      id: editingEvent ? editingEvent.id : Date.now().toString(),
      title: newEvent.title!,
      goalId: newEvent.goalId,
      goalName: newEvent.goalName,
      date: newEvent.date!,
      startTime: newEvent.startTime!,
      endTime: newEvent.endTime!,
      description: newEvent.description,
      type: newEvent.type!,
      priority: newEvent.priority!,
      completed: false
    };

    if (editingEvent) {
      setEvents(events.map(e => e.id === editingEvent.id ? eventToSave : e));
      toast.success("Event updated successfully!");
    } else {
      setEvents([...events, eventToSave]);
      toast.success("Event added successfully!");
      
      // Add task to goal if goal is selected
      if (newEvent.goalId && newEvent.title) {
        await addTaskToGoal(newEvent.goalId, newEvent.title);
      }
    }

    setIsDialogOpen(false);
    setEditingEvent(null);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setNewEvent(event);
    setIsDialogOpen(true);
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(events.filter(e => e.id !== eventId));
    toast.success("Event deleted successfully!");
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "study": return "bg-blue-100 border-blue-300 text-blue-800";
      case "exam": return "bg-red-100 border-red-300 text-red-800";
      case "assignment": return "bg-yellow-100 border-yellow-300 text-yellow-800";
      case "break": return "bg-green-100 border-green-300 text-green-800";
      case "goal-task": return "bg-purple-100 border-purple-300 text-purple-800";
      default: return "bg-gray-100 border-gray-300 text-gray-800";
    }
  };

  const formatTimeRange = (start: string, end: string) => {
    return `${start} - ${end}`;
  };

  const weekDates = getWeekDates();
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Schedule</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newWeek = new Date(currentWeek);
              newWeek.setDate(currentWeek.getDate() - 7);
              setCurrentWeek(newWeek);
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="text-sm font-medium px-4">
            {currentWeek.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newWeek = new Date(currentWeek);
              newWeek.setDate(currentWeek.getDate() + 7);
              setCurrentWeek(newWeek);
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Button
            onClick={() => setCurrentWeek(new Date())}
            size="sm"
          >
            Today
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-8 border-b">
            <div className="p-3 border-r bg-muted/50 w-[80px] flex-shrink-0">
              <span className="text-xs font-medium">Time</span>
            </div>
            {weekDates.map((date, index) => {
              const dateObj = new Date(date);
              const isToday = date === new Date().toISOString().split('T')[0];
              
              return (
                <div 
                  key={date} 
                  className={`p-3 border-r text-center flex-1 ${isToday ? 'bg-primary/10' : ''}`}
                >
                  <div className="text-xs font-medium">{dayNames[index]}</div>
                  <div className={`text-sm ${isToday ? 'font-bold text-primary' : ''}`}>
                    {dateObj.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="max-h-[600px] overflow-y-auto relative">
            {timeSlots.map((time) => {
              const currentTime = new Date();
              const currentTimeString = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
              const currentHour = currentTime.getHours();
              const timeHour = parseInt(time.split(':')[0]);
              const isCurrentTimeSlot = timeHour === currentHour;
              const today = new Date().toISOString().split('T')[0];
              
              return (
                <div key={time} className="grid grid-cols-8 border-b border-muted/30 relative">
                  <div className="p-3 border-r bg-muted/20 text-xs text-muted-foreground w-[80px] flex-shrink-0">
                    {time}
                  </div>
                  {weekDates.map((date) => {
                    const slotEvents = getEventsForSlot(date, time);
                    const isToday = date === today;
                    const showCurrentTimeMarker = isToday && isCurrentTimeSlot;
                    
                    return (
                      <div
                        key={`${date}-${time}`}
                        className="p-1 border-r min-h-[60px] cursor-pointer hover:bg-muted/50 transition-colors relative flex-1"
                        onClick={() => handleSlotClick(date, time)}
                        onDrop={(e) => handleDrop(e, date, time)}
                        onDragOver={handleDragOver}
                      >
                        {showCurrentTimeMarker && (
                          <div 
                            className="absolute left-0 right-0 h-0.5 bg-red-500 z-20"
                            style={{ 
                              top: `${(currentTime.getMinutes() / 60) * 100}%`
                            }}
                          >
                            <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full"></div>
                          </div>
                        )}
                        {slotEvents.map((event) => (
                          <div
                            key={event.id}
                            className={`p-1 rounded text-xs mb-1 border cursor-pointer ${getTypeColor(event.type)} transition-all hover:shadow-sm`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditEvent(event);
                            }}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', JSON.stringify(event));
                            }}
                          >
                            <div className="font-medium truncate">{event.title}</div>
                            <div className="text-xs opacity-75">
                              {formatTimeRange(event.startTime, event.endTime)}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Event Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh]">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-lg">
              {editingEvent ? "Edit Event" : "Add New Event"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-1">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-sm">Title *</Label>
              <Input
                id="title"
                value={newEvent.title || ""}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="Enter event title"
                className="h-8"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="goal" className="text-sm">Link to Goal (Optional)</Label>
              <Select
                value={newEvent.goalId || ""}
                onValueChange={(value) => {
                  const selectedGoal = goals.find(g => g.id === value);
                  setNewEvent({ 
                    ...newEvent, 
                    goalId: value,
                    goalName: selectedGoal?.title || "",
                    type: value ? "goal-task" : "study"
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a goal (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {goals.map((goal) => (
                    <SelectItem key={goal.id} value={goal.id}>
                      <div className="flex items-center gap-2">
                        <Target className="h-3 w-3" />
                        {goal.title}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="startTime" className="text-sm">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={newEvent.startTime || ""}
                  onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                  className="h-8"
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="endTime" className="text-sm">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={newEvent.endTime || ""}
                  onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                  className="h-8"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="type" className="text-sm">Type</Label>
                <Select
                  value={newEvent.type || "study"}
                  onValueChange={(value) => setNewEvent({ ...newEvent, type: value as CalendarEvent["type"] })}
                  disabled={!!newEvent.goalId}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="study">Study Session</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="break">Break</SelectItem>
                    <SelectItem value="goal-task">Goal Task</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="priority" className="text-sm">Priority</Label>
                <Select
                  value={newEvent.priority || "medium"}
                  onValueChange={(value) => setNewEvent({ ...newEvent, priority: value as CalendarEvent["priority"] })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="repeat" className="text-sm">Repeat Schedule</Label>
              <Select
                value={newEvent.repeat || "none"}
                onValueChange={(value) => setNewEvent({ ...newEvent, repeat: value as CalendarEvent["repeat"] })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No repeat</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly (same day)</SelectItem>
                  <SelectItem value="weekdays">Weekdays only</SelectItem>
                  <SelectItem value="weekends">Weekends only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm">Description</Label>
              <Textarea
                id="description"
                value={newEvent.description || ""}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Add notes or description..."
                rows={2}
                className="text-sm"
              />
            </div>
          </div>
            
          <div className="flex gap-2 pt-3 border-t">
            <Button onClick={handleSaveEvent} className="flex-1 h-8">
              {editingEvent ? "Update Event" : "Add Event"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              className="flex-1 h-8"
            >
              Cancel
            </Button>
            {editingEvent && (
              <Button
                variant="destructive"
                onClick={() => {
                  handleDeleteEvent(editingEvent.id);
                  setIsDialogOpen(false);
                }}
                className="h-8 px-3"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Schedule;