#!/usr/bin/env node
// The Gray Dome – בוט מאמר SEO יומי
// מריץ: node bot/generate.mjs            (דורש ANTHROPIC_API_KEY)
//        node bot/generate.mjs --dry      (בדיקה בלי API – מאמר דמה)
//        node bot/generate.mjs --rebuild  (בונה מחדש אינדקס בלוג + sitemap בלבד)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SITE = (process.env.SITE_URL || "https://thegraydome.com").replace(/\/$/, "");
const WA = process.env.WA_NUMBER || "972502843811";
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
const AUTHOR = process.env.AUTHOR_NAME || "בר ליאון";
const MIN_WORDS = Number(process.env.MIN_WORDS || 900);

const KW_FILE = path.join(__dirname, "keywords.json");
const POSTS_FILE = path.join(__dirname, "posts.json");
const BLOG_DIR = path.join(ROOT, "blog");

const args = new Set(process.argv.slice(2));
const DRY = args.has("--dry");
const REBUILD_ONLY = args.has("--rebuild");
const IMPORT = args.has("--import");

// ביטויים אסורים – טענות שעלולות להטעות צרכנים או להפר מדיניות מטא/גוגל
const BANNED = [
  /שות(ף|פים)\s+(רשמי|של\s*מטא)/, /partner/i, /מוסמכ(ים)?\s+מטעם\s+מטא/,
  /הצלחה\s+מובטחת/, /100%\s*הצלחה/, /מבטיחים\s+(להחזיר|שחזור)/,
  /עקיפ(ת|ה)\s+(אימות|2FA)/, /קשרים?\s+(בתוך|פנימיים)\s+(ב)?מטא/, /עובד(י)?\s+מטא/
];

const readJSON = (f, d) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : d);
const writeJSON = (f, v) => fs.writeFileSync(f, JSON.stringify(v, null, 2) + "\n");
const esc = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem" });
const heDate = (iso) => new Date(iso + "T12:00:00Z").toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });

