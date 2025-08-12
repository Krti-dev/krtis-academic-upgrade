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

  const askAI = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setAnswer("");
    try {
      const res = await fetch("https://czjgbvupjrkihilofdre.functions.supabase.co/generate-with-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, profile }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Request failed");
      setAnswer(data.generatedText || "");
    } catch (e: any) {
      setError(e.message || "AI request failed. Configure OPENAI_API_KEY in Supabase.");
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
