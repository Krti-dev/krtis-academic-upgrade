import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Edit,
  Trash2,
  BookOpen,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";

interface Event {
  id: number;
  title: string;
  subject: string;
  type: "study" | "exam" | "assignment" | "break";
  date: string;
  time: string;
  duration: number;
  description?: string;
  priority: "low" | "medium" | "high";
  completed?: boolean;
}

const Schedule = () => {
  const [events, setEvents] = useState<Event[]>([
    {
      id: 1,
      title: "Mathematics Study Session",
      subject: "Mathematics",
      type: "study",
      date: "2024-01-21",
      time: "09:00",
      duration: 120,
      description: "Algebra and calculus review",
      priority: "high"
    },
    {
      id: 2,
      title: "Physics Exam",
      subject: "Physics",
      type: "exam",
      date: "2024-01-22",
      time: "14:00",
      duration: 180,
      description: "Chapter 1-5 mechanics",
      priority: "high"
    },
    {
      id: 3,
      title: "Chemistry Assignment",
      subject: "Chemistry",
      type: "assignment",
      date: "2024-01-23",
      time: "10:00",
      duration: 90,
      description: "Lab report submission",
      priority: "medium"
    }
  ]);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    title: "",
    subject: "",
    type: "study",
    date: selectedDate,
    time: "09:00",
    duration: 60,
    description: "",
    priority: "medium"
  });

  const subjects = ["Mathematics", "Physics", "Chemistry", "Biology", "History", "Literature"];
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case "study": return "primary";
      case "exam": return "destructive";
      case "assignment": return "warning";
      case "break": return "success";
      default: return "secondary";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high": return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "medium": return <Clock className="h-4 w-4 text-warning" />;
      case "low": return <CheckCircle className="h-4 w-4 text-success" />;
      default: return null;
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleSaveEvent = () => {
    if (!newEvent.title || !newEvent.subject) {
      toast.error("Please fill in all required fields");
      return;
    }

    const eventToSave = {
      ...newEvent,
      id: editingEvent ? editingEvent.id : Date.now(),
    } as Event;

    if (editingEvent) {
      setEvents(events.map(e => e.id === editingEvent.id ? eventToSave : e));
      toast.success("Event updated successfully!");
    } else {
      setEvents([...events, eventToSave]);
      toast.success("Event added successfully!");
    }

    setIsDialogOpen(false);
    setEditingEvent(null);
    setNewEvent({
      title: "",
      subject: "",
      type: "study",
      date: selectedDate,
      time: "09:00",
      duration: 60,
      description: "",
      priority: "medium"
    });
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setNewEvent(event);
    setIsDialogOpen(true);
  };

  const handleDeleteEvent = (eventId: number) => {
    setEvents(events.filter(e => e.id !== eventId));
    toast.success("Event deleted successfully!");
  };

  const toggleEventCompletion = (eventId: number) => {
    setEvents(events.map(e => 
      e.id === eventId ? { ...e, completed: !e.completed } : e
    ));
  };

  const getEventsForDate = (date: string) => {
    return events.filter(event => event.date === date);
  };

  const getWeekDates = () => {
    const today = new Date();
    const week = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      week.push(date.toISOString().split('T')[0]);
    }
    
    return week;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Study Schedule</h1>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingEvent(null);
              setNewEvent({
                title: "",
                subject: "",
                type: "study",
                date: selectedDate,
                time: "09:00",
                duration: 60,
                description: "",
                priority: "medium"
              });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingEvent ? "Edit Event" : "Add New Event"}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={newEvent.title || ""}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Enter event title"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Select
                    value={newEvent.subject || ""}
                    onValueChange={(value) => setNewEvent({ ...newEvent, subject: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={newEvent.type || "study"}
                    onValueChange={(value) => setNewEvent({ ...newEvent, type: value as Event["type"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="study">Study Session</SelectItem>
                      <SelectItem value="exam">Exam</SelectItem>
                      <SelectItem value="assignment">Assignment</SelectItem>
                      <SelectItem value="break">Break</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newEvent.date || ""}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={newEvent.time || ""}
                    onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={newEvent.duration || ""}
                    onChange={(e) => setNewEvent({ ...newEvent, duration: parseInt(e.target.value) })}
                    min="15"
                    step="15"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={newEvent.priority || "medium"}
                    onValueChange={(value) => setNewEvent({ ...newEvent, priority: value as Event["priority"] })}
                  >
                    <SelectTrigger>
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
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newEvent.description || ""}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Add notes or description..."
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveEvent} className="flex-1">
                  {editingEvent ? "Update Event" : "Add Event"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="week" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="week">Week View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="week" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
            {getWeekDates().map((date) => {
              const dayEvents = getEventsForDate(date);
              const dateObj = new Date(date);
              const isToday = date === new Date().toISOString().split('T')[0];
              
              return (
                <Card 
                  key={date} 
                  className={`cursor-pointer transition-colors ${
                    isToday ? 'bg-primary/5 border-primary/20' : ''
                  }`}
                  onClick={() => setSelectedDate(date)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      {dateObj.toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                      {isToday && <Badge variant="outline" className="ml-2 text-xs">Today</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {dayEvents.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No events</p>
                    ) : (
                      dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className="p-2 rounded border text-xs"
                        >
                          <div className="font-medium truncate">{event.title}</div>
                          <div className="text-muted-foreground">
                            {event.time} • {formatTime(event.duration)}
                          </div>
                        </div>
                      ))
                    )}
                    {dayEvents.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{dayEvents.length - 3} more
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <div className="space-y-4">
            {events.map((event) => (
              <Card key={event.id} className={event.completed ? "opacity-60" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={event.completed || false}
                        onChange={() => toggleEventCompletion(event.id)}
                        className="w-4 h-4"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className={`font-medium ${event.completed ? 'line-through' : ''}`}>
                            {event.title}
                          </h3>
                          <Badge variant={getTypeColor(event.type) as any}>
                            {event.type}
                          </Badge>
                          {getPriorityIcon(event.priority)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <BookOpen className="inline h-3 w-3 mr-1" />
                          {event.subject} • {new Date(event.date).toLocaleDateString()} at {event.time} • {formatTime(event.duration)}
                        </div>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditEvent(event)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Schedule;