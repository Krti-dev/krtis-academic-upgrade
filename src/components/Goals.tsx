import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Plus, 
  Target, 
  Edit2, 
  Trash2, 
  CheckCircle2,
  Circle,
  MoreHorizontal
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import confetti from 'canvas-confetti';

interface Goal {
  id: string;
  title: string;
  description: string | null;
  category: string;
  target_date: string | null;
  completed: boolean;
  created_at: string;
  tasks?: Task[];
  tileColor?: string;
}

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

const categoryColors: Record<string, string> = {
  academic: "bg-primary/10 border-primary/20 hover:bg-primary/15",
  personal: "bg-success/10 border-success/20 hover:bg-success/15",
  health: "bg-destructive/10 border-destructive/20 hover:bg-destructive/15",
  career: "bg-info/10 border-info/20 hover:bg-info/15",
  financial: "bg-warning/10 border-warning/20 hover:bg-warning/15",
};

const categoryBadgeColors: Record<string, string> = {
  academic: "bg-primary/20 text-primary",
  personal: "bg-success/20 text-success",
  health: "bg-destructive/20 text-destructive",
  career: "bg-info/20 text-info",
  financial: "bg-warning/20 text-warning",
};

const tileColorClasses: Record<string, string> = {
  primary: "bg-primary/10 border-primary/20 hover:bg-primary/15",
  success: "bg-success/10 border-success/20 hover:bg-success/15",
  info: "bg-info/10 border-info/20 hover:bg-info/15",
  warning: "bg-warning/10 border-warning/20 hover:bg-warning/15",
  pink: "bg-pink/10 border-pink/20 hover:bg-pink/15",
  emerald: "bg-emerald/10 border-emerald/20 hover:bg-emerald/15",
  orange: "bg-orange/10 border-orange/20 hover:bg-orange/15",
  cyan: "bg-cyan/10 border-cyan/20 hover:bg-cyan/15",
  purple: "bg-purple/10 border-purple/20 hover:bg-purple/15",
};

