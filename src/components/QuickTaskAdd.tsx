import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface QuickTaskAddProps {
  goalId: string;
  onTaskAdded: () => void;
}

export const QuickTaskAdd = ({ goalId, onTaskAdded }: QuickTaskAddProps) => {
  const [taskText, setTaskText] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

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
    <Card className="border-dashed border-2 border-muted-foreground/20 hover:border-primary/40 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Quick Add Task</span>
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