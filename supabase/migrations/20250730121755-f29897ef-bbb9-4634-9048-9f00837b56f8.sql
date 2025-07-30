-- Clear existing subjects and related data
DELETE FROM timetable;
DELETE FROM attendance;
DELETE FROM study_sessions;
DELETE FROM subjects;

-- Add expected_classes column to subjects table for attendance calculations
ALTER TABLE subjects ADD COLUMN expected_classes integer DEFAULT 30;