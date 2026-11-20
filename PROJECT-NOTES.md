# Globe Stacks: project notes

Keep this file in the project. Upload it with the zip at the start of every new chat.
Last updated: 2026-11-20. This file replaces all older versions (it merges the notes from the separate chats).

## Decisions
- Name: Globe Stacks. Language: English. Free hosting: GitHub (opportunes360/globe-stacks, branch main) + Cloudflare Pages (globe-stacks.pages.dev). Build command `node build.js`, output folder `dist`, NODE_VERSION=22.
- Audience: African students finishing secondary school. Tanzania is checked first because the owner is Tanzanian, so entries say clearly whether Tanzania is included. Examples from Tanzania are fine if labelled. Other countries are added where the sources confirm them.
- Scholarships are international (study abroad), not Tanzania-based awards.
- **Level: undergraduate (bachelor's) only.** No master's, PhD or high-school (UWC) entries. If a scheme also covers master's, write only the bachelor's part.
- Funding levels: **Fully funded** (`funding: Full`) and **Partly funded** (`funding: Partial`) only. No student-loan content anywhere. HESLB is out completely.
- Goal: all-in-one and well detailed, so a student never has to "check with someone else". Every entry has an official link and a verified date. Do not announce the site until the owner says all areas are full.
- Contact: globe.stacks@gmail.com, WhatsApp +255 638 789 255.
- Logo: blue globe with stacked layers. App icon: full navy square with no transparent corners (so the phone app has no Chrome badge or light background).
- The owner studies medicine and adds content between lectures. Keep each task small.

## How we work (free Claude plan)
- One task per message. No parallel agents (they hit the 5-hour limit and wrote nothing). No whole-site regeneration.
- Send only the changed files each time. Upload to GitHub; Cloudflare rebuilds in about a minute.
- New chat per stage. Start by uploading the zip and this file.
- Scholarships: 1 or 2 per message, one file each in `content/scholarships/`.
- Before writing an entry, read the official page for: who is eligible (Tanzania and other African countries), level, what is covered, deadline and year. If the page does not say, write "not confirmed". Do not copy dates from blog or agent sites.
- Every scholarship file needs these front-matter keys: title, country, **eligible**, **open_to**, funding, level, status, deadline, summary, who, covers, official_link, verified, featured. Optional: `draft: true` hides the entry.
- `eligible` (powers the "My country" filter): `all`, `africa`, a list like `Kenya, Ghana, Nigeria`, or `unknown` (shows for everyone). Use `unknown` when only Tanzania was checked. Use the exact country names in the filter list.
- Guides: keys title, category (Start here / Applications / Documents and travel), order, summary, verified.

## Status
- Site live. Code now includes: two funding levels, "My country" + "Study in" filters, `draft: true` hide switch, full-square icons, editor config with `repo: opportunes360/globe-stacks`.
- Content: **17 scholarships, 13 guides**. All scholarships have `eligible` and `open_to`. Dates feed the Deadlines page from each entry's "Final application deadline" field and from `content/deadlines.json` (the page counts days left by itself; no typed day counts in entries).
- **Editor (/admin/) is NOT tested.** It needs a fine-grained GitHub token (this one repo only, Contents read and write). Sveltia version 0.158.1 loads from unpkg. Test sign-in before relying on it.
- The new "Another country" option in the filter hides entries marked africa or a country list, and keeps `all` and `unknown`.

## Scholarships on the site (17)

| Scholarship | File | Funding | Notes (as of 2026-11-19) |
| --- | --- | --- | --- |
| Berea College (USA) | berea-college.md | Full | Deadline 30 Nov (year not printed, treat as 2026). **Most urgent.** |
| UBC International Scholars (Canada) | ubc-international-scholars.md | Partial | Deadline 2 Dec 2026. School nominator needed. |
| Dartmouth College (USA) | dartmouth-college.md | Full | Regular Decision 1 Jan; aid documents after. Need-blind. |
| Yale University (USA) | yale-university.md | Full | Regular Decision 2 Jan. Need-blind. |
| Amherst College (USA) | amherst-college.md | Full | Regular Decision 5 Jan; aid form 15 Jan. |
| NYU Abu Dhabi (UAE) | nyu-abu-dhabi.md | Partial | ED II 10 Jan, Regular 1 Feb. CSS Profile. |
| Reach Oxford (UK) | reach-oxford-scholarship.md | Full | Deadline 26 Jan 2027. Needs an Oxford offer. |
| CyprusAid (Univ. of Nicosia) | cyprusaid-university-of-nicosia.md | Full | Spring 2027 closed 6 Nov. Ten countries incl. Tanzania. |
| Stipendium Hungaricum | stipendium-hungaricum.md | Full | 2026/27 closed 15 Jan 2026. 2027/28 Call not yet published. **Short file (575 words): can be expanded.** |
| Türkiye Burslari | turkiye-burslari.md | Full | 2027 round not announced (usually 10 Jan to 20 Feb). |
| GKS Korea undergraduate | gks-undergraduate-korea.md | Full | 2027 closed for Tanzania. Next round not announced. |
| MEXT Japan undergraduate | mext-japan-undergraduate.md | Full | 2027 round closed 21 May 2026 for Tanzania. |
| Chinese Government Scholarship (CSC) | chinese-government-scholarship.md | Full | Check status for Tanzania route. |
| Mastercard Foundation Scholars | mastercard-foundation-scholars.md | Full | Apply through partner universities. Partner table is partial. |
| Morocco AMCI | morocco-amci-scholarship.md | Partial | Last Tanzanian call 2024/25. No new call found. |
| Egypt government scholarships | egypt-government-scholarships.md | Partial | 2025/26 closed 15 Sep 2025. No 2026/27 notice found. |
| **Sharda University (India)** | sharda-university-india.md | Partial | NEW 2026-11-19. Tuition discount (minimum 20%, up to 50% on many programmes). No deadline or fee table published on the pages read. Application fee conflict: USD 500 (Sierra Leone page) vs INR 1,500 (Indian route). Not a full scholarship. |

Guides (13): how scholarships work and how to spot scams; how to write a personal statement; sample personal statements; recommendation letters and your CV; scholarship interview preparation; English tests (IELTS, TOEFL, Duolingo); SAT, ACT and entrance exams; need-based aid explained; certified copies, translations and apostille; getting your passport in Tanzania; student visa basics; money and arriving abroad; month-by-month application calendar.

## Backlog: what to write next (one per message)

### Urgent first
1. Berea closes 30 Nov 2026 and UBC 2 Dec 2026. Nothing to rewrite (the Deadlines page counts days left). For each new scholarship, fill the "Final application deadline" field when the date is confirmed.

### Checked on official pages earlier, not yet written
- **Lester B. Pearson International Scholarship (Toronto, Canada).** Full. School nomination required. 2026 cycle closed (nomination 9 Oct, application 6 Nov). Next cycle expected autumn 2027. https://future.utoronto.ca/pearson-scholarships
- **Taiwan MOE / MOFA scholarships.** Partial (monthly allowance plus tuition help). MOE does not exclude by region; MOFA depends on relations with your country. https://taiwanscholarship.moe.gov.tw/web/pages.aspx

### Leads (only seen in news or blogs: read the official page first)
- **India ICCR** (India-Africa Maitri and ABV schemes). Tanzania slots rose from 85 to 135 for 2026/27 (Daily News, 18 Feb 2026). Need ICCR's own page. Also check other Indian private universities that give African students tuition discounts (same style as Sharda). Always mark as partial unless living costs are paid.
- **Russian government scholarships.** 150 places for Tanzania (Daily News, 22 Apr 2026). Need the official route.
- **Samia Scholarship** (Tanzanian government, 60 places abroad). Selected from Form Six results, so probably a guide, not an entry.
- **Ashesi University (Ghana)** need-based aid. https://ashesi.edu.gh/scholarships/
- **NL scholarship (Netherlands).** Check whether bachelor's is covered. https://www.nuffic.nl/en/nl-scholarship
- **Islamic University of Madinah (Saudi Arabia).** Needs the university's own page.
- **Other need-blind US colleges:** Princeton, MIT, Harvard. Check each international aid page.
- **Ideas not yet checked:** Romania, Serbia, Bulgaria, Poland government scholarships; Italy regional (DSU) aid; German university aid; Reach-style awards at Edinburgh and other UK universities.

### Checked and excluded (do not add)
- Czech Government Scholarships (Tanzania not on 2027/28 list, no bachelor's listed). Italy ItAS (master's, Tanzania not listed). Aga Khan Foundation (postgraduate, part loan). UWC (high school). HESLB (loans). Postgraduate-only schemes: Commonwealth, Chevening, Australia Awards, Erasmus Mundus, VLIR-UOS, DAAD EPOS, Fulbright foreign student, Swedish Institute, Eiffel.

## Guides to add later
Only A9 (Samia Scholarship explained) is left in TASKS.md.

## Automatic closing (simple way, 2026-11-20)
Each scholarship form in the editor has a calendar picker **Final application deadline (optional)**, saved as `closes: 2027-01-31`. Fill it only when the official page confirms the final date. After that date (Tanzania time) the site marks the scholarship "Closed for now" by itself (list, page, Status filter) and removes its row from the Deadlines page. The Deadlines page also shows that date automatically, so a normal new scholarship needs NO change in `content/deadlines.json`.
- Unconfirmed dates: leave the field empty. These are never auto-closed.
- New round announced: change the `closes` date to the new date, set Status back to Open or Upcoming, and update the "Dates and deadline" text.
- `content/deadlines.json` is only for extra dates (for example financial-aid forms), "expected" dates, and the "no date yet" list. Seven older scholarships (Berea, UBC, Dartmouth, Yale, Amherst, NYU Abu Dhabi, Reach Oxford) still use `"closes": true` rows there, and that keeps working.

## Site checks done
2026-11-20: all 40 pages tested on phone (390 px) and desktop. No broken internal links, no browser errors. Fixed: long web addresses and wide tables overflowing on phones. Filters, Deadlines page and install manifest tested. Not tested by Claude: the /admin/ editor sign-in (needs your token), and the installed app on a real phone.
Known small gap: the scholarship entries have no separate "Sources" list at the end (they cite sources in the text and give the official link). Add one when you next edit an entry.

## Later features
Swahili versions (C4); document checklist page; newsletter form (`newsletterUrl` in site.json); own domain when money allows; clean the Tanzania-specific wording if the audience is widened further.

## How to publish a change (no GitHub link to Claude, so files are sent as a zip)
1. Download the update zip and unzip it on your computer.
2. On GitHub, open the repo, press Add file, then Upload files. Drag in the changed files (keep the same folders, for example `content/scholarships/`). Commit to main.
3. Cloudflare Pages builds automatically. Wait about a minute and hard-refresh the site.
4. Files you delete must be deleted by hand on GitHub (open the file, three dots, Delete file).
5. Optional safety net: a second free Cloudflare Pages project (Upload your static files, using the `dist` folder) can serve as a private preview before the live site changes.
