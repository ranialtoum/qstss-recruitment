-- =====================================================================
-- QSTSS Recruitment & Staffing System — database schema (Supabase / PostgreSQL 15+)
-- Run this file first in Supabase → SQL Editor, then 02_seed.sql.
-- Safe to run on an empty project. Re-running drops nothing; it fails on existing objects.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. Reference data: schools, departments, job titles, academic years
-- ---------------------------------------------------------------------
create table public.schools (
  id          serial primary key,
  code        text unique not null,
  name_ar     text not null,
  name_en     text not null,
  full_name_ar text,
  full_name_en text,
  gender      text check (gender in ('boys','girls')),
  sort        int default 0,
  active      boolean default true
);

create table public.departments (
  id      serial primary key,
  name_ar text unique not null,
  name_en text not null,
  sort    int default 0
);

create table public.rubrics (
  key     text primary key,
  name_en text not null,
  name_ar text not null,
  sort    int default 0
);

create table public.job_titles (
  id            serial primary key,
  department_id int references public.departments(id),
  name_ar       text unique not null,
  name_en       text not null,
  reports_to_ar text,
  reports_to_en text,
  -- academic | administrative | lab | leadership  (drives which skills are assessed)
  category      text not null default 'administrative'
                check (category in ('leadership','academic','administrative','lab')),
  rubric_key    text references public.rubrics(key),
  sort          int default 0,
  active        boolean default true
);

create table public.academic_years (
  id          serial primary key,
  label       text unique not null,          -- e.g. 2027/2028
  start_year  int unique not null,
  is_baseline boolean default false,         -- 2026/2027 = current staff snapshot
  is_current  boolean default false
);

-- Approved structure per school: approved headcount + staff in post at baseline
create table public.school_positions (
  id            serial primary key,
  school_id     int not null references public.schools(id) on delete cascade,
  job_title_id  int not null references public.job_titles(id) on delete cascade,
  approved_count int not null default 0 check (approved_count >= 0),
  current_staff  int not null default 0 check (current_staff >= 0),
  notes         text,
  updated_at    timestamptz default now(),
  unique (school_id, job_title_id)
);

-- Specialised labs per school (used as specialisations for lab engineers)
create table public.school_labs (
  id        serial primary key,
  school_id int not null references public.schools(id) on delete cascade,
  name      text not null,
  staff_count int default 0,
  notes     text,
  unique (school_id, name)
);

-- Yearly hiring plan: how many to hire per school × title × year (optionally per specialisation)
create table public.hiring_plan (
  id             serial primary key,
  school_id      int not null references public.schools(id) on delete cascade,
  job_title_id   int not null references public.job_titles(id) on delete cascade,
  year_id        int not null references public.academic_years(id) on delete cascade,
  specialization text not null default '',
  planned_count  int not null default 0 check (planned_count >= 0),
  notes          text,
  updated_at     timestamptz default now(),
  updated_by     uuid,
  unique (school_id, job_title_id, year_id, specialization)
);

-- ---------------------------------------------------------------------
-- 2. Users & permissions
-- ---------------------------------------------------------------------
-- role: admin       – everything incl. approving users & settings
--       hr          – recruitment officer: candidates, interviews, pipeline, hiring plan
--       interviewer – records interviews & candidates, edits own interviews
--       principal   – sees own school's candidates, updates onboarding steps
--       viewer      – read-only dashboards & reports
create table public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  email          text,
  full_name      text,
  phone          text,
  position_note  text,                       -- what the user wrote about their job at sign-up
  requested_role text,
  requested_school_id int references public.schools(id),
  role           text not null default 'none'
                 check (role in ('none','admin','hr','interviewer','principal','viewer')),
  status         text not null default 'pending'
                 check (status in ('pending','approved','rejected','disabled')),
  school_id      int references public.schools(id),
  created_at     timestamptz default now(),
  approved_at    timestamptz,
  approved_by    uuid
);

-- helper functions used by the row-level-security policies
create or replace function public.app_role() returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.profiles
                   where id = auth.uid() and status = 'approved'), 'none');
$$;

create or replace function public.app_school() returns int
language sql stable security definer set search_path = public as $$
  select school_id from public.profiles where id = auth.uid() and status = 'approved';
$$;

create or replace function public.is_admin() returns boolean
language sql stable as $$ select public.app_role() = 'admin' $$;

create or replace function public.can_read() returns boolean
language sql stable as $$ select public.app_role() in ('admin','hr','interviewer','principal','viewer') $$;

create or replace function public.can_manage() returns boolean
language sql stable as $$ select public.app_role() in ('admin','hr') $$;

create or replace function public.can_interview() returns boolean
language sql stable as $$ select public.app_role() in ('admin','hr','interviewer') $$;

-- new sign-up → pending profile
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, phone, position_note, requested_role, requested_school_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'position_note',
    new.raw_user_meta_data->>'requested_role',
    nullif(new.raw_user_meta_data->>'requested_school_id','')::int
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- only admins may change role / status / school (even on their own row)
create or replace function public.guard_profile_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- auth.uid() is null in the Supabase SQL editor / service role → trusted
  if auth.uid() is not null and not public.is_admin() and (
       new.role is distinct from old.role or new.status is distinct from old.status
    or new.school_id is distinct from old.school_id or new.id is distinct from old.id) then
    raise exception 'Only an administrator can change roles or approval status';
  end if;
  if new.status = 'approved' and old.status is distinct from 'approved' then
    new.approved_at := now();
    new.approved_by := auth.uid();
  end if;
  -- an admin cannot remove their own admin rights (prevents locking everybody out)
  if old.id = auth.uid() and old.role = 'admin' and (new.role <> 'admin' or new.status <> 'approved') then
    raise exception 'You cannot remove your own administrator access';
  end if;
  return new;
end $$;

create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_update();

-- ---------------------------------------------------------------------
-- 3. Interview rubrics (criteria differ by job category / job title)
-- ---------------------------------------------------------------------
create table public.rubric_criteria (
  id           serial primary key,
  rubric_key   text references public.rubrics(key) on delete cascade,
  job_title_id int references public.job_titles(id) on delete cascade, -- extra criterion for one title only
  key          text not null,
  name_en      text not null,
  name_ar      text not null,
  hint_en      text,
  hint_ar      text,
  weight       numeric not null default 10 check (weight > 0),
  sort         int default 0,
  active       boolean default true,
  check (rubric_key is not null or job_title_id is not null)
);

-- ---------------------------------------------------------------------
-- 4. Candidates (one row per person) + full pipeline tracking
-- ---------------------------------------------------------------------
create table public.candidates (
  id               uuid primary key default gen_random_uuid(),
  ref_no           serial unique,
  full_name        text not null,
  gender           text check (gender in ('male','female')),
  cv_source        text check (cv_source in ('job_fair','agency','ministry','school','other')),
  cv_source_detail text,                      -- name of the fair / agency
  specialization   text,
  job_title_id     int references public.job_titles(id),
  school_id        int references public.schools(id),     -- school the candidate is assigned to
  year_id          int references public.academic_years(id), -- appointment year
  nationality      text,
  email            text,
  phone            text,
  inside_qatar     boolean,
  residence_country text,
  visa_status      text check (visa_status in ('new_visa','residency_transfer','family_residency','not_required')),
  marital_status   text check (marital_status in ('single','married','divorced','widowed')),
  sons             int not null default 0 check (sons >= 0),
  daughters        int not null default 0 check (daughters >= 0),
  total_children   int generated always as (sons + daughters) stored,
  qualification    text,
  years_experience numeric,
  current_employer text,
  cv_url           text,
  notes            text,

  -- latest interview (maintained by trigger)
  interview_result text not null default 'pending'
                   check (interview_result in ('pending','accepted','rejected','reserve')),
  last_interview_date date,
  last_score       numeric,

  -- pipeline steps
  offer_status     text check (offer_status in ('pending','accepted','declined')),
  offer_date       date,
  documents_status text check (documents_status in ('incomplete','complete')),
  documents_date   date,
  hire_status      text check (hire_status in ('in_progress','hired','not_hired')),
  hire_date        date,
  start_status     text check (start_status in ('started','not_started')),
  start_date       date,
  probation_status text check (probation_status in ('in_probation','passed','failed')),
  probation_end_date date,
  confirmed        boolean not null default false,
  confirmed_date   date,
  resigned         boolean not null default false,
  resignation_date date,
  resignation_reason text,
  withdrawn        boolean not null default false,
  withdrawn_reason text,

  stage text generated always as (
    case
      when resigned                      then 'resigned'
      when withdrawn                     then 'withdrawn'
      when probation_status = 'failed'   then 'probation_failed'
      when confirmed                     then 'confirmed'
      when probation_status = 'passed'   then 'probation_passed'
      when start_status = 'started'      then 'started'
      when hire_status = 'not_hired'     then 'not_hired'
      when hire_status = 'hired'         then 'hired'
      when offer_status = 'declined'     then 'offer_declined'
      when documents_status = 'complete' then 'documents_complete'
      when offer_status = 'accepted'     then 'offer_accepted'
      when offer_status = 'pending'      then 'offer_sent'
      when interview_result = 'accepted' then 'accepted'
      when interview_result = 'reserve'  then 'reserve'
      when interview_result = 'rejected' then 'rejected'
      else 'new'
    end) stored,

  created_at  timestamptz default now(),
  created_by  uuid default auth.uid(),
  updated_at  timestamptz default now(),
  updated_by  uuid
);

