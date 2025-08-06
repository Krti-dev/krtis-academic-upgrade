import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Construction } from "lucide-react";

const StudyTracker = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Study Tracker</h1>
      </div>

      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-center">
            <Construction className="h-8 w-8" />
            Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground text-lg">
            The Study Tracker is being redesigned with exciting new features!
          </p>
          <p className="text-sm text-muted-foreground">
            Stay tuned for advanced analytics, improved goal tracking, and more.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudyTracker;