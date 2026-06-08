import { createBrowserRouter, Outlet, Navigate, useLocation } from "react-router-dom";
import { Suspense, useEffect } from "react";
import RequireRole from "./RequireRole";
import RouteErrorFallback from "./RouteErrorFallback";
import SuperAdminLayout from "./layouts/SuperAdminLayout";
import MentorLayout from "./layouts/MentorLayout";
import StudentLayout from "./layouts/StudentLayout";
import PublicOnly from "./PublicOnly";

import HomeOrRedirect from "./HomeOrRedirect";
import { SeoManager } from "../seo/SeoManager";
import LoginPage from "../pages/auth/LoginPage";
import AdminLoginPage from "../pages/auth/AdminLoginPage";
import NotFoundPageRoute from "../pages/NotFoundPage";
import StudentHome from "../pages/lms/student/StudentHome";
import StudentCourses from "../pages/lms/student/StudentCourses";
import {
  CoursesPageSkeleton,
  GenericPageSkeleton,
  LaunchPadLoadingSkeleton,
  PresentationPageSkeleton,
  RouteFallbackSkeleton,
  SolutionsHomePageSkeleton,
  SolutionsServiceDetailSkeleton,
  SolutionsSubPageSkeleton,
  StudentCoursesSkeleton,
  StudentHomeSkeleton,
  StudentBookmarksSkeleton,
  StudentCertificatesSkeleton,
} from "../Components/common/SkeletonLoaders";
import { LaunchPadProvider } from "../Components/startup-launchpad/LaunchPadContext";
import LaunchPadAccessGate from "../Components/startup-launchpad/LaunchPadAccessGate";

import SolutionsPage from "../pages/solutions/SolutionsPage";
import SolutionsBookMeetPage from "../pages/solutions/SolutionsBookMeetPage";
import SolutionsPricingPage from "../pages/solutions/SolutionsPricingPage";
import SolutionsProcessPage from "../pages/solutions/SolutionsProcessPage";
import SolutionsFaqPage from "../pages/solutions/SolutionsFaqPage";
import SolutionsThankYouPage from "../pages/solutions/SolutionsThankYouPage";
import AiAutomationSmbsPage from "../pages/solutions/services/AiAutomationSmbsPage";
import LeadGenerationWebsitesPage from "../pages/solutions/services/LeadGenerationWebsitesPage";
import WhatsappSalesSupportSystemsPage from "../pages/solutions/services/WhatsappSalesSupportSystemsPage";
import AiCustomerSupportAssistantsPage from "../pages/solutions/services/AiCustomerSupportAssistantsPage";
import CrmSalesWorkflowSetupPage from "../pages/solutions/services/CrmSalesWorkflowSetupPage";
import InternalDashboardsAdminPortalsPage from "../pages/solutions/services/InternalDashboardsAdminPortalsPage";
import MvpBuildSprintsPage from "../pages/solutions/services/MvpBuildSprintsPage";
import CoursesPage from "../pages/courses/CoursesPage";
import CourseDetailPage from "../pages/courses/CourseDetailPage";
import CourseExplorePage from "../pages/courses/CourseExplorePage";
import FeatureDetailPage from "../pages/features/FeatureDetailPage";
import ContactPage from "../pages/contact/ContactPage";
import CollegeOverviewPage from "../pages/academy/CollegeOverviewPage";
import AccountPendingPage from "../pages/payment/AccountPendingPage";
import PaymentFailurePage from "../pages/payment/PaymentFailurePage";
import PrivacyPolicyPage from "../pages/legal/PrivacyPolicyPage";
import TermsConditionsPage from "../pages/legal/TermsConditionsPage";
import CourseContentsSidebarDemo from "../pages/demo/CourseContentsSidebarDemo";
import PresentationPage from "../pages/presentation/PresentationPage";
import BlogPage from "../pages/blog/BlogPage";
import BlogPostPage from "../pages/blog/BlogPostPage";
import SitemapPage from "../pages/sitemap/SitemapPage";

