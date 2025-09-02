import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

interface QuickTaskAddProps {
  goalId: string;
  onTaskAdded: () => void;
  goalTitle?: string;
  goalCategory?: string;
}

export const QuickTaskAdd = ({ goalId, onTaskAdded, goalTitle, goalCategory }: QuickTaskAddProps) => {
  const [taskText, setTaskText] = useState("");
  const [goalInfo, setGoalInfo] = useState<{ title: string; category: string } | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (goalTitle && goalCategory) {
      setGoalInfo({ title: goalTitle, category: goalCategory });
    } else {
      fetchGoalInfo();
    }
  }, [goalId, goalTitle, goalCategory]);

  const fetchGoalInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('study_goals')
        .select('title, category')
        .eq('id', goalId)
        .single();

      if (error) throw error;
      setGoalInfo(data);
    } catch (error) {
      console.error('Error fetching goal info:', error);
    }
  };

  const handleAddTask = async () => {
    if (!taskText.trim()) return;

    setIsAdding(true);
    try {
      // Get current goal to update its tasks
      const { data: goal, error: fetchError } = await supabase
        .from('study_goals')
        .select('description')
        .eq('id', goalId)
        .single();

      if (fetchError) throw fetchError;

      // Parse existing tasks
      let existingTasks = [];
      let color = 'primary';
      
      if (goal.description) {
        try {
          const parsed = JSON.parse(goal.description);
          existingTasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
          color = parsed.color || 'primary';
        } catch {
          // Handle non-JSON descriptions
        }
      }

      // Add new task
      const newTask = {
        id: Date.now().toString(),
        text: taskText.trim(),
        completed: false,
      };

      const updatedTasks = [...existingTasks, newTask];
      const newDescription = JSON.stringify({ tasks: updatedTasks, color });

      // Update goal with new task
      const { error: updateError } = await supabase
        .from('study_goals')
        .update({ description: newDescription })
        .eq('id', goalId);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Task added successfully!",
      });

      setTaskText("");
      onTaskAdded();
    } catch (error) {
      console.error('Error adding task:', error);
      toast({
        title: "Error",
        description: "Failed to add task",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Card className="border-dashed border-2 border-muted-foreground/20 hover:border-primary/40 transition-all duration-300 hover:shadow-md animate-fade-in">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <span className="text-sm font-medium text-muted-foreground">Quick Add to</span>
            <p className="text-sm font-semibold truncate">{goalInfo?.title || 'Loading...'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Enter a new task..."
            value={taskText}
            onChange={(e) => setTaskText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTask();
              }
            }}
            className="flex-1"
          />
          <Button 
            onClick={handleAddTask} 
            disabled={!taskText.trim() || isAdding}
            size="sm"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};