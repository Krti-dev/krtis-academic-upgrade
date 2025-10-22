import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, TrendingUp, AlertCircle, CheckCircle, Calculator, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Subject {
  id: string;
  name: string;
  code?: string;
  color?: string;
  expected_classes?: number;
}

interface SubjectStats {
  subject: Subject;
  present: number;
  total: number;
  percentage: number;
}

interface AttendanceStrategyProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: Subject;
  stats: SubjectStats;
}

const AttendanceStrategy = ({ open, onOpenChange, subject, stats }: AttendanceStrategyProps) => {
  const [targetPercentage, setTargetPercentage] = useState(75);
  const [futureClasses, setFutureClasses] = useState(subject.expected_classes || 30);

  // Calculate classes needed to reach target
  const strategyCalculation = useMemo(() => {
    const currentPresent = stats.present;
    const currentTotal = stats.total;
    const currentPercentage = stats.percentage;

    // Calculate for different scenarios
    const calculateNeeded = (target: number) => {
      // Formula: (currentPresent + x) / (currentTotal + x) = target/100
      // Solving for x: x = (target * currentTotal - 100 * currentPresent) / (100 - target)
      const numerator = (target * currentTotal) - (100 * currentPresent);
      const denominator = 100 - target;
      
      if (denominator === 0) return null; // Cannot reach 100%
      
      const classesNeeded = Math.ceil(numerator / denominator);
      return classesNeeded > 0 ? classesNeeded : 0;
    };

    // Calculate how many can be skipped
    const calculateCanSkip = (target: number) => {
      // Formula: (currentPresent) / (currentTotal + x) = target/100
      // Solving for x: x = (100 * currentPresent / target) - currentTotal
      const maxTotal = (100 * currentPresent) / target;
      const canSkip = Math.floor(maxTotal - currentTotal);
      return canSkip > 0 ? canSkip : 0;
    };

    // Project future attendance
    const projectFuture = (attendAll: boolean) => {
      const remainingClasses = futureClasses - currentTotal;
      if (remainingClasses <= 0) return currentPercentage;
      
      const futurePresent = attendAll ? remainingClasses : 0;
      const finalPresent = currentPresent + futurePresent;
      const finalTotal = futureClasses;
      return (finalPresent / finalTotal) * 100;
    };

    // Internal marks calculation
    const getInternalMarks = (percentage: number) => {
      if (percentage >= 95) return 5;
      if (percentage >= 90) return 4;
      if (percentage >= 85) return 3;
      if (percentage >= 80) return 2;
      if (percentage >= 75) return 1;
      return 0;
    };

    const classesFor75 = calculateNeeded(75);
    const classesFor80 = calculateNeeded(80);
    const classesFor85 = calculateNeeded(85);
    const classesFor90 = calculateNeeded(90);
    const classesFor95 = calculateNeeded(95);
    
    const canSkipAt75 = currentPercentage >= 75 ? calculateCanSkip(75) : 0;
    const canSkipAt80 = currentPercentage >= 80 ? calculateCanSkip(80) : 0;

    const ifAttendAll = projectFuture(true);
    const ifAttendNone = projectFuture(false);

    return {
      current: {
        present: currentPresent,
        total: currentTotal,
        percentage: currentPercentage,
        marks: getInternalMarks(currentPercentage)
      },
      toReach: {
        75: classesFor75,
        80: classesFor80,
        85: classesFor85,
        90: classesFor90,
        95: classesFor95
      },
      canSkip: {
        at75: canSkipAt75,
        at80: canSkipAt80
      },
      projection: {
        ifAttendAll,
        ifAttendNone,
        marksIfAttendAll: getInternalMarks(ifAttendAll),
        marksIfAttendNone: getInternalMarks(ifAttendNone)
      },
      getInternalMarks
    };
  }, [stats, futureClasses]);

  // Custom target calculation
  const customTargetNeeded = useMemo(() => {
    if (targetPercentage <= 0 || targetPercentage > 100) return null;
    
    const currentPresent = stats.present;
    const currentTotal = stats.total;
    
    const numerator = (targetPercentage * currentTotal) - (100 * currentPresent);
    const denominator = 100 - targetPercentage;
    
    if (denominator === 0) return null;
    
    const classesNeeded = Math.ceil(numerator / denominator);
    return classesNeeded > 0 ? classesNeeded : 0;
  }, [targetPercentage, stats]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Attendance Strategy: {subject.name}
          </DialogTitle>
          <DialogDescription>
            Plan your attendance to maximize internal marks and maintain requirements
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="strategy">Strategy</TabsTrigger>
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Current Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Classes Attended</p>
                    <p className="text-2xl font-bold text-success">{strategyCalculation.current.present}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Total Classes</p>
                    <p className="text-2xl font-bold">{strategyCalculation.current.total}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Attendance %</p>
                    <p className="text-2xl font-bold text-primary">{strategyCalculation.current.percentage.toFixed(1)}%</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Internal Marks</p>
                    <p className="text-2xl font-bold">
                      {strategyCalculation.current.marks}<span className="text-lg text-muted-foreground">/5</span>
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Current Progress</span>
                    <span className="font-medium">{strategyCalculation.current.percentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={strategyCalculation.current.percentage} className="h-3" />
                </div>

                {/* Internal Marks Scale */}
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Internal Marks Scale
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span>≥ 95%</span>
                      <Badge>5 marks</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>90-94%</span>
                      <Badge>4 marks</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>85-89%</span>
                      <Badge>3 marks</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>80-84%</span>
                      <Badge>2 marks</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>75-79%</span>
                      <Badge>1 mark</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>&lt; 75%</span>
                      <Badge variant="destructive">0 marks</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            {strategyCalculation.current.percentage >= 75 ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Great! You can skip <strong>{strategyCalculation.canSkip.at75}</strong> more classes and still maintain 75% attendance.
                  {strategyCalculation.canSkip.at80 > 0 && (
                    <> To stay above 80%, you can skip <strong>{strategyCalculation.canSkip.at80}</strong> classes.</>
                  )}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Warning: You need to attend the next <strong>{strategyCalculation.toReach[75]}</strong> consecutive classes to reach 75% attendance.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="strategy" className="space-y-4">
            {/* Target-based Strategy */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Classes Needed to Reach Target</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { target: 75, marks: 1, color: "bg-orange-500" },
                    { target: 80, marks: 2, color: "bg-yellow-500" },
                    { target: 85, marks: 3, color: "bg-blue-500" },
                    { target: 90, marks: 4, color: "bg-indigo-500" },
                    { target: 95, marks: 5, color: "bg-purple-500" }
                  ].map(({ target, marks, color }) => {
                    const needed = strategyCalculation.toReach[target as keyof typeof strategyCalculation.toReach];
                    const isAchieved = strategyCalculation.current.percentage >= target;
                    
                    return (
                      <div key={target} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${color}`} />
                          <div>
                            <p className="font-semibold">{target}% Attendance</p>
                            <p className="text-xs text-muted-foreground">{marks} Internal Marks</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {isAchieved ? (
                            <Badge variant="default" className="bg-success">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Achieved
                            </Badge>
                          ) : needed !== null ? (
                            <div>
                              <p className="text-lg font-bold text-primary">{needed}</p>
                              <p className="text-xs text-muted-foreground">classes needed</p>
                            </div>
                          ) : (
                            <Badge variant="secondary">Not possible</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Future Projection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Future Projection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="futureClasses">Expected Total Classes in Semester</Label>
                  <Input
                    id="futureClasses"
                    type="number"
                    value={futureClasses}
                    onChange={(e) => setFutureClasses(parseInt(e.target.value) || 0)}
                    min={stats.total}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg bg-success/5">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-success" />
                      <h4 className="font-semibold">Best Case Scenario</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">If you attend all remaining classes:</p>
                    <p className="text-3xl font-bold text-success">{strategyCalculation.projection.ifAttendAll.toFixed(1)}%</p>
                    <Badge className="mt-2" variant="default">
                      {strategyCalculation.projection.marksIfAttendAll} Internal Marks
                    </Badge>
                  </div>

                  <div className="p-4 border rounded-lg bg-destructive/5">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      <h4 className="font-semibold">Worst Case Scenario</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">If you attend no more classes:</p>
                    <p className="text-3xl font-bold text-destructive">{strategyCalculation.projection.ifAttendNone.toFixed(1)}%</p>
                    <Badge className="mt-2" variant="destructive">
                      {strategyCalculation.projection.marksIfAttendNone} Internal Marks
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calculator" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Custom Target Calculator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="targetPercentage">Target Attendance Percentage</Label>
                  <div className="flex gap-2">
                    <Input
                      id="targetPercentage"
                      type="number"
                      value={targetPercentage}
                      onChange={(e) => setTargetPercentage(parseFloat(e.target.value) || 0)}
                      min={0}
                      max={100}
                      step={0.1}
                    />
                    <span className="flex items-center text-2xl font-bold">%</span>
                  </div>
                  <Progress value={targetPercentage} className="h-2" />
                </div>

                {customTargetNeeded !== null && (
                  <Alert>
                    <Target className="h-4 w-4" />
                    <AlertDescription>
                      To reach <strong>{targetPercentage}%</strong> attendance, you need to attend{" "}
                      <strong className="text-primary text-lg">{customTargetNeeded}</strong> consecutive classes.
                      <div className="mt-2">
                        This will give you <strong>{strategyCalculation.getInternalMarks(targetPercentage)} internal marks</strong>.
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {customTargetNeeded === null && targetPercentage > strategyCalculation.current.percentage && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      It's not possible to reach exactly {targetPercentage}% by only attending classes (would require 100% attendance indefinitely).
                    </AlertDescription>
                  </Alert>
                )}

                {targetPercentage <= strategyCalculation.current.percentage && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      You've already achieved {targetPercentage}%! Your current attendance is {strategyCalculation.current.percentage.toFixed(1)}%.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AttendanceStrategy;
