-- Add time_spent_seconds column to exam_answers table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exam_answers' AND column_name = 'time_spent_seconds') THEN 
        ALTER TABLE public.exam_answers ADD COLUMN time_spent_seconds integer DEFAULT 0; 
    END IF; 
END $$;