function sanitize(html) {
  return String(html)
    .replace(/<\s*(script|style|iframe|object|embed|form)[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*')/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/<(?!\/?(h2|h3|p|ul|ol|li|strong|em|b|a|br|table|thead|tbody|tr|th|td|blockquote)\b)[^>]*>/gi, "");
}
const wordCount = (html) => html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;

function pickKeyword(kws, posts) {
  const used = new Set(posts.map((p) => p.kw));
  const covered = ["פרצו לי לאינסטגרם מה עושים","פרצו לי לפייסבוק מה עושים","נחסם לי הוואטסאפ מה עושים","ביזנס מנג'ר נחסם מה עושים","נחסם לי האינסטגרם מה עושים"];
  covered.forEach((c) => used.add(c));
  const left = kws.filter((k) => !used.has(k.kw)).sort((a, b) => (a.priority || 9) - (b.priority || 9));
  return left[0] || null;
}

function buildPrompt(k, posts) {
  const related = posts.slice(-12).map((p) => `- ${p.title} → /blog/${p.slug}/`).join("\n") || "(אין עדיין)";
  return `אתה כותב תוכן בכיר של The Gray Dome – שירות ישראלי עצמאי לליווי שחזור חשבונות פייסבוק, אינסטגרם ו-וואטסאפ. השירות אינו קשור למטא ואינו שותף שלה.

כתוב מאמר בעברית טבעית ורהוטה שמטרגט את שאילתת החיפוש: "${k.kw}" (פלטפורמה: ${k.platform}, כוונה: ${k.intent}).

כללי איכות (חובה):
1. המאמר נועד לעזור באמת: תן קודם את הצעדים הרשמיים שהקורא יכול לעשות בעצמו (מרכז העזרה, איפוס סיסמה, בקשת בדיקה, אימות וידאו וכו') בסדר ברור וממוספר. אל תמציא כפתורים, כתובות או נהלים שאינך בטוח בהם – אם יש אי-ודאות, כתוב "בממשק הנוכחי ייתכן שהשם שונה".
2. אחרי הצעדים העצמאיים – פסקה כנה "מתי כדאי לפנות לליווי מקצועי" (מקרים מורכבים: חשבון עסקי, פורץ שהחליף מייל+טלפון+2FA, ערעורים שנדחו). בלי הפחדה ובלי לחץ זמן מזויף.
3. אסור לכתוב: שאנחנו שותפים/נציגים/מורשים של מטא, שיש לנו קשרים בתוך מטא, הבטחת הצלחה, אחוזי הצלחה, מספרי לקוחות, "עקיפת אימות דו-שלבי", או המלצה לשתף סיסמה/קוד עם אף אחד.
4. הוסף אזהרה קצרה מפני "משחררי חשבונות" שמבקשים סיסמאות או כופר.
5. אורך: 1,100–1,500 מילים. מבנה: פתיח של 2–3 משפטים שעונה ישר לשאלה, ואז 5–7 כותרות H2 (עם H3 לפי הצורך), רשימות, וטבלה אחת לפחות אם מתאים.
6. שלב באופן טבעי את מילת המפתח ווריאציות שלה (חסום/נחסם/הושבת/נפרץ/פרצו לי) בלי דחיסה.
7. קישורים פנימיים: מותר לקשר רק ל-"/" (דף הבית), ל-"/facebook-recovery/" (כשהנושא פייסבוק), ל-"/whatsapp-recovery/" (כשהנושא וואטסאפ) ולמאמרים מהרשימה הזו כשהם רלוונטיים:
${related}

החזר JSON תקין בלבד, בלי טקסט נוסף ובלי \`\`\`, במבנה:
{
 "title": "כותרת H1 עד 65 תווים, כוללת את מילת המפתח",
 "seo_title": "כותרת לתגית title עד 60 תווים",
 "meta_description": "עד 150 תווים, מסקרן ומדויק",
 "slug": "english-transliterated-slug-with-dashes",
 "excerpt": "תקציר של משפט אחד לדף הבלוג",
 "body_html": "גוף המאמר ב-HTML (h2,h3,p,ul,ol,li,strong,table,a) בלי h1",
 "faq": [{"q":"שאלה","a":"תשובה של 1–3 משפטים"}],
 "wa_message": "הודעת וואטסאפ קצרה ומוכנה שהקורא ישלח לנו, בגוף ראשון, לפי הנושא"
}
ה-faq: 4–5 שאלות אמיתיות שאנשים שואלים על הנושא.`;
}

async function callClaude(prompt) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("חסר ANTHROPIC_API_KEY");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: MODEL, max_tokens: 8000, messages: [{ role: "user", content: prompt }] })
  });
  if (!res.ok) throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data.content.filter((c) => c.type === "text").map((c) => c.text).join("");
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("לא התקבל JSON מהמודל");
  return JSON.parse(m[0]);
}

function dryArticle(k) {
  const p = "<p>" + "זהו טקסט בדיקה שנועד לוודא שהתבנית, הסכמות והקישורים נבנים כמו שצריך. ".repeat(12) + "</p>";
  return {
    title: k.kw, seo_title: k.kw.slice(0, 58), meta_description: "מאמר בדיקה – " + k.kw,
    slug: "test-" + Date.now().toString(36), excerpt: "מאמר בדיקה של הבוט.",
    body_html: Array.from({ length: 8 }, (_, i) => `<h2>כותרת ${i + 1}</h2>${p}`).join(""),
    faq: [{ q: "שאלת בדיקה?", a: "תשובת בדיקה." }], wa_message: "היי, אני צריך עזרה עם החשבון שלי"
  };
}

