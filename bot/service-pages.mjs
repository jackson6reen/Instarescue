#!/usr/bin/env node
// בונה את דפי השירות הקבועים: /facebook-recovery/ ו-/whatsapp-recovery/
// הרצה: node bot/service-pages.mjs   (אחרי כל שינוי בתוכן או במחירים למטה)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://thegraydome.com";
const WA = "972502843811";

// ===== מחירים ותנאים – לערוך כאן =====
const TERMS = {
  openFee: 249,          // דמי פתיחת תיק, מתקזזים מהמחיר הסופי
  refundDays: 14,        // תוך כמה ימים מחזירים 100% אם לא הצלחנו
  j5Active: false,       // לשנות ל-true אחרי ש-Grow מאשרים תפיסת מסגרת
};
// ======================================

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const wa = (m) => `https://wa.me/${WA}?text=${encodeURIComponent(m)}`;

const paymentBlock = (fromPrice, bizPrice) => `
<h2>כמה זה עולה ואיך משלמים</h2>
<table>
<thead><tr><th>מקרה</th><th>מחיר</th></tr></thead>
<tbody>
<tr><td>חשבון אישי</td><td>החל מ-₪${fromPrice}</td></tr>
<tr><td>עמוד עסקי / חשבון מודעות / ביזנס</td><td>החל מ-₪${bizPrice}</td></tr>
</tbody></table>
<p>את המחיר המדויק אתם מקבלים <strong>אחרי</strong> הבדיקה הראשונית ולפני שמתחילים – בלי הפתעות.</p>
<ul>
${TERMS.j5Active
  ? `<li><strong>במקרי פריצה – לא מחויבים עד שהגישה חוזרת.</strong> הסכום נשמר בכרטיס (תפיסת מסגרת) ונגבה רק אחרי שאתם מאשרים שנכנסתם לחשבון.</li>`
  : ""}
<li><strong>פתיחת תיק: ₪${TERMS.openFee}</strong> – מכסה את האבחון והכנת התיק, ומתקזזת במלואה מהמחיר הסופי.</li>
<li><strong>החזר מלא:</strong> אם לא החזרנו לכם את הגישה תוך ${TERMS.refundDays} ימים מתחילת הטיפול – מחזירים את כל מה ששילמתם מעבר לפתיחת התיק${TERMS.j5Active ? "" : ", בהתאם להסכם"}.</li>
<li>הסכם שירות חתום לפני שמתחילים, וחשבונית על כל תשלום.</li>
<li>אנחנו מקבלים רק מקרים שלפי הבדיקה יש להם סיכוי סביר. אם אפשר לפתור לבד – נגיד לכם.</li>
</ul>`;

const trust = `
<div class="trust"><strong>מה לא נעשה אף פעם:</strong> לא נבקש סיסמה או קוד אימות, לא "נחזיק" את החשבון שלכם, ולא נבטיח הצלחה. מי שמבטיח 100% או מבקש קודים – אל תשלמו לו.</div>`;

