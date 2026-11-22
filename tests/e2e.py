import subprocess, sys, time
from playwright.sync_api import sync_playwright
BASE='http://localhost:8787/'
errors=[]
def psql(sql): subprocess.run(['psql','-h','/tmp/pg','-p','5433','-U','postgres','-d','e2e','-q','-c',sql],check=True)
def watch(page,tag):
    page.on('pageerror', lambda e: errors.append(f'[{tag}] pageerror {e}'))
    page.on('console', lambda m: errors.append(f'[{tag}] console {m.text}') if m.type=='error' and 'fonts.g' not in m.text and 'ERR_' not in m.text else None)
def shot(page,name): page.wait_for_timeout(400); page.screenshot(path=f'/tmp/shots/{name}.png', full_page=True)
def toasts(page): return page.eval_on_selector_all('.toast', 'els=>els.map(e=>e.textContent)')

with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    # ---- admin registers
    ctx=b.new_context(viewport={'width':1400,'height':900}); page=ctx.new_page(); watch(page,'admin')
    page.goto(BASE); page.wait_for_selector('form')
    shot(page,'01_login')
    page.click('#sw'); page.wait_for_selector('[name=full_name]')
    page.fill('[name=full_name]','Dr. Rani Altoum'); page.fill('[name=email]','rani@qstss.qa'); page.fill('[name=password]','password123')
    page.fill('[name=position_note]','Academic Director')
    shot(page,'02_register'); page.click('button.primary'); page.wait_for_selector('.pending')
    shot(page,'03_pending')
    psql("update profiles set role='admin', status='approved' where email='rani@qstss.qa'")
    page.click('#r'); page.wait_for_selector('.kpis'); page.wait_for_timeout(800)
    shot(page,'04_dashboard')
    # ---- interviewer registers in another context
    c2=b.new_context(); p2=c2.new_page(); watch(p2,'int')
    p2.goto(BASE); p2.click('#sw'); p2.fill('[name=full_name]','Sara Interviewer'); p2.fill('[name=email]','sara@qstss.qa'); p2.fill('[name=password]','password123')
    p2.select_option('[name=requested_role]','interviewer'); p2.click('button.primary'); p2.wait_for_selector('.pending')
    # ---- admin approves via Users page
    page.goto(BASE+'#/users'); page.wait_for_selector('[data-approve]'); shot(page,'05_users_pending')
    page.click('[data-approve]'); page.wait_for_timeout(800); print('users toasts', toasts(page))
    # ---- vacancies / plan
    page.goto(BASE+'#/structure'); page.wait_for_selector('table'); shot(page,'06_structure_all')
    page.click('#tabs button[data-s="2"]'); page.wait_for_timeout(300); shot(page,'07_structure_school2')
    page.goto(BASE+'#/plan?school=1'); page.wait_for_selector('table'); shot(page,'08_plan_school1')
    # edit plan for 2028/2029 AP Physics at school 1
    inp=page.locator('input.yv[data-tid="33"][data-y="3"]'); inp.fill('2'); inp.dispatch_event('input'); page.click('#saveall'); page.wait_for_timeout(1200)
    print('plan toast', toasts(page))
    # ---- new interview with new candidate
    page.goto(BASE+'#/interview/new'); page.wait_for_selector('#crit')
    page.check('[name=_cm][value=new]'); page.wait_for_selector('#newc [name=full_name]')
    page.fill('#newc [name=full_name]','Ahmad Khalil'); page.select_option('#newc [name=gender]','male'); page.fill('#newc [name=nationality]','Jordanian')
    page.fill('#newc [name=email]','ahmad@example.com'); page.fill('#newc [name=phone]','+974 5555 1234')
    page.select_option('#newc [name=inside_qatar]','true'); page.select_option('#newc [name=visa_status]','residency_transfer')
    page.fill('#newc [name=specialization]','Physics'); page.select_option('#newc [name=cv_source]','school')
    page.select_option('#det [name=job_title_id]','33'); page.wait_for_timeout(200)
    page.select_option('#det [name=mode]','in_person'); page.select_option('#det [name=school_id]','1')
    for i,n in enumerate([5,4,5,4,4,4,5,4]):
        page.locator('.crit').nth(i).locator(f'[data-n="{n}"]').click()
    print('computed', page.inner_text('#comp'), 'overall', page.input_value('#ov'))
    page.fill('[name=strengths]','Strong AP Physics content; uses inquiry labs.')
    page.check('[name=result][value=accepted]')
    shot(page,'09_interview_form')
    page.click('#save'); page.wait_for_url('**/#/candidate/*'); page.wait_for_selector('#steps'); page.wait_for_timeout(600)
    shot(page,'10_candidate_after_interview')
    # ---- pipeline
    for key,field,val in [('offer','offer_status','accepted'),('documents','documents_status','complete'),('hire','hire_status','hired'),('start','start_status','started')]:
        page.click(f'[data-open="{key}"]'); page.select_option(f'[data-form="{key}"] [name={field}]', val); page.click(f'[data-save="{key}"]')
        page.wait_for_timeout(900)
    shot(page,'11_candidate_pipeline')
    print('stage badge:', page.inner_text('.page-head .badge'))
    # ---- second candidate via candidate form, then interviewer records an interview
    page.goto(BASE+'#/candidates'); page.wait_for_selector('#add'); page.click('#add'); page.wait_for_selector('.modal [name=full_name]')
    page.fill('.modal [name=full_name]','Mariam Hassan'); page.select_option('.modal [name=gender]','female'); page.fill('.modal [name=nationality]','Egyptian')
    page.select_option('.modal [name=job_title_id]','41'); page.select_option('.modal [name=school_id]','2'); page.wait_for_timeout(500)
    page.fill('.modal [name=sons]','1'); page.fill('.modal [name=daughters]','2')
    shot(page,'12_candidate_form'); page.click('.modal [data-save]'); page.wait_for_url('**/#/candidate/*'); page.wait_for_timeout(500)
    page.goto(BASE+'#/candidates'); page.wait_for_selector('table'); shot(page,'13_candidates_list')
    # interviewer
    p2.reload(); p2.wait_for_selector('.kpis'); p2.goto(BASE+'#/interview/new'); p2.wait_for_selector('#cand #q')
    p2.fill('#q','Mari'); p2.wait_for_selector('.suggest [data-id]'); p2.click('.suggest [data-id]')
    p2.wait_for_timeout(300)
    p2.select_option('#lab','Robotics')
    p2.locator('.crit').nth(0).locator('[data-n="3"]').click(); p2.locator('.crit').nth(1).locator('[data-n="3"]').click()
    p2.fill('#ov','64'); p2.dispatch_event('#ov','input'); p2.check('[name=result][value=reserve]'); p2.click('#save')
    p2.wait_for_url('**/#/candidate/*'); p2.wait_for_timeout(600); shot(p2,'14_interviewer_candidate')
    print('interviewer toasts', toasts(p2))
    # ---- reports, interviews, settings
    page.goto(BASE+'#/interviews'); page.wait_for_selector('table'); shot(page,'15_interviews')
    page.goto(BASE+'#/reports'); page.wait_for_selector('#out table'); shot(page,'16_reports')
    page.click('#tabs button[data-t="vacancies"]'); page.wait_for_timeout(300); shot(page,'17_reports_vac')
    page.goto(BASE+'#/settings'); page.wait_for_selector('table'); page.click('#tabs button[data-t="rubrics"]'); page.wait_for_timeout(300); shot(page,'18_settings_rubrics')
    page.goto(BASE+'#/dashboard'); page.wait_for_selector('.kpis'); page.wait_for_timeout(800); shot(page,'19_dashboard_after')
    # ---- Arabic
    page.click('#lang'); page.wait_for_selector('.kpis'); page.wait_for_timeout(800); shot(page,'20_dashboard_ar')
    page.goto(BASE+'#/interview/new'); page.wait_for_selector('#crit'); page.select_option('#det [name=job_title_id]','41'); page.wait_for_timeout(300); shot(page,'21_interview_ar_lab')
    page.goto(BASE+'#/structure?school=1'); page.wait_for_selector('table'); shot(page,'22_structure_ar')
    # mobile
    m=b.new_context(viewport={'width':390,'height':844}); mp=m.new_page(); watch(mp,'mobile'); mp.goto(BASE); mp.wait_for_selector('form'); shot(mp,'23_mobile_login')
    b.close()
print('\n'.join(errors) if errors else 'NO CONSOLE ERRORS')

# ---- principal of school 1 (separate run)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    c=b.new_context(viewport={'width':1300,'height':900}); pg=c.new_page(); watch(pg,'principal')
    pg.goto(BASE); pg.click('#sw'); pg.fill('[name=full_name]','Principal UAS'); pg.fill('[name=email]','pr@qstss.qa'); pg.fill('[name=password]','password123')
    pg.select_option('[name=requested_role]','principal'); pg.select_option('[name=requested_school_id]','1'); pg.click('button.primary'); pg.wait_for_selector('.pending')
    psql("update profiles set role='principal', status='approved', school_id=1 where email='pr@qstss.qa'")
    pg.click('#r'); pg.wait_for_selector('.kpis'); pg.wait_for_timeout(600); shot(pg,'30_principal_dash')
    pg.goto(BASE+'#/candidates'); pg.wait_for_selector('#list'); pg.wait_for_timeout(300)
    names=pg.eval_on_selector_all('#list tbody tr td:nth-child(2) b','els=>els.map(e=>e.textContent)'); print('principal sees', names)
    pg.click('#list tbody tr'); pg.wait_for_selector('#steps')
    pg.click('[data-open="probation"]'); pg.select_option('[data-form="probation"] [name=probation_status]','passed'); pg.click('[data-save="probation"]'); pg.wait_for_timeout(800)
    print('principal stage:', pg.inner_text('.page-head .badge')); print('principal can see offer update btn:', pg.locator('[data-open="offer"]').count())
    shot(pg,'31_principal_candidate')
    b.close()
print('\n'.join(errors) if errors else 'NO CONSOLE ERRORS (after principal)')
