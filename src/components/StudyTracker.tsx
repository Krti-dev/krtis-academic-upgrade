import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, BookOpen, Target, BarChart3, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { useSupabaseData } from "@/hooks/useSupabaseData";

const gradeOptions = [
  { label: "O (10)", value: 10 },
  { label: "A+ (9)", value: 9 },
  { label: "A (8)", value: 8 },
  { label: "B+ (7)", value: 7 },
  { label: "B (6)", value: 6 },
  { label: "C (5)", value: 5 },
  { label: "F (0)", value: 0 },
];

const StudyTracker = () => {
  const { subjects: dbSubjects, attendance, loading } = useSupabaseData();
  
  // CAT Marks per subject
  const [subjectCATMarks, setSubjectCATMarks] = useState<{[key: string]: {scored: number; total: number}[]}>({});
  
  // SGPA inputs for each semester
  const [semesterSGPAs, setSemesterSGPAs] = useState<number[]>([]);
  
  // Initialize CAT marks for each subject
  useEffect(() => {
    if (dbSubjects.length > 0) {
      const initialCATMarks: {[key: string]: {scored: number; total: number}[]} = {};
      dbSubjects.forEach(subject => {
        if (!subjectCATMarks[subject.id]) {
          initialCATMarks[subject.id] = [{ scored: 0, total: 25 }];
        }
      });
      setSubjectCATMarks(prev => ({ ...prev, ...initialCATMarks }));
    }
  }, [dbSubjects]);

  // Calculate CAT percentage for each subject
  const getSubjectCATPercent = (subjectId: string) => {
    const marks = subjectCATMarks[subjectId] || [];
    const sumScored = marks.reduce((s, m) => s + (Number(m.scored) || 0), 0);
    const sumTotal = marks.reduce((s, m) => s + (Number(m.total) || 0), 0);
    return sumTotal > 0 ? (sumScored / sumTotal) * 100 : 0;
  };

  // Calculate internal marks (CAT 50% + Attendance 20% + Assignments 30%)
  const getInternalMarks = (subjectId: string) => {
    const catPercent = getSubjectCATPercent(subjectId);
    const subjectAttendance = attendance.filter(a => a.subject_id === subjectId);
    const attendancePercent = subjectAttendance.length > 0 
      ? (subjectAttendance.filter(a => a.present).length / subjectAttendance.length) * 100 
      : 0;
    const assignmentPercent = 85; // Placeholder for assignment marks
    
    return (catPercent * 0.5) + (attendancePercent * 0.2) + (assignmentPercent * 0.3);
  };

  // Calculate CGPA from SGPAs
  const cgpa = useMemo(() => {
    if (semesterSGPAs.length === 0) return 0;
    const sum = semesterSGPAs.reduce((s, sgpa) => s + (Number(sgpa) || 0), 0);
    return sum / semesterSGPAs.length;
  }, [semesterSGPAs]);

  // Generate CAT marks chart data
  const catChartData = dbSubjects.map(subject => ({
    subject: subject.name.substring(0, 8) + (subject.name.length > 8 ? '...' : ''),
    catPercent: getSubjectCATPercent(subject.id),
    internalMarks: getInternalMarks(subject.id),
    attendance: (() => {
      const subjectAttendance = attendance.filter(a => a.subject_id === subject.id);
      return subjectAttendance.length > 0 
        ? (subjectAttendance.filter(a => a.present).length / subjectAttendance.length) * 100 
        : 0;
    })()
  }));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <div key={i} className="h-64 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        <h1 className="text-xl sm:text-2xl font-bold">Study Tracker</h1>
      </div>

      {/* CAT Marks Visual */}
      <Card className="border-info/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-info" /> CAT Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {catChartData.length > 0 ? (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Performance Gauge Charts */}
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold">Performance Gauges</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {/* CAT Performance Gauge */}
                    <div className="text-center">
                      <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                          <Pie
                            data={[
                              { value: (catChartData.reduce((sum, d) => sum + d.catPercent, 0) / catChartData.length), fill: 'hsl(var(--info))' },
                              { value: 100 - (catChartData.reduce((sum, d) => sum + d.catPercent, 0) / catChartData.length), fill: 'hsl(var(--muted))' }
                            ]}
                            cx="50%"
                            cy="50%"
                            startAngle={180}
                            endAngle={0}
                            innerRadius={50}
                            outerRadius={70}
                            dataKey="value"
                          >
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="text-xl font-bold text-info">
                        {(catChartData.reduce((sum, d) => sum + d.catPercent, 0) / catChartData.length).toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">CAT Average</div>
                    </div>
                    
                    {/* Internal Marks Gauge */}
                    <div className="text-center">
                      <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                          <Pie
                            data={[
                              { value: (catChartData.reduce((sum, d) => sum + d.internalMarks, 0) / catChartData.length), fill: 'hsl(var(--primary))' },
                              { value: 100 - (catChartData.reduce((sum, d) => sum + d.internalMarks, 0) / catChartData.length), fill: 'hsl(var(--muted))' }
                            ]}
                            cx="50%"
                            cy="50%"
                            startAngle={180}
                            endAngle={0}
                            innerRadius={50}
                            outerRadius={70}
                            dataKey="value"
                          >
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="text-xl font-bold text-primary">
                        {(catChartData.reduce((sum, d) => sum + d.internalMarks, 0) / catChartData.length).toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Internal Marks</div>
                    </div>
                  </div>
                </div>
                
                {/* Subject Performance Chart */}
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold">Subject Performance</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={catChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis 
                        dataKey="subject" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--popover-foreground))'
                        }}
                        formatter={(value: number, name: string) => [
                          `${value.toFixed(1)}%`, 
                          name === 'catPercent' ? 'CAT Marks' : name === 'internalMarks' ? 'Internal Marks' : 'Attendance'
                        ]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="catPercent" 
                        stroke="hsl(var(--info))" 
                        strokeWidth={2} 
                        name="CAT Marks"
                        dot={{ fill: 'hsl(var(--info))', strokeWidth: 2, r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="internalMarks" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2} 
                        name="Internal Marks"
                        dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="attendance" 
                        stroke="hsl(var(--success))" 
                        strokeWidth={2} 
                        name="Attendance"
                        dot={{ fill: 'hsl(var(--success))', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-info">
                    {(catChartData.reduce((sum, d) => sum + d.catPercent, 0) / catChartData.length).toFixed(1)}%
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Avg CAT Marks</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-primary">
                    {(catChartData.reduce((sum, d) => sum + d.internalMarks, 0) / catChartData.length).toFixed(1)}%
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Avg Internal Marks</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-success">
                    {(catChartData.reduce((sum, d) => sum + d.attendance, 0) / catChartData.length).toFixed(1)}%
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Avg Attendance</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Add subjects and CAT marks to see your performance visualization
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subject-wise CAT Marks Entry */}
      <Card className="border-warning/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-warning" /> CAT Marks by Subject
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {dbSubjects.map((subject) => (
            <div key={subject.id} className="space-y-3 p-3 sm:p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: subject.color }} />
                <h4 className="font-medium text-sm sm:text-base truncate">{subject.name}</h4>
                <div className="hidden sm:block">
                  <span className="text-xs sm:text-sm text-muted-foreground ml-auto">
                    {getSubjectCATPercent(subject.id).toFixed(1)}% • Internal: {getInternalMarks(subject.id).toFixed(1)}%
                  </span>
                </div>
              </div>
              
              <div className="sm:hidden text-xs text-muted-foreground">
                CAT: {getSubjectCATPercent(subject.id).toFixed(1)}% • Internal: {getInternalMarks(subject.id).toFixed(1)}%
              </div>
              
              {(subjectCATMarks[subject.id] || []).map((catMark, i) => (
                <div key={i} className="grid grid-cols-2 gap-2 sm:gap-3">
                  <Input
                    type="number"
                    placeholder="CAT Scored"
                    value={catMark.scored}
                    className="text-sm"
                    onChange={(e) => {
                      const newMarks = { ...subjectCATMarks };
                      if (!newMarks[subject.id]) newMarks[subject.id] = [];
                      newMarks[subject.id][i] = { ...catMark, scored: Number(e.target.value) };
                      setSubjectCATMarks(newMarks);
                    }}
                  />
                  <Input
                    type="number"
                    placeholder="CAT Total"
                    value={catMark.total}
                    className="text-sm"
                    onChange={(e) => {
                      const newMarks = { ...subjectCATMarks };
                      if (!newMarks[subject.id]) newMarks[subject.id] = [];
                      newMarks[subject.id][i] = { ...catMark, total: Number(e.target.value) };
                      setSubjectCATMarks(newMarks);
                    }}
                  />
                </div>
              ))}
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    const newMarks = { ...subjectCATMarks };
                    if (!newMarks[subject.id]) newMarks[subject.id] = [];
                    newMarks[subject.id].push({ scored: 0, total: 25 });
                    setSubjectCATMarks(newMarks);
                  }}
                >
                  Add CAT
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    const newMarks = { ...subjectCATMarks };
                    newMarks[subject.id] = [{ scored: 0, total: 25 }];
                    setSubjectCATMarks(newMarks);
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
          ))}
          {dbSubjects.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              Add subjects first to track CAT marks
            </div>
          )}
        </CardContent>
      </Card>

      {/* CGPA Calculator - From SGPA */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" /> CGPA Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground mb-4">
            Enter your SGPA for each semester to calculate overall CGPA
          </div>
          
          {semesterSGPAs.map((sgpa, i) => (
            <div key={i} className="grid grid-cols-3 gap-2 sm:gap-3 items-center">
              <div className="text-xs sm:text-sm font-medium">Semester {i + 1}</div>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="10"
                placeholder="SGPA"
                value={sgpa}
                className="text-sm"
                onChange={(e) => {
                  const newSGPAs = [...semesterSGPAs];
                  newSGPAs[i] = Number(e.target.value);
                  setSemesterSGPAs(newSGPAs);
                }}
              />
              <Button 
                variant="ghost" 
                size="sm"
                className="text-xs"
                onClick={() => setSemesterSGPAs(semesterSGPAs.filter((_, idx) => idx !== i))}
              >
                Remove
              </Button>
            </div>
          ))}
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setSemesterSGPAs([...semesterSGPAs, 0])}
            >
              Add Semester
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setSemesterSGPAs([])}
            >
              Reset
            </Button>
          </div>
          
          {semesterSGPAs.length > 0 && (
            <div className="pt-4 border-t">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">
                  {cgpa.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Overall CGPA ({semesterSGPAs.length} semesters)
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudyTracker;
