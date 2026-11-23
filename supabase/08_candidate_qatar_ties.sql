-- =====================================================================
-- Update 08 (Nov 2026): candidate date of birth, born in Qatar,
-- child of a Qatari mother, and graduate of a university in Qatar (+ which one).
-- Run once in Supabase → SQL Editor. Safe to run again.
-- =====================================================================
alter table public.candidates add column if not exists birth_date       date;
alter table public.candidates add column if not exists born_in_qatar    boolean;
alter table public.candidates add column if not exists qatari_mother    boolean;
alter table public.candidates add column if not exists qatar_graduate   boolean;
alter table public.candidates add column if not exists qatar_university text;

select column_name as added_column from information_schema.columns
where table_schema = 'public' and table_name = 'candidates'
  and column_name in ('birth_date','born_in_qatar','qatari_mother','qatar_graduate','qatar_university')
order by column_name;
