import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { 
  Brain, 
  User, 
  BookOpen, 
  Send, 
  CalendarDays, 
  Percent,
  TrendingUp,
  Target,
  Clock,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Lightbulb,
  Zap
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

interface InsightCard {
  id: string;
  type: 'suggestion' | 'achievement' | 'alert';
  title: string;
  description: string;
  icon: any;
  color: string;
  action?: string;
}

const SmartAIAssistant = () => {
  const { user } = useAuth();
  const { subjects, studySessions, getAttendanceStats, expenses, budgetLimits } = useSupabaseData();
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null);

  const stats = useMemo(() => {
    const attendanceOverall = getAttendanceStats()?.overall?.percentage || 0;
    const totalStudyHours = studySessions.reduce((s, ss) => s + (ss.duration_minutes || 0), 0) / 60;
    const weeklyHours = studySessions
      .filter(s => {
        const sessionDate = new Date(s.date);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return sessionDate >= weekAgo;
      })
      .reduce((sum, s) => sum + s.duration_minutes, 0) / 60;

    const totalBudget = budgetLimits.reduce((sum, limit) => sum + Number(limit.monthly_limit), 0);
    const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
    const budgetUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return {
      subjects: subjects.length,
      totalStudyHours: Math.round(totalStudyHours),
      weeklyHours: Math.round(weeklyHours * 10) / 10,
      attendanceOverall: Math.round(attendanceOverall * 10) / 10,
      budgetUsed: Math.round(budgetUsed)
    };
  }, [subjects, studySessions, getAttendanceStats, expenses, budgetLimits]);

  const smartInsights = useMemo((): InsightCard[] => {
    const insights: InsightCard[] = [];

    // Study insights
    if (stats.weeklyHours < 10) {
      insights.push({
        id: 'low-study-hours',
        type: 'suggestion',
        title: 'Increase Study Time',
        description: `You've studied ${stats.weeklyHours}h this week. Try to reach 15+ hours for better performance.`,
        icon: Clock,
        color: 'warning',
        action: 'Create a study schedule'
      });
    } else if (stats.weeklyHours > 20) {
      insights.push({
        id: 'high-study-hours',
        type: 'achievement',
        title: 'Excellent Study Dedication',
        description: `${stats.weeklyHours}h this week! Great consistency. Remember to take breaks.`,
        icon: TrendingUp,
        color: 'success'
      });
    }

    // Attendance insights
    if (stats.attendanceOverall < 75) {
      insights.push({
        id: 'low-attendance',
        type: 'alert',
        title: 'Attendance Alert',
        description: `${stats.attendanceOverall}% attendance is below 75%. Consider attending more classes.`,
        icon: AlertCircle,
        color: 'destructive',
        action: 'View attendance details'
      });
    } else if (stats.attendanceOverall > 90) {
      insights.push({
        id: 'great-attendance',
        type: 'achievement',
        title: 'Outstanding Attendance',
        description: `${stats.attendanceOverall}% attendance! Keep up the excellent work.`,
        icon: CheckCircle,
        color: 'success'
      });
    }

    // Budget insights
    if (stats.budgetUsed > 90) {
      insights.push({
        id: 'budget-alert',
        type: 'alert',
        title: 'Budget Limit Approaching',
        description: `You've used ${stats.budgetUsed}% of your monthly budget. Consider reducing expenses.`,
        icon: AlertCircle,
        color: 'destructive',
        action: 'Review expenses'
      });
    } else if (stats.budgetUsed < 50) {
      insights.push({
        id: 'budget-healthy',
        type: 'achievement',
        title: 'Great Financial Management',
        description: `Only ${stats.budgetUsed}% budget used. You're managing finances well!`,
        icon: CheckCircle,
        color: 'success'
      });
    }

    // Study balance insights
    const recentSessions = studySessions.slice(0, 10);
    const avgEffectiveness = recentSessions.length > 0 
      ? recentSessions.reduce((sum, s) => sum + (s.effectiveness_rating || 5), 0) / recentSessions.length
      : 5;

    if (avgEffectiveness < 6) {
      insights.push({
        id: 'effectiveness-tip',
        type: 'suggestion',
        title: 'Improve Study Effectiveness',
        description: 'Try the Pomodoro technique: 25 min focus + 5 min break cycles.',
        icon: Lightbulb,
        color: 'info',
        action: 'Start focus timer'
      });
    }

    return insights;
  }, [stats, studySessions]);

  const generateContextualResponse = (userPrompt: string) => {
    const promptLower = userPrompt.toLowerCase();
    
    // Context-aware responses based on user data
    if (promptLower.includes('study') || promptLower.includes('improve')) {
      if (stats.weeklyHours < 10) {
        return `I notice you've studied ${stats.weeklyHours} hours this week, which is below the recommended 15+ hours. Here's a personalized plan:

1. **Time Blocking**: Schedule 2-3 hour study blocks daily
2. **Priority Subjects**: Focus on subjects with lower attendance first
3. **Pomodoro Technique**: 25-min focused sessions with 5-min breaks
4. **Environment**: Find a quiet, distraction-free study space

Your attendance is ${stats.attendanceOverall}%, so attending more classes will also boost your understanding and reduce study time needed.`;
      } else {
        return `Great job on ${stats.weeklyHours} hours this week! To maintain this momentum:

1. **Quality over Quantity**: Focus on active recall and spaced repetition
2. **Review Cycle**: Review previous day's topics for 15 minutes daily
3. **Practice Tests**: Take mock exams to identify weak areas
4. **Study Groups**: Collaborate with classmates for difficult topics

Your ${stats.attendanceOverall}% attendance is excellent, which gives you a solid foundation!`;
      }
    }

    if (promptLower.includes('budget') || promptLower.includes('money') || promptLower.includes('expense')) {
      if (stats.budgetUsed > 80) {
        return `You've used ${stats.budgetUsed}% of your budget this month. Here are some immediate strategies:

1. **Track Everything**: Record every expense for better awareness
2. **Essential vs Nice-to-Have**: Prioritize necessities only
3. **Student Discounts**: Use student offers for food, transport, books
4. **Free Alternatives**: Library books, free online courses, campus activities
5. **Weekly Reviews**: Check spending every Sunday

Consider setting up category-wise budgets (food, transport, entertainment) for better control.`;
      } else {
        return `Excellent budget management! You're only at ${stats.budgetUsed}% usage. Here's how to maintain this:

1. **Emergency Fund**: Save 10-20% for unexpected expenses
2. **Investment Learning**: Start learning about safe investment options
3. **Skill Building**: Invest in courses or certifications for future earnings
4. **Reward System**: Set aside a small amount for occasional treats

Your disciplined approach to finances will serve you well in the long term!`;
      }
    }

    if (promptLower.includes('time') || promptLower.includes('schedule') || promptLower.includes('manage')) {
      return `Based on your ${stats.weeklyHours}h study time and ${stats.attendanceOverall}% attendance, here's a personalized time management strategy:

**Daily Structure:**
- 6:00-7:00 AM: Morning review (previous day's notes)
- Class hours: Active participation and note-taking
- 2:00-5:00 PM: Deep study sessions (hardest subjects first)
- 7:00-8:00 PM: Light review and next-day preparation
- 8:00-9:00 PM: Hobby/relaxation time

**Weekly Planning:**
- Sunday: Plan entire week, review goals
- Wednesday: Mid-week review and adjustments
- Friday: Week wrap-up and weekend planning

**Pro Tips:**
- Use calendar blocking for subjects
- 2-minute rule: If it takes <2 minutes, do it now
- Batch similar tasks together`;
    }

    if (promptLower.includes('motivation') || promptLower.includes('stuck') || promptLower.includes('help')) {
      return `I see you're looking for motivation! Based on your current progress:

**Your Wins:**
- ${stats.totalStudyHours} total study hours logged 💪
- ${stats.attendanceOverall}% attendance rate 📚
- ${stats.subjects} subjects being managed 🎯

**Motivation Strategies:**
1. **Micro-Goals**: Break large tasks into 15-minute chunks
2. **Visual Progress**: Use charts to track daily wins
3. **Accountability**: Share goals with friends/family
4. **Reward System**: Small treats for completing daily goals
5. **Progress Not Perfection**: Focus on consistency over perfection

Remember: Every expert was once a beginner. Your ${stats.weeklyHours}h this week shows you're building the right habits!`;
    }

    // General responses
    const responses = [
      `Based on your academic profile (${stats.subjects} subjects, ${stats.weeklyHours}h/week study time), I recommend focusing on consistency over intensity. Small daily improvements compound over time!`,
      `With ${stats.attendanceOverall}% attendance, you're building a solid foundation. Now let's optimize your study efficiency with active learning techniques like the Feynman method.`,
      `Your current study pattern shows great potential. Try implementing the 3-2-1 method: Review material 3 days, 2 days, and 1 day before exams for better retention.`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  };

  const askAI = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setAnswer("");
    
    // Simulate realistic API delay
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1500));
    
    try {
      const contextualResponse = generateContextualResponse(prompt);
      setAnswer(contextualResponse);
    } catch (e) {
      setAnswer("AI assistant temporarily unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInsightClick = (insight: InsightCard) => {
    setSelectedInsight(insight.id);
    setPrompt(`Tell me more about: ${insight.title}`);
  };

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Header with gradient */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/20 via-purple/10 to-info/20 p-6 border border-border/50">
        <div className="absolute inset-0 mesh-background opacity-50"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Smart AI Assistant</h1>
              <p className="text-muted-foreground">Personalized insights and recommendations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Academic Profile Card */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Your Academic Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/10">
              <BookOpen className="h-6 w-6 text-primary mx-auto mb-2" />
              <div className="text-xl font-semibold">{stats.subjects}</div>
              <div className="text-xs text-muted-foreground">Subjects</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-success/5 border border-success/10">
              <Clock className="h-6 w-6 text-success mx-auto mb-2" />
              <div className="text-xl font-semibold">{stats.weeklyHours}h</div>
              <div className="text-xs text-muted-foreground">This Week</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-info/5 border border-info/10">
              <CalendarDays className="h-6 w-6 text-info mx-auto mb-2" />
              <div className="text-xl font-semibold">{stats.attendanceOverall}%</div>
              <div className="text-xs text-muted-foreground">Attendance</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-warning/5 border border-warning/10">
              <Target className="h-6 w-6 text-warning mx-auto mb-2" />
              <div className="text-xl font-semibold">{stats.budgetUsed}%</div>
              <div className="text-xs text-muted-foreground">Budget Used</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Smart Insights */}
      {smartInsights.length > 0 && (
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Smart Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {smartInsights.map((insight) => {
                const Icon = insight.icon;
                const colorClass = {
                  suggestion: 'border-info/20 bg-info/5',
                  achievement: 'border-success/20 bg-success/5',
                  alert: 'border-destructive/20 bg-destructive/5'
                }[insight.type];

                return (
                  <div
                    key={insight.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-1 ${colorClass}`}
                    onClick={() => handleInsightClick(insight)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        insight.color === 'success' ? 'bg-success/10' :
                        insight.color === 'warning' ? 'bg-warning/10' :
                        insight.color === 'destructive' ? 'bg-destructive/10' :
                        'bg-info/10'
                      }`}>
                        <Icon className={`h-4 w-4 ${
                          insight.color === 'success' ? 'text-success' :
                          insight.color === 'warning' ? 'text-warning' :
                          insight.color === 'destructive' ? 'text-destructive' :
                          'text-info'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm mb-1">{insight.title}</h4>
                        <p className="text-xs text-muted-foreground mb-2">{insight.description}</p>
                        {insight.action && (
                          <Badge variant="outline" className="text-xs">
                            {insight.action}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Chat */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Ask the AI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="e.g., How can I improve my study effectiveness? What's the best way to manage my budget?"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <div className="flex gap-2">
            <Button 
              onClick={askAI} 
              disabled={loading || !prompt.trim()}
              className="flex-1"
            >
              <Send className="h-4 w-4 mr-2" />
              {loading ? "Thinking..." : "Ask AI"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => { 
                setPrompt(""); 
                setAnswer(""); 
                setSelectedInsight(null); 
              }}
            >
              Clear
            </Button>
          </div>
          
          {answer && (
            <div className="mt-4 p-4 rounded-lg bg-muted/40 border border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">AI Response</span>
              </div>
              <div className="text-sm whitespace-pre-wrap leading-relaxed">
                {answer}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Study Tips", prompt: "Give me effective study techniques" },
              { label: "Time Management", prompt: "How can I better manage my time?" },
              { label: "Budget Help", prompt: "Tips for managing student budget" },
              { label: "Motivation", prompt: "I need motivation to study consistently" }
            ].map((action) => (
              <Button
                key={action.label}
                variant="outline"
                size="sm"
                onClick={() => setPrompt(action.prompt)}
                className="h-auto p-3 text-center hover:bg-primary/5"
              >
                {action.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SmartAIAssistant;