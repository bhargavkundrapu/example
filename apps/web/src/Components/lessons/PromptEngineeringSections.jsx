import { useState } from "react";
import {
  FiTarget, FiBriefcase, FiAlertTriangle, FiXCircle,
  FiAlertOctagon, FiCheckCircle, FiCheck, FiZap,
  FiEdit3, FiAward, FiList, FiBookOpen, FiHelpCircle, FiStar,
  FiCopy, FiChevronDown, FiChevronUp, FiExternalLink, FiBook,
} from "react-icons/fi";
import StartLessonBlocks from "./StartLessonBlocks";

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };
  return (
    <button
      onClick={handleCopy}
      className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-white/80 backdrop-blur-sm border border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900 transition-all shadow-sm"
    >
      <FiCopy className="w-3 h-3" />
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function PromptBlock({ label, content, variant = "default" }) {
  const styles = {
    bad: "bg-red-50 border-red-200 text-red-900",
    good: "bg-emerald-50 border-emerald-200 text-emerald-900",
    upgrade: "bg-violet-50 border-violet-200 text-violet-900",
    default: "bg-slate-50 border-slate-200 text-slate-800",
  };
  return (
    <div className="relative group">
      {label && (
        <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-t-md ${
          variant === "bad" ? "bg-red-100 text-red-600" :
          variant === "good" ? "bg-emerald-100 text-emerald-600" :
          variant === "upgrade" ? "bg-violet-100 text-violet-600" :
          "bg-slate-100 text-slate-500"
        }`}>{label}</span>
      )}
      <div className={`relative rounded-lg border p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap ${styles[variant]}`}>
        <CopyButton text={content} />
        {content}
      </div>
    </div>
  );
}

function OutputBlock({ content, variant = "default" }) {
  const styles = {
    bad: "border-l-4 border-l-red-400 bg-red-50/50",
    good: "border-l-4 border-l-emerald-400 bg-emerald-50/50",
    default: "border-l-4 border-l-slate-300 bg-slate-50/50",
  };
  return (
    <div className={`rounded-r-lg p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap ${styles[variant]}`}>
      {content}
    </div>
  );
}

function SectionWrapper({ children, id }) {
  return (
    <div id={id} className="scroll-mt-20">
      {children}
    </div>
  );
}

function SectionGoal({ data }) {
  return (
    <SectionWrapper id="sec-goal">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-5 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <FiTarget className="w-4 h-4" />
          </div>
          <h3 className="text-lg font-bold tracking-tight">Your Mission</h3>
        </div>
        <p className="text-white/95 text-base font-medium leading-relaxed">{data.headline}</p>
        {data.real_world && (
          <p className="mt-2 text-blue-100 text-sm italic">{data.real_world}</p>
        )}
      </div>
    </SectionWrapper>
  );
}

function SectionUseCase({ data }) {
  return (
    <SectionWrapper id="sec-usecase">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
            <FiBriefcase className="w-4 h-4 text-amber-600" />
          </div>
          <h3 className="text-base font-bold text-amber-900">When You'll Use This</h3>
        </div>
        <p className="text-amber-800 text-sm leading-relaxed">{data.scenario}</p>
        {data.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {data.tags.map((tag, i) => (
              <span key={i} className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </SectionWrapper>
  );
}

function SectionBadPrompt({ data }) {
  return (
    <SectionWrapper id="sec-bad-prompt">
      <div className="space-y-3">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
            <FiAlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <h3 className="text-base font-bold text-slate-900">The Beginner Prompt</h3>
          <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-semibold rounded-full">Avoid This</span>
        </div>
        <PromptBlock label="Prompt" content={data.prompt} variant="bad" />
        {data.imageGallery?.beginner?.length > 0 && (
          <div className="mt-3">
            <ImageBelowPrompt urls={data.imageGallery.beginner} variant="beginner" />
          </div>
        )}
        {data.videoGallery?.beginner && (
          <div className="mt-3">
            <VideoBelowPrompt url={data.videoGallery.beginner} variant="beginner" />
          </div>
        )}
      </div>
    </SectionWrapper>
  );
}

function SectionBadOutput({ data }) {
  return (
    <SectionWrapper id="sec-bad-output">
      <div className="space-y-1">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
            <FiXCircle className="w-4 h-4 text-red-500" />
          </div>
          <h3 className="text-base font-bold text-slate-900">What AI Gives You</h3>
          <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-semibold rounded-full">Weak Result</span>
        </div>
        <OutputBlock content={data.output} variant="bad" />
      </div>
    </SectionWrapper>
  );
}

function SectionWhyFailed({ data }) {
  return (
    <SectionWrapper id="sec-why-failed">
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
            <FiAlertOctagon className="w-4 h-4 text-slate-600" />
          </div>
          <h3 className="text-base font-bold text-slate-900">What Went Wrong</h3>
        </div>
        <ul className="space-y-2">
          {data.reasons.map((r, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
              <span className="flex-shrink-0 w-5 h-5 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">{i + 1}</span>
              <span className="leading-relaxed">{r}</span>
            </li>
          ))}
        </ul>
      </div>
    </SectionWrapper>
  );
}

function SectionGoodPrompt({ data }) {
  return (
    <SectionWrapper id="sec-good-prompt">
      <div className="space-y-3">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
            <FiCheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-base font-bold text-slate-900">The Pro Prompt</h3>
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-xs font-semibold rounded-full">Use This</span>
        </div>
        <PromptBlock label="Prompt" content={data.prompt} variant="good" />
        {data.framework_used && (
          <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
            <FiZap className="w-3 h-3" /> Framework: {data.framework_used}
          </p>
        )}
        {data.imageGallery?.pro?.length > 0 && (
          <div className="mt-3">
            <ImageBelowPrompt urls={data.imageGallery.pro} variant="pro" />
          </div>
        )}
        {data.videoGallery?.pro && (
          <div className="mt-3">
            <VideoBelowPrompt url={data.videoGallery.pro} variant="pro" />
          </div>
        )}
      </div>
    </SectionWrapper>
  );
}

function SectionGoodOutput({ data }) {
  return (
    <SectionWrapper id="sec-good-output">
      <div className="space-y-1">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
            <FiCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-base font-bold text-slate-900">What AI Gives You Now</h3>
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-xs font-semibold rounded-full">Great Result</span>
        </div>
        <OutputBlock content={data.output} variant="good" />
      </div>
    </SectionWrapper>
  );
}

function SectionUpgrade({ data }) {
  return (
    <SectionWrapper id="sec-upgrade">
      <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
            <FiZap className="w-4 h-4 text-violet-600" />
          </div>
          <h3 className="text-base font-bold text-violet-900">Level Up</h3>
          <span className="px-2 py-0.5 bg-violet-100 text-violet-600 text-xs font-semibold rounded-full">Advanced</span>
        </div>
        <PromptBlock label="Upgraded Prompt" content={data.prompt} variant="upgrade" />
        <p className="mt-3 text-sm text-violet-700 font-medium">{data.what_changed}</p>
        {data.imageGallery?.levelUp?.length > 0 && (
          <div className="mt-3">
            <ImageBelowPrompt urls={data.imageGallery.levelUp} variant="levelUp" />
          </div>
        )}
        {data.videoGallery?.levelUp && (
          <div className="mt-3">
            <VideoBelowPrompt url={data.videoGallery.levelUp} variant="levelUp" />
          </div>
        )}
      </div>
    </SectionWrapper>
  );
}

function SectionGuidedPractice({ data }) {
  return (
    <SectionWrapper id="sec-practice">
      <div className="bg-sky-50 border border-sky-200 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
            <FiEdit3 className="w-4 h-4 text-sky-600" />
          </div>
          <h3 className="text-base font-bold text-sky-900">Try It Yourself</h3>
        </div>
        <ol className="space-y-3">
          {data.steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-7 h-7 bg-sky-200 text-sky-700 rounded-full flex items-center justify-center text-sm font-bold">{i + 1}</span>
              <span className="text-sm text-sky-800 leading-relaxed pt-1">{step}</span>
            </li>
          ))}
        </ol>
        {data.task && (
          <div className="mt-4 p-3 bg-white/60 rounded-lg border border-sky-200">
            <p className="text-sm font-semibold text-sky-900">Your Task: <span className="font-normal text-sky-700">{data.task}</span></p>
          </div>
        )}
      </div>
    </SectionWrapper>
  );
}

function SectionChallenge({ data }) {
  const [open, setOpen] = useState(false);
  return (
    <SectionWrapper id="sec-challenge">
      <div className="bg-gradient-to-r from-cyan-600 to-teal-500 rounded-xl p-5 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <FiAward className="w-4 h-4" />
          </div>
          <h3 className="text-lg font-bold tracking-tight">5-Minute Challenge</h3>
        </div>
        <p className="text-white/95 text-sm leading-relaxed">{data.description}</p>
        {data.hint && (
          <button onClick={() => setOpen(!open)} className="mt-3 flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors">
            {open ? <FiChevronUp className="w-3 h-3" /> : <FiChevronDown className="w-3 h-3" />}
            {open ? "Hide hint" : "Need a hint?"}
          </button>
        )}
        {open && data.hint && (
          <p className="mt-2 text-sm text-white/80 bg-white/10 rounded-lg p-3">{data.hint}</p>
        )}
      </div>
    </SectionWrapper>
  );
}

function SectionChecklist({ data }) {
  const [checked, setChecked] = useState({});
  return (
    <SectionWrapper id="sec-checklist">
      <div className="border border-slate-200 rounded-xl p-5 bg-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
            <FiList className="w-4 h-4 text-slate-600" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Ready to Move On?</h3>
        </div>
        <div className="space-y-2.5">
          {data.items.map((item, i) => (
            <label key={i} className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={!!checked[i]}
                onChange={() => setChecked(prev => ({ ...prev, [i]: !prev[i] }))}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className={`text-sm leading-relaxed transition-colors ${checked[i] ? "text-slate-400 line-through" : "text-slate-700"}`}>{item}</span>
            </label>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}

function SectionWhatYouLearned({ data }) {
  return (
    <SectionWrapper id="sec-learned">
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
            <FiBookOpen className="w-4 h-4 text-teal-600" />
          </div>
          <h3 className="text-base font-bold text-teal-900">Key Takeaways</h3>
        </div>
        <ul className="space-y-2">
          {data.points.map((p, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-teal-800">
              <span className="flex-shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-teal-400" />
              <span className="leading-relaxed">{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </SectionWrapper>
  );
}

function SectionMiniQuiz({ data }) {
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  return (
    <SectionWrapper id="sec-quiz">
      <div className="border-2 border-indigo-200 rounded-xl p-5 bg-indigo-50/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
            <FiHelpCircle className="w-4 h-4 text-indigo-600" />
          </div>
          <h3 className="text-base font-bold text-indigo-900">Quick Check</h3>
        </div>
        <div className="space-y-5">
          {data.questions.map((q, qi) => (
            <div key={qi}>
              <p className="text-sm font-semibold text-slate-900 mb-2">Q{qi + 1}. {q.question}</p>
              <div className="space-y-1.5">
                {q.options.map((opt, oi) => {
                  const selected = answers[qi] === oi;
                  const isCorrect = showResults && oi === q.correct;
                  const isWrong = showResults && selected && oi !== q.correct;
                  return (
                    <button
                      key={oi}
                      onClick={() => { if (!showResults) setAnswers(prev => ({ ...prev, [qi]: oi })); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all border ${
                        isCorrect ? "bg-emerald-100 border-emerald-300 text-emerald-800 font-medium" :
                        isWrong ? "bg-red-100 border-red-300 text-red-800" :
                        selected ? "bg-indigo-100 border-indigo-300 text-indigo-800" :
                        "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className="font-medium mr-2">{String.fromCharCode(65 + oi)}.</span>
                      {opt}
                    </button>
                  );
                })}
              </div>
              {showResults && q.explanation && (
                <p className="mt-2 text-xs text-indigo-700 bg-indigo-50 rounded-lg p-2">{q.explanation}</p>
              )}
            </div>
          ))}
        </div>
        {!showResults && Object.keys(answers).length === data.questions.length && (
          <button
            onClick={() => setShowResults(true)}
            className="mt-4 w-full py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Check Answers
          </button>
        )}
        {showResults && (
          <div className="mt-3 text-center">
            <p className="text-sm font-semibold text-indigo-900">
              Score: {data.questions.filter((q, i) => answers[i] === q.correct).length}/{data.questions.length}
            </p>
          </div>
        )}
      </div>
    </SectionWrapper>
  );
}

function SectionTakeaway({ data }) {
  return (
    <SectionWrapper id="sec-takeaway">
      <div className="relative bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-6 text-center shadow-lg overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500" />
        <FiStar className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
        <p className="text-white text-base font-semibold leading-relaxed max-w-md mx-auto">{data.line}</p>
      </div>
    </SectionWrapper>
  );
}

// --- Image Prompting module: example images below prompts (per-lesson config) ---
const IMAGE_PROMPTING_MODULE_SLUG = "m5-image-prompting";
const IMAGE_PROMPTING_GALLERY = {
  "image-prompt-formula": {
    beginner: ["https://res.cloudinary.com/da2wrgabu/image/upload/v1772967325/ChatGPT_Image_Mar_8_2026_03_55_40_PM_uq0z5h.png"],
    pro: ["https://res.cloudinary.com/da2wrgabu/image/upload/v1772967325/ChatGPT_Image_Mar_8_2026_03_55_44_PM_dhgeie.png"],
    levelUp: ["https://res.cloudinary.com/da2wrgabu/image/upload/v1772967324/ChatGPT_Image_Mar_8_2026_03_55_47_PM_snyrng.png"],
  },
  "composition-control": {
    beginner: ["https://res.cloudinary.com/da2wrgabu/image/upload/v1772967325/ChatGPT_Image_Mar_8_2026_03_55_50_PM_lz5ax3.png"],
    pro: ["https://res.cloudinary.com/da2wrgabu/image/upload/v1772967325/ChatGPT_Image_Mar_8_2026_03_55_55_PM_ngmgz5.png"],
    levelUp: [
      "https://res.cloudinary.com/da2wrgabu/image/upload/v1772967325/ChatGPT_Image_Mar_8_2026_03_56_06_PM_aiavjk.png",
      "https://res.cloudinary.com/da2wrgabu/image/upload/v1772967322/ChatGPT_Image_Mar_8_2026_04_13_47_PM_ywmg5m.png",
      "https://res.cloudinary.com/da2wrgabu/image/upload/v1772967322/ChatGPT_Image_Mar_8_2026_04_13_51_PM_pkj2ht.png",
    ],
  },
  "style-lighting-control": {
    beginner: ["https://res.cloudinary.com/da2wrgabu/image/upload/v1772967322/ChatGPT_Image_Mar_8_2026_04_13_55_PM_gwzddv.png"],
    pro: ["https://res.cloudinary.com/da2wrgabu/image/upload/v1772967319/ChatGPT_Image_Mar_8_2026_04_13_57_PM_ec0wws.png"],
    levelUp: [
      "https://res.cloudinary.com/da2wrgabu/image/upload/v1772967319/ChatGPT_Image_Mar_8_2026_04_14_03_PM_ygiyrd.png",
      "https://res.cloudinary.com/da2wrgabu/image/upload/v1772967322/ChatGPT_Image_Mar_8_2026_04_14_05_PM_jwhz6r.png",
      "https://res.cloudinary.com/da2wrgabu/image/upload/v1772967319/ChatGPT_Image_Mar_8_2026_04_14_09_PM_da0maa.png",
    ],
  },
  "consistency-characters": {
    beginner: ["https://res.cloudinary.com/da2wrgabu/image/upload/v1772967320/ChatGPT_Image_Mar_8_2026_04_14_12_PM_sthded.png"],
    pro: ["https://res.cloudinary.com/da2wrgabu/image/upload/v1772967320/ChatGPT_Image_Mar_8_2026_04_14_15_PM_mrkb19.png"],
    levelUp: ["https://res.cloudinary.com/da2wrgabu/image/upload/v1772967319/ChatGPT_Image_Mar_8_2026_04_14_17_PM_o2zf6m.png"],
  },
  "character-consistency": {
    beginner: ["https://res.cloudinary.com/da2wrgabu/image/upload/v1772967320/ChatGPT_Image_Mar_8_2026_04_14_12_PM_sthded.png"],
    pro: ["https://res.cloudinary.com/da2wrgabu/image/upload/v1772967320/ChatGPT_Image_Mar_8_2026_04_14_15_PM_mrkb19.png"],
    levelUp: ["https://res.cloudinary.com/da2wrgabu/image/upload/v1772967319/ChatGPT_Image_Mar_8_2026_04_14_17_PM_o2zf6m.png"],
  },
};

// Inline image block: sits directly below a prompt section, same layout/style as that section.
function ImageBelowPrompt({ urls, variant }) {
  const [index, setIndex] = useState(0);
  const list = Array.isArray(urls) && urls.length > 0 ? urls : [];
  const single = list.length <= 1;
  const currentUrl = list[index] || list[0];

  const styles = {
    beginner: {
      wrap: "bg-red-50 border-red-200",
      pagination: "bg-red-100 text-red-700",
      paginationActive: "bg-red-600 text-white",
    },
    pro: {
      wrap: "bg-emerald-50 border-emerald-200",
      pagination: "bg-emerald-100 text-emerald-700",
      paginationActive: "bg-emerald-600 text-white",
    },
    levelUp: {
      wrap: "bg-violet-50 border-violet-200",
      pagination: "bg-violet-100 text-violet-700",
      paginationActive: "bg-violet-600 text-white",
    },
  };
  const s = styles[variant] || styles.beginner;

  if (!currentUrl) return null;

  return (
    <div className={`rounded-lg border p-4 ${s.wrap}`}>
      {!single && list.length > 1 && (
        <div className="flex items-center gap-1.5 mb-2">
          {list.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className={`w-7 h-7 rounded-full text-xs font-medium transition-colors ${i === index ? s.paginationActive : s.pagination} hover:opacity-90`}
              aria-label={`Image ${i + 1} of ${list.length}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
      <img
        src={currentUrl}
        alt=""
        className="w-full h-auto rounded-lg object-contain max-h-[380px] bg-white border border-slate-200/80"
      />
    </div>
  );
}

// --- Video Script module: reference videos below prompts (per-lesson config) ---
const VIDEO_SCRIPT_MODULE_SLUG = "m6-video-scripts";
const VIDEO_REFERENCE_DISCLAIMER =
  "These reference clips were created with Adobe Firefly for demonstration. For your own projects, we recommend tools like Veo 3 or Sora 4 for higher-quality video. Use these as a learning reference-your results will vary based on the tool and prompts you use.";

const VIDEO_SCRIPT_GALLERY = {
  "hook-script-template": {
    beginner: "https://res.cloudinary.com/da2wrgabu/video/upload/v1772973012/Firefly_Hi_everyone_welcome_to_my_channel_Today_we_re_going_to_talk_about_Python_programming._Pyth_cqhwca.mp4",
    pro: "https://res.cloudinary.com/da2wrgabu/video/upload/v1772973011/Firefly_HOOK-_-NASA_uses_Python._Instagram_uses_Python._And_you_can_learn_it_in_one_weekend.-__PROBL_bqakvn.mp4",
    levelUp: "https://res.cloudinary.com/da2wrgabu/video/upload/v1772973015/Firefly_Hook_Options-_1._--CURIOSITY_HOOK---_What_if_the_language_you_use_every_day_to_build_com_b22egg.mp4",
  },
  "script-to-storyboard": {
    beginner: "https://res.cloudinary.com/da2wrgabu/video/upload/v1772973011/Firefly_Scene_1-_Show_Python_logo_Scene_2-_Show_code_editor_Scene_3-_Show_the_results__Vague_no_tim_oqbxug.mp4",
    pro: "https://res.cloudinary.com/da2wrgabu/video/upload/v1772973007/Firefly_-_Shot_-_Duration_-_Script_-_Type_-_Visual_-_Transition_-_----------------------------------_gdxb2m.mp4",
    levelUp: "https://res.cloudinary.com/da2wrgabu/video/upload/v1772973004/Firefly_Equipment_Phone_mic_screen_record__Time_20_min__Shots_1_0-00-0-03__Script-_-Python-_Eas_flmzba.mp4",
  },
  "shot-list-broll": {
    beginner: "https://res.cloudinary.com/da2wrgabu/video/upload/v1772973007/Firefly_1._Show_someone_typing_code_2._Show_a_computer_screen_3._Show_books__Generic_boring_unspec_wc6vnn.mp4",
    pro: "https://res.cloudinary.com/da2wrgabu/video/upload/v1772973007/Firefly_--Morning_Routine---_1._Close-up_of_alarm_clock_at_7-00_AM_hand_reaching_to_turn_it_off_2s_pytkpa.mp4",
    levelUp: "https://res.cloudinary.com/da2wrgabu/video/upload/v1772973006/Firefly_-_Shot_ID_-_Category_-_Description_with_Specific_Visual_Details_-_Shot_Type_Camera_Movemen_wgsymf.mp4",
  },
  "shot-list-b-roll": {
    beginner: "https://res.cloudinary.com/da2wrgabu/video/upload/v1772973007/Firefly_1._Show_someone_typing_code_2._Show_a_computer_screen_3._Show_books__Generic_boring_unspec_wc6vnn.mp4",
    pro: "https://res.cloudinary.com/da2wrgabu/video/upload/v1772973007/Firefly_--Morning_Routine---_1._Close-up_of_alarm_clock_at_7-00_AM_hand_reaching_to_turn_it_off_2s_pytkpa.mp4",
    levelUp: "https://res.cloudinary.com/da2wrgabu/video/upload/v1772973006/Firefly_-_Shot_ID_-_Category_-_Description_with_Specific_Visual_Details_-_Shot_Type_Camera_Movemen_wgsymf.mp4",
  },
  "captions-onscreen-text": {
    beginner: "https://res.cloudinary.com/da2wrgabu/video/upload/v1772972998/Firefly_Just_a_transcript_of_the_spoken_words_--_no_formatting_no_emphasis_no_timing_no_visual_t_xeuxig.mp4",
    pro: "https://res.cloudinary.com/da2wrgabu/video/upload/v1772973000/Firefly_--CLOSED_CAPTIONS---__0-00_NASA_uses_PYTHON.__0-02_INSTAGRAM_uses_Python.__0-03_And_you_c_penqlg.mp4",
    levelUp: "https://res.cloudinary.com/da2wrgabu/video/upload/v1772973001/Firefly_Video_Script_with_Text_Overlay_Plan_--Scene_Description---_A_man_is_standing_against_an_virpta.mp4",
  },
  "captions-on-screen-text": {
    beginner: "https://res.cloudinary.com/da2wrgabu/video/upload/v1772972998/Firefly_Just_a_transcript_of_the_spoken_words_--_no_formatting_no_emphasis_no_timing_no_visual_t_xeuxig.mp4",
    pro: "https://res.cloudinary.com/da2wrgabu/video/upload/v1772973000/Firefly_--CLOSED_CAPTIONS---__0-00_NASA_uses_PYTHON.__0-02_INSTAGRAM_uses_Python.__0-03_And_you_c_penqlg.mp4",
    levelUp: "https://res.cloudinary.com/da2wrgabu/video/upload/v1772973001/Firefly_Video_Script_with_Text_Overlay_Plan_--Scene_Description---_A_man_is_standing_against_an_virpta.mp4",
  },
  "30-45-60-sec-templates": {
    beginner: "https://res.cloudinary.com/da2wrgabu/video/upload/v1772972998/Firefly_A_script_with_no_timing_no_structure_and_uncertain_length_--_could_be_20_seconds_or_3_min_wfw9tv.mp4",
    pro: "https://res.cloudinary.com/da2wrgabu/video/upload/v1772972999/Firefly_HOOK_0-5s_-_-These_3_extensions_saved_me_10_hours_last_week.-__CONTEXT_5-15s_-_-Most_devel_f55aa5.mp4",
    levelUp: "https://res.cloudinary.com/da2wrgabu/video/upload/v1772972997/Firefly_1._30-SECOND_TEMPLATE_Reels-Shorts_-__Hook_0-3s_-_SHOCKING_STATEMENT___One_Big_Point_3-2_jemvvz.mp4",
  },
};

function isImagePromptingModule(slug) {
  if (!slug) return false;
  const s = String(slug).toLowerCase().replace(/_/g, "-");
  return s === "image-prompting" || s === "m5-image-prompting" || s.includes("image-prompt");
}

function isVideoScriptsModule(slug) {
  if (!slug) return false;
  const s = String(slug).toLowerCase().replace(/_/g, "-");
  return s === "video-scripts" || s === "m6-video-scripts" || s.includes("video-script") || s.includes("video-prompt");
}

function VideoBelowPrompt({ url, variant }) {
  if (!url) return null;
  const styles = {
    beginner: "bg-red-50 border-red-200",
    pro: "bg-emerald-50 border-emerald-200",
    levelUp: "bg-violet-50 border-violet-200",
  };
  const s = styles[variant] || styles.beginner;
  return (
    <div className={`rounded-lg border p-4 ${s}`}>
      <p className="text-xs text-slate-600 leading-relaxed mb-3 px-1">
        {VIDEO_REFERENCE_DISCLAIMER}
      </p>
      <video
        src={url}
        controls
        className="w-full rounded-lg bg-black border border-slate-200/80 max-h-[400px]"
        playsInline
        preload="metadata"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

const AI_DOT = {
  ChatGPT: "bg-emerald-400", Claude: "bg-orange-400", Gemini: "bg-blue-400",
  Perplexity: "bg-indigo-400", Midjourney: "bg-fuchsia-400", "DALL-E 3": "bg-rose-400", Copilot: "bg-sky-400",
};

function SectionBestAI({ data }) {
  return (
    <SectionWrapper id="sec-best-ai">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-50 via-white to-sky-50 border border-rose-200/60 shadow-sm">
        {/* Subtle top accent */}
        <div className="h-1 bg-gradient-to-r from-rose-300 via-pink-300 to-sky-300" />

        <div className="p-5 md:p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-gradient-to-br from-rose-400 to-pink-400 rounded-xl flex items-center justify-center shadow-sm">
              <FiZap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 tracking-tight">Try It Yourself</h3>
              <p className="text-[11px] text-slate-400">Best AI for this lesson</p>
            </div>
          </div>

          {/* Primary recommendation */}
          <div className="flex items-start gap-4 bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
            <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center">
              <span className="text-white font-bold text-base">{data.primary.name.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-slate-900">{data.primary.name}</span>
                {data.primary.model && (
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-medium rounded-full">{data.primary.model}</span>
                )}
                {data.primary.free && (
                  <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full">Free</span>
                )}
              </div>
              <p className="text-[13px] text-slate-500 leading-relaxed mt-1">{data.primary.why}</p>
              <a
                href={data.primary.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
              >
                Open {data.primary.name}
                <FiExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Alternatives */}
          {data.alternatives && data.alternatives.length > 0 && (
            <div className="mt-4">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">Also works great on</p>
              <div className="flex flex-wrap gap-2">
                {data.alternatives.map((alt, i) => (
                  <a
                    key={i}
                    href={alt.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all group"
                  >
                    <span className={`w-2 h-2 rounded-full ${AI_DOT[alt.name] || "bg-slate-400"}`} />
                    <span className="text-xs font-semibold text-slate-600">{alt.name}</span>
                    {alt.free && <span className="text-[9px] font-bold text-slate-400">FREE</span>}
                    <FiExternalLink className="w-3 h-3 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Pro tip / try prompt */}
          {data.try_prompt && (
            <div className="mt-4 p-3.5 bg-white rounded-xl border border-pink-100">
              <p className="text-[13px] text-slate-600 leading-relaxed">
                <span className="font-bold text-rose-500">Try this:</span> {data.try_prompt}
              </p>
            </div>
          )}
        </div>
      </div>
    </SectionWrapper>
  );
}

function SectionStart({ data }) {
  const blocks = data?.blocks;
  if (blocks && Array.isArray(blocks) && blocks.length > 0) {
    return <StartLessonBlocks blocks={blocks} accent="indigo" />;
  }
  const content = (data && (data.content ?? (typeof data === "string" ? data : ""))) || "";
  const paras = content ? content.split(/\n\n+/).filter(Boolean) : [];
  return (
    <div id="start-lesson" className="scroll-mt-20 max-w-3xl">
      <div className="prose prose-slate prose-lg max-w-none">
        {paras.length > 0 ? paras.map((p, i) => (
          <p key={i} className="text-slate-700 leading-relaxed mb-4 last:mb-0">{p}</p>
        )) : (
          <p className="text-slate-500 italic">Content loading...</p>
        )}
      </div>
    </div>
  );
}

// --- Dictionary lesson sections (different template: nav, intro, per-lesson prompt + keywords) ---

function SectionDictNav({ data }) {
  const links = data?.links || [];
  if (links.length === 0) return null;
  return (
    <SectionWrapper id="dict-nav">
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <FiBook className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Jump to a lesson</h3>
            <p className="text-sm text-slate-600">Use these links to go straight to the prompt and keywords for each lesson.</p>
          </div>
        </div>
        <nav className="flex flex-wrap gap-2">
          {links.map((link, i) => (
            <a
              key={i}
              href={`#dict-${link.anchorId}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-indigo-100 text-sm font-medium text-indigo-700 hover:bg-indigo-50 hover:border-indigo-200 transition-colors shadow-sm"
            >
              <FiBookOpen className="w-3.5 h-3.5 opacity-70" />
              {link.title}
            </a>
          ))}
        </nav>
      </div>
    </SectionWrapper>
  );
}

function SectionDictIntro({ data }) {
  const headline = data?.headline || "Module Dictionary";
  const description = data?.description || "For every lesson in this module you get a default prompt (with placeholders) and 20+ keywords to adapt it to your own scenario.";
  return (
    <SectionWrapper id="dict-intro">
      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-2">{headline}</h3>
        <p className="text-slate-700 leading-relaxed">{description}</p>
        <p className="mt-3 text-sm text-slate-600">
          Replace the <code className="px-1.5 py-0.5 rounded bg-slate-200 font-mono text-xs">[placeholders]</code> in each prompt and swap keywords from the list below to create different scenarios-with love, for you.
        </p>
      </div>
    </SectionWrapper>
  );
}

function DictPromptBlock({ content }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };
  const parts = content ? content.split(/(\[[^\]]+\])/g) : [];
  return (
    <div className="relative rounded-xl border-2 border-amber-200 bg-amber-50/60 p-4">
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-white border border-amber-200 text-amber-800 hover:bg-amber-100 transition-all"
      >
        <FiCopy className="w-3 h-3" />
        {copied ? "Copied!" : "Copy"}
      </button>
      <pre className="font-mono text-sm leading-relaxed whitespace-pre-wrap pr-16 text-slate-800">
        {parts.map((part, i) =>
          /^\[.+\]$/.test(part) ? (
            <span key={i} className="bg-amber-200/80 text-amber-900 px-1 rounded font-semibold">{part}</span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </pre>
    </div>
  );
}

function SectionDictEntry({ data }) {
  const anchorId = data?.anchorId || data?.lessonSlug || "entry";
  const lessonTitle = data?.lessonTitle || "Lesson";
  const defaultPrompt = data?.defaultPrompt || "";
  const keywords = Array.isArray(data?.keywords) ? data.keywords : [];
  return (
    <SectionWrapper id={`dict-${anchorId}`}>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h4 className="text-lg font-bold text-slate-900 mb-1">{lessonTitle}</h4>
        <p className="text-xs text-slate-500 mb-4">Default prompt-replace the placeholders for your scenario.</p>
        {defaultPrompt && (
          <div className="mb-6">
            <DictPromptBlock content={defaultPrompt} />
          </div>
        )}
        <h5 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Keywords to swap (20+ for different scenarios)</h5>
        <ul className="space-y-2.5">
          {keywords.map((kw, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex-shrink-0 font-mono text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                {typeof kw === "string" ? kw : kw.word}
              </span>
              <span className="text-sm text-slate-700 leading-relaxed">
                {typeof kw === "object" && kw.explanation ? kw.explanation : kw}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </SectionWrapper>
  );
}

const SECTION_RENDERERS = {
  "SEC-START": SectionStart,
  "SEC-YOU_ONLY": SectionStart,
  "SEC-01_GOAL": SectionGoal,
  "SEC-02_USE_CASE": SectionUseCase,
  "SEC-03_BAD_PROMPT": SectionBadPrompt,
  "SEC-04_BAD_OUTPUT": SectionBadOutput,
  "SEC-05_WHY_FAILED": SectionWhyFailed,
  "SEC-06_GOOD_PROMPT": SectionGoodPrompt,
  "SEC-07_GOOD_OUTPUT": SectionGoodOutput,
  "SEC-08_UPGRADE_PROMPT": SectionUpgrade,
  "SEC-09_GUIDED_PRACTICE": SectionGuidedPractice,
  "SEC-10_CHALLENGE": SectionChallenge,
  "SEC-11_CHECKLIST": SectionChecklist,
  "SEC-12_WHAT_YOU_LEARNED": SectionWhatYouLearned,
  "SEC-13_MINI_QUIZ": SectionMiniQuiz,
  "SEC-14_ONE_LINE_TAKEAWAY": SectionTakeaway,
  "SEC-15_BEST_AI": SectionBestAI,
  "SEC-DICT-NAV": SectionDictNav,
  "SEC-DICT-INTRO": SectionDictIntro,
  "SEC-DICT-ENTRY": SectionDictEntry,
};

function resolveGalleries(lessonSlug, moduleSlug, sections) {
  const modNorm = moduleSlug ? String(moduleSlug).toLowerCase().replace(/_/g, "-") : "";
  const lesNorm = lessonSlug ? String(lessonSlug).toLowerCase().replace(/_/g, "-") : "";

  let imageGallery = (lesNorm && IMAGE_PROMPTING_GALLERY[lesNorm]) || (lessonSlug && IMAGE_PROMPTING_GALLERY[lessonSlug]) || null;
  let videoGallery = (lesNorm && VIDEO_SCRIPT_GALLERY[lesNorm]) || (lessonSlug && VIDEO_SCRIPT_GALLERY[lessonSlug]) || null;

  // Module guard
  if (modNorm.includes("video")) {
    imageGallery = null;
  }
  if (modNorm.includes("image")) {
    videoGallery = null;
  }

  // Combined text fallback if neither gallery was matched by slug
  if (!imageGallery && !videoGallery) {
    const combinedText = [
      lesNorm,
      modNorm,
      ...(Array.isArray(sections) ? sections.map(s => {
        const d = s?.data ?? s;
        return [d?.headline, d?.prompt, d?.scenario, d?.task].join(" ");
      }) : [])
    ].filter(Boolean).join(" ").toLowerCase();

    // Check if lesson is an Image Prompting lesson
    if (modNorm.includes("image") || combinedText.includes("image-prompt") || combinedText.includes("composition") || combinedText.includes("lighting") || combinedText.includes("consistency")) {
      if (combinedText.includes("formula") || combinedText.includes("image-prompt-formula")) {
        imageGallery = IMAGE_PROMPTING_GALLERY["image-prompt-formula"];
      } else if (combinedText.includes("composition")) {
        imageGallery = IMAGE_PROMPTING_GALLERY["composition-control"];
      } else if (combinedText.includes("style") || combinedText.includes("lighting")) {
        imageGallery = IMAGE_PROMPTING_GALLERY["style-lighting-control"];
      } else if (combinedText.includes("consistency") || combinedText.includes("character")) {
        imageGallery = IMAGE_PROMPTING_GALLERY["character-consistency"];
      } else if (combinedText.includes("fix") || combinedText.includes("bad image") || combinedText.includes("iterate")) {
        imageGallery = IMAGE_PROMPTING_GALLERY["iterate-fix-bad-images"];
      }
    }

    // Check if lesson is a Video Scripts lesson
    if (modNorm.includes("video") || combinedText.includes("video-script") || combinedText.includes("storyboard") || combinedText.includes("b-roll") || combinedText.includes("caption")) {
      if (combinedText.includes("hook") || combinedText.includes("script-template")) {
        videoGallery = VIDEO_SCRIPT_GALLERY["hook-script-template"];
      } else if (combinedText.includes("storyboard")) {
        videoGallery = VIDEO_SCRIPT_GALLERY["script-to-storyboard"];
      } else if (combinedText.includes("shot") || combinedText.includes("b-roll") || combinedText.includes("broll")) {
        videoGallery = VIDEO_SCRIPT_GALLERY["shot-list-b-roll"];
      } else if (combinedText.includes("caption") || combinedText.includes("on-screen") || combinedText.includes("onscreen")) {
        videoGallery = VIDEO_SCRIPT_GALLERY["captions-on-screen-text"];
      } else if (combinedText.includes("30") || combinedText.includes("45") || combinedText.includes("60") || combinedText.includes("template")) {
        videoGallery = VIDEO_SCRIPT_GALLERY["30-45-60-sec-templates"];
      }
    }
  }

  return { imageGallery, videoGallery };
}

export default function PromptEngineeringSections({ sections, lessonSlug, moduleSlug }) {
  if (!sections || !Array.isArray(sections)) return null;

  const { imageGallery, videoGallery } = resolveGalleries(lessonSlug, moduleSlug, sections);

  return (
    <div className="space-y-5">
      {sections.map((sec, i) => {
        if (!sec || typeof sec !== "object") return null;
        const Renderer = SECTION_RENDERERS[sec.type];
        if (!Renderer) return null;

        const baseData = sec.data ?? sec;
        const sectionData = {
          ...baseData,
          imageGallery,
          videoGallery,
        };

        return <Renderer key={`${sec.type}-${i}`} data={sectionData} />;
      })}
    </div>
  );
}

export { SECTION_RENDERERS };
