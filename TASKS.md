# Globe Stacks: task queue (for starting a fresh chat)

Why this file exists: Claude's free plan has a usage limit per 5 hours. A long chat uses more of it. So we split the work into **small tasks, one per chat**. Each task below has a message you can paste into a NEW chat.

## How to branch into a new chat (every time)
1. Open a **new chat**.
2. Attach two things: `PROJECT-NOTES.md` and the latest project zip (download it from GitHub: Code, Download ZIP). If you only have the update zip, attach that plus PROJECT-NOTES.md.
3. Paste the starter message of ONE task from the list below.
4. When Claude sends the files, upload them to GitHub (see "How to publish" in PROJECT-NOTES.md).
5. Tick the task here (change `[ ]` to `[x]`), and update the table in PROJECT-NOTES.md if a scholarship was added.
6. If Claude says you reached the limit, wait for the time it shows, then start the next task in a new chat.

Rules to paste once if Claude drifts: *One task only. No parallel agents. Send only changed files. Use verified facts only; write "not confirmed" when a page does not say.*

## Ready-made first line (put before any task)
> I am building Globe Stacks. I attached PROJECT-NOTES.md and the project zip. Follow PROJECT-NOTES.md exactly. Do ONE task only, send only the changed files, and do not run parallel agents. Task:

---

## A. Guides (do these first)
Each guide: 1,200 to 2,000 words, simple English, friendly, practical. Save as `content/guides/<slug>.md` with keys title, category, order, summary, verified. Read real sources first and add a Sources list. Link to related scholarship pages only if the file exists.

- [x] **A1. Need-based aid explained** (done 2026-11-19: `need-based-aid-explained.md`)
- [x] **A2. Sample personal statements.** Task: "Write the guide `sample-personal-statements`. Category Applications. Show 3 short original sample statements for different students (for example a science student, a student from a small village, a student who led a project) with a short comment after each saying what works. Do not copy real essays. Add a before-and-after example of weak and strong sentences. Link to the personal statement guide."
- [x] **A3. English tests: IELTS, TOEFL, Duolingo.** Task: "Write the guide `english-tests-ielts-toefl-duolingo`. Category Documents and travel. Research the current test formats, scoring, which scholarships on this site accept which test (read the entries), test fee ranges and how to register from Africa, and how to prepare for free. Only state fees and scores you read on the official test sites; otherwise say not confirmed."
- [x] **A4. Interview preparation.** Task: "Write the guide `scholarship-interview-preparation`. Category Applications. Cover common questions with sample answers, how to prepare, online vs in-person interviews, what to wear and do, and mistakes. Base any claims about specific scholarships on the entries on this site."
- [x] **A5. Certified copies, translations and apostille.** Task: "Write the guide `certified-copies-translations-apostille`. Category Documents and travel. Explain in plain words what each means, when scholarships ask for them, and how to get them in Tanzania (and say clearly what is not confirmed for other countries). Use official government pages."
- [x] **A6. SAT, ACT and other entrance exams.** Task: "Write the guide `sat-act-and-entrance-exams`. Category Applications. Explain what they are, which scholarships on this site need them (read the entries), test dates, fees and how to register from Africa, and whether they are optional. Use College Board and ACT official pages; do not quote anything you could not read."
- [x] **A7. Application calendar.** Task: "Write the guide `month-by-month-application-calendar`. Category Start here. Build a month-by-month plan for a student finishing Form Six, using the deadlines in the scholarship entries (read them and quote each deadline exactly, with 'not confirmed' where the entry says so). Include a checklist."
- [x] **A8. Money and arriving abroad.** Task: "Write the guide `money-and-arriving-abroad`. Category Documents and travel. Cover budgeting, bank accounts, insurance, first-week checklist, staying safe, avoiding scams. Only state facts you read on official or university pages; give examples as examples."
- [ ] **A9. Samia Scholarship explained.** Task: "Research the Tanzanian government's Samia Scholarship on official government pages and write the guide `samia-scholarship-explained`. Category Start here. Say clearly what is confirmed and what is not."

## B. Scholarships (one per chat; use the format in PROJECT-NOTES.md)
After each one: fill the "Final application deadline" field if the date is confirmed, and add it to the table in PROJECT-NOTES.md.
The starter for each: "Write the scholarship entry for NAME. Read the official page first. Check Tanzania and other African countries, level (bachelor's only), what is covered, the next deadline and year. Fill all front-matter keys including eligible and open_to. Use the same sections as the other entries."

- [ ] B1. Pearson International Scholarship (Toronto)
- [ ] B2. Taiwan MOE and MOFA scholarships
- [ ] B3. India ICCR scholarships
- [ ] B4. Another Indian university with tuition discounts for Africans (name it first)
- [ ] B5. Russian government scholarships
- [ ] B6. Ashesi University (Ghana) need-based aid
- [ ] B7. NL Scholarship (Netherlands)
- [ ] B8. Islamic University of Madinah (Saudi Arabia)
- [ ] B9. Princeton
- [ ] B10. MIT
- [ ] B11. Harvard
- [ ] B12. Expand Stipendium Hungaricum (the entry is short: bring it to the same depth as the others)

## C. Fixes and features (small)
- [x] C1. Test the editor: create the GitHub token and sign in at /admin/. If it fails, tell Claude the exact message.
- [x] C2. "Days left" is now counted automatically on the Deadlines page (typed day counts removed from entries, 2026-11-20).
- [x] C3. Deadlines page. Each scholarship form has a "Final application deadline" field; fill it when the date is confirmed and the site does the rest (see PROJECT-NOTES.md).
- [ ] C4. Swahili versions of the main pages.
- [x] C5. Full site check done 2026-11-20 (40 pages, phone and desktop, links, filters). Repeat a quick check after adding many scholarships.
