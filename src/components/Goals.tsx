import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Plus, 
  Target, 
  Calendar as CalendarIcon, 
  Flag, 
  Edit2, 
  Trash2, 
  CheckCircle2,
  Circle,
  MoreHorizontal,
  Search
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Goal {
  id: string;
  title: string;
  description: string | null;
  category: string;
  target_date: string | null;
  completed: boolean;
  created_at: string;
  tasks?: Task[];
}

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

const categoryColors: Record<string, string> = {
  academic: "bg-blue-50 border-blue-200 hover:bg-blue-100",
  personal: "bg-green-50 border-green-200 hover:bg-green-100",
  health: "bg-red-50 border-red-200 hover:bg-red-100",
  career: "bg-purple-50 border-purple-200 hover:bg-purple-100",
  financial: "bg-yellow-50 border-yellow-200 hover:bg-yellow-100",
};

const categoryBadgeColors: Record<string, string> = {
  academic: "bg-blue-100 text-blue-800",
  personal: "bg-green-100 text-green-800",
  health: "bg-red-100 text-red-800",
  career: "bg-purple-100 text-purple-800",
  financial: "bg-yellow-100 text-yellow-800",
};

export const Goals = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    category: "academic",
    target_date: undefined as Date | undefined,
    tasks: [] as Task[],
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
      
      // Transform data to include tasks (for now, parse from description if JSON format)
      const goalsWithTasks = data?.map(goal => ({
        ...goal,
        tasks: tryParseTasksFromDescription(goal.description)
      })) || [];
      
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

  const tryParseTasksFromDescription = (description: string | null): Task[] => {
    if (!description) return [];
    try {
      const parsed = JSON.parse(description);
      return Array.isArray(parsed.tasks) ? parsed.tasks : [];
    } catch {
      return [];
    }
  };

  const createTasksDescription = (description: string, tasks: Task[]) => {
    return JSON.stringify({
      description,
      tasks
    });
  };

  const handleCreateGoal = async () => {
    if (!newGoal.title.trim()) return;

    try {
      const goalData = {
        title: newGoal.title,
        description: createTasksDescription(newGoal.description, newGoal.tasks),
        category: newGoal.category,
        target_date: newGoal.target_date ? format(newGoal.target_date, 'yyyy-MM-dd') : null,
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
        description: "",
        category: "academic",
        target_date: undefined,
        tasks: [],
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
      const updateData: any = { ...updates };
      
      if (updates.tasks) {
        const goal = goals.find(g => g.id === goalId);
        const description = goal?.description ? 
          JSON.parse(goal.description).description || "" : "";
        updateData.description = createTasksDescription(description, updates.tasks);
        delete updateData.tasks;
      }

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
  };

  const removeTask = (tasks: Task[], taskId: string, setTasks: (tasks: Task[]) => void) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const filteredGoals = goals.filter(goal =>
    goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    goal.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const TasksList = ({ 
    tasks, 
    onTaskUpdate, 
    editable = false 
  }: { 
    tasks: Task[], 
    onTaskUpdate?: (tasks: Task[]) => void,
    editable?: boolean 
  }) => (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div key={task.id} className="flex items-center gap-2">
          <Checkbox
            checked={task.completed}
            onCheckedChange={(checked) => {
              if (onTaskUpdate) {
                updateTask(tasks, task.id, { completed: !!checked }, onTaskUpdate);
              }
            }}
            disabled={!editable && !onTaskUpdate}
          />
          {editable ? (
            <div className="flex-1 flex items-center gap-2">
              <Input
                value={task.text}
                onChange={(e) => onTaskUpdate && updateTask(tasks, task.id, { text: e.target.value }, onTaskUpdate)}
                placeholder="Enter task..."
                className="border-none p-0 h-auto focus-visible:ring-0"
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
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Goal title..."
                value={newGoal.title}
                onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
              />
              <Textarea
                placeholder="Description (optional)..."
                value={newGoal.description}
                onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-20"
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {newGoal.target_date ? format(newGoal.target_date, 'PPP') : 'Target date (optional)'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={newGoal.target_date}
                    onSelect={(date) => setNewGoal(prev => ({ ...prev, target_date: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search goals..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
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
                categoryColors[goal.category] || "bg-gray-50 border-gray-200 hover:bg-gray-100",
                goal.completed && "opacity-75"
              )}
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
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleUpdateGoal(goal.id, { completed: !goal.completed })}
                    >
                      {goal.completed ? <Circle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                    </Button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-40 p-2">
                        <div className="space-y-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => setEditingGoal(goal)}
                          >
                            <Edit2 className="h-3 w-3 mr-2" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-full justify-start text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteGoal(goal.id)}
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
                {goal.target_date && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                    <CalendarIcon className="h-3 w-3" />
                    Due {format(new Date(goal.target_date), 'MMM dd, yyyy')}
                  </div>
                )}
                
                {goal.tasks && goal.tasks.length > 0 && (
                  <div className="space-y-2">
                    {totalTasks > 0 && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="flex-1 bg-gray-200 rounded-full h-1">
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
                      onTaskUpdate={(tasks) => {
                        const updatedTasks = [...tasks];
                        if (goal.tasks!.length > 3) {
                          updatedTasks.push(...goal.tasks!.slice(3));
                        }
                        handleUpdateGoal(goal.id, { tasks: updatedTasks });
                      }}
                    />
                    {goal.tasks.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{goal.tasks.length - 3} more tasks
                      </p>
                    )}
                  </div>
                )}

                {(!goal.tasks || goal.tasks.length === 0) && goal.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {JSON.parse(goal.description).description || goal.description}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredGoals.length === 0 && (
        <div className="text-center py-12">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No goals found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? "Try adjusting your search terms" : "Create your first goal to get started!"}
          </p>
          {!searchTerm && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Goal
            </Button>
          )}
        </div>
      )}

      {/* Edit Goal Dialog */}
      {editingGoal && (
        <Dialog open={!!editingGoal} onOpenChange={() => setEditingGoal(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Goal title..."
                value={editingGoal.title}
                onChange={(e) => setEditingGoal(prev => prev ? { ...prev, title: e.target.value } : null)}
              />
              <Textarea
                placeholder="Description (optional)..."
                value={JSON.parse(editingGoal.description || '{}').description || ''}
                onChange={(e) => setEditingGoal(prev => {
                  if (!prev) return null;
                  const parsed = JSON.parse(prev.description || '{}');
                  return {
                    ...prev,
                    description: JSON.stringify({ ...parsed, description: e.target.value })
                  };
                })}
                className="min-h-20"
              />
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