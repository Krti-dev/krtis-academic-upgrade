import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Note {
  id: string;
  content: string;
  completed: boolean;
  created_at: string;
  user_id: string;
}

export const SimpleGoals = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user]);

  const fetchNotes = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('study_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const notesData = (data || []).map(goal => ({
        id: goal.id,
        content: goal.title,
        completed: goal.completed,
        created_at: goal.created_at,
        user_id: goal.user_id
      }));

      setNotes(notesData);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch notes",
        variant: "destructive",
      });
    }
  };

  const addNote = async () => {
    if (!newNote.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('study_goals')
        .insert([{
          title: newNote,
          description: null,
          category: 'personal',
          completed: false,
          user_id: user.id,
        }]);

      if (error) throw error;

      setNewNote("");
      fetchNotes();
      toast({
        title: "Success",
        description: "Note added!",
      });
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "Error",
        description: "Failed to add note",
        variant: "destructive",
      });
    }
  };

  const toggleComplete = async (noteId: string, completed: boolean) => {
    try {
      const { error } = await supabase
        .from('study_goals')
        .update({ completed: !completed })
        .eq('id', noteId);

      if (error) throw error;
      fetchNotes();
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive",
      });
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('study_goals')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      fetchNotes();
      toast({
        title: "Success",
        description: "Note deleted!",
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
    }
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const saveEdit = async () => {
    if (!editContent.trim() || !editingId) return;

    try {
      const { error } = await supabase
        .from('study_goals')
        .update({ title: editContent })
        .eq('id', editingId);

      if (error) throw error;

      setEditingId(null);
      setEditContent("");
      fetchNotes();
      toast({
        title: "Success",
        description: "Note updated!",
      });
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (editingId) {
        saveEdit();
      } else {
        addNote();
      }
    }
  };

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold mb-6">Notes</h1>
      
      {/* Add new note */}
      <div className="flex gap-2">
        <Textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Take a note..."
          className="min-h-[40px] resize-none"
          rows={1}
        />
        <Button onClick={addNote} size="sm" className="px-3">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Notes grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {notes.map((note) => (
          <Card key={note.id} className={`p-4 hover:shadow-md transition-shadow ${note.completed ? 'bg-muted/50' : ''}`}>
            <CardContent className="p-0 space-y-3">
              <div className="flex items-start gap-2">
                <Checkbox
                  checked={note.completed}
                  onCheckedChange={() => toggleComplete(note.id, note.completed)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  {editingId === note.id ? (
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onKeyPress={handleKeyPress}
                      onBlur={saveEdit}
                      className="min-h-[60px] text-sm border-none p-0 resize-none focus-visible:ring-0"
                      autoFocus
                    />
                  ) : (
                    <p 
                      className={`text-sm whitespace-pre-wrap cursor-pointer ${note.completed ? 'line-through text-muted-foreground' : ''}`}
                      onClick={() => startEdit(note)}
                    >
                      {note.content}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-xs text-muted-foreground">
                  {new Date(note.created_at).toLocaleDateString()}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startEdit(note)}
                    className="h-6 w-6 p-0"
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteNote(note.id)}
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {notes.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No notes yet. Start by adding one above!</p>
        </div>
      )}
    </div>
  );
};