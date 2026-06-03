import { COURSE_EXPLORE_DATA } from "../data/courseExploreData";
import { getSiteOrigin, absoluteUrl } from "./siteOrigin";
import { SITE_CONTACT } from "../config/siteContact";
import { BLOG_POSTS } from "../data/blogData";

/** Default from index.html - used when no route-specific copy exists */
export const DEFAULT_SITE_TITLE = "ExpoGraph Academy India | Vibe Coding, Prompt Engineering & AI Automations";
export const DEFAULT_SITE_DESCRIPTION =
  "Master AI Automations, Vibe Coding & Prompt Engineering with hands-on courses, real client projects and career-ready skills at ExpoGraph Academy.";

/** Feature detail pages - titles & descriptions aligned with FeatureDetailPage hero copy (SEO-only; no UI). */
const FEATURE_SEO = {
  "smart-prompts": {
    title: "Smart Prompt Library | ExpoGraph",
    description:
      "Copy-ready prompts, error-fix snippets, and command reference boxes for every lesson-HTML, CSS, JavaScript, React, Node.js, and more.",
  },
  "resume-builder": {
    title: "Resume Builder | ExpoGraph",
    description:
      "Craft an ATS-friendly resume in minutes with guided steps, professional templates, and instant PDF export.",
  },
  "real-client-lab": {
    title: "Real Client Lab | ExpoGraph",
    description:
      "Work on real client projects with mentor feedback and build portfolio-ready work that proves you can deliver.",
  },
  "learning-portal": {
    title: "Learning Portal | ExpoGraph",
    description:
      "Track progress, browse courses, and learn from one learner-friendly LMS dashboard-mobile-friendly and built for focus.",
  },
  "structured-lessons": {
    title: "Structured Lessons | ExpoGraph",
    description:
      "Every lesson follows Goal, Video, Setup, Prompts, Presentation, and Success Checkpoint-clear structure for hands-on learning.",
  },
  "jobs-search-hub": {
    title: "Jobs Search Hub | ExpoGraph",
    description:
      "India-first job search hub: role presets, keyword chips, and quick links to LinkedIn, Naukri, Indeed, Internshala, and more.",
  },
  "startup-launchpad": {
    title: "Startup LaunchPad | ExpoGraph",
    description:
      "Guided founder journey from idea to MVP, launch, legal setup, and growth-inside the ExpoGraph student LMS.",
  },
};

const NOINDEX_PATH_PREFIXES = [
  "/lms",
  "/login",
  "/adminlogin",
  "/account-pending",
  "/payment-failure",
  "/demo",
];

const NOINDEX_EXACT = new Set(["/not-found", "/solutions/thank-you"]);

function pathIsNoIndex(pathname) {
  if (NOINDEX_EXACT.has(pathname)) return true;
  for (const prefix of NOINDEX_PATH_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return true;
  }
  return false;
}

function slugToTitle(slug) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * @returns {{ title: string, description: string, robots: string, canonicalPath: string, jsonLd: object | null }}
 */
export function resolveSeo(pathname) {
  const path = pathname.split("?")[0] || "/";
  const robots = pathIsNoIndex(path) ? "noindex, nofollow" : "index, follow";

  if (pathIsNoIndex(path)) {
    return {
      title: DEFAULT_SITE_TITLE,
      description: DEFAULT_SITE_DESCRIPTION,
      robots,
      canonicalPath: path,
      jsonLd: null,
    };
  }

  if (path === "/" || path === "/academy") {
    return {
      title: DEFAULT_SITE_TITLE,
      description: DEFAULT_SITE_DESCRIPTION,
      robots,
      /** Single canonical for duplicate home + /academy (same content). */
      canonicalPath: "/",
      jsonLd: {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "EducationalOrganization",
            "@id": `${getSiteOrigin()}/#organization`,
            "name": "ExpoGraph Academy",
            "url": getSiteOrigin(),
            "logo": `${getSiteOrigin()}/pwa-icon-512.png`,
            "description": DEFAULT_SITE_DESCRIPTION,
            "sameAs": [
              SITE_CONTACT.socials.instagram,
              SITE_CONTACT.socials.youtube,
              SITE_CONTACT.socials.linkedin
            ]
          },
          {
            "@type": "WebSite",
            "@id": `${getSiteOrigin()}/#website`,
            "name": "ExpoGraph Academy",
            "url": getSiteOrigin(),
            "potentialAction": {
              "@type": "SearchAction",
              "target": {
                "@type": "EntryPoint",
                "urlTemplate": `${getSiteOrigin()}/courses?q={search_term_string}`
              },
              "query-input": "required name=search_term_string"
            }
          },
          {
            "@type": "FAQPage",
            "@id": `${getSiteOrigin()}/#faq`,
            "mainEntity": [
              {
                "@type": "Question",
                "name": "What is ExpoGraph Academy?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "ExpoGraph Academy teaches Vibe Coding, Prompt Engineering & AI Automations through structured lessons, smart prompts, and hands-on projects. You don't just watch-you build."
                }
              },
              {
                "@type": "Question",
                "name": "What courses do you offer?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "We offer three focused courses: Vibe Coding (build apps using AI), Prompt Engineering (master the art of prompting), and AI Automations (automate workflows with intelligent automations). Together, they cover everything from building to deploying real-world AI-powered projects."
                }
              },
              {
                "@type": "Question",
                "name": "What are Smart Prompts?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Smart Prompts are structured prompt boxes you can copy and use directly. They help you learn vibe coding-how to think, prompt, and build like a professional developer."
                }
              },
              {
                "@type": "Question",
                "name": "What is the Real Client Lab?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "The Real Client Lab connects you with actual clients and real-world projects. You build, deliver, and grow your portfolio with work that matters-not just tutorials."
                }
              },
              {
                "@type": "Question",
                "name": "Do I get a Resume Builder?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes! Our built-in Resume Builder helps you create a professional resume using your completed courses, projects, and Real Client Lab work-ready for employers."
                }
              },
              {
                "@type": "Question",
                "name": "How much does it cost?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Each course (Vibe Coding, Prompt Engineering, AI Automations) starts at just ₹99 and our all-access course pack is only ₹199-that's all 3 courses + Real Client Lab + Resume Builder for less than a coffee."
                }
              },
              {
                "@type": "Question",
                "name": "Do I get certificates?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Absolutely. Every course you complete earns you a verifiable certificate with a unique ID-issued by ExpoGraph, a company recognised by MCA and MSME, Government of India."
                }
              },
              {
                "@type": "Question",
                "name": "Is there community support?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes! Join our community on Instagram, YouTube, and LinkedIn. Connect with fellow users, get tips, and stay updated on new courses and opportunities."
                }
              },
              {
                "@type": "Question",
                "name": "How is ExpoGraph different from other platforms?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Unlike generic platforms, ExpoGraph focuses on 3 cutting-edge courses-Vibe Coding, Prompt Engineering & AI Automations-with real client projects, smart AI prompts, and a resume builder. Everything you need to actually get hired, not just learn theory."
                }
              }
            ]
          }
        ]
      },
    };
  }

  if (path === "/solutions") {
    return {
      title: "ExpoGraph Solutions - Software, AI Automation & Growth Systems",
      description:
        "Lead-focused websites, WhatsApp sales and support flows, AI automation, CRM setup, internal dashboards, and MVP sprints - built for businesses that need clarity and speed.",
      robots,
      canonicalPath: path,
      jsonLd: null,
    };
  }

  const SOLUTIONS_META = {
    "/solutions/book-a-meet": {
      title: "Book a Meet | ExpoGraph Solutions",
      description:
        "Request a short call. We confirm fit, outline scope options, and suggest a sensible starting point for your automation or software build.",
    },
    "/solutions/pricing": {
      title: "Pricing | ExpoGraph Solutions",
      description:
        "Starter pricing bands for automation, websites, WhatsApp systems, AI support, CRM workflows, internal tools, and MVP sprints - final quotes follow scope.",
    },
    "/solutions/process": {
      title: "Process | ExpoGraph Solutions",
      description:
        "Discovery, solution mapping, scope and plan, build and test, then support and improve - the same five-step delivery model on every engagement.",
    },
    "/solutions/faq": {
      title: "FAQ | ExpoGraph Solutions",
      description:
        "Practical answers on how we work together, pricing and timelines, and what happens after launch.",
    },
    "/solutions/thank-you": {
      title: "Thank You | ExpoGraph Solutions",
      description: "Your meeting request was received. We will follow up with next steps shortly.",
    },
    "/solutions/ai-automation-smbs": {
      title: "AI Automation for SMBs | ExpoGraph Solutions",
      description: "Automate repetitive business workflows with practical AI-ready systems for routing, reminders, approvals, and reporting.",
    },
    "/solutions/lead-generation-websites": {
      title: "Lead-Generation Websites | ExpoGraph Solutions",
      description: "Conversion-focused websites for businesses that need more qualified inquiries, better structure, and stronger trust signals.",
    },
    "/solutions/whatsapp-sales-support-systems": {
      title: "WhatsApp Sales + Support Systems | ExpoGraph Solutions",
      description: "Turn WhatsApp into a structured sales and support channel with automation, qualification, handoff, and follow-up workflows.",
    },
    "/solutions/ai-customer-support-assistants": {
      title: "AI Customer Support Assistants | ExpoGraph Solutions",
      description: "Deploy AI support assistants that reduce repetitive workload, improve response speed, and enable clean human escalation.",
    },
    "/solutions/crm-sales-workflow-setup": {
      title: "CRM + Sales Workflow Setup | ExpoGraph Solutions",
      description: "Build organized sales movement with CRM setup, lead tracking, follow-up structure, stage automation, and reporting visibility.",
    },
    "/solutions/internal-dashboards-admin-portals": {
      title: "Internal Dashboards + Admin Portals | ExpoGraph Solutions",
      description: "Build internal systems that give teams better visibility, approval control, and reliable execution tracking.",
    },
    "/solutions/mvp-build-sprints": {
      title: "MVP Build Sprints for Founders | ExpoGraph Solutions",
      description: "Go from startup idea to working MVP with focused sprint planning, build execution, and practical launch support.",
    },
  };
  if (path === "/solutions/faq") {
    return {
      title: "FAQ | ExpoGraph Solutions",
      description:
        "Practical answers on how we work together, pricing and timelines, and what happens after launch.",
      robots,
      canonicalPath: path,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Which service should we start with?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "The one tied to your biggest leak: lost leads, slow follow-up, support load, or missing internal visibility."
            }
          },
          {
            "@type": "Question",
            "name": "What if our requirements are not fully defined?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "That is normal. Discovery turns goals into a concrete scope you can approve."
            }
          },
          {
            "@type": "Question",
            "name": "Do you handle both design and build?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes - structure, UI, implementation, and launch support as one delivery."
            }
          },
          {
            "@type": "Question",
            "name": "Can you improve what we already have?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes. We often tighten websites, WhatsApp flows, CRMs, and internal tools instead of rebuilding."
            }
          },
          {
            "@type": "Question",
            "name": "How does pricing work?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Starter bands are on the pricing page. Final pricing matches integrations, depth, and timeline."
            }
          },
          {
            "@type": "Question",
            "name": "Do you offer ongoing support?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes. Most teams keep a light retainer for fixes, tuning, and small improvements."
            }
          },
          {
            "@type": "Question",
            "name": "How long does delivery take?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Simple flows can ship quickly. Deeper systems take longer; we give a range after scope."
            }
          },
          {
            "@type": "Question",
            "name": "Can we ship in phases?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes. Phased delivery is often the lowest-risk way to get value early."
            }
          },
          {
            "@type": "Question",
            "name": "What happens after go-live?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "We hand over clearly, then stay available for optimization, fixes, and measured iteration."
            }
          },
          {
            "@type": "Question",
            "name": "Will our team get a proper handover?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes - practical notes and walkthroughs so day-to-day operations do not depend on tribal knowledge."
            }
          },
          {
            "@type": "Question",
            "name": "Can we start small and expand?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes. We recommend proving value on a narrow slice before widening scope."
            }
          }
        ]
      }
    };
  }

  if (SOLUTIONS_META[path]) {
    return {
      title: SOLUTIONS_META[path].title,
      description: SOLUTIONS_META[path].description,
      robots,
      canonicalPath: path,
      jsonLd: null,
    };
  }

  if (path === "/academy/college-overview") {
    return {
      title: "College & Faculty Overview | ExpoGraph Academy",
      description:
        "A practical AI-era learning and campus transformation brief for principals, HODs, and TPOs—structured courses, labs, résumés, DTE, Talent Network, and a clear pilot path.",
      robots,
      canonicalPath: path,
      jsonLd: null,
    };
  }

  if (path === "/courses") {
    return {
      title: "Courses | ExpoGraph Academy",
      description:
        "Browse Vibe Coding, Prompt Engineering, AI Automations, and more-affordable courses with certificates and real-world practice.",
      robots,
      canonicalPath: path,
      jsonLd: null,
    };
  }

  if (path === "/contact") {
    return {
      title: "Contact & Support | ExpoGraph",
      description: "Get in touch with ExpoGraph for course support, partnerships, and general inquiries.",
      robots,
      canonicalPath: path,
      jsonLd: null,
    };
  }

  if (path === "/presentation") {
    return {
      title: "Product Presentation | ExpoGraph",
      description: "A detailed product overview and master presentation of ExpoGraph, outlining Vibe Coding, Prompt Engineering, AI Automations, and core features.",
      robots,
      canonicalPath: path,
      jsonLd: null,
    };
  }

  if (path === "/privacy-policy") {
    return {
      title: "Privacy Policy | ExpoGraph",
      description: "ExpoGraph privacy policy: how we collect, use, and protect your information.",
      robots,
      canonicalPath: path,
      jsonLd: null,
    };
  }

  if (path === "/terms-and-conditions") {
    return {
      title: "Terms & Conditions | ExpoGraph",
      description: "Terms and conditions for using ExpoGraph Academy and related services.",
      robots,
      canonicalPath: path,
      jsonLd: null,
    };
  }

  if (path === "/blog") {
    return {
      title: "Blog | ExpoGraph Academy",
      description: "Read practical articles on Vibe Coding, Prompt Engineering, AI Automations, and building your career in the AI era.",
      robots,
      canonicalPath: "/blog",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Blog",
        "name": "ExpoGraph Academy Blog",
        "description": "Read practical articles on Vibe Coding, Prompt Engineering, AI Automations, and building your career in the AI era.",
        "url": absoluteUrl("/blog"),
        "publisher": {
          "@type": "Organization",
          "name": "ExpoGraph Academy"
        }
      }
    };
  }

  if (path === "/sitemap") {
    return {
      title: "Sitemap | ExpoGraph Academy",
      description: "Sitemap of ExpoGraph Academy - browse all courses, features, blogs, and public sections.",
      robots,
      canonicalPath: "/sitemap",
      jsonLd: null
    };
  }

  const blogMatch = path.match(/^\/blog\/([^/]+)\/?$/);
  if (blogMatch) {
    const slug = blogMatch[1];
    const post = BLOG_POSTS[slug];
    if (post) {
      const canonicalUrl = `/blog/${slug}`;
      const articleSchema = {
        "@type": "BlogPosting",
        "@id": absoluteUrl(canonicalUrl) + "#article",
        "headline": post.title,
        "description": post.excerpt,
        "image": post.coverImage,
        "datePublished": post.date,
        "author": {
          "@type": "Person",
          "name": post.author
        },
        "publisher": {
          "@type": "Organization",
          "name": "ExpoGraph Academy",
          "url": getSiteOrigin()
        }
      };
      const breadcrumbSchema = {
        "@type": "BreadcrumbList",
        "@id": absoluteUrl(canonicalUrl) + "#breadcrumb",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": absoluteUrl("/")
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Blog",
            "item": absoluteUrl("/blog")
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": post.title,
            "item": absoluteUrl(canonicalUrl)
          }
        ]
      };
      return {
        title: `${post.title} | ExpoGraph Academy`,
        description: post.excerpt,
        robots,
        canonicalPath: canonicalUrl,
        jsonLd: {
          "@context": "https://schema.org",
          "@graph": [articleSchema, breadcrumbSchema]
        }
      };
    }
  }

  const exploreMatch = path.match(/^\/courses\/explore\/([^/]+)\/?$/);
  if (exploreMatch) {
    const slug = exploreMatch[1];
    const data = COURSE_EXPLORE_DATA[slug];
    if (data) {
      const canonicalUrl = `/courses/explore/${slug}`;
      const courseSchema = {
        "@type": "Course",
        "@id": absoluteUrl(canonicalUrl) + "#course",
        "name": data.title,
        "description": data.description.slice(0, 160),
        "provider": {
          "@type": "Organization",
          "name": "ExpoGraph Academy",
          "url": getSiteOrigin()
        }
      };
      const breadcrumbSchema = {
        "@type": "BreadcrumbList",
        "@id": absoluteUrl(canonicalUrl) + "#breadcrumb",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": absoluteUrl("/")
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Courses",
            "item": absoluteUrl("/courses")
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": data.title,
            "item": absoluteUrl(canonicalUrl)
          }
        ]
      };
      return {
        title: `${data.title} - Explore | ExpoGraph Academy`,
        description: data.description.slice(0, 160),
        robots,
        canonicalPath: canonicalUrl,
        jsonLd: {
          "@context": "https://schema.org",
          "@graph": [courseSchema, breadcrumbSchema]
        },
      };
    }
  }

  const featureMatch = path.match(/^\/features\/([^/]+)\/?$/);
  if (featureMatch) {
    const slug = featureMatch[1];
    const meta = FEATURE_SEO[slug];
    const pageTitle = meta ? meta.title : `${slugToTitle(slug)} | ExpoGraph`;
    const pageDesc = meta ? meta.description.slice(0, 160) : DEFAULT_SITE_DESCRIPTION;
    const canonicalUrl = `/features/${slug}`;
    
    const breadcrumbSchema = {
      "@type": "BreadcrumbList",
      "@id": absoluteUrl(canonicalUrl) + "#breadcrumb",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": absoluteUrl("/")
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Features",
          "item": absoluteUrl("/#features")
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": meta ? meta.title.split(" | ")[0] : slugToTitle(slug),
          "item": absoluteUrl(canonicalUrl)
        }
      ]
    };

    return {
      title: pageTitle,
      description: pageDesc,
      robots,
      canonicalPath: canonicalUrl,
      jsonLd: {
        "@context": "https://schema.org",
        "@graph": [breadcrumbSchema]
      },
    };
  }

  const courseMatch = path.match(/^\/courses\/([^/]+)\/?$/);
  if (courseMatch) {
    const slug = courseMatch[1];
    if (slug === "explore") {
      return {
        title: `Courses | ExpoGraph Academy`,
        description: DEFAULT_SITE_DESCRIPTION,
        robots,
        canonicalPath: "/courses",
        jsonLd: null,
      };
    }
    const explore = COURSE_EXPLORE_DATA[slug];
    const canonicalUrl = `/courses/${slug}`;
    const pageTitle = `${explore ? explore.title : slugToTitle(slug)} | ExpoGraph Academy`;
    const pageDesc = explore ? explore.description.slice(0, 160) : `${slugToTitle(slug)} course on ExpoGraph Academy.`;
    
    const breadcrumbSchema = {
      "@type": "BreadcrumbList",
      "@id": absoluteUrl(canonicalUrl) + "#breadcrumb",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": absoluteUrl("/")
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Courses",
          "item": absoluteUrl("/courses")
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": explore ? explore.title : slugToTitle(slug),
          "item": absoluteUrl(canonicalUrl)
        }
      ]
    };

    return {
      title: pageTitle,
      description: pageDesc,
      robots,
      canonicalPath: canonicalUrl,
      jsonLd: {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Course",
            "name": explore ? explore.title : slugToTitle(slug),
            "description": pageDesc,
            "provider": {
              "@type": "Organization",
              "name": "ExpoGraph Academy",
              "url": getSiteOrigin()
            }
          },
          breadcrumbSchema
        ]
      },
    };
  }

  return {
    title: DEFAULT_SITE_TITLE,
    description: DEFAULT_SITE_DESCRIPTION,
    robots,
    canonicalPath: path,
    jsonLd: null,
  };
}