create index on public.candidates (school_id, job_title_id);
create index on public.candidates (year_id);
create index on public.candidates (stage);

-- Which stages hold a vacancy (selected / in progress / in post)
create or replace function public.stage_holds_vacancy(s text) returns boolean
language sql immutable as $$
  select s in ('accepted','offer_sent','offer_accepted','documents_complete',
               'hired','started','probation_passed','confirmed')
$$;
create or replace function public.stage_is_hired(s text) returns boolean
language sql immutable as $$ select s in ('hired','started','probation_passed','confirmed') $$;
create or replace function public.stage_is_joined(s text) returns boolean
language sql immutable as $$ select s in ('started','probation_passed','confirmed') $$;

-- principals may only touch onboarding columns of their own school's candidates
create or replace function public.guard_candidate_update() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  allowed text[] := array['documents_status','documents_date','hire_status','hire_date',
    'start_status','start_date','probation_status','probation_end_date','confirmed','confirmed_date',
    'resigned','resignation_date','resignation_reason','notes','updated_at','updated_by',
    'stage','total_children'];  -- last two are generated columns
  k text;
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  if public.app_role() = 'principal' then
    for k in select jsonb_object_keys(to_jsonb(new)) loop
      if not (k = any(allowed)) and (to_jsonb(new)->k) is distinct from (to_jsonb(old)->k) then
        raise exception 'Principals can only update onboarding steps (field: %)', k;
      end if;
    end loop;
  end if;
  return new;
end $$;

create trigger candidates_guard before update on public.candidates
  for each row execute function public.guard_candidate_update();

-- ---------------------------------------------------------------------
-- 5. Interviews
-- ---------------------------------------------------------------------
create table public.interviews (
  id              uuid primary key default gen_random_uuid(),
  candidate_id    uuid not null references public.candidates(id) on delete cascade,
  job_title_id    int references public.job_titles(id),
  school_id       int references public.schools(id),   -- school recommended by the panel
  interview_date  date not null default current_date,
  source          text check (source in ('job_fair','agency','ministry','school','other')),
  source_detail   text,                                 -- fair / agency name
  mode            text check (mode in ('in_person','remote')),
  specialization  text,                                 -- lab / specialisation interviewed for
  interviewers    text,
  rubric_key      text,
  scores          jsonb not null default '{}'::jsonb,   -- {criterion_key: 1..5}
  criteria_notes  jsonb not null default '{}'::jsonb,   -- {criterion_key: "note"}
  computed_score  numeric,                              -- weighted rubric score /100
  overall_score   numeric check (overall_score between 0 and 100), -- panel's holistic score /100
  rating text generated always as (
    case when overall_score is null then null
         when overall_score >= 90 then 'excellent'
         when overall_score >= 80 then 'very_good'
         when overall_score >= 70 then 'good'
         when overall_score >= 60 then 'average'
         else 'weak' end) stored,
  strengths       text,
  weaknesses      text,
  notes           text,
  result          text not null default 'pending'
                  check (result in ('pending','accepted','rejected','reserve')),
  created_at      timestamptz default now(),
  created_by      uuid default auth.uid(),
  updated_at      timestamptz default now()
);
create index on public.interviews (candidate_id);
create index on public.interviews (interview_date);

-- keep candidate's "latest interview" fields in sync
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

create trigger interviews_sync after insert or update or delete on public.interviews
  for each row execute function public.sync_candidate_interview();