import SuperAdminHome from "../pages/lms/superadmin/SuperAdminHome";
import SuperAdminCourses from "../pages/lms/superadmin/SuperAdminCourses";
import SuperAdminCoursePacks from "../pages/lms/superadmin/SuperAdminCoursePacks";
import SuperAdminModuleLessons from "../pages/lms/superadmin/SuperAdminModuleLessons";
import SuperAdminCreateLesson from "../pages/lms/superadmin/SuperAdminCreateLesson";
import SuperAdminViewLesson from "../pages/lms/superadmin/SuperAdminViewLesson";
import SuperAdminWorkshops from "../pages/lms/superadmin/SuperAdminWorkshops";
import SuperAdminCertificates from "../pages/lms/superadmin/SuperAdminCertificates";
import SuperAdminClientLab from "../pages/lms/superadmin/SuperAdminClientLab";
import SuperAdminClientLabRealWorld from "../pages/lms/superadmin/SuperAdminClientLabRealWorld";
import SuperAdminApprovals from "../pages/lms/superadmin/SuperAdminApprovals";
import SuperAdminFeedback from "../pages/lms/superadmin/SuperAdminFeedback";
import SuperAdminDoubts from "../pages/lms/superadmin/SuperAdminDoubts";
import SuperAdminStudents from "../pages/lms/superadmin/SuperAdminStudents";
import SuperAdminLeaderboard from "../pages/lms/superadmin/SuperAdminLeaderboard";
import SuperAdminRouteVisits from "../pages/lms/superadmin/SuperAdminRouteVisits";
import SuperAdminMentors from "../pages/lms/superadmin/SuperAdminMentors";
import SuperAdminColleges from "../pages/lms/superadmin/SuperAdminColleges";
import SuperAdminCertificationRequests from "../pages/lms/superadmin/SuperAdminCertificationRequests";

import StudentLesson from "../pages/lms/student/StudentLesson";
import StudentSubmissions from "../pages/lms/student/StudentSubmissions";
import StudentProgress from "../pages/lms/student/StudentProgress";
import StudentCertificates from "../pages/lms/student/StudentCertificates";
import StudentInternships from "../pages/lms/student/StudentInternships";
import StudentClientLab from "../pages/lms/student/StudentClientLab";
import StudentWorkshops from "../pages/lms/student/StudentWorkshops";
import StudentEvents from "../pages/lms/student/StudentEvents";
import StudentReferrals from "../pages/lms/student/StudentReferrals";
import StudentQuestionBank from "../pages/lms/student/StudentQuestionBank";
import StudentResumeBuilder from "../pages/lms/student/StudentResumeBuilder";
import StudentBookmarks from "../pages/lms/student/StudentBookmarks";
import StudentCourseLanding from "../pages/lms/student/StudentCourseLanding";
import StudentContact from "../pages/lms/student/StudentContact";
import StudentProfile from "../pages/lms/student/StudentProfile";
import StudentJobsPage from "../pages/lms/student/StudentJobsPage";
import StudentProgramJourney from "../pages/lms/student/StudentProgramJourney";
import StartupLaunchPadShell from "../Components/startup-launchpad/StartupLaunchPadShell";
import LaunchPadHomeScreen from "../Components/startup-launchpad/screens/HomeScreen";
import LaunchPadReadinessScreen from "../Components/startup-launchpad/screens/ReadinessScreen";
import LaunchPadDashboardScreen from "../Components/startup-launchpad/screens/DashboardScreen";
import LaunchPadPathScreen from "../Components/startup-launchpad/screens/PathScreen";
import LaunchPadStageScreen from "../Components/startup-launchpad/screens/StageScreen";
import LaunchPadToolsScreen from "../Components/startup-launchpad/screens/ToolsScreen";
import LaunchPadLegalScreen from "../Components/startup-launchpad/screens/LegalScreen";
import LaunchPadProfileScreen from "../Components/startup-launchpad/screens/ProfileScreen";
import MentorHome from "../pages/lms/mentor/MentorHome";
import MentorSubmissions from "../pages/lms/mentor/MentorSubmissions";
import MentorClientLab from "../pages/lms/mentor/MentorClientLab";
import MentorInternships from "../pages/lms/mentor/MentorInternships";
import MentorStudents from "../pages/lms/mentor/MentorStudents";
import MentorAnalytics from "../pages/lms/mentor/MentorAnalytics";
import MentorCommunications from "../pages/lms/mentor/MentorCommunications";
import MentorCalendar from "../pages/lms/mentor/MentorCalendar";
import MentorResources from "../pages/lms/mentor/MentorResources";
import MentorSettings from "../pages/lms/mentor/MentorSettings";

import TenantAdminHome from "../pages/lms/admin/TenantAdminHome";
import TenantAdminSettings from "../pages/lms/admin/TenantAdminSettings";
import TenantAdminUsers from "../pages/lms/admin/TenantAdminUsers";

function AuthRouteSkeleton() {
  return (
    <div className="min-h-screen bg-black pt-24 px-4">
      <div className="mx-auto max-w-md animate-pulse space-y-5">
        <div className="h-10 w-40 mx-auto rounded bg-white/10" />
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 space-y-4">
          <div className="h-8 w-56 mx-auto rounded bg-white/10" />
          <div className="h-11 rounded-xl bg-white/10" />
          <div className="h-11 rounded-xl bg-white/10" />
          <div className="h-11 rounded-xl bg-violet-500/30" />
        </div>
      </div>
    </div>
  );
}

function ContactRouteSkeleton() {
  return (
    <div className="min-h-screen bg-black pt-24 px-4 animate-pulse">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="h-10 w-72 rounded bg-white/10" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] h-72" />
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] h-72" />
        </div>
      </div>
    </div>
  );
}

function CourseDetailRouteSkeleton() {
  return (
    <div className="min-h-screen bg-black pt-24 px-4 animate-pulse">
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="h-5 w-36 rounded bg-white/10" />
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 space-y-4">
          <div className="h-8 w-3/4 rounded bg-white/10" />
          <div className="h-4 w-full rounded bg-white/10" />
          <div className="h-4 w-2/3 rounded bg-white/10" />
          <div className="h-12 w-full rounded-xl bg-violet-500/30" />
        </div>
      </div>
    </div>
  );
}

function LegalRouteSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-24 px-4 animate-pulse">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-10 w-64 rounded bg-white/10" />
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-6 w-48 rounded bg-white/10" />
            <div className="h-4 w-full rounded bg-white/10" />
            <div className="h-4 w-5/6 rounded bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

const SOLUTIONS_AUX_PATHS = new Set([
  "/solutions/book-a-meet",
  "/solutions/pricing",
  "/solutions/process",
  "/solutions/faq",
  "/solutions/thank-you",
]);

function RouteAwareFallback() {
  const { pathname } = useLocation();

  if (pathname === "/presentation") return <PresentationPageSkeleton />;
  if (pathname.startsWith("/solutions")) {
    if (pathname === "/solutions") return <SolutionsHomePageSkeleton />;
    if (SOLUTIONS_AUX_PATHS.has(pathname)) return <SolutionsSubPageSkeleton />;
    return <SolutionsServiceDetailSkeleton />;
  }

  if (pathname === "/login" || pathname === "/adminlogin") return <AuthRouteSkeleton />;
  if (pathname === "/courses") return <CoursesPageSkeleton />;
  if (pathname.startsWith("/courses/")) return <CourseDetailRouteSkeleton />;
  if (pathname === "/contact") return <ContactRouteSkeleton />;
  if (pathname.startsWith("/features/")) return <CourseDetailRouteSkeleton />;
  if (pathname === "/privacy-policy" || pathname === "/terms-and-conditions" || pathname === "/sitemap" || pathname.startsWith("/blog")) return <LegalRouteSkeleton />;
  if (pathname === "/account-pending" || pathname === "/payment-failure") return <AuthRouteSkeleton />;

  if (pathname.startsWith("/lms/student/courses")) return <StudentCoursesSkeleton />;
  if (pathname === "/lms/student") return <StudentHomeSkeleton />;
  if (pathname === "/lms/jobs") return <GenericPageSkeleton />;
  if (pathname.startsWith("/lms/startup-launchpad")) return <LaunchPadLoadingSkeleton />;
  if (pathname.startsWith("/lms/student")) return <GenericPageSkeleton />;
  if (pathname.startsWith("/lms/superadmin")) return <GenericPageSkeleton />;
  if (pathname.startsWith("/lms/mentor")) return <GenericPageSkeleton />;
  if (pathname.startsWith("/lms/admin")) return <GenericPageSkeleton />;

  return <RouteFallbackSkeleton />;
}

