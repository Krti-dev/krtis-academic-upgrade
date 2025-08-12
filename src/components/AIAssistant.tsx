import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { Brain, User, BookOpen } from "lucide-react";

const AIAssistant = () => {
  const { subjects, studySessions } = useSupabaseData();

  const hours = Math.round(
    studySessions.reduce((s, ss) => s + (ss.duration_minutes || 0), 0) / 60
  );

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center gap-2">
        <Brain className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">AI Assistant (Preview)</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> Your Academic Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> Subjects: {subjects.length}</div>
          <div>Total study hours tracked: {hours}h</div>
          <p className="text-muted-foreground">Ask me anything about your schedule, goals, or study plan. More smart features coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIAssistant;
