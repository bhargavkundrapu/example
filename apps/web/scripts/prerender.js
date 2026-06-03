import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const PUBLIC_ROUTES = [
  '/',
  '/academy',
  '/academy/college-overview',
  '/solutions',
  '/solutions/book-a-meet',
  '/solutions/pricing',
  '/solutions/process',
  '/solutions/faq',
  '/solutions/thank-you',
  '/solutions/ai-automation-smbs',
  '/solutions/lead-generation-websites',
  '/solutions/whatsapp-sales-support-systems',
  '/solutions/ai-customer-support-assistants',
  '/solutions/crm-sales-workflow-setup',
  '/solutions/internal-dashboards-admin-portals',
  '/solutions/mvp-build-sprints',
  '/courses',
  '/courses/explore/vibe-coding',
  '/courses/explore/prompt-engineering',
  '/courses/explore/prompt-to-profit',
  '/courses/explore/ai-automations',
  '/courses/explore/all-pack',
  '/courses/vibe-coding',
  '/courses/prompt-engineering',
  '/courses/prompt-to-profit',
  '/courses/ai-automations',
  '/courses/all-pack',
  '/features/smart-prompts',
  '/features/resume-builder',
  '/features/real-client-lab',
  '/features/learning-portal',
  '/features/structured-lessons',
  '/features/jobs-search-hub',
  '/features/startup-launchpad',
  '/contact',
  '/presentation',
  '/privacy-policy',
  '/terms-and-conditions',
  '/blog',
  '/blog/what-is-vibe-coding',
  '/blog/prompt-engineering-syllabus',
  '/blog/how-real-client-lab-works',
  '/blog/vibe-coding-vs-traditional-coding',
  '/sitemap'
];

function generateSemanticContent(route, courseData, blogData) {
  let html = '';
  
  if (route === '/' || route === '/academy') {
    html += `
      <header>
        <h1>ExpoGraph Academy India</h1>
        <p>Vibe Coding, Prompt Engineering & AI Automations</p>
      </header>
      <main>
        <section>
          <h2>Our Core Courses</h2>
          <ul>
            <li><strong>Vibe Coding</strong> - Build real apps by telling AI what you want.</li>
            <li><strong>Prompt Engineering</strong> - Master structured prompts with GCCF framework.</li>
            <li><strong>Prompt to Profit</strong> - Use ChatGPT for copywriting, email marketing, and funnels.</li>
            <li><strong>AI Automations</strong> - Connect Make.com, n8n, and APIs to automate workflows.</li>
          </ul>
          <p><a href="/courses">Browse All Courses</a></p>
        </section>
        <section>
          <h2>Platform Features</h2>
          <ul>
            <li>Smart Prompt Library - Copy-ready prompts and error fixes.</li>
            <li>Resume Builder - ATS-friendly templates and instant PDF export.</li>
            <li>Real Client Lab - Work on real projects with mentor feedback.</li>
            <li>Jobs Search Hub - India-first job search portals aggregator.</li>
            <li>Startup LaunchPad - Guided stages from idea to MVP launch.</li>
          </ul>
          <p><a href="/sitemap">View Sitemap</a></p>
        </section>
      </main>
    `;
  } else if (route === '/academy/college-overview') {
    html += `
      <header>
        <h1>College & Faculty Overview</h1>
        <p>AI-Era Learning & Campus Transformation</p>
      </header>
      <main>
        <section>
          <h2>Transformation Brief for Academics</h2>
          <p>Structured courses, labs, portfolio résumés, and DTE talent network matching.</p>
          <ul>
            <li>MCA & MSME Government of India Recognised Certificates</li>
            <li>Real-world hands-on project submissions</li>
            <li>1-on-1 Mentor Feedback cycles</li>
          </ul>
        </section>
      </main>
    `;
  } else if (route === '/solutions') {
    html += `
      <header>
        <h1>ExpoGraph Solutions</h1>
        <p>Software, AI Automation & Growth Systems for Businesses</p>
      </header>
      <main>
        <section>
          <h2>Our Business Services</h2>
          <ul>
            <li>AI Automation for SMBs</li>
            <li>Lead-Generation Websites</li>
            <li>WhatsApp Sales & Support Systems</li>
            <li>AI Customer Support Assistants</li>
            <li>CRM & Sales Workflow Setup</li>
            <li>Internal Dashboards & Admin Portals</li>
            <li>MVP Build Sprints</li>
          </ul>
          <p><a href="/solutions/pricing">View Pricing</a> | <a href="/solutions/process">Our Process</a> | <a href="/solutions/faq">Solutions FAQ</a></p>
        </section>
      </main>
    `;
  } else if (route.startsWith('/solutions/')) {
    const sub = route.replace('/solutions/', '');
    const title = sub.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    html += `
      <header>
        <h1>${title} - ExpoGraph Solutions</h1>
      </header>
      <main>
        <p>Custom software and automation systems built for business efficiency.</p>
        <p><a href="/solutions">Back to Solutions</a> | <a href="/solutions/book-a-meet">Book a Call</a></p>
      </main>
    `;
  } else if (route === '/courses') {
    html += `
      <header>
        <h1>ExpoGraph Academy Courses</h1>
        <p>Master the AI Era with Practical Skills</p>
      </header>
      <main>
        <ul>
    `;
    for (const [slug, data] of Object.entries(courseData)) {
      html += `
        <li>
          <h2><a href="/courses/${slug}">${data.title}</a></h2>
          <p>${data.tagline}</p>
          <p>${data.description}</p>
          <p><a href="/courses/explore/${slug}">Explore Course Details</a></p>
        </li>
      `;
    }
    html += `
        </ul>
      </main>
    `;
  } else if (route.startsWith('/courses/explore/')) {
    const slug = route.replace('/courses/explore/', '');
    const data = courseData[slug];
    if (data) {
      html += `
        <header>
          <h1>Explore ${data.title} - ExpoGraph Academy</h1>
          <p>${data.tagline}</p>
        </header>
        <main>
          <p>${data.description}</p>
          <p><strong>Duration:</strong> ${data.durationHours} Hours</p>
          <section>
            <h2>What You Can Do</h2>
            <ul>
              ${data.whatYouCanDo.map(item => `<li>${item}</li>`).join('\n')}
            </ul>
          </section>
          <section>
            <h2>Curriculum Modules</h2>
            <ol>
              ${data.curriculum.map(mod => `<li>${mod}</li>`).join('\n')}
            </ol>
          </section>
          <p><a href="/courses/${slug}">View Course Landing Page</a></p>
        </main>
      `;
    }
  } else if (route.startsWith('/courses/')) {
    const slug = route.replace('/courses/', '');
    const data = courseData[slug];
    if (data) {
      html += `
        <header>
          <h1>${data.title} Course</h1>
          <p>${data.tagline}</p>
        </header>
        <main>
          <p>${data.description}</p>
          <section>
            <h2>Course Highlights</h2>
            <ul>
              ${data.bullets.map(b => `<li>${b}</li>`).join('\n')}
            </ul>
          </section>
          <p><a href="/courses/explore/${slug}">Explore Curriculum & Use Cases</a></p>
        </main>
      `;
    }
  } else if (route.startsWith('/features/')) {
    const slug = route.replace('/features/', '');
    const title = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    html += `
      <header>
        <h1>${title} Feature - ExpoGraph Academy</h1>
      </header>
      <main>
        <p>Explore this key platform capability inside the ExpoGraph LMS.</p>
        <p><a href="/academy">Back to Academy</a></p>
      </main>
    `;
  } else if (route === '/blog') {
    html += `
      <header>
        <h1>ExpoGraph Academy Blog</h1>
        <p>Practical insights on Vibe Coding, Prompt Engineering, and AI Automations</p>
      </header>
      <main>
        <ul>
    `;
    for (const [slug, post] of Object.entries(blogData)) {
      html += `
        <li>
          <h2><a href="/blog/${slug}">${post.title}</a></h2>
          <p>By ${post.author} &middot; ${post.date} &middot; ${post.readingTime}</p>
          <p>${post.excerpt}</p>
        </li>
      `;
    }
    html += `
        </ul>
      </main>
    `;
  } else if (route.startsWith('/blog/')) {
    const slug = route.replace('/blog/', '');
    const post = blogData[slug];
    if (post) {
      html += `
        <article>
          <header>
            <h1>${post.title}</h1>
            <p>Published on ${post.date} by ${post.author} &middot; ${post.readingTime}</p>
          </header>
          <section class="post-excerpt">
            <p><em>${post.excerpt}</em></p>
          </section>
          <section class="post-content">
            ${post.content.split('\n\n').map(p => {
              if (p.trim().startsWith('## ')) {
                return `<h2>${p.trim().replace('## ', '')}</h2>`;
              }
              if (p.trim().startsWith('- ')) {
                return `<ul>${p.split('\n').map(li => `<li>${li.trim().replace('- ', '')}</li>`).join('')}</ul>`;
              }
              return `<p>${p.trim()}</p>`;
            }).join('\n')}
          </section>
          <footer>
            <p><a href="/blog">Back to Blog</a></p>
          </footer>
        </article>
      `;
    }
  } else if (route === '/sitemap') {
    html += `
      <header>
        <h1>Sitemap - ExpoGraph Academy</h1>
      </header>
      <main>
        <h2>Public Navigation Nodes</h2>
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/academy">Academy Home</a></li>
          <li><a href="/academy/college-overview">College Overview</a></li>
          <li><a href="/courses">All Courses</a></li>
          <li><a href="/solutions">Solutions Business Services</a></li>
          <li><a href="/blog">Academy Blog</a></li>
          <li><a href="/contact">Contact Support</a></li>
          <li><a href="/privacy-policy">Privacy Policy</a></li>
          <li><a href="/terms-and-conditions">Terms & Conditions</a></li>
        </ul>
      </main>
    `;
  } else {
    html += `
      <header>
        <h1>ExpoGraph Academy</h1>
      </header>
      <main>
        <p>Explore high-value learning, tools, and business solutions.</p>
        <p><a href="/">Go to Homepage</a></p>
      </main>
    `;
  }

  return html;
}

async function run() {
  console.log('Starting prerendering process...');

  const distDir = path.resolve(projectRoot, 'dist');
  const templatePath = path.resolve(distDir, 'index.html');
  if (!fs.existsSync(templatePath)) {
    console.error(`Error: Built templates not found at "${templatePath}". Make sure to build first.`);
    process.exit(1);
  }

  const indexHtmlTemplate = fs.readFileSync(templatePath, 'utf8');

  // Load modules using Vite SSR compilation
  const viteServer = await createServer({
    root: projectRoot,
    server: { middlewareMode: true },
    appType: 'custom'
  });

  let resolveSeoModule, courseDataModule, blogDataModule;
  try {
    resolveSeoModule = await viteServer.ssrLoadModule('./src/seo/resolveSeo.js');
    courseDataModule = await viteServer.ssrLoadModule('./src/data/courseExploreData.js');
    blogDataModule = await viteServer.ssrLoadModule('./src/data/blogData.js');
  } catch (err) {
    console.error('Failed to load modules via Vite SSR:', err);
    await viteServer.close();
    process.exit(1);
  }

  const { resolveSeo } = resolveSeoModule;
  const { COURSE_EXPLORE_DATA } = courseDataModule;
  const { BLOG_POSTS } = blogDataModule;

  for (const route of PUBLIC_ROUTES) {
    console.log(`Prerendering: ${route}`);
    const seo = resolveSeo(route);
    
    // Process HTML replacement
    let html = indexHtmlTemplate;

    // 1. Replace Title
    if (seo.title) {
      html = html.replace(/<title>[^<]*<\/title>/, `<title>${seo.title}</title>`);
      html = html.replace(/<meta property="og:title" content="[^"]*"\s*\/?>/g, `<meta property="og:title" content="${seo.title}" />`);
      html = html.replace(/<meta name="twitter:title" content="[^"]*"\s*\/?>/g, `<meta name="twitter:title" content="${seo.title}" />`);
    }

    // 2. Replace Description
    if (seo.description) {
      html = html.replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${seo.description}" />`);
      html = html.replace(/<meta property="og:description" content="[^"]*"\s*\/?>/g, `<meta property="og:description" content="${seo.description}" />`);
      html = html.replace(/<meta name="twitter:description" content="[^"]*"\s*\/?>/g, `<meta name="twitter:description" content="${seo.description}" />`);
    }

    // 3. Replace Canonical
    const canonicalUrl = `https://expograph.in${seo.canonicalPath}`;
    html = html.replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${canonicalUrl}" />`);
    html = html.replace(/<meta property="og:url" content="[^"]*"\s*\/?>/g, `<meta property="og:url" content="${canonicalUrl}" />`);

    // 4. Inject Robots meta tag
    if (seo.robots) {
      if (html.includes('<meta name="robots"')) {
        html = html.replace(/<meta name="robots" content="[^"]*"\s*\/?>/, `<meta name="robots" content="${seo.robots}" />`);
      } else {
        html = html.replace('</head>', `  <meta name="robots" content="${seo.robots}" />\n  </head>`);
      }
    }

    // 5. Inject JSON-LD Schema
    if (seo.jsonLd) {
      const jsonLdStr = JSON.stringify(seo.jsonLd, null, 2);
      const schemaScript = `  <script type="application/ld+json">\n${jsonLdStr}\n  </script>`;
      html = html.replace('</head>', `${schemaScript}\n  </head>`);
    }

    // 6. Inject Semantic Content into <div id="root">
    const semanticContent = generateSemanticContent(route, COURSE_EXPLORE_DATA, BLOG_POSTS);
    
    // We replace the placeholder inside <div id="root">...</div>
    const rootPlaceholderRegex = /<div id="root">([\s\S]*?)<\/div>/;
    html = html.replace(rootPlaceholderRegex, `<div id="root">\n      ${semanticContent.trim()}\n    </div>`);

    // Write file to target destination
    if (route === '/') {
      fs.writeFileSync(templatePath, html, 'utf8');
    } else {
      const targetDir = path.join(distDir, route);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      fs.writeFileSync(path.join(targetDir, 'index.html'), html, 'utf8');
    }
  }

  await viteServer.close();
  console.log('Prerendering completed successfully!');
}

run().catch(err => {
  console.error('Prerender script error:', err);
  process.exit(1);
});