-- ---------------------------------------------------------------------
-- 6. Audit trail: every change to a candidate's journey
-- ---------------------------------------------------------------------
create table public.candidate_events (
  id           bigserial primary key,
  candidate_id uuid references public.candidates(id) on delete cascade,
  event        text not null,      -- created | field name | interview
  old_value    text,
  new_value    text,
  created_at   timestamptz default now(),
  created_by   uuid,
  actor_name   text
);
create index on public.candidate_events (candidate_id, created_at);

create or replace function public.log_candidate_change() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  tracked text[] := array['stage','school_id','job_title_id','year_id','interview_result',
    'offer_status','documents_status','hire_status','start_status','probation_status',
    'confirmed','resigned','withdrawn','specialization'];
  k text; actor text;
begin
  select full_name into actor from public.profiles where id = auth.uid();
  if tg_op = 'INSERT' then
    insert into public.candidate_events(candidate_id, event, new_value, created_by, actor_name)
    values (new.id, 'created', new.full_name, auth.uid(), actor);
    return new;
  end if;
  foreach k in array tracked loop
    if (to_jsonb(new)->>k) is distinct from (to_jsonb(old)->>k) then
      insert into public.candidate_events(candidate_id, event, old_value, new_value, created_by, actor_name)
      values (new.id, k, to_jsonb(old)->>k, to_jsonb(new)->>k, auth.uid(), actor);
    end if;
  end loop;
  return new;
end $$;

create trigger candidates_log after insert or update on public.candidates
  for each row execute function public.log_candidate_change();

create or replace function public.log_interview() returns trigger
language plpgsql security definer set search_path = public as $$
declare actor text;
begin
  select full_name into actor from public.profiles where id = auth.uid();
  insert into public.candidate_events(candidate_id, event, new_value, created_by, actor_name)
  values (new.candidate_id, case when tg_op='INSERT' then 'interview' else 'interview_updated' end,
          concat_ws(' · ', new.interview_date::text, new.result, new.overall_score::text),
          auth.uid(), actor);
  return new;
end $$;

create trigger interviews_log after insert or update on public.interviews
  for each row execute function public.log_interview();

