import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Subject {
  id: string;
  name: string;
  code?: string;
  instructor?: string;
  credits?: number;
  color?: string;
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

export const useSupabaseData = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubjects = async () => {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching subjects:', error);
      return [];
    }
    return data || [];
  };

  const fetchTimetable = async () => {
    const { data, error } = await supabase
      .from('timetable')
      .select(`
        *,
        subject:subjects(*)
      `)
      .order('day_of_week, start_time');
    
    if (error) {
      console.error('Error fetching timetable:', error);
      return [];
    }
    return data || [];
  };

  const fetchAttendance = async () => {
    const { data, error } = await supabase
      .from('attendance')
      .select(`
        *,
        subject:subjects(*)
      `)
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching attendance:', error);
      return [];
    }
    return data || [];
  };

  const fetchStudySessions = async () => {
    const { data, error } = await supabase
      .from('study_sessions')
      .select(`
        *,
        subject:subjects(*)
      `)
      .order('date', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error('Error fetching study sessions:', error);
      return [];
    }
    return data || [];
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [subjectsData, timetableData, attendanceData, studySessionsData] = await Promise.all([
        fetchSubjects(),
        fetchTimetable(),
        fetchAttendance(),
        fetchStudySessions()
      ]);

      setSubjects(subjectsData);
      setTimetable(timetableData);
      setAttendance(attendanceData);
      setStudySessions(studySessionsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const addSubject = async (subject: Omit<Subject, 'id'>) => {
    const { data, error } = await supabase
      .from('subjects')
      .insert([subject])
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
    const { data, error } = await supabase
      .from('timetable')
      .insert([entry])
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
    const { data, error } = await supabase
      .from('attendance')
      .insert([entry])
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
    const { data, error } = await supabase
      .from('study_sessions')
      .insert([session])
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
    const { error } = await supabase
      .from('timetable')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

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

  return {
    subjects,
    timetable,
    attendance,
    studySessions,
    loading,
    addSubject,
    addTimetableEntry,
    addAttendanceEntry,
    addStudySession,
    clearTimetable,
    getAttendanceStats,
    refetch: loadAllData
  };
};