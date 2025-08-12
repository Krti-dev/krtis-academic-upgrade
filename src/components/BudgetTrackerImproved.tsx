import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Wallet, Plus, TrendingDown, TrendingUp, AlertTriangle, BarChart3, Activity, Settings } from "lucide-react";
import { toast } from "sonner";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, PieChart, Pie, Cell } from "recharts";

interface Expense {
  id: number;
  description: string;
  amount: number;
  category: string;
  date: string;
}

interface BudgetLimit {
  category: string;
  limit: number;
  spent: number;
}

const BudgetTrackerImproved = () => {
  const [totalBudget, setTotalBudget] = useState(0);
  const [newTotalBudget, setNewTotalBudget] = useState("");
  const [isBudgetDialogOpen, setIsBudgetDialogOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    category: ""
  });
  const [chartType, setChartType] = useState<"line" | "radar">("line");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgetLimits, setBudgetLimits] = useState<BudgetLimit[]>([
    { category: "Food", limit: 0, spent: 0 },
    { category: "Entertainment", limit: 0, spent: 0 },
    { category: "Education", limit: 0, spent: 0 },
    { category: "Transport", limit: 0, spent: 0 },
  ]);

  const categories = ["Food", "Entertainment", "Education", "Transport", "Other"];

  // Check if we need to reset monthly data
  useEffect(() => {
    const lastResetDate = localStorage.getItem('budgetLastReset');
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const currentMonthYear = `${currentYear}-${currentMonth}`;
    
    if (lastResetDate !== currentMonthYear) {
      // Reset everything for new month
      setExpenses([]);
      setBudgetLimits(prev => prev.map(limit => ({ ...limit, spent: 0 })));
      setTotalBudget(0);
      localStorage.setItem('budgetLastReset', currentMonthYear);
      toast.success("New month! Budget data has been reset.");
    }
  }, []);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedBudget = localStorage.getItem('totalBudget');
    const savedExpenses = localStorage.getItem('expenses');
    const savedBudgetLimits = localStorage.getItem('budgetLimits');
    
    if (savedBudget) setTotalBudget(parseFloat(savedBudget));
    if (savedExpenses) setExpenses(JSON.parse(savedExpenses));
    if (savedBudgetLimits) setBudgetLimits(JSON.parse(savedBudgetLimits));
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('totalBudget', totalBudget.toString());
  }, [totalBudget]);

  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
    // Update spent amounts in budget limits
    const updatedLimits = budgetLimits.map(limit => ({
      ...limit,
      spent: expenses
        .filter(expense => expense.category === limit.category)
        .reduce((sum, expense) => sum + expense.amount, 0)
    }));
    setBudgetLimits(updatedLimits);
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('budgetLimits', JSON.stringify(budgetLimits));
  }, [budgetLimits]);

  const updateTotalBudget = () => {
    const amount = parseFloat(newTotalBudget);
    if (!isNaN(amount) && amount >= 0) {
      setTotalBudget(amount);
      setNewTotalBudget("");
      setIsBudgetDialogOpen(false);
      toast.success("Total budget updated!");
    } else {
      toast.error("Please enter a valid amount");
    }
  };

  const addExpense = () => {
    if (newExpense.description && newExpense.amount && newExpense.category) {
      const amount = parseFloat(newExpense.amount);
      if (!isNaN(amount) && amount > 0) {
        const expense: Expense = {
          id: Date.now(),
          description: newExpense.description,
          amount,
          category: newExpense.category,
          date: new Date().toISOString().split('T')[0]
        };
        setExpenses([...expenses, expense]);
        toast.success(`Added expense: ${newExpense.description}`);
        setNewExpense({ description: "", amount: "", category: "" });
      } else {
        toast.error("Please enter a valid amount");
      }
    } else {
      toast.error("Please fill in all fields");
    }
  };

  const deleteExpense = (id: number) => {
    setExpenses(expenses.filter((e) => e.id !== id));
    toast.success("Expense deleted");
  };

  const resetAll = () => {
    if (confirm('Are you sure you want to reset all budget data? This cannot be undone.')) {
      setExpenses([]);
      setBudgetLimits([
        { category: "Food", limit: 0, spent: 0 },
        { category: "Entertainment", limit: 0, spent: 0 },
        { category: "Education", limit: 0, spent: 0 },
        { category: "Transport", limit: 0, spent: 0 },
      ]);
      setTotalBudget(0);
      toast.success('All budget data has been reset.');
    }
  };

  const getTotalSpent = () => {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  };

  const getRemainingBudget = () => {
    return totalBudget - getTotalSpent();
  };

  const isOverBudget = getRemainingBudget() < 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Wallet className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Budget Tracker</h1>
        </div>
        
        <Dialog open={isBudgetDialogOpen} onOpenChange={setIsBudgetDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Set Budget
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Total Monthly Budget</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="totalBudget">Total Budget (₹)</Label>
                <Input
                  id="totalBudget"
                  type="number"
                  placeholder="Enter total monthly budget"
                  value={newTotalBudget}
                  onChange={(e) => setNewTotalBudget(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={updateTotalBudget} className="flex-1">
                  Update Budget
                </Button>
                <Button variant="outline" onClick={() => setIsBudgetDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <Button variant="destructive" className="ml-2" onClick={resetAll}>
          Reset All
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalBudget.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Monthly limit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">₹{getTotalSpent().toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="inline h-3 w-3 mr-1" />
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isOverBudget ? 'text-destructive' : 'text-success'}`}>
              ₹{getRemainingBudget().toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {isOverBudget ? (
                <>
                  <AlertTriangle className="inline h-3 w-3 mr-1" />
                  Over budget!
                </>
              ) : (
                <>
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                  Available to spend
                </>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add Expense */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Expense</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="What did you buy?"
                value={newExpense.description}
                onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={newExpense.amount}
                onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={newExpense.category} onValueChange={(value) => setNewExpense(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={addExpense} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget Categories and Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {expenses.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categories.map(category => ({
                        name: category,
                        value: expenses
                          .filter(expense => expense.category === category)
                          .reduce((sum, expense) => sum + expense.amount, 0),
                        color: category === 'Food' ? '#ef4444' : 
                               category === 'Entertainment' ? '#3b82f6' :
                               category === 'Education' ? '#10b981' :
                               category === 'Transport' ? '#f59e0b' : '#6b7280'
                      })).filter(item => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ₹${value.toFixed(0)}`}
                    >
                      {categories.map((category, index) => (
                        <Cell key={`cell-${index}`} fill={
                          category === 'Food' ? '#ef4444' : 
                          category === 'Entertainment' ? '#3b82f6' :
                          category === 'Education' ? '#10b981' :
                          category === 'Transport' ? '#f59e0b' : '#6b7280'
                        } />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${value}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No expenses to display
              </div>
            )}
          </CardContent>
        </Card>

        {/* Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Budget Usage Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {expenses.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={categories.map(category => ({
                    category: category,
                    spent: expenses
                      .filter(expense => expense.category === category)
                      .reduce((sum, expense) => sum + expense.amount, 0),
                    budget: budgetLimits.find(b => b.category === category)?.limit || 1000,
                    usage: Math.min(
                      (expenses
                        .filter(expense => expense.category === category)
                        .reduce((sum, expense) => sum + expense.amount, 0) / 
                       (budgetLimits.find(b => b.category === category)?.limit || 1000)) * 100,
                      150
                    )
                  }))}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" />
                    <PolarRadiusAxis angle={90} domain={[0, 150]} />
                    <Radar 
                      name="Budget Usage %" 
                      dataKey="usage" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))" 
                      fillOpacity={0.3} 
                    />
                    <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No data to display
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Budget Categories */}
      {budgetLimits.some(limit => limit.limit > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Budget by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">

              {/* Budget Bars */}
              {budgetLimits.filter(budget => budget.limit > 0).map((budget) => {
                const percentage = budget.limit > 0 ? (budget.spent / budget.limit) * 100 : 0;
                const isOverBudget = percentage > 100;
                const isNearLimit = percentage > 80;
                
                return (
                  <div key={budget.category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{budget.category}</span>
                        {isOverBudget && <AlertTriangle className="h-4 w-4 text-destructive" />}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        ₹{budget.spent.toFixed(2)} / ₹{budget.limit.toFixed(2)}
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(percentage, 100)} 
                      className={`h-2 ${isOverBudget ? '[&>div]:bg-destructive' : isNearLimit ? '[&>div]:bg-warning' : ''}`}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{percentage.toFixed(1)}% used</span>
                      <span className={budget.limit - budget.spent < 0 ? 'text-destructive' : ''}>
                        ₹{(budget.limit - budget.spent).toFixed(2)} {budget.limit - budget.spent < 0 ? 'over budget' : 'remaining'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Expenses */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {expenses.length > 0 ? (
              expenses.slice(-10).reverse().map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                    <div>
                      <div className="font-medium">{expense.description}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(expense.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">₹{expense.amount.toFixed(2)}</div>
                    <Badge variant="secondary" className="text-xs">
                      {expense.category}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No expenses recorded yet. Start tracking your spending!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetTrackerImproved;