import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { BookOpen, FileText, HelpCircle, Brain, Download, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseData } from '@/hooks/useSupabaseData';

const StudyMaterialsGenerator = () => {
  const { subjects } = useSupabaseData();
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [content, setContent] = useState('');
  const [generatedMaterial, setGeneratedMaterial] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const materialTypes = [
    { value: 'practice-questions', label: 'Practice Questions', icon: HelpCircle, color: 'info' },
    { value: 'flashcards', label: 'Flashcards', icon: Brain, color: 'success' },
    { value: 'summary', label: 'Content Summary', icon: FileText, color: 'warning' },
    { value: 'study-guide', label: 'Study Guide', icon: BookOpen, color: 'primary' }
  ];

  const difficulties = [
    { value: 'easy', label: 'Easy', color: 'success' },
    { value: 'medium', label: 'Medium', color: 'warning' },
    { value: 'hard', label: 'Hard', color: 'destructive' }
  ];

  const generateMaterial = async () => {
    if (!selectedType || !selectedSubject || !topic) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('study-materials-generator', {
        body: {
          type: selectedType,
          subject: selectedSubject,
          topic,
          difficulty,
          content: selectedType === 'summary' ? content : undefined
        }
      });

      if (error) throw error;

      setGeneratedMaterial(data);
      toast.success('Study material generated successfully!');
    } catch (error) {
      console.error('Error generating material:', error);
      toast.error('Failed to generate study material');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const downloadMaterial = () => {
    if (!generatedMaterial) return;

    const blob = new Blob([generatedMaterial.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedMaterial.type}-${generatedMaterial.subject}-${generatedMaterial.topic}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Material downloaded!');
  };

  const reset = () => {
    setSelectedType('');
    setSelectedSubject('');
    setTopic('');
    setDifficulty('medium');
    setContent('');
    setGeneratedMaterial(null);
  };

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/20 via-purple/10 to-info/20 p-6 border border-border/50">
        <div className="absolute inset-0 mesh-background opacity-50"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">AI Study Materials Generator</h1>
              <p className="text-muted-foreground">Create personalized practice questions, flashcards, and study guides</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generation Form */}
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Generate Study Material
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Material Type Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Material Type</label>
              <div className="grid grid-cols-2 gap-2">
                {materialTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <Button
                      key={type.value}
                      variant={selectedType === type.value ? "default" : "outline"}
                      onClick={() => setSelectedType(type.value)}
                      className="h-auto p-3 flex flex-col items-center gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-xs">{type.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Subject Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.name}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Topic Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Topic</label>
              <Input
                placeholder="e.g., Quadratic Equations, Photosynthesis, World War I"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            {/* Difficulty Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Difficulty Level</label>
              <div className="flex gap-2">
                {difficulties.map((diff) => (
                  <Button
                    key={diff.value}
                    variant={difficulty === diff.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDifficulty(diff.value)}
                  >
                    {diff.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Content Input for Summary */}
            {selectedType === 'summary' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Content to Summarize</label>
                <Textarea
                  placeholder="Paste the content you want to summarize..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={generateMaterial}
                disabled={isGenerating || !selectedType || !selectedSubject || !topic}
                className="flex-1"
              >
                <Brain className="h-4 w-4 mr-2" />
                {isGenerating ? 'Generating...' : 'Generate Material'}
              </Button>
              <Button variant="outline" onClick={reset}>
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Generated Material Display */}
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Generated Material
              {generatedMaterial && (
                <Badge variant="outline" className="ml-auto">
                  {materialTypes.find(t => t.value === generatedMaterial.type)?.label}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!generatedMaterial ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Brain className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-medium text-muted-foreground mb-2">No Material Generated</h3>
                <p className="text-sm text-muted-foreground">
                  Select a material type and generate content to see it here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Material Info */}
                <div className="flex flex-wrap gap-2 pb-3 border-b border-border/50">
                  <Badge variant="outline">{generatedMaterial.subject}</Badge>
                  <Badge variant="outline">{generatedMaterial.topic}</Badge>
                  <Badge variant="outline">{generatedMaterial.difficulty}</Badge>
                </div>

                {/* Content */}
                <div className="bg-muted/40 rounded-lg p-4 border border-border/50">
                  <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                    {generatedMaterial.content}
                  </pre>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(generatedMaterial.content)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadMaterial}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudyMaterialsGenerator;