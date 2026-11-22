// English / Arabic interface text. Add a key in both languages.
export const DICT = {
  en: {
    app_name: 'Recruitment & Staffing', app_full: 'Recruitment & Staffing System', org_name: 'Qatar Science & Technology Schools',
    lang_toggle: 'العربية', loading: 'Loading…', save: 'Save', saved: 'Saved', cancel: 'Cancel',
    edit: 'Edit', delete: 'Delete', add: 'Add', close: 'Close', search: 'Search', all: 'All', none: '—',
    yes: 'Yes', no: 'No', export_excel: 'Export to Excel', print: 'Print', filters: 'Filters', clear: 'Clear',
    confirm_delete: 'Delete this record? This cannot be undone.', error: 'Error', total: 'Total',
    actions: 'Actions', details: 'Details', back: 'Back', open: 'Open', required: 'Required field',
    not_configured: 'The system is not connected to a database yet. Edit assets/js/config.js (see README).',

    // auth
    sign_in: 'Sign in', sign_out: 'Sign out', register: 'Create account', email: 'Email', password: 'Password',
    full_name: 'Full name', phone: 'Phone', forgot: 'Forgot password?', send_reset: 'Send reset link',
    reset_sent: 'If the email exists, a reset link has been sent.', have_account: 'Already have an account?',
    no_account: 'New user?', requested_role: 'Requested role', requested_school: 'School (if applicable)',
    position_note: 'Your position / reason for access', register_done: 'Account created. If email confirmation is enabled, confirm your email, then sign in. An administrator must approve your access.',
    pending_title: 'Awaiting approval', pending_text: 'Your account has been created and is waiting for an administrator to approve it and assign your permissions.',
    rejected_text: 'Your access request was not approved or has been disabled. Contact the administrator.',
    refresh: 'Refresh', new_password: 'New password', set_password: 'Set new password', password_updated: 'Password updated',
    pw_min: 'At least 8 characters',

    // nav
    nav_dashboard: 'Dashboard', nav_structure: 'Vacancies', nav_plan: 'Hiring plan', nav_candidates: 'Candidates',
    nav_interviews: 'Interviews', nav_new_interview: 'New interview', nav_reports: 'Reports', nav_users: 'Users',
    nav_settings: 'Settings',

    // generic fields
    school: 'School', schools: 'Schools', department: 'Department', job_title: 'Job title', specialization: 'Specialisation',
    year: 'Academic year', nationality: 'Nationality', notes: 'Notes', status: 'Status', date: 'Date', role: 'Role',
    all_schools: 'All schools', all_years: 'All years', reports_to: 'Reports to', category: 'Category',

    // structure / vacancies
    approved: 'Approved', current_staff: 'Staff 2026/27', selected: 'Selected', hired: 'Hired', joined: 'Joined',
    remaining: 'Remaining', planned: 'Planned', occupancy: 'Occupancy', fill_progress: 'Plan progress',
    vac_filled: 'Filled', vac_open: 'Open', vac_over: 'Over', vacancy_status: 'Vacancy status',
    remaining_for_title: 'Remaining vacancies for this title at the school', unplanned: 'Unplanned',
    structure_hint: 'Remaining = Approved − Staff 2026/27 − Selected candidates (accepted → confirmed). A resignation re-opens the vacancy automatically.',
    edit_structure: 'Edit counts', candidates_for: 'Candidates for',

    // plan
    plan_title: 'Hiring plan by year', plan_hint: 'Enter how many people to hire for each job title in each year, then click “Save all changes”. Use the breakdown button to split a number by specialisation.',
    breakdown: 'Breakdown by specialisation', add_row: 'Add row', plan_total: 'Total planned', gap: 'Not yet planned',
    plan_exceeds: 'Plan exceeds remaining vacancies',

    // dashboard
    kpi_approved: 'Approved positions', kpi_current: 'Staff 2026/27', kpi_selected: 'Selected (pipeline)',
    kpi_hired: 'Hired', kpi_joined: 'Joined', kpi_remaining: 'Remaining vacancies', kpi_occupancy: 'Occupancy after selection',
    year_overview: 'Year overview', by_school: 'By school', by_department: 'By department', plan_vs_selected: 'Plan vs selected by year',
    pipeline: 'Recruitment pipeline', cv_sources: 'CV sources', ratings: 'Interview ratings', interviews_count: 'Interviews',
    shortages: 'Largest remaining shortages',

    // candidates
    candidate: 'Candidate', candidates: 'Candidates', new_candidate: 'New candidate', edit_candidate: 'Edit candidate',
    ref_no: 'Ref', gender: 'Gender', cv_source: 'CV source', cv_source_detail: 'Fair / agency name', email_addr: 'Email',
    inside_qatar: 'Inside Qatar?', residence_country: 'Country of residence', visa_status: 'Visa / residency',
    marital_status: 'Marital status', sons: 'Sons', daughters: 'Daughters', total_children: 'Total children',
    qualification: 'Highest qualification', years_experience: 'Years of experience', current_employer: 'Current employer',
    cv_url: 'CV link', stage: 'Stage', last_score: 'Score', rating: 'Rating', result: 'Interview result',
    sec_personal: 'Personal information', sec_location: 'Location & residency', sec_professional: 'Professional',
    sec_placement: 'Placement', placement_hint: 'Assign the school and appointment year once the candidate is selected.',
    no_records: 'No records found', count_records: 'records', created: 'Created', profile: 'Profile',
    journey: 'Employment journey', timeline: 'History', interviews: 'Interviews', add_interview: 'Add interview',
    step_interview: 'Interview', step_offer: 'Job offer', step_documents: 'Appointment documents', step_hire: 'Appointment',
    step_start: 'Started work', step_probation: 'Probation', step_confirm: 'Confirmation (tenure)', step_resign: 'Resignation',
    withdrawn: 'Withdrawn', withdraw: 'Mark withdrawn', withdrawn_reason: 'Reason', undo: 'Undo',
    resigned_q: 'Resigned?', resignation_reason: 'Reason', confirm_resign: 'Record resignation? The vacancy will reopen.',
    update_step: 'Update', step_locked: 'Complete the previous step first', not_set: 'Not set',

    // interview
    interview: 'Interview', new_interview: 'New interview', edit_interview: 'Edit interview', interview_date: 'Interview date',
    source: 'Interview source', source_detail: 'Fair / agency name', mode: 'Interview mode', interviewers: 'Interview panel',
    recommended_school: 'Recommended school', choose_candidate: 'Candidate', existing_candidate: 'Existing candidate',
    create_new_candidate: 'New candidate', search_candidate: 'Type a name, email or phone…',
    criteria: 'Evaluation criteria', criterion: 'Criterion', weight: 'Weight', score_1_5: 'Score (1–5)', note: 'Note',
    computed_score: 'Rubric score', overall_score: 'Overall judgement (/100)', use_computed: 'Use rubric score',
    strengths: 'Strengths', weaknesses: 'Areas of concern', general_notes: 'General notes', interview_result: 'Decision',
    assign_on_accept: 'Assign candidate to this school, title and year', pick_title_first: 'Choose a job title to load its criteria.',
    panel_name: 'Interviewer name', panel_title: 'Job title', add_interviewer: 'Add interviewer', signature: 'Signature',
    save_all: 'Save all changes', discard: 'Discard changes', apply: 'Apply', unsaved_n: '{n} unsaved change(s)', saved_n: 'Saved {n} change(s)',
    unsaved_leave: 'You have unsaved changes. Leave without saving them?', discard_confirm: 'Discard all unsaved changes?',
    lab_or_spec: 'Lab / specialisation', add_spec: 'Add lab / specialisation', not_specified: 'Not specified yet', lab_not_recorded: 'Selected – lab not recorded', spec_plan_hint: 'Enter the number to hire for each lab / specialisation; the title row is their total.',
    lab: 'Lab', choose_lab: 'Choose the lab…', labs: 'Specialised labs', lab_unassigned: 'Not linked to a lab yet', add_lab: 'Add lab',
    labs_total_hint: 'The approved total for this title is the sum of the labs below.', no_labs: 'No labs listed for this school yet — add them with Edit.',
    lab_staff_hint: 'Staff per lab is optional; staff not linked to a lab appear on a separate line.', total_staff: 'Total staff in post (2026/27)', rubric: 'Rubric', scale_hint: '1 = Weak · 2 = Below expectations · 3 = Meets · 4 = Strong · 5 = Outstanding',
    interview_saved: 'Interview saved', print_form: 'Print form', interview_list: 'Interviews', from: 'From', to: 'To',

    // reports
    report_analysis: 'Candidate analysis', report_vacancies: 'Vacancies report', report_interviews: 'Interviews report',
    group_by: 'Group by', then_by: 'Then by (columns)', dimension: 'Dimension', count: 'Count', percent: '%',
    report_hint: 'Choose how to group the candidates, apply filters, then export.',
    detail_sheet: 'Detailed list', summary_sheet: 'Summary',

    // users
    users_title: 'Users & permissions', pending_requests: 'Pending requests', approve: 'Approve', reject: 'Reject',
    disable: 'Disable', enable: 'Enable', requested: 'Requested', registered: 'Registered', you: 'You',
    role_help: 'Admin: everything, incl. vacancies & hiring plan · HR: candidates, interviews, pipeline · Interviewer: record interviews · Principal: own school only, onboarding steps · Viewer: read-only',
    school_required: 'Principals need a school',

    // settings
    settings_years: 'Academic years', settings_rubrics: 'Interview criteria', settings_titles: 'Job titles',
    settings_labs: 'Specialised labs', set_current: 'Set as current', current: 'Current', baseline: 'Baseline',
    add_year: 'Add next year', criteria_for: 'Criteria for', title_specific: 'Extra criteria for one job title',
    name_en: 'Name (English)', name_ar: 'Name (Arabic)', hint_en: 'Hint (English)', hint_ar: 'Hint (Arabic)',
    active: 'Active', weights_sum: 'Weights total', lab_name: 'Lab', staff_count: 'Staff',
  },

  ar: {
    app_name: 'التوظيف والهيكل الوظيفي', app_full: 'نظام التوظيف والهيكل الوظيفي', org_name: 'مدارس قطر للعلوم والتكنولوجيا',
    lang_toggle: 'English', loading: 'جارٍ التحميل…', save: 'حفظ', saved: 'تم الحفظ', cancel: 'إلغاء',
    edit: 'تعديل', delete: 'حذف', add: 'إضافة', close: 'إغلاق', search: 'بحث', all: 'الكل', none: '—',
    yes: 'نعم', no: 'لا', export_excel: 'تصدير إلى Excel', print: 'طباعة', filters: 'التصفية', clear: 'مسح',
    confirm_delete: 'هل تريد حذف هذا السجل؟ لا يمكن التراجع.', error: 'خطأ', total: 'الإجمالي',
    actions: 'إجراءات', details: 'التفاصيل', back: 'رجوع', open: 'فتح', required: 'حقل مطلوب',
    not_configured: 'النظام غير مرتبط بقاعدة بيانات بعد. عدّل الملف assets/js/config.js (راجع README).',

    sign_in: 'تسجيل الدخول', sign_out: 'تسجيل الخروج', register: 'إنشاء حساب', email: 'البريد الإلكتروني', password: 'كلمة المرور',
    full_name: 'الاسم الكامل', phone: 'رقم الهاتف', forgot: 'نسيت كلمة المرور؟', send_reset: 'إرسال رابط الاستعادة',
    reset_sent: 'إذا كان البريد مسجلاً فقد أُرسل رابط الاستعادة.', have_account: 'لديك حساب؟',
    no_account: 'مستخدم جديد؟', requested_role: 'الصلاحية المطلوبة', requested_school: 'المدرسة (إن وجدت)',
    position_note: 'وظيفتك / سبب طلب الدخول', register_done: 'تم إنشاء الحساب. إذا كان تأكيد البريد مفعلاً فأكّد بريدك ثم سجّل الدخول. يجب أن يعتمد المسؤول صلاحياتك.',
    pending_title: 'بانتظار الاعتماد', pending_text: 'تم إنشاء حسابك وهو بانتظار اعتماد المسؤول وتحديد صلاحياتك.',
    rejected_text: 'لم يُعتمد طلبك أو تم إيقاف الحساب. تواصل مع المسؤول.',
    refresh: 'تحديث', new_password: 'كلمة المرور الجديدة', set_password: 'تعيين كلمة المرور', password_updated: 'تم تحديث كلمة المرور',
    pw_min: '8 أحرف على الأقل',

    nav_dashboard: 'لوحة المعلومات', nav_structure: 'الشواغر', nav_plan: 'خطة التعيين', nav_candidates: 'المرشحون',
    nav_interviews: 'المقابلات', nav_new_interview: 'مقابلة جديدة', nav_reports: 'التقارير', nav_users: 'المستخدمون',
    nav_settings: 'الإعدادات',

    school: 'المدرسة', schools: 'المدارس', department: 'القسم / الإدارة', job_title: 'المسمى الوظيفي', specialization: 'التخصص',
    year: 'العام الدراسي', nationality: 'الجنسية', notes: 'ملاحظات', status: 'الحالة', date: 'التاريخ', role: 'الصلاحية',
    all_schools: 'كل المدارس', all_years: 'كل السنوات', reports_to: 'يتبع لـ', category: 'الفئة',

    approved: 'المعتمد', current_staff: 'موظفو 2026/27', selected: 'تم اختيارهم', hired: 'تم تعيينهم', joined: 'باشروا',
    remaining: 'المتبقي', planned: 'المخطط', occupancy: 'نسبة الإشغال', fill_progress: 'نسبة إنجاز الخطة',
    vac_filled: 'مكتمل', vac_open: 'شاغر', vac_over: 'زيادة', vacancy_status: 'حالة الشاغر',
    remaining_for_title: 'الشاغر المتبقي لهذا المسمى في المدرسة', unplanned: 'غير مخطط',
    structure_hint: 'المتبقي = المعتمد − موظفو 2026/27 − المرشحون المختارون (من القبول حتى التثبيت). الاستقالة تعيد فتح الشاغر تلقائياً.',
    edit_structure: 'تعديل الأعداد', candidates_for: 'المرشحون لـ',

    plan_title: 'خطة التعيين حسب السنة', plan_hint: 'أدخل عدد المطلوب تعيينهم لكل مسمى في كل سنة ثم اضغط «حفظ جميع التعديلات». استخدم زر التفصيل لتوزيع العدد على التخصصات.',
    breakdown: 'التفصيل حسب التخصص', add_row: 'إضافة سطر', plan_total: 'إجمالي المخطط', gap: 'غير مخطط بعد',
    plan_exceeds: 'الخطة تتجاوز الشواغر المتبقية',

    kpi_approved: 'الوظائف المعتمدة', kpi_current: 'موظفو 2026/27', kpi_selected: 'تم اختيارهم',
    kpi_hired: 'تم تعيينهم', kpi_joined: 'باشروا العمل', kpi_remaining: 'الشواغر المتبقية', kpi_occupancy: 'نسبة الإشغال بعد الاختيار',
    year_overview: 'موقف السنة', by_school: 'حسب المدرسة', by_department: 'حسب القسم', plan_vs_selected: 'المخطط مقابل المختار حسب السنة',
    pipeline: 'مراحل التوظيف', cv_sources: 'مصادر السير الذاتية', ratings: 'تقديرات المقابلات', interviews_count: 'المقابلات',
    shortages: 'أكبر النواقص المتبقية',

    candidate: 'المرشح', candidates: 'المرشحون', new_candidate: 'مرشح جديد', edit_candidate: 'تعديل بيانات المرشح',
    ref_no: 'الرقم', gender: 'الجنس', cv_source: 'مصدر السيرة الذاتية', cv_source_detail: 'اسم المعرض / الشركة', email_addr: 'البريد الإلكتروني',
    inside_qatar: 'داخل قطر؟', residence_country: 'دولة الإقامة', visa_status: 'التأشيرة / الإقامة',
    marital_status: 'الحالة الاجتماعية', sons: 'عدد الأبناء الذكور', daughters: 'عدد الأبناء الإناث', total_children: 'إجمالي الأبناء',
    qualification: 'أعلى مؤهل', years_experience: 'سنوات الخبرة', current_employer: 'جهة العمل الحالية',
    cv_url: 'رابط السيرة الذاتية', stage: 'المرحلة', last_score: 'الدرجة', rating: 'التقدير', result: 'نتيجة المقابلة',
    sec_personal: 'البيانات الشخصية', sec_location: 'الإقامة والتأشيرة', sec_professional: 'البيانات المهنية',
    sec_placement: 'التوزيع على المدارس', placement_hint: 'حدد المدرسة وسنة التعيين بعد اختيار المرشح.',
    no_records: 'لا توجد سجلات', count_records: 'سجل', created: 'تاريخ الإنشاء', profile: 'الملف',
    journey: 'مسار التوظيف', timeline: 'السجل التاريخي', interviews: 'المقابلات', add_interview: 'إضافة مقابلة',
    step_interview: 'المقابلة', step_offer: 'العرض الوظيفي', step_documents: 'مسوغات التعيين', step_hire: 'التعيين',
    step_start: 'مباشرة العمل', step_probation: 'فترة التجربة', step_confirm: 'التثبيت', step_resign: 'الاستقالة',
    withdrawn: 'منسحب', withdraw: 'تسجيل انسحاب', withdrawn_reason: 'السبب', undo: 'تراجع',
    resigned_q: 'استقال؟', resignation_reason: 'السبب', confirm_resign: 'تسجيل الاستقالة؟ سيعود الشاغر مفتوحاً.',
    update_step: 'تحديث', step_locked: 'أكمل المرحلة السابقة أولاً', not_set: 'غير محدد',

    interview: 'المقابلة', new_interview: 'مقابلة جديدة', edit_interview: 'تعديل المقابلة', interview_date: 'تاريخ المقابلة',
    source: 'مصدر المقابلة', source_detail: 'اسم المعرض / الشركة', mode: 'نوع المقابلة', interviewers: 'لجنة المقابلة',
    recommended_school: 'المدرسة المقترحة', choose_candidate: 'المرشح', existing_candidate: 'مرشح مسجل',
    create_new_candidate: 'مرشح جديد', search_candidate: 'اكتب الاسم أو البريد أو الهاتف…',
    criteria: 'بنود التقييم', criterion: 'البند', weight: 'الوزن', score_1_5: 'الدرجة (1–5)', note: 'ملاحظة',
    computed_score: 'درجة البنود', overall_score: 'التقييم الحكمي (من 100)', use_computed: 'اعتماد درجة البنود',
    strengths: 'نقاط القوة', weaknesses: 'نقاط تحتاج انتباه', general_notes: 'ملاحظات عامة', interview_result: 'القرار',
    assign_on_accept: 'إسناد المرشح لهذه المدرسة والمسمى والسنة', pick_title_first: 'اختر المسمى الوظيفي لتحميل بنود التقييم.',
    panel_name: 'اسم عضو اللجنة', panel_title: 'المسمى الوظيفي', add_interviewer: 'إضافة عضو', signature: 'التوقيع',
    save_all: 'حفظ جميع التعديلات', discard: 'إلغاء التعديلات', apply: 'تطبيق', unsaved_n: 'تعديلات غير محفوظة: {n}', saved_n: 'تم حفظ {n} تعديل',
    unsaved_leave: 'لديك تعديلات غير محفوظة. هل تريد المغادرة دون حفظها؟', discard_confirm: 'إلغاء جميع التعديلات غير المحفوظة؟',
    lab_or_spec: 'المختبر / التخصص', add_spec: 'إضافة مختبر / تخصص', not_specified: 'غير محدد بعد', lab_not_recorded: 'تم اختيارهم – المختبر غير مسجل', spec_plan_hint: 'أدخل عدد المطلوب تعيينهم لكل مختبر / تخصص؛ وسطر المسمى هو مجموعها.',
    lab: 'المختبر', choose_lab: 'اختر المختبر…', labs: 'المختبرات التخصصية', lab_unassigned: 'غير مرتبط بمختبر بعد', add_lab: 'إضافة مختبر',
    labs_total_hint: 'إجمالي المعتمد لهذا المسمى هو مجموع المختبرات أدناه.', no_labs: 'لم تُسجَّل مختبرات لهذه المدرسة بعد — أضفها من زر تعديل.',
    lab_staff_hint: 'عدد الموظفين لكل مختبر اختياري؛ ويظهر من لم يُربط بمختبر في سطر مستقل.', total_staff: 'إجمالي الموظفين على رأس العمل (2026/27)', rubric: 'نموذج التقييم', scale_hint: '1 = ضعيف · 2 = دون المتوقع · 3 = يلبي المتوقع · 4 = قوي · 5 = متميز',
    interview_saved: 'تم حفظ المقابلة', print_form: 'طباعة النموذج', interview_list: 'المقابلات', from: 'من', to: 'إلى',

    report_analysis: 'تحليل المرشحين', report_vacancies: 'تقرير الشواغر', report_interviews: 'تقرير المقابلات',
    group_by: 'التجميع حسب', then_by: 'ثم حسب (أعمدة)', dimension: 'البعد', count: 'العدد', percent: '%',
    report_hint: 'اختر طريقة التجميع وطبّق التصفية ثم صدّر التقرير.',
    detail_sheet: 'القائمة التفصيلية', summary_sheet: 'الملخص',

    users_title: 'المستخدمون والصلاحيات', pending_requests: 'طلبات بانتظار الاعتماد', approve: 'اعتماد', reject: 'رفض',
    disable: 'إيقاف', enable: 'تفعيل', requested: 'المطلوب', registered: 'تاريخ التسجيل', you: 'أنت',
    role_help: 'مسؤول: كل شيء بما فيه الشواغر وخطة التعيين · موارد بشرية: المرشحون والمقابلات والمسار · مُقابِل: تسجيل المقابلات · مدير مدرسة: مدرسته فقط ومراحل المباشرة · مُطّلع: قراءة فقط',
    school_required: 'يجب تحديد مدرسة لمدير المدرسة',

    settings_years: 'الأعوام الدراسية', settings_rubrics: 'بنود تقييم المقابلات', settings_titles: 'المسميات الوظيفية',
    settings_labs: 'المختبرات التخصصية', set_current: 'تعيين كعام حالي', current: 'الحالي', baseline: 'سنة الأساس',
    add_year: 'إضافة السنة التالية', criteria_for: 'البنود لـ', title_specific: 'بنود إضافية لمسمى وظيفي محدد',
    name_en: 'الاسم (إنجليزي)', name_ar: 'الاسم (عربي)', hint_en: 'توضيح (إنجليزي)', hint_ar: 'توضيح (عربي)',
    active: 'فعّال', weights_sum: 'مجموع الأوزان', lab_name: 'المختبر', staff_count: 'الموظفون',
  },
};

// Enumerated values used in the database → labels
export const ENUMS = {
  role: {
    none: ['No access', 'بدون صلاحية'], admin: ['Administrator', 'مسؤول النظام'], hr: ['HR / Recruitment', 'الموارد البشرية / التوظيف'],
    interviewer: ['Interviewer', 'عضو لجنة مقابلات'], principal: ['School principal', 'مدير مدرسة'], viewer: ['Viewer (read-only)', 'مُطّلع (قراءة فقط)'],
  },
  user_status: { pending: ['Pending', 'بانتظار الاعتماد'], approved: ['Approved', 'معتمد'], rejected: ['Rejected', 'مرفوض'], disabled: ['Disabled', 'موقوف'] },
  stage: {
    new: ['New', 'جديد'], accepted: ['Accepted at interview', 'مقبول في المقابلة'], reserve: ['Reserve list', 'قائمة احتياط'],
    rejected: ['Not accepted', 'غير مقبول'], offer_sent: ['Offer sent', 'أُرسل العرض'], offer_accepted: ['Offer accepted', 'قبل العرض'],
    offer_declined: ['Offer declined', 'رفض العرض'], documents_complete: ['Documents complete', 'استكمل المسوغات'],
    hired: ['Appointed', 'تم التعيين'], not_hired: ['Not appointed', 'لم يتم التعيين'], started: ['Started work', 'باشر العمل'],
    probation_passed: ['Passed probation', 'اجتاز فترة التجربة'], probation_failed: ['Failed probation', 'لم يجتز فترة التجربة'],
    confirmed: ['Confirmed', 'تم التثبيت'], resigned: ['Resigned', 'استقال'], withdrawn: ['Withdrawn', 'انسحب'],
  },
  result: { pending: ['Pending', 'قيد الدراسة'], accepted: ['Accepted', 'مقبول'], reserve: ['Reserve', 'احتياط'], rejected: ['Not accepted', 'غير مقبول'] },
  rating: { excellent: ['Excellent', 'ممتاز'], very_good: ['Very good', 'جيد جداً'], good: ['Good', 'جيد'], average: ['Average', 'متوسط'], weak: ['Weak', 'ضعيف'] },
  cv_source: { job_fair: ['Job fair', 'معرض توظيف'], agency: ['Recruitment agency', 'شركة توظيف'], ministry: ['Ministry nomination', 'ترشيح وزارة'], school: ['Through the school', 'عن طريق المدرسة'], other: ['Other', 'أخرى'] },
  mode: { in_person: ['In person', 'حضورية'], remote: ['Remote', 'عن بُعد'] },
  visa_status: { new_visa: ['Needs a new visa', 'يحتاج تأشيرة جديدة'], residency_transfer: ['Residency transfer', 'نقل إقامة'], family_residency: ['Has family residency', 'لديه إقامة عائلية'], not_required: ['Not required (Qatari / other)', 'لا يحتاج (قطري / أخرى)'] },
  marital_status: { single: ['Single', 'أعزب / عزباء'], married: ['Married', 'متزوج / متزوجة'], divorced: ['Divorced', 'مطلق / مطلقة'], widowed: ['Widowed', 'أرمل / أرملة'] },
  gender: { male: ['Male', 'ذكر'], female: ['Female', 'أنثى'] },
  inside_qatar: { true: ['Inside Qatar', 'داخل قطر'], false: ['Outside Qatar', 'خارج قطر'] },
  offer_status: { pending: ['Offer sent – awaiting reply', 'أُرسل العرض – بانتظار الرد'], accepted: ['Accepted the offer', 'قبل العرض'], declined: ['Declined the offer', 'رفض العرض'] },
  documents_status: { incomplete: ['Incomplete', 'غير مكتملة'], complete: ['Complete', 'مكتملة'] },
  hire_status: { in_progress: ['In progress', 'قيد الإجراء'], hired: ['Appointed', 'تم التعيين'], not_hired: ['Not appointed', 'لم يتم التعيين'] },
  start_status: { started: ['Started work', 'باشر العمل'], not_started: ['Did not start', 'لم يباشر'] },
  probation_status: { in_probation: ['In probation', 'في فترة التجربة'], passed: ['Passed', 'اجتاز'], failed: ['Did not pass', 'لم يجتز'] },
  category: { leadership: ['Leadership', 'قيادية'], academic: ['Academic', 'أكاديمية'], administrative: ['Administrative', 'إدارية'], lab: ['Lab / engineering', 'مختبرات / هندسية'] },
  event: {
    created: ['Record created', 'إنشاء السجل'], interview: ['Interview recorded', 'تسجيل مقابلة'], interview_updated: ['Interview updated', 'تعديل مقابلة'],
    stage: ['Stage', 'المرحلة'], school_id: ['School', 'المدرسة'], job_title_id: ['Job title', 'المسمى الوظيفي'], year_id: ['Year', 'السنة'],
    interview_result: ['Interview result', 'نتيجة المقابلة'], offer_status: ['Offer', 'العرض'], documents_status: ['Documents', 'المسوغات'],
    hire_status: ['Appointment', 'التعيين'], start_status: ['Start', 'المباشرة'], probation_status: ['Probation', 'التجربة'],
    confirmed: ['Confirmed', 'التثبيت'], resigned: ['Resigned', 'الاستقالة'], withdrawn: ['Withdrawn', 'الانسحاب'], specialization: ['Specialisation', 'التخصص'],
  },
};

// Specialised labs (value stored = English name)
export const LABS = [
  ['Digital Fabrication', 'التصنيع الرقمي'], ['Chemical analysis', 'التحليل الكيميائي'], ['STEM Lab', 'مختبر STEM'],
  ['Applied physics', 'الفيزياء التطبيقية'], ['Network', 'الشبكات'], ['Energy', 'الطاقة'], ['Engineering design', 'التصميم الهندسي'],
  ['Robotics', 'الروبوتات'], ['BioMed', 'الطب الحيوي'], ['Communication', 'الاتصالات'], ['VR & AR', 'الواقع الافتراضي والمعزز'],
  ['Medical Simulation', 'المحاكاة الطبية'], ['Space science', 'علوم الفضاء'], ['Drones', 'الطائرات المسيّرة'],
];

// Science specialisations (e.g. for lab technicians)
export const SCIENCES = [['Chemistry', 'الكيمياء'], ['Physics', 'الفيزياء'], ['Biology', 'الأحياء'], ['General science', 'العلوم العامة']];

export const RATING_BANDS = [
  { key: 'excellent', min: 90 }, { key: 'very_good', min: 80 }, { key: 'good', min: 70 }, { key: 'average', min: 60 }, { key: 'weak', min: 0 },
];
export function ratingFor(score) {
  if (score === null || score === undefined || score === '' || isNaN(score)) return null;
  return RATING_BANDS.find(b => Number(score) >= b.min).key;
}
