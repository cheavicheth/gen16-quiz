# GEN 16 — EXAM QUIZ · ត្រៀមប្រឡង

A single-file, offline-capable quiz game built to help Gen 16 students revise
for the national exam. Khmer interface, mobile first, with a shared leaderboard.

**Live:** https://cheavicheth.github.io/gen16-quiz/

## Subjects

| Subject | Questions |
|---|---|
| 🛡️ Cybersecurity | 117 multiple choice + 9 short answer |
| ⚙️ Software Engineering | 100 multiple choice |
| 💻 Advance Programming | 66 multiple choice |

## Modes

- **⚡ ប្រកួត / Challenge** — 20 random questions, 15 seconds each, streak counter, ranked
- **📖 រៀន / Study** — self paced, instant feedback with a Khmer explanation per question
- **📝 ប្រឡង / Exam** — pick a topic and question count, timed, full review at the end
- **🗂️ សំណួរខ្លី / Short answer** — flashcards with model answers
- **🏆 តារាងពិន្ទុ / Leaderboard** — per subject, plus a combined ranking out of 60

## How it works

`index.html` is entirely self contained — all questions, styles and logic in one
file, no build step and no dependencies. It runs offline from a local copy.

The leaderboard is optional. It posts to a Google Apps Script web app
(`Code.gs`) that appends rows to a private Google Sheet. Set `API_URL` in
`index.html` to your own `/exec` URL, or leave it empty and everything except
the leaderboard still works.

## Accuracy

Some answers and explanations were AI-assisted and **may contain errors**.
Always verify against your instructor and official course material before an exam.

## Attribution and takedown

Questions come from university revision handouts and published study guides.
Copyright in that material remains with its original owners; this project claims
no ownership of it. Not affiliated with EC-Council, any university, publisher, or
examination board.

Rights holders: please [open an issue](https://github.com/cheavicheth/gen16-quiz/issues)
and the material will be removed promptly.

## Privacy

Only the name a player types, their score, and their time are stored — for the
leaderboard. No email, phone number, or location is collected. Submitting is optional.

## Licence

Code is [MIT licensed](LICENSE). The licence covers the code only, not the
question content.
