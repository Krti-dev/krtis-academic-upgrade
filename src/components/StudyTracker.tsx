import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  BookOpen, 
  Calendar,
  TrendingUp,
  CheckCircle,
  Trophy,
  Target,
  Star
} from "lucide-react";
import { toast } from "sonner";
import { useSupabaseData } from "@/hooks/useSupabaseData";

const StudyTracker = () => {
  const { subjects, studySessions, addStudySession, loading } = useSupabaseData();
  const [isStudying, setIsStudying] = useState(false);
  const [currentSession, setCurrentSession] = useState({
    subject: "",
    duration: 0,
    seconds: 0,
    startTime: null as Date | null,
    topic: "",
    effectivenessRating: 3,
  });
  const [isPaused, setIsPaused] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(() => {
    const saved = localStorage.getItem('dailyStudyGoal');
    return saved ? parseInt(saved) : 360; // 6 hours in minutes
  });
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [weeklyGoal, setWeeklyGoal] = useState(() => {
    const saved = localStorage.getItem('weeklyStudyGoal');
    return saved ? parseInt(saved) : 25;
  });
  const [isEditingWeekly, setIsEditingWeekly] = useState(false);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isStudying && !isPaused && currentSession.startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const totalSeconds = Math.floor((now.getTime() - currentSession.startTime!.getTime()) / 1000);
        const duration = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        setCurrentSession(prev => ({ ...prev, duration, seconds }));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isStudying, isPaused, currentSession.startTime]);

  // Get today's study sessions
  const todaysSessions = studySessions.filter(session => {
    const today = new Date().toDateString();
    return new Date(session.date).toDateString() === today;
  });

  const todaysStudyTime = todaysSessions.reduce((total, session) => total + session.duration_minutes, 0);
  const progressPercentage = Math.min((todaysStudyTime / dailyGoal) * 100, 100);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTimeWithSeconds = (minutes: number, seconds: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const startStudySession = () => {
    if (!currentSession.subject) {
      toast.error("Please select a subject first!");
      return;
    }
    setIsStudying(true);
    setIsPaused(false);
    setCurrentSession(prev => ({ ...prev, startTime: new Date(), duration: 0, seconds: 0 }));
    toast.success(`Started studying ${subjects.find(s => s.id === currentSession.subject)?.name}!`);
  };

  const pauseStudySession = () => {
    setIsPaused(true);
    toast.info("Study session paused");
  };

  const resumeStudySession = () => {
    setIsPaused(false);
    // Adjust start time to account for paused duration
    const pausedDuration = currentSession.duration * 60 * 1000 + currentSession.seconds * 1000;
    setCurrentSession(prev => ({ 
      ...prev, 
      startTime: new Date(Date.now() - pausedDuration)
    }));
    toast.info("Study session resumed");
  };

  const endStudySession = async () => {
    if (currentSession.duration > 0) {
      try {
        await addStudySession({
          subject_id: currentSession.subject,
          duration_minutes: currentSession.duration,
          topic: currentSession.topic || null,
          effectiveness_rating: currentSession.effectivenessRating,
          date: new Date().toISOString().split('T')[0]
        });
        toast.success(`Study session saved! ${formatTime(currentSession.duration)}`);
      } catch (error) {
        toast.error("Failed to save study session");
      }
    }
    setIsStudying(false);
    setIsPaused(false);
    setCurrentSession({ subject: "", duration: 0, seconds: 0, startTime: null, topic: "", effectivenessRating: 3 });
  };

  // Calculate study streak
  const calculateStudyStreak = () => {
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 365; i++) { // Check up to 365 days
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      const hasStudied = studySessions.some(s => s.date === dateStr && s.duration_minutes >= 15); // At least 15 min
      
      if (hasStudied) {
        streak++;
      } else if (i === 0) {
        // If today has no study, check if it's still early in the day
        const currentHour = new Date().getHours();
        if (currentHour < 6) {
          // If it's very early morning, don't break streak yet
          continue;
        } else {
          break;
        }
      } else {
        break;
      }
    }
    
    return streak;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Study Tracker</h1>
      </div>

      <Tabs defaultValue="current" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current">Current Session</TabsTrigger>
          <TabsTrigger value="history">Study History</TabsTrigger>
          <TabsTrigger value="goals">Study Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6">
          {/* Active Study Session */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Study Session
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select
                    value={currentSession.subject}
                    onValueChange={(value) => setCurrentSession(prev => ({ ...prev, subject: value }))}
                  >
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
                
                <div className="space-y-2">
                  <Label>Session Duration</Label>
                  <div className="text-3xl font-bold text-primary">
                    {isStudying ? formatTimeWithSeconds(currentSession.duration, currentSession.seconds) : formatTime(currentSession.duration)}
                  </div>
                  {isStudying && (
                    <div className="text-sm text-muted-foreground">
                      {isPaused ? "⏸️ Paused" : "🔴 Recording..."}
                    </div>
                  )}
                </div>
              </div>

              {isStudying && (
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic (Optional)</Label>
                  <Input
                    id="topic"
                    placeholder="What are you studying?"
                    value={currentSession.topic}
                    onChange={(e) => setCurrentSession(prev => ({ ...prev, topic: e.target.value }))}
                  />
                </div>
              )}

              <div className="flex gap-2 pt-4">
                {!isStudying ? (
                  <Button onClick={startStudySession} className="flex-1">
                    <Play className="h-4 w-4 mr-2" />
                    Start Session
                  </Button>
                ) : (
                  <>
                    {!isPaused ? (
                      <Button onClick={pauseStudySession} variant="outline" className="flex-1">
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </Button>
                    ) : (
                      <Button onClick={resumeStudySession} variant="outline" className="flex-1">
                        <Play className="h-4 w-4 mr-2" />
                        Resume
                      </Button>
                    )}
                    <Button onClick={endStudySession} variant="destructive" className="flex-1">
                      <Square className="h-4 w-4 mr-2" />
                      End Session
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Today's Progress */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span>Today's Goal</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsEditingGoal(!isEditingGoal)}
                    className="h-6 px-2 text-xs"
                  >
                    {isEditingGoal ? "Save" : "Edit"}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {isEditingGoal ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={Math.floor(dailyGoal / 60)}
                        onChange={(e) => {
                          const newGoal = parseInt(e.target.value) * 60 || 360;
                          setDailyGoal(newGoal);
                          localStorage.setItem('dailyStudyGoal', newGoal.toString());
                        }}
                        className="w-20 h-8"
                        min="1"
                        max="24"
                      />
                      <span className="text-sm">hours</span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span>{formatTime(todaysStudyTime)} / {formatTime(dailyGoal)}</span>
                      <span>{Math.round(progressPercentage)}%</span>
                    </div>
                  )}
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Sessions Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todaysSessions.length}</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                  {todaysSessions.length > 0 ? "Keep it up!" : "Start your first session"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg. Effectiveness</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {todaysSessions.length > 0 
                    ? Math.round((todaysSessions.reduce((sum, s) => sum + (s.effectiveness_rating || 3), 0) / todaysSessions.length) * 20)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  <CheckCircle className="inline h-3 w-3 mr-1" />
                  {todaysSessions.length > 0 ? "Great focus!" : "No sessions yet"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">
                  {calculateStudyStreak()} days
                </div>
                <p className="text-xs text-muted-foreground">
                  <Star className="inline h-3 w-3 mr-1" />
                  Keep the streak alive! 🔥
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Recent Study Sessions
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    if (confirm("Are you sure you want to reset your study history? This action cannot be undone.")) {
                      localStorage.removeItem('studySessions');
                      toast.success("Study history reset successfully!");
                      window.location.reload();
                    }
                  }}
                >
                  Reset History
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {studySessions.slice().reverse().map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <div>
                        <div className="font-medium">
                          {session.subject?.name || session.topic || "General Study"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatTime(session.duration_minutes)} • {new Date(session.date).toLocaleDateString()}
                          {session.topic && ` • ${session.topic}`}
                        </div>
                      </div>
                    </div>
                    <Badge variant={session.effectiveness_rating && session.effectiveness_rating >= 4 ? "default" : "secondary"}>
                      {session.effectiveness_rating ? `${session.effectiveness_rating * 20}%` : "N/A"}
                    </Badge>
                  </div>
                ))}
                {studySessions.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No study sessions recorded yet. Start your first session!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Study Goals & Achievements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Weekly Goals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4" />
                        Weekly Goal
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setIsEditingWeekly(!isEditingWeekly)}
                        className="h-6 px-2 text-xs"
                      >
                        {isEditingWeekly ? "Save" : "Edit"}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold">
                        {isEditingWeekly ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={weeklyGoal}
                              onChange={(e) => {
                                const newGoal = parseInt(e.target.value) || 25;
                                setWeeklyGoal(newGoal);
                                localStorage.setItem('weeklyStudyGoal', newGoal.toString());
                              }}
                              className="w-16 h-8 text-xl font-bold"
                              min="1"
                              max="168"
                            />
                            <span className="text-lg">h</span>
                          </div>
                        ) : (
                          `${weeklyGoal}h`
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatTime(studySessions
                          .filter(s => new Date(s.date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
                          .reduce((total, s) => total + s.duration_minutes, 0)
                        )} completed this week
                      </div>
                      <Progress 
                        value={Math.min((studySessions
                          .filter(s => new Date(s.date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
                          .reduce((total, s) => total + s.duration_minutes, 0) / (weeklyGoal * 60)) * 100, 100)} 
                        className="h-2" 
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-success/5 to-success/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Study Streak
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-warning">
                        {calculateStudyStreak()} days
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Current consecutive study days
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Subject Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Subject Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {subjects.map((subject) => {
                      const subjectSessions = studySessions.filter(s => s.subject_id === subject.id);
                      const totalTime = subjectSessions.reduce((sum, s) => sum + s.duration_minutes, 0);
                      const avgEffectiveness = subjectSessions.length > 0 
                        ? subjectSessions.reduce((sum, s) => sum + (s.effectiveness_rating || 3), 0) / subjectSessions.length
                        : 0;

                      return (
                        <div key={subject.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: subject.color }}
                              />
                              <span className="font-medium">{subject.name}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatTime(totalTime)} • {(avgEffectiveness * 20).toFixed(0)}% avg
                            </div>
                          </div>
                          <Progress 
                            value={Math.min((totalTime / Math.max(1, Math.max(...subjects.map(s => 
                              studySessions.filter(ss => ss.subject_id === s.id).reduce((sum, ss) => sum + ss.duration_minutes, 0)
                            )))) * 100, 100)} 
                            className="h-2" 
                          />
                        </div>
                      );
                    })}
                    {subjects.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">
                        No subjects added yet. Add subjects in Settings to track performance.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudyTracker;