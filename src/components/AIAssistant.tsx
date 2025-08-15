import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { Brain, User, BookOpen, Send, CalendarDays, Percent } from "lucide-react";
import { useMemo, useState } from "react";

const AIAssistant = () => {
  const { subjects, studySessions, getAttendanceStats } = useSupabaseData();

  const hours = Math.round(
    studySessions.reduce((s, ss) => s + (ss.duration_minutes || 0), 0) / 60
  );

  const attendanceOverall = useMemo(() => {
    try {
      return Number((getAttendanceStats().overall.percentage || 0).toFixed(1));
    } catch {
      return 0;
    }
  }, [getAttendanceStats]);

  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profile = useMemo(() => ({
    subjects: subjects.map(s => ({ id: s.id, name: s.name, code: s.code, credits: s.credits })),
    totals: { subjects: subjects.length, study_hours: hours, attendance_overall_pct: attendanceOverall },
  }), [subjects, hours, attendanceOverall]);

  const generateMockResponse = (userPrompt: string, userProfile: any) => {
    const responses = {
      study: [
        `Based on your ${userProfile.totals.subjects} subjects and ${userProfile.totals.study_hours}h of study time, I recommend focusing on your weakest subject first. Try the Pomodoro technique: 25 minutes of focused study, then 5-minute breaks.`,
        `Great progress with ${userProfile.totals.study_hours} study hours! To improve effectiveness, try active recall: close your books and write down everything you remember about the topic.`,
        `With ${userProfile.totals.attendance_overall_pct}% attendance, you're doing well! For better retention, review class notes within 24 hours and create mind maps for complex topics.`
      ],
      time: [
        `Time management tip: Use time-blocking. Dedicate specific hours to each subject based on difficulty. Start with your most challenging subject when your energy is highest.`,
        `Consider the 2-minute rule: if a task takes less than 2 minutes, do it immediately. This prevents small tasks from piling up and overwhelming you.`
      ],
      motivation: [
        `You've got this! Your ${userProfile.totals.study_hours} hours of study show dedication. Remember: progress over perfection. Small consistent steps lead to big achievements.`,
        `Feeling unmotivated? Break large tasks into tiny wins. Completing small goals builds momentum and confidence for bigger challenges.`
      ],
      default: [
        `As an academic assistant, I'm here to help! Try asking about study techniques, time management, or exam preparation strategies.`,
        `I can help you with study planning, productivity tips, and academic strategies. What specific area would you like to improve?`
      ]
    };

    const promptLower = userPrompt.toLowerCase();
    let category = 'default';
    
    if (promptLower.includes('study') || promptLower.includes('learn') || promptLower.includes('subject')) category = 'study';
    else if (promptLower.includes('time') || promptLower.includes('manage') || promptLower.includes('schedule')) category = 'time';
    else if (promptLower.includes('motivat') || promptLower.includes('help') || promptLower.includes('stuck')) category = 'motivation';
    
    const categoryResponses = responses[category as keyof typeof responses];
    return categoryResponses[Math.floor(Math.random() * categoryResponses.length)];
  };

  const askAI = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setAnswer("");
    
    // Simulate API delay for realistic experience
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    try {
      const mockResponse = generateMockResponse(prompt, profile);
      setAnswer(mockResponse);
    } catch (e: any) {
      setError("AI assistant temporarily unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center gap-2">
        <Brain className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">AI Assistant</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> Your Academic Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> Subjects: {subjects.length}</div>
          <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Total study hours: {hours}h</div>
          <div className="flex items-center gap-2"><Percent className="h-4 w-4" /> Attendance overall: {attendanceOverall}%</div>
          <p className="text-muted-foreground">Ask about your schedule, goals, or study plan. More features coming soon.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ask the AI</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="e.g., Create a weekly plan to improve my weakest subject"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
          />
          <div className="flex gap-2">
            <Button onClick={askAI} disabled={loading}>
              <Send className="h-4 w-4 mr-2" /> {loading ? "Thinking..." : "Ask"}
            </Button>
            <Button variant="ghost" onClick={() => { setPrompt(""); setAnswer(""); setError(null); }}>Clear</Button>
          </div>
          {error && <div className="text-sm text-destructive">{error}</div>}
          {answer && (
            <div className="text-sm whitespace-pre-wrap border rounded-md p-3 bg-muted/40">
              {answer}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AIAssistant;
