-- Check if user_id column exists and add it if missing for all tables
DO $$ 
BEGIN
    -- Add user_id to attendance table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attendance' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.attendance ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Add user_id to other tables if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subjects' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.subjects ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'timetable' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.timetable ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'study_sessions' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.study_sessions ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'expenses' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.expenses ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'budget_limits' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.budget_limits ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assignments' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.assignments ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'mood_entries' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.mood_entries ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'study_goals' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.study_goals ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Update RLS policies to be more specific for user data
DROP POLICY IF EXISTS "Allow all operations on attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow all operations on subjects" ON public.subjects;
DROP POLICY IF EXISTS "Allow all operations on timetable" ON public.timetable;
DROP POLICY IF EXISTS "Allow all operations on study_sessions" ON public.study_sessions;
DROP POLICY IF EXISTS "Allow all operations on expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow all operations on budget_limits" ON public.budget_limits;
DROP POLICY IF EXISTS "Allow all operations on assignments" ON public.assignments;
DROP POLICY IF EXISTS "Allow all operations on mood_entries" ON public.mood_entries;
DROP POLICY IF EXISTS "Allow all operations on study_goals" ON public.study_goals;

-- Create proper RLS policies for each table
CREATE POLICY "Users can manage their own attendance" ON public.attendance
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own subjects" ON public.subjects
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own timetable" ON public.timetable
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own study sessions" ON public.study_sessions
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own expenses" ON public.expenses
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own budget limits" ON public.budget_limits
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own assignments" ON public.assignments
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own mood entries" ON public.mood_entries
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own study goals" ON public.study_goals
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);