const PAGES = [
  {
    slug: "facebook-recovery",
    title: "שחזור חשבון פייסבוק שנפרץ, נחסם או הושבת",
    seo: "שחזור חשבון פייסבוק שנפרץ או הושבת | The Gray Dome",
    desc: "פרצו לכם לפייסבוק, החשבון הושבת או שהביזנס מנג'ר נחסם? מה לעשות קודם לבד, ומתי ליווי מקצועי שווה את זה. מחיר ברור מראש והחזר מלא.",
    waMsg: "היי, יש לי בעיה עם חשבון הפייסבוק שלי ואשמח לבדיקה",
    from: 450, biz: 1500,
    body: `
<p>פרצו לכם לפייסבוק, החשבון הושבת או שחשבון המודעות נחסם? בדף הזה: מה לעשות <strong>עכשיו</strong> בעצמכם, ומתי כדאי לפנות לליווי.</p>
<h2>5 דברים לעשות ב-30 הדקות הראשונות</h2>
<ol>
<li>חפשו במייל הודעה מ-Facebook על שינוי כתובת מייל או סיסמה – יש בה קישור "לא ביצעתי את השינוי" שמבטל אותו.</li>
<li>נסו את דף <a href="https://www.facebook.com/hacked" rel="nofollow noopener" target="_blank">facebook.com/hacked</a> ממכשיר שכבר התחברתם ממנו בעבר.</li>
<li>אם האקר הפעיל אימות דו-שלבי – בחרו "נסו דרך אחרת" ובקשו אימות זהות (לרוב סלפי וידאו).</li>
<li>אם יש לכם עמוד עסקי או חשבון מודעות – הודיעו לחברת האשראי כדי לחסום חיובים לא מוכרים.</li>
<li>אל תנסו עשרות פעמים ברצף – ניסיונות חוזרים עלולים לנעול את החשבון לזמן ארוך יותר.</li>
</ol>
<h2>מתי כדאי לפנות לליווי</h2>
<ul>
<li>הפורץ החליף מייל, טלפון והפעיל אימות דו-שלבי משלו.</li>
<li>החשבון הושבת אחרי הפריצה (כי הפורץ פרסם בשמכם תוכן אסור) והערעור נדחה.</li>
<li>ביזנס מנג'ר, עמוד עסקי או חשבון מודעות – פורץ הוסיף את עצמו כמנהל או מריץ מודעות על הכרטיס שלכם.</li>
<li>עסק שמפסיד כסף כל יום שהחשבון סגור.</li>
</ul>
<h2>מה אנחנו עושים</h2>
<ol>
<li><strong>בדיקה ראשונית בוואטסאפ</strong> – מה קרה, מה עוד בשליטתכם, ומה הסיכוי.</li>
<li><strong>הכנת תיק</strong> – הוכחות בעלות, ציר זמן של הפריצה, וניסוח ערעור באנגלית לפי המסלול המתאים.</li>
<li><strong>ליווי צעד-אחר-צעד</strong> בתהליכים הרשמיים של Meta, מהמכשיר שלכם – אתם נשארים בשליטה.</li>
<li><strong>הקשחה אחרי השחזור</strong> – הסרת מכשירים ומנהלים זרים, אימות דו-שלבי, גיבוי אדמינים לעמוד.</li>
</ol>`,
    faq: [
      ["כמה זמן לוקח לשחזר חשבון פייסבוק שנפרץ?", "פריצה שמטופלת מהר נפתרת לרוב תוך יום עד כמה ימים. חשבון שהושבת וערעור שנדחה יכולים לקחת שבוע עד כמה שבועות."],
      ["אפשר לשחזר חשבון פייסבוק בלי גישה למייל ולטלפון?", "לפעמים כן – דרך אימות זהות, מכשיר מוכר או אנשי קשר מהימנים שהוגדרו מראש. זה בדיוק סוג המקרים שבו ליווי עוזר."],
      ["אתם צריכים את הסיסמה שלי?", "לא. אנחנו לא מבקשים סיסמאות או קודים. כל הפעולות נעשות על ידכם, מהמכשיר שלכם, בהדרכה שלנו."],
      ["אתם קשורים ל-Meta?", "לא. אנחנו שירות עצמאי שמכיר היטב את התהליכים הרשמיים של Meta ומלווה אתכם בהם."],
      ["מה אם לא תצליחו?", `תקבלו החזר מלא של מה ששילמתם מעבר לדמי פתיחת התיק (₪${TERMS.openFee}), לפי ההסכם.`],
    ],
  },
  {
    slug: "whatsapp-recovery",
    title: "פרצו לכם לוואטסאפ או שוואטסאפ ביזנס נחסם? כך מחזירים את החשבון",
    seo: "פרצו לי לוואטסאפ / וואטסאפ ביזנס נחסם – מה עושים | The Gray Dome",
    desc: "השתלטו לכם על הוואטסאפ או שחשבון וואטסאפ ביזנס נחסם? המדריך המלא מה לעשות לבד, ומתי ליווי מקצועי עוזר. בלי סיסמאות ובלי הבטחות.",
    waMsg: "היי, יש לי בעיה עם הוואטסאפ ואשמח לבדיקה",
    from: 350, biz: 900,
    body: `
<p>יש שלושה מצבים שונים מאוד – וחשוב לזהות באיזה מהם אתם לפני שמשלמים למישהו:</p>
<table>
<thead><tr><th>מה אתם רואים</th><th>מה זה</th><th>צריך ליווי?</th></tr></thead>
<tbody>
<tr><td>הודעה שהחשבון חסום זמנית + טיימר</td><td>חסימה זמנית</td><td><strong>לא.</strong> מסירים אפליקציות לא רשמיות (GB, Plus) ומחכים שהטיימר ייגמר.</td></tr>
<tr><td>"החשבון שלך חסום" בלי טיימר</td><td>חסימה קבועה</td><td>קודם כל בקשת בדיקה מתוך האפליקציה. רק וואטסאפ יכולה לשחרר – אנחנו יכולים לעזור לנסח ולהגיש נכון, במיוחד לוואטסאפ ביזנס.</td></tr>
<tr><td>הוואטסאפ התנתק ומישהו אחר שולח מהמספר שלכם</td><td>השתלטות (פריצה)</td><td><strong>כן, אם זה לא נפתר תוך שעה.</strong> במיוחד אם הפורץ הגדיר PIN של אימות דו-שלבי.</td></tr>
</tbody></table>
<h2>פרצו לכם לוואטסאפ – מה לעשות עכשיו</h2>
<ol>
<li>התקינו מחדש את וואטסאפ הרשמית והתחברו עם המספר שלכם – קוד ה-SMS יגיע אליכם וינתק את הפורץ.</li>
<li>אם מבקשים PIN שלא הגדרתם – הפורץ הגדיר אימות דו-שלבי. אל תנחשו; לפי מרכז העזרה של וואטסאפ יש תקופת המתנה עד שאפשר להתחבר בלי ה-PIN.</li>
<li>הודיעו לאנשי הקשר (בטלפון או ברשת אחרת) לא להעביר כסף ולא לשלוח קודים – זו ההונאה הנפוצה אחרי השתלטות.</li>
<li>אחרי שחזרתם: הגדירו PIN משלכם והוסיפו כתובת מייל לשחזור.</li>
</ol>
<h2>וואטסאפ ביזנס נחסם</h2>
<p>לעסק, כל יום בלי וואטסאפ הוא לקוחות שהולכים. החסימה קורית לרוב בגלל שליחה לאנשים שלא שמרו את המספר, הוספה לקבוצות או דיווחים. אנחנו עוברים איתכם על הסיבה האפשרית, מכינים בקשת בדיקה מנומקת, ומכינים תוכנית שימוש שמורידה את הסיכון לחסימה הבאה.</p>`,
    faq: [
      ["אפשר לשלם למישהו שישחרר לי את הוואטסאפ?", "אף גורם חיצוני לא יכול לשחרר חסימה בעצמו – רק וואטסאפ. מי שמבטיח אחרת, או מבקש קוד, כנראה מנסה לנצל אתכם. אנחנו עוזרים להגיש נכון ולטפל בהשתלטויות."],
      ["כמה זמן לוקחת בקשת בדיקה על חסימה?", "לרוב כמה ימים. חסימות קבועות יכולות לקחת יותר."],
      ["הפורץ הגדיר אימות דו-שלבי. מה עכשיו?", "לא לנחש קודים. מתחברים מחדש עם ה-SMS, ואם נדרש PIN – פועלים לפי תקופת ההמתנה של וואטסאפ. אנחנו מלווים את התהליך עד הסוף."],
      ["מה אם לא תצליחו?", `החזר מלא של מה ששילמתם מעבר לדמי פתיחת התיק (₪${TERMS.openFee}), לפי ההסכם. ובחסימה זמנית – פשוט נגיד לכם לחכות, בלי לגבות.`],
    ],
  },
];

