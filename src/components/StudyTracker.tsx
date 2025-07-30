import { useState } from "react";
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
  Plus, 
  Clock, 
  BookOpen, 
  Target,
  Calendar,
  TrendingUp,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";
import { useSupabaseData } from "@/hooks/useSupabaseData";

const StudyTracker = () => {
  const { subjects, studySessions, addSubject, addStudySession, loading } = useSupabaseData();
  const [isStudying, setIsStudying] = useState(false);
  const [currentSession, setCurrentSession] = useState({
    subject: "",
    duration: 0,
    startTime: null as Date | null,
  });
  const [newSubject, setNewSubject] = useState("");

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const startStudySession = () => {
    if (!currentSession.subject) {
      toast.error("Please select a subject first!");
      return;
    }
    setIsStudying(true);
    setCurrentSession(prev => ({ ...prev, startTime: new Date() }));
    toast.success(`Started studying ${currentSession.subject}!`);
  };

  const pauseStudySession = () => {
    setIsStudying(false);
    toast.info("Study session paused");
  };

  const endStudySession = () => {
    setIsStudying(false);
    if (currentSession.duration > 0) {
      toast.success(`Study session completed! ${formatTime(currentSession.duration)}`);
    }
    setCurrentSession({ subject: "", duration: 0, startTime: null });
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
          <TabsTrigger value="subjects">Manage Subjects</TabsTrigger>
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
                    {formatTime(currentSession.duration)}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                {!isStudying ? (
                  <Button onClick={startStudySession} className="flex-1">
                    <Play className="h-4 w-4 mr-2" />
                    Start Session
                  </Button>
                ) : (
                  <>
                    <Button onClick={pauseStudySession} variant="outline" className="flex-1">
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </Button>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Today's Goal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>4.5h / 6h</span>
                    <span>75%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Sessions Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                  +1 from yesterday
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Focus Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">92%</div>
                <p className="text-xs text-muted-foreground">
                  <CheckCircle className="inline h-3 w-3 mr-1" />
                  Excellent focus!
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Study Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {studySessions.map((session) => (
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

        <TabsContent value="subjects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Manage Subjects
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add new subject..."
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={async () => {
                    if (newSubject.trim()) {
                      try {
                        await addSubject({ name: newSubject.trim() });
                        toast.success(`Added ${newSubject} as a new subject!`);
                        setNewSubject("");
                      } catch (error) {
                        toast.error("Failed to add subject");
                      }
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {subjects.map((subject) => {
                  const weeklyStudyTime = studySessions
                    .filter(session => 
                      session.subject_id === subject.id && 
                      new Date(session.date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    )
                    .reduce((total, session) => total + session.duration_minutes, 0);
                  
                  return (
                    <div
                      key={subject.id}
                      className="p-3 bg-muted/50 rounded-lg border hover:bg-muted/70 transition-colors"
                    >
                      <div className="font-medium text-sm">{subject.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatTime(weeklyStudyTime)} this week
                      </div>
                    </div>
                  );
                })}
                {subjects.length === 0 && (
                  <div className="text-center text-muted-foreground py-4">
                    No subjects added yet. Add your first subject above!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudyTracker;