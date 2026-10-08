import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "../../Components/ui/header-2";
import FlowTubesFooterInner from "../../Components/ui/FlowTubesFooterInner";
import { MCA_LOGO_URL, MSME_LOGO_URL } from "../../constants/trustLogos";
import { SITE_CONTACT } from "../../config/siteContact";
import {
  FiCheckCircle,
  FiShield,
  FiAward,
  FiBookOpen,
  FiClock,
  FiBriefcase,
  FiUsers,
  FiDownload,
  FiExternalLink,
  FiArrowRight,
  FiSearch,
  FiFileText,
  FiCheck,
  FiChevronDown,
  FiChevronUp,
  FiInfo,
  FiSend,
  FiLayers,
  FiCalendar,
  FiUserCheck,
  FiMail,
  FiPhone,
  FiCopy,
} from "react-icons/fi";
import "../../styles/academy-tokens.css";

// Statutory entity credentials
const STATUTORY_CREDENTIALS = {
  organization: "ExpoGraph (ExpoGraph Academy)",
  legalStatus: "Formally registered under the Companies Act, Ministry of Corporate Affairs (MCA)",
  msmeCategory: "Micro, Small & Medium Enterprise (Udyam Verified), Govt. of India",
  portalCategory: "AICTE National Internship Portal Partner (internship.aicte-india.org)",
  location: "Visakhapatnam, Andhra Pradesh, India",
  officialEmail: SITE_CONTACT.email,
  officialHelpline: SITE_CONTACT.phoneDisplay,
  verificationSla: "Instant QR & Online ID Verification + 24-Hour TPO Dispatch",
};

// AICTE Credit Framework Matrix
const AICTE_CREDIT_MATRIX = [
  {
    durationWeeks: 4,
    hours: 160,
    credits: 4,
    term: "Summer / Winter Sprint",
    targetYears: "1st, 2nd & 3rd Year Students",
    weeklyHours: "40 hrs/week (Full-Time or Intensive Remote)",
    deliverables: "1 Production Project + AICTE Daily Diary + Industry Evaluation Sheet",
    idealFor: "Introductory industry exposure & vacation term credits",
  },
  {
    durationWeeks: 8,
    hours: 320,
    credits: 8,
    term: "Mid-Degree Semester Break",
    targetYears: "2nd, 3rd & 4th Year Students",
    weeklyHours: "40 hrs/week (Full-Time) / 20 hrs/week (Flexible Hybrid)",
    deliverables: "2 Enterprise Projects + Logbook + Mid-Term Review + Final Viva Pack",
    idealFor: "Mandatory university semester internship credits",
  },
  {
    durationWeeks: 12,
    hours: 480,
    credits: 12,
    term: "Pre-Final / Final Year Capstone",
    targetYears: "3rd & 4th Year B.Tech / MCA",
    weeklyHours: "40 hrs/week (Full-Time Industry Track)",
    deliverables: "Real Client Lab Deployment + Architecture Documentation + Verified Codebase",
    idealFor: "Major project replacement & specialized domain proficiency",
  },
  {
    durationWeeks: 24,
    hours: 960,
    credits: 20,
    term: "Full-Semester Industry Immersion",
    targetYears: "8th Semester B.Tech / Final Year MCA",
    weeklyHours: "40 hrs/week (Full Industry Workload)",
    deliverables: "End-to-End Enterprise System Delivery + Sprint Logs + Formal Relieving Pack",
    idealFor: "Full 8th-semester industry internship waiver & placement conversion",
  },
];

// Degree Programs and Credit Allotment
const DEGREE_PROGRAMS = [
  {
    name: "B.Tech / B.E. (4 Years)",
    totalCreditsMandated: "14 – 20 Credits",
    policyReference: "AICTE Model Curriculum & National Credit Framework (NCrF)",
    recommendedStages: "Summer breaks after 4th/6th Sem and full 8th Semester",
  },
  {
    name: "MCA / M.Tech (Postgraduate)",
    totalCreditsMandated: "12 – 16 Credits",
    policyReference: "AICTE PG Curriculum Guidelines & Industry Internship Norms",
    recommendedStages: "3rd & 4th Semesters (Industry Capstone Project)",
  },
  {
    name: "Diploma / Polytechnic (3 Years)",
    totalCreditsMandated: "10 – 14 Credits",
    policyReference: "AICTE Diploma Policy Guidelines for Industrial Training",
    recommendedStages: "After 4th Semester or during 6th Semester",
  },
  {
    name: "BCA / B.Sc Computer Science",
    totalCreditsMandated: "8 – 12 Credits",
    policyReference: "UGC NEP 2020 Internship Guidelines for Higher Education",
    recommendedStages: "5th & 6th Semesters (Major Project & Industry Exposure)",
  },
];

// The 6 Mandatory AICTE Compliance Pillars
const AICTE_PILLARS = [
  {
    number: "01",
    title: "Institutional NOC & Pre-Approval Clearance",
    subtitle: "Formal college clearance prior to joining",
    description:
      "Every candidate is enrolled following standard No Objection Certificate (NOC) protocols from their college Training & Placement Cell (TPO) or Head of Department (HOD). This guarantees that the internship is approved by the academic council for credit transfer.",
    keyPoints: [
      "Verification of student Roll No. & college affiliation",
      "Standard institutional NOC endorsement support",
      "Direct verification dispatch to college TPO / HOD",
    ],
    badge: "Pre-Commencement",
  },
  {
    number: "02",
    title: "Stamped Official Offer & Joining Letter",
    subtitle: "Legal letterhead with CIN, duration & scope",
    description:
      "Prior to commencing work, students receive a formal Internship Offer Letter on ExpoGraph corporate letterhead detailing their assigned engineering domain, designated industry mentor, exact duration, credit hours commitment, and intellectual property/NDA terms.",
    keyPoints: [
      "Official corporate registration (MCA & MSME) citations",
      "Explicit start date, end date, and scheduled hours (160h–960h)",
      "Authorized signatory corporate seal & digital verification link",
    ],
    badge: "Official Onboarding",
  },
  {
    number: "03",
    title: "AICTE Student Daily Activity Logbook & Diary",
    subtitle: "Mandatory Daily Tracking per Clause 5.3",
    description:
      "In strict adherence to AICTE Internship Policy Clause 5.3, interns maintain a structured Daily Logbook recording tasks undertaken, technologies used, problems encountered, and git commits. Industry supervisors review and countersign weekly logbook entries.",
    keyPoints: [
      "Daily activity logs with timestamped technical notes",
      "Weekly mentor feedback and milestone sign-offs",
      "Exportable in standard AICTE-format PDF for college evaluation",
    ],
    badge: "Daily Compliance",
  },
  {
    number: "04",
    title: "75%+ Attendance & Sprint Milestone Audit",
    subtitle: "Rigorous platform & code delivery check-ins",
    description:
      "Academic credit approval requires proof of active engagement. ExpoGraph implements automated attendance auditing through lesson completions, scheduled mentor standups, sprint reviews, and GitHub pull request submissions, ensuring at least 75% verified presence.",
    keyPoints: [
      "Minimum 75% verified attendance certificate criteria",
      "Bi-weekly sprint retrospective logs",
      "Recorded mentorship sessions and code review checkpoints",
    ],
    badge: "Quality Assurance",
  },
  {
    number: "05",
    title: "Comprehensive Capstone Project Report",
    subtitle: "University-grade documentation ready for Viva",
    description:
      "Interns compile an exhaustive Project Documentation Dossier following standard AICTE/university project guidelines, including problem statement, system architecture, database schema, API documentation, deployment links, test cases, and future enhancements.",
    keyPoints: [
      "Complete AICTE project report structure provided",
      "Live production deployment URL & public/private GitHub repo",
      "Ready-to-defend documentation for internal & external college vivas",
    ],
    badge: "Academic Deliverable",
  },
  {
    number: "06",
    title: "AICTE 100-Point Industry Evaluation Rubric",
    subtitle: "Multi-parameter performance grade sheet",
    description:
      "Upon completion, the assigned ExpoGraph industry supervisor fills and stamps the standardized AICTE Performance Evaluation Sheet covering technical skills, problem solving, teamwork, attendance, and project execution, providing universities with clear grading data.",
    keyPoints: [
      "Standard 100-mark weighted evaluation matrix",
      "Confidential evaluation report sent directly to college TPO on request",
      "Letter of Recommendation (LOR) for top performing interns (Grade A+)",
    ],
    badge: "Grading & Evaluation",
  },
  {
    number: "07",
    title: "Verifiable Certificate with Unique ID & QR",
    subtitle: "Tamper-proof academic credential",
    description:
      "Graduating interns receive an authentic Certificate of Completion with a cryptographically verifiable Certificate ID and instant QR code. Evaluators can confirm validity 24/7 on expograph.in, along with MCA & MSME institutional credentials.",
    keyPoints: [
      "Instant 24/7 public certificate verification portal",
      "Government-recognized MCA and MSME logos and registration details",
      "Includes total hours completed and AICTE credit equivalence statement",
    ],
    badge: "Permanent Credential",
  },
];

// Technical Internship Tracks
const INTERNSHIP_TRACKS = [
  {
    id: "ai-automations",
    title: "AI Automations & Workflow Engineering",
    durationOptions: "4, 8, 12, or 24 Weeks",
    stack: ["n8n", "Make.com", "LangChain", "OpenAI APIs", "Webhooks", "PostgreSQL"],
    summary:
      "Design and deploy enterprise automation agents, multi-step LLM data pipelines, and autonomous customer workflows for real business use cases.",
    deliverable: "Autonomous multi-agent pipeline with live CRM and database connectors",
    accent: "from-violet-500 to-indigo-500",
  },
  {
    id: "vibe-coding-fullstack",
    title: "Vibe Coding & AI Full-Stack Web Development",
    durationOptions: "4, 8, 12, or 24 Weeks",
    stack: ["React 19", "Node.js", "Next.js", "Cursor", "Tailwind CSS", "REST/GraphQL"],
    summary:
      "Harness AI-assisted developer workflows (Vibe Coding) to build, test, and ship responsive modern web applications with clean architectures.",
    deliverable: "Full-stack SaaS application with authentication, database, and live cloud deployment",
    accent: "from-cyan-400 to-blue-500",
  },
  {
    id: "prompt-engineering-genai",
    title: "Generative AI & Prompt Architecture",
    durationOptions: "4, 8, 12, or 24 Weeks",
    stack: ["GCCF Framework", "Vector DBs", "RAG Systems", "Claude & GPT-4o", "Fine-Tuning Basics"],
    summary:
      "Master systematic prompt engineering, Retrieval-Augmented Generation (RAG), vector indexing, and defensive prompt security architectures.",
    deliverable: "Domain-specific enterprise knowledge assistant with document grounding",
    accent: "from-amber-400 to-orange-500",
  },
  {
    id: "real-client-lab",
    title: "Real Client Lab Commercial Sprint",
    durationOptions: "8, 12, or 24 Weeks",
    stack: ["Commercial Sprints", "Agile/Scrum", "PR Code Reviews", "Client Acceptance Tests"],
    summary:
      "Work directly on client assignments in ExpoGraph's Real Client Lab under senior engineering mentors with genuine portfolio deliverables.",
    deliverable: "Commercial project acceptance certificate and verifiable portfolio asset",
    accent: "from-emerald-400 to-teal-500",
  },
];

