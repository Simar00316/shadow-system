# Decisions

One line per decision: what, and why.

- Git `user.name` was unset globally; set repo-local identity to the GitHub account name "Simarpreet Singh" with the global email. Why: PRD requires owner identity only; no global changes allowed.
- Claude Code attribution disabled in `.claude/settings.json` (`includeCoAuthoredBy: false`, empty `attribution`). Why: PRD authorship rule.
- TypeScript pinned to ~6.0 instead of 7.0. Why: typescript-eslint supports `<6.1`.
- Playwright project uses WebKit with the `iPhone 15` device profile. Why: PRD requires WebKit iPhone emulation.
- Playwright WebKit browser installed into the user's existing Playwright cache (AppData\Local\ms-playwright), which already held Chromium. Why: needed for E2E; user-level, removable.
