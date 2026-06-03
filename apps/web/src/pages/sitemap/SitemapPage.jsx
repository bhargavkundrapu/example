import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "../../Components/ui/header-2";
import { TubesBackground } from "../../Components/ui/neon-flow";
import FlowTubesFooterInner from "../../Components/ui/FlowTubesFooterInner";
import { COURSE_EXPLORE_DATA } from "../../data/courseExploreData";
import { BLOG_POSTS } from "../../data/blogData";

export default function SitemapPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const coursesList = Object.values(COURSE_EXPLORE_DATA);
  const blogsList = Object.values(BLOG_POSTS);

  const featuresList = [
    { name: "Smart Prompt Library", slug: "smart-prompts" },
    { name: "Resume Builder", slug: "resume-builder" },
    { name: "Real Client Lab", slug: "real-client-lab" },
    { name: "Learning Portal", slug: "learning-portal" },
    { name: "Structured Lessons", slug: "structured-lessons" },
    { name: "Jobs Search Hub", slug: "jobs-search-hub" },
    { name: "Startup Launchpad", slug: "startup-launchpad" },
  ];

  const solutionsList = [
    { name: "SMB AI Automation", slug: "ai-automation-smbs" },
    { name: "Lead-Gen Websites", slug: "lead-generation-websites" },
    { name: "WhatsApp Sales Flows", slug: "whatsapp-sales-support-systems" },
    { name: "AI Support Assistants", slug: "ai-customer-support-assistants" },
    { name: "CRM Setup & Pipeline", slug: "crm-sales-workflow-setup" },
    { name: "Internal Dashboards", slug: "internal-dashboards-admin-portals" },
    { name: "MVP Build Sprints", slug: "mvp-build-sprints" },
  ];

  return (
    <div
      className="min-h-screen relative w-full overflow-x-hidden"
      style={{
        fontFamily: "var(--font-dm)",
        backgroundColor: "#0a0a0a",
        color: "var(--text-secondary)",
      }}
    >
      <Header />

      <div
        className="relative flex min-h-[35vh] w-full items-center justify-center pt-28 pb-12 px-4 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(124,58,237,0.12),transparent_50%)]"
      >
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full border border-violet-500/30 text-violet-400 bg-violet-500/10">
            Navigation Map
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
            Sitemap
          </h1>
          <p className="text-sm sm:text-base text-white/55 max-w-xl mx-auto">
            A comprehensive overview of all public landing pages, courses, features, and resources available on ExpoGraph Academy.
          </p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          
          {/* Column 1: Core & Solutions */}
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">Core Pages</h2>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link to="/" className="text-white/60 hover:text-purple-400 transition-colors">Homepage / Academy</Link>
                </li>
                <li>
                  <Link to="/courses" className="text-white/60 hover:text-purple-400 transition-colors">Courses Catalog</Link>
                </li>
                <li>
                  <Link to="/solutions" className="text-white/60 hover:text-purple-400 transition-colors">Solutions Services</Link>
                </li>
                <li>
                  <Link to="/academy/college-overview" className="text-white/60 hover:text-purple-400 transition-colors">College &amp; Campus Brief</Link>
                </li>
                <li>
                  <Link to="/contact" className="text-white/60 hover:text-purple-400 transition-colors">Contact Support</Link>
                </li>
                <li>
                  <Link to="/presentation" className="text-white/60 hover:text-purple-400 transition-colors">Product Pitch Deck</Link>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">Solutions Services</h2>
              <ul className="space-y-3 text-sm">
                {solutionsList.map((sol) => (
                  <li key={sol.slug}>
                    <Link to={`/solutions/${sol.slug}`} className="text-white/60 hover:text-purple-400 transition-colors">{sol.name}</Link>
                  </li>
                ))}
                <li>
                  <Link to="/solutions/pricing" className="text-white/60 hover:text-purple-400 transition-colors">Pricing Bands</Link>
                </li>
                <li>
                  <Link to="/solutions/process" className="text-white/60 hover:text-purple-400 transition-colors">Our Delivery Process</Link>
                </li>
                <li>
                  <Link to="/solutions/faq" className="text-white/60 hover:text-purple-400 transition-colors">Solutions FAQ</Link>
                </li>
                <li>
                  <Link to="/solutions/book-a-meet" className="text-white/60 hover:text-purple-400 transition-colors">Schedule Consultation</Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Column 2: Courses & Features */}
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">Course Catalog</h2>
              <ul className="space-y-3 text-sm">
                {coursesList.map((c) => (
                  <li key={c.slug} className="space-y-1.5">
                    <div className="font-semibold text-white/80">{c.title}</div>
                    <div className="pl-3 flex flex-col gap-1.5 border-l border-white/10">
                      <Link to={`/courses/explore/${c.slug}`} className="text-white/50 hover:text-purple-400 transition-colors">Explore</Link>
                      <Link to={`/courses/${c.slug}`} className="text-white/50 hover:text-purple-400 transition-colors">Detail / Purchase</Link>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">Platform Features</h2>
              <ul className="space-y-3 text-sm">
                {featuresList.map((feat) => (
                  <li key={feat.slug}>
                    <Link to={`/features/${feat.slug}`} className="text-white/60 hover:text-purple-400 transition-colors">{feat.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Column 3: Blog, Legal & Portals */}
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">Blog Articles</h2>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link to="/blog" className="text-white/80 font-semibold hover:text-purple-400 transition-colors">Blog Homepage</Link>
                </li>
                {blogsList.map((post) => (
                  <li key={post.slug}>
                    <Link to={`/blog/${post.slug}`} className="text-white/60 hover:text-purple-400 transition-colors">{post.title}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">Portal Entrance</h2>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link to="/login" className="text-white/60 hover:text-purple-400 transition-colors">OTP Login Gate</Link>
                </li>
                <li>
                  <Link to="/adminlogin" className="text-white/60 hover:text-purple-400 transition-colors">Staff Login Gate</Link>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">Legal Documents</h2>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link to="/privacy-policy" className="text-white/60 hover:text-purple-400 transition-colors">Privacy Policy</Link>
                </li>
                <li>
                  <Link to="/terms-and-conditions" className="text-white/60 hover:text-purple-400 transition-colors">Terms &amp; Conditions</Link>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </main>

      <footer className="w-full min-h-[560px] sm:min-h-[70vh] border-t border-black">
        <TubesBackground className="min-h-[560px] sm:min-h-[70vh] bg-[#0a0a0a]" enableClickInteraction={true}>
          <FlowTubesFooterInner shellClassName="min-h-[560px] sm:min-h-[70vh]" />
        </TubesBackground>
      </footer>
    </div>
  );
}
