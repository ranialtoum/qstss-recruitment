"""Generate supabase/02_seed.sql from the staffing workbook.

Usage:  python tools/build_seed.py path/to/workbook.xlsx > supabase/02_seed.sql
Reads the five school sheets (approved structure + 2026/2027 staff) and the
specialised-labs sheet. Needs: pip install openpyxl
"""
import sys
import openpyxl

SCHOOLS = [
    # sheet name, code, name_en, gender, full name EN
    ("أم السنيم - بنين", "UAS-B", "Umm Al Seneem – Boys", "boys",
     "QSTSS Preparatory & Secondary School for Boys – Umm Al Seneem"),
    ("الصخامة - بنين", "SAK-B", "Al Sakhama – Boys", "boys",
     "QSTSS Preparatory & Secondary School for Boys – Al Sakhama"),
    ("روضة الحمامة - بنات", "RHM-G", "Rawdat Al Hamama – Girls", "girls",
     "QSTSS Secondary School for Girls – Rawdat Al Hamama"),
    ("الريان كالجاري - بنين", "RYN-B", "Al Rayyan (Calgary) – Boys", "boys",
     "QSTSS Preparatory & Secondary School for Boys – Al Rayyan (Calgary Building)"),
    ("الدفنة المصرفية - بنات", "DAF-G", "Al Dafna (Masrafiya) – Girls", "girls",
     "QSTSS Secondary School for Girls – Al Dafna (Al Masrafiya Building)"),
]

DEPARTMENTS = {
    "الإدارة العليا": "Senior Leadership",
    "الخدمات الإدارية والمساندة": "Administrative & Support Services",
    "شؤون الطلاب": "Student Affairs",
    "الدعم الأكاديمي": "Academic Support",
    "المواد العامة (لغات وإنسانيات وتربية بدنية)": "General Subjects (Languages, Humanities & PE)",
    "مسار AP والرياضيات والحاسوب": "AP, Mathematics & Computing",
    "STEM والمختبرات والبحث": "STEM, Labs & Research",
}

# Arabic title -> (English title, category, rubric)
TITLES = {
    "مدير المدرسة": ("School Principal", "leadership", "leadership"),
    "نائب المدير للشؤون الإدارية وشؤون الطلاب": ("Vice Principal – Administrative & Student Affairs", "leadership", "leadership"),
    "نائب المدير للشؤون الأكاديمية": ("Vice Principal – Academic Affairs", "leadership", "leadership"),
    "المحاسب": ("Accountant", "administrative", "admin_support"),
    "فني تقنية المعلومات": ("IT Technician", "administrative", "admin_support"),
    "موظف استقبال": ("Receptionist", "administrative", "admin_support"),
    "عامل خدمات": ("Service Worker", "administrative", "admin_support"),
    "ملاحظ باص": ("Bus Monitor", "administrative", "admin_support"),
    "مندوب": ("Public Relations Officer (PRO)", "administrative", "admin_support"),
    "السكرتير": ("Secretary", "administrative", "admin_support"),
    "منسق شؤون الطلاب": ("Student Affairs Coordinator", "administrative", "student_services"),
    "أخصائي اجتماعي": ("Social Worker", "administrative", "student_services"),
    "مشرف إداري": ("Administrative Supervisor", "administrative", "student_services"),
    "مشرف مقصف": ("Canteen Supervisor", "administrative", "admin_support"),
    "أمين المخزن": ("Storekeeper", "administrative", "admin_support"),
    "مسؤول أنشطة": ("Activities Officer", "administrative", "student_services"),
    "أخصائي نفسي": ("Psychologist", "administrative", "student_services"),
    "المرشد الأكاديمي": ("Academic Advisor", "academic", "student_services"),
    "منسق المشاريع الإلكترونية": ("E-Projects Coordinator", "administrative", "admin_support"),
    "مسؤول مركز مصادر التعلم": ("Learning Resource Centre Officer", "administrative", "admin_support"),
    "منسق لغة عربية": ("Arabic Coordinator", "academic", "coordinator"),
    "منسق لغة إنجليزية": ("English Coordinator", "academic", "coordinator"),
    "منسق تربية إسلامية": ("Islamic Education Coordinator", "academic", "coordinator"),
    "منسق تربية بدنية": ("Physical Education Coordinator", "academic", "coordinator"),
    "معلم تربية إسلامية": ("Islamic Education Teacher", "academic", "teacher"),
    "معلم لغة عربية": ("Arabic Teacher", "academic", "teacher"),
    "معلم دراسات اجتماعية": ("Social Studies Teacher", "academic", "teacher"),
    "معلم تربية رياضية": ("Physical Education Teacher", "academic", "teacher"),
    "معلم لغة إنجليزية": ("English Teacher", "academic", "teacher"),
    "منسق AP": ("AP Coordinator", "academic", "coordinator"),
    "منسق الرياضيات": ("Mathematics Coordinator", "academic", "coordinator"),
    "منسق الحاسوب": ("Computer Science Coordinator", "academic", "coordinator"),
    "معلم AP – الفيزياء (AP Physics)": ("AP Physics Teacher", "academic", "teacher"),
    "معلم AP – الكيمياء (AP Chemistry)": ("AP Chemistry Teacher", "academic", "teacher"),
    "معلم AP – الأحياء (AP Biology)": ("AP Biology Teacher", "academic", "teacher"),
    "معلم AP – الرياضيات": ("AP Mathematics Teacher", "academic", "teacher"),
    "معلم AP – الحاسوب": ("AP Computer Science Teacher", "academic", "teacher"),
    "معلم AP – تكنولوجيا التصميم": ("AP Design Technology Teacher", "academic", "teacher"),
    "منسق STEM": ("STEM Coordinator", "academic", "coordinator"),
    "معلم STEM": ("STEM Teacher", "academic", "teacher"),
    "مهندس / معلم المختبرات التخصصية": ("Specialised Labs Engineer / Teacher", "lab", "lab_engineer"),
    "محضر مختبرات": ("Lab Technician", "lab", "lab_technician"),
    "أخصائي البحث والابتكار": ("Research & Innovation Specialist", "lab", "lab_engineer"),
}

