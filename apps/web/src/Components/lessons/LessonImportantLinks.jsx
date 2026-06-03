import { FiExternalLink, FiLink } from "react-icons/fi";

/**
 * Highlighted official links referenced in the lesson video (below the player).
 */
export default function LessonImportantLinks({ links }) {
  if (!Array.isArray(links) || links.length === 0) return null;

  return (
    <div className="mt-6 rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-5 md:p-6 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
          <FiLink className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Important links from this lesson</h3>
          <p className="mt-1 text-sm text-slate-600 leading-relaxed">
            These are the same official sites shown in the video. Bookmark this section so you can open them quickly while you set up.
          </p>
        </div>
      </div>

      <ul className="space-y-3">
        {links.map((item) => (
          <li key={item.id}>
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-2 rounded-xl border border-slate-200/80 bg-white p-4 transition-all hover:border-indigo-300 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block h-2 w-2 shrink-0 rounded-full bg-gradient-to-r ${item.accent || "from-indigo-500 to-violet-500"}`}
                    aria-hidden
                  />
                  <span className="font-semibold text-slate-900">{item.title}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600 leading-relaxed pl-4">{item.description}</p>
              </div>
              <span
                className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-gradient-to-r px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-transform group-hover:scale-[1.02] ${item.accent || "from-indigo-500 to-violet-600"}`}
              >
                {item.cta || "Open link"}
                <FiExternalLink className="h-4 w-4" aria-hidden />
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
