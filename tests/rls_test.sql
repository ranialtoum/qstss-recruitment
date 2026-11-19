\set ON_ERROR_STOP 0
-- create users through auth.users (trigger creates pending profiles)
insert into auth.users (id,email,raw_user_meta_data) values
 ('00000000-0000-0000-0000-00000000000a','admin@x.qa','{"full_name":"Admin"}'),
 ('00000000-0000-0000-0000-00000000000b','hr@x.qa','{"full_name":"HR Officer","requested_role":"hr"}'),
 ('00000000-0000-0000-0000-00000000000c','int@x.qa','{"full_name":"Interviewer"}'),
 ('00000000-0000-0000-0000-00000000000d','pr@x.qa','{"full_name":"Principal","requested_school_id":"1"}'),
 ('00000000-0000-0000-0000-00000000000e','pend@x.qa','{"full_name":"Pending"}');
select email, role, status, requested_school_id from profiles order by email;
-- bootstrap first admin (as postgres, like the SQL editor)
update profiles set role='admin', status='approved' where email='admin@x.qa';

create or replace function pg_temp.as_user(u text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claims', json_build_object('sub',u,'role','authenticated')::text, false); end $$;

set role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
\echo '--- admin approves users'
update profiles set role='hr', status='approved' where email='hr@x.qa';
update profiles set role='interviewer', status='approved' where email='int@x.qa';
update profiles set role='principal', status='approved', school_id=1 where email='pr@x.qa';
select email, role, status, approved_by is not null as by from profiles order by email;
\echo '--- admin cannot demote self (expect error)'
update profiles set role='viewer' where email='admin@x.qa';

\echo '--- pending user sees nothing'
select pg_temp.as_user('00000000-0000-0000-0000-00000000000e');
select (select count(*) from job_titles) titles, (select count(*) from schools) schools, (select count(*) from profiles) own_profile;
\echo '--- pending user cannot self-approve (expect 0 rows / error)'
update profiles set role='admin', status='approved' where email='pend@x.qa';
select role, status from profiles;

\echo '--- interviewer creates candidate + interview'
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
insert into candidates (full_name, job_title_id, school_id, year_id, nationality, sons, daughters, cv_source)
  values ('Ahmad Test', (select id from job_titles where name_en='AP Physics Teacher'), 1, 2, 'Jordanian', 2, 1, 'job_fair');
insert into interviews (candidate_id, job_title_id, source, rubric_key, scores, computed_score, overall_score, result)
  select id, job_title_id, 'school', 'teacher', '{"subject":5}', 88, 86, 'accepted' from candidates where full_name='Ahmad Test';
select full_name, total_children, interview_result, last_score, stage from candidates;
select rating from interviews;
\echo '--- interviewer cannot change approved structure (expect 0 rows updated)'
update school_positions set approved_count=99 where id=1;

\echo '--- HR moves the candidate through the pipeline'
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
update candidates set offer_status='accepted', offer_date=current_date where full_name='Ahmad Test';
update candidates set documents_status='complete' where full_name='Ahmad Test';
update candidates set hire_status='hired' where full_name='Ahmad Test';
select stage from candidates;
select approved_count, current_staff, selected, hired, joined, remaining from v_position_status
 where school_id=1 and job_title_id=(select id from job_titles where name_en='AP Physics Teacher');
select planned, selected, remaining from v_plan_status
 where school_id=1 and year_id=2 and job_title_id=(select id from job_titles where name_en='AP Physics Teacher');

\echo '--- principal of school 1: can see + update onboarding; cannot change school (expect error)'
select pg_temp.as_user('00000000-0000-0000-0000-00000000000d');
select count(*) visible from candidates;
update candidates set start_status='started', start_date=current_date where full_name='Ahmad Test';
update candidates set school_id=2 where full_name='Ahmad Test';
select stage from candidates;
\echo '--- principal resigns the employee -> vacancy reopens'
update candidates set resigned=true, resignation_date=current_date where full_name='Ahmad Test';
select selected, remaining from v_position_status
 where school_id=1 and job_title_id=(select id from job_titles where name_en='AP Physics Teacher');
\echo '--- audit trail'
select event, old_value, new_value, actor_name from candidate_events order by id;

\echo '--- principal of school 1 cannot see a school-2 candidate'
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
insert into candidates (full_name, school_id) values ('Other School', 2);
select pg_temp.as_user('00000000-0000-0000-0000-00000000000d');
select full_name from candidates order by 1;
\echo '--- anon can read schools only'
reset role; set role anon; select pg_temp.as_user('');
select count(*) schools from schools;
select count(*) from candidates;
