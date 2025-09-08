import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, Eye, Plus, Trash2, Edit3 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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

interface Experience {
  id: string;
  title: string;
  company: string;
  duration: string;
  description: string;
}

interface Education {
  id: string;
  degree: string;
  institution: string;
  year: string;
  gpa?: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  link?: string;
}

interface ResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
    github: string;
    website: string;
  };
  summary: string;
  experiences: Experience[];
  education: Education[];
  projects: Project[];
}

interface ResumeBuilderProps {
  skills: Skill[];
}

const ResumeBuilder = ({ skills }: ResumeBuilderProps) => {
  const { toast } = useToast();
  const [resumeData, setResumeData] = useState<ResumeData>({
    personalInfo: {
      name: "",
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      github: "",
      website: ""
    },
    summary: "",
    experiences: [],
    education: [],
    projects: []
  });

  const [showPreview, setShowPreview] = useState(false);
  const [newExperience, setNewExperience] = useState<Omit<Experience, 'id'>>({
    title: "",
    company: "",
    duration: "",
    description: ""
  });
  const [newEducation, setNewEducation] = useState<Omit<Education, 'id'>>({
    degree: "",
    institution: "",
    year: "",
    gpa: ""
  });
  const [newProject, setNewProject] = useState<Omit<Project, 'id'>>({
    name: "",
    description: "",
    technologies: [],
    link: ""
  });

  const [experienceDialog, setExperienceDialog] = useState(false);
  const [educationDialog, setEducationDialog] = useState(false);
  const [projectDialog, setProjectDialog] = useState(false);

  const addExperience = () => {
    if (!newExperience.title || !newExperience.company) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive"
      });
      return;
    }

    const experience: Experience = {
      ...newExperience,
      id: Date.now().toString()
    };

    setResumeData(prev => ({
      ...prev,
      experiences: [...prev.experiences, experience]
    }));

    setNewExperience({ title: "", company: "", duration: "", description: "" });
    setExperienceDialog(false);
  };

  const addEducation = () => {
    if (!newEducation.degree || !newEducation.institution) {
      toast({
        title: "Error", 
        description: "Please fill in required fields",
        variant: "destructive"
      });
      return;
    }

    const education: Education = {
      ...newEducation,
      id: Date.now().toString()
    };

    setResumeData(prev => ({
      ...prev,
      education: [...prev.education, education]
    }));

    setNewEducation({ degree: "", institution: "", year: "", gpa: "" });
    setEducationDialog(false);
  };

  const addProject = () => {
    if (!newProject.name || !newProject.description) {
      toast({
        title: "Error",
        description: "Please fill in required fields", 
        variant: "destructive"
      });
      return;
    }

    const project: Project = {
      ...newProject,
      id: Date.now().toString()
    };

    setResumeData(prev => ({
      ...prev,
      projects: [...prev.projects, project]
    }));

    setNewProject({ name: "", description: "", technologies: [], link: "" });
    setProjectDialog(false);
  };

  const generateAISummary = () => {
    const highSkills = skills.filter(s => s.progress > 70).map(s => s.name);
    const summary = `Results-driven professional with strong expertise in ${highSkills.slice(0, 3).join(', ')}${highSkills.length > 3 ? ` and ${highSkills.length - 3} other technologies` : ''}. Passionate about leveraging technical skills to create innovative solutions and drive business growth. Proven ability to adapt quickly to new technologies and collaborate effectively in team environments.`;
    
    setResumeData(prev => ({
      ...prev,
      summary
    }));

    toast({
      title: "AI Summary Generated!",
      description: "Professional summary has been created based on your skills"
    });
  };

  const downloadResume = () => {
    const resumeContent = generateResumeHTML();
    const blob = new Blob([resumeContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${resumeData.personalInfo.name || 'resume'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Resume Downloaded!",
      description: "Your ATS-friendly resume has been downloaded"
    });
  };

  const generateResumeHTML = () => {
    const skillsByCategory = skills.reduce((acc, skill) => {
      if (!acc[skill.category]) acc[skill.category] = [];
      acc[skill.category].push(skill);
      return acc;
    }, {} as Record<string, Skill[]>);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${resumeData.personalInfo.name} - Resume</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; max-width: 8.5in; margin: 0 auto; padding: 0.5in; background: white; }
        .header { text-align: center; margin-bottom: 30px; }
        .name { font-size: 28px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
        .contact { font-size: 14px; color: #666; }
        .contact a { color: #2563eb; text-decoration: none; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 18px; font-weight: bold; color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 5px; margin-bottom: 15px; }
        .job { margin-bottom: 15px; }
        .job-title { font-weight: bold; font-size: 16px; }
        .job-company { font-style: italic; color: #666; }
        .job-duration { float: right; color: #666; font-size: 14px; }
        .job-description { margin-top: 8px; }
        .skills-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .skill-category { margin-bottom: 10px; }
        .skill-category-title { font-weight: bold; margin-bottom: 5px; }
        .skill-list { display: flex; flex-wrap: wrap; gap: 5px; }
        .skill-badge { background: #e5e7eb; padding: 3px 8px; border-radius: 12px; font-size: 12px; }
        .project { margin-bottom: 15px; }
        .project-title { font-weight: bold; font-size: 16px; }
        .project-tech { color: #666; font-size: 14px; margin-top: 5px; }
        ul { margin-left: 20px; }
        li { margin-bottom: 5px; }
        @media print { body { padding: 0.3in; } }
    </style>
</head>
<body>
    <div class="header">
        <div class="name">${resumeData.personalInfo.name}</div>
        <div class="contact">
            ${resumeData.personalInfo.email} | ${resumeData.personalInfo.phone} | ${resumeData.personalInfo.location}
            ${resumeData.personalInfo.linkedin ? `| <a href="${resumeData.personalInfo.linkedin}">LinkedIn</a>` : ''}
            ${resumeData.personalInfo.github ? `| <a href="${resumeData.personalInfo.github}">GitHub</a>` : ''}
            ${resumeData.personalInfo.website ? `| <a href="${resumeData.personalInfo.website}">Website</a>` : ''}
        </div>
    </div>

    ${resumeData.summary ? `
    <div class="section">
        <div class="section-title">PROFESSIONAL SUMMARY</div>
        <p>${resumeData.summary}</p>
    </div>
    ` : ''}

    ${Object.keys(skillsByCategory).length > 0 ? `
    <div class="section">
        <div class="section-title">TECHNICAL SKILLS</div>
        <div class="skills-grid">
            ${Object.entries(skillsByCategory).map(([category, categorySkills]) => `
                <div class="skill-category">
                    <div class="skill-category-title">${category}:</div>
                    <div class="skill-list">
                        ${categorySkills.map(skill => `<span class="skill-badge">${skill.name}</span>`).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
    ` : ''}

    ${resumeData.experiences.length > 0 ? `
    <div class="section">
        <div class="section-title">PROFESSIONAL EXPERIENCE</div>
        ${resumeData.experiences.map(exp => `
            <div class="job">
                <div class="job-title">${exp.title}</div>
                <div class="job-company">${exp.company} <span class="job-duration">${exp.duration}</span></div>
                <div class="job-description">${exp.description}</div>
            </div>
        `).join('')}
    </div>
    ` : ''}

    ${resumeData.projects.length > 0 ? `
    <div class="section">
        <div class="section-title">PROJECTS</div>
        ${resumeData.projects.map(project => `
            <div class="project">
                <div class="project-title">${project.name}</div>
                <div class="project-description">${project.description}</div>
                ${project.technologies.length > 0 ? `<div class="project-tech">Technologies: ${project.technologies.join(', ')}</div>` : ''}
                ${project.link ? `<div class="project-link"><a href="${project.link}">Project Link</a></div>` : ''}
            </div>
        `).join('')}
    </div>
    ` : ''}

    ${resumeData.education.length > 0 ? `
    <div class="section">
        <div class="section-title">EDUCATION</div>
        ${resumeData.education.map(edu => `
            <div class="job">
                <div class="job-title">${edu.degree}</div>
                <div class="job-company">${edu.institution} <span class="job-duration">${edu.year}</span></div>
                ${edu.gpa ? `<div>GPA: ${edu.gpa}</div>` : ''}
            </div>
        `).join('')}
    </div>
    ` : ''}
</body>
</html>`;
  };

  const ResumePreview = () => (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-blue-600">{resumeData.personalInfo.name || "[Your Name]"}</h1>
        <div className="text-gray-600 mt-2">
          {resumeData.personalInfo.email} | {resumeData.personalInfo.phone} | {resumeData.personalInfo.location}
        </div>
        <div className="text-gray-600">
          {resumeData.personalInfo.linkedin && `LinkedIn: ${resumeData.personalInfo.linkedin} | `}
          {resumeData.personalInfo.github && `GitHub: ${resumeData.personalInfo.github}`}
        </div>
      </div>

      {resumeData.summary && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-blue-600 border-b-2 border-blue-600 pb-1 mb-3">PROFESSIONAL SUMMARY</h2>
          <p className="text-gray-700">{resumeData.summary}</p>
        </div>
      )}

      {skills.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-blue-600 border-b-2 border-blue-600 pb-1 mb-3">TECHNICAL SKILLS</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(skills.reduce((acc, skill) => {
              if (!acc[skill.category]) acc[skill.category] = [];
              acc[skill.category].push(skill);
              return acc;
            }, {} as Record<string, Skill[]>)).map(([category, categorySkills]) => (
              <div key={category}>
                <div className="font-bold">{category}:</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {categorySkills.map(skill => (
                    <Badge key={skill.id} variant="secondary" className="text-xs">
                      {skill.name}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {resumeData.experiences.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-blue-600 border-b-2 border-blue-600 pb-1 mb-3">PROFESSIONAL EXPERIENCE</h2>
          {resumeData.experiences.map(exp => (
            <div key={exp.id} className="mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-lg">{exp.title}</div>
                  <div className="italic text-gray-600">{exp.company}</div>
                </div>
                <div className="text-gray-600">{exp.duration}</div>
              </div>
              <p className="mt-2 text-gray-700">{exp.description}</p>
            </div>
          ))}
        </div>
      )}

      {resumeData.projects.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-blue-600 border-b-2 border-blue-600 pb-1 mb-3">PROJECTS</h2>
          {resumeData.projects.map(project => (
            <div key={project.id} className="mb-4">
              <div className="font-bold text-lg">{project.name}</div>
              <p className="text-gray-700 mt-1">{project.description}</p>
              {project.technologies.length > 0 && (
                <div className="text-gray-600 text-sm mt-1">
                  Technologies: {project.technologies.join(', ')}
                </div>
              )}
              {project.link && (
                <div className="text-blue-600 text-sm mt-1">
                  <a href={project.link} target="_blank" rel="noopener noreferrer">Project Link</a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {resumeData.education.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-blue-600 border-b-2 border-blue-600 pb-1 mb-3">EDUCATION</h2>
          {resumeData.education.map(edu => (
            <div key={edu.id} className="mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-lg">{edu.degree}</div>
                  <div className="italic text-gray-600">{edu.institution}</div>
                </div>
                <div className="text-gray-600">{edu.year}</div>
              </div>
              {edu.gpa && <div className="text-gray-700 mt-1">GPA: {edu.gpa}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (showPreview) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Resume Preview</h2>
          <div className="flex gap-2">
            <Button onClick={() => setShowPreview(false)} variant="outline">
              <Edit3 className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button onClick={downloadResume} className="gradient-button">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
        <ResumePreview />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Resume Builder</h2>
        <div className="flex gap-2">
          <Button onClick={() => setShowPreview(true)} variant="outline" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <Button onClick={downloadResume} className="gradient-button">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={resumeData.personalInfo.name}
                  onChange={(e) => setResumeData(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, name: e.target.value }
                  }))}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={resumeData.personalInfo.email}
                  onChange={(e) => setResumeData(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, email: e.target.value }
                  }))}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={resumeData.personalInfo.phone}
                  onChange={(e) => setResumeData(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, phone: e.target.value }
                  }))}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={resumeData.personalInfo.location}
                  onChange={(e) => setResumeData(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, location: e.target.value }
                  }))}
                  placeholder="City, State"
                />
              </div>
              <div>
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  value={resumeData.personalInfo.linkedin}
                  onChange={(e) => setResumeData(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, linkedin: e.target.value }
                  }))}
                  placeholder="linkedin.com/in/johndoe"
                />
              </div>
              <div>
                <Label htmlFor="github">GitHub</Label>
                <Input
                  id="github"
                  value={resumeData.personalInfo.github}
                  onChange={(e) => setResumeData(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, github: e.target.value }
                  }))}
                  placeholder="github.com/johndoe"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Summary */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Professional Summary</CardTitle>
            <CardDescription>A brief overview of your skills and experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={resumeData.summary}
              onChange={(e) => setResumeData(prev => ({ ...prev, summary: e.target.value }))}
              placeholder="Write a compelling professional summary..."
              rows={4}
            />
            <Button onClick={generateAISummary} variant="outline" className="w-full">
              Generate AI Summary Based on Skills
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Experience Section */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Work Experience</CardTitle>
              <CardDescription>Add your professional experience</CardDescription>
            </div>
            <Dialog open={experienceDialog} onOpenChange={setExperienceDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Experience
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Work Experience</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="expTitle">Job Title *</Label>
                    <Input
                      id="expTitle"
                      value={newExperience.title}
                      onChange={(e) => setNewExperience({...newExperience, title: e.target.value})}
                      placeholder="Software Engineer"
                    />
                  </div>
                  <div>
                    <Label htmlFor="expCompany">Company *</Label>
                    <Input
                      id="expCompany"
                      value={newExperience.company}
                      onChange={(e) => setNewExperience({...newExperience, company: e.target.value})}
                      placeholder="Tech Corp"
                    />
                  </div>
                  <div>
                    <Label htmlFor="expDuration">Duration</Label>
                    <Input
                      id="expDuration"
                      value={newExperience.duration}
                      onChange={(e) => setNewExperience({...newExperience, duration: e.target.value})}
                      placeholder="Jan 2021 - Present"
                    />
                  </div>
                  <div>
                    <Label htmlFor="expDescription">Description</Label>
                    <Textarea
                      id="expDescription"
                      value={newExperience.description}
                      onChange={(e) => setNewExperience({...newExperience, description: e.target.value})}
                      placeholder="Describe your role and achievements..."
                      rows={3}
                    />
                  </div>
                  <Button onClick={addExperience} className="w-full gradient-button">
                    Add Experience
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {resumeData.experiences.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No work experience added yet</p>
          ) : (
            <div className="space-y-4">
              {resumeData.experiences.map(exp => (
                <div key={exp.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{exp.title}</h4>
                      <p className="text-muted-foreground">{exp.company} • {exp.duration}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setResumeData(prev => ({
                        ...prev,
                        experiences: prev.experiences.filter(e => e.id !== exp.id)
                      }))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm">{exp.description}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Projects & Education Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Projects</CardTitle>
                <CardDescription>Showcase your projects</CardDescription>
              </div>
              <Dialog open={projectDialog} onOpenChange={setProjectDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Project
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Project</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="projectName">Project Name *</Label>
                      <Input
                        id="projectName"
                        value={newProject.name}
                        onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                        placeholder="Awesome Project"
                      />
                    </div>
                    <div>
                      <Label htmlFor="projectDesc">Description *</Label>
                      <Textarea
                        id="projectDesc"
                        value={newProject.description}
                        onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                        placeholder="Describe your project..."
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="projectTech">Technologies (comma-separated)</Label>
                      <Input
                        id="projectTech"
                        value={newProject.technologies.join(', ')}
                        onChange={(e) => setNewProject({...newProject, technologies: e.target.value.split(',').map(t => t.trim()).filter(t => t)})}
                        placeholder="React, Node.js, MongoDB"
                      />
                    </div>
                    <div>
                      <Label htmlFor="projectLink">Project Link</Label>
                      <Input
                        id="projectLink"
                        value={newProject.link}
                        onChange={(e) => setNewProject({...newProject, link: e.target.value})}
                        placeholder="https://github.com/user/project"
                      />
                    </div>
                    <Button onClick={addProject} className="w-full gradient-button">
                      Add Project
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {resumeData.projects.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No projects added yet</p>
            ) : (
              <div className="space-y-4">
                {resumeData.projects.map(project => (
                  <div key={project.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{project.name}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setResumeData(prev => ({
                          ...prev,
                          projects: prev.projects.filter(p => p.id !== project.id)
                        }))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm mb-2">{project.description}</p>
                    {project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {project.technologies.map(tech => (
                          <Badge key={tech} variant="secondary" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {project.link && (
                      <a href={project.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">
                        View Project
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Education */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Education</CardTitle>
                <CardDescription>Add your educational background</CardDescription>
              </div>
              <Dialog open={educationDialog} onOpenChange={setEducationDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Education
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Education</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="eduDegree">Degree *</Label>
                      <Input
                        id="eduDegree"
                        value={newEducation.degree}
                        onChange={(e) => setNewEducation({...newEducation, degree: e.target.value})}
                        placeholder="Bachelor of Science in Computer Science"
                      />
                    </div>
                    <div>
                      <Label htmlFor="eduInstitution">Institution *</Label>
                      <Input
                        id="eduInstitution"
                        value={newEducation.institution}
                        onChange={(e) => setNewEducation({...newEducation, institution: e.target.value})}
                        placeholder="University Name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="eduYear">Year</Label>
                      <Input
                        id="eduYear"
                        value={newEducation.year}
                        onChange={(e) => setNewEducation({...newEducation, year: e.target.value})}
                        placeholder="2020-2024"
                      />
                    </div>
                    <div>
                      <Label htmlFor="eduGPA">GPA (Optional)</Label>
                      <Input
                        id="eduGPA"
                        value={newEducation.gpa}
                        onChange={(e) => setNewEducation({...newEducation, gpa: e.target.value})}
                        placeholder="3.8/4.0"
                      />
                    </div>
                    <Button onClick={addEducation} className="w-full gradient-button">
                      Add Education
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {resumeData.education.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No education added yet</p>
            ) : (
              <div className="space-y-4">
                {resumeData.education.map(edu => (
                  <div key={edu.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">{edu.degree}</h4>
                        <p className="text-muted-foreground">{edu.institution} • {edu.year}</p>
                        {edu.gpa && <p className="text-sm">GPA: {edu.gpa}</p>}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setResumeData(prev => ({
                          ...prev,
                          education: prev.education.filter(e => e.id !== edu.id)
                        }))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResumeBuilder;