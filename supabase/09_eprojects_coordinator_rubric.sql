-- =====================================================================
-- Update 09 (Nov 2026): dedicated interview rubric for the
-- E-Projects Coordinator (منسق المشاريع الإلكترونية), taken from the
-- "QSTSS Project Coordinator Interview Form". 7 items, weights total 100.
-- Each hint holds the interview question / task and the assessment indicators.
-- Run in Supabase → SQL Editor. Safe to run again (replaces this rubric's items).
-- =====================================================================
insert into public.rubrics (key, name_en, name_ar, sort)
values ('eprojects_coordinator', 'E-Projects Coordinator', 'منسق المشاريع الإلكترونية', 8)
on conflict (key) do update set name_en = excluded.name_en, name_ar = excluded.name_ar;

delete from public.rubric_criteria where rubric_key = 'eprojects_coordinator';

insert into public.rubric_criteria (rubric_key, key, name_en, name_ar, hint_en, hint_ar, weight, sort) values
('eprojects_coordinator', 'programming',
 'Experience in programming languages & app development',
 'الخبرة في لغات البرمجة وتطوير التطبيقات',
 $$Question: Show an application or digital tool you developed or contributed to. What was your role? Which programming languages and tools did you use? How did you test it?
Indicators: clarity of his/her personal contribution, suitability of the technical choices, and ability to explain how the app works and how it was verified.$$,
 $$السؤال: اعرض تطبيقًا أو أداة رقمية طوّرتها أو ساهمت في تطويرها. ما دورك؟ وما لغات البرمجة والأدوات التي استخدمتها؟ كيف اختبرت عمل التطبيق؟
المؤشرات: وضوح مساهمته الشخصية، ملاءمة اختياراته التقنية، وقدرته على شرح آلية عمل التطبيق وكيفية التحقق منها.$$,
 20, 1),
('eprojects_coordinator', 'ai',
 'Use of artificial intelligence',
 'توظيف الذكاء الاصطناعي',
 $$Question: How would you use AI to draft a weekly brief from project reports? Explain your steps, how you review the output and how you protect sensitive data.
Indicators: suitability of the tool and prompts for the task, checking outputs against the sources, and protecting data before entering it.$$,
 $$السؤال: كيف تستخدم الذكاء الاصطناعي لإعداد مسودة موجز أسبوعي من تقارير المشاريع؟ وضّح خطواتك وكيف تراجع المخرجات وتحمي البيانات الحساسة.
المؤشرات: ملاءمة الأداة والموجهات للمهمة، التحقق من المخرجات بالرجوع إلى المصادر، وحماية البيانات قبل إدخالها.$$,
 20, 2),
('eprojects_coordinator', 'ux_design',
 'App interface design & user experience (practical task)',
 'تصميم واجهات التطبيقات وتجربة المستخدم (مهمة تطبيقية)',
 $$Task: Sketch a simple screen where a staff member submits a request and follows its status. Explain how they move between the steps and how you would check it is easy to use.
Indicators: clear ordering of information, easy navigation and task completion, and using users' experience to improve the design.$$,
 $$المهمة: ارسم مخططًا مبسطًا لشاشة يرفع الموظف من خلالها طلبًا ويتابع حالته. اشرح كيف سيتنقل بين الخطوات وكيف ستتحقق من سهولة استخدامها.
المؤشرات: وضوح ترتيب المعلومات، سهولة التنقل وإتمام المهمة، والاستفادة من تجربة المستخدمين في تحسين التصميم.$$,
 15, 3),
('eprojects_coordinator', 'project_planning',
 'Planning & following up digital projects (practical task)',
 'تخطيط المشاريع الرقمية ومتابعة تنفيذها (مهمة تطبيقية)',
 $$Task: You must coordinate the launch of an internal app within four weeks. How do you assign responsibilities and follow up implementation? What do you do if a key task is delivered late?
Indicators: setting priorities, responsibilities and deadlines; tracking progress against the plan; and handling the impact of delays on the delivery date.$$,
 $$المهمة: طُلب منك تنسيق إطلاق تطبيق داخلي خلال أربعة أسابيع. كيف توزّع المسؤوليات وتتابع التنفيذ؟ ماذا تفعل إذا تأخر تسليم مهمة رئيسية؟
المؤشرات: تحديد الأولويات والمسؤوليات والمواعيد، متابعة الإنجاز وفق الخطة، ومعالجة أثر التأخير على موعد التسليم.$$,
 15, 4),
('eprojects_coordinator', 'training_support',
 'Staff training & technical support (practical task)',
 'تدريب الموظفين وتقديم الدعم الفني (مهمة تطبيقية)',
 $$Task: Explain to a new staff member how to submit and track a request, then ask them to apply the steps. If they report they cannot attach a file, how do you diagnose and follow up the problem?
Indicators: simplifying the explanation, checking the staff member can do it, and diagnosing, documenting and following the problem until it is solved.$$,
 $$المهمة: اشرح لموظف جديد كيفية رفع طلب ومتابعته، ثم اطلب منه تطبيق الخطوات. إذا أفاد بأنه لا يستطيع إرفاق ملف، كيف تشخّص المشكلة وتتابعها؟
المؤشرات: تبسيط الشرح، التحقق من قدرة الموظف على التنفيذ، وتشخيص المشكلة وتوثيقها ومتابعتها حتى الحل.$$,
 10, 5),
('eprojects_coordinator', 'english',
 'Professional English proficiency (practical task)',
 'الكفاءة في اللغة الإنجليزية المهنية (مهمة تطبيقية)',
 $$Task: The candidate reads the report below, answers the panel's question orally in English, then writes a professional 3–4 sentence reply to the staff member in English.
Staff report: "I can sign in to the request portal, but the page freezes when I upload a file. I need to submit my request by noon."
Ask aloud: "What would you ask the staff member first, and how would you explain the next step?"
Indicators: understanding the report and the oral question, clarity of oral expression, coherence of the written reply, and accuracy of language and terminology (score the language performance).$$,
 $$المهمة: يقرأ المرشح البلاغ التالي، ثم يستمع إلى سؤال اللجنة ويجيب عنه شفهيًا بالإنجليزية، ثم يكتب ردًا مهنيًا للموظف من ثلاث إلى أربع جمل بالإنجليزية.
البلاغ:
I can sign in to the request portal, but the page freezes when I upload a file. I need to submit my request by noon.
السؤال الشفهي:
What would you ask the staff member first, and how would you explain the next step?
المؤشرات: فهم البلاغ والسؤال الشفهي، وضوح التعبير الشفهي، وترابط الرد المكتوب ودقة اللغة والمصطلحات (تُقدّر الإجابة من حيث الأداء اللغوي).$$,
 10, 6),
('eprojects_coordinator', 'creativity',
 'Creativity in digital solutions',
 'الإبداع في ابتكار الحلول الرقمية',
 $$Task: Staff requests arrive through several channels and it is hard to know which were handled. Propose two digital ideas, choose one, and explain what it adds and how you will measure its impact.
Indicators: variety of ideas, fit of the chosen idea to the constraints, and the value it adds with a clear measure of impact.$$,
 $$المهمة: تتكرر طلبات الموظفين عبر قنوات متعددة ويصعب معرفة ما عولج منها. اقترح فكرتين رقميتين، واختر إحداهما وبيّن ما تضيفه وكيف ستقيس أثرها.
المؤشرات: تنوع الأفكار، ملاءمة الفكرة المختارة للقيود، والقيمة التي تضيفها مع مؤشر واضح لقياس أثرها.$$,
 10, 7);

-- use it for the E-Projects Coordinator
update public.job_titles set rubric_key = 'eprojects_coordinator'
where name_ar = 'منسق المشاريع الإلكترونية';

select j.name_en as job_title, j.rubric_key, count(c.id) as items, sum(c.weight) as total_weight
from public.job_titles j join public.rubric_criteria c on c.rubric_key = j.rubric_key
where j.name_ar = 'منسق المشاريع الإلكترونية' group by j.name_en, j.rubric_key;
