import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Clock, 
  Coffee, 
  Brain,
  Settings,
  Volume2,
  VolumeX,
  BookOpen,
  TrendingUp,
  CheckCircle,
  Target,
  Trophy
} from "lucide-react";
import { toast } from "sonner";
import { useSupabaseData } from "@/hooks/useSupabaseData";

const FocusTimer = () => {
  const { subjects, studySessions, addStudySession, loading } = useSupabaseData();
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<"focus" | "shortBreak" | "longBreak">("focus");
  const [session, setSession] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [currentTopic, setCurrentTopic] = useState("");
  const [studyGoal, setStudyGoal] = useState(() => {
    const saved = localStorage.getItem('dailyStudyGoal');
    return saved ? parseInt(saved) : 360; // 6 hours in minutes
  });
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [effectivenessRating, setEffectivenessRating] = useState(3);

  const modes = {
    focus: { duration: 25 * 60, label: "Focus Time", color: "primary", icon: Brain },
    shortBreak: { duration: 5 * 60, label: "Short Break", color: "success", icon: Coffee },
    longBreak: { duration: 15 * 60, label: "Long Break", color: "info", icon: Coffee },
  };

  const currentMode = modes[mode];
  const progress = ((currentMode.duration - timeLeft) / currentMode.duration) * 100;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 1) {
            handleTimerComplete();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleTimerComplete = async () => {
    setIsActive(false);
    
    if (soundEnabled) {
      toast.success("Timer completed!");
    }

    // Save study session if it was a focus session and subject is selected
    if (mode === "focus" && selectedSubject && startTime) {
      try {
        const duration = Math.floor((Date.now() - startTime.getTime()) / (1000 * 60));
        await addStudySession({
          subject_id: selectedSubject,
          duration_minutes: duration,
          topic: currentTopic || null,
          effectiveness_rating: effectivenessRating,
          date: new Date().toISOString().split('T')[0]
        });
        toast.success(`Study session saved! ${duration} minutes`);
      } catch (error) {
        toast.error("Failed to save study session");
      }
    }

    if (mode === "focus") {
      if (session % 4 === 0) {
        setMode("longBreak");
        toast.success("Great work! Time for a long break.");
      } else {
        setMode("shortBreak");
        toast.success("Focus session complete! Take a short break.");
      }
      setSession(prev => prev + 1);
    } else {
      setMode("focus");
      toast.success("Break over! Ready for another focus session?");
    }
    
    setTimeLeft(modes[mode === "focus" ? (session % 4 === 0 ? "longBreak" : "shortBreak") : "focus"].duration);
  };

  const formatTimeSeconds = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    if (!isActive && mode === "focus" && !selectedSubject) {
      toast.error("Please select a subject first!");
      return;
    }
    
    if (!isActive && mode === "focus") {
      setStartTime(new Date());
    }
    
    setIsActive(!isActive);
    toast.info(isActive ? "Timer paused" : "Timer started");
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(currentMode.duration);
    setStartTime(null);
    toast.info("Timer reset");
  };

  const switchMode = (newMode: typeof mode) => {
    setMode(newMode);
    setTimeLeft(modes[newMode].duration);
    setIsActive(false);
  };

  // Get today's study sessions
  const todaysSessions = studySessions.filter(session => {
    const today = new Date().toDateString();
    return new Date(session.date).toDateString() === today;
  });

  const todaysStudyTime = todaysSessions.reduce((total, session) => total + session.duration_minutes, 0);
  const progressPercentage = Math.min((todaysStudyTime / studyGoal) * 100, 100);

  // Calculate subject-specific study time
  const subjectStudyTime: { [key: string]: number } = {};
  studySessions.forEach(session => {
    if (session.subject_id) {
      subjectStudyTime[session.subject_id] = (subjectStudyTime[session.subject_id] || 0) + session.duration_minutes;
    }
  });

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const Icon = currentMode.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Focus Timer</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Timer */}
        <div className="lg:col-span-2">
          <Card className={`bg-gradient-to-br from-${currentMode.color}/5 to-${currentMode.color}/10 border-${currentMode.color}/20`}>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <Icon className="h-6 w-6" />
                {currentMode.label}
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                Session {session} • {mode === "focus" ? "Focus" : "Break"} Mode
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Subject Selection for Focus Mode */}
              {mode === "focus" && (
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Topic Input for Active Focus Session */}
              {mode === "focus" && isActive && (
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic (Optional)</Label>
                  <Input
                    id="topic"
                    placeholder="What are you studying?"
                    value={currentTopic}
                    onChange={(e) => setCurrentTopic(e.target.value)}
                  />
                </div>
              )}

              {/* Timer Display */}
              <div className="text-center">
                <div className="text-6xl md:text-8xl font-bold font-mono tracking-tighter">
                  {formatTimeSeconds(timeLeft)}
                </div>
                <Progress value={progress} className="mt-4 h-3" />
              </div>

              {/* Timer Controls */}
              <div className="flex justify-center gap-4">
                <Button onClick={toggleTimer} size="lg" className="flex-1 max-w-32">
                  {isActive ? (
                    <>
                      <Pause className="h-5 w-5 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 mr-2" />
                      Start
                    </>
                  )}
                </Button>
                <Button onClick={resetTimer} variant="outline" size="lg">
                  <RotateCcw className="h-5 w-5" />
                </Button>
                <Button 
                  onClick={() => setSoundEnabled(!soundEnabled)} 
                  variant="outline" 
                  size="lg"
                >
                  {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </Button>
              </div>

              {/* Mode Switcher */}
              <Tabs value={mode} onValueChange={(value) => switchMode(value as typeof mode)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="focus">Focus</TabsTrigger>
                  <TabsTrigger value="shortBreak">Short Break</TabsTrigger>
                  <TabsTrigger value="longBreak">Long Break</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Stats & Settings */}
        <div className="space-y-6">
          {/* Today's Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Today's Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Study Goal</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsEditingGoal(!isEditingGoal)}
                    className="h-6 px-2 text-xs"
                  >
                    {isEditingGoal ? "Save" : "Edit"}
                  </Button>
                </div>
                {isEditingGoal ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={Math.floor(studyGoal / 60)}
                      onChange={(e) => {
                        const newGoal = parseInt(e.target.value) * 60 || 360;
                        setStudyGoal(newGoal);
                        localStorage.setItem('dailyStudyGoal', newGoal.toString());
                      }}
                      className="w-20 h-8"
                      min="1"
                      max="24"
                    />
                    <span className="text-sm">hours</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>{formatTime(todaysStudyTime)} / {formatTime(studyGoal)}</span>
                      <span>{Math.round(progressPercentage)}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sessions Today</span>
                  <Badge variant="outline">{todaysSessions.length}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Avg. Effectiveness</span>
                  <span className="font-medium text-success">
                    {todaysSessions.length > 0 
                      ? Math.round((todaysSessions.reduce((sum, s) => sum + (s.effectiveness_rating || 3), 0) / todaysSessions.length) * 20)
                      : 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Settings */}
        <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5" />
              Study Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning mb-2">
              {(() => {
                let streak = 0;
                const today = new Date();
                
                for (let i = 0; i < 365; i++) { // Check up to 365 days
                  const checkDate = new Date(today);
                  checkDate.setDate(today.getDate() - i);
                  const dateStr = checkDate.toISOString().split('T')[0];
                  
                  const hasStudied = studySessions.some(s => s.date === dateStr && s.duration_minutes >= 15);
                  
                  if (hasStudied) {
                    streak++;
                  } else if (i === 0) {
                    // If today has no study, check if it's still early in the day
                    const currentHour = new Date().getHours();
                    if (currentHour < 6) {
                      continue; // Don't break streak if it's very early morning
                    } else {
                      break;
                    }
                  } else {
                    break;
                  }
                }
                
                return streak;
              })()} days
            </div>
            <p className="text-sm text-muted-foreground">
              Keep the streak alive! Study at least 15 minutes daily 🔥
            </p>
          </CardContent>
        </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-5 w-5" />
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Sound Notifications</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                  >
                    {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <span className="text-sm font-medium">Quick Durations</span>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setTimeLeft(15 * 60);
                        setIsActive(false);
                      }}
                    >
                      15m
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setTimeLeft(25 * 60);
                        setIsActive(false);
                      }}
                    >
                      25m
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setTimeLeft(45 * 60);
                        setIsActive(false);
                      }}
                    >
                      45m
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setTimeLeft(60 * 60);
                        setIsActive(false);
                      }}
                    >
                      60m
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="bg-gradient-to-br from-info/5 to-info/10 border-info/20">
            <CardHeader>
              <CardTitle className="text-lg text-info">💡 Focus Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• Eliminate distractions before starting</li>
                <li>• Take deep breaths during breaks</li>
                <li>• Stay hydrated throughout your session</li>
                <li>• Complete 4 focus sessions for optimal results</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FocusTimer;