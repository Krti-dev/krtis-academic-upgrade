import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet, Plus, TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const BudgetTracker = () => {
  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    category: ""
  });

  const [expenses] = useState([
    { id: 1, description: "Lunch", amount: 12.50, category: "Food", date: "2024-01-20" },
    { id: 2, description: "Textbooks", amount: 85.00, category: "Education", date: "2024-01-19" },
    { id: 3, description: "Movie ticket", amount: 15.00, category: "Entertainment", date: "2024-01-18" },
    { id: 4, description: "Coffee", amount: 4.50, category: "Food", date: "2024-01-18" },
  ]);

  const [budgetLimits] = useState([
    { category: "Food", limit: 200, spent: 85.50 },
    { category: "Entertainment", limit: 100, spent: 45.00 },
    { category: "Education", limit: 300, spent: 125.00 },
    { category: "Transport", limit: 80, spent: 32.00 },
  ]);

  const categories = ["Food", "Entertainment", "Education", "Transport", "Other"];

  const addExpense = () => {
    if (newExpense.description && newExpense.amount && newExpense.category) {
      toast.success(`Added expense: ${newExpense.description}`);
      setNewExpense({ description: "", amount: "", category: "" });
    } else {
      toast.error("Please fill in all fields");
    }
  };

  const getTotalSpent = () => {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  };

  const getTotalBudget = () => {
    return budgetLimits.reduce((total, limit) => total + limit.limit, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Wallet className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Budget Tracker</h1>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${getTotalBudget().toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Monthly limit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">${getTotalSpent().toFixed(2)}</div>
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
            <div className="text-2xl font-bold text-success">
              ${(getTotalBudget() - getTotalSpent()).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              Available to spend
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

      {/* Budget Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Budget by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {budgetLimits.map((budget) => {
              const percentage = (budget.spent / budget.limit) * 100;
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
                      ${budget.spent.toFixed(2)} / ${budget.limit.toFixed(2)}
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(percentage, 100)} 
                    className={`h-2 ${isOverBudget ? '[&>div]:bg-destructive' : isNearLimit ? '[&>div]:bg-warning' : ''}`}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{percentage.toFixed(1)}% used</span>
                    <span>${(budget.limit - budget.spent).toFixed(2)} remaining</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Expenses */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {expenses.map((expense) => (
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
                  <div className="font-medium">${expense.amount.toFixed(2)}</div>
                  <Badge variant="secondary" className="text-xs">
                    {expense.category}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetTracker;