# QSTSS Recruitment & Staffing System
### نظام التوظيف والهيكل الوظيفي – مدارس قطر للعلوم والتكنولوجيا

A bilingual (English / العربية) web system for tracking recruitment across the five QSTSS schools: the approved structure and vacancies, a multi-year hiring plan, an interview database with role-specific evaluation criteria, the full employment journey of each candidate (interview → offer → appointment documents → appointment → start → probation → confirmation / resignation), and reports by school, job title, nationality, source and more.

- **Front end:** static site (HTML + JavaScript), hosted free on **GitHub Pages**
- **Back end:** **Supabase** (PostgreSQL + login), free tier is enough
- **Permissions:** every user registers, then the administrator approves them and assigns a role; the database itself enforces the permissions (row-level security), not just the screens.

---

## العربية – خطوات التشغيل

### 1) إنشاء قاعدة البيانات (Supabase)
1. أنشئ حساباً على https://supabase.com ثم **New project** (احفظ كلمة مرور قاعدة البيانات).
2. من القائمة الجانبية افتح **SQL Editor** → **New query**:
   - انسخ محتوى الملف `supabase/01_schema.sql` والصقه ثم اضغط **Run**.
   - ثم انسخ محتوى `supabase/02_seed.sql` (المدارس الخمس، الأقسام، 43 مسمى وظيفياً، الأعداد المعتمدة، موظفو 2026/2027، المختبرات، خطة 2027/2028، بنود التقييم) واضغط **Run**.
3. من **Authentication → Sign In / Providers → Email**:
   - يُنصح بإيقاف **Confirm email** لأن اعتماد المسؤول هو بوابة الدخول، ولأن البريد المدمج في Supabase محدود بعدد قليل من الرسائل في الساعة. (إن أردت إبقاءه فاربط خادم بريد SMTP خاص بكم من **Authentication → Emails → SMTP**).
4. من زر **Connect** أعلى المشروع (أو **Settings → API Keys**) انسخ: **Project URL** و **Publishable key** (يبدأ بـ `sb_publishable_`). لا تستخدم المفتاح السري (secret).

   - ثم `supabase/03_interview_lab.sql` (حفظ المختبر في كل مقابلة)، ثم `supabase/04_lab_breakdown.sql` (العدد المطلوب لكل مختبر)، وأخيراً `supabase/05_interview_panel.sql` (أعضاء لجنة المقابلة ومسمياتهم).

### 2) ربط الواجهة
افتح الملف `assets/js/config.js` وضع القيمتين:
```js
export const SUPABASE_URL = 'https://xxxx.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_...';
```
المفتاح العام (publishable) مصمم ليكون علنياً؛ الحماية الحقيقية في قواعد الصلاحيات داخل قاعدة البيانات.

### 3) الرفع على GitHub
1. أنشئ مستودعاً جديداً (مثلاً `qstss-recruitment`) وارفع جميع الملفات.
2. **Settings → Pages → Build and deployment → Deploy from a branch** → اختر `main` والمجلد `/ (root)` ثم **Save**.
3. بعد دقيقة يظهر الرابط مثل `https://ranialtoum.github.io/qstss-recruitment/`.
4. ارجع إلى Supabase: **Authentication → URL Configuration** وضع الرابط في **Site URL** و **Redirect URLs** (لازم لاستعادة كلمة المرور).
5. (اختياري) نطاق خاص مثل `recruitment.qstssboys.qa` من **Settings → Pages → Custom domain**.

> ملاحظة: GitHub Pages مجاني للمستودعات العامة. المستودع العام لا يحتوي أي بيانات للمرشحين — البيانات كلها في Supabase ومحمية بتسجيل الدخول. ملف الإكسل مستثنى من الرفع عبر `.gitignore`.

### 4) أول مسؤول
1. افتح الموقع واضغط **Create account** وسجل حسابك.
2. في Supabase → SQL Editor نفّذ (مع بريدك):
```sql
update public.profiles set role = 'admin', status = 'approved' where email = 'your.email@example.com';
```
3. حدّث الصفحة. من الآن تعتمد بقية المستخدمين من صفحة **Users** داخل النظام.

### الصلاحيات
| الصلاحية | ما يستطيع |
|---|---|
| مسؤول النظام | كل شيء: اعتماد المستخدمين، تعديل الشواغر وخطة التعيين، الإعدادات وبنود التقييم |
| الموارد البشرية / التوظيف | المرشحون، المقابلات، كل مراحل التوظيف (يطّلع على الشواغر والخطة دون تعديل) |
| عضو لجنة مقابلات | تسجيل المقابلات والمرشحين، وتعديل مقابلاته فقط |
| مدير مدرسة | يرى مرشحي مدرسته فقط، ويحدّث مراحل ما بعد العرض (المسوغات، التعيين، المباشرة، التجربة، التثبيت، الاستقالة) |
| مُطّلع | قراءة فقط: اللوحات والتقارير |

### كيف تُحسب الشواغر
- **المتبقي = المعتمد − موظفو 2026/2027 − المرشحون المختارون**
- "المختار" هو كل مرشح مُسند لمدرسة ومسمى ومرحلته بين *مقبول في المقابلة* و *تم التثبيت*.
- إذا رفض العرض أو لم يُعيَّن أو لم يجتز التجربة أو **استقال** يعود الشاغر مفتوحاً تلقائياً.
- **خطة التعيين**: عدد المراد تعيينهم لكل مسمى في كل سنة (2027/2028 فما بعد)، ويمكن تفصيله حسب التخصص. "غير مخطط بعد" = (المعتمد − الموظفون) − مجموع الخطة.
- **التقييم**: لكل بند درجة من 1 إلى 5 بوزن نسبي، تعطي "درجة البنود" من 100، ثم تضع اللجنة **التقييم الحكمي من 100** (يقترح النظام درجة البنود ويمكن تعديله) ويتحول إلى: ممتاز ≥90، جيد جداً 80–89، جيد 70–79، متوسط 60–69، ضعيف أقل من 60.

