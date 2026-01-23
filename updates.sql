-- 1. Add is_public column to exams
ALTER TABLE public.exams 
ADD COLUMN is_public boolean DEFAULT false;

-- 2. Update RLS policies for Exams
-- Allow public access to view public exams
DROP POLICY IF EXISTS "Users can view exams" ON public.exams;

CREATE POLICY "Users can view exams" ON public.exams
  FOR SELECT USING (
    auth.role() = 'authenticated' OR is_public = true
  );

-- 3. Update RLS policies for Questions
-- Allow public access to view questions of public exams
DROP POLICY IF EXISTS "Users can view questions" ON public.questions;

CREATE POLICY "Users can view questions" ON public.questions
  FOR SELECT USING (
    auth.role() = 'authenticated' OR 
    EXISTS (
      SELECT 1 FROM public.exams 
      WHERE id = public.questions.exam_id AND is_public = true
    )
  );

-- 4. Insert Dummy Mock Exams (Optional - You can run this multiple times)
-- Create a mock exam if none exists
DO $$
DECLARE
  v_exam_id uuid;
  v_user_id uuid;
BEGIN
  -- Get a user ID to be the creator (e.g., the first admin or user found)
  -- This is needed because 'created_by' is NOT NULL
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- Insert Mock Exam 1
    INSERT INTO public.exams (title, description, duration_minutes, is_active, is_public, created_by)
    VALUES (
      'General Knowledge Mock Exam', 
      'A sample public exam to test your general knowledge. No login required.', 
      10, 
      true, 
      true, 
      v_user_id
    )
    RETURNING id INTO v_exam_id;

    -- Insert Questions for Mock Exam 1
    INSERT INTO public.questions (exam_id, question_text, options, correct_answer)
    VALUES 
      (v_exam_id, 'What is the capital of France?', '["London", "Berlin", "Paris", "Madrid"]'::jsonb, 'Paris'),
      (v_exam_id, 'Which planet is known as the Red Planet?', '["Venus", "Mars", "Jupiter", "Saturn"]'::jsonb, 'Mars'),
      (v_exam_id, 'What is 2 + 2?', '["3", "4", "5", "6"]'::jsonb, '4');
      
  END IF;
END $$;
