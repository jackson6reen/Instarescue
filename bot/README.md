# בוט מאמר יומי – The Gray Dome

כל בוקר GitHub Actions מריץ את `bot/generate.mjs`: לוקח את מילת המפתח הבאה מ-`keywords.json`,
כותב מאמר בעברית דרך Claude API, בודק אותו (אורך, ביטויים אסורים), בונה דף ב-`/blog/<slug>/`,
מעדכן את `/blog/`, `sitemap.xml` ו-`posts.json`, ודוחף ל-GitHub → Vercel מפרסם אוטומטית.

## התקנה (פעם אחת, 5 דקות)
1. העתיקו לריפו את: `bot/`, `.github/workflows/daily-article.yml`, ואת `index.html` המעודכן (קישור "מדריכים").
2. ב-GitHub: Settings → Secrets and variables → Actions → New repository secret
   - שם: `ANTHROPIC_API_KEY`, ערך: מפתח מ-console.anthropic.com
3. (מומלץ בחודש הראשון) Variables → `AUTO_PUBLISH` = `false` → הבוט יפתח Pull Request ואתם מאשרים כל מאמר.
   כשסומכים על האיכות – שנו ל-`true` או מחקו את המשתנה.
4. Settings → Actions → General → Workflow permissions → Read and write.
5. Actions → Daily SEO article → Run workflow – להרצה ראשונה ידנית.
6. Google Search Console: הגישו `https://thegraydome.com/sitemap.xml`.

## הוספת נושאים
הוסיפו שורות ל-`keywords.json` (`priority` 1 = קודם). הבוט לא חוזר על מילה שכבר פורסמה.

## בדיקה מקומית
`node bot/generate.mjs --dry` – מאמר דמה בלי API (לא נשמר ב-posts.json).
`node bot/generate.mjs --rebuild` – בונה מחדש את /blog ו-sitemap.

עלות משוערת: בערך 10–20 סנט למאמר ב-API (תלוי במודל ובאורך).
