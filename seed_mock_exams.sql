-- 1. Add difficulty column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exams' AND column_name = 'difficulty') THEN 
        ALTER TABLE public.exams ADD COLUMN difficulty text DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')); 
    END IF; 
END $$;

-- 2. Seed Mock Exams
DO $$
DECLARE
  v_user_id uuid;
  v_exam_id uuid;
BEGIN
  -- Get a user ID to use as creator (using the first available user)
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  
  -- Only proceed if we found a user
  IF v_user_id IS NOT NULL THEN
      
      -- EASY EXAM
      INSERT INTO public.exams (title, description, duration_minutes, is_active, difficulty, created_by, is_public)
      VALUES ('Basic Math Challenge', 'A simple math quiz for beginners to test basic arithmetic skills.', 15, true, 'easy', v_user_id, true)
      RETURNING id INTO v_exam_id;
      
      INSERT INTO public.questions (exam_id, question_text, options, correct_answer)
      VALUES 
      (v_exam_id, 'What is 2 + 2?', '["3", "4", "5", "6"]'::jsonb, '4'),
      (v_exam_id, 'What is 10 - 3?', '["6", "7", "8", "5"]'::jsonb, '7'),
      (v_exam_id, 'What is 5 * 5?', '["10", "20", "25", "30"]'::jsonb, '25');

      -- MEDIUM EXAM
      INSERT INTO public.exams (title, description, duration_minutes, is_active, difficulty, created_by, is_public)
      VALUES ('General Geography', 'Test your knowledge of world countries and capitals.', 20, true, 'medium', v_user_id, true)
      RETURNING id INTO v_exam_id;

      INSERT INTO public.questions (exam_id, question_text, options, correct_answer)
      VALUES 
      (v_exam_id, 'What is the capital of France?', '["London", "Berlin", "Paris", "Madrid"]'::jsonb, 'Paris'),
      (v_exam_id, 'Which is the largest ocean?', '["Atlantic", "Indian", "Arctic", "Pacific"]'::jsonb, 'Pacific'),
      (v_exam_id, 'Which continent is Brazil in?', '["Africa", "Asia", "South America", "Europe"]'::jsonb, 'South America');

      -- HARD EXAM
      INSERT INTO public.exams (title, description, duration_minutes, is_active, difficulty, created_by, is_public)
      VALUES ('Advanced Science', 'Complex questions about physics and chemistry.', 30, true, 'hard', v_user_id, true)
      RETURNING id INTO v_exam_id;

      INSERT INTO public.questions (exam_id, question_text, options, correct_answer)
      VALUES 
      (v_exam_id, 'What is the atomic number of Carbon?', '["12", "6", "14", "8"]'::jsonb, '6'),
      (v_exam_id, 'What is the speed of light in vacuum?', '["299,792,458 m/s", "300,000 km/h", "150,000 m/s", "Unknown"]'::jsonb, '299,792,458 m/s'),
      (v_exam_id, 'Who developed the theory of relativity?', '["Newton", "Tesla", "Einstein", "Hawking"]'::jsonb, 'Einstein');

  END IF;
END $$;
