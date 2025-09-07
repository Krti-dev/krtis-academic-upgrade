import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Brain, 
  Sparkles, 
  User, 
  BookOpen, 
  TrendingUp, 
  Calendar,
  Target,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Zap,
  Send,
  Trash2,
  MessageSquare
} from "lucide-react";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface InsightCard {
  type: "suggestion" | "achievement" | "alert";
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  action?: () => void;
}

interface ProductivityPattern {
  timeSlot: string;
  energyLevel: 'high' | 'medium' | 'low';
  completionRate: number;
  taskTypes: string[];
  dayOfWeek: string;
}

interface TaskCompletion {
  id: string;
  taskTitle: string;
  scheduledTime: string;
  actualCompletion: boolean;
  goalId?: string;
  timestamp: string;
}

interface Recommendation {
  id: string;
  type: 'schedule' | 'break' | 'task_type' | 'energy_match';
  title: string;
  description: string;
  confidence: number;
  timeSlot: string;
  suggested_task_type: string;
}

const StudySage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { subjects, studySessions, attendance, expenses, budgetLimits, getAttendanceStats } = useSupabaseData();
  
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null);
  
  // Productivity tracking states
  const [patterns, setPatterns] = useState<ProductivityPattern[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [activeTaskDialog, setActiveTaskDialog] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Load productivity data on mount
  useEffect(() => {
    if (user) {
      loadProductivityData();
      checkForActiveTimeBlocks();
      const interval = setInterval(checkForActiveTimeBlocks, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadProductivityData = async () => {
    try {
      const storedPatterns = localStorage.getItem('productivityPatterns');
      const storedCompletions = localStorage.getItem('taskCompletions');
      
      if (storedPatterns) {
        setPatterns(JSON.parse(storedPatterns));
      }
      
      if (storedCompletions) {
        setCompletions(JSON.parse(storedCompletions));
      }
      
      await analyzePatterns();
    } catch (error) {
      console.error('Error loading productivity data:', error);
    }
  };

  const checkForActiveTimeBlocks = () => {
    const now = new Date();
    const storedEvents = localStorage.getItem('scheduleEvents');
    if (!storedEvents) return;
    
    try {
      const events = JSON.parse(storedEvents);
      const today = now.toISOString().split('T')[0];
      
      const recentlyEndedEvents = events.filter((event: any) => {
        if (event.date !== today) return false;
        
        const eventEndTime = new Date(`${event.date}T${event.endTime}`);
        const timeDiff = now.getTime() - eventEndTime.getTime();
        
        return timeDiff > 0 && timeDiff <= 5 * 60 * 1000 && !event.completionTracked;
      });
      
      if (recentlyEndedEvents.length > 0) {
        setActiveTaskDialog(recentlyEndedEvents[0]);
      }
    } catch (error) {
      console.error('Error checking for active time blocks:', error);
    }
  };

  const recordTaskCompletion = async (taskId: string, completed: boolean, goalId?: string) => {
    const completion: TaskCompletion = {
      id: Date.now().toString(),
      taskTitle: activeTaskDialog.title,
      scheduledTime: activeTaskDialog.startTime,
      actualCompletion: completed,
      goalId,
      timestamp: new Date().toISOString()
    };

    const updatedCompletions = [...completions, completion];
    setCompletions(updatedCompletions);
    localStorage.setItem('taskCompletions', JSON.stringify(updatedCompletions));

    const storedEvents = localStorage.getItem('scheduleEvents');
    if (storedEvents) {
      const events = JSON.parse(storedEvents);
      const updatedEvents = events.map((event: any) => 
        event.id === taskId ? { ...event, completionTracked: true } : event
      );
      localStorage.setItem('scheduleEvents', JSON.stringify(updatedEvents));
    }

    setActiveTaskDialog(null);
    
    toast({
      title: "Task Recorded",
      description: `Task marked as ${completed ? 'completed' : 'incomplete'}. StudySage is learning your patterns!`,
    });

    await analyzePatterns();
  };

  const analyzePatterns = async () => {
    if (completions.length < 3) return;
    
    setIsAnalyzing(true);
    
    try {
      const patterns: ProductivityPattern[] = [];
      const timeSlots = ['06:00-09:00', '09:00-12:00', '12:00-15:00', '15:00-18:00', '18:00-21:00', '21:00-24:00'];
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      
      for (const timeSlot of timeSlots) {
        for (const day of days) {
          const relevantCompletions = completions.filter(completion => {
            const completionDate = new Date(completion.timestamp);
            const dayName = completionDate.toLocaleDateString('en-US', { weekday: 'long' });
            const hour = parseInt(completion.scheduledTime.split(':')[0]);
            const slotStart = parseInt(timeSlot.split('-')[0].split(':')[0]);
            const slotEnd = parseInt(timeSlot.split('-')[1].split(':')[0]);
            
            return dayName === day && hour >= slotStart && hour < slotEnd;
          });
          
          if (relevantCompletions.length >= 2) {
            const completionRate = relevantCompletions.filter(c => c.actualCompletion).length / relevantCompletions.length;
            const taskTypes = [...new Set(relevantCompletions.map(c => c.taskTitle))];
            
            let energyLevel: 'high' | 'medium' | 'low';
            if (completionRate >= 0.8) energyLevel = 'high';
            else if (completionRate >= 0.5) energyLevel = 'medium';
            else energyLevel = 'low';
            
            patterns.push({
              timeSlot,
              energyLevel,
              completionRate: completionRate * 100,
              taskTypes,
              dayOfWeek: day
            });
          }
        }
      }
      
      setPatterns(patterns);
      localStorage.setItem('productivityPatterns', JSON.stringify(patterns));
      
      generateRecommendations(patterns);
      
    } catch (error) {
      console.error('Error analyzing patterns:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateRecommendations = (patterns: ProductivityPattern[]) => {
    const recommendations: Recommendation[] = [];
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    
    const todayPatterns = patterns.filter(p => p.dayOfWeek === currentDay);
    const highEnergySlots = todayPatterns.filter(p => p.energyLevel === 'high');
    const lowEnergySlots = todayPatterns.filter(p => p.energyLevel === 'low');
    
    highEnergySlots.forEach(slot => {
      recommendations.push({
        id: `deep-work-${slot.timeSlot}`,
        type: 'energy_match',
        title: 'Schedule Deep Work',
        description: `Your completion rate is ${slot.completionRate.toFixed(0)}% during ${slot.timeSlot}. Perfect for challenging tasks!`,
        confidence: slot.completionRate,
        timeSlot: slot.timeSlot,
        suggested_task_type: 'study'
      });
    });
    
    lowEnergySlots.forEach(slot => {
      recommendations.push({
        id: `break-${slot.timeSlot}`,
        type: 'break',
        title: 'Take a Break',
        description: `Your energy is typically low during ${slot.timeSlot} (${slot.completionRate.toFixed(0)}% completion rate). Consider scheduling lighter activities.`,
        confidence: 100 - slot.completionRate,
        timeSlot: slot.timeSlot,
        suggested_task_type: 'break'
      });
    });
    
    setRecommendations(recommendations);
  };

  // Aggregated statistics
  const aggregatedStats = useMemo(() => {
    const totalStudyHours = studySessions.reduce((sum, session) => sum + session.duration_minutes, 0) / 60;
    
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);
    
    const thisWeekSessions = studySessions.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate >= weekStart;
    });
    
    const weeklyStudyHours = thisWeekSessions.reduce((sum, session) => sum + session.duration_minutes, 0) / 60;
    const attendanceStats = getAttendanceStats();
    const attendancePercentage = attendanceStats.overall.percentage || 0;
    
    return {
      totalStudyHours,
      weeklyStudyHours,
      attendancePercentage,
      totalSessions: studySessions.length,
      avgSessionDuration: studySessions.length > 0 ? totalStudyHours / studySessions.length : 0
    };
  }, [studySessions, getAttendanceStats]);

  // Smart insights generation
  const smartInsights = useMemo((): InsightCard[] => {
    const insights: InsightCard[] = [];

    if (aggregatedStats.weeklyStudyHours < 10) {
      insights.push({
        type: "suggestion",
        title: "Increase Study Time",
        description: `You've studied ${aggregatedStats.weeklyStudyHours.toFixed(1)}h this week. Try to reach 15+ hours!`,
        icon: Clock,
        color: "bg-warning"
      });
    } else if (aggregatedStats.weeklyStudyHours > 20) {
      insights.push({
        type: "achievement",
        title: "Study Champion!",
        description: `Amazing! ${aggregatedStats.weeklyStudyHours.toFixed(1)}h of study time this week!`,
        icon: Target,
        color: "bg-success"
      });
    }

    if (aggregatedStats.attendancePercentage < 75) {
      insights.push({
        type: "alert",
        title: "Attendance Alert",
        description: `Your attendance is ${aggregatedStats.attendancePercentage.toFixed(1)}%. Aim for 85%+!`,
        icon: AlertTriangle,
        color: "bg-destructive"
      });
    }

    if (patterns.length > 0) {
      const highEnergyPatterns = patterns.filter(p => p.energyLevel === 'high');
      if (highEnergyPatterns.length > 0) {
        const bestSlot = highEnergyPatterns.reduce((best, current) => 
          current.completionRate > best.completionRate ? current : best
        );
        insights.push({
          type: "suggestion",
          title: "Peak Performance Time",
          description: `You're most productive during ${bestSlot.timeSlot} with ${bestSlot.completionRate.toFixed(0)}% completion rate!`,
          icon: TrendingUp,
          color: "bg-info"
        });
      }
    }

    return insights;
  }, [aggregatedStats, patterns]);

  const generateContextualResponse = (userPrompt: string, stats: any): string => {
    const prompt = userPrompt.toLowerCase();
    
    if (prompt.includes('productivity') || prompt.includes('pattern')) {
      if (patterns.length === 0) {
        return "I need more data to analyze your productivity patterns. Schedule some tasks and complete them to help me learn when you're most productive!";
      }
      
      const highEnergySlots = patterns.filter(p => p.energyLevel === 'high');
      const lowEnergySlots = patterns.filter(p => p.energyLevel === 'low');
      
      return `Based on your task completion patterns:\n\n🔥 High Energy Times: ${highEnergySlots.map(s => s.timeSlot).join(', ')}\n⚡ Medium Energy Times: ${patterns.filter(p => p.energyLevel === 'medium').map(s => s.timeSlot).join(', ')}\n😴 Low Energy Times: ${lowEnergySlots.map(s => s.timeSlot).join(', ')}\n\nI recommend scheduling your most challenging tasks during high energy periods!`;
    }
    
    if (prompt.includes('study') || prompt.includes('improve')) {
      return `You've studied ${stats.totalStudyHours.toFixed(1)} hours total with an average session of ${stats.avgSessionDuration.toFixed(1)}h. To improve:\n\n1. Maintain consistency - aim for daily study sessions\n2. Use active recall and spaced repetition\n3. Take regular breaks (25-5 minute cycles work well)\n4. Schedule challenging topics during your peak energy times\n5. Track your progress to stay motivated!`;
    }
    
    if (prompt.includes('schedule') || prompt.includes('plan')) {
      return `Based on your data:\n\n📅 Schedule deep work during your high-energy periods\n⏰ Plan lighter tasks during low-energy times\n📚 Aim for ${Math.max(15, stats.weeklyStudyHours + 2)} hours of study this week\n🎯 Focus on maintaining ${Math.max(85, stats.attendancePercentage + 5)}% attendance\n\nWould you like me to help optimize your weekly schedule?`;
    }
    
    if (prompt.includes('break') || prompt.includes('rest')) {
      const lowEnergyTimes = patterns.filter(p => p.energyLevel === 'low').map(p => p.timeSlot);
      if (lowEnergyTimes.length > 0) {
        return `Perfect timing for breaks: ${lowEnergyTimes.join(', ')}. During these times, try:\n\n🚶 Light exercise or walks\n🧘 Meditation or breathing exercises\n🎵 Listen to music\n☕ Have a healthy snack\n📱 Social time (but limit screen time)\n\nRemember: breaks are productive too!`;
      }
      return "Taking regular breaks is crucial! Try the 25-5 minute rule - 25 minutes focused work, then 5 minutes break. This helps maintain high performance throughout the day.";
    }
    
    return `I'm StudySage, your AI academic coach! I can help you with:\n\n📊 Analyzing your study patterns\n⏰ Optimizing your schedule\n🎯 Setting and tracking goals\n📈 Improving productivity\n💡 Study techniques and strategies\n\nWhat would you like to work on today?`;
  };

  const askAI = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    
    try {
      const contextualResponse = generateContextualResponse(prompt, aggregatedStats);
      
      const { data, error } = await supabase.functions.invoke('generate-with-ai', {
        body: { 
          prompt: `${prompt}\n\nContext: ${contextualResponse}\n\nUser Profile: ${JSON.stringify(aggregatedStats)}`,
          context: aggregatedStats
        }
      });

      if (error) throw error;
      
      setAnswer(data.generatedText || contextualResponse);
    } catch (error) {
      console.error('Error calling AI:', error);
      setAnswer(generateContextualResponse(prompt, aggregatedStats));
    } finally {
      setLoading(false);
    }
  };

  const handleInsightClick = (insight: InsightCard) => {
    setPrompt(`Tell me more about: ${insight.title}`);
    setSelectedInsight(insight.title);
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/20 via-purple/10 to-success/20 p-4 sm:p-6 border border-border/50">
        <div className="absolute inset-0 mesh-background opacity-30"></div>
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-xl bg-primary/10 border border-primary/20">
              <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold gradient-text">StudySage</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Your AI-Powered Academic Coach</p>
              {isAnalyzing && <Badge variant="secondary" className="mt-1 text-xs">Analyzing patterns...</Badge>}
            </div>
          </div>
          <div className="text-left sm:text-right w-full sm:w-auto">
            <p className="text-xs sm:text-sm text-muted-foreground">Total Study Time</p>
            <p className="text-xl sm:text-2xl font-bold">{aggregatedStats.totalStudyHours.toFixed(1)}h</p>
          </div>
        </div>
      </div>

      {/* Academic Profile Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Your Academic Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-primary">{subjects.length}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Active Subjects</p>
            </div>
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-success">{aggregatedStats.weeklyStudyHours.toFixed(1)}h</p>
              <p className="text-xs sm:text-sm text-muted-foreground">This Week</p>
            </div>
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-info">{aggregatedStats.attendancePercentage.toFixed(1)}%</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Attendance</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Productivity Patterns */}
      {patterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Your Productivity Patterns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {patterns.map((pattern, index) => (
                <Card key={index} className="p-3 sm:p-4">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm sm:text-base truncate">{pattern.timeSlot}</span>
                      <Badge variant="outline" className={`text-xs shrink-0 ${
                        pattern.energyLevel === 'high' ? 'text-success' :
                        pattern.energyLevel === 'medium' ? 'text-warning' : 'text-destructive'
                      }`}>
                        {pattern.energyLevel === 'high' ? <TrendingUp className="h-3 w-3 mr-1" /> :
                         pattern.energyLevel === 'medium' ? <Clock className="h-3 w-3 mr-1" /> :
                         <AlertTriangle className="h-3 w-3 mr-1" />}
                        {pattern.energyLevel}
                      </Badge>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs sm:text-sm mb-1">
                        <span>Success Rate</span>
                        <span>{pattern.completionRate.toFixed(0)}%</span>
                      </div>
                      <Progress value={pattern.completionRate} className="h-2" />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {pattern.dayOfWeek}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Smart Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {recommendations.map((rec) => (
                <div key={rec.id} className="p-3 sm:p-4 rounded-lg border bg-muted/50">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      {rec.type === 'energy_match' && <TrendingUp className="h-4 w-4 text-primary" />}
                      {rec.type === 'break' && <Clock className="h-4 w-4 text-warning" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm sm:text-base">{rec.title}</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">{rec.description}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">{rec.timeSlot}</Badge>
                        <Badge variant="outline" className="text-xs">
                          {rec.confidence.toFixed(0)}% confidence
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Smart Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Smart Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {smartInsights.map((insight, index) => (
              <Card 
                key={index} 
                className={`p-3 sm:p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedInsight === insight.title ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleInsightClick(insight)}
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className={`p-2 rounded-lg ${insight.color} shrink-0`}>
                    <insight.icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-xs sm:text-sm">{insight.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 break-words">{insight.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Chat Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Chat with StudySage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Ask me about your productivity patterns, study optimization, or academic goals..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[80px] sm:min-h-[100px] text-sm"
          />
          
          <div className="flex gap-2">
            <Button 
              onClick={askAI} 
              disabled={loading || !prompt.trim()}
              className="flex-1"
              size="sm"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-2"></div>
                  <span className="text-xs sm:text-sm">Thinking...</span>
                </>
              ) : (
                <>
                  <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  <span className="text-xs sm:text-sm">Ask StudySage</span>
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setPrompt(""); setAnswer(""); }}>
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>

          {answer && (
            <div className="p-3 sm:p-4 rounded-lg bg-muted/50 border">
              <h4 className="font-medium mb-2 flex items-center gap-2 text-sm sm:text-base">
                <Brain className="h-4 w-4 text-primary" />
                StudySage says:
              </h4>
              <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">{answer}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {[
              "How can I improve my study habits?",
              "What's my productivity pattern?",
              "Help me plan my week",
              "When should I take breaks?"
            ].map((action, index) => (
              <Button 
                key={index}
                variant="outline" 
                size="sm"
                className="text-xs p-2 sm:p-3 h-auto text-center whitespace-normal"
                onClick={() => setPrompt(action)}
              >
                {action}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Task Completion Dialog */}
      <Dialog open={!!activeTaskDialog} onOpenChange={() => setActiveTaskDialog(null)}>
        <DialogContent className="w-[90vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Task Completion Check</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm sm:text-base">
              Your scheduled task "<strong>{activeTaskDialog?.title}</strong>" just ended.
              Did you complete it successfully?
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => recordTaskCompletion(activeTaskDialog.id, true, activeTaskDialog.goalId)}
                className="flex-1"
                size="sm"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                <span className="text-xs sm:text-sm">Yes, Completed</span>
              </Button>
              <Button 
                variant="outline"
                onClick={() => recordTaskCompletion(activeTaskDialog.id, false, activeTaskDialog.goalId)}
                className="flex-1"
                size="sm"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                <span className="text-xs sm:text-sm">No, Incomplete</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudySage;