-- =====================================================================
-- Update 06 (Nov 2026): for Specialised Labs Engineer / Teacher and
-- Lab Technician the hiring plan is entered per lab / specialisation only;
-- the title total is the sum of those lines. Old "not specified" numbers
-- for these two titles are moved to a backup table so they are not counted twice.
-- Run once in Supabase → SQL Editor. Safe to run again.
-- =====================================================================
create table if not exists public.hiring_plan_backup_06 (like public.hiring_plan);
alter table public.hiring_plan_backup_06 add column if not exists backed_up_at timestamptz default now();
alter table public.hiring_plan_backup_06 enable row level security;   -- no policies: visible only here in the SQL editor

insert into public.hiring_plan_backup_06
select h.*, now() from public.hiring_plan h
  join public.job_titles j on j.id = h.job_title_id
 where h.specialization = '' and (j.per_lab or j.rubric_key = 'lab_technician')
   and not exists (select 1 from public.hiring_plan_backup_06 b where b.id = h.id);

delete from public.hiring_plan h
 using public.job_titles j
 where j.id = h.job_title_id and h.specialization = '' and (j.per_lab or j.rubric_key = 'lab_technician');

select count(*) as backed_up_rows, coalesce(sum(planned_count), 0) as backed_up_total from public.hiring_plan_backup_06;