function L({ children }) {
  return <Suspense fallback={<RouteAwareFallback />}>{children}</Suspense>;
}

function LBookmarks({ children }) {
  return <Suspense fallback={<StudentBookmarksSkeleton />}>{children}</Suspense>;
}

function LCertificates({ children }) {
  return <Suspense fallback={<StudentCertificatesSkeleton />}>{children}</Suspense>;
}

// Simple layout wrapper - just renders children
function SimpleLayout() {
  return <Outlet />;
}

// Portal layout wrapper - just renders children
function PortalLayout() {
  return <Outlet />;
}

/** Scroll to top on every route change (pathname + search) so new pages start at the top. */
function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname, search]);
  return null;
}

function RootWithSeo() {
  return (
    <>
      <SeoManager />
      <ScrollToTop />
      <Outlet />
    </>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootWithSeo />,
    errorElement: <RouteErrorFallback />,
    children: [
      {
        element: <SimpleLayout />,
        errorElement: <RouteErrorFallback />,
        children: [
      { path: "/", element: <HomeOrRedirect /> },
      { path: "/academy", element: <HomeOrRedirect /> },
      { path: "/academy/college-overview", element: <L><CollegeOverviewPage /></L> },
      { path: "/solutions", element: <L><SolutionsPage /></L> },
      { path: "/solutions/book-a-meet", element: <L><SolutionsBookMeetPage /></L> },
      { path: "/solutions/pricing", element: <L><SolutionsPricingPage /></L> },
      { path: "/solutions/process", element: <L><SolutionsProcessPage /></L> },
      { path: "/solutions/faq", element: <L><SolutionsFaqPage /></L> },
      { path: "/solutions/thank-you", element: <L><SolutionsThankYouPage /></L> },
      { path: "/solutions/ai-automation-smbs", element: <L><AiAutomationSmbsPage /></L> },
      { path: "/solutions/lead-generation-websites", element: <L><LeadGenerationWebsitesPage /></L> },
      { path: "/solutions/whatsapp-sales-support-systems", element: <L><WhatsappSalesSupportSystemsPage /></L> },
      { path: "/solutions/ai-customer-support-assistants", element: <L><AiCustomerSupportAssistantsPage /></L> },
      { path: "/solutions/crm-sales-workflow-setup", element: <L><CrmSalesWorkflowSetupPage /></L> },
      { path: "/solutions/internal-dashboards-admin-portals", element: <L><InternalDashboardsAdminPortalsPage /></L> },
      { path: "/solutions/mvp-build-sprints", element: <L><MvpBuildSprintsPage /></L> },
      { path: "/courses", element: <L><CoursesPage /></L> },
      { path: "/courses/explore/:slug", element: <L><CourseExplorePage /></L> },
      { path: "/courses/:slug", element: <L><CourseDetailPage /></L> },
      { path: "/features/:slug", element: <L><FeatureDetailPage /></L> },
      { path: "/contact", element: <L><ContactPage /></L> },
      { path: "/demo/course-sidebar", element: <L><CourseContentsSidebarDemo /></L> },
      { path: "/presentation", element: <L><PresentationPage /></L> },
      { path: "/deck", element: <Navigate to="/presentation" replace /> },
      { path: "/product-story", element: <Navigate to="/presentation" replace /> },
      { path: "/login", element: <PublicOnly><LoginPage /></PublicOnly> },
      { path: "/adminlogin", element: <PublicOnly><AdminLoginPage /></PublicOnly> },
      { path: "/privacy-policy", element: <L><PrivacyPolicyPage /></L> },
      { path: "/terms-and-conditions", element: <L><TermsConditionsPage /></L> },
      { path: "/blog", element: <L><BlogPage /></L> },
      { path: "/blog/:slug", element: <L><BlogPostPage /></L> },
      { path: "/sitemap", element: <L><SitemapPage /></L> },
      { path: "/account-pending", element: <L><AccountPendingPage /></L> },
      { path: "/payment-failure", element: <L><PaymentFailurePage /></L> },
      { path: "/not-found", element: <NotFoundPageRoute /> },
      { path: "*", element: <NotFoundPageRoute /> },
        ],
      },
      {
        element: <SimpleLayout />,
        errorElement: <RouteErrorFallback />,
        children: [
      {
        path: "/lms/superadmin",
        element: (
          <RequireRole allow={["SuperAdmin"]}>
            <SuperAdminLayout />
          </RequireRole>
        ),
        children: [
          { index: true, element: <L><SuperAdminHome /></L> },
          { path: "route-visits", element: <L><SuperAdminRouteVisits /></L> },
          { path: "approvals", element: <L><SuperAdminApprovals /></L> },
          { path: "feedback", element: <L><SuperAdminFeedback /></L> },
          { path: "doubts", element: <L><SuperAdminDoubts /></L> },
          // Courses Management
          { path: "courses", element: <L><SuperAdminCourses /></L> },
          { path: "courses/list", element: <L><SuperAdminCourses /></L> },
          { path: "course-packs", element: <L><SuperAdminCoursePacks /></L> },
          { path: "courses/:courseId", element: <L><SuperAdminCourses /></L> },
          { path: "courses/:courseId/modules/:moduleId", element: <L><SuperAdminCourses /></L> },
          { path: "courses/:courseId/modules/:moduleId/lessons/create", element: <L><SuperAdminCreateLesson /></L> },
          { path: "courses/:courseId/modules/:moduleId/lessons/:lessonId", element: <L><SuperAdminViewLesson /></L> },
          { path: "courses/:courseId/modules/:moduleId/lessons/:lessonId/edit", element: <L><SuperAdminModuleLessons /></L> },
          
          // Workshops/Events
          { path: "workshops", element: <L><SuperAdminWorkshops /></L> },
          { path: "workshops/cards", element: <L><SuperAdminWorkshops /></L> },
          { path: "workshops/list", element: <L><SuperAdminWorkshops /></L> },
          { path: "workshops/create", element: <L><SuperAdminWorkshops /></L> },
          { path: "workshops/new", element: <L><SuperAdminWorkshops /></L> },
          { path: "workshops/:id", element: <L><SuperAdminWorkshops /></L> },
          { path: "workshops/:id/details", element: <L><SuperAdminWorkshops /></L> },
          { path: "workshops/:id/edit", element: <L><SuperAdminWorkshops /></L> },
          { path: "workshops/:id/registrations", element: <L><SuperAdminWorkshops /></L> },
          
          // Certificates
          { path: "certificates", element: <L><SuperAdminCertificates /></L> },
          { path: "certifications", element: <L><SuperAdminCertificationRequests /></L> },
          { path: "certificates/cards", element: <L><SuperAdminCertificates /></L> },
          { path: "certificates/list", element: <L><SuperAdminCertificates /></L> },
          { path: "certificates/create", element: <L><SuperAdminCertificates /></L> },
          { path: "certificates/issue", element: <L><SuperAdminCertificates /></L> },
          { path: "certificates/:id", element: <L><SuperAdminCertificates /></L> },
          { path: "certificates/:id/details", element: <L><SuperAdminCertificates /></L> },
          { path: "certificates/:id/verify", element: <L><SuperAdminCertificates /></L> },
          
          // Real Client Lab
          { path: "client-lab", element: <Navigate to="client-lab/real-world" replace /> },
          { path: "client-lab/cards", element: <L><SuperAdminClientLab /></L> },
          { path: "client-lab/list", element: <L><SuperAdminClientLab /></L> },
          { path: "client-lab/create", element: <L><SuperAdminClientLab /></L> },
          { path: "client-lab/projects", element: <L><SuperAdminClientLab /></L> },
          { path: "client-lab/projects/create", element: <L><SuperAdminClientLab /></L> },
          { path: "client-lab/projects/:id", element: <L><SuperAdminClientLab /></L> },
          { path: "client-lab/projects/:id/edit", element: <L><SuperAdminClientLab /></L> },
          { path: "client-lab/projects/:id/details", element: <L><SuperAdminClientLab /></L> },
          { path: "client-lab/clients", element: <L><SuperAdminClientLab /></L> },
          { path: "client-lab/tasks", element: <L><SuperAdminClientLab /></L> },
          { path: "client-lab/real-world", element: <L><SuperAdminClientLabRealWorld /></L> },
          { path: "client-lab/real-world/projects/:id", element: <L><SuperAdminClientLabRealWorld /></L> },
          
          // Students Management
          { path: "students", element: <L><SuperAdminStudents /></L> },
          { path: "students/leaderboard", element: <L><SuperAdminLeaderboard /></L> },
          { path: "students/cards", element: <L><SuperAdminStudents /></L> },
          { path: "students/list", element: <L><SuperAdminStudents /></L> },
          { path: "students/undo", element: <L><SuperAdminStudents /></L> },
          { path: "students/create", element: <L><SuperAdminStudents /></L> },
          { path: "students/add", element: <L><SuperAdminStudents /></L> },
          { path: "students/:id", element: <L><SuperAdminStudents /></L> },
          { path: "students/:id/details", element: <L><SuperAdminStudents /></L> },
          { path: "students/:id/edit", element: <L><SuperAdminStudents /></L> },
          { path: "students/:id/enrollments", element: <L><SuperAdminStudents /></L> },
          { path: "students/:id/progress", element: <L><SuperAdminStudents /></L> },
          
          // Mentors Management
          { path: "mentors", element: <L><SuperAdminMentors /></L> },
          { path: "mentors/cards", element: <L><SuperAdminMentors /></L> },
          { path: "mentors/list", element: <L><SuperAdminMentors /></L> },
          { path: "mentors/create", element: <L><SuperAdminMentors /></L> },
          { path: "mentors/add", element: <L><SuperAdminMentors /></L> },
          { path: "mentors/:id", element: <L><SuperAdminMentors /></L> },
          { path: "mentors/:id/details", element: <L><SuperAdminMentors /></L> },
          { path: "mentors/:id/edit", element: <L><SuperAdminMentors /></L> },
          { path: "colleges", element: <L><SuperAdminColleges /></L> },
          { path: "mentors/:id/students", element: <L><SuperAdminMentors /></L> },
          { path: "mentors/:id/assignments", element: <L><SuperAdminMentors /></L> },
        ],
      },
      {
        path: "/lms/admin",
        element: (
          <RequireRole allow={["TenantAdmin"]}>
            <PortalLayout />
          </RequireRole>
        ),
        children: [
          { index: true, element: <L><TenantAdminHome /></L> },
          { path: "settings", element: <L><TenantAdminSettings /></L> },
          { path: "users", element: <L><TenantAdminUsers /></L> },
        ],
      },
      {
        path: "/lms/mentor",
        element: (
          <RequireRole allow={["Mentor"]}>
            <MentorLayout />
          </RequireRole>
        ),
        children: [
          { index: true, element: <L><MentorHome /></L> },
          
          // Students/Mentees Management
          { path: "students", element: <L><MentorStudents /></L> },
          { path: "students/cards", element: <L><MentorStudents /></L> },
          { path: "students/list", element: <L><MentorStudents /></L> },
          { path: "students/:id", element: <L><MentorStudents /></L> },
          { path: "students/:id/details", element: <L><MentorStudents /></L> },
          { path: "students/:id/progress", element: <L><MentorStudents /></L> },
          
          // Submissions Review
          { path: "submissions", element: <L><MentorSubmissions /></L> },
          { path: "submissions/queue", element: <L><MentorSubmissions /></L> },
          { path: "submissions/list", element: <L><MentorSubmissions /></L> },
          { path: "submissions/:submissionId", element: <L><MentorSubmissions /></L> },
          { path: "submissions/:submissionId/review", element: <L><MentorSubmissions /></L> },
          
          // Communications
          { path: "communications", element: <L><MentorCommunications /></L> },
          { path: "communications/messages", element: <L><MentorCommunications /></L> },
          { path: "communications/alerts", element: <L><MentorCommunications /></L> },
          { path: "communications/notifications", element: <L><MentorCommunications /></L> },
          
          // Calendar
          { path: "calendar", element: <L><MentorCalendar /></L> },
          { path: "calendar/schedule", element: <L><MentorCalendar /></L> },
          { path: "calendar/meetings", element: <L><MentorCalendar /></L> },
          { path: "calendar/availability", element: <L><MentorCalendar /></L> },
          
          // Analytics
          { path: "analytics", element: <L><MentorAnalytics /></L> },
          { path: "analytics/overview", element: <L><MentorAnalytics /></L> },
          { path: "analytics/mentees", element: <L><MentorAnalytics /></L> },
          { path: "analytics/performance", element: <L><MentorAnalytics /></L> },
          { path: "analytics/engagement", element: <L><MentorAnalytics /></L> },
          
          // Real Client Lab
          { path: "client-lab", element: <L><MentorClientLab /></L> },
          { path: "client-lab/projects", element: <L><MentorClientLab /></L> },
          { path: "client-lab/projects/list", element: <L><MentorClientLab /></L> },
          { path: "client-lab/projects/:projectId", element: <L><MentorClientLab /></L> },
          { path: "client-lab/projects/:projectId/details", element: <L><MentorClientLab /></L> },
          { path: "client-lab/projects/:projectId/tasks", element: <L><MentorClientLab /></L> },
          { path: "client-lab/projects/:projectId/tasks/:taskId/review", element: <L><MentorClientLab /></L> },
          
          // Internships
          { path: "internships", element: <L><MentorInternships /></L> },
          { path: "internships/assignments", element: <L><MentorInternships /></L> },
          { path: "internships/deliverables", element: <L><MentorInternships /></L> },
          { path: "internships/deliverables/:deliverableId", element: <L><MentorInternships /></L> },
          { path: "internships/deliverables/:deliverableId/review", element: <L><MentorInternships /></L> },
          
          // Resources
          { path: "resources", element: <L><MentorResources /></L> },
          { path: "resources/materials", element: <L><MentorResources /></L> },
          { path: "resources/guides", element: <L><MentorResources /></L> },
          { path: "resources/best-practices", element: <L><MentorResources /></L> },
          
          // Settings
          { path: "settings", element: <L><MentorSettings /></L> },
          { path: "settings/profile", element: <L><MentorSettings /></L> },
          { path: "settings/preferences", element: <L><MentorSettings /></L> },
        ],
      },
      {
        path: "/lms/jobs",
        element: (
          <RequireRole allow={["Student"]}>
            <StudentLayout />
          </RequireRole>
        ),
        children: [{ index: true, element: <L><StudentJobsPage /></L> }],
      },
      {
        path: "/lms/startup-launchpad",
        element: (
          <RequireRole allow={["Student"]}>
            <StudentLayout />
          </RequireRole>
        ),
        children: [
          {
            element: (
              <LaunchPadAccessGate>
                <LaunchPadProvider>
                  <L>
                    <StartupLaunchPadShell />
                  </L>
                </LaunchPadProvider>
              </LaunchPadAccessGate>
            ),
            children: [
              { index: true, element: <L><LaunchPadHomeScreen /></L> },
              { path: "readiness", element: <L><LaunchPadReadinessScreen /></L> },
              { path: "dashboard", element: <L><LaunchPadDashboardScreen /></L> },
              { path: "path", element: <L><LaunchPadPathScreen /></L> },
              { path: "stage/:stageSlug", element: <L><LaunchPadStageScreen /></L> },
              { path: "tools", element: <L><LaunchPadToolsScreen /></L> },
              { path: "legal", element: <L><LaunchPadLegalScreen /></L> },
              { path: "profile", element: <L><LaunchPadProfileScreen /></L> },
            ],
          },
        ],
      },
      {
        path: "/lms/student",
        element: (
          <RequireRole allow={["Student"]}>
            <StudentLayout />
          </RequireRole>
        ),
        children: [
          { index: true, element: <StudentHome /> },
          { path: "program-journey", element: <L><StudentProgramJourney /></L> },

          // Progress
          { path: "progress", element: <L><StudentProgress /></L> },
          { path: "progress/overview", element: <L><StudentProgress /></L> },
          { path: "progress/courses", element: <L><StudentProgress /></L> },
          { path: "progress/achievements", element: <L><StudentProgress /></L> },
          
          // Courses (eager-loaded for instant navigation)
          { path: "courses", element: <StudentCourses /> },
          { path: "courses/list", element: <StudentCourses /> },
          { path: "courses/:courseSlug", element: <L><StudentCourseLanding /></L> },
          { path: "courses/:courseSlug/modules/:moduleSlug/lessons/:lessonSlug", element: <L><StudentLesson /></L> },
          { path: "courses/:courseSlug/modules/:moduleSlug/lessons/:lessonSlug/complete", element: <L><StudentLesson /></L> },
          
          // Bonus Courses
          { path: "bonus-courses", element: <StudentCourses /> },
          { path: "bonus-courses/list", element: <StudentCourses /> },
          { path: "bonus-courses/:courseSlug", element: <L><StudentCourseLanding /></L> },
          { path: "bonus-courses/:courseSlug/modules/:moduleSlug/lessons/:lessonSlug", element: <L><StudentLesson /></L> },
          
          // Bookmarks
          { path: "bookmarks", element: <LBookmarks><StudentBookmarks /></LBookmarks> },
          
          // Question Bank
          { path: "question-bank", element: <L><StudentQuestionBank /></L> },
          { path: "question-bank/list", element: <L><StudentQuestionBank /></L> },
          { path: "question-bank/practice", element: <L><StudentQuestionBank /></L> },
          
          // Resume Builder
          { path: "resume-builder", element: <L><StudentResumeBuilder /></L> },
          
          // Profile
          { path: "profile", element: <L><StudentProfile /></L> },
          { path: "profile/edit", element: <L><StudentProfile /></L> },
          { path: "profile/settings", element: <L><StudentProfile /></L> },
          
          // Real Client Lab
          { path: "client-lab", element: <L><StudentClientLab /></L> },
          { path: "client-lab/projects", element: <L><StudentClientLab /></L> },
          { path: "client-lab/projects/:projectId", element: <L><StudentClientLab /></L> },
          { path: "client-lab/projects/:projectId/tasks", element: <L><StudentClientLab /></L> },
          { path: "client-lab/projects/:projectId/tasks/:taskId", element: <L><StudentClientLab /></L> },
          
          // Submissions
          { path: "submissions", element: <L><StudentSubmissions /></L> },
          { path: "submissions/list", element: <L><StudentSubmissions /></L> },
          { path: "submissions/:submissionId", element: <L><StudentSubmissions /></L> },
          
          // Certificates
          { path: "certificates", element: <LCertificates><StudentCertificates /></LCertificates> },
          { path: "certificates/list", element: <LCertificates><StudentCertificates /></LCertificates> },
          { path: "certificates/:id", element: <LCertificates><StudentCertificates /></LCertificates> },
          { path: "certificates/:id/view", element: <LCertificates><StudentCertificates /></LCertificates> },
          
          // Internships
          { path: "internships", element: <L><StudentInternships /></L> },
          { path: "internships/list", element: <L><StudentInternships /></L> },
          { path: "internships/apply", element: <L><StudentInternships /></L> },
          { path: "internships/:id", element: <L><StudentInternships /></L> },
          { path: "internships/:id/details", element: <L><StudentInternships /></L> },
          { path: "internships/:id/apply", element: <L><StudentInternships /></L> },
          
          // Events (workshops, challenges, live sessions)
          { path: "events", element: <L><StudentEvents /></L> },
          { path: "events/:id", element: <L><StudentEvents /></L> },

          // Workshops
          { path: "workshops", element: <L><StudentWorkshops /></L> },
          { path: "workshops/list", element: <L><StudentWorkshops /></L> },
          { path: "workshops/:id", element: <L><StudentWorkshops /></L> },
          { path: "workshops/:id/details", element: <L><StudentWorkshops /></L> },
          { path: "workshops/:id/register", element: <L><StudentWorkshops /></L> },
          
          // Contact / Support
          { path: "contact", element: <L><StudentContact /></L> },

          // Referrals
          { path: "referrals", element: <L><StudentReferrals /></L> },
          { path: "referrals/list", element: <L><StudentReferrals /></L> },
          { path: "referrals/create", element: <L><StudentReferrals /></L> },
          { path: "referrals/:id", element: <L><StudentReferrals /></L> },
        ],
      },
    ],
  },
    ],
  },
]);