export const Goals = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [newGoal, setNewGoal] = useState({
    title: "",
    category: "academic",
    tasks: [] as Task[],
    tileColor: "primary" as string,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('study_goals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to include tasks and color from description JSON
      const goalsWithTasks = (data || []).map((goal) => {
        const meta = parseDescription(goal.description);
        return {
          ...goal,
          tasks: meta.tasks,
          tileColor: meta.color || 'primary',
        };
      });

      setGoals(goalsWithTasks);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast({
        title: "Error",
        description: "Failed to fetch goals",
        variant: "destructive",
      });
    }
  };

  const parseDescription = (description: string | null): { tasks: Task[]; color?: string } => {
    if (!description) return { tasks: [], color: 'primary' };
    try {
      const parsed = JSON.parse(description);
      return {
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks as Task[] : [],
        color: parsed.color || 'primary',
      };
    } catch {
      return { tasks: [], color: 'primary' };
    }
  };

  const buildDescription = (tasks: Task[], color?: string) => {
    return JSON.stringify({ tasks, color: color || 'primary' });
  };

  const handleCreateGoal = async () => {
    if (!newGoal.title.trim()) return;

    try {
      const goalData = {
        title: newGoal.title,
        description: buildDescription(newGoal.tasks, newGoal.tileColor),
        category: newGoal.category,
        completed: false,
      };

      const { error } = await supabase
        .from('study_goals')
        .insert([goalData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Goal created successfully!",
      });

      setNewGoal({
        title: "",
        category: "academic",
        tasks: [],
        tileColor: 'primary',
      });
      setIsCreateDialogOpen(false);
      fetchGoals();
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        title: "Error",
        description: "Failed to create goal",
        variant: "destructive",
      });
    }
  };

  const handleUpdateGoal = async (goalId: string, updates: Partial<Goal>) => {
    try {
      const goal = goals.find(g => g.id === goalId);
      const meta = parseDescription(goal?.description || null);
      const mergedTasks = updates.tasks ? updates.tasks : (goal?.tasks || meta.tasks);
      const mergedColor = updates.tileColor ? updates.tileColor : (goal?.tileColor || meta.color || 'primary');

      const updateData: any = { ...updates };
      updateData.description = buildDescription(mergedTasks || [], mergedColor);
      delete updateData.tasks;
      delete updateData.tileColor;

      const { error } = await supabase
        .from('study_goals')
        .update(updateData)
        .eq('id', goalId);

      if (error) throw error;

      fetchGoals();
    } catch (error) {
      console.error('Error updating goal:', error);
      toast({
        title: "Error",
        description: "Failed to update goal",
        variant: "destructive",
      });
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('study_goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Goal deleted successfully!",
      });

      fetchGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast({
        title: "Error",
        description: "Failed to delete goal",
        variant: "destructive",
      });
    }
  };

  const addNewTask = (tasks: Task[], setTasks: (tasks: Task[]) => void) => {
    const newTask: Task = {
      id: Date.now().toString(),
      text: "",
      completed: false,
    };
    setTasks([...tasks, newTask]);
  };

  const updateTask = (tasks: Task[], taskId: string, updates: Partial<Task>, setTasks: (tasks: Task[]) => void) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, ...updates } : task
    );
    setTasks(updatedTasks);
    
    // Trigger confetti if task is being completed
    if (updates.completed === true) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const removeTask = (tasks: Task[], taskId: string, setTasks: (tasks: Task[]) => void) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const filteredGoals = goals;

  const TasksList = ({ 
    tasks, 
    onTaskUpdate, 
    editable = false,
    goalId
  }: { 
    tasks: Task[], 
    onTaskUpdate?: (tasks: Task[]) => void,
    editable?: boolean,
    goalId?: string
  }) => (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div key={task.id} className="flex items-center gap-2">
          <Checkbox
            checked={task.completed}
            onCheckedChange={(checked) => {
              if (onTaskUpdate) {
                updateTask(tasks, task.id, { completed: !!checked }, onTaskUpdate);
              } else if (goalId) {
                // For non-editable mode, update directly in database
                const goal = goals.find(g => g.id === goalId);
                if (goal) {
                  const updatedTasks = goal.tasks?.map(t => 
                    t.id === task.id ? { ...t, completed: !!checked } : t
                  ) || [];
                  
                  if (checked) {
                    confetti({
                      particleCount: 100,
                      spread: 70,
                      origin: { y: 0.6 }
                    });
                  }
                  
                  handleUpdateGoal(goalId, { tasks: updatedTasks });
                }
              }
            }}
          />
          {editable ? (
            <div className="flex-1 flex items-center gap-2">
              <Input
                key={`task-input-${task.id}`}
                value={task.text}
                onChange={(e) => {
                  if (onTaskUpdate) {
                    updateTask(tasks, task.id, { text: e.target.value }, onTaskUpdate);
                  }
                }}
                placeholder="Enter task..."
                className="border-none p-0 h-auto focus-visible:ring-0"
                autoFocus={!task.text}
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onTaskUpdate && removeTask(tasks, task.id, onTaskUpdate)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <span className={cn("flex-1", task.completed && "line-through text-muted-foreground")}>
              {task.text}
            </span>
          )}
        </div>
      ))}
      {editable && onTaskUpdate && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => addNewTask(tasks, onTaskUpdate)}
          className="w-full justify-start text-muted-foreground"
        >
          <Plus className="h-3 w-3 mr-2" />
          Add task
        </Button>
      )}
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Goals</h1>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
              <DialogDescription>Set a title, color and add tasks for this goal.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Goal title..."
                value={newGoal.title}
                onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
              />
              <Select value={newGoal.category} onValueChange={(value) => setNewGoal(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="career">Career</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                </SelectContent>
              </Select>

              <div>
                <h4 className="text-sm font-medium mb-2">Tile color</h4>
                <Select value={newGoal.tileColor} onValueChange={(value) => setNewGoal(prev => ({ ...prev, tileColor: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primary</SelectItem>
                    <SelectItem value="success">Green</SelectItem>
                    <SelectItem value="info">Blue</SelectItem>
                    <SelectItem value="warning">Yellow</SelectItem>
                    <SelectItem value="pink">Pink</SelectItem>
                    <SelectItem value="emerald">Emerald</SelectItem>
                    <SelectItem value="orange">Orange</SelectItem>
                    <SelectItem value="cyan">Cyan</SelectItem>
                    <SelectItem value="purple">Purple</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Tasks</h4>
                <TasksList 
                  tasks={newGoal.tasks}
                  onTaskUpdate={(tasks) => setNewGoal(prev => ({ ...prev, tasks }))}
                  editable
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleCreateGoal} className="flex-1">Create</Button>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>


      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGoals.map((goal) => {
          const completedTasks = goal.tasks?.filter(task => task.completed).length || 0;
          const totalTasks = goal.tasks?.length || 0;
          const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

          return (
              <Card 
                key={goal.id} 
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-md",
                  goal.tileColor ? (tileColorClasses[goal.tileColor] || tileColorClasses.primary) : (categoryColors[goal.category] || tileColorClasses.primary),
                  goal.completed && "opacity-75"
                )}
                onClick={() => {
                  // Open editor to add/view tasks instead of auto-adding a checkbox
                  setEditingGoal(goal);
                }}
              >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base line-clamp-2 mb-2">
                      {goal.title}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary" 
                        className={cn("text-xs", categoryBadgeColors[goal.category])}
                      >
                        {goal.category}
                      </Badge>
                      {goal.completed && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                    </div>
                  </div>
                   <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                     <Button
                       size="sm"
                       variant="ghost"
                       onClick={(e) => {
                         e.stopPropagation();
                         handleUpdateGoal(goal.id, { completed: !goal.completed });
                       }}
                     >
                       {goal.completed ? <Circle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                     </Button>
                     <Popover>
                       <PopoverTrigger asChild>
                         <Button size="sm" variant="ghost" onClick={(e) => e.stopPropagation()}>
                           <MoreHorizontal className="h-4 w-4" />
                         </Button>
                       </PopoverTrigger>
                       <PopoverContent className="w-40 p-2">
                         <div className="space-y-1">
                           <Button
                             size="sm"
                             variant="ghost"
                             className="w-full justify-start"
                             onClick={(e) => {
                               e.stopPropagation();
                               setEditingGoal(goal);
                             }}
                           >
                             <Edit2 className="h-3 w-3 mr-2" />
                             Edit
                           </Button>
                           <Button
                             size="sm"
                             variant="ghost"
                             className="w-full justify-start text-red-600 hover:text-red-700"
                             onClick={(e) => {
                               e.stopPropagation();
                               handleDeleteGoal(goal.id);
                             }}
                           >
                             <Trash2 className="h-3 w-3 mr-2" />
                             Delete
                           </Button>
                         </div>
                       </PopoverContent>
                     </Popover>
                   </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                
                {goal.tasks && goal.tasks.length > 0 && (
                  <div className="space-y-2">
                    {totalTasks > 0 && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex-1 bg-muted rounded-full h-1">
                    <div 
                      className="bg-primary h-1 rounded-full transition-all duration-300" 
                      style={{ width: `${progress}%` }}
                    />
                        </div>
                        <span>{completedTasks}/{totalTasks}</span>
                      </div>
                    )}
                    <TasksList 
                      tasks={goal.tasks.slice(0, 3)} 
                      goalId={goal.id}
                    />
                    {goal.tasks.length > 3 && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          +{goal.tasks.length - 3} more tasks
                        </p>
                         <Button 
                           size="sm" 
                           variant="ghost" 
                           className="w-full text-xs"
                           onClick={(e) => {
                             e.stopPropagation();
                             setEditingGoal(goal);
                           }}
                         >
                           View all tasks
                         </Button>
                      </div>
                    )}
                  </div>
                )}

                {(!goal.tasks || goal.tasks.length === 0) && (
                  <p className="text-sm text-muted-foreground">
                    No tasks yet. Click the card to add tasks.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {goals.length === 0 && (
        <div className="text-center py-12">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No goals yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first goal to get started!
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Goal
          </Button>
        </div>
      )}

      {/* Edit Goal Dialog */}
      {editingGoal && (
        <Dialog open={!!editingGoal} onOpenChange={() => setEditingGoal(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Goal</DialogTitle>
              <DialogDescription>Update the title, color, category and tasks.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Goal title..."
                value={editingGoal.title}
                onChange={(e) => setEditingGoal(prev => prev ? { ...prev, title: e.target.value } : null)}
              />
              <div>
                <h4 className="text-sm font-medium mb-2">Tile color</h4>
                <Select 
                  value={editingGoal.tileColor || 'primary'} 
                  onValueChange={(value) => setEditingGoal(prev => prev ? { ...prev, tileColor: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primary</SelectItem>
                    <SelectItem value="success">Green</SelectItem>
                    <SelectItem value="info">Blue</SelectItem>
                    <SelectItem value="warning">Yellow</SelectItem>
                    <SelectItem value="pink">Pink</SelectItem>
                    <SelectItem value="emerald">Emerald</SelectItem>
                    <SelectItem value="orange">Orange</SelectItem>
                    <SelectItem value="cyan">Cyan</SelectItem>
                    <SelectItem value="purple">Purple</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Select 
                value={editingGoal.category} 
                onValueChange={(value) => setEditingGoal(prev => prev ? { ...prev, category: value } : null)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="career">Career</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                </SelectContent>
              </Select>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Tasks</h4>
                <TasksList 
                  tasks={editingGoal.tasks || []}
                  onTaskUpdate={(tasks) => setEditingGoal(prev => prev ? { ...prev, tasks } : null)}
                  editable
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    if (editingGoal) {
                      handleUpdateGoal(editingGoal.id, editingGoal);
                      setEditingGoal(null);
                    }
                  }}
                  className="flex-1"
                >
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setEditingGoal(null)}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};