const CSS = `:root{--bg:#f7f8fa;--card:#fff;--text:#1c1e21;--muted:#5f6368;--accent:#2b59c3;--wa:#1faa59;--border:#e3e6ea}
*{box-sizing:border-box}body{margin:0;font-family:Heebo,system-ui,sans-serif;background:var(--bg);color:var(--text);line-height:1.8;font-size:18px}
a{color:var(--accent)}header.top{background:#fff;border-bottom:1px solid var(--border)}header.top .in{max-width:860px;margin:auto;padding:14px 20px;display:flex;justify-content:space-between;align-items:center}
header.top .logo{font-weight:800;text-decoration:none;color:var(--text)}main{max-width:860px;margin:auto;padding:24px 20px 80px}
h1{font-size:clamp(28px,4vw,40px);line-height:1.3;margin:.4em 0}h2{font-size:26px;margin-top:1.8em}
table{width:100%;border-collapse:collapse;margin:1em 0;font-size:16px}th,td{border:1px solid var(--border);padding:8px 10px;text-align:right;vertical-align:top}th{background:#f0f3f8}
.cta{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:24px;margin:32px 0;text-align:center}
.btn-wa{display:inline-block;background:var(--wa);color:#fff;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:999px}
.trust{background:#fff8e6;border:1px solid #f1dca7;border-radius:12px;padding:14px 18px;margin:24px 0;font-size:16px}
details{background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px 16px;margin:10px 0}summary{font-weight:700;cursor:pointer}
.note{font-size:14px;color:var(--muted);border-top:1px solid var(--border);padding-top:16px;margin-top:40px}
.wa-float{position:fixed;bottom:18px;left:18px;background:var(--wa);color:#fff;border-radius:999px;padding:12px 18px;font-weight:700;text-decoration:none;box-shadow:0 6px 20px rgba(0,0,0,.18)}`;

