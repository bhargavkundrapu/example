import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { apiFetch } from "../../services/api";
import { Header } from "../../Components/ui/header-2";
import { BuyNowModal } from "../../Components/payments/BuyNowModal";
import { cn } from "../../lib/utils";
import { FiArrowLeft, FiBookOpen } from "react-icons/fi";
import { RouteFallbackSkeleton } from "../../Components/common/SkeletonLoaders";
import { applyCourseDetailSeo, sendGtagPageView } from "../../seo/applyDocumentSeo";
import { COURSE_EXPLORE_DATA } from "../../data/courseExploreData";
import { getCourseCardCover } from "../../data/courseCardMedia";

function formatPrice(paise) {
  if (paise == null || paise === undefined) return "-";
  const rupees = Math.round(paise / 100);
  return `₹${rupees.toLocaleString("en-IN")}`;
}

export default function CourseDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [pack, setPack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [buyTarget, setBuyTarget] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        const [courseRes, packRes] = await Promise.allSettled([
          apiFetch(`/api/v1/courses/${slug}`),
          apiFetch(`/api/v1/packs/${slug}`),
        ]);

        const courseData = courseRes.status === "fulfilled" ? courseRes.value?.data : null;
        const packData = packRes.status === "fulfilled" ? packRes.value?.data : null;

        if (courseData?.course) {
          setCourse(courseData.course);
        } else if (packData) {
          setPack(packData);
        } else {
          setError("Not found");
        }
      } catch {
        setError("Failed to load");
      } finally {
        setLoading(false);
      }
    }
    if (slug) fetchData();
  }, [slug]);

  /** API-driven SEO (title, meta, canonical, OG/Twitter, JSON-LD) - no UI change. */
  useEffect(() => {
    if (!slug || loading || error) return;
    if (!course && !pack) return;
    const itemTitle = course?.title ?? pack?.title;
    if (!itemTitle) return;
    const rawDesc = (course?.description || pack?.description || "").replace(/\s+/g, " ").trim();
    applyCourseDetailSeo({
      slug,
      title: itemTitle,
      description: rawDesc,
      isCourse: !!course,
    });
    sendGtagPageView(`${window.location.pathname}${window.location.search}`);
  }, [slug, loading, error, course, pack]);

  const item = course
    ? { type: "course", id: course.id, title: course.title, price: course.price_in_paise }
    : pack
      ? { type: "pack", id: pack.id, title: pack.title, price: pack.price_in_paise }
      : null;

  const handleBuyClick = () => {
    if (item && (item.price || 0) >= 100) {
      setBuyTarget(item);
      setModalOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="min-h-[60vh]">
          <RouteFallbackSkeleton />
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <FiBookOpen className="w-16 h-16 text-slate-600" />
          <p className="text-slate-400">Course or pack not found</p>
          <button
            onClick={() => navigate("/courses")}
            className="px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  const modules = course?.modules || [];
  const pricePaise = item.price || 0;
  const canBuy = pricePaise >= 100;
  const coverSrc = getCourseCardCover(
    course?.slug || pack?.slug || slug,
    course?.title || pack?.title
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <button
          onClick={() => navigate("/courses")}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-8"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Courses
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "overflow-hidden rounded-2xl border border-white/10",
            "bg-gradient-to-b from-white/5 to-transparent"
          )}
        >
          <div className="relative aspect-[21/9] w-full overflow-hidden bg-white/5 sm:aspect-[3/1]">
            <img src={coverSrc} alt={`${item.title} Course cover`} className="h-full w-full object-cover" loading="lazy" decoding="async" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" aria-hidden />
          </div>
          <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{item.title}</h1>
              {(course?.description || pack?.description) && (
                <p className="text-slate-400 text-base mb-4">
                  {course?.description || pack?.description}
                </p>
              )}
              {course && (
                <p className="text-slate-500 text-sm">
                  {modules.length} module{modules.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            <div className="flex flex-col items-start gap-3 shrink-0">
              <span className="font-mono text-2xl font-semibold">{formatPrice(pricePaise)}</span>
              {canBuy ? (
                <button
                  onClick={handleBuyClick}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  Get Course
                </button>
              ) : (
                <span className="text-slate-500 text-sm">Free or coming soon</span>
              )}
            </div>
          </div>

          {course && modules.length > 0 && (
            <div className="mt-8 pt-8 border-t border-white/10">
              <h2 className="text-lg font-semibold mb-4">Curriculum</h2>
              <ul className="space-y-3">
                {modules.map((mod, i) => (
                  <li key={mod.id || i} className="flex items-center gap-3 text-slate-300">
                    <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm">
                      {i + 1}
                    </span>
                    {mod.title}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Related Courses */}
          <div className="mt-8 pt-8 border-t border-white/10">
            <h3 className="text-lg font-semibold mb-4 text-white">Other Courses You Might Like</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.keys(COURSE_EXPLORE_DATA)
                .filter((k) => k !== slug)
                .map((k) => {
                  const rCourse = COURSE_EXPLORE_DATA[k];
                  return (
                    <Link
                      key={k}
                      to={`/courses/${k}`}
                      className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors flex flex-col justify-between"
                    >
                      <div>
                        <h4 className="text-sm font-semibold text-white">{rCourse.title}</h4>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">{rCourse.tagline}</p>
                      </div>
                      <span className="text-xs text-blue-400 font-medium mt-3 inline-flex items-center gap-0.5">
                        View details →
                      </span>
                    </Link>
                  );
                })}
            </div>
          </div>
          </div>
        </motion.div>
      </div>

      <BuyNowModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        item={buyTarget}
        onSuccess={() => setModalOpen(false)}
        fromCourseRoute
      />
    </div>
  );
}
