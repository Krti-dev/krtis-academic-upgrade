import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Target, 
  Edit2, 
  Trash2, 
  CheckCircle2,
  Calendar,
  Clock,
  TrendingUp,
  Star,
  Award,
  Flame,
  Sparkles,
  Filter,
  Search,
  MoreVertical
} from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import confetti from 'canvas-confetti';
import { useAuth } from "@/hooks/useAuth";

interface Goal {
  id: string;
  title: string;
  description: string | null;
  category: string;
  target_date: string | null;
  completed: boolean;
  created_at: string;
  user_id: string;
  tasks?: Task[];
  tileColor?: string;
  priority?: 'low' | 'medium' | 'high';
}

interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority?: 'low' | 'medium' | 'high';
}

const CATEGORIES = [
  { value: 'academic', label: 'Academic', color: 'hsl(var(--primary))' },
  { value: 'personal', label: 'Personal', color: 'hsl(var(--success))' },
  { value: 'health', label: 'Health', color: 'hsl(var(--destructive))' },
  { value: 'career', label: 'Career', color: 'hsl(var(--info))' },
  { value: 'financial', label: 'Financial', color: 'hsl(var(--warning))' },
  { value: 'creative', label: 'Creative', color: 'hsl(var(--purple))' },
  { value: 'social', label: 'Social', color: 'hsl(var(--pink))' }
];

const COLORS = [
  { value: 'primary', label: 'Primary', class: 'bg-primary/10 border-primary/20 hover:bg-primary/15' },
  { value: 'success', label: 'Green', class: 'bg-success/10 border-success/20 hover:bg-success/15' },
  { value: 'info', label: 'Blue', class: 'bg-info/10 border-info/20 hover:bg-info/15' },
  { value: 'warning', label: 'Yellow', class: 'bg-warning/10 border-warning/20 hover:bg-warning/15' },
  { value: 'purple', label: 'Purple', class: 'bg-purple/10 border-purple/20 hover:bg-purple/15' },
  { value: 'pink', label: 'Pink', class: 'bg-pink/10 border-pink/20 hover:bg-pink/15' },
  { value: 'emerald', label: 'Emerald', class: 'bg-emerald/10 border-emerald/20 hover:bg-emerald/15' },
  { value: 'orange', label: 'Orange', class: 'bg-orange/10 border-orange/20 hover:bg-orange/15' },
  { value: 'cyan', label: 'Cyan', class: 'bg-cyan/10 border-cyan/20 hover:bg-cyan/15' }
];