function render(p) {
  const url = `${SITE}/${p.slug}/`;
  const schema = [
    { "@context": "https://schema.org", "@type": "Service", name: p.title, serviceType: "ליווי שחזור חשבונות", areaServed: "IL", inLanguage: "he-IL",
      provider: { "@type": "Organization", name: "The Gray Dome", url: SITE }, url,
      offers: { "@type": "Offer", priceCurrency: "ILS", price: String(p.from) } },
    { "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: p.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
  ];
  const cta = (label) => `<div class="cta"><p><strong>רוצים שנבדוק את המקרה שלכם?</strong></p><p>שלחו בוואטסאפ מה קרה. נחזור עם הערכה כנה ומחיר – לפני שמשלמים משהו.</p><a class="btn-wa" href="${wa(p.waMsg)}" target="_blank" rel="noopener">${label}</a><p style="font-size:15px;color:#5f6368;margin-top:10px">הוואטסאפ שלכם חסום? התקשרו: <a href="tel:+${WA}">050-284-3811</a></p></div>`;
  return `<!DOCTYPE html>
<html lang="he" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(p.seo)}</title><meta name="description" content="${esc(p.desc)}"><link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(p.seo)}"><meta property="og:description" content="${esc(p.desc)}"><meta property="og:url" content="${url}"><meta property="og:locale" content="he_IL">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;700;800&display=swap" rel="stylesheet">
<style>${CSS}</style>
${schema.map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join("\n")}
</head><body>
<header class="top"><div class="in"><a class="logo" href="/">The Gray Dome</a><a href="/blog/">מדריכים</a></div></header>
<main><h1>${esc(p.title)}</h1>
${p.body}
${cta("בדיקה ראשונית בוואטסאפ")}
${paymentBlock(p.from, p.biz)}
${trust}
<h2>שאלות נפוצות</h2>
${p.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("\n")}
${cta("שליחת המקרה בוואטסאפ")}
<p class="note">The Gray Dome הוא שירות עצמאי ואינו קשור ל-Meta, Facebook, Instagram או WhatsApp. אין התחייבות לתוצאה; ההחזר הכספי לפי תנאי ההסכם.</p>
</main><a class="wa-float" href="${wa(p.waMsg)}" target="_blank" rel="noopener">💬 וואטסאפ</a></body></html>\n`;
}

for (const p of PAGES) {
  const dir = path.join(ROOT, p.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), render(p));
  console.log("נבנה:", `/${p.slug}/`);
}
