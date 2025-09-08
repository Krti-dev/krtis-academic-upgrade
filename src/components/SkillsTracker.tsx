import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Target, TrendingUp, Award, FileText, Star, Trash2, Edit3 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import ResumeBuilder from "@/components/ResumeBuilder";

interface Skill {
  id: string;
  name: string;
  category: string;
  currentLevel: number;
  targetLevel: number;
  progress: number;
  outcomes: string[];
  learningPath: string[];
  priority: 'high' | 'medium' | 'low';
}

interface Career {
  title: string;
  requiredSkills: string[];
  averageSalary: string;
  growthRate: string;
}

const SkillsTracker = () => {
  const { toast } = useToast();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [targetCareer, setTargetCareer] = useState("");
  const [newSkillDialog, setNewSkillDialog] = useState(false);
  const [resumeDialog, setResumeDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const [newSkill, setNewSkill] = useState({
    name: "",
    category: "",
    currentLevel: 0,
    targetLevel: 100,
    priority: "medium" as 'high' | 'medium' | 'low'
  });

  const skillCategories = [
    "Programming", "Design", "Marketing", "Data Science", "Business", "Communication", 
    "Leadership", "Project Management", "Analytics", "Languages", "Other"
  ];

  const careerSuggestions: Career[] = [
    {
      title: "Software Engineer",
      requiredSkills: ["JavaScript", "Python", "React", "System Design", "Algorithms"],
      averageSalary: "$95,000 - $150,000",
      growthRate: "22%"
    },
    {
      title: "Data Scientist", 
      requiredSkills: ["Python", "Statistics", "Machine Learning", "SQL", "Data Visualization"],
      averageSalary: "$110,000 - $165,000",
      growthRate: "35%"
    },
    {
      title: "Product Manager",
      requiredSkills: ["Strategy", "Analytics", "Communication", "Leadership", "User Research"],
      averageSalary: "$120,000 - $180,000",
      growthRate: "19%"
    },
    {
      title: "UX Designer",
      requiredSkills: ["Design Thinking", "Prototyping", "User Research", "Figma", "Psychology"],
      averageSalary: "$85,000 - $130,000",
      growthRate: "13%"
    }
  ];

  const addSkill = () => {
    if (!newSkill.name || !newSkill.category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const skill: Skill = {
      id: Date.now().toString(),
      name: newSkill.name,
      category: newSkill.category,
      currentLevel: newSkill.currentLevel,
      targetLevel: newSkill.targetLevel,
      progress: (newSkill.currentLevel / newSkill.targetLevel) * 100,
      priority: newSkill.priority,
      outcomes: generateOutcomes(newSkill.name, newSkill.category),
      learningPath: generateLearningPath(newSkill.name, newSkill.category)
    };

    setSkills([...skills, skill]);
    setNewSkill({ name: "", category: "", currentLevel: 0, targetLevel: 100, priority: "medium" });
    setNewSkillDialog(false);
    
    toast({
      title: "Skill Added!",
      description: `${skill.name} has been added to your skill tracker`
    });
  };

  const updateSkillProgress = (skillId: string, newProgress: number) => {
    setSkills(skills.map(skill => 
      skill.id === skillId 
        ? { ...skill, currentLevel: newProgress, progress: (newProgress / skill.targetLevel) * 100 }
        : skill
    ));
  };

  const deleteSkill = (skillId: string) => {
    setSkills(skills.filter(skill => skill.id !== skillId));
    toast({
      title: "Skill Removed",
      description: "Skill has been removed from your tracker"
    });
  };

  const generateOutcomes = (skillName: string, category: string): string[] => {
    const outcomes = [
      `Increase job opportunities in ${category}`,
      `Higher salary potential (15-25% increase)`,
      `Better project leadership capabilities`,
      `Enhanced problem-solving skills`,
      `Improved team collaboration`
    ];
    return outcomes.slice(0, 3);
  };

  const generateLearningPath = (skillName: string, category: string): string[] => {
    const paths = [
      `Complete beginner course in ${skillName}`,
      `Practice with 3-5 real projects`,
      `Join community/forums for ${skillName}`,
      `Take advanced certification`,
      `Mentor others or contribute to open source`
    ];
    return paths;
  };

  const getSkillGap = () => {
    if (!targetCareer) return [];
    const career = careerSuggestions.find(c => c.title === targetCareer);
    if (!career) return [];
    
    const currentSkills = skills.map(s => s.name.toLowerCase());
    return career.requiredSkills.filter(skill => 
      !currentSkills.includes(skill.toLowerCase())
    );
  };

  const getOverallProgress = () => {
    if (skills.length === 0) return 0;
    return Math.round(skills.reduce((acc, skill) => acc + skill.progress, 0) / skills.length);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl lg:text-4xl font-bold gradient-text">Skills Mastery Hub</h1>
          <p className="text-muted-foreground text-sm lg:text-base max-w-2xl mx-auto">
            Track your skills, plan your learning journey, and build your dream career
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-6">
            <TabsTrigger value="overview" className="text-xs lg:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="skills" className="text-xs lg:text-sm">My Skills</TabsTrigger>
            <TabsTrigger value="career" className="text-xs lg:text-sm">Career Path</TabsTrigger>
            <TabsTrigger value="resume" className="text-xs lg:text-sm">Resume</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Total Skills
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl lg:text-3xl font-bold text-primary">{skills.length}</div>
                  <p className="text-xs lg:text-sm text-muted-foreground">Skills being tracked</p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Overall Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl lg:text-3xl font-bold text-green-500">{getOverallProgress()}%</div>
                  <Progress value={getOverallProgress()} className="mt-2" />
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-500" />
                    Career Target
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm lg:text-base font-medium">
                    {targetCareer || "Not set"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {targetCareer ? `${getSkillGap().length} skills needed` : "Set your goal"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Dialog open={newSkillDialog} onOpenChange={setNewSkillDialog}>
                <DialogTrigger asChild>
                  <Button className="flex-1 sm:flex-none gradient-button">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Skill
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Skill</DialogTitle>
                    <DialogDescription>
                      Track a new skill you want to learn or improve
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="skillName">Skill Name</Label>
                      <Input
                        id="skillName"
                        value={newSkill.name}
                        onChange={(e) => setNewSkill({...newSkill, name: e.target.value})}
                        placeholder="e.g., React, Python, Public Speaking"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={newSkill.category} onValueChange={(value) => setNewSkill({...newSkill, category: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {skillCategories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="currentLevel">Current Level (0-100)</Label>
                      <Input
                        id="currentLevel"
                        type="number"
                        min="0"
                        max="100"
                        value={newSkill.currentLevel}
                        onChange={(e) => setNewSkill({...newSkill, currentLevel: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={newSkill.priority} onValueChange={(value) => setNewSkill({...newSkill, priority: value as 'high' | 'medium' | 'low'})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={addSkill} className="w-full gradient-button">
                      Add Skill
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={resumeDialog} onOpenChange={setResumeDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1 sm:flex-none">
                    <FileText className="h-4 w-4 mr-2" />
                    Build Resume
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
                  <ResumeBuilder skills={skills} />
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills" className="space-y-6">
            {skills.length === 0 ? (
              <Card className="glass-card text-center py-12">
                <CardContent>
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Skills Added Yet</h3>
                  <p className="text-muted-foreground mb-4">Start tracking your skills to see your progress</p>
                  <Button onClick={() => setNewSkillDialog(true)} className="gradient-button">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Skill
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                {skills.map((skill) => (
                  <Card key={skill.id} className="glass-card">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base lg:text-lg truncate">{skill.name}</CardTitle>
                          <CardDescription className="text-xs lg:text-sm">{skill.category}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <Badge variant={skill.priority === 'high' ? 'destructive' : skill.priority === 'medium' ? 'default' : 'secondary'} className="text-xs">
                            {skill.priority}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => deleteSkill(skill.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs lg:text-sm mb-2">
                          <span>Progress</span>
                          <span className="font-medium">{Math.round(skill.progress)}%</span>
                        </div>
                        <Progress value={skill.progress} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>Current: {skill.currentLevel}</span>
                          <span>Target: {skill.targetLevel}</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs font-medium">Expected Outcomes:</Label>
                        <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                          {skill.outcomes.map((outcome, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <Star className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                              <span className="break-words">{outcome}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max={skill.targetLevel}
                          value={skill.currentLevel}
                          onChange={(e) => updateSkillProgress(skill.id, parseInt(e.target.value) || 0)}
                          className="text-xs"
                          placeholder="Update progress"
                        />
                        <Button size="sm" variant="outline" className="text-xs px-2">
                          Update
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Career Path Tab */}
          <TabsContent value="career" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Set Your Career Target</CardTitle>
                <CardDescription>Choose a career path to get personalized skill recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={targetCareer} onValueChange={setTargetCareer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your target career" />
                  </SelectTrigger>
                  <SelectContent>
                    {careerSuggestions.map(career => (
                      <SelectItem key={career.title} value={career.title}>{career.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {targetCareer && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-green-600">Skills You Have</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {skills.map(skill => (
                        <Badge key={skill.id} variant="default" className="mr-2 mb-2">
                          {skill.name} ({Math.round(skill.progress)}%)
                        </Badge>
                      ))}
                      {skills.length === 0 && (
                        <p className="text-muted-foreground text-sm">No skills added yet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-orange-600">Skills You Need</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {getSkillGap().map(skill => (
                        <Badge key={skill} variant="outline" className="mr-2 mb-2">
                          {skill}
                        </Badge>
                      ))}
                      {getSkillGap().length === 0 && (
                        <p className="text-green-600 text-sm font-medium">🎉 You have all required skills!</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {targetCareer && (
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Career Insights: {targetCareer}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="font-medium">Average Salary Range</Label>
                      <p className="text-lg font-bold text-green-600">
                        {careerSuggestions.find(c => c.title === targetCareer)?.averageSalary}
                      </p>
                    </div>
                    <div>
                      <Label className="font-medium">Job Growth Rate</Label>
                      <p className="text-lg font-bold text-blue-600">
                        {careerSuggestions.find(c => c.title === targetCareer)?.growthRate} annually
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Resume Tab */}
          <TabsContent value="resume">
            <ResumeBuilder skills={skills} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SkillsTracker;