REPORTS_TO_EN = {
    "—": None, "مدير المدرسة": "School Principal",
    "نائب المدير للشؤون الإدارية وشؤون الطلاب": "Vice Principal – Administrative & Student Affairs",
    "نائب المدير للشؤون الأكاديمية": "Vice Principal – Academic Affairs",
    "منسق شؤون الطلاب": "Student Affairs Coordinator",
    "منسقو المواد": "Subject Coordinators",
    "منسقو AP / الرياضيات / الحاسوب": "AP / Mathematics / Computing Coordinators",
    "منسق STEM": "STEM Coordinator",
}

RUBRICS = [
    ("leadership", "School leadership", "القيادة المدرسية"),
    ("coordinator", "Academic coordinators", "المنسقون الأكاديميون"),
    ("teacher", "Teachers (academic)", "المعلمون (أكاديمي)"),
    ("lab_engineer", "Lab engineers & research", "مهندسو المختبرات والبحث"),
    ("lab_technician", "Lab technicians", "محضرو المختبرات"),
    ("student_services", "Student services", "شؤون الطلاب والإرشاد"),
    ("admin_support", "Administrative & support", "الوظائف الإدارية والمساندة"),
]

# rubric -> list of (key, name_en, name_ar, hint_en, hint_ar, weight)  (weights sum to 100)
CRITERIA = {
    "leadership": [
        ("experience", "Leadership experience in similar schools", "الخبرة القيادية في مدارس مماثلة",
         "Years and level of school leadership, STEM / specialised schools", "سنوات الخبرة ومستواها، والعمل في مدارس STEM أو متخصصة", 15),
        ("vision", "Strategic vision & school improvement", "الرؤية الاستراتيجية وتطوير المدرسة",
         "Improvement planning, accreditation (Cognia/QNSA), change management", "خطط التحسين، الاعتماد (Cognia / QNSA)، إدارة التغيير", 15),
        ("instructional", "Instructional leadership", "القيادة التعليمية",
         "Curriculum, teaching quality, data-driven decisions", "المناهج، جودة التدريس، اتخاذ القرار المبني على البيانات", 15),
        ("people", "Staff management & development", "إدارة الكوادر وتطويرها",
         "Recruitment, appraisal, coaching, professional development", "التوظيف، التقييم، التوجيه، التنمية المهنية", 15),
        ("admin_skills", "Administrative & financial management", "المهارات الإدارية والمالية",
         "Operations, budgeting, policies, MOEHE systems", "التشغيل، الميزانية، السياسات، أنظمة الوزارة", 10),
        ("communication", "Communication & stakeholder relations", "التواصل والعلاقات مع المعنيين",
         "Parents, ministry, partners; Arabic & English", "أولياء الأمور، الوزارة، الشركاء؛ العربية والإنجليزية", 10),
        ("decision", "Problem solving & decision making", "حل المشكلات واتخاذ القرار",
         "Response to scenario questions", "الإجابة عن أسئلة المواقف", 10),
        ("personal", "Personal attributes & values", "السمات الشخصية والقيم",
         "Integrity, presence, resilience, fit with QSTSS culture", "النزاهة، الحضور، المرونة، الملاءمة لثقافة المدرسة", 10),
    ],
    "coordinator": [
        ("experience", "Experience in the subject & coordination", "الخبرة في التخصص والتنسيق",
         "Teaching years + coordination / HOD experience", "سنوات التدريس وخبرة التنسيق / رئاسة القسم", 15),
        ("subject", "Subject-matter mastery", "التمكن من المادة العلمية",
         "Depth of content knowledge, AP / advanced level", "عمق المعرفة بالمادة، المستوى المتقدم / AP", 15),
        ("curriculum", "Curriculum & assessment planning", "تخطيط المنهج والتقويم",
         "Scope & sequence, standards alignment, common assessments", "توزيع المنهج، المواءمة مع المعايير، الاختبارات الموحدة", 15),
        ("coaching", "Leading & coaching teachers", "قيادة المعلمين وتوجيههم",
         "Observation, feedback, PLCs", "الزيارات الصفية، التغذية الراجعة، مجتمعات التعلم", 15),
        ("data", "Use of data for improvement", "توظيف البيانات في التحسين",
         "Result analysis, intervention plans", "تحليل النتائج وخطط المعالجة", 10),
        ("pedagogy", "Pedagogy & STEM integration", "الممارسات التدريسية ودمج STEM",
         "Inquiry, PBL, technology", "الاستقصاء، التعلم بالمشاريع، التقنية", 10),
        ("communication", "Communication & teamwork", "التواصل والعمل بروح الفريق", None, None, 10),
        ("personal", "Personal attributes", "السمات الشخصية", None, None, 10),
    ],
    "teacher": [
        ("experience", "Teaching experience in the subject", "الخبرة في تدريس المادة",
         "Years, grade levels, curricula taught (AP/IB/national)", "سنوات الخبرة، المراحل، المناهج (AP / IB / وطني)", 15),
        ("subject", "Subject-matter mastery", "التمكن من المادة العلمية",
         "Accuracy and depth in answering subject questions", "دقة وعمق الإجابة عن أسئلة المادة", 20),
        ("pedagogy", "Teaching strategies & lesson design", "استراتيجيات التدريس وتخطيط الدروس",
         "Student-centred, inquiry, STEM / PBL", "التعلم المتمركز حول الطالب، الاستقصاء، STEM / المشاريع", 15),
        ("assessment", "Assessment & differentiation", "التقويم ومراعاة الفروق الفردية", None, None, 10),
        ("classroom", "Classroom management", "إدارة الصف", None, None, 10),
        ("technology", "Technology integration", "توظيف التكنولوجيا", None, None, 10),
        ("language", "Language of instruction proficiency", "إتقان لغة التدريس",
         "English for AP/STEM/English; Arabic for Arabic/Islamic/Social studies", "الإنجليزية لمواد AP و STEM؛ العربية للعربي والإسلامية والاجتماعيات", 10),
        ("personal", "Personal attributes", "السمات الشخصية",
         "Professionalism, enthusiasm, teamwork, fit", "المهنية، الحماس، العمل الجماعي، الملاءمة", 10),
    ],
    "lab_engineer": [
        ("experience", "Technical experience in the lab field", "الخبرة الفنية في مجال المختبر",
         "Robotics, fabrication, energy, biomed, networks…", "الروبوت، التصنيع الرقمي، الطاقة، الطب الحيوي، الشبكات…", 20),
        ("technical", "Mastery of equipment & technical skills", "التمكن من الأجهزة والمهارات الفنية",
         "Hands-on skills, software, maintenance", "المهارات العملية، البرمجيات، الصيانة", 20),
        ("science", "Scientific / engineering knowledge", "المعرفة العلمية / الهندسية", None, None, 15),
        ("safety", "Lab safety & management", "السلامة وإدارة المختبر",
         "Safety procedures, inventory, scheduling", "إجراءات السلامة، الجرد، الجدولة", 10),
        ("projects", "Supporting student projects & research", "دعم مشاريع الطلاب والبحث العلمي",
         "Competitions, capstone, innovation", "المسابقات، مشاريع التخرج، الابتكار", 15),
        ("teaching", "Training & communication skills", "مهارات التدريب والتواصل", None, None, 10),
        ("personal", "Personal attributes", "السمات الشخصية", None, None, 10),
    ],
    "lab_technician": [
        ("experience", "Experience in lab preparation", "الخبرة في تحضير المختبرات", None, None, 20),
        ("technical", "Preparation of experiments & materials", "تحضير التجارب والمواد", None, None, 20),
        ("safety", "Chemical & lab safety", "السلامة الكيميائية والمخبرية", None, None, 20),
        ("organization", "Inventory, organisation & record keeping", "الجرد والتنظيم والتوثيق", None, None, 15),
        ("cooperation", "Cooperation with teachers & students", "التعاون مع المعلمين والطلاب", None, None, 15),
        ("personal", "Personal attributes", "السمات الشخصية", None, None, 10),
    ],
    "student_services": [
        ("experience", "Experience in the role", "الخبرة في مجال الوظيفة", None, None, 15),
        ("knowledge", "Professional knowledge", "المعرفة المهنية المتخصصة",
         "Counselling / social work / psychology / advising theory", "نظريات الإرشاد / الخدمة الاجتماعية / علم النفس / الإرشاد الأكاديمي", 15),
        ("student_support", "Student support & case management", "دعم الطلاب وإدارة الحالات", None, None, 20),
        ("behaviour", "Behaviour management & crisis handling", "إدارة السلوك والتعامل مع الأزمات", None, None, 15),
        ("communication", "Communication with students & parents", "التواصل مع الطلاب وأولياء الأمور", None, None, 15),
        ("admin_skills", "Organisation & documentation", "التنظيم والتوثيق", None, None, 10),
        ("personal", "Personal attributes & confidentiality", "السمات الشخصية والسرية", None, None, 10),
    ],
    "admin_support": [
        ("experience", "Experience in the job field", "الخبرة في مجال الوظيفة", None, None, 20),
        ("admin_skills", "Administrative / technical skills for the role", "المهارات الإدارية / الفنية للوظيفة",
         "e.g. accounting, IT support, PRO procedures, filing", "مثل المحاسبة، الدعم الفني، معاملات المندوب، الأرشفة", 20),
        ("systems", "Computer & systems proficiency", "إتقان الحاسوب والأنظمة", None, None, 15),
        ("accuracy", "Accuracy & organisation", "الدقة والتنظيم", None, None, 15),
        ("communication", "Communication & customer service", "التواصل وخدمة المراجعين", None, None, 10),
        ("reliability", "Reliability & integrity", "الالتزام والأمانة", None, None, 10),
        ("personal", "Personal attributes", "السمات الشخصية", None, None, 10),
    ],
}

