-- Add user_id columns to all tables and implement proper Row Level Security

-- Add user_id column to all tables
ALTER TABLE public.subjects ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.timetable ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.attendance ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.study_sessions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.expenses ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.budget_limits ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.assignments ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.mood_entries ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.study_goals ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Make user_id NOT NULL for all tables (after adding default values)
UPDATE public.subjects SET user_id = '00000000-0000-0000-0000-000000000000'::uuid WHERE user_id IS NULL;
UPDATE public.timetable SET user_id = '00000000-0000-0000-0000-000000000000'::uuid WHERE user_id IS NULL;
UPDATE public.attendance SET user_id = '00000000-0000-0000-0000-000000000000'::uuid WHERE user_id IS NULL;
UPDATE public.study_sessions SET user_id = '00000000-0000-0000-0000-000000000000'::uuid WHERE user_id IS NULL;
UPDATE public.expenses SET user_id = '00000000-0000-0000-0000-000000000000'::uuid WHERE user_id IS NULL;
UPDATE public.budget_limits SET user_id = '00000000-0000-0000-0000-000000000000'::uuid WHERE user_id IS NULL;
UPDATE public.assignments SET user_id = '00000000-0000-0000-0000-000000000000'::uuid WHERE user_id IS NULL;
UPDATE public.mood_entries SET user_id = '00000000-0000-0000-0000-000000000000'::uuid WHERE user_id IS NULL;
UPDATE public.study_goals SET user_id = '00000000-0000-0000-0000-000000000000'::uuid WHERE user_id IS NULL;

ALTER TABLE public.subjects ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.timetable ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.attendance ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.study_sessions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.expenses ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.budget_limits ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.assignments ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.mood_entries ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.study_goals ALTER COLUMN user_id SET NOT NULL;

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Allow all operations on subjects" ON public.subjects;
DROP POLICY IF EXISTS "Allow all operations on timetable" ON public.timetable;
DROP POLICY IF EXISTS "Allow all operations on attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow all operations on study_sessions" ON public.study_sessions;
DROP POLICY IF EXISTS "Allow all operations on expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow all operations on budget_limits" ON public.budget_limits;
DROP POLICY IF EXISTS "Allow all operations on assignments" ON public.assignments;
DROP POLICY IF EXISTS "Allow all operations on mood_entries" ON public.mood_entries;
DROP POLICY IF EXISTS "Allow all operations on study_goals" ON public.study_goals;

-- Create secure RLS policies for subjects
CREATE POLICY "Users can view their own subjects" ON public.subjects
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subjects" ON public.subjects
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subjects" ON public.subjects
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subjects" ON public.subjects
FOR DELETE USING (auth.uid() = user_id);

-- Create secure RLS policies for timetable
CREATE POLICY "Users can view their own timetable" ON public.timetable
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own timetable" ON public.timetable
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own timetable" ON public.timetable
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own timetable" ON public.timetable
FOR DELETE USING (auth.uid() = user_id);

-- Create secure RLS policies for attendance
CREATE POLICY "Users can view their own attendance" ON public.attendance
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own attendance" ON public.attendance
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attendance" ON public.attendance
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own attendance" ON public.attendance
FOR DELETE USING (auth.uid() = user_id);

-- Create secure RLS policies for study_sessions
CREATE POLICY "Users can view their own study_sessions" ON public.study_sessions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own study_sessions" ON public.study_sessions
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study_sessions" ON public.study_sessions
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study_sessions" ON public.study_sessions
FOR DELETE USING (auth.uid() = user_id);

-- Create secure RLS policies for expenses
CREATE POLICY "Users can view their own expenses" ON public.expenses
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own expenses" ON public.expenses
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses" ON public.expenses
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses" ON public.expenses
FOR DELETE USING (auth.uid() = user_id);

-- Create secure RLS policies for budget_limits
CREATE POLICY "Users can view their own budget_limits" ON public.budget_limits
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own budget_limits" ON public.budget_limits
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budget_limits" ON public.budget_limits
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budget_limits" ON public.budget_limits
FOR DELETE USING (auth.uid() = user_id);

-- Create secure RLS policies for assignments
CREATE POLICY "Users can view their own assignments" ON public.assignments
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own assignments" ON public.assignments
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assignments" ON public.assignments
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assignments" ON public.assignments
FOR DELETE USING (auth.uid() = user_id);

-- Create secure RLS policies for mood_entries
CREATE POLICY "Users can view their own mood_entries" ON public.mood_entries
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mood_entries" ON public.mood_entries
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mood_entries" ON public.mood_entries
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mood_entries" ON public.mood_entries
FOR DELETE USING (auth.uid() = user_id);

-- Create secure RLS policies for study_goals
CREATE POLICY "Users can view their own study_goals" ON public.study_goals
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own study_goals" ON public.study_goals
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study_goals" ON public.study_goals
FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study_goals" ON public.study_goals
FOR DELETE USING (auth.uid() = user_id);