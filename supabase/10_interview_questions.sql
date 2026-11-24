-- =====================================================================
-- Update 10 (Nov 2026): marks for each subject-mastery question in teacher interviews.
-- question_marks = {"subject": {"set": "<job title>", "marks": {"phy1": 3, ...}, "manual": null | number}}
-- The subject-mastery criterion score (scores.subject, 0–5) is still stored as before;
-- it is the questions total, or the panel's manual score, scaled to 5.
-- Run once in Supabase → SQL Editor. Safe to run again.
-- =====================================================================
alter table public.interviews add column if not exists question_marks jsonb not null default '{}'::jsonb;

select column_name as added_column from information_schema.columns
where table_schema = 'public' and table_name = 'interviews' and column_name = 'question_marks';