YEARS = [("2026/2027", 2026, True), ("2027/2028", 2027, False), ("2028/2029", 2028, False),
         ("2029/2030", 2029, False), ("2030/2031", 2030, False), ("2031/2032", 2031, False)]


def q(v):
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return str(int(v)) if float(v).is_integer() else str(v)
    return "'" + str(v).replace("'", "''").strip() + "'"


def num(v):
    try:
        return int(v or 0)
    except (TypeError, ValueError):
        return 0


def main(path):
    wb = openpyxl.load_workbook(path, data_only=True)
    out = ["-- Generated by tools/build_seed.py — do not edit by hand",
           "begin;"]

    out.append("insert into public.schools (code, name_ar, name_en, full_name_ar, full_name_en, gender, sort) values")
    rows = []
    for i, (sheet, code, en, gender, full_en) in enumerate(SCHOOLS, 1):
        full_ar = (wb[sheet]["A1"].value or sheet).strip()
        rows.append(f"({q(code)}, {q(sheet)}, {q(en)}, {q(full_ar)}, {q(full_en)}, {q(gender)}, {i})")
    out.append(",\n".join(rows) + ";")

    out.append("insert into public.departments (name_ar, name_en, sort) values")
    out.append(",\n".join(f"({q(a)}, {q(e)}, {i})" for i, (a, e) in enumerate(DEPARTMENTS.items(), 1)) + ";")

    out.append("insert into public.rubrics (key, name_en, name_ar, sort) values")
    out.append(",\n".join(f"({q(k)}, {q(e)}, {q(a)}, {i})" for i, (k, e, a) in enumerate(RUBRICS, 1)) + ";")

    out.append("insert into public.rubric_criteria (rubric_key, key, name_en, name_ar, hint_en, hint_ar, weight, sort) values")
    rows = []
    for rk, crits in CRITERIA.items():
        assert sum(c[5] for c in crits) == 100, rk
        for i, (k, en, ar, hen, har, w) in enumerate(crits, 1):
            rows.append(f"({q(rk)}, {q(k)}, {q(en)}, {q(ar)}, {q(hen)}, {q(har)}, {w}, {i})")
    out.append(",\n".join(rows) + ";")

    out.append("insert into public.academic_years (label, start_year, is_baseline, is_current) values")
    out.append(",\n".join(f"({q(l)}, {y}, {q(b)}, {q(l == '2027/2028')})" for l, y, b in YEARS) + ";")

    # job titles from the first school sheet (order = org chart order)
    first = wb[SCHOOLS[0][0]]
    seen = []
    title_rows = []
    for r in first.iter_rows(min_row=5, max_row=60):
        if isinstance(r[0].value, (int, float)) and r[2].value:
            dept, title, rep = r[1].value.strip(), r[2].value.strip(), (r[3].value or "—").strip()
            en, cat, rub = TITLES[title]
            seen.append(title)
            title_rows.append(
                f"((select id from public.departments where name_ar = {q(dept)}), {q(title)}, {q(en)}, "
                f"{q(None if rep == '—' else rep)}, {q(REPORTS_TO_EN.get(rep))}, {q(cat)}, {q(rub)}, {len(seen)})")
    missing = set(TITLES) - set(seen)
    assert not missing, missing
    out.append("insert into public.job_titles (department_id, name_ar, name_en, reports_to_ar, reports_to_en, category, rubric_key, sort) values")
    out.append(",\n".join(title_rows) + ";")

    # labs (reference structure count per school for lab engineers)
    labs_ws = wb["المختبرات التخصصية"]
    lab_ref = {}
    for r in labs_ws.iter_rows(min_row=5, max_row=9):
        if r[1].value:
            lab_ref[r[1].value.strip()] = num(r[2].value)
    lab_rows = []
    for r in labs_ws.iter_rows(min_row=14, max_row=labs_ws.max_row):
        if r[1].value and r[2].value:
            lab_rows.append(f"((select id from public.schools where name_ar = {q(r[1].value)}), {q(r[2].value)}, {num(r[3].value)}, {q(r[4].value)})")
    if lab_rows:
        out.append("insert into public.school_labs (school_id, name, staff_count, notes) values")
        out.append(",\n".join(lab_rows) + "\non conflict do nothing;")

    # approved structure + 2026/2027 staff, and the 2027/2028 hiring plan (= remaining vacancies)
    pos_rows, plan_rows = [], []
    report = []
    for sheet, *_ in SCHOOLS:
        ws = wb[sheet]
        tot_a = tot_c = tot_p = 0
        for r in ws.iter_rows(min_row=5, max_row=60):
            if not (isinstance(r[0].value, (int, float)) and r[2].value):
                continue
            title = r[2].value.strip()
            approved, current, note = num(r[4].value), num(r[7].value), r[5].value
            if title == "مهندس / معلم المختبرات التخصصية" and lab_ref.get(sheet) and approved != lab_ref[sheet]:
                note = (f"Approved count taken from the org-structure reference in the labs sheet "
                        f"({lab_ref[sheet]}); the school sheet showed {approved}.")
                approved = lab_ref[sheet]
            sid = f"(select id from public.schools where name_ar = {q(sheet)})"
            tid = f"(select id from public.job_titles where name_ar = {q(title)})"
            pos_rows.append(f"({sid}, {tid}, {approved}, {current}, {q(note)})")
            need = max(approved - current, 0)
            if need:
                plan_rows.append(f"({sid}, {tid}, (select id from public.academic_years where label = '2027/2028'), {need})")
            tot_a += approved; tot_c += current; tot_p += need
        report.append(f"-- {sheet}: approved {tot_a}, current {tot_c}, plan 2027/2028 {tot_p}")
    out.append("insert into public.school_positions (school_id, job_title_id, approved_count, current_staff, notes) values")
    out.append(",\n".join(pos_rows) + ";")
    out.append("-- Initial 2027/2028 plan = all remaining vacancies (edit it in the Hiring Plan page)")
    out.append("insert into public.hiring_plan (school_id, job_title_id, year_id, planned_count) values")
    out.append(",\n".join(plan_rows) + ";")
    out.extend(report)
    out.append("commit;")
    print("\n".join(out))


if __name__ == "__main__":
    main(sys.argv[1])
