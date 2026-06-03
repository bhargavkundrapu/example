import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Header } from "../../Components/ui/header-2";
import { TubesBackground } from "../../Components/ui/neon-flow";
import FlowTubesFooterInner from "../../Components/ui/FlowTubesFooterInner";
import { BLOG_POSTS } from "../../data/blogData";
import { FiArrowLeft, FiClock, FiUser, FiCalendar } from "react-icons/fi";

export default function BlogPostPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const post = BLOG_POSTS[slug];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [slug]);

  if (!post) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Article not found</h1>
          <Link to="/blog" className="text-purple-400 hover:underline inline-block">
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  // Parse lines to render basic paragraphs and markdown-like headings
  const renderContent = () => {
    return post.content.split("\n").map((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={index} className="h-4" />;
      
      if (trimmed.startsWith("## ")) {
        return (
          <h2 key={index} className="text-2xl font-bold text-white mt-10 mb-4 tracking-tight">
            {trimmed.replace("## ", "")}
          </h2>
        );
      }
      
      if (trimmed.startsWith("### ")) {
        return (
          <h3 key={index} className="text-xl font-bold text-white mt-8 mb-3 tracking-tight">
            {trimmed.replace("### ", "")}
          </h3>
        );
      }

      if (trimmed.startsWith("- ")) {
        return (
          <li key={index} className="text-base text-white/70 ml-6 list-disc mb-2 leading-relaxed">
            {trimmed.replace("- ", "")}
          </li>
        );
      }

      if (trimmed.startsWith("1. ")) {
        return (
          <li key={index} className="text-base text-white/70 ml-6 list-decimal mb-2 leading-relaxed">
            {trimmed.substring(3)}
          </li>
        );
      }

      if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
        return (
          <p key={index} className="text-base text-white/90 font-semibold my-4 leading-relaxed">
            {trimmed.replace(/\*\*/g, "")}
          </p>
        );
      }

      if (trimmed.startsWith("> ")) {
        return (
          <blockquote key={index} className="border-l-2 border-purple-500 bg-white/[0.03] pl-4 py-3 pr-2 my-6 italic text-white/80 rounded-r-lg">
            {trimmed.replace("> ", "")}
          </blockquote>
        );
      }

      return (
        <p key={index} className="text-base text-white/70 mb-5 leading-relaxed">
          {trimmed}
        </p>
      );
    });
  };

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

      <main className="max-w-3xl mx-auto px-4 pt-24 sm:pt-28 pb-24">
        <button
          onClick={() => navigate("/blog")}
          className="flex items-center gap-2 text-white/50 hover:text-white mb-8 transition-colors text-sm"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Blog
        </button>

        <article className="space-y-6">
          <header className="space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-white/40 font-mono py-2 border-y border-white/10">
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
          </header>

          <div className="relative aspect-[21/9] overflow-hidden rounded-2xl border border-white/10 bg-white/5 my-8">
            <img
              src={post.coverImage}
              alt={post.title}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="prose prose-invert max-w-none">
            {renderContent()}
          </div>
        </article>

        {/* Strengthen internal links: back to other blog posts */}
        <section className="mt-16 pt-10 border-t border-white/10">
          <h3 className="text-xl font-bold text-white mb-6">Read More Articles</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.values(BLOG_POSTS)
              .filter((p) => p.slug !== slug)
              .slice(0, 2)
              .map((p) => (
                <Link
                  key={p.slug}
                  to={`/blog/${p.slug}`}
                  className="p-5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20 transition-all flex flex-col justify-between"
                >
                  <div>
                    <h4 className="text-base font-semibold text-white line-clamp-1">{p.title}</h4>
                    <p className="text-xs text-white/50 mt-2 line-clamp-2">{p.excerpt}</p>
                  </div>
                  <span className="text-xs text-purple-400 font-medium mt-4 inline-flex items-center gap-1">
                    Read article →
                  </span>
                </Link>
              ))}
          </div>
        </section>
      </main>

      <footer className="w-full min-h-[560px] sm:min-h-[70vh] border-t border-black">
        <TubesBackground className="min-h-[560px] sm:min-h-[70vh] bg-[#0a0a0a]" enableClickInteraction={true}>
          <FlowTubesFooterInner shellClassName="min-h-[560px] sm:min-h-[70vh]" />
        </TubesBackground>
      </footer>
    </div>
  );
}
