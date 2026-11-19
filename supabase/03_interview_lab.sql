-- =====================================================================
-- Update 03 (Nov 2026): record the lab / specialisation on each interview.
-- Run once in Supabase → SQL Editor. Safe to run again.
-- =====================================================================
alter table public.interviews add column if not exists specialization text;

-- the latest interview's lab is copied to the candidate's file automatically
-- (runs with system rights, so it works for every interviewer)
create or replace function public.sync_candidate_interview() returns trigger
language plpgsql security definer set search_path = public as $$
declare cid uuid := coalesce(new.candidate_id, old.candidate_id); r record;
begin
  select result, interview_date, overall_score, specialization into r
  from public.interviews where candidate_id = cid
  order by interview_date desc, created_at desc limit 1;
  update public.candidates set
    interview_result    = coalesce(r.result, 'pending'),
    last_interview_date = r.interview_date,
    last_score          = r.overall_score,
    specialization      = coalesce(nullif(r.specialization, ''), specialization)
  where id = cid;
  return null;
end $$;