### ملاحظات على البيانات المستوردة من الإكسل
- **مهندس / معلم المختبرات التخصصية**: في أوراق الصخامة وروضة الحمامة والريان كان العدد المعتمد صفراً لأن ورقة المختبرات لم تُستكمل، فاعتمدتُ العدد المرجعي من الهيكل التنظيمي في ورقة المختبرات (8، 13، 14، 14، 10). لذلك إجمالي المعتمد **652** بدل 611، والخطة الأولية لعام 2027/2028 = **446** شاغراً. يمكن تعديل أي رقم من صفحة **Vacancies → Edit**.
- **مسؤول أنشطة – روضة الحمامة**: المعتمد 1 والموظفون 2 (زيادة 1) وتظهر في النظام بعلامة "زيادة".
- لإعادة توليد بيانات البداية من نسخة إكسل محدثة: `python tools/build_seed.py ملف.xlsx > supabase/02_seed.sql` (قبل إدخال أي بيانات فعلية).

---

## English – setup

1. **Supabase**: create a project → SQL Editor → run `supabase/01_schema.sql`, then `supabase/02_seed.sql`, then `supabase/03_interview_lab.sql` `supabase/04_lab_breakdown.sql`, `supabase/05_interview_panel.sql`, `supabase/06_lab_plan_details_only.sql` and `supabase/07_admin_only_plan.sql`. In *Authentication → Providers → Email* consider turning **Confirm email** off (admin approval already gates access, and Supabase's built-in mailer is heavily rate-limited) or configure your own SMTP.
2. **Connect**: put the *Project URL* and the *publishable key* (`sb_publishable_…`, from the project's **Connect** dialog or Settings → API Keys) in `assets/js/config.js`.
3. **GitHub Pages**: push the repo, *Settings → Pages → Deploy from a branch → main / root*. Add the site URL to Supabase *Authentication → URL Configuration* (Site URL + Redirect URLs).
4. **First admin**: register in the app, then run in the SQL editor
   `update public.profiles set role='admin', status='approved' where email='you@example.com';`
   Approve everyone else from the **Users** page.

### What's in the box
| Page | Purpose |
|---|---|
| Dashboard | Approved / staff / selected / hired / joined / remaining, year overview, by school & department, plan vs selected per year, pipeline, CV sources, rating distribution, largest shortages |
| Vacancies | Org structure per school; Specialised Labs Engineer / Teacher broken down lab by lab (needed, staff, selected, remaining) with the title total = sum of labs; (grouped by department) or all-schools matrix; remaining and vacancy status per title; admin edits approved & current counts |
| Hiring plan | Planned hires per title per year (2027/2028 →), optional split by specialisation (lab names suggested for lab roles), unplanned gap |
| Candidates | Search & filter; full candidate file (personal, residence & visa, children, CV source, placement with live remaining-vacancy) |
| Candidate page | Profile, remaining vacancy, the 8-step employment journey, interviews, full audit history |
| Interviews | New interview for an existing or new candidate; criteria change with the job title (leadership, coordinators, teachers, lab engineers, lab technicians, student services, admin & support); 1–5 per criterion + notes, rubric score, holistic score /100 with colour-coded rating, decision, assign to school/year; printable |
| Reports | Cross-tab any two dimensions (school, title, department, nationality, source, stage, rating, visa, inside/outside Qatar, gender, marital status, year…), interview reports, and a full vacancies workbook — all export to Excel |
| Users | Approve / reject sign-ups, assign role and school, disable accounts |
| Settings | Academic years, interview criteria & weights (per rubric or per job title), job titles, specialised labs |

### Project layout
```
index.html                 app shell
assets/js/config.js        ← your Supabase URL + anon key
assets/js/i18n.js          all English / Arabic text
assets/js/views/*.js       one file per page
assets/vendor/             supabase-js 2, Chart.js 4, SheetJS (bundled, no CDN needed)
supabase/01_schema.sql     tables, triggers, views, row-level security
supabase/02_seed.sql       data generated from the staffing workbook
supabase/03_interview_lab.sql  update: lab / specialisation stored on each interview
supabase/04_lab_breakdown.sql  update: needed number & staff per specialised lab
supabase/05_interview_panel.sql update: interview panel members with job titles
supabase/06_lab_plan_details_only.sql update: lab roles planned per lab only (old unspecified numbers backed up)
supabase/07_admin_only_plan.sql update: only administrators change the hiring plan
tools/build_seed.py        regenerates 02_seed.sql from an updated workbook
tests/                     local PostgreSQL permission tests + browser end-to-end test
```

### Notes
- Candidate personal data lives in your Supabase project; check it against MOEHE data-hosting guidance before loading real records. Supabase lets you choose the project region when you create it.
- Backups: Supabase *Database → Backups* (daily on paid plans); on the free tier export regularly from Reports → Excel or `pg_dump`.
- Testing: `tests/rls_test.sql` exercises every role against a local PostgreSQL with a mock `auth` schema (`tests/mock_supabase.sql`); `tests/server.mjs` + `tests/e2e.py` drive the real UI through Playwright.