export const EnhancedGoals = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [goals, setGoals] = useState<Goal[]>([]);
  const [filteredGoals, setFilteredGoals] = useState<Goal[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    category: "academic",
    target_date: "",
    priority: "medium" as 'low' | 'medium' | 'high',
    tileColor: "primary",
    tasks: [] as Task[]
  });

  useEffect(() => {
    if (user) {
      fetchGoals();
    } else {
      setGoals([]);
    }
  }, [user]);

  useEffect(() => {
    filterGoals();
  }, [goals, searchTerm, filterCategory, filterStatus]);

  const fetchGoals = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('study_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const goalsWithTasks = (data || []).map((goal) => {
        const meta = parseGoalDescription(goal.description);
        return {
          ...goal,
          ...meta
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

  const parseGoalDescription = (description: string | null) => {
    if (!description) return { tasks: [], tileColor: 'primary', priority: 'medium' as const };
    try {
      const parsed = JSON.parse(description);
      return {
        tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
        tileColor: parsed.color || 'primary',
        priority: parsed.priority || 'medium'
      };
    } catch {
      return { tasks: [], tileColor: 'primary', priority: 'medium' as const };
    }
  };

  const buildGoalDescription = (tasks: Task[], color: string, priority: string) => {
    return JSON.stringify({ tasks, color, priority });
  };

  const filterGoals = () => {
    let filtered = [...goals];

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(goal => 
        goal.title.toLowerCase().includes(searchLower) ||
        goal.description?.toLowerCase().includes(searchLower) ||
        goal.tasks?.some(task => task.text.toLowerCase().includes(searchLower))
      );
    }

    if (filterCategory !== "all") {
      filtered = filtered.filter(goal => goal.category === filterCategory);
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(goal => 
        filterStatus === "completed" ? goal.completed : !goal.completed
      );
    }

    // Sort by priority and due date
    filtered.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority || 'medium'];
      const bPriority = priorityOrder[b.priority || 'medium'];
      
      if (aPriority !== bPriority) return bPriority - aPriority;
      
      if (a.target_date && b.target_date) {
        return new Date(a.target_date).getTime() - new Date(b.target_date).getTime();
      }
      
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    setFilteredGoals(filtered);
  };

  const handleCreateGoal = async () => {
    if (!newGoal.title.trim()) return;
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create goals",
        variant: "destructive",
      });
      return;
    }

    try {
      const goalData = {
        title: newGoal.title,
        description: buildGoalDescription(newGoal.tasks, newGoal.tileColor, newGoal.priority),
        category: newGoal.category,
        target_date: newGoal.target_date || null,
        completed: false,
        user_id: user.id,
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
        target_date: "",
        priority: "medium",
        tileColor: "primary",
        tasks: []
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

  const handleCompleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from('study_goals')
        .update({ completed: true })
        .eq('id', goalId);

      if (error) throw error;

      // Celebrate completion
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      toast({
        title: "Congratulations! 🎉",
        description: "Goal completed successfully!",
      });

      fetchGoals();
    } catch (error) {
      console.error('Error completing goal:', error);
      toast({
        title: "Error",
        description: "Failed to complete goal",
        variant: "destructive",
      });
    }
  };

  const addTaskToGoal = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const newTask: Task = {
      id: Date.now().toString(),
      text: "",
      completed: false,
      priority: 'medium'
    };

    const updatedTasks = [...(goal.tasks || []), newTask];
    updateGoalTasks(goalId, updatedTasks);
  };

  const updateGoalTasks = async (goalId: string, tasks: Task[]) => {
    try {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      const description = buildGoalDescription(tasks, goal.tileColor || 'primary', goal.priority || 'medium');
      
      const { error } = await supabase
        .from('study_goals')
        .update({ description })
        .eq('id', goalId);

      if (error) throw error;
      fetchGoals();
    } catch (error) {
      console.error('Error updating goal tasks:', error);
      toast({
        title: "Error",
        description: "Failed to update tasks",
        variant: "destructive",
      });
    }
  };

  const updateTask = (goalId: string, taskId: string, updates: Partial<Task>) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const updatedTasks = (goal.tasks || []).map(task =>
      task.id === taskId ? { ...task, ...updates } : task
    );

    if (updates.completed === true) {
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.7 }
      });
    }

    updateGoalTasks(goalId, updatedTasks);
  };

  const deleteTask = (goalId: string, taskId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const updatedTasks = (goal.tasks || []).filter(task => task.id !== taskId);
    updateGoalTasks(goalId, updatedTasks);
  };

  const deleteGoal = async (goalId: string) => {
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

  const getProgressPercentage = (goal: Goal) => {
    if (!goal.tasks || goal.tasks.length === 0) return 0;
    const completedTasks = goal.tasks.filter(task => task.completed).length;
    return Math.round((completedTasks / goal.tasks.length) * 100);
  };

  const getDaysUntilDue = (targetDate: string | null) => {
    if (!targetDate) return null;
    const days = differenceInDays(parseISO(targetDate), new Date());
    return days;
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <Flame className="h-4 w-4 text-destructive" />;
      case 'medium': return <Star className="h-4 w-4 text-warning" />;
      case 'low': return <Clock className="h-4 w-4 text-muted-foreground" />;
      default: return <Star className="h-4 w-4 text-warning" />;
    }
  };

  const getColorClass = (color: string) => {
    return COLORS.find(c => c.value === color)?.class || COLORS[0].class;
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/20 via-purple/10 to-success/20 p-6 border border-border/50">
        <div className="absolute inset-0 mesh-background opacity-30"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Enhanced Goals</h1>
                <p className="text-muted-foreground">Track progress and achieve your objectives</p>
              </div>
            </div>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="glass-button hover:scale-105 transition-all duration-200">
                <Plus className="h-4 w-4 mr-2" />
                Create Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg" aria-describedby="goal-dialog-description">
              <DialogHeader>
                <DialogTitle>Create New Goal</DialogTitle>
                <p id="goal-dialog-description" className="text-sm text-muted-foreground">
                  Create a new goal to track your progress and achievements
                </p>
              </DialogHeader>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <Input
                  placeholder="Goal title..."
                  value={newGoal.title}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                />
                
                <Textarea
                  placeholder="Goal description (optional)..."
                  value={newGoal.description}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Category</label>
                    <Select value={newGoal.category} onValueChange={(value) => setNewGoal(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Priority</label>
                    <Select value={newGoal.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setNewGoal(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Target Date</label>
                    <Input
                      type="date"
                      value={newGoal.target_date}
                      onChange={(e) => setNewGoal(prev => ({ ...prev, target_date: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Color</label>
                    <Select value={newGoal.tileColor} onValueChange={(value) => setNewGoal(prev => ({ ...prev, tileColor: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COLORS.map(color => (
                          <SelectItem key={color.value} value={color.value}>{color.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleCreateGoal} className="flex-1">
                    Create Goal
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search goals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{goals.length}</div>
            <div className="text-sm text-muted-foreground">Total Goals</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-success">{goals.filter(g => g.completed).length}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">{goals.filter(g => !g.completed).length}</div>
            <div className="text-sm text-muted-foreground">Active</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-info">
              {goals.length > 0 ? Math.round((goals.filter(g => g.completed).length / goals.length) * 100) : 0}%
            </div>
            <div className="text-sm text-muted-foreground">Success Rate</div>
          </div>
        </Card>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGoals.map((goal, index) => {
          const progress = getProgressPercentage(goal);
          const daysUntilDue = getDaysUntilDue(goal.target_date);
          const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
          const isDueSoon = daysUntilDue !== null && daysUntilDue <= 3 && daysUntilDue >= 0;

          return (
            <Card 
              key={goal.id}
              className={cn(
                "card-hover-strong animate-fade-in",
                getColorClass(goal.tileColor || 'primary'),
                goal.completed && "opacity-60",
                isOverdue && "ring-2 ring-destructive/50",
                isDueSoon && "ring-2 ring-warning/50"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg line-clamp-1">{goal.title}</CardTitle>
                      {getPriorityIcon(goal.priority || 'medium')}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className="text-xs">
                        {CATEGORIES.find(c => c.value === goal.category)?.label}
                      </Badge>
                      
                      {goal.target_date && (
                        <Badge 
                          variant={isOverdue ? "destructive" : isDueSoon ? "outline" : "secondary"}
                          className="text-xs"
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          {daysUntilDue !== null && daysUntilDue >= 0 
                            ? `${daysUntilDue}d left`
                            : isOverdue 
                            ? `${Math.abs(daysUntilDue!)}d overdue`
                            : format(parseISO(goal.target_date), 'MMM dd')
                          }
                        </Badge>
                      )}
                    </div>

                    {goal.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {goal.description}
                      </p>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setEditingGoal(goal)}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Progress */}
                {goal.tasks && goal.tasks.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                {/* Tasks */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Tasks</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addTaskToGoal(goal.id)}
                      className="h-6 w-6 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  {goal.tasks && goal.tasks.length > 0 ? (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {goal.tasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-2 group">
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={(checked) => 
                              updateTask(goal.id, task.id, { completed: !!checked })
                            }
                          />
                          <Input
                            value={task.text}
                            onChange={(e) => 
                              updateTask(goal.id, task.id, { text: e.target.value })
                            }
                            placeholder="Enter task..."
                            className={cn(
                              "flex-1 h-7 text-xs border-0 bg-transparent p-1",
                              task.completed && "line-through text-muted-foreground"
                            )}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTask(goal.id, task.id)}
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No tasks added yet</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {!goal.completed ? (
                    <Button
                      onClick={() => handleCompleteGoal(goal.id)}
                      size="sm"
                      className="flex-1 h-8"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Complete
                    </Button>
                  ) : (
                    <Badge variant="default" className="flex-1 justify-center">
                      <Award className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingGoal(goal)}
                    className="h-8"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteGoal(goal.id)}
                    className="h-8 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
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
            {searchTerm || filterCategory !== "all" || filterStatus !== "all"
              ? "Try adjusting your filters"
              : "Create your first goal to get started"}
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Goal
          </Button>
        </div>
      )}
    </div>
  );
};