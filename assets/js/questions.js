// Interview question bank for teachers.
//
// GENERAL: suggested questions for each teacher criterion (shown to the panel, not marked one by one).
//   scenario: true marks a scenario-based question.
// SUBJECT: five subject-mastery questions per teacher job title (keyed by the title's English name).
//   Each question has a model answer of key points; every key point is worth 1 mark, so a question's
//   maximum mark = number of points. The sum of the marks is the subject-mastery score.
//   type: fundamental | hot (higher-order thinking) | stem (STEM-based lesson); scenario: true adds a Scenario tag
//   Questions are written in the subject's language of instruction (lang: 'en' or 'ar').

export const Q_TYPES = {
  fundamental: ['Fundamental knowledge', 'معرفة أساسية'],
  hot: ['Higher-order thinking', 'تفكير عالي المستوى'],
  stem: ['STEM-based lesson', 'درس قائم على STEM'],
  scenario: ['Scenario', 'موقف'],
};

export const GENERAL = {
  teacher: {
    experience: [
      { en: 'Describe your teaching experience: grade levels, curricula taught (AP / IB / national) and the results your students achieved.', ar: 'صف خبرتك في التدريس: المراحل الدراسية، المناهج التي درّستها (AP / IB / وطني)، والنتائج التي حققها طلابك.' },
      { en: 'Which achievement in your teaching career are you most proud of, and what evidence shows its impact on students?', ar: 'ما أكثر إنجاز تفخر به في مسيرتك التدريسية، وما الدليل على أثره في الطلاب؟' },
    ],
    pedagogy: [
      { en: 'Describe a recent lesson you taught using inquiry or project-based learning. What exactly did the students do?', ar: 'صف درساً قدّمته مؤخراً باستخدام الاستقصاء أو التعلم القائم على المشاريع. ماذا فعل الطلاب تحديداً؟' },
      { scenario: true, en: 'You must teach a topic that students find abstract and boring. How would you plan the lesson to engage them and make it relevant?', ar: 'عليك تدريس موضوع يراه الطلاب مجرداً ومملاً. كيف تخطط الدرس لجذب انتباههم وربطه بواقعهم؟' },
      { en: 'How do you build higher-order thinking (analysis, evaluation, creation) into your lessons? Give an example.', ar: 'كيف تدمج مهارات التفكير العليا (التحليل، التقويم، الإبداع) في دروسك؟ أعطِ مثالاً.' },
    ],
    assessment: [
      { en: 'How do you check for understanding during a lesson? Which formative assessment techniques do you use?', ar: 'كيف تتحقق من فهم الطلاب أثناء الحصة؟ ما أساليب التقويم التكويني التي تستخدمها؟' },
      { scenario: true, en: 'After a unit test, 40% of the class scored below 50%. What do you do next?', ar: 'بعد اختبار الوحدة حصل 40٪ من الصف على أقل من 50٪. ماذا تفعل بعد ذلك؟' },
      { scenario: true, en: 'In the same class you have a gifted student who is bored and a student who is struggling. How do you differentiate for both in one lesson?', ar: 'في الصف نفسه طالب موهوب يشعر بالملل وطالب متعثر. كيف تراعي الفروق بينهما في الحصة نفسها؟' },
    ],
    classroom: [
      { scenario: true, en: 'A student repeatedly disrupts your lesson and ignores your warnings. Describe, step by step, how you handle it.', ar: 'طالب يكرر إثارة الفوضى في الحصة ويتجاهل تنبيهاتك. صف خطوة بخطوة كيف تتعامل معه.' },
      { scenario: true, en: 'During a practical / lab activity, one group is ignoring the safety rules. What do you do?', ar: 'أثناء نشاط عملي أو مخبري، مجموعة لا تلتزم بقواعد السلامة. ماذا تفعل؟' },
      { en: 'How do you establish routines and expectations at the start of the school year?', ar: 'كيف تبني الروتين والتوقعات الصفية في بداية العام الدراسي؟' },
    ],
    technology: [
      { en: 'Which digital tools do you use, and how do they improve learning (not only presentation)?', ar: 'ما الأدوات الرقمية التي تستخدمها، وكيف تحسّن التعلم (وليس العرض فقط)؟' },
      { scenario: true, en: 'The online simulation you planned the lesson around stops working at the start of the class. What do you do?', ar: 'المحاكاة الإلكترونية التي بنيت عليها الدرس توقفت عن العمل في بداية الحصة. ماذا تفعل؟' },
      { en: 'How do you guide students to use AI tools responsibly in your subject?', ar: 'كيف توجّه الطلاب لاستخدام أدوات الذكاء الاصطناعي بمسؤولية في مادتك؟' },
    ],
    language: [
      { en: 'Explain a key concept of your subject to us exactly as you would explain it to students, in the language of instruction.', ar: 'اشرح لنا مفهوماً أساسياً في مادتك كما تشرحه للطلاب تماماً، بلغة التدريس.' },
      { en: 'How do you support students whose language level makes the subject content difficult for them?', ar: 'كيف تدعم الطلاب الذين يجعل مستواهم اللغوي محتوى المادة صعباً عليهم؟' },
    ],
    personal: [
      { scenario: true, en: 'A parent emails you angrily, saying their child\'s grade is unfair. How do you respond?', ar: 'وصلتك رسالة غاضبة من ولي أمر يقول إن درجة ابنه غير عادلة. كيف تتصرف؟' },
      { en: 'How do you work with colleagues — shared planning, professional learning communities, peer observation?', ar: 'كيف تعمل مع زملائك: التخطيط المشترك، مجتمعات التعلم المهنية، تبادل الزيارات؟' },
      { en: 'Why do you want to teach in a STEM school, and what will you add to our school?', ar: 'لماذا ترغب في التدريس في مدرسة STEM، وماذا ستضيف إلى مدرستنا؟' },
    ],
  },
};

export const SUBJECT = {
  // ------------------------------------------------------------------ AP Physics
  'AP Physics Teacher': { lang: 'en', questions: [
    { id: 'phy1', type: 'fundamental', q: 'A ball is thrown vertically upward. At the highest point, what are its velocity and acceleration? Which misconception do students often have here?',
      a: ['Velocity is momentarily zero at the top.', 'Acceleration is g ≈ 9.8 m/s² downward — the same throughout the flight (ignoring air resistance).',
        'Names the misconception: students think acceleration (or force) is zero at the top.', 'Explains why it cannot be zero: gravity is the only force still acting; if a = 0 the ball would stay at rest at the top.'] },
    { id: 'phy2', type: 'fundamental', q: 'Compare conservation of momentum and conservation of kinetic energy in collisions. Give an example.',
      a: ['Momentum is conserved in all collisions when the net external force is zero.', 'Kinetic energy is conserved only in elastic collisions.',
        'In inelastic collisions KE is transformed (heat, sound, deformation); perfectly inelastic = objects stick together, maximum KE loss.', 'Gives a correct example (e.g. trolleys / car crash) with correct reasoning or numbers.'] },
    { id: 'phy3', type: 'hot', q: 'Two identical bulbs are connected to the same ideal battery, first in series, then in parallel. Which arrangement is brighter, and what happens in each case if one bulb is removed?',
      a: ['Parallel: each bulb has the full battery voltage; series: each has half.', 'Using P = V²/R, each bulb in parallel dissipates 4× the power of a bulb in series → parallel is brighter.',
        'Series: removing one bulb opens the circuit — the other goes out.', 'Parallel: the other bulb stays equally bright (ideal battery); the battery supplies more current in parallel.'] },
    { id: 'phy4', type: 'hot', scenario: true, q: 'A student measures g with a simple pendulum and gets 12 m/s². How would you guide the student to find and reduce the error?',
      a: ['States the model T = 2π√(L/g), so g = 4π²L/T².', 'Identifies likely causes of a high g: length measured too long (not to the centre of the bob) or period too short (counting / timing error).',
        'Recommends timing 10–20 oscillations, repeating, small amplitude (< ~15°).', 'Recommends plotting T² against L for several lengths and using the gradient (4π²/g) to reduce random error.'] },
    { id: 'phy5', type: 'stem', q: 'Design a STEM lesson on energy transformation for Grade 10–11 (e.g. a wind turbine or solar car challenge). Describe the challenge, the physics, the process and the assessment.',
      a: ['Authentic problem linked to a real context (e.g. renewable energy in Qatar / Qatar National Vision 2030).', 'Clear physics content: energy forms, power = energy / time, efficiency, measured with meters or data loggers.',
        'Students follow the engineering design process: criteria & constraints, build, test, collect data, redesign.', 'Assessment: rubric for process and product plus individual explanation using their data; maths / technology integrated (graphs, calculations).'] },
  ] },

  // ------------------------------------------------------------------ AP Chemistry
  'AP Chemistry Teacher': { lang: 'en', questions: [
    { id: 'chm1', type: 'fundamental', q: 'Why does sodium chloride have a high melting point, and why does it conduct electricity only when molten or dissolved?',
      a: ['Giant ionic lattice of Na⁺ and Cl⁻ ions.', 'Strong electrostatic attraction in all directions needs a lot of energy to overcome → high melting point.',
        'In the solid, ions are fixed in place, so there are no mobile charge carriers.', 'When molten or in solution, the ions are free to move and carry charge (not electrons).'] },
    { id: 'chm2', type: 'fundamental', q: '2H₂ + O₂ → 2H₂O. 4 g of hydrogen react with 16 g of oxygen. Which is the limiting reactant and what mass of water forms?',
      a: ['Moles: H₂ = 4/2 = 2 mol; O₂ = 16/32 = 0.5 mol.', 'Ratio 2 : 1 → 0.5 mol O₂ needs only 1 mol H₂, so O₂ is limiting (H₂ in excess, 1 mol / 2 g left).',
        'Water formed = 1 mol.', 'Mass of water = 1 × 18 = 18 g.'] },
    { id: 'chm3', type: 'hot', q: 'Explain, using equilibrium and kinetics, why the Haber process (N₂ + 3H₂ ⇌ 2NH₃, exothermic) runs at about 450 °C and 200 atm with an iron catalyst. (Qatar\'s QAFCO is one of the world\'s largest ammonia producers.)',
      a: ['Exothermic: a low temperature favours a higher yield (Le Chatelier) but the rate is too slow → ~450 °C is a compromise.', 'High pressure favours the side with fewer moles (4 → 2) and increases rate; limited by cost and safety.',
        'The iron catalyst increases the rate by lowering activation energy but does not change the equilibrium position / yield.', 'Ammonia is removed by condensing and unreacted gases are recycled, giving a high overall conversion.'] },
    { id: 'chm4', type: 'hot', scenario: true, q: 'A student writes: "Breaking bonds releases energy." How do you diagnose and correct this misconception?',
      a: ['States the correct idea: breaking bonds always requires energy (endothermic); forming bonds releases energy (exothermic).', 'ΔH = energy to break bonds − energy released forming bonds.',
        'Explains where the misconception comes from (e.g. "energy stored in bonds", ATP / fuels) and uses an example such as methane combustion with bond enthalpies.', 'Uses an active strategy to correct it (prediction → evidence, calculation task, concept cartoon) and checks understanding afterwards.'] },
    { id: 'chm5', type: 'stem', q: 'Design an inquiry-based STEM lesson on water treatment or desalination, which Qatar depends on.',
      a: ['Real problem / driving question linked to Qatar\'s water supply.', 'Chemistry content: solutions, solubility, separation (filtration, distillation, reverse osmosis), measuring pH / conductivity / TDS.',
        'Students design, build and test a filter or solar still, controlling variables and recording data.', 'Data analysis, safety, and assessment with a rubric (evaluation of design, explanation of chemistry).'] },
  ] },

  // ------------------------------------------------------------------ AP Biology
  'AP Biology Teacher': { lang: 'en', questions: [
    { id: 'bio1', type: 'fundamental', q: 'Compare mitosis and meiosis, including their purposes.',
      a: ['Mitosis: one division → two genetically identical diploid cells; for growth, repair, asexual reproduction.', 'Meiosis: two divisions → four haploid, genetically different cells (gametes).',
        'Homologous chromosomes pair and separate in meiosis I.', 'Variation from crossing over and independent assortment.'] },
    { id: 'bio2', type: 'fundamental', q: 'Explain how enzymes work and how temperature and pH affect their activity.',
      a: ['Substrate binds a specific, complementary active site; the enzyme lowers activation energy.', 'Rate rises with temperature up to an optimum (more kinetic energy, more successful collisions).',
        'Above the optimum the enzyme denatures: bonds holding the tertiary structure break, the active site changes shape.', 'pH changes the charges on R-groups in the active site; each enzyme has its own optimum (e.g. pepsin ≈ 2, amylase ≈ 7).'] },
    { id: 'bio3', type: 'hot', q: 'A bacterial population is treated with an antibiotic. Most die, but later the population is resistant. Explain this, and address the idea that the bacteria "decided to adapt".',
      a: ['Variation already existed: some bacteria carried resistance alleles from random mutation (or gene transfer).', 'The antibiotic is a selection pressure: non-resistant bacteria die.',
        'Survivors reproduce and pass on the resistance allele; its frequency rises over generations.', 'Corrects the misconception: individuals do not change in response to need — populations evolve; links to completing antibiotic courses.'] },
    { id: 'bio4', type: 'hot', q: 'In a student experiment, the rate of photosynthesis increases with light intensity and then levels off. Interpret the graph and propose a follow-up investigation.',
      a: ['At low intensity, light is the limiting factor (rate rises with light).', 'At the plateau another factor is limiting — CO₂ concentration, temperature, or amount of chlorophyll / enzymes.',
        'Follow-up: raise CO₂ (e.g. sodium hydrogen carbonate) or temperature and expect a higher plateau.', 'Names the control variables and how the rate is measured (e.g. O₂ bubbles / volume per minute).'] },
    { id: 'bio5', type: 'stem', q: 'Design a STEM project on food security in Qatar, e.g. hydroponics or vertical farming.',
      a: ['Authentic context: food imports, water scarcity, heat in Qatar.', 'Biology content: plant nutrients, photosynthesis, transpiration, plant growth.',
        'Students design and build a system, monitoring pH / EC / temperature with sensors and measuring growth.', 'Maths and data: growth graphs, comparing conditions; presentation and rubric-based assessment.'] },
  ] },

  // ------------------------------------------------------------------ AP Mathematics
  'AP Mathematics Teacher': { lang: 'en', questions: [
    { id: 'mat1', type: 'fundamental', q: 'What does the derivative represent? For f(x) = x³ − 3x, find the stationary points and their nature.',
      a: ['The derivative is the instantaneous rate of change / gradient of the tangent (limit of the difference quotient).', 'f\'(x) = 3x² − 3.',
        'Stationary points at x = ±1: (−1, 2) and (1, −2).', 'f\'\'(x) = 6x → x = −1 is a maximum, x = 1 is a minimum.'] },
    { id: 'mat2', type: 'fundamental', scenario: true, q: 'A student writes (a + b)² = a² + b². How do you diagnose and correct this?',
      a: ['Identifies the misconception: "distributing" the power over addition.', 'Counter-example, e.g. a = b = 1 gives 4 ≠ 2.',
        'Area model: a square of side (a + b) shows the two rectangles making 2ab.', 'Correct expansion by distribution: a² + 2ab + b², with practice and a self-checking habit (substitute numbers).'] },
    { id: 'mat3', type: 'hot', q: 'Evaluate ∫₀¹ x eˣ dx and explain why the method works.',
      a: ['Chooses integration by parts with u = x, dv = eˣ dx.', '= [x eˣ]₀¹ − ∫₀¹ eˣ dx = e − (e − 1).',
        'Answer = 1.', 'Explains that integration by parts comes from the product rule, or checks by differentiating x eˣ − eˣ.'] },
    { id: 'mat4', type: 'hot', q: 'A farmer has 100 m of fencing to build a rectangular pen against a straight wall (the wall side needs no fence). Find the maximum area.',
      a: ['Sets up: two sides of length x, the third side 100 − 2x; A = x(100 − 2x).', 'A\'(x) = 100 − 4x = 0 → x = 25.',
        'Dimensions 25 m × 50 m; maximum area 1250 m².', 'Justifies the maximum (A\'\'= −4 < 0 or vertex of a parabola) and checks the domain 0 < x < 50.'] },
    { id: 'mat5', type: 'stem', q: 'Design a STEM lesson in which students build a mathematical model from real data (e.g. how fast a hot drink cools, or the best angle for a solar panel).',
      a: ['Real question with data collected by students (temperature probe, sensors, measurements).', 'Chooses a suitable model, e.g. Newton\'s law of cooling T = Tₐ + (T₀ − Tₐ)e^(−kt).',
        'Uses technology (spreadsheet / graphing tool) to fit the model — e.g. linearising with logarithms or regression.', 'Students interpret parameters, test predictions, discuss limits of the model; assessed with a rubric including communication.'] },
  ] },

  // ------------------------------------------------------------------ AP Computer Science
  'AP Computer Science Teacher': { lang: 'en', questions: [
    { id: 'cs1', type: 'fundamental', q: 'In Java, what is the difference between an array and an ArrayList, and when would you use each?',
      a: ['An array has a fixed size; an ArrayList resizes dynamically.', 'Arrays can hold primitives; ArrayList holds objects (wrapper classes with autoboxing).',
        'Syntax: arr.length and arr[i] vs list.size(), get(i), set(i, x), add, remove.', 'Sensible use case: array when the size is known / fixed; ArrayList when items are added or removed.'] },
    { id: 'cs2', type: 'fundamental', q: 'Compare linear search and binary search: time complexity and preconditions.',
      a: ['Linear search: O(n) — checks each element.', 'Binary search: O(log n) — halves the search range each step.',
        'Binary search requires the data to be sorted.', 'Example: about 1,000,000 items → about 20 comparisons for binary search vs up to 1,000,000 for linear.'] },
    { id: 'cs3', type: 'hot', scenario: true, q: 'Find the bugs: int sum = 0; for (int i = 1; i <= arr.length; i++) sum += arr[i]; double avg = sum / arr.length;',
      a: ['Loop starts at 1, so the first element is skipped (should start at 0).', 'i <= arr.length causes ArrayIndexOutOfBoundsException (should be <).',
        'sum / arr.length is integer division — cast: (double) sum / arr.length.', 'Handles the empty-array case (division by zero) and explains how to test with examples.'] },
    { id: 'cs4', type: 'hot', q: 'Explain recursion with an example. What happens if there is no base case, and how do you help students trace recursive calls?',
      a: ['A method that calls itself on a smaller version of the problem.', 'Correct example with a base case, e.g. factorial(n) = n × factorial(n − 1), factorial(0) = 1.',
        'With no base case (or one never reached), calls never stop → StackOverflowError.', 'Teaching strategy: trace the call stack with a diagram / table, unplugged activity or visualiser.'] },
    { id: 'cs5', type: 'stem', q: 'Design a STEM lesson where students program a micro:bit / Arduino with a sensor to solve a real problem (e.g. smart irrigation, classroom air-quality monitor).',
      a: ['Real problem and clear success criteria.', 'Computational thinking: decomposition, algorithm / flowchart before coding.',
        'Sensor input → conditions / loops → output (alert, motor, display), with testing, debugging and iteration.', 'Data logging and analysis, plus assessment with a rubric (code, product, explanation, ethics / data use).'] },
  ] },

  // ------------------------------------------------------------------ Design Technology
  'AP Design Technology Teacher': { lang: 'en', questions: [
    { id: 'dt1', type: 'fundamental', q: 'Explain the stages of the design cycle and what students produce at each stage.',
      a: ['Inquire / analyse: identify the need, research, write a design specification.', 'Develop ideas: sketches, several concepts, select the best against the specification.',
        'Create: plan, model and build a prototype using appropriate tools and techniques.', 'Evaluate: test against the specification, gather user feedback, suggest improvements (iterate).'] },
    { id: 'dt2', type: 'fundamental', q: 'Compare thermoplastics and thermosetting plastics, with examples and uses.',
      a: ['Thermoplastics soften when heated and can be reshaped / recycled (e.g. PLA, ABS, acrylic, PET).', 'Thermosets set permanently when cured and do not soften when reheated (e.g. epoxy, melamine, urea-formaldehyde).',
        'Explains the structure: thermosets have cross-links between polymer chains; thermoplastics do not.', 'Chooses correctly for a use, e.g. a thermoset for a pan handle or electrical fitting, a thermoplastic for 3D printing / bottles.'] },
    { id: 'dt3', type: 'hot', scenario: true, q: 'A student\'s 3D-printed bracket keeps breaking at the same point. How do you guide the student to solve the problem?',
      a: ['Analyses the failure: where it breaks and the type of load (bending, tension).', 'Print orientation: layers are weakest between each other — orient so the load runs along the layers.',
        'Design changes: increase wall thickness / infill, add fillets to remove sharp corners (stress concentration), or change material.', 'Systematic testing — change one variable at a time and record results.'] },
    { id: 'dt4', type: 'hot', q: 'How do you teach students to design sustainable products?',
      a: ['Life-cycle thinking: materials, manufacture, transport, use, end of life.', 'The 6 Rs: reduce, reuse, recycle, rethink, refuse, repair.',
        'Design strategies: design for disassembly, local / recycled materials, energy efficiency.', 'Builds sustainability into the design brief and evaluation criteria, so students must justify their choices.'] },
    { id: 'dt5', type: 'stem', q: 'Design a STEM project in which students design a shading device to reduce heat in the school courtyard.',
      a: ['Authentic problem: heat in Qatar and a real user (students, staff).', 'Science and maths: heat transfer, reflectivity, sun angle, scale drawings and measurements.',
        'CAD, prototyping and testing with temperature sensors — comparing with and without shading.', 'Evaluation against criteria, presentation to an audience, rubric-based assessment.'] },
  ] },

  // ------------------------------------------------------------------ STEM
  'STEM Teacher': { lang: 'en', questions: [
    { id: 'stem1', type: 'fundamental', q: 'What does integrated STEM mean, and how is it different from teaching science, technology, engineering and mathematics separately?',
      a: ['Learning is organised around a real problem or challenge that needs more than one discipline.', 'The engineering design process frames the work.',
        'Science and mathematics concepts are applied purposefully, with technology as a tool.', 'Student-centred and collaborative; develops 21st-century skills (problem solving, communication, creativity).'] },
    { id: 'stem2', type: 'fundamental', q: 'Describe the engineering design process you use with students.',
      a: ['Define the problem with criteria and constraints.', 'Research and brainstorm possible solutions; choose one with justification.',
        'Plan and build a prototype.', 'Test, evaluate, improve (iterate) and communicate the results.'] },
    { id: 'stem3', type: 'hot', scenario: true, q: 'In a bridge-building challenge every group\'s bridge fails early. How do you turn this failure into learning?',
      a: ['Treats failure as data and part of the process (growth mindset).', 'Analyses the failure mode: where and why it failed (tension / compression, weak joints).',
        'Links back to the science: forces, triangulation / trusses, load distribution.', 'Students redesign, change one variable, retest and reflect in their engineering notebooks.'] },
    { id: 'stem4', type: 'hot', q: 'How do you assess individual learning in a group STEM project?',
      a: ['Clear individual roles and accountability.', 'Individual evidence: engineering notebook / journal, reflection.',
        'Rubric covering both process and product, plus individual questioning or presentation.', 'Peer and self assessment, and short checks of content knowledge (quiz, exit ticket).'] },
    { id: 'stem5', type: 'stem', q: 'Plan a two-week STEM project on a local issue (e.g. water scarcity, renewable energy, heat in Qatar).',
      a: ['Driving question and authentic local context.', 'Explicit science and maths learning outcomes, not only an activity.',
        'Design challenge with criteria, constraints and materials; data collection and analysis.', 'Final product presented to a real audience and assessed with a rubric.'] },
  ] },

  // ------------------------------------------------------------------ English
  'English Teacher': { lang: 'en', questions: [
    { id: 'eng1', type: 'fundamental', q: 'Explain active and passive voice, and when the passive is appropriate — for example in scientific writing.',
      a: ['Active: the subject does the action ("The student heated the water").', 'Passive: be + past participle; the object becomes the subject ("The water was heated").',
        'The passive is used when the agent is unknown or unimportant, and for an objective tone in lab reports.', 'Notes that overuse reduces clarity, and gives a correct example of converting between the two.'] },
    { id: 'eng2', type: 'fundamental', q: 'What strategies do you use to teach reading comprehension of informational (non-fiction) texts?',
      a: ['Pre-reading: activate prior knowledge, pre-teach key vocabulary.', 'Text structure and skimming / scanning (cause-effect, compare-contrast, headings).',
        'During reading: annotation, graphic organisers, questions at different levels including inference.', 'After reading: summarising / paraphrasing and checking understanding.'] },
    { id: 'eng3', type: 'hot', q: 'How do you teach students to evaluate the credibility of an online source or an argument?',
      a: ['Criteria such as currency, relevance, authority, accuracy, purpose.', 'Identify claim, evidence and reasoning.',
        'Detect bias and logical fallacies.', 'Practical task, e.g. compare two articles on the same scientific issue and justify which is more reliable.'] },
    { id: 'eng4', type: 'hot', scenario: true, q: 'A student\'s essay has excellent ideas but weak organisation. What feedback do you give, and how?',
      a: ['Specific, actionable feedback linked to the success criteria / rubric — praise the ideas.', 'Models structure: thesis, topic sentences, paragraphing, cohesive devices.',
        'Uses conferencing and a revision cycle (the student rewrites).', 'Student self-assesses or peer-assesses against the rubric to build independence.'] },
    { id: 'eng5', type: 'stem', q: 'Design an English lesson integrated with STEM, e.g. students write a technical proposal or pitch for an invention that solves a local problem.',
      a: ['Authentic STEM context and a real audience.', 'Clear language targets: technical vocabulary, report / proposal structure, passive voice, hedging.',
        'Reads a model scientific or technical text before writing.', 'Collaborative project with an oral presentation; rubric assessing language and content.'] },
  ] },

  // ------------------------------------------------------------------ Physical Education
  'Physical Education Teacher': { lang: 'ar', questions: [
    { id: 'pe1', type: 'fundamental', q: 'اشرح مبادئ التدريب الرياضي الأساسية مع مثال لكل مبدأ.',
      a: ['الحمل الزائد: زيادة الشدة أو الحجم فوق المعتاد لتحقيق التكيف.', 'الخصوصية: التدريب يطوّر القدرة أو العضلات المستخدمة فيه تحديداً.',
        'التدرج: زيادة الحمل تدريجياً وبشكل آمن.', 'الاستمرارية / الانعكاسية: التوقف عن التدريب يفقد المكتسبات تدريجياً.'] },
    { id: 'pe2', type: 'fundamental', q: 'ما مكونات اللياقة البدنية المرتبطة بالصحة، وكيف تقيس كل مكوّن؟',
      a: ['التحمل الدوري التنفسي: اختبار الجري المكوكي (Beep test) أو جري 1600 م.', 'القوة والتحمل العضلي: اختبار الضغط أو تمرين البطن.',
        'المرونة: اختبار الجلوس والوصول.', 'تكوين الجسم: مؤشر كتلة الجسم أو محيط الخصر أو نسبة الدهون.'] },
    { id: 'pe3', type: 'hot', q: 'لماذا يرتفع معدل ضربات القلب أثناء التمرين؟ وكيف تستخدم "مناطق معدل ضربات القلب" لتصميم تمرين لطالب عمره 16 سنة؟',
      a: ['العضلات تحتاج مزيداً من الأكسجين والطاقة والتخلص من ثاني أكسيد الكربون، فيزيد القلب من ضخ الدم.', 'الحد الأقصى التقريبي = 220 − العمر = 204 نبضة/دقيقة.',
        'مناطق التدريب: نحو 60–70٪ للتحمل الهوائي، ونحو 70–85٪ لتدريب أعلى شدة (≈ 122–173 نبضة).', 'يستخدم أجهزة قياس النبض أو القياس اليدوي ويعدّل الشدة بناءً على البيانات.'] },
    { id: 'pe4', type: 'hot', q: 'كيف تشرح للطلاب علمياً لماذا يثني لاعب الوثب ركبتيه قبل القفز وعند الهبوط؟',
      a: ['ثني الركبتين يطيل مسافة وزمن تطبيق القوة فيزيد الدفع (الدفع = القوة × الزمن).', 'تخزين الطاقة المرنة في العضلات والأوتار (دورة الإطالة ثم التقصير).',
        'قانون نيوتن الثالث: اللاعب يدفع الأرض فتدفعه الأرض بقوة رد فعل.', 'عند الهبوط يزيد ثني الركبتين زمن التوقف فتقل القوة على المفاصل ويقل خطر الإصابة.'] },
    { id: 'pe5', type: 'stem', q: 'صمّم حصة تربية رياضية قائمة على STEM، مثل تحليل سرعة العدو أو النبض باستخدام التقنية.',
      a: ['هدف تعلم واضح ومشكلة أو سؤال حقيقي.', 'جمع بيانات بأدوات تقنية: مؤقت، تطبيق تحليل فيديو، جهاز قياس النبض.',
        'تحليل رياضي: السرعة = المسافة ÷ الزمن، رسوم بيانية ومقارنات.', 'تصميم خطة تحسين يجربها الطلاب، وتقويم بمعايير واضحة.'] },
  ] },

  // ------------------------------------------------------------------ Arabic
  'Arabic Teacher': { lang: 'ar', questions: [
    { id: 'ar1', type: 'fundamental', q: 'أعرب الجملة: "كان الطلابُ مجتهدين في المختبرِ".',
      a: ['كان: فعل ماضٍ ناقص (ناسخ) مبني على الفتح.', 'الطلابُ: اسم كان مرفوع وعلامة رفعه الضمة الظاهرة.',
        'مجتهدين: خبر كان منصوب وعلامة نصبه الياء لأنه جمع مذكر سالم.', 'في المختبرِ: جار ومجرور (اسم مجرور بالكسرة)، وشبه الجملة متعلق بـ "مجتهدين".'] },
    { id: 'ar2', type: 'fundamental', q: 'ما الفرق بين همزة القطع وهمزة الوصل؟ وكيف تعلّمه للطلاب؟',
      a: ['همزة القطع تُنطق وتُكتب في أول الكلام ووسطه (مثل: أكرمَ، أخذ، إكرام).', 'همزة الوصل تُنطق في البدء وتسقط في درج الكلام ولا تُكتب عليها همزة (مثل: استخرج، ابن، ال التعريف).',
        'القاعدة: ماضي الرباعي وأمره ومصدره همزته قطع، وماضي الخماسي والسداسي وأمرهما ومصدرهما همزته وصل.', 'استراتيجية تدريس: إدخال الواو أو الفاء قبل الكلمة، فإن نُطقت الهمزة فهي قطع، مع تدريبات تطبيقية.'] },
    { id: 'ar3', type: 'hot', q: 'وضّح الصورة البيانية في قولنا: "العلمُ نورٌ والجهلُ ظلامٌ"، وبيّن أثرها في المعنى.',
      a: ['تشبيه بليغ: حُذفت أداة التشبيه ووجه الشبه.', 'وجه الشبه: الهداية والوضوح في العلم، والضلال والحيرة في الجهل.',
        'الطباق بين "نور" و"ظلام" و"العلم" و"الجهل" يبرز المعنى بالتضاد.', 'الأثر: تقوية المعنى وتوضيحه والإقناع بقيمة العلم.'] },
    { id: 'ar4', type: 'hot', q: 'كيف تنمّي مهارات التفكير الناقد لدى الطلاب عند تحليل مقال أو نص أدبي؟',
      a: ['أسئلة في مستويات التفكير العليا (تحليل، تقويم، إبداع) وليس التذكر فقط.', 'تحديد الفكرة الرئيسة والحجة والأدلة ومدى قوتها.',
        'الموازنة بين نصين أو رأيين، وإبداء الرأي مع التعليل والاستشهاد.', 'استراتيجيات منظمة مثل القبعات الست أو خرائط التفكير، مع نشاط كتابي أو حواري.'] },
    { id: 'ar5', type: 'stem', q: 'صمّم درساً في اللغة العربية مرتبطاً بـ STEM، مثل قراءة نص علمي عن الطاقة الشمسية في قطر وكتابة تقرير أو مقال إقناعي.',
      a: ['نص علمي أو مشكلة واقعية مرتبطة بالبيئة المحلية.', 'أهداف لغوية واضحة: المصطلحات العلمية، أدوات الربط، بنية التقرير أو المقال الإقناعي.',
        'نشاط تعاوني ينتج عنه منتج (تقرير، عرض شفهي، ملصق رقمي) مع توظيف التقنية.', 'تقويم بسلّم تقدير يشمل اللغة والمحتوى والعرض.'] },
  ] },

  // ------------------------------------------------------------------ Islamic Education
  'Islamic Education Teacher': { lang: 'ar', questions: [
    { id: 'isl1', type: 'fundamental', q: 'عرّف الحديث الصحيح واذكر شروطه.',
      a: ['اتصال السند من أوله إلى منتهاه.', 'عدالة الرواة وضبطهم.',
        'السلامة من الشذوذ (ألا يخالف الثقة من هو أوثق منه).', 'السلامة من العلة القادحة.'] },
    { id: 'isl2', type: 'fundamental', q: 'ما الضروريات الخمس في مقاصد الشريعة؟ اذكر مثالاً لكل منها.',
      a: ['يذكر الخمس: حفظ الدين، والنفس، والعقل، والنسل (العرض)، والمال.', 'يقدّم أمثلة صحيحة لأحكام شرعية تحفظ كل مقصد (مثل تحريم الخمر لحفظ العقل).',
        'يوضح أن الأحكام الشرعية جاءت لتحقيق المصالح ودفع المفاسد.', 'يربط المقاصد بقضايا معاصرة يعيشها الطلاب (السلامة المرورية، الإدمان الرقمي، حماية البيانات...).'] },
    { id: 'isl3', type: 'hot', q: 'كيف توظّف قوله تعالى: ﴿إِنَّ فِي خَلْقِ السَّمَاوَاتِ وَالْأَرْضِ وَاخْتِلَافِ اللَّيْلِ وَالنَّهَارِ لَآيَاتٍ لِّأُولِي الْأَلْبَابِ﴾ (آل عمران: 190) لربط التربية الإسلامية بالعلوم؟',
      a: ['يبيّن أن القرآن يدعو إلى التفكر والملاحظة والنظر في الكون.', 'يربط الآية بظاهرة علمية مناسبة (دوران الأرض وتعاقب الليل والنهار) بنشاط استقصائي.',
        'يحذّر من التكلّف في التفسير العلمي ويفرّق بين الحقائق الثابتة والنظريات.', 'يستخرج قيماً: شكر الخالق، والاستخلاف والمسؤولية تجاه البيئة.'] },
    { id: 'isl4', type: 'hot', scenario: true, q: 'سألك طالب بأسلوب فيه تشكيك: "لماذا نصلي خمس مرات في اليوم؟" كيف تتعامل مع سؤاله؟',
      a: ['يحترم السؤال ويشجع الطالب على التفكير دون توبيخ أو إحراج.', 'يقدّم الدليل الشرعي من القرآن والسنة الصحيحة.',
        'يوضح الحِكم والآثار التربوية والنفسية والاجتماعية للصلاة.', 'يدير حواراً هادئاً بالحجة ويتابع الطالب فردياً عند الحاجة.'] },
    { id: 'isl5', type: 'stem', q: 'صمّم درساً عن ترشيد استهلاك الماء مرتبطاً بـ STEM.',
      a: ['ينطلق من نصوص صحيحة، مثل ﴿وَكُلُوا وَاشْرَبُوا وَلَا تُسْرِفُوا﴾ (الأعراف: 31) وكان النبي ﷺ يتوضأ بالمُدّ (متفق عليه).', 'يجمع الطلاب بيانات بقياس كمية الماء المستخدمة في الوضوء باللتر ويمثلونها بيانياً.',
        'يربط الدرس بشح المياه في قطر والاعتماد على التحلية.', 'يصمّم الطلاب حلاً أو حملة توعوية، مع تقويم بمعايير واضحة.'] },
  ] },

  // ------------------------------------------------------------------ Social Studies
  'Social Studies Teacher': { lang: 'ar', questions: [
    { id: 'soc1', type: 'fundamental', q: 'ما ركائز رؤية قطر الوطنية 2030؟ اشرح كلاً منها باختصار.',
      a: ['التنمية البشرية: التعليم والصحة وبناء القدرات.', 'التنمية الاجتماعية: الأسرة والهوية والتماسك الاجتماعي.',
        'التنمية الاقتصادية: اقتصاد متنوع قائم على المعرفة.', 'التنمية البيئية: حماية البيئة والتوازن بين التنمية والاستدامة.'] },
    { id: 'soc2', type: 'fundamental', q: 'ما العوامل المؤثرة في مناخ دولة قطر؟',
      a: ['الموقع الفلكي قرب مدار السرطان (نحو 25° شمالاً): ارتفاع درجات الحرارة.', 'شبه جزيرة يحيط بها الخليج العربي: ارتفاع الرطوبة.',
        'قلة الأمطار وانبساط السطح وعدم وجود مرتفعات.', 'الرياح الموسمية (مثل رياح الشمال) والعواصف الترابية.'] },
    { id: 'soc3', type: 'hot', q: 'حلّل أثر اكتشاف النفط والغاز على المجتمع القطري.',
      a: ['اقتصادياً: التحول من الغوص على اللؤلؤ والصيد والتجارة إلى اقتصاد الطاقة (حقل الشمال والغاز المسال).', 'اجتماعياً: التوسع في التعليم والصحة والتحضر وزيادة العمالة الوافدة.',
        'تحديات: الاعتماد على مورد واحد، والحاجة إلى التنويع الاقتصادي.', 'بيئياً واستدامةً: الربط بالتنمية المستدامة ورؤية 2030.'] },
    { id: 'soc4', type: 'hot', q: 'كيف تعلّم الطلاب التمييز بين المصادر الأولية والثانوية وتقييم موثوقيتها؟',
      a: ['المصدر الأولي: وثيقة أو صورة أو شهادة معاصرة للحدث.', 'المصدر الثانوي: تحليل أو تفسير لاحق (كتب، مقالات).',
        'أسئلة التقييم: من كتبه؟ متى؟ ولماذا؟ وما احتمال التحيز؟', 'نشاط عملي بمقارنة مصدرين عن الحدث نفسه وإصدار حكم معلّل.'] },
    { id: 'soc5', type: 'stem', q: 'صمّم درساً يستخدم الخرائط الرقمية ونظم المعلومات الجغرافية (GIS) والبيانات لدراسة النمو العمراني في الدوحة.',
      a: ['سؤال استقصائي واضح عن التغير العمراني.', 'استخدام أدوات تقنية: صور الأقمار الصناعية عبر السنوات، Google Earth، خرائط GIS.',
        'تحليل بيانات (السكان، المساحات) وتمثيلها بيانياً.', 'اقتراح حلول تخطيطية مستدامة، وتقويم بمعايير واضحة.'] },
  ] },
};

// questions for a job title (by its English name), or null
export const subjectSetFor = (title) => (title ? SUBJECT[title.name_en] || null : null);
export const setMax = (set) => set.questions.reduce((a, q) => a + q.a.length, 0);