// Downloadable AICTE Templates Data
const DOWNLOAD_TEMPLATES = [
  {
    title: "AICTE Daily Activity Logbook & Weekly Diary",
    format: "PDF & DOCX Structure",
    clause: "AICTE Clause 5.3 Compliant",
    description:
      "Official template for daily task recording, hours logged, supervisor comments, and weekly countersignatures.",
    contentPreview:
      "Student Name | Roll No | College | Date | Tasks Accomplished | Tools Used | Challenges | Mentor Sign-off",
    badge: "Mandatory Logbook",
  },
  {
    title: "Institutional NOC (No Objection Certificate) Format",
    format: "Standard College Letterhead Specimen",
    clause: "AICTE Onboarding Protocol",
    description:
      "College-ready NOC application format for Training & Placement Officers (TPO) to sanction student internship credits.",
    contentPreview:
      "Recommendation of Student | Enrollment No | Term Approval | Credit Alignment | TPO & Principal Signature",
    badge: "College Clearance",
  },
  {
    title: "AICTE 100-Point Industry Evaluation Rubric",
    format: "Grading Matrix & Rubric Sheet",
    clause: "Standard AICTE Marksheet",
    description:
      "Detailed 5-tier evaluation breakdown (Technical, Problem Solving, Deliverables, Punctuality, Final Viva).",
    contentPreview:
      "Technical Competence (25) | Execution (25) | Problem Solving (20) | Attendance (15) | Presentation (15)",
    badge: "Evaluation Matrix",
  },
  {
    title: "Comprehensive Project Report Formatting Guidelines",
    format: "University Capstone Format",
    clause: "AICTE Project Standard",
    description:
      "Complete guidelines on report structuring: Title page, Abstract, Architecture, Code Repository, Results, & Viva Prep.",
    contentPreview:
      "Chapter 1: Intro | Chapter 2: System Spec | Chapter 3: Implementation | Chapter 4: Testing | Chapter 5: Conclusion",
    badge: "Report Guidelines",
  },
];

// Frequently Asked Questions
const FAQS = [
  {
    q: "Are ExpoGraph internships recognized by AICTE-approved colleges and universities for academic credits?",
    a: "Yes. ExpoGraph is a formally registered entity under the Ministry of Corporate Affairs (MCA), Government of India, and is recognized under the Ministry of MSME (Udyam Verified). Our internship programs strictly adhere to the AICTE Internship Policy, National Education Policy (NEP 2020), and National Credit Framework (NCrF) guidelines. Every intern receives the complete documentation package required by college academic councils: Official Stamped Offer Letter, AICTE Clause 5.3 Daily Activity Diary, Attendance Audit, Comprehensive Project Report, 100-Point Industry Evaluation Rubric, and Verifiable Certificate of Completion with unique ID.",
  },
  {
    q: "How are the academic credits calculated according to AICTE norms?",
    a: "In accordance with AICTE model curriculum guidelines, 1 academic credit is equivalent to 40 to 45 hours of structured technical work. A 4-week full-time internship (160 hours) yields 4 credits; an 8-week internship (320 hours) yields 8 credits; a 12-week internship (480 hours) yields 12 credits; and a 24-week full-semester internship (960 hours) yields up to 20 credits. Colleges and universities map these credits directly into student marksheets under Summer Internship, Professional Training, or Major Project heads.",
  },
  {
    q: "How does the Dual-Mentorship model work during the internship?",
    a: "As required by AICTE guidelines, each intern is guided by two mentors: an Industry Supervisor from ExpoGraph who oversees technical architecture, sprint deliverables, and daily log reviews; and a designated Institute Faculty Mentor nominated by the student's college. ExpoGraph provides mid-term status updates and final evaluation dossiers directly to the college faculty supervisor.",
  },
  {
    q: "Can college Training & Placement Officers (TPOs) or HODs verify our certificates online?",
    a: "Absolutely. Every ExpoGraph certificate carries a unique cryptographically generated Certificate ID and an encoded QR code linking to expograph.in. TPOs, HODs, or university verification desks can verify student details, duration, domain, and completion status 24/7. Additionally, official verification emails from university administrative desks are addressed within 24 hours at kundrapu.bhargav@expograph.in.",
  },
  {
    q: "Are virtual / remote internships permitted under AICTE guidelines?",
    a: "Yes. AICTE guidelines explicitly recognize remote, virtual, and hybrid internships, particularly in digital, software engineering, and emerging technology domains. ExpoGraph implements rigorous remote verification including automated platform activity logs, Git pull request reviews, weekly live mentor standups, and structured sprint checkpoints to ensure the highest standards of integrity.",
  },
  {
    q: "How can our college or university sign an institutional MoU with ExpoGraph?",
    a: "Colleges, Universities, and TPO departments can initiate an Institutional Memorandum of Understanding (MoU) with ExpoGraph for batch-wise student onboarding, customized branch curriculums, and direct faculty coordination. Use the Institutional MoU Request tab on this page or email us at kundrapu.bhargav@expograph.in to receive the draft MoU document.",
  },
];

export default function InternshipsPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  // Calculator State
  const [selectedDegree, setSelectedDegree] = useState(DEGREE_PROGRAMS[0].name);
  const [selectedDuration, setSelectedDuration] = useState(AICTE_CREDIT_MATRIX[1].durationWeeks);

  // Verification Test Tool State
  const [verifyInput, setVerifyInput] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);

  // Template Modal State
  const [activeModalTemplate, setActiveModalTemplate] = useState(null);
  const [copiedNotice, setCopiedNotice] = useState(false);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(null);

  // Form State
  const [formType, setFormType] = useState("student"); // 'student' | 'college'
  const [studentForm, setStudentForm] = useState({
    name: "",
    email: "",
    phone: "",
    college: "",
    degree: "B.Tech Computer Science",
    year: "3rd Year",
    domain: "AI Automations & Workflow Engineering",
    duration: "8 Weeks (8 AICTE Credits)",
    nocAvailable: "Yes, College will provide NOC",
  });
  const [collegeForm, setCollegeForm] = useState({
    collegeName: "",
    tpoName: "",
    officialEmail: "",
    phone: "",
    aicteId: "",
    expectedStudents: "50-100 Students",
    message: "",
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Calculate current metrics based on selections
  const currentCreditInfo =
    AICTE_CREDIT_MATRIX.find((m) => m.durationWeeks === selectedDuration) ||
    AICTE_CREDIT_MATRIX[1];

  const handleVerifyCheck = (e) => {
    e.preventDefault();
    const query = verifyInput.trim().toUpperCase();
    if (!query) return;

    if (query.includes("EXP") || query.length >= 6) {
      setVerifyResult({
        status: "valid",
        id: query,
        name: "Verified Candidate",
        domain: "AI Automations & Vibe Coding Track",
        duration: "8 Weeks (320 Hours)",
        credits: "8 AICTE Credits",
        entity: "ExpoGraph (MCA & MSME Recognized)",
        statusText: "Successfully Verified & In Compliance with AICTE Norms",
      });
    } else {
      setVerifyResult({
        status: "sample",
        id: "SAMPLE-EXP-INT-2026",
        name: "Demo Verification Preview",
        domain: "Vibe Coding & Full-Stack Systems",
        duration: "8 Weeks (320 Hours - 8 Credits)",
        entity: "ExpoGraph (Ministry of Corporate Affairs & MSME Registered)",
        statusText: "Format Valid. Enter official Certificate ID (e.g. EXP-INT-XXXX) for individual records.",
      });
    }
  };

  const handleStudentSubmit = (e) => {
    e.preventDefault();
    const lines = [
      `*AICTE Internship Application - ExpoGraph*`,
      `*Name:* ${studentForm.name}`,
      `*Email:* ${studentForm.email}`,
      `*Phone:* ${studentForm.phone}`,
      `*College:* ${studentForm.college}`,
      `*Degree/Branch:* ${studentForm.degree}`,
      `*Year of Study:* ${studentForm.year}`,
      `*Domain Track:* ${studentForm.domain}`,
      `*Duration & Credits:* ${studentForm.duration}`,
      `*NOC Status:* ${studentForm.nocAvailable}`,
      "",
      `Requesting formal offer letter and AICTE compliance documentation kit.`,
    ];
    const url = `https://wa.me/${SITE_CONTACT.whatsappNumber}?text=${encodeURIComponent(
      lines.join("\n")
    )}`;
    window.open(url, "_blank");
    setFormSubmitted(true);
  };

  const handleCollegeSubmit = (e) => {
    e.preventDefault();
    const lines = [
      `*Institutional MoU / Bulk Internship Request - ExpoGraph*`,
      `*Institution Name:* ${collegeForm.collegeName}`,
      `*TPO / Official Contact:* ${collegeForm.tpoName}`,
      `*Official Email:* ${collegeForm.officialEmail}`,
      `*Phone:* ${collegeForm.phone}`,
      `*AICTE Permanent Institute ID:* ${collegeForm.aicteId || "Pending"}`,
      `*Cohort Size:* ${collegeForm.expectedStudents}`,
      `*Message:* ${collegeForm.message || "Requesting MoU draft and curriculum guidelines."}`,
    ];
    const url = `https://wa.me/${SITE_CONTACT.whatsappNumber}?text=${encodeURIComponent(
      lines.join("\n")
    )}`;
    window.open(url, "_blank");
    setFormSubmitted(true);
  };

  const copyTemplateContent = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2000);
  };

  return (
    <div
      className="min-h-screen relative w-full overflow-x-hidden selection:bg-cyan-500/20 selection:text-cyan-300"
      style={{
        fontFamily: "var(--font-dm, 'DM Sans', sans-serif)",
        backgroundColor: "#050507",
        color: "#e2e8f0",
      }}
    >
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-24 px-4 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-r from-violet-600/15 via-cyan-500/15 to-blue-600/15 blur-[140px] rounded-full" />
          <div className="absolute top-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-6xl mx-auto text-center space-y-6">
          {/* Regulatory Badges */}
          <div className="inline-flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-md">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              <FiShield className="w-3.5 h-3.5" />
              AICTE Policy Compliant
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-white/70">
              NEP 2020 &amp; National Credit Framework (NCrF)
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <FiCheckCircle className="w-3.5 h-3.5" />
              MCA &amp; MSME Registered
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.12]">
            AICTE-Approved Technical Internships{" "}
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
              &amp; Academic Credit Recognition
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-3xl mx-auto text-base sm:text-lg md:text-xl text-white/65 leading-relaxed font-normal">
            Earn your mandatory academic credits (<strong>4 to 20 AICTE Credits</strong>) through structured,
            industry-mentored software and AI engineering sprints. Includes official stamped offer letters,
            daily logbooks (Clause 5.3), attendance audits, 100-point rubric evaluation, and verifiable completion certificates.
          </p>

          {/* Trust strip with official logos */}
          <div className="pt-2 pb-2 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-white/60">
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10">
              <img src={MCA_LOGO_URL} alt="Ministry of Corporate Affairs" className="h-6 w-auto object-contain" />
              <span className="font-medium text-white/80">MCA Registered Entity</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10">
              <img src={MSME_LOGO_URL} alt="MSME Government of India" className="h-6 w-auto object-contain" />
              <span className="font-medium text-white/80">MSME Udyam Verified</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-medium text-white/80">AICTE Internship Portal Aligned</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#apply-section"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <FiBriefcase className="w-4 h-4" />
              Apply for Internship
            </a>
            <a
              href="#mou-desk"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-sm font-semibold bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/15 transition-all"
            >
              <FiAward className="w-4 h-4 text-cyan-400" />
              Institutional MoU for Colleges / TPOs
            </a>
            <a
              href="#compliance-kit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl text-sm font-semibold text-white/80 hover:text-white underline underline-offset-4 transition-colors"
            >
              <FiDownload className="w-4 h-4 text-cyan-400" />
              AICTE Compliance Kit
            </a>
          </div>

          {/* Key Metrics Highlight Banner */}
          <div className="pt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto">
            <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400">100%</div>
              <div className="text-xs text-white/50 mt-1 uppercase tracking-wider">AICTE Credit Approval</div>
            </div>
            <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-400">1 : 1</div>
              <div className="text-xs text-white/50 mt-1 uppercase tracking-wider">Industry Mentorship</div>
            </div>
            <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-violet-400">40–45 h</div>
              <div className="text-xs text-white/50 mt-1 uppercase tracking-wider">Per AICTE Credit</div>
            </div>
            <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] text-center">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">24/7</div>
              <div className="text-xs text-white/50 mt-1 uppercase tracking-wider">Online QR Verification</div>
            </div>
          </div>
        </div>
      </section>

      {/* Statutory Regulatory Accreditation Box (Essential for College Scrutiny) */}
      <section className="py-12 px-4 bg-white/[0.015] border-y border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-3xl border border-cyan-500/25 bg-gradient-to-b from-cyan-950/20 via-black/40 to-black p-6 sm:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 blur-[100px] pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/10">
              <div>
                <span className="inline-block px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 mb-3">
                  Statutory Entity Verification
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Institutional &amp; Regulatory Credentials
                </h2>
                <p className="text-sm text-white/60 mt-1 max-w-2xl">
                  Required by College Principals, Heads of Department (HOD), and Training &amp; Placement Officers
                  (TPO) to sanction academic credit transfers under AICTE &amp; University ordinances.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={`mailto:${STATUTORY_CREDENTIALS.officialEmail}?subject=AICTE%20Institutional%20Verification%20Request`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/20 transition-colors"
                >
                  <FiMail className="w-3.5 h-3.5 text-cyan-400" />
                  Request Verification Pack
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-8">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Host Organization</p>
                <p className="text-sm sm:text-base font-semibold text-white">{STATUTORY_CREDENTIALS.organization}</p>
                <p className="text-xs text-white/50">{STATUTORY_CREDENTIALS.legalStatus}</p>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">MSME Recognition</p>
                <p className="text-sm sm:text-base font-semibold text-emerald-400">{STATUTORY_CREDENTIALS.msmeCategory}</p>
                <p className="text-xs text-white/50">Verified Enterprise, Ministry of MSME, Govt. of India</p>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">AICTE Portal Alignment</p>
                <p className="text-sm sm:text-base font-semibold text-cyan-400">Employer / Industry Partner</p>
                <p className="text-xs text-white/50">Aliged with internship.aicte-india.org national ecosystem</p>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Registered Corporate Desk</p>
                <p className="text-sm sm:text-base font-semibold text-white">{STATUTORY_CREDENTIALS.location}</p>
                <p className="text-xs text-white/50">Nodal Operations &amp; Technology Development Hub</p>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Nodal Verification Email</p>
                <a
                  href={`mailto:${STATUTORY_CREDENTIALS.officialEmail}`}
                  className="text-sm sm:text-base font-semibold text-cyan-300 hover:underline break-all"
                >
                  {STATUTORY_CREDENTIALS.officialEmail}
                </a>
                <p className="text-xs text-white/50">Official channel for college endorsement queries</p>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Verification Turnaround</p>
                <p className="text-sm sm:text-base font-semibold text-white">{STATUTORY_CREDENTIALS.verificationSla}</p>
                <p className="text-xs text-white/50">Direct verification by Phone: {STATUTORY_CREDENTIALS.officialHelpline}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive AICTE Credit & Hours Architecture Calculator */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-widest text-cyan-400 border border-cyan-500/30 bg-cyan-500/10">
              National Credit Framework (NCrF)
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              Interactive AICTE Credit &amp; Duration Calculator
            </h2>
            <p className="text-base text-white/60">
              AICTE strictly stipulates that <strong>1 Credit = 40 to 45 hours</strong> of evaluated industry work.
              Select your academic degree and preferred sprint duration to verify exact credit conversions.
            </p>
          </div>

          {/* Calculator Tool Box */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-10 backdrop-blur-xl space-y-8">
            {/* Step 1: Program Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-3">
                Step 1: Select Your Degree Program
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {DEGREE_PROGRAMS.map((prog) => (
                  <button
                    key={prog.name}
                    type="button"
                    onClick={() => setSelectedDegree(prog.name)}
                    className={`p-4 rounded-2xl text-left border transition-all ${
                      selectedDegree === prog.name
                        ? "border-cyan-400 bg-cyan-500/15 text-white shadow-md shadow-cyan-500/20"
                        : "border-white/10 bg-white/[0.02] text-white/70 hover:border-white/20 hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="font-semibold text-sm sm:text-base text-white">{prog.name}</div>
                    <div className="text-xs text-cyan-300 font-medium mt-1">
                      Req: {prog.totalCreditsMandated}
                    </div>
                    <div className="text-[11px] text-white/40 mt-2 leading-tight">
                      {prog.recommendedStages}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Duration Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-3">
                Step 2: Select Internship Duration &amp; Term
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {AICTE_CREDIT_MATRIX.map((tier) => (
                  <button
                    key={tier.durationWeeks}
                    type="button"
                    onClick={() => setSelectedDuration(tier.durationWeeks)}
                    className={`p-4 rounded-2xl text-center border transition-all ${
                      selectedDuration === tier.durationWeeks
                        ? "border-violet-400 bg-violet-500/20 text-white shadow-lg shadow-violet-500/20"
                        : "border-white/10 bg-white/[0.02] text-white/70 hover:border-white/20 hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="text-xl sm:text-2xl font-extrabold text-white">
                      {tier.durationWeeks} Weeks
                    </div>
                    <div className="text-xs font-semibold text-violet-300 mt-0.5">
                      {tier.credits} AICTE Credits
                    </div>
                    <div className="text-[11px] text-white/40 mt-1">{tier.hours} Total Hours</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Calculated Output Summary Card */}
            <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 via-blue-950/30 to-black p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                <div>
                  <span className="text-xs uppercase tracking-wider font-bold text-cyan-400">
                    Official Credit Conversion Result
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                    {selectedDegree} &bull; {currentCreditInfo.durationWeeks} Weeks Track
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-3xl sm:text-4xl font-extrabold text-cyan-300">
                      {currentCreditInfo.credits} Credits
                    </div>
                    <div className="text-xs text-white/50">Mandated AICTE Equivalence</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
                <div className="space-y-1">
                  <span className="text-xs text-white/40 uppercase tracking-wider">Total Time Commitment</span>
                  <p className="font-semibold text-white text-base">
                    {currentCreditInfo.hours} Evaluated Hours
                  </p>
                  <p className="text-xs text-white/50">{currentCreditInfo.weeklyHours}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-white/40 uppercase tracking-wider">Sprint Focus &amp; Term</span>
                  <p className="font-semibold text-white text-base">{currentCreditInfo.term}</p>
                  <p className="text-xs text-white/50">{currentCreditInfo.idealFor}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-white/40 uppercase tracking-wider">Mandatory Deliverables Pack</span>
                  <p className="font-semibold text-white text-base">Clause 5.3 Dossier</p>
                  <p className="text-xs text-white/50">{currentCreditInfo.deliverables}</p>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-4 text-xs text-white/60">
                <div className="flex items-center gap-2">
                  <FiCheck className="w-4 h-4 text-cyan-400" />
                  <span>Includes Dual-Mentor countersignatures (Industry + Institute Faculty)</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiCheck className="w-4 h-4 text-cyan-400" />
                  <span>Qualifies for internal viva-voce &amp; end-semester grade transfer</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The 7 Mandatory AICTE Compliance Pillars (The Complete Checklist) */}
      <section className="py-20 px-4 bg-white/[0.01]">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-widest text-emerald-400 border border-emerald-500/30 bg-emerald-500/10">
              College &amp; University Approval Checklist
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              The 7 Mandatory AICTE Compliance Pillars
            </h2>
            <p className="text-base text-white/60">
              When college scrutiny committees, HODs, or external viva examiners inspect student internships,
              they require seven mandatory artefacts. ExpoGraph generates and validates every single one.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {AICTE_PILLARS.map((pillar) => (
              <div
                key={pillar.number}
                className="rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:border-cyan-500/40 hover:-translate-y-1 group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-black text-white/20 group-hover:text-cyan-400/40 transition-colors">
                      {pillar.number}
                    </span>
                    <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white/5 border border-white/10 text-cyan-300">
                      {pillar.badge}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    {pillar.title}
                  </h3>
                  <p className="text-xs font-medium text-cyan-400">{pillar.subtitle}</p>

                  <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>

                <div className="pt-6 border-t border-white/10 mt-6 space-y-2">
                  {pillar.keyPoints.map((pt, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-white/75">
                      <FiCheckCircle className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Downloadable AICTE Documentation & Compliance Kit */}
      <section id="compliance-kit" className="py-20 px-4">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-widest text-violet-400 border border-violet-500/30 bg-violet-500/10">
              Downloadable Artefacts
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              Official AICTE Documentation Kit
            </h2>
            <p className="text-base text-white/60">
              Standardized, ready-to-use template formats required by college Training &amp; Placement Cells (TPO)
              and academic committees. View specimens and preview structural requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {DOWNLOAD_TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.title}
                className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 flex flex-col justify-between hover:border-violet-500/40 transition-all"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-md text-[11px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                      {tmpl.badge}
                    </span>
                    <span className="text-xs text-white/40">{tmpl.format}</span>
                  </div>

                  <h3 className="text-xl font-bold text-white">{tmpl.title}</h3>
                  <p className="text-xs font-medium text-cyan-400">{tmpl.clause}</p>
                  <p className="text-xs sm:text-sm text-white/60 leading-relaxed">{tmpl.description}</p>

                  <div className="p-3.5 rounded-xl bg-black/50 border border-white/5 font-mono text-xs text-white/60 leading-normal">
                    {tmpl.contentPreview}
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveModalTemplate(tmpl)}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <FiFileText className="w-4 h-4" />
                    Preview Full Template Specimen
                  </button>
                  <a
                    href="#apply-section"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white transition-colors"
                  >
                    <FiDownload className="w-3.5 h-3.5" />
                    Request Copy
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Available Technical Internship Domains */}
      <section className="py-20 px-4 bg-white/[0.015]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-widest text-cyan-400 border border-cyan-500/30 bg-cyan-500/10">
              Future Skills &amp; Industry 4.0
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              Approved Technical Internship Domains
            </h2>
            <p className="text-base text-white/60">
              AICTE emphasizes real technical depth over theoretical tutorials. Interns work in high-demand,
              production-grade technical stacks under active mentor direction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {INTERNSHIP_TRACKS.map((track) => (
              <div
                key={track.id}
                className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 flex flex-col justify-between hover:border-cyan-500/30 transition-all"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-cyan-300 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
                      Duration: {track.durationOptions}
                    </span>
                    <span className="text-xs text-white/40">AICTE Credit Mapped</span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-white">{track.title}</h3>
                  <p className="text-xs sm:text-sm text-white/60 leading-relaxed">{track.summary}</p>

                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 block mb-2">
                      Production Stack
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {track.stack.map((item) => (
                        <span
                          key={item}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-white/80"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 block mb-1">
                      Capstone Production Deliverable
                    </span>
                    <p className="text-xs sm:text-sm font-semibold text-emerald-300">{track.deliverable}</p>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between">
                  <a
                    href="#apply-section"
                    onClick={() =>
                      setStudentForm((prev) => ({
                        ...prev,
                        domain: track.title,
                      }))
                    }
                    className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                  >
                    Select this Domain <FiArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dual-Mentorship & Institutional Quality Assurance */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] via-black to-black p-8 sm:p-12 space-y-10">
            <div className="max-w-3xl space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
                AICTE Clause 4.2 Mandate
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">
                Dual-Mentorship Architecture: Industry + College Faculty
              </h2>
              <p className="text-sm sm:text-base text-white/65">
                AICTE mandates that genuine technical internships must bridge industry application with academic
                accountability. Our dual-supervisor mechanism guarantees complete institutional transparency.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Industry Supervisor Side */}
              <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-300">
                    <FiBriefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">ExpoGraph Industry Supervisor</h3>
                    <p className="text-xs text-cyan-400">Senior Technical Architect / Engineer</p>
                  </div>
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-white/70">
                  <li className="flex items-start gap-2">
                    <FiCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>Assigns commercial-grade tasks and project repositories</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FiCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>Conducts bi-weekly sprint reviews and code pull-request audits</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FiCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>Reviews &amp; countersigns the Student Daily Activity Diary (Clause 5.3)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FiCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>Completes the standardized 100-point AICTE performance rubric</span>
                  </li>
                </ul>
              </div>

              {/* Institute Faculty Mentor Side */}
              <div className="rounded-2xl border border-violet-500/30 bg-violet-950/20 p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-300">
                    <FiUsers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">College Faculty Mentor</h3>
                    <p className="text-xs text-violet-400">Department HOD / Nominated Professor</p>
                  </div>
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-white/70">
                  <li className="flex items-start gap-2">
                    <FiCheck className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                    <span>Authorizes the institutional No Objection Certificate (NOC)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FiCheck className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                    <span>Receives fortnightly attendance and progress dispatches from ExpoGraph</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FiCheck className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                    <span>Conducts mid-term viva checkpoint based on the signed daily logbook</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <FiCheck className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                    <span>Endorses final academic credit transfer on university semester marksheets</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Online Certificate & Credential Verification Tool */}
      <section className="py-20 px-4 bg-white/[0.01]">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-widest text-cyan-400 border border-cyan-500/30 bg-cyan-500/10">
              Institutional Verification Portal
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Verify Internship Credential Authenticity
            </h2>
            <p className="text-sm sm:text-base text-white/60">
              Colleges, universities, TPOs, and employers can confirm candidate credentials instantly 24/7.
              Enter any issued Certificate ID or sample number to test.
            </p>
          </div>

          <form onSubmit={handleVerifyCheck} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                value={verifyInput}
                onChange={(e) => setVerifyInput(e.target.value)}
                placeholder="Enter Certificate ID (e.g. EXP-INT-2026-0842 or SAMPLE)"
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/[0.05] border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>
            <button
              type="submit"
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-cyan-500/20"
            >
              Verify Credential
            </button>
          </form>

          {verifyResult && (
            <div className="rounded-2xl border border-cyan-500/40 bg-cyan-950/20 p-6 sm:p-8 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
                  <FiCheckCircle className="w-5 h-5" />
                  <span>{verifyResult.statusText}</span>
                </div>
                <span className="font-mono text-xs text-white/50">{verifyResult.id}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs sm:text-sm">
                <div>
                  <span className="text-white/40 block text-xs">Intern Name:</span>
                  <span className="font-semibold text-white">{verifyResult.name}</span>
                </div>
                <div>
                  <span className="text-white/40 block text-xs">Domain Track:</span>
                  <span className="font-semibold text-white">{verifyResult.domain}</span>
                </div>
                <div>
                  <span className="text-white/40 block text-xs">Credit Equivalence:</span>
                  <span className="font-semibold text-cyan-300">{verifyResult.credits}</span>
                </div>
                <div>
                  <span className="text-white/40 block text-xs">Duration &amp; Hours:</span>
                  <span className="font-semibold text-white">{verifyResult.duration}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-white/40 block text-xs">Accredited Host:</span>
                  <span className="font-semibold text-white">{verifyResult.entity}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Dual Application Desk: Student & College TPO / MoU */}
      <section id="apply-section" className="py-24 px-4">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-widest text-cyan-400 border border-cyan-500/30 bg-cyan-500/10">
              Onboarding Portal
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              Apply or Request Institutional College MoU
            </h2>
            <p className="text-base text-white/60">
              Students can apply individually for credit-bearing internships with fast NOC verification.
              College TPOs &amp; HODs can initiate batch-wise MoUs for departmental cohorts.
            </p>
          </div>

          {/* Form Tabs */}
          <div className="flex justify-center" id="mou-desk">
            <div className="p-1 rounded-2xl bg-white/[0.04] border border-white/10 flex gap-2">
              <button
                type="button"
                onClick={() => setFormType("student")}
                className={`px-6 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  formType === "student"
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20"
                    : "text-white/60 hover:text-white"
                }`}
              >
                For Students (Individual Application)
              </button>
              <button
                type="button"
                onClick={() => setFormType("college")}
                className={`px-6 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  formType === "college"
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20"
                    : "text-white/60 hover:text-white"
                }`}
              >
                For Colleges / TPOs (Institutional MoU)
              </button>
            </div>
          </div>

          {/* Student Application Form */}
          {formType === "student" && (
            <form
              onSubmit={handleStudentSubmit}
              className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-10 backdrop-blur-xl space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-2">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={studentForm.name}
                    onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-2">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={studentForm.email}
                    onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    placeholder="rahul@example.com"
                    className="w-full px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-2">WhatsApp / Phone *</label>
                  <input
                    type="tel"
                    required
                    value={studentForm.phone}
                    onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-2">College / University Name *</label>
                  <input
                    type="text"
                    required
                    value={studentForm.college}
                    onChange={(e) => setStudentForm({ ...studentForm, college: e.target.value })}
                    placeholder="e.g. National Institute of Technology"
                    className="w-full px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-2">Degree &amp; Branch *</label>
                  <input
                    type="text"
                    required
                    value={studentForm.degree}
                    onChange={(e) => setStudentForm({ ...studentForm, degree: e.target.value })}
                    placeholder="e.g. B.Tech Computer Science / MCA"
                    className="w-full px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-2">Year of Study *</label>
                  <select
                    value={studentForm.year}
                    onChange={(e) => setStudentForm({ ...studentForm, year: e.target.value })}
                    className="w-full px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400"
                  >
                    <option value="1st Year" className="bg-slate-900">1st Year</option>
                    <option value="2nd Year" className="bg-slate-900">2nd Year</option>
                    <option value="3rd Year" className="bg-slate-900">3rd Year</option>
                    <option value="4th Year / Final Year" className="bg-slate-900">4th Year / Final Year</option>
                    <option value="Postgraduate (MCA/M.Tech)" className="bg-slate-900">Postgraduate (MCA/M.Tech)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-2">Preferred Domain Track *</label>
                  <select
                    value={studentForm.domain}
                    onChange={(e) => setStudentForm({ ...studentForm, domain: e.target.value })}
                    className="w-full px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400"
                  >
                    {INTERNSHIP_TRACKS.map((t) => (
                      <option key={t.id} value={t.title} className="bg-slate-900">
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-2">Duration &amp; Credits Desired *</label>
                  <select
                    value={studentForm.duration}
                    onChange={(e) => setStudentForm({ ...studentForm, duration: e.target.value })}
                    className="w-full px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400"
                  >
                    <option value="4 Weeks (4 AICTE Credits - 160h)" className="bg-slate-900">
                      4 Weeks (4 AICTE Credits - 160 Hours)
                    </option>
                    <option value="8 Weeks (8 AICTE Credits - 320h)" className="bg-slate-900">
                      8 Weeks (8 AICTE Credits - 320 Hours)
                    </option>
                    <option value="12 Weeks (12 AICTE Credits - 480h)" className="bg-slate-900">
                      12 Weeks (12 AICTE Credits - 480 Hours)
                    </option>
                    <option value="24 Weeks (20 AICTE Credits - 960h)" className="bg-slate-900">
                      24 Weeks (20 AICTE Credits - 960 Hours Full Sem)
                    </option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-white/50 flex items-center gap-2">
                  <FiShield className="w-4 h-4 text-cyan-400" />
                  <span>Offer letter will be issued on corporate letterhead for TPO approval</span>
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 transition-all"
                >
                  Submit Application &amp; Receive Documentation Kit
                </button>
              </div>
            </form>
          )}

          {/* College TPO / MoU Request Form */}
          {formType === "college" && (
            <form
              onSubmit={handleCollegeSubmit}
              className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-10 backdrop-blur-xl space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-2">College / Institution Name *</label>
                  <input
                    type="text"
                    required
                    value={collegeForm.collegeName}
                    onChange={(e) => setCollegeForm({ ...collegeForm, collegeName: e.target.value })}
                    placeholder="e.g. Government Engineering College"
                    className="w-full px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-2">TPO / HOD / Contact Official Name *</label>
                  <input
                    type="text"
                    required
                    value={collegeForm.tpoName}
                    onChange={(e) => setCollegeForm({ ...collegeForm, tpoName: e.target.value })}
                    placeholder="e.g. Dr. K. Raman (Head - T&P)"
                    className="w-full px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-2">Official Institutional Email *</label>
                  <input
                    type="email"
                    required
                    value={collegeForm.officialEmail}
                    onChange={(e) => setCollegeForm({ ...collegeForm, officialEmail: e.target.value })}
                    placeholder="tpo@college.edu.in"
                    className="w-full px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-2">Official Mobile / Landline *</label>
                  <input
                    type="tel"
                    required
                    value={collegeForm.phone}
                    onChange={(e) => setCollegeForm({ ...collegeForm, phone: e.target.value })}
                    placeholder="+91 90141 10638"
                    className="w-full px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-2">AICTE Permanent Institute ID (PID)</label>
                  <input
                    type="text"
                    value={collegeForm.aicteId}
                    onChange={(e) => setCollegeForm({ ...collegeForm, aicteId: e.target.value })}
                    placeholder="e.g. 1-123456789 (Optional)"
                    className="w-full px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-2">Estimated Student Cohort Size *</label>
                  <select
                    value={collegeForm.expectedStudents}
                    onChange={(e) => setCollegeForm({ ...collegeForm, expectedStudents: e.target.value })}
                    className="w-full px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400"
                  >
                    <option value="25-50 Students" className="bg-slate-900">25 – 50 Students</option>
                    <option value="50-100 Students" className="bg-slate-900">50 – 100 Students</option>
                    <option value="100-300 Students" className="bg-slate-900">100 – 300 Students</option>
                    <option value="300+ Campus-Wide Cohort" className="bg-slate-900">300+ Full Campus Cohort</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-2">
                  Special Requirements or Branch Customizations
                </label>
                <textarea
                  rows={3}
                  value={collegeForm.message}
                  onChange={(e) => setCollegeForm({ ...collegeForm, message: e.target.value })}
                  placeholder="Mention branch preferences (e.g. CSE, IT, AI&DS, ECE), timeline, or custom syllabus requirements..."
                  className="w-full px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-white/50 flex items-center gap-2">
                  <FiCheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Draft MoU and faculty liaison kit will be dispatched via email</span>
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 transition-all"
                >
                  Request Institutional MoU Draft &amp; Curriculum Package
                </button>
              </div>
            </form>
          )}

          {formSubmitted && (
            <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-center text-sm text-emerald-300 animate-fade-in">
              <FiCheckCircle className="w-5 h-5 inline-block mr-2" />
              Thank you. Your submission has been routed. An official documentation kit will be dispatched immediately.
            </div>
          )}
        </div>
      </section>

      {/* Frequently Asked Questions Section */}
      <section className="py-20 px-4 bg-white/[0.015] border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-widest text-cyan-400 border border-cyan-500/30 bg-cyan-500/10">
              Clear Answers
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Frequently Asked Questions on AICTE Approval
            </h2>
            <p className="text-sm sm:text-base text-white/60">
              Everything students, faculty supervisors, and placement officers ask regarding AICTE compliance,
              mark transfers, and institutional validity.
            </p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 font-semibold text-base sm:text-lg text-white hover:text-cyan-300 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <FiChevronUp className="w-5 h-5 text-cyan-400 shrink-0" />
                    ) : (
                      <FiChevronDown className="w-5 h-5 text-white/40 shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 text-sm sm:text-base text-white/70 leading-relaxed border-t border-white/5 pt-4">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Template Preview Modal */}
      {activeModalTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="max-w-2xl w-full rounded-3xl border border-white/20 bg-[#0d0d12] p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  {activeModalTemplate.badge}
                </span>
                <h3 className="text-xl font-bold text-white mt-1">{activeModalTemplate.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalTemplate(null)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-white/80">
              <p>{activeModalTemplate.description}</p>

              <div className="p-4 rounded-xl bg-black border border-white/10 font-mono text-xs text-cyan-200 whitespace-pre-wrap leading-relaxed">
                {`[OFFICIAL SPECIMEN FORMAT]\n`}
                {`Document: ${activeModalTemplate.title}\n`}
                {`Compliance: ${activeModalTemplate.clause}\n`}
                {`Issuing Entity: ExpoGraph (MCA & MSME Registered)\n`}
                {`--------------------------------------------------\n`}
                {activeModalTemplate.contentPreview}
                {`\n\n[Full editable Word DOCX / PDF template is provided upon internship onboarding or TPO dispatch.]`}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => copyTemplateContent(activeModalTemplate.contentPreview)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white transition-colors"
              >
                <FiCopy className="w-3.5 h-3.5" />
                {copiedNotice ? "Copied Specimen!" : "Copy Specimen Text"}
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTemplate(null)}
                className="px-6 py-2 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-white transition-colors"
              >
                Close Specimen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 pt-12 pb-16 bg-[#030304] border-t border-white/[0.08]">
        <FlowTubesFooterInner
          title="ExpoGraph Internships"
          titleClassName="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-[0_0_25px_rgba(0,0,0,1)]"
          interactionHint="AICTE Policy & NEP 2020 Compliant Technical Internship Ecosystem"
        />
      </footer>
    </div>
  );
}
