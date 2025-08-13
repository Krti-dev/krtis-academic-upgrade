import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Heart, Plus, Clock, TrendingUp, Play, Pause, Square, Edit2, Trash2, Timer } from "lucide-react";
import { toast } from "sonner";

interface Hobby {
  id: number;
  name: string;
  timeThisWeek: number;
  lastActivity: string;
}

const HobbyTrackerWithTimer = () => {
  const [newHobby, setNewHobby] = useState("");
  const [editingHobby, setEditingHobby] = useState<Hobby | null>(null);
  const [editName, setEditName] = useState("");
  const [hobbies, setHobbies] = useState<Hobby[]>([]);

  // Load hobbies from localStorage on component mount
  useEffect(() => {
    const savedHobbies = localStorage.getItem('hobbies');
    if (savedHobbies) {
      try {
        setHobbies(JSON.parse(savedHobbies));
      } catch (error) {
        console.error('Error parsing saved hobbies:', error);
      }
    }
  }, []);

  // Save hobbies to localStorage whenever hobbies state changes
  useEffect(() => {
    localStorage.setItem('hobbies', JSON.stringify(hobbies));
  }, [hobbies]);
  
  // Timer states
  const [activeHobbyId, setActiveHobbyId] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [selectedHobbyForTimer, setSelectedHobbyForTimer] = useState<number | null>(null);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && activeHobbyId) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, activeHobbyId]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTimerTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const addHobby = () => {
    if (newHobby.trim()) {
      const newHobbyObj = {
        id: Date.now(),
        name: newHobby.trim(),
        timeThisWeek: 0,
        lastActivity: new Date().toISOString().split('T')[0]
      };
      setHobbies([...hobbies, newHobbyObj]);
      toast.success(`Added ${newHobby} to your hobbies!`);
      setNewHobby("");
    }
  };

  const updateHobby = (id: number, name: string) => {
    setHobbies(hobbies.map(hobby => 
      hobby.id === id ? { ...hobby, name, lastActivity: new Date().toISOString().split('T')[0] } : hobby
    ));
    toast.success("Hobby updated!");
    setEditingHobby(null);
    setEditName("");
  };

  const deleteHobby = (id: number) => {
    setHobbies(hobbies.filter(hobby => hobby.id !== id));
    if (activeHobbyId === id) {
      stopTimer();
    }
    toast.success("Hobby deleted!");
  };

  const startTimer = (hobbyId: number) => {
    if (activeHobbyId && activeHobbyId !== hobbyId) {
      stopTimer(); // Stop any existing timer
    }
    setActiveHobbyId(hobbyId);
    setSelectedHobbyForTimer(hobbyId);
    setIsTimerRunning(true);
    setTimerSeconds(0);
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
  };

  const resumeTimer = () => {
    if (activeHobbyId) {
      setIsTimerRunning(true);
    }
  };

  const stopTimer = () => {
    if (activeHobbyId && timerSeconds > 0) {
      const minutesToAdd = Math.floor(timerSeconds / 60);
      setHobbies(hobbies.map(hobby => 
        hobby.id === activeHobbyId 
          ? { 
              ...hobby, 
              timeThisWeek: hobby.timeThisWeek + minutesToAdd,
              lastActivity: new Date().toISOString().split('T')[0]
            }
          : hobby
      ));
      toast.success(`Added ${minutesToAdd} minutes to your hobby!`);
    }
    setActiveHobbyId(null);
    setSelectedHobbyForTimer(null);
    setIsTimerRunning(false);
    setTimerSeconds(0);
  };

  const totalTimeThisWeek = hobbies.reduce((total, hobby) => total + hobby.timeThisWeek, 0);
  const mostActiveHobby = hobbies.length > 0 
    ? hobbies.reduce((max, hobby) => hobby.timeThisWeek > max.timeThisWeek ? hobby : max)
    : null;

  const activeHobby = hobbies.find(h => h.id === activeHobbyId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Heart className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Hobby Tracker</h1>
      </div>

      {/* Timer Section */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Hobby Timer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!activeHobbyId ? (
              <div className="text-center">
                <p className="text-muted-foreground mb-4">Select a hobby to start tracking time</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {hobbies.map((hobby) => (
                    <Button
                      key={hobby.id}
                      variant="outline"
                      onClick={() => startTimer(hobby.id)}
                      className="justify-start"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {hobby.name}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">{activeHobby?.name}</h3>
                  <div className="text-3xl font-mono font-bold text-primary">
                    {formatTimerTime(timerSeconds)}
                  </div>
                </div>
                <div className="flex justify-center gap-2">
                  {isTimerRunning ? (
                    <Button onClick={pauseTimer} variant="outline">
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </Button>
                  ) : (
                    <Button onClick={resumeTimer} variant="outline">
                      <Play className="h-4 w-4 mr-2" />
                      Resume
                    </Button>
                  )}
                  <Button onClick={stopTimer} variant="destructive">
                    <Square className="h-4 w-4 mr-2" />
                    Stop & Save
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add New Hobby */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Hobby</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter hobby name..."
              value={newHobby}
              onChange={(e) => setNewHobby(e.target.value)}
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && addHobby()}
            />
            <Button onClick={addHobby}>
              <Plus className="h-4 w-4 mr-2" />
              Add Hobby
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Time This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(totalTimeThisWeek)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              Track your progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Hobbies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hobbies.length}</div>
            <p className="text-xs text-muted-foreground">
              <Heart className="inline h-3 w-3 mr-1" />
              Keep exploring!
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Most Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {mostActiveHobby ? mostActiveHobby.name : "None yet"}
            </div>
            <p className="text-xs text-muted-foreground">
              <Clock className="inline h-3 w-3 mr-1" />
              {mostActiveHobby ? formatTime(mostActiveHobby.timeThisWeek) : "0h 0m"} this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Hobbies List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Hobbies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {hobbies.map((hobby) => (
              <div
                key={hobby.id}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${hobby.id === activeHobbyId ? 'bg-green-500' : 'bg-primary'}`}></div>
                  <div>
                    <div className="font-medium">{hobby.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Last activity: {new Date(hobby.lastActivity).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {formatTime(hobby.timeThisWeek)} this week
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingHobby(hobby);
                      setEditName(hobby.name);
                    }}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteHobby(hobby.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            {hobbies.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No hobbies added yet. Add your first hobby above!
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Hobby Dialog */}
      <Dialog open={!!editingHobby} onOpenChange={() => setEditingHobby(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Hobby</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Hobby name..."
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <div className="flex gap-2">
              <Button 
                onClick={() => editingHobby && updateHobby(editingHobby.id, editName)}
                className="flex-1"
              >
                Update
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setEditingHobby(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HobbyTrackerWithTimer;