-- ---------------------------------------------------------------------
-- 7. Reporting views (security_invoker → respect the caller's permissions)
-- ---------------------------------------------------------------------
-- Vacancy status per school × job title (all years)
create view public.v_position_status with (security_invoker = true) as
select sp.school_id, sp.job_title_id, jt.department_id,
       sp.approved_count, sp.current_staff,
       coalesce(c.selected,0) as selected,
       coalesce(c.hired,0)    as hired,
       coalesce(c.joined,0)   as joined,
       coalesce(c.resigned,0) as resigned,
       sp.approved_count - sp.current_staff - coalesce(c.selected,0) as remaining,
       coalesce(p.planned_total,0) as planned_total
from public.school_positions sp
join public.job_titles jt on jt.id = sp.job_title_id
left join (
  select school_id, job_title_id,
         count(*) filter (where public.stage_holds_vacancy(stage)) as selected,
         count(*) filter (where public.stage_is_hired(stage))      as hired,
         count(*) filter (where public.stage_is_joined(stage))     as joined,
         count(*) filter (where stage = 'resigned')                as resigned
  from public.candidates where school_id is not null and job_title_id is not null
  group by 1,2) c on c.school_id = sp.school_id and c.job_title_id = sp.job_title_id
left join (
  select school_id, job_title_id, sum(planned_count) planned_total
  from public.hiring_plan group by 1,2) p on p.school_id = sp.school_id and p.job_title_id = sp.job_title_id;

-- Plan vs progress per school × title × year × specialisation
create view public.v_plan_status with (security_invoker = true) as
with plan as (
  select school_id, job_title_id, year_id, specialization, sum(planned_count) planned
  from public.hiring_plan group by 1,2,3,4
), prog as (
  select school_id, job_title_id, year_id, coalesce(specialization,'') specialization,
         count(*) filter (where public.stage_holds_vacancy(stage)) selected,
         count(*) filter (where public.stage_is_hired(stage))      hired,
         count(*) filter (where public.stage_is_joined(stage))     joined
  from public.candidates
  where school_id is not null and job_title_id is not null and year_id is not null
  group by 1,2,3,4
)
select coalesce(plan.school_id, prog.school_id)       school_id,
       coalesce(plan.job_title_id, prog.job_title_id) job_title_id,
       coalesce(plan.year_id, prog.year_id)           year_id,
       coalesce(plan.specialization, prog.specialization) specialization,
       coalesce(plan.planned,0)  planned,
       coalesce(prog.selected,0) selected,
       coalesce(prog.hired,0)    hired,
       coalesce(prog.joined,0)   joined,
       coalesce(plan.planned,0) - coalesce(prog.selected,0) remaining
from plan full join prog
  on plan.school_id = prog.school_id and plan.job_title_id = prog.job_title_id
 and plan.year_id = prog.year_id and plan.specialization = prog.specialization;

-- ---------------------------------------------------------------------
-- 8. Row-level security
-- ---------------------------------------------------------------------
alter table public.schools          enable row level security;
alter table public.departments      enable row level security;
alter table public.rubrics          enable row level security;
alter table public.job_titles       enable row level security;
alter table public.academic_years   enable row level security;
alter table public.school_positions enable row level security;
alter table public.school_labs      enable row level security;
alter table public.hiring_plan      enable row level security;
alter table public.profiles         enable row level security;
alter table public.rubric_criteria  enable row level security;
alter table public.candidates       enable row level security;
alter table public.interviews       enable row level security;
alter table public.candidate_events enable row level security;

-- schools & departments are readable before approval (needed on the sign-up form)
create policy "schools read"      on public.schools     for select using (true);
create policy "departments read"  on public.departments for select using (true);
create policy "schools admin"     on public.schools     for all using (public.is_admin()) with check (public.is_admin());
create policy "departments admin" on public.departments for all using (public.is_admin()) with check (public.is_admin());

-- reference tables: read for approved users, write for admin
do $$
declare t text;
begin
  foreach t in array array['rubrics','job_titles','academic_years','school_positions','school_labs','rubric_criteria'] loop
    execute format('create policy "%1$s read" on public.%1$I for select using (public.can_read())', t);
    execute format('create policy "%1$s admin" on public.%1$I for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- hiring plan: admin + HR
create policy "plan read"   on public.hiring_plan for select using (public.can_read());
create policy "plan manage" on public.hiring_plan for all using (public.can_manage()) with check (public.can_manage());

-- profiles
create policy "profile self read"  on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profile admin edit" on public.profiles for update using (public.is_admin()) with check (public.is_admin());
create policy "profile admin del"  on public.profiles for delete using (public.is_admin() and id <> auth.uid());

-- candidates
create policy "cand read" on public.candidates for select using (
  public.app_role() in ('admin','hr','interviewer','viewer')
  or (public.app_role() = 'principal' and school_id = public.app_school()));
create policy "cand insert" on public.candidates for insert with check (public.can_interview());
create policy "cand update" on public.candidates for update using (
  public.can_manage()
  or (public.app_role() = 'interviewer' and created_by = auth.uid())
  or (public.app_role() = 'principal' and school_id = public.app_school()))
  with check (
  public.can_manage()
  or (public.app_role() = 'interviewer' and created_by = auth.uid())
  or (public.app_role() = 'principal' and school_id = public.app_school()));
create policy "cand delete" on public.candidates for delete using (public.is_admin());

-- interviews
create policy "int read" on public.interviews for select using (
  public.app_role() in ('admin','hr','interviewer','viewer')
  or (public.app_role() = 'principal' and exists (
      select 1 from public.candidates c where c.id = candidate_id and c.school_id = public.app_school())));
create policy "int insert" on public.interviews for insert with check (public.can_interview());
create policy "int update" on public.interviews for update
  using (public.can_manage() or (public.app_role() = 'interviewer' and created_by = auth.uid()))
  with check (public.can_manage() or (public.app_role() = 'interviewer' and created_by = auth.uid()));
create policy "int delete" on public.interviews for delete
  using (public.can_manage() or (public.app_role() = 'interviewer' and created_by = auth.uid()));

-- audit trail: read like candidates; written only by triggers
create policy "events read" on public.candidate_events for select using (
  public.app_role() in ('admin','hr','interviewer','viewer')
  or (public.app_role() = 'principal' and exists (
      select 1 from public.candidates c where c.id = candidate_id and c.school_id = public.app_school())));

-- table privileges for the API roles (RLS above does the real filtering)
grant usage on schema public to anon, authenticated;
grant select on public.schools, public.departments to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on all functions in schema public to authenticated;
