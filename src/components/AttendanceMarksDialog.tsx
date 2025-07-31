import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Calendar, Target, TrendingUp } from "lucide-react";

interface AttendanceMarksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: {
    id: string;
    name: string;
    color: string;
    expected_classes: number;
  };
  attendanceStats: {
    present: number;
    total: number;
    percentage: number;
  };
}

const AttendanceMarksDialog = ({ open, onOpenChange, subject, attendanceStats }: AttendanceMarksDialogProps) => {
  const [targetMarks, setTargetMarks] = useState<number>(5);

  const getMarksForPercentage = (percentage: number): number => {
    if (percentage >= 95) return 5;
    if (percentage >= 90) return 4;
    if (percentage >= 85) return 3;
    if (percentage >= 80) return 2;
    if (percentage >= 75) return 1;
    return 0;
  };

  const getRequiredPercentageForMarks = (marks: number): number => {
    switch (marks) {
      case 5: return 95;
      case 4: return 90;
      case 3: return 85;
      case 2: return 80;
      case 1: return 75;
      default: return 0;
    }
  };

  const calculateAttendanceStrategy = () => {
    const currentPercentage = attendanceStats.percentage;
    const currentMarks = getMarksForPercentage(currentPercentage);
    const requiredPercentage = getRequiredPercentageForMarks(targetMarks);
    
    if (currentPercentage >= requiredPercentage) {
      // Calculate how many classes can be missed
      const totalExpected = subject.expected_classes;
      const currentPresent = attendanceStats.present;
      const currentTotal = attendanceStats.total;
      
      // Calculate classes that can be missed while maintaining target percentage
      let maxAbsent = 0;
      for (let absent = 0; absent <= totalExpected - currentTotal; absent++) {
        const futureTotal = currentTotal + absent;
        const futurePercentage = (currentPresent / futureTotal) * 100;
        if (futurePercentage >= requiredPercentage) {
          maxAbsent = absent;
        } else {
          break;
        }
      }
      
      return {
        canAchieve: true,
        strategy: `You can miss up to ${maxAbsent} more classes`,
        currentMarks,
        targetMarks,
        classesCanMiss: maxAbsent,
        additionalClassesNeeded: 0
      };
    } else {
      // Calculate how many classes need to be attended
      const totalExpected = subject.expected_classes;
      const currentPresent = attendanceStats.present;
      const currentTotal = attendanceStats.total;
      const remainingClasses = totalExpected - currentTotal;
      
      // Calculate required attendance
      const requiredPresent = Math.ceil((requiredPercentage / 100) * totalExpected);
      const additionalRequired = Math.max(0, requiredPresent - currentPresent);
      
      return {
        canAchieve: additionalRequired <= remainingClasses,
        strategy: additionalRequired <= remainingClasses 
          ? `Attend ${additionalRequired} more classes out of remaining ${remainingClasses}`
          : `Cannot achieve ${targetMarks} marks (need ${additionalRequired} classes, only ${remainingClasses} remaining)`,
        currentMarks,
        targetMarks,
        classesCanMiss: 0,
        additionalClassesNeeded: additionalRequired
      };
    }
  };

  const strategy = calculateAttendanceStrategy();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Attendance Strategy - {subject.name}
          </DialogTitle>
          <DialogDescription>
            Plan your attendance to achieve your target internal marks
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Current Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Present:</span>
                <span className="font-medium">{attendanceStats.present}</span>
              </div>
              <div className="flex justify-between">
                <span>Absent:</span>
                <span className="font-medium">{attendanceStats.total - attendanceStats.present}</span>
              </div>
              <div className="flex justify-between">
                <span>Percentage:</span>
                <span className="font-medium">{attendanceStats.percentage.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Current Marks:</span>
                <Badge variant={strategy.currentMarks >= 3 ? "default" : "destructive"}>
                  {strategy.currentMarks}/5
                </Badge>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Label htmlFor="target-marks">Target Internal Marks</Label>
            <Input
              id="target-marks"
              type="number"
              min="0"
              max="5"
              value={targetMarks}
              onChange={(e) => setTargetMarks(Number(e.target.value))}
            />
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4" />
                Strategy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Required %:</span>
                  <span className="font-medium">{getRequiredPercentageForMarks(targetMarks)}%</span>
                </div>
                <div className="text-sm bg-muted p-3 rounded-lg">
                  {strategy.strategy}
                </div>
                {strategy.canAchieve ? (
                  <Badge variant="default" className="w-full justify-center">
                    ✓ Target Achievable
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="w-full justify-center">
                    ✗ Target Not Achievable
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Button onClick={() => onOpenChange(false)} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AttendanceMarksDialog;