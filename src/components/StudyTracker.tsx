import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, BookOpen, Target } from "lucide-react";
import { useState } from "react";

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
  // CAT Marks Calculator
  const [catMarks, setCatMarks] = useState<{ scored: number; total: number }[]>([
    { scored: 0, total: 25 },
  ]);
  const catPercent = useMemo(() => {
    const sumScored = catMarks.reduce((s, m) => s + (Number(m.scored) || 0), 0);
    const sumTotal = catMarks.reduce((s, m) => s + (Number(m.total) || 0), 0);
    return sumTotal > 0 ? (sumScored / sumTotal) * 100 : 0;
  }, [catMarks]);

  // CGPA Calculator
  const [subjects, setSubjects] = useState<{ credits: number; grade: number }[]>([
    { credits: 3, grade: 10 },
  ]);
  const cgpa = useMemo(() => {
    const w = subjects.reduce((s, x) => s + (Number(x.credits) || 0) * (Number(x.grade) || 0), 0);
    const c = subjects.reduce((s, x) => s + (Number(x.credits) || 0), 0);
    return c > 0 ? w / c : 0;
  }, [subjects]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Study Tracker</h1>
      </div>

      {/* CAT Marks Calculator */}
      <Card className="border-info/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-info" /> CAT Marks Percentage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {catMarks.map((m, i) => (
            <div key={i} className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                placeholder="Scored"
                value={m.scored}
                onChange={(e) => {
                  const v = [...catMarks];
                  v[i].scored = Number(e.target.value);
                  setCatMarks(v);
                }}
              />
              <Input
                type="number"
                placeholder="Total"
                value={m.total}
                onChange={(e) => {
                  const v = [...catMarks];
                  v[i].total = Number(e.target.value);
                  setCatMarks(v);
                }}
              />
            </div>
          ))}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCatMarks([...catMarks, { scored: 0, total: 25 }])}>Add CAT</Button>
            <Button variant="ghost" onClick={() => setCatMarks([{ scored: 0, total: 25 }])}>Reset</Button>
          </div>
          <div className="text-lg font-semibold">Overall: {catPercent.toFixed(2)}%</div>
        </CardContent>
      </Card>

      {/* CGPA Calculator */}
      <Card className="border-purple/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-purple" /> CGPA Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {subjects.map((s, i) => (
            <div key={i} className="grid grid-cols-3 gap-3 items-center">
              <Input
                type="number"
                placeholder="Credits"
                value={s.credits}
                onChange={(e) => {
                  const v = [...subjects];
                  v[i].credits = Number(e.target.value);
                  setSubjects(v);
                }}
              />
              <Select
                value={String(s.grade)}
                onValueChange={(val) => {
                  const v = [...subjects];
                  v[i].grade = Number(val);
                  setSubjects(v);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Grade" />
                </SelectTrigger>
                <SelectContent>
                  {gradeOptions.map((g) => (
                    <SelectItem key={g.value} value={String(g.value)}>{g.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" onClick={() => setSubjects(subjects.filter((_, idx) => idx !== i))}>Remove</Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setSubjects([...subjects, { credits: 3, grade: 10 }])}>Add Subject</Button>
            <Button variant="ghost" onClick={() => setSubjects([{ credits: 3, grade: 10 }])}>Reset</Button>
          </div>
          <div className="text-lg font-semibold">CGPA: {cgpa.toFixed(2)}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudyTracker;
