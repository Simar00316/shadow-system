# Shadow System — agent instructions

The spec is **[PRD.md](PRD.md)**. Read it fully before any work. It is the source of truth; game rules live in `docs/game-design.md`, decisions in `docs/decisions.md`.

## Key rules (repeat of the owner's run rules — never drop these)

- Build the complete app per PRD.md, following Section 6 build order M0 → M13. Do not start a milestone until the previous gate is green and merged.
- **Research first, always.** Every Section 2 track gets a note in `/research` (Findings, What we take, What we do better, Sources) before designing/coding anything that depends on it. Never guess when you can research. Research/exploration subagents use Sonnet; the main session stays on Opus.
- `design/DESIGN.md`, `src/styles/tokens.css` and the `/dev/gallery` page exist before any screen code (F0, F1).
- **Unattended run.** Never stop to ask the owner. Pick the most reasonable option (the one that feels most like a real RPG) and log it in `docs/decisions.md`.
- Skip anything needing the owner's login, payment, review or a physical device (deploy, Cloudflare, API/VAPID keys, real-iPhone tests). Prepare it fully, list it in `docs/needs-owner.md` + a `needs-owner` issue, mock it, move on.
- Only safe, reversible actions: no force-push, no deleting outside this folder, no global system changes, no paid services, no secrets in git.
- GitHub: private repo `Simar00316/shadow-system`. One milestone per build step, one issue per task, related small changes grouped into one branch/PR with `Closes #N`, squash-merge yourself. Run lint + type-check + tests locally before each merge. CI only via `workflow_dispatch` or `full-ci` label (use for big changes).
- **NEVER add Claude or any AI as co-author or in attribution.** No `Co-Authored-By` trailers, no "Generated with" lines — not in commits, PRs, issues, code, or docs. Attribution is disabled in `.claude/settings.json`. Git identity is repo-local: Simarpreet Singh <simarpreetsingh0316@gmail.com>.
- Keep raising issues for every bug and enhancement found (bug → failing test before fix).
- After each milestone: lint, type-check, all tests; fix failures before moving on.
- Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:`, `refactor:`).
- Third-party assets go in `public/assets/third-party/` with source URL in `docs/asset-sources.md`.

## Done when

Every PRD Section 6 Definition of Done item is ticked (except owner tasks in `docs/needs-owner.md`), all tests pass on `main`, and `docs/needs-owner.md` and the README are complete.

## Progress

Track milestone status in `docs/progress.md` (update after each milestone).
