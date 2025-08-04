import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, TrendingUp, BookOpen, Target, Zap, Award, CheckCircle, Calculator, Heart, Wallet } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, Tooltip } from 'recharts';
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useMemo, useState } from "react";
import AttendanceMarksDialog from "./AttendanceMarksDialog";

const Dashboard = () => {
  const { subjects, timetable, attendance, studySessions, loading, getAttendanceStats } = useSupabaseData();
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [marksDialogOpen, setMarksDialogOpen] = useState(false);

  // Real-time calculated data
  const stats = useMemo(() => {
    const attendanceStats = getAttendanceStats();
    
    // Calculate total study hours this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
    weekStart.setHours(0, 0, 0, 0);
    
    const thisWeekSessions = studySessions.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate >= weekStart;
    });
    
    const totalWeeklyHours = thisWeekSessions.reduce((sum, session) => sum + session.duration_minutes, 0) / 60;
    
    // Weekly study data for chart
    const weeklyStudyData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      const daySessions = studySessions.filter(s => s.date === dateStr);
      const dayHours = daySessions.reduce((sum, s) => sum + s.duration_minutes, 0) / 60;
      const uniqueSubjects = new Set(daySessions.map(s => s.subject_id)).size;
      
      return {
        day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
        hours: Number(dayHours.toFixed(1)),
        subjects: uniqueSubjects
      };
    });

    // Subject study data for pie chart
    const subjectHours: { [key: string]: number } = {};
    studySessions.forEach(session => {
      if (session.subject_id) {
        subjectHours[session.subject_id] = (subjectHours[session.subject_id] || 0) + session.duration_minutes;
      }
    });
    
    const subjectData = subjects.map(subject => ({
      name: subject.name,
      hours: Number(((subjectHours[subject.id] || 0) / 60).toFixed(1)),
      color: subject.color || '#3B82F6'
    })).filter(s => s.hours > 0);

    // Performance data (based on effectiveness ratings)
    const monthlyPerformance = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthSessions = studySessions.filter(session => {
        const sessionDate = new Date(session.date);
        return sessionDate >= monthStart && sessionDate <= monthEnd;
      });
      
      const avgEffectiveness = monthSessions.length > 0 
        ? monthSessions.reduce((sum, s) => sum + (s.effectiveness_rating || 7), 0) / monthSessions.length
        : 0;
      
      return {
        month: date.toLocaleDateString('en', { month: 'short' }),
        score: Math.round(avgEffectiveness * 10) // Convert to 0-100 scale
      };
    });

    // Calculate average effectiveness
    const allEffectivenessRatings = studySessions
      .filter(s => s.effectiveness_rating !== null)
      .map(s => s.effectiveness_rating || 0);
    const avgEffectiveness = allEffectivenessRatings.length > 0 
      ? allEffectivenessRatings.reduce((sum, rating) => sum + rating, 0) / allEffectivenessRatings.length
      : 0;

    // Calculate total hobby time (placeholder for now)
    const totalHobbyTime = 0; // Will be updated with real data later

    // Calculate total budget and spent (placeholder for now)
    const totalBudget = 6800;
    const totalSpent = 2875.5;

    return {
      attendanceStats,
      totalWeeklyHours,
      weeklyStudyData,
      subjectData,
      performanceData: monthlyPerformance,
      avgEffectiveness,
      totalHobbyTime,
      totalBudget,
      totalSpent
    };
  }, [subjects, studySessions, attendance, getAttendanceStats]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getMotivationalMessage = (hours: number) => {
    if (hours === 0) return "Time to start your study journey! 🚀";
    if (hours < 5) return "Great start! Keep building momentum! 💪";
    if (hours < 10) return "You're doing well! Stay consistent! 📈";
    if (hours < 15) return "Impressive dedication! Keep it up! 🌟";
    if (hours < 20) return "Outstanding effort! You're crushing it! 🔥";
    if (hours < 25) return "Exceptional work! You're a study machine! ⚡";
    return "Incredible achievement! You're unstoppable! 🏆";
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-lg border">
        <h1 className="text-3xl font-bold mb-2">Welcome to Academia! 🎓</h1>
        <p className="text-muted-foreground">
          You've studied for {stats.totalWeeklyHours.toFixed(1)} hours this week. {getMotivationalMessage(stats.totalWeeklyHours)}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Study Hours</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalWeeklyHours.toFixed(1)} hours</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-success" />
              This week's total
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple/10 to-purple/5 border-purple/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Avg. Effectiveness</CardTitle>
            <Zap className="h-4 w-4 text-purple" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.avgEffectiveness.toFixed(1)}/10</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="h-4 w-4 text-purple" />
              Study quality
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20 md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Attendance by Subject</CardTitle>
            <CalendarDays className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground mb-4">{stats.attendanceStats.overall.percentage.toFixed(1)}% Overall</div>
            <div className="space-y-3">
              {subjects.map((subject) => {
                const subjectStats = stats.attendanceStats.subjects[subject.id] || { present: 0, total: 0, percentage: 0 };
                return (
                  <div key={subject.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: subject.color }}
                        />
                        <span className="font-medium">{subject.name}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {subjectStats.present}/{subjectStats.total} ({subjectStats.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress 
                      value={subjectStats.percentage} 
                      className="h-2"
                    />
                  </div>
                );
              })}
              {subjects.length === 0 && (
                <p className="text-sm text-muted-foreground">No subjects added yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-info/10 to-info/5 border-info/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Subjects</CardTitle>
            <BookOpen className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{subjects.length}</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpen className="h-4 w-4 text-info" />
              Active subjects
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Study Streak</CardTitle>
            <Award className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {(() => {
                let streak = 0;
                const today = new Date();
                for (let i = 0; i < 30; i++) {
                  const checkDate = new Date(today);
                  checkDate.setDate(today.getDate() - i);
                  const hasStudied = studySessions.some(s => 
                    new Date(s.date).toDateString() === checkDate.toDateString()
                  );
                  if (hasStudied) streak++;
                  else break;
                }
                return streak;
              })()} days
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Award className="h-4 w-4 text-warning" />
              Keep the streak going! 🔥
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink/10 to-pink/5 border-pink/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Hobby Time</CardTitle>
            <Heart className="h-4 w-4 text-pink" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalHobbyTime}h</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Heart className="h-4 w-4 text-pink" />
              This week
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald/10 to-emerald/5 border-emerald/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Budget Status</CardTitle>
            <Wallet className="h-4 w-4 text-emerald" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">₹{(stats.totalBudget - stats.totalSpent).toFixed(0)}</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-emerald" />
              Remaining
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Study Hours</CardTitle>
                <CardDescription>Your study hours throughout the week</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={stats.weeklyStudyData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Area type="monotone" dataKey="hours" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subject Distribution</CardTitle>
                <CardDescription>Hours spent on each subject</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.subjectData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={stats.subjectData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="hours"
                        label={({ name, hours }) => `${name}: ${hours}h`}
                      >
                        {stats.subjectData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[300px] text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">No study sessions recorded yet</p>
                    <p className="text-sm text-muted-foreground">Start tracking your study hours to see subject distribution</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Trend</CardTitle>
              <CardDescription>Your study effectiveness over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.performanceData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} />
                  <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subject) => {
              const subjectSessions = studySessions.filter(s => s.subject_id === subject.id);
              const totalHours = subjectSessions.reduce((sum, s) => sum + s.duration_minutes, 0) / 60;
              const avgEffectiveness = subjectSessions.length > 0 
                ? subjectSessions.reduce((sum, s) => sum + (s.effectiveness_rating || 7), 0) / subjectSessions.length
                : 0;

              return (
                <Card key={subject.id} className="border-l-4" style={{ borderLeftColor: subject.color }}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: subject.color }}
                      />
                      {subject.name}
                    </CardTitle>
                    {subject.code && (
                      <Badge variant="secondary" className="w-fit">{subject.code}</Badge>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Hours:</span>
                      <span className="font-medium">{totalHours.toFixed(1)}h</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Sessions:</span>
                      <span className="font-medium">{subjectSessions.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Effectiveness:</span>
                      <span className="font-medium">{avgEffectiveness.toFixed(1)}/10</span>
                    </div>
                    {subject.instructor && (
                      <div className="text-xs text-muted-foreground mt-2">
                        Instructor: {subject.instructor}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Overall Attendance</CardTitle>
                <CardDescription>Your overall attendance pattern</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Present', value: stats.attendanceStats.overall.present, fill: 'hsl(var(--success))' },
                        { name: 'Absent', value: stats.attendanceStats.overall.total - stats.attendanceStats.overall.present, fill: 'hsl(var(--destructive))' }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
                    />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subject-wise Attendance</CardTitle>
                <CardDescription>Attendance percentage by subject</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(stats.attendanceStats.subjects).map(([subjectId, stats]) => {
                    const subject = subjects.find(s => s.id === subjectId);
                    return {
                      name: subject?.name || 'Unknown',
                      percentage: stats.percentage,
                      present: stats.present,
                      absent: stats.total - stats.present,
                      color: subject?.color || '#3B82F6'
                    };
                  })}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                    <Bar dataKey="percentage" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Subject Details & Internal Marks Calculator</CardTitle>
              <CardDescription>Click on any subject to calculate attendance strategy for internal marks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjects.map((subject) => {
                  const subjectStats = stats.attendanceStats.subjects[subject.id] || { present: 0, total: 0, percentage: 0 };
                  const getMarksForPercentage = (percentage: number) => {
                    if (percentage >= 95) return 5;
                    if (percentage >= 90) return 4;
                    if (percentage >= 85) return 3;
                    if (percentage >= 80) return 2;
                    if (percentage >= 75) return 1;
                    return 0;
                  };
                  const currentMarks = getMarksForPercentage(subjectStats.percentage);
                  
                  return (
                    <Card 
                      key={subject.id} 
                      className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" 
                      style={{ borderLeftColor: subject.color }}
                      onClick={() => {
                        setSelectedSubject({ ...subject, attendanceStats: subjectStats });
                        setMarksDialogOpen(true);
                      }}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: subject.color }}
                          />
                          {subject.name}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          {subject.code && (
                            <Badge variant="secondary">{subject.code}</Badge>
                          )}
                          <Badge variant={currentMarks >= 3 ? "default" : "destructive"}>
                            {currentMarks}/5 marks
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Present:</span>
                            <span className="font-medium text-success">{subjectStats.present}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Absent:</span>
                            <span className="font-medium text-destructive">{subjectStats.total - subjectStats.present}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Percentage:</span>
                            <span className="font-medium">{subjectStats.percentage.toFixed(1)}%</span>
                          </div>
                          <Progress 
                            value={subjectStats.percentage} 
                            className="h-2"
                          />
                        </div>
                        <Button variant="outline" size="sm" className="w-full">
                          <Calculator className="h-4 w-4 mr-2" />
                          Calculate Strategy
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedSubject && (
        <AttendanceMarksDialog
          open={marksDialogOpen}
          onOpenChange={setMarksDialogOpen}
          subject={selectedSubject}
          attendanceStats={selectedSubject.attendanceStats}
        />
      )}
    </div>
  );
};

export default Dashboard;