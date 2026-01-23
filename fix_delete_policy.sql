-- Enable users to delete their own exam attempts
-- Run this in your Supabase SQL Editor

-- First, check if the policy exists to avoid duplicates (optional, but good practice)
DROP POLICY IF EXISTS "Users can delete own attempts" ON public.exam_attempts;

-- Create the policy
CREATE POLICY "Users can delete own attempts" ON public.exam_attempts
  FOR DELETE USING (auth.uid() = user_id);

-- Verify RLS is enabled (should be already)
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
