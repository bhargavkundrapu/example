import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";

const DEFAULT_INTERACTION_HINT =
  "Move the cursor around to interact and Click to randomize.";

/**
 * Footer content for WebGL Tubes blocks. Stacks hint, © line, and legal links in normal flow
 * (no overlapping absolute layers) so copy and links stay readable on narrow/mobile viewports.
 */
export default function FlowTubesFooterInner({
  shellClassName,
  className,
  title = "ExpoGraph flow",
  titleClassName,
  hideTitle = false,
  showInteractionHint = true,
  interactionHint = DEFAULT_INTERACTION_HINT,
}) {
  const year = new Date().getFullYear();
  const titleStyles =
    titleClassName ??
    "text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-white drop-shadow-[0_0_20px_rgba(0,0,0,1)]";

  return (
    <div className={cn("flex min-h-0 w-full flex-col px-4", shellClassName, className)}>
      {!hideTitle ? (
        <div className="flex min-h-[200px] flex-1 flex-col items-center justify-center py-6 sm:min-h-[240px] sm:py-10">
          <div className="pointer-events-auto cursor-default select-none space-y-2 text-center">
            <h2 className={titleStyles}>{title}</h2>
          </div>
        </div>
      ) : (
        <div className="min-h-[100px] flex-1 sm:min-h-[140px]" aria-hidden />
      )}

      <div className="flex flex-col items-center gap-3  pb-8 pt-6 sm:gap-4 sm:pb-10 sm:pt-8">
        {showInteractionHint ? (
          <p className="pointer-events-none max-w-md px-3 text-center text-[10px] font-normal uppercase leading-snug tracking-widest text-white/50 sm:text-xs">
            {interactionHint}
          </p>
        ) : null}
        <span className="text-xs text-white/40">&copy; {year} ExpoGraph Academy</span>
        <nav
          className="flex max-w-sm flex-row flex-wrap items-center justify-center gap-x-5 gap-y-2.5 px-2 text-center text-xs leading-relaxed text-white/55 [&_a]:whitespace-normal sm:max-w-none"
          aria-label="Footer links"
        >
          <Link to="/courses" className="underline underline-offset-4 hover:text-white/80">
            Courses
          </Link>
          <Link to="/solutions" className="underline underline-offset-4 hover:text-white/80">
            Solutions
          </Link>
          <Link to="/academy#features" className="underline underline-offset-4 hover:text-white/80">
            Features
          </Link>
          <Link to="/contact" className="underline underline-offset-4 hover:text-white/80">
            Contact
          </Link>
          <Link to="/blog" className="underline underline-offset-4 hover:text-white/80">
            Blog
          </Link>
          <Link to="/sitemap" className="underline underline-offset-4 hover:text-white/80">
            Sitemap
          </Link>
          <span className="text-white/20" aria-hidden="true">|</span>
          <Link to="/privacy-policy" className="underline underline-offset-4 hover:text-white/80">
            Privacy Policy
          </Link>
          <Link to="/terms-and-conditions" className="underline underline-offset-4 hover:text-white/80">
            Terms &amp; Conditions
          </Link>
        </nav>
      </div>
    </div>
  );
}