function validate(a, minWords = MIN_WORDS) {
  const errs = [];
  for (const f of ["title", "meta_description", "slug", "body_html"]) if (!a[f]) errs.push("חסר " + f);
  a.slug = String(a.slug || "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  a.body_html = sanitize(a.body_html || "");
  const all = [a.title, a.meta_description, a.body_html, JSON.stringify(a.faq || [])].join(" ");
  for (const r of BANNED) if (r.test(all)) errs.push("ביטוי אסור: " + r);
  const wc = wordCount(a.body_html);
  if (wc < minWords) errs.push(`קצר מדי (${wc} מילים)`);
  return errs;
}

const CSS = `:root{--bg:#f7f8fa;--card:#fff;--text:#1c1e21;--muted:#5f6368;--accent:#2b59c3;--wa:#1faa59;--border:#e3e6ea}
*{box-sizing:border-box}body{margin:0;font-family:Heebo,system-ui,sans-serif;background:var(--bg);color:var(--text);line-height:1.8;font-size:18px}
a{color:var(--accent)}header.top{background:#fff;border-bottom:1px solid var(--border)}header.top .in{max-width:860px;margin:auto;padding:14px 20px;display:flex;justify-content:space-between;align-items:center}
header.top .logo{font-weight:800;text-decoration:none;color:var(--text)}main{max-width:860px;margin:auto;padding:24px 20px 60px}
nav.crumbs{font-size:14px;color:var(--muted)}nav.crumbs a{color:var(--muted)}h1{font-size:clamp(28px,4vw,40px);line-height:1.3;margin:.4em 0}
.meta{color:var(--muted);font-size:15px;margin-bottom:24px}article h2{font-size:26px;margin-top:1.8em}article h3{font-size:21px}
article table{width:100%;border-collapse:collapse;margin:1em 0;font-size:16px}article th,article td{border:1px solid var(--border);padding:8px 10px;text-align:right}article th{background:#f0f3f8}
.cta{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:24px;margin:36px 0;text-align:center}.cta p{margin:.2em 0 1em}
.btn-wa{display:inline-block;background:var(--wa);color:#fff;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:999px}
.faq details{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px 16px;margin:10px 0}.faq summary{font-weight:700;cursor:pointer}
.note{font-size:14px;color:var(--muted);border-top:1px solid var(--border);padding-top:16px;margin-top:40px}
.grid{display:grid;gap:16px}.card{background:var(--card);border:1px solid var(--border);border-radius:14px;padding:18px 20px;text-decoration:none;color:var(--text);display:block}.card h2{font-size:20px;margin:0 0 6px}.card p{margin:0;color:var(--muted);font-size:16px}
.wa-float{position:fixed;bottom:18px;left:18px;background:var(--wa);color:#fff;border-radius:999px;padding:12px 18px;font-weight:700;text-decoration:none;box-shadow:0 6px 20px rgba(0,0,0,.18)}`;

const head = ({ title, desc, url, schema }) => `<!DOCTYPE html>
<html lang="he" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${url}">
<meta property="og:type" content="article"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}"><meta property="og:locale" content="he_IL">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;700;800&display=swap" rel="stylesheet">
<style>${CSS}</style>
${schema.map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join("\n")}
</head><body>
<header class="top"><div class="in"><a class="logo" href="/">The Gray Dome</a><a href="/blog/">מדריכים</a></div></header>`;

const waLink = (msg) => `https://wa.me/${WA}?text=${encodeURIComponent(msg || "היי, אני צריך עזרה עם החשבון שלי")}`;

function renderArticle(a, k, date, related) {
  const url = `${SITE}/blog/${a.slug}/`;
  const faq = (a.faq || []).filter((f) => f.q && f.a);
  const schema = [
    { "@context": "https://schema.org", "@type": "Article", headline: a.title, description: a.meta_description, datePublished: date, dateModified: date,
      inLanguage: "he-IL", mainEntityOfPage: url, author: { "@type": "Person", name: AUTHOR }, publisher: { "@type": "Organization", name: "The Gray Dome", url: SITE } },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "דף הבית", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: "מדריכים", item: SITE + "/blog/" },
      { "@type": "ListItem", position: 3, name: a.title, item: url } ] }
  ];
  if (faq.length) schema.push({ "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) });

  const body = sanitize(a.body_html);
  // CTA באמצע המאמר: אחרי ה-H2 השלישי
  let n = 0;
  const mid = `<div class="cta"><p><strong>המקרה שלך מסובך יותר?</strong></p><p>שלחו לנו בוואטסאפ מה קרה, ונגיד לכם בכנות אם אפשר לטפל בזה – ומה תוכלו לעשות לבד.</p><a class="btn-wa" href="${waLink(a.wa_message)}" target="_blank" rel="noopener">שליחת המקרה בוואטסאפ</a></div>`;
  const bodyWithCta = body.replace(/<h2/gi, (m) => (++n === 3 ? mid + m : m));

  return `${head({ title: a.seo_title || a.title, desc: a.meta_description, url, schema })}
<main><nav class="crumbs"><a href="/">דף הבית</a> › <a href="/blog/">מדריכים</a></nav>
<article><h1>${esc(a.title)}</h1><div class="meta">מאת ${esc(AUTHOR)} · ${heDate(date)}</div>
${bodyWithCta}
${faq.length ? `<section class="faq"><h2>שאלות נפוצות</h2>${faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("")}</section>` : ""}
</article>
<div class="cta"><p><strong>רוצים שמישהו יעבור על המקרה שלכם?</strong></p><p>בדיקה ראשונית בוואטסאפ, בלי סיסמאות ובלי קודים.</p><a class="btn-wa" href="${waLink(a.wa_message)}" target="_blank" rel="noopener">דברו איתנו בוואטסאפ</a></div>
${related.length ? `<section><h2>מדריכים נוספים</h2><div class="grid">${related.map((p) => `<a class="card" href="/blog/${p.slug}/"><h2>${esc(p.title)}</h2><p>${esc(p.excerpt || "")}</p></a>`).join("")}</div></section>` : ""}
<p class="note">The Gray Dome הוא שירות עצמאי ואינו קשור ל-Meta, Facebook, Instagram או WhatsApp. המידע במאמר הוא כללי, ונכון למועד הפרסום; ממשקי הפלטפורמות משתנים מעת לעת.</p>
</main><a class="wa-float" href="${waLink(a.wa_message)}" target="_blank" rel="noopener">💬 וואטסאפ</a></body></html>\n`;
}

function renderIndex(posts) {
  const url = `${SITE}/blog/`;
  const list = [...posts].reverse();
  const schema = [{ "@context": "https://schema.org", "@type": "Blog", name: "מדריכי שחזור ואבטחת חשבונות | The Gray Dome", url, inLanguage: "he-IL" }];
  return `${head({ title: "מדריכים לשחזור ואבטחת חשבונות פייסבוק, אינסטגרם ווואטסאפ | The Gray Dome", desc: "מדריכים מעשיים: מה עושים כשפרצו לכם לחשבון, כשהוואטסאפ נחסם או כשחשבון המודעות הושבת – צעד אחר צעד.", url, schema })}
<main><h1>מדריכים לשחזור ואבטחת חשבונות</h1><p class="meta">מה עושים כשפרצו לכם, כשנחסמתם או כשהחשבון הושבת – בשפה פשוטה.</p>
<div class="grid">${list.map((p) => `<a class="card" href="/blog/${p.slug}/"><h2>${esc(p.title)}</h2><p>${esc(p.excerpt || "")} · ${heDate(p.date)}</p></a>`).join("")}</div>
</main><a class="wa-float" href="${waLink()}" target="_blank" rel="noopener">💬 וואטסאפ</a></body></html>\n`;
}

function renderSitemap(posts) {
  const urls = [
    { loc: SITE + "/", pr: "1.0" },
    { loc: SITE + "/facebook-recovery/", pr: "0.9" }, { loc: SITE + "/whatsapp-recovery/", pr: "0.9" },
    { loc: SITE + "/blog/", pr: "0.8", lm: posts.at(-1)?.date },
    ...posts.map((p) => ({ loc: `${SITE}/blog/${p.slug}/`, lm: p.date, pr: "0.7" }))
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${u.loc}</loc>${u.lm ? `<lastmod>${u.lm}</lastmod>` : ""}<priority>${u.pr}</priority></url>`).join("\n")}\n</urlset>\n`;
}

function renderLlms(posts) {
  return `# The Gray Dome

> שירות ישראלי עצמאי לליווי שחזור חשבונות פייסבוק, אינסטגרם ו-וואטסאפ שנפרצו, נחסמו או הושבתו, כולל חשבונות מודעות ו-Business Manager לעסקים. השירות אינו קשור ל-Meta. אנחנו לא מבקשים סיסמאות או קודים ולא מבטיחים הצלחה; הליווי נעשה דרך התהליכים הרשמיים של הפלטפורמות.

- אתר: ${SITE}/
- יצירת קשר: וואטסאפ / טלפון +${WA}
- אזור שירות: ישראל, בעברית

## שירותים
- [שחזור חשבון פייסבוק ועסקי](${SITE}/facebook-recovery/): פריצה, השבתה, עמוד עסקי, חשבון מודעות, Business Manager
- [פרצו לי לוואטסאפ / וואטסאפ ביזנס נחסם](${SITE}/whatsapp-recovery/): השתלטות, חסימה קבועה, וואטסאפ ביזנס

## מדריכים
${posts.map((p) => `- [${p.title}](${SITE}/blog/${p.slug}/): ${p.excerpt || ""}`).join("\n")}
`;
}

function writeShared(posts) {
  fs.mkdirSync(BLOG_DIR, { recursive: true });
  fs.writeFileSync(path.join(BLOG_DIR, "index.html"), renderIndex(posts));
  fs.writeFileSync(path.join(ROOT, "sitemap.xml"), renderSitemap(posts));
  const robots = path.join(ROOT, "robots.txt");
  fs.writeFileSync(robots, `User-agent: *\nAllow: /\nDisallow: /contract\n\n# AI search and assistants are welcome\nUser-agent: GPTBot\nAllow: /\nUser-agent: OAI-SearchBot\nAllow: /\nUser-agent: ChatGPT-User\nAllow: /\nUser-agent: ClaudeBot\nAllow: /\nUser-agent: Claude-SearchBot\nAllow: /\nUser-agent: PerplexityBot\nAllow: /\nUser-agent: Google-Extended\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
  fs.writeFileSync(path.join(ROOT, "llms.txt"), renderLlms(posts));
}

async function main() {
  const kws = readJSON(KW_FILE, []);
  const posts = readJSON(POSTS_FILE, []);
  if (REBUILD_ONLY) { writeShared(posts); console.log("נבנו מחדש: blog/index.html, sitemap.xml"); return; }

  if (IMPORT) {
    const { default: manual } = await import("./articles.mjs");
    const date = today();
    for (const a of manual) {
      const errs = validate(a, 550);
      if (errs.length) { console.error("נפסל:", a.slug, errs.join(" | ")); process.exit(1); }
      const existing = posts.find((p) => p.slug === a.slug);
      const d = existing ? existing.date : date;
      const related = manual.filter((x) => x.slug !== a.slug).slice(0, 3);
      fs.mkdirSync(path.join(BLOG_DIR, a.slug), { recursive: true });
      fs.writeFileSync(path.join(BLOG_DIR, a.slug, "index.html"), renderArticle(a, a, d, related));
      if (!existing) posts.push({ kw: a.kw, slug: a.slug, title: a.title, excerpt: a.excerpt || "", date: d, words: wordCount(a.body_html) });
      console.log(`יובא: /blog/${a.slug}/ (${wordCount(a.body_html)} מילים)`);
    }
    writeJSON(POSTS_FILE, posts);
    writeShared(posts);
    return;
  }

  if (!DRY && !process.env.ANTHROPIC_API_KEY) { console.log("אין ANTHROPIC_API_KEY – מדלג על המאמר היומי."); return; }

  const k = pickKeyword(kws, posts);
  if (!k) { console.log("נגמרו מילות המפתח ב-keywords.json – הוסיפו חדשות."); return; }
  console.log("מילת מפתח:", k.kw);

  let a, errs = [];
  for (let attempt = 1; attempt <= 2; attempt++) {
    a = DRY ? dryArticle(k) : await callClaude(buildPrompt(k, posts) + (errs.length ? `\n\nהניסיון הקודם נפסל: ${errs.join("; ")}. תקן.` : ""));
    errs = validate(a);
    if (!errs.length) break;
    console.warn(`ניסיון ${attempt} נפסל:`, errs.join(" | "));
  }
  if (errs.length) { console.error("לא פורסם מאמר היום."); process.exit(1); }

  if (posts.some((p) => p.slug === a.slug)) a.slug += "-" + today().replace(/-/g, "");
  const date = today();
  const related = posts.slice(-3).reverse();
  const dir = path.join(BLOG_DIR, a.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), renderArticle(a, k, date, related));

  posts.push({ kw: k.kw, slug: a.slug, title: a.title, excerpt: a.excerpt || "", date, words: wordCount(a.body_html) });
  if (!DRY) writeJSON(POSTS_FILE, posts);
  writeShared(posts);
  console.log(`פורסם: /blog/${a.slug}/ (${wordCount(a.body_html)} מילים)`);
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `slug=${a.slug}\ntitle=${a.title.replace(/\n/g, " ")}\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
