/**
 * Step-by-step "how do I actually use this" guides for the two portals,
 * rendered by the User Guides section on the /faq page.
 *
 * Deliberately non-technical: every step is written for someone who has never
 * seen the product, names the screen they are looking at (`where`) rather than
 * an endpoint, and never mentions a component, API or setting.
 *
 * Icon keys are resolved in `components/features/faq/guides/guideIcons.js`,
 * keeping this file framework-agnostic — same convention as `constants/faq.js`.
 */

const STUDENT_GUIDE = {
  id: "student",
  label: "Student Guide",
  shortLabel: "Students",
  audience: "For scholars, athletes and founders",
  icon: "GraduationCap",
  headline: "Everything you can do inside the Student Portal.",
  summary:
    "From the day you sign up to the day your certificate is issued — how to pick a pathway, work through a course, hand in your assignments, keep your streak alive, and turn points into rewards.",
  portalLabel: "Open the Student Portal",
  portalRoute: "STUDENT_PORTAL",
  chapters: [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: "Rocket",
      summary:
        "Create your account, tell us about yourself, and land in the portal with a plan already built for you.",
      steps: [
        {
          title: "Create your account",
          body:
            "Choose Sign Up in the top navigation, or press any Enroll button on the site. You will need a working email address and a password. If you are under 18, set this up together with a parent or guardian — they can use the same details to check in on your progress.",
          where: "Top navigation → Sign Up",
        },
        {
          title: "Answer the short questionnaire",
          body:
            "A handful of questions about your sport, your grade, and what you want out of the year. There are no wrong answers — they only decide which pathway we put in front of you first.",
          where: "Onboarding → Questionnaire",
          tip: "Answer honestly rather than ambitiously. A pathway that matches where you are now is the one you will actually finish.",
        },
        {
          title: "Review your recommended pathway",
          body:
            "A pathway is a bundle of courses arranged in order, built to take you from where you are to one specific outcome. We recommend one based on your answers and tell you why we picked it.",
          where: "Onboarding → Pathway",
        },
        {
          title: "Preview it before you pay",
          body:
            "Open the preview to see every course inside the pathway, the order they run in, and what you will be able to do by the end. Nothing is charged at this step.",
          where: "Onboarding → Preview",
        },
        {
          title: "Check out",
          body:
            "Confirm your pathway and complete payment. This is not a lock-in: you can add a second pathway, or build one of your own, at any point later.",
          where: "Onboarding → Checkout",
        },
        {
          title: "Step into your portal",
          body:
            "Once payment clears, the final step hands you a button straight into your Student Portal, with every course from your pathway already waiting. From then on, just log in from the top navigation and you will land there automatically.",
          where: "Onboarding → Access",
        },
      ],
    },
    {
      id: "pathways-courses",
      title: "Choosing Pathways & Courses",
      icon: "Compass",
      summary:
        "Browse by who you are, follow a ready-made pathway, or assemble your own bundle course by course.",
      steps: [
        {
          title: "Start from who you are",
          body:
            "The homepage opens with audience cards — Student Athletes, Cool Nerds, Parents, Coaches, Entrepreneurs, and Institutions. Pick the one that describes you and you will only be shown the pathways written for that audience.",
          where: "Home → Who We Serve",
        },
        {
          title: "Browse the full pathway catalog",
          body:
            "The Pathways page lists every published pathway with the courses inside it, the level it is pitched at, and the price. One pathway can appear under several audiences, so you may recognise a few from your audience page.",
          where: "Top navigation → Pathways",
        },
        {
          title: "Open a pathway before buying",
          body:
            "Each pathway has its own page with a roadmap of the courses in sequence, what the pathway is for, and who teaches it. The buy bar follows you down the page so you never have to scroll back up.",
          where: "Pathways → any pathway card",
        },
        {
          title: "Or pick individual courses",
          body:
            "Prefer to go course by course? The Curriculum page lists the full catalog and lets you narrow it by audience, grade band and level until you find the right one.",
          where: "Top navigation → Curriculum",
        },
        {
          title: "Build your own pathway",
          body:
            "Choose Build Your Own on the Pathways page to assemble a private bundle from any courses you like. The price is worked out from the courses you picked, and courses you are already enrolled in cannot be added twice.",
          where: "Pathways → Build Your Own",
          tip: "A bundle you have built is yours alone — nobody else sees it in the catalog. Once you have bought it, it is locked, so get the course list right before you check out.",
        },
        {
          title: "Save for later, then check out",
          body:
            "Anything you are not ready to buy can go on your Wishlist. When you are ready, the Cart holds your pathways and courses together so you can pay for everything in one go.",
          where: "Top navigation → Cart / Wishlist",
        },
      ],
    },
    {
      id: "inside-a-course",
      title: "Working Through a Course",
      icon: "BookOpen",
      summary:
        "How a course is laid out, what the different lesson types look like, and the one action that moves your progress bar.",
      steps: [
        {
          title: "Find it in My Courses",
          body:
            "Every course you own appears under My Courses with the share you have completed so far. The list is where you come back to each session — it remembers everything you have finished.",
          where: "Student Portal → Dashboard → My Courses",
        },
        {
          title: "Open the course",
          body:
            "The course page opens on an overview — what the course covers, who teaches it, and the full list of modules. A module is simply a chapter, and each one holds its own lessons, assignment and quiz.",
        },
        {
          title: "Work the modules in order",
          body:
            "Modules are arranged in the order the instructor intended. You can jump around, but each one assumes you have done the one before it.",
        },
        {
          title: "Know the lesson formats",
          body:
            "Lessons come as written pages, videos, PDFs and documents you can read in place, and images. You do not need any extra software — everything opens inside the portal, on a phone as readily as a laptop.",
        },
        {
          title: "Mark each lesson complete",
          body:
            "This is the one step people miss. Your progress only moves when you press Mark Complete at the end of a lesson — reading it is not enough. Do it as you finish each lesson and your course percentage stays honest.",
          tip: "If your progress bar looks stuck, scroll back through the module for a lesson you read but never marked complete.",
        },
        {
          title: "Download the module handout",
          body:
            "Most modules finish with a downloadable handout — a PDF or Word document covering the module's key points. Download it, print it, write on it. It is yours to keep whether or not you are logged in.",
        },
        {
          title: "Finish the course",
          body:
            "When every lesson, assignment and quiz in the course is done, the course reads as complete and your certificate is issued automatically. You will find it waiting under Certificates.",
        },
      ],
    },
    {
      id: "assignments-quizzes",
      title: "Assignments & Quizzes",
      icon: "ClipboardList",
      summary:
        "Where to find what is due, how to hand work in, and how your marks and feedback come back to you.",
      steps: [
        {
          title: "See everything that is due",
          body:
            "My Assignments gathers every assignment from every course you are enrolled in, with its due date and whether you have handed it in yet. Check it at the start of a session rather than hunting course by course.",
          where: "Student Portal → Dashboard → My Assignments",
        },
        {
          title: "Hand in your work",
          body:
            "Open an assignment to read the brief, then write your response directly in the box, attach your files, or both — whichever the instructor asked for. Submit before the due date shown on the assignment.",
        },
        {
          title: "Get your marks and feedback",
          body:
            "Once your instructor has reviewed it, your marks and their written feedback appear on the submission itself. Some assignments are scored by our Elite Coach AI against the instructor's criteria first — your instructor still reads it and can change the mark.",
          tip: "Feedback is where the real value is. Read it before you start the next module, not after you have finished the course.",
        },
        {
          title: "Take a quiz",
          body:
            "My Quizzes lists every quiz available to you. Quizzes are multiple choice, run inside the portal, and are scored the moment you finish.",
          where: "Student Portal → Dashboard → My Quizzes",
        },
        {
          title: "Review your result",
          body:
            "After submitting you get your score along with the questions you answered. Whether you can attempt a quiz again depends on what the instructor allowed — the quiz panel tells you before you start.",
        },
      ],
    },
    {
      id: "daily-habits",
      title: "Your Daily Habits",
      icon: "CalendarCheck",
      summary:
        "The short, repeatable work that compounds: one drill, three quests, and the class chat.",
      steps: [
        {
          title: "Run the Daily Drill",
          body:
            "One situation a day, drawn from the kind of moment athletes actually face — an agent's message, a booster's offer, a coach's call. Read it, pick the response you would really give, and get scored on the spot. It takes about two minutes.",
          where: "Student Portal → Daily Activity → Daily Drill",
        },
        {
          title: "Protect your streak",
          body:
            "Finishing a drill extends your streak by a day; skipping a day ends it. Your current streak sits in the portal header — press it to see your full history and how close you are to your best run.",
          where: "Student Portal header → streak chip",
        },
        {
          title: "Take on your Daily Quests",
          body:
            "Three real-world tasks a day — delete three off-brand posts, record a fifteen-second teammate highlight, that kind of thing. These are not quizzes. There is no right answer and nothing to grade: you go and do them away from the screen.",
          where: "Student Portal → Daily Activity → Daily Quests",
        },
        {
          title: "Mark a quest done",
          body:
            "Press Complete when you have genuinely done it, and add proof if you have something to show — a link or a screenshot. We trust you on this, and your points land immediately. Nobody is queued up to approve it.",
        },
        {
          title: "Talk in the War Room",
          body:
            "Every course has a War Room — a group chat with your instructor and the classmates taking the same course. It is the fastest place to ask when something in a lesson has not landed.",
          where: "Student Portal → Daily Activity → War Room",
        },
      ],
    },
    {
      id: "coaching-tools",
      title: "Coaching Tools & Live Sessions",
      icon: "Sparkles",
      summary:
        "The practice rooms: rehearse a hard conversation, get your media kit torn apart kindly, and sit in on live sessions.",
      steps: [
        {
          title: "Practise saying no in the Tactical Wargamer",
          body:
            "A role-play where someone — family, a friend, somebody from your community — asks you for money, access or time, and does not take a soft no for an answer. You type your side of the conversation and the other person answers back in character.",
          where: "Student Portal → Tactical Wargamer",
        },
        {
          title: "Use the A.B.P. method",
          body:
            "Three moves, always in this order. Acknowledge, so the no does not land cold. Boundary, stated plainly enough that it cannot be read as a maybe. Pivot, offering the thing you can actually give. Your run is scored on all three.",
          tip: "Set the boundary early — within roughly the first fifteen seconds of the conversation. A no that arrives in the fourth message has already been read as a yes.",
        },
        {
          title: "Read the report, then the model answer",
          body:
            "When the scene ends you get a score against each of the three moves, the point where your boundary actually landed, and a note if you leaned on an excuse you do not really have. The model answer only unlocks once you are finished — reading it first turns practice into copying.",
        },
        {
          title: "Get your media kit critiqued",
          body:
            "Upload your one-page sponsorship media kit to the Brand Validator and it comes back reviewed in the voice of a local business owner being pitched, not a teacher marking homework. Send a PDF, PNG, JPG or WEBP — it needs to see your page as designed, so Word files are not accepted.",
          where: "Student Portal → Brand Validator",
        },
        {
          title: "Wait out the review",
          body:
            "A review takes a minute or two and you can only have one running at a time. Leave the page open or come back to it later — the result will be there either way.",
        },
        {
          title: "Ask an Advisor",
          body:
            "A private message thread to a real member of the advisory team — not a bot. Ask your question, and their reply arrives back in the same thread. Use it for the things the War Room is too public for.",
          where: "Student Portal → Ask an Advisor",
        },
        {
          title: "Drop in on War Room Live",
          body:
            "Monthly audio sessions where current college athletes talk about building a brand while still in high school. RSVP from the session card to hold your place.",
          where: "Student Portal → War Room Live",
        },
        {
          title: "Join at the right moment",
          body:
            "The join button appears fifteen minutes before the session starts and stays open until fifteen minutes after it ends — so there is no link to lose or share around early. Miss one and check back later: finished sessions often carry a recording.",
        },
      ],
    },
    {
      id: "points-rewards",
      title: "Points, Rewards & Certificates",
      icon: "Trophy",
      summary:
        "What the work pays out, where the balance lives, and how to prove what you have finished.",
      steps: [
        {
          title: "Know where points come from",
          body:
            "Daily drills, completed quests and finished Wargamer runs all pay into the same balance. Coursework builds your progress and your certificates; the daily habits build your points.",
        },
        {
          title: "Check your balance",
          body:
            "The Rewards tab shows your current balance alongside every transaction that produced it, so you can always see exactly what paid out and when.",
          where: "Student Portal → Rewards",
        },
        {
          title: "Redeem something",
          body:
            "The rewards catalog lists what your points can be exchanged for and what each one costs. Redeem one and you can follow its status through to the moment it is fulfilled.",
          tip: "Points are never silently taken away. If a balance looks wrong, the transaction list will show you why.",
        },
        {
          title: "Collect your certificates",
          body:
            "Finishing a course issues its certificate automatically — there is nothing to apply for. Open Certificates to view one, and share it with a coach, counselor or recruiter as proof of the work.",
          where: "Student Portal → Certificates",
        },
        {
          title: "Keep your profile current",
          body:
            "Your name and details carry onto your certificates, so it is worth checking your profile is right before you start sending them anywhere.",
          where: "Account menu → Profile",
        },
      ],
    },
  ],
  quickTips: [
    {
      title: "It works on your phone",
      body:
        "Every part of the portal — lessons, drills, quizzes, submissions — runs in a mobile browser. There is no app to install.",
    },
    {
      title: "Your progress bar is not moving",
      body:
        "Almost always a lesson you read but never marked complete. Open the module and look for the one without a tick.",
    },
    {
      title: "A course you paid for is missing",
      body:
        "Check you are signed in to the account you bought it with. If it is still missing, message the advisory team and they will trace the purchase.",
    },
    {
      title: "You are stuck on coursework",
      body:
        "Ask in that course's War Room first — your instructor and classmates are already there. Use Ask an Advisor for anything personal.",
    },
  ],
};

const TEACHER_GUIDE = {
  id: "teacher",
  label: "Teacher Guide",
  shortLabel: "Teachers",
  audience: "For faculty and instructors",
  icon: "Presentation",
  headline: "Everything you can do inside the Teacher Portal.",
  summary:
    "Set up your profile, build a course from empty to published, enrol and track your students, grade their work, and raise a flag when something needs the admin team.",
  portalLabel: "Open the Teacher Portal",
  portalRoute: "TEACHER_PORTAL",
  chapters: [
    {
      id: "signing-in",
      title: "Getting Into Your Portal",
      icon: "KeyRound",
      summary:
        "Where to sign in, what the dashboard is telling you, and how the sidebar is organised.",
      steps: [
        {
          title: "Sign in with the account you were issued",
          body:
            "Your account is created for you by the admin team, so there is no sign-up step. Log in from the top navigation and you will be taken straight to the Teacher Portal.",
          where: "Top navigation → Login",
        },
        {
          title: "Read your Analytics Dashboard",
          body:
            "The landing tab gathers your courses, how many students are enrolled across them, and how active those students have been. It also offers an AI class report — a written read on how your group is doing, for when the numbers alone are not telling you much.",
          where: "Teacher Portal → Analytics Dashboard",
        },
        {
          title: "Find your way around the sidebar",
          body:
            "Everything is one click from the left-hand sidebar: your profile, your courses, enrollment, progress, the War Room, requests and concerns, plus manuals and curriculum documents. Nothing is buried more than one level deep.",
        },
        {
          title: "Bookmark the tab you live in",
          body:
            "Whichever tab you are on is kept in the page address, so you can bookmark Progress or Enrollment & Scores and come straight back to it next time.",
          tip: "If you work across several courses, bookmarking Progress saves you three clicks every single session.",
        },
      ],
    },
    {
      id: "public-profile",
      title: "Your Public Profile",
      icon: "UserRound",
      summary:
        "The page prospective students read before they enrol with you — and what they say back.",
      steps: [
        {
          title: "Open the Public Profile tab",
          body:
            "This is the profile that appears on the public Instructors page and beside your name on every course you teach. It is worth ten minutes before your first cohort arrives.",
          where: "Teacher Portal → Public Profile",
        },
        {
          title: "Write your biography and list your skills",
          body:
            "Keep the biography short and specific — what you have actually done, not a list of adjectives. The skills you add become the tags students use to find instructors like you.",
        },
        {
          title: "Read your student feedback",
          body:
            "Ratings and written feedback from your students appear on the same tab. Read them in batches rather than one at a time; the pattern across a cohort tells you far more than any single review.",
        },
      ],
    },
    {
      id: "your-courses",
      title: "Your Courses",
      icon: "BookMarked",
      summary:
        "Where your assigned courses live and how to create a new one.",
      steps: [
        {
          title: "Open My Courses",
          body:
            "Every course assigned to you appears here, each card showing its status and how many students are enrolled. This is the way into everything else — content, students and the class feed all hang off a course.",
          where: "Teacher Portal → My Courses",
        },
        {
          title: "Create a new course",
          body:
            "Use the create option on the same tab to set up a course with its title, description, category, level, price and thumbnail. A new course starts as a draft, which means only you can see it.",
        },
        {
          title: "Publish when it is genuinely ready",
          body:
            "A draft course is invisible to students and absent from the catalog. Publish only once the content is in place — a published course with empty modules is worse than no course at all.",
          tip: "Build the whole first module before you publish. Students who arrive to an empty shell rarely come back for the second visit.",
        },
      ],
    },
    {
      id: "building-content",
      title: "Building Course Content",
      icon: "Layers",
      summary:
        "Modules, lessons, assignments and quizzes — the order to build them in and how to rearrange them.",
      steps: [
        {
          title: "Start with modules",
          body:
            "A module is a chapter of your course and everything else lives inside one. Create the modules first, in the order you intend to teach them, and you will have the shape of the course before writing a single lesson.",
          where: "My Courses → a course → Content",
        },
        {
          title: "Add lessons to each module",
          body:
            "A lesson can be a written page you compose in the editor, a video, a document or PDF, or an image. Mix the formats — a module that is six written pages in a row loses people by the third.",
        },
        {
          title: "Attach the supporting files",
          body:
            "Anything students should be able to download — a handout, a worksheet, a template — attaches to the lesson it belongs with, so it sits where it is needed rather than in a separate pile.",
        },
        {
          title: "Set an assignment",
          body:
            "Give each module one assignment with a clear brief, a due date, the marks it is worth, and any files students need to start. This is where you find out whether the module landed.",
        },
        {
          title: "Choose how it gets graded",
          body:
            "Manual grading means you read and mark every submission yourself. AI Grading has our Elite Coach AI score each submission against criteria you write, with the marks split across them — you still see every result and can override any of them.",
          tip: "AI Grading saves the most time on large cohorts with objective criteria. For reflective or personal work, mark it yourself.",
        },
        {
          title: "Add a quiz",
          body:
            "Build a quiz per module, writing each question with its four answer choices and marking the correct one. Quizzes are scored automatically the moment a student finishes.",
        },
        {
          title: "Rearrange by dragging",
          body:
            "Modules, lessons, assignments and quizzes can all be dragged into a new order. Changing your mind about sequence costs you nothing and never affects work students have already submitted.",
        },
      ],
    },
    {
      id: "students-enrollment",
      title: "Students & Enrollment",
      icon: "Users",
      summary:
        "Who is in your course, how they are doing, and who is slipping.",
      steps: [
        {
          title: "Open Enrollment & Scores",
          body:
            "One table of every student enrolled across your courses, with their scores and how far through they are. It is the fastest read on the health of a cohort.",
          where: "Teacher Portal → Enrollment & Scores",
        },
        {
          title: "Watch the risk flags",
          body:
            "Students who have stalled or are scoring badly are flagged for you. Hover a flag to see the reason behind it rather than guessing at the cause.",
          tip: "Act on a flag in the week it appears. A student two weeks behind can usually be recovered; a student two months behind usually cannot.",
        },
        {
          title: "Enrol a student yourself",
          body:
            "Students normally arrive by buying a pathway or a course, but you can enrol one directly into a course you teach — useful for a transfer, a pilot group, or a student the admin team has asked you to take on.",
        },
        {
          title: "Open a single student",
          body:
            "Select any row to see that student on their own — their enrolled courses, what they have finished and what they have not.",
        },
      ],
    },
    {
      id: "grading-progress",
      title: "Grading & Progress",
      icon: "LineChart",
      summary:
        "Marking submissions, reviewing quiz attempts, and seeing who has actually done the reading.",
      steps: [
        {
          title: "Open the Progress tab",
          body:
            "Progress breaks a course down three ways — lessons, assignments and quizzes — so you can see completion at the level you care about rather than one blended percentage.",
          where: "Teacher Portal → Progress",
        },
        {
          title: "Grade a submission",
          body:
            "Open a student's submission to read their response and download anything they attached, then enter the marks and write your feedback. Both appear on the student's own copy as soon as you save.",
        },
        {
          title: "Work alongside the AI review",
          body:
            "On assignments set to AI Grading, the AI's evaluation is shown to you read-only with its reasoning. Treat it as a first pass: the marks and feedback you enter are what the student sees, and you can disagree with it freely.",
        },
        {
          title: "Review quiz attempts",
          body:
            "Quizzes mark themselves, but you can open any attempt to see exactly which questions a student got wrong. A question most of the cohort missed is usually a lesson problem, not a student problem.",
        },
        {
          title: "Write feedback they can act on",
          body:
            "Name the one thing to change next time. Students read feedback in the gap between finishing one module and starting the next, and that is the only window in which it changes anything.",
        },
      ],
    },
    {
      id: "communication",
      title: "Talking to Your Students",
      icon: "MessagesSquare",
      summary:
        "The class chat, course announcements, advisor questions, and raising a concern.",
      steps: [
        {
          title: "Use the War Room for your class",
          body:
            "Each course has a group chat shared by you and the students taking it. It is where questions about a lesson get answered once, in front of everybody, instead of five times over email.",
          where: "Teacher Portal → War Room",
        },
        {
          title: "Post to the course feed",
          body:
            "The feed on each course is for announcements — a deadline moving, a correction, a short video. Posts stay on the course so a student who joins late still finds them.",
          where: "My Courses → a course → Feed",
        },
        {
          title: "Answer advisor questions",
          body:
            "If you have been given an advisor role, questions sent privately by the students assigned to you arrive in the Advisor Questions tab. They are private by design — answer them there, not in the War Room.",
          where: "Teacher Portal → Advisor Questions",
        },
        {
          title: "Flag a student concern",
          body:
            "When something about a student worries you — their wellbeing, their conduct, a pattern you cannot address alone — raise a concern. It goes to the admin team with your notes attached, and you can follow it on the Student Concerns tab.",
          where: "Teacher Portal → Student Concerns",
          tip: "Raise it early and in your own words. A concern logged with specifics is far more useful to the admin team than one logged at crisis point.",
        },
      ],
    },
    {
      id: "resources",
      title: "Resources & Getting Help",
      icon: "LifeBuoy",
      summary:
        "Teaching materials, curriculum documents, and how to get something fixed.",
      steps: [
        {
          title: "Read the Instructional Manuals",
          body:
            "Guidance on teaching the curriculum as it was designed — what each tier is for and how the material is meant to be delivered. Worth reading before your first cohort rather than during it.",
          where: "Teacher Portal → Instructional Manuals",
        },
        {
          title: "Pull from the Curriculum Documents",
          body:
            "Shared PDFs and resources you can use in class or hand to students. These are maintained centrally, so you are always taking the current version.",
          where: "Teacher Portal → Curriculum Documents",
        },
        {
          title: "Request a change or report an error",
          body:
            "Found a mistake in the curriculum, or need something changed that you cannot change yourself? Raise it from the Requests tab with a clear title and description, and track its status in the same place.",
          where: "Teacher Portal → Requests",
        },
        {
          title: "Say exactly what is wrong",
          body:
            "Name the course, the module and what you expected to see. A request that identifies the specific lesson gets resolved in a fraction of the time one that says the content is wrong does.",
        },
      ],
    },
  ],
  quickTips: [
    {
      title: "Build in this order",
      body:
        "Modules, then lessons, then the assignment and quiz for each. Working module by module beats writing every lesson before any assessment.",
    },
    {
      title: "Draft is genuinely invisible",
      body:
        "Nothing in a draft course reaches students or the catalog, so you can build in the open without anyone seeing a half-finished module.",
    },
    {
      title: "Reordering is always safe",
      body:
        "Dragging modules or lessons into a new order never disturbs submissions, grades or the progress students have already made.",
    },
    {
      title: "A student cannot see their course",
      body:
        "Check the course is published and that they appear in Enrollment & Scores. If both look right, raise it from the Requests tab.",
    },
  ],
};

export const USER_GUIDES = [STUDENT_GUIDE, TEACHER_GUIDE];

export const DEFAULT_GUIDE_ID = STUDENT_GUIDE.id;
