import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Brain, Clock, TrendingUp, Calendar, Target, CheckCircle2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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

export const AgenticAI = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [patterns, setPatterns] = useState<ProductivityPattern[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [activeTaskDialog, setActiveTaskDialog] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (user) {
      loadProductivityData();
      checkForActiveTimeBlocks();
      // Check every minute for task completion prompts
      const interval = setInterval(checkForActiveTimeBlocks, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadProductivityData = async () => {
    try {
      // Load stored patterns and completions from localStorage for now
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
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Get scheduled events from localStorage (Schedule component)
    const storedEvents = localStorage.getItem('scheduleEvents');
    if (!storedEvents) return;
    
    try {
      const events = JSON.parse(storedEvents);
      const today = now.toISOString().split('T')[0];
      
      // Find events that just ended (within the last 5 minutes)
      const recentlyEndedEvents = events.filter((event: any) => {
        if (event.date !== today) return false;
        
        const eventEndTime = new Date(`${event.date}T${event.endTime}`);
        const timeDiff = now.getTime() - eventEndTime.getTime();
        
        // Event ended within the last 5 minutes and hasn't been processed yet
        return timeDiff > 0 && timeDiff <= 5 * 60 * 1000 && !event.completionTracked;
      });
      
      if (recentlyEndedEvents.length > 0) {
        // Show completion dialog for the most recent event
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

    // Mark event as tracked
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
      description: `Task marked as ${completed ? 'completed' : 'incomplete'}. AI is learning your patterns!`,
    });

    // Trigger pattern analysis after recording
    await analyzePatterns();
  };

  const analyzePatterns = async () => {
    if (completions.length < 3) return; // Need minimum data
    
    setIsAnalyzing(true);
    
    try {
      // Analyze completion patterns by time and day
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
          
          if (relevantCompletions.length >= 2) { // Minimum samples
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
      
      // Generate recommendations based on patterns
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
    
    // Find high-energy time slots for the current day
    const todayPatterns = patterns.filter(p => p.dayOfWeek === currentDay);
    const highEnergySlots = todayPatterns.filter(p => p.energyLevel === 'high');
    const lowEnergySlots = todayPatterns.filter(p => p.energyLevel === 'low');
    
    // Recommend deep work during high-energy times
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
    
    // Recommend breaks during low-energy times
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

  const getEnergyLevelColor = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high': return 'text-success';
      case 'medium': return 'text-warning';
      case 'low': return 'text-destructive';
    }
  };

  const getEnergyLevelIcon = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high': return <TrendingUp className="h-4 w-4" />;
      case 'medium': return <Clock className="h-4 w-4" />;
      case 'low': return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Brain className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Agentic AI Coach</h1>
        {isAnalyzing && <Badge variant="secondary">Analyzing patterns...</Badge>}
      </div>

      {/* Productivity Patterns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Your Productivity Patterns
          </CardTitle>
        </CardHeader>
        <CardContent>
          {patterns.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Start scheduling tasks to build your productivity profile! The AI needs at least 3 completed tasks to identify patterns.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {patterns.map((pattern, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{pattern.timeSlot}</span>
                      <Badge variant="outline" className={getEnergyLevelColor(pattern.energyLevel)}>
                        {getEnergyLevelIcon(pattern.energyLevel)}
                        {pattern.energyLevel}
                      </Badge>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Completion Rate</span>
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
          )}
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <div key={rec.id} className="p-4 rounded-lg border bg-muted/50">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      {rec.type === 'energy_match' && <TrendingUp className="h-4 w-4 text-primary" />}
                      {rec.type === 'break' && <Clock className="h-4 w-4 text-warning" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{rec.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary">{rec.timeSlot}</Badge>
                        <Badge variant="outline">
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

      {/* Task Completion Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {completions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No task completions recorded yet.
            </p>
          ) : (
            <div className="space-y-2">
              {completions.slice(-5).reverse().map((completion) => (
                <div key={completion.id} className="flex items-center gap-3 p-2 rounded">
                  {completion.actualCompletion ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  )}
                  <span className="flex-1">{completion.taskTitle}</span>
                  <span className="text-sm text-muted-foreground">
                    {completion.scheduledTime}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Completion Dialog */}
      <Dialog open={!!activeTaskDialog} onOpenChange={() => setActiveTaskDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Task Completion Check</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Your scheduled task "<strong>{activeTaskDialog?.title}</strong>" just ended.
              Did you complete it successfully?
            </p>
            <div className="flex gap-3">
              <Button 
                onClick={() => recordTaskCompletion(activeTaskDialog.id, true, activeTaskDialog.goalId)}
                className="flex-1"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Yes, Completed
              </Button>
              <Button 
                variant="outline"
                onClick={() => recordTaskCompletion(activeTaskDialog.id, false, activeTaskDialog.goalId)}
                className="flex-1"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                No, Incomplete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};