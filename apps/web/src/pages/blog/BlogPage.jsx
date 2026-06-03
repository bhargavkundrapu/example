import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "../../Components/ui/header-2";
import { TubesBackground } from "../../Components/ui/neon-flow";
import FlowTubesFooterInner from "../../Components/ui/FlowTubesFooterInner";
import { BLOG_POSTS } from "../../data/blogData";
import { FiClock, FiUser, FiCalendar, FiArrowRight } from "react-icons/fi";

export default function BlogPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const posts = Object.values(BLOG_POSTS);

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
        className="relative flex min-h-[40vh] w-full items-center justify-center pt-28 pb-16 px-4 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(124,58,237,0.12),transparent_50%)]"
      >
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="inline-block text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full border border-purple-500/30 text-purple-400 bg-purple-500/10">
            Insights & Guides
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
            ExpoGraph Academy Blog
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-white/55 max-w-2xl mx-auto leading-relaxed">
            Read practical articles on Vibe Coding, Prompt Engineering, AI Automations, and building your career in the AI era.
          </p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300 group hover:scale-[1.01]"
            >
              <Link to={`/blog/${post.slug}`} className="relative aspect-[16/9] overflow-hidden bg-white/5 shrink-0">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  loading="lazy"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" aria-hidden />
              </Link>
              <div className="flex flex-1 flex-col p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-4 text-xs text-white/40 mb-4 font-mono">
                  <span className="flex items-center gap-1.5">
                    <FiCalendar className="w-3.5 h-3.5" />
                    {post.date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FiClock className="w-3.5 h-3.5" />
                    {post.readingTime}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FiUser className="w-3.5 h-3.5" />
                    {post.author}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 group-hover:text-purple-400 transition-colors leading-tight">
                  <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>
                <p className="text-sm text-white/55 leading-relaxed line-clamp-3 mb-6 flex-1">
                  {post.excerpt}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {post.keywords.slice(0, 3).map((kw) => (
                    <span
                      key={kw}
                      className="inline-flex items-center rounded-md border border-white/5 bg-white/5 px-2 py-0.5 text-[11px] text-white/50"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
                <Link
                  to={`/blog/${post.slug}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors mt-auto self-start group-hover:translate-x-0.5 transition-transform"
                >
                  Read Article
                  <FiArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </article>
          ))}
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
