import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export interface Subject {
  id: string;
  name: string;
  code?: string;
  instructor?: string;
  credits?: number;
  color?: string;
  expected_classes?: number;
}

export interface TimetableEntry {
  id: string;
  subject_id: string;
  day_of_week: number; // 0 = Sunday, 1 = Monday, etc.
  start_time: string;
  end_time: string;
  location?: string;
  subject?: Subject;
}

export interface AttendanceEntry {
  id: string;
  subject_id: string;
  date: string;
  present: boolean;
  note?: string;
  subject?: Subject;
}

export interface StudySession {
  id: string;
  subject_id?: string;
  duration_minutes: number;
  topic?: string;
  date: string;
  effectiveness_rating?: number;
  subject?: Subject;
}

export interface Expense {
  id: string;
  amount: number;
  date: string;
  category: string;
  description: string;
  created_at: string;
}

export interface BudgetLimit {
  id: string;
  category: string;
  monthly_limit: number;
  created_at: string;
  updated_at: string;
}

export const useSupabaseData = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgetLimits, setBudgetLimits] = useState<BudgetLimit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubjects = async () => {
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('user_id', user.id)
      .order('name');
    
    if (error) {
      console.error('Error fetching subjects:', error);
      return [];
    }
    return data || [];
  };

  const fetchTimetable = async () => {
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('timetable')
      .select(`
        *,
        subject:subjects(*)
      `)
      .eq('user_id', user.id)
      .order('day_of_week, start_time');
    
    if (error) {
      console.error('Error fetching timetable:', error);
      return [];
    }
    return data || [];
  };

  const fetchAttendance = async () => {
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        subject:subjects(*)
      `)
      .eq('user_id', user.id)
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching attendance:', error);
      return [];
    }
    return data || [];
  };

  const fetchStudySessions = async () => {
    if (!user) return [];
    
    const { data, error } = await supabase
      .from('study_sessions')
      .select(`
        *,
        subject:subjects(*)
      `)
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error('Error fetching study sessions:', error);
      return [];
    }
    return data || [];
  };

  const fetchExpenses = async () => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching expenses:', error);
      return [];
    }
  };

  const fetchBudgetLimits = async () => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase
        .from('budget_limits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching budget limits:', error);
      return [];
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [subjectsData, timetableData, attendanceData, studySessionsData, expensesData, budgetLimitsData] = await Promise.all([
        fetchSubjects(),
        fetchTimetable(),
        fetchAttendance(),
        fetchStudySessions(),
        fetchExpenses(),
        fetchBudgetLimits()
      ]);

      setSubjects(subjectsData);
      setTimetable(timetableData);
      setAttendance(attendanceData);
      setStudySessions(studySessionsData);
      setExpenses(expensesData);
      setBudgetLimits(budgetLimitsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Only load data if user is authenticated
  useEffect(() => {
    if (user) {
      loadAllData();
    } else {
      // Reset all data when user logs out
      setSubjects([]);
      setTimetable([]);
      setAttendance([]);
      setStudySessions([]);
      setExpenses([]);
      setBudgetLimits([]);
      setLoading(false);
    }
  }, [user]);

  const addSubject = async (subject: Omit<Subject, 'id'>) => {
    if (!user) {
      toast.error("You must be logged in to add subjects");
      return;
    }
    
    const { data, error } = await supabase
      .from('subjects')
      .insert([{ ...subject, user_id: user.id }])
      .select()
      .single();

    if (error) {
      console.error('Error adding subject:', error);
      throw error;
    }

    setSubjects(prev => [...prev, data]);
    return data;
  };

  const addTimetableEntry = async (entry: Omit<TimetableEntry, 'id' | 'subject'>) => {
    if (!user) {
      toast.error("You must be logged in to add timetable entries");
      return;
    }
    
    const { data, error } = await supabase
      .from('timetable')
      .insert([{ ...entry, user_id: user.id }])
      .select(`
        *,
        subject:subjects(*)
      `)
      .single();

    if (error) {
      console.error('Error adding timetable entry:', error);
      throw error;
    }

    setTimetable(prev => [...prev, data]);
    return data;
  };

  const addAttendanceEntry = async (entry: Omit<AttendanceEntry, 'id' | 'subject'>) => {
    if (!user) {
      toast.error("You must be logged in to add attendance entries");
      return;
    }
    
    const { data, error } = await supabase
      .from('attendance')
      .insert([{ ...entry, user_id: user.id }])
      .select(`
        *,
        subject:subjects(*)
      `)
      .single();

    if (error) {
      console.error('Error adding attendance entry:', error);
      throw error;
    }

    setAttendance(prev => [data, ...prev]);
    return data;
  };

  const addStudySession = async (session: Omit<StudySession, 'id' | 'subject'>) => {
    if (!user) {
      toast.error("You must be logged in to add study sessions");
      return;
    }
    
    const { data, error } = await supabase
      .from('study_sessions')
      .insert([{ ...session, user_id: user.id }])
      .select(`
        *,
        subject:subjects(*)
      `)
      .single();

    if (error) {
      console.error('Error adding study session:', error);
      throw error;
    }

    setStudySessions(prev => [data, ...prev]);
    return data;
  };

  const clearTimetable = async () => {
    if (!user) {
      toast.error("You must be logged in to clear timetable");
      return;
    }
    
    const { error } = await supabase
      .from('timetable')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('Error clearing timetable:', error);
      throw error;
    }

    setTimetable([]);
  };

  // Calculate attendance percentage
  const getAttendanceStats = () => {
    const totalClasses = attendance.length;
    const presentClasses = attendance.filter(a => a.present).length;
    const overallPercentage = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0;

    const subjectStats = subjects.map(subject => {
      const subjectAttendance = attendance.filter(a => a.subject_id === subject.id);
      const total = subjectAttendance.length;
      const present = subjectAttendance.filter(a => a.present).length;
      const percentage = total > 0 ? (present / total) * 100 : 0;

      return {
        subject,
        total,
        present,
        percentage
      };
    });

    return {
      overall: {
        total: totalClasses,
        present: presentClasses,
        percentage: overallPercentage
      },
      subjects: subjectStats
    };
  };

  const addExpense = async (expenseData: { amount: number; date: string; category: string; description: string }) => {
    if (!user) {
      toast.error("You must be logged in to add expenses");
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert({ ...expenseData, user_id: user.id })
        .select()
        .single();

      if (error) throw error;

      setExpenses(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  };

  const addBudgetLimit = async (budgetData: { category: string; monthly_limit: number }) => {
    if (!user) {
      toast.error("You must be logged in to add budget limits");
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('budget_limits')
        .insert({ ...budgetData, user_id: user.id })
        .select()
        .single();

      if (error) throw error;

      setBudgetLimits(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error adding budget limit:', error);
      throw error;
    }
  };

  return {
    subjects,
    timetable,
    attendance,
    studySessions,
    expenses,
    budgetLimits,
    loading,
    addSubject,
    addTimetableEntry,
    addAttendanceEntry,
    addStudySession,
    addExpense,
    addBudgetLimit,
    clearTimetable,
    getAttendanceStats,
    refetch: loadAllData
  };
};