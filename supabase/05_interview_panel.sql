-- =====================================================================
-- Update 05 (Nov 2026): interview panel members with their job titles.
-- panel = [{"name": "...", "title": "..."}, ...]
-- The text column "interviewers" keeps a readable copy ("Name (Title); ...").
-- Run once in Supabase → SQL Editor. Safe to run again.
-- =====================================================================
alter table public.interviews add column if not exists panel jsonb not null default '[]'::jsonb;

-- existing interviews: turn the old text into panel rows (names only)
update public.interviews
   set panel = (select coalesce(jsonb_agg(jsonb_build_object(
                          'name',  trim(coalesce((regexp_match(trim(n), '^(.*?)\s*\(([^()]*)\)$'))[1], n)),
                          'title', trim(coalesce((regexp_match(trim(n), '^(.*?)\s*\(([^()]*)\)$'))[2], '')))), '[]'::jsonb)
                  from unnest(string_to_array(interviewers, ';')) n where trim(n) <> '')
 where (panel = '[]'::jsonb or panel::text like '%(%') and coalesce(interviewers, '') <> '';

select count(*) filter (where jsonb_array_length(panel) > 0) as interviews_with_panel, count(*) as interviews
from public.interviews;
