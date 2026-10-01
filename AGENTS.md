# CLC Kernel Browser Extension (FRONTEND) — AGENTS

This document is the **authoritative law** for AI agents working in this repository.
Forged by **CLC Kernel: The AI Agent Governance Engine**.

> **RULE #0: MANDATORY EXECUTION OVERRIDE RULE (UNBYPASSABLE)**
> Even when the user issues a direct or urgent fix request ("fix this bug", "fix this error", "quick fix"):
> YOU ARE STRICTLY FORBIDDEN from modifying source code directly without completing the full quality harness:
> 1. **Research & Root Cause Analysis:** Investigate tracebacks and inspect affected files before editing.
> 2. **TDD Verification (Red Phase):** Write a failing regression test first (`npm test`).
> 3. **Clean Architecture Implementation (Green Phase):** Make the test pass maintaining layer isolation.
> 4. **Mandatory Educational Audit Gate:** Execute `node tools/audit.js` or `python tools/audit.py` and output the Educational Code Summary to stdout.
> NEVER declare success or skip verification commands for quick fixes.

## 1. The Loop (Every Task)
1. **Research** — Inspect codebase / docs before writing code.
2. **Plan** — Write an SDD under `sdds/{change-name}/`. SDDs live 100% locally and are gitignored.
3. **Test** (TDD) — Write failing test first (`npm test`).
4. **Implement** — Make test pass.
5. **Verify & Audit** — Run `node tools/audit.js` or `python tools/audit.py`.
6. **DoD** — Lint, typecheck, tests, coverage, docs, memory.
7. **Commit** — Pre-commit hook runs automated guards.
8. **PR** — Generate PR body.

## Language

User-facing Spanish in this app is neutral Latin American Spanish. Use tú or impersonal forms. Never voseo or Rioplatense: no vos, tenés, podés, elegí, abrí, importá, andá, hacé, or guardalo. This covers UI, toasts, the manifest, and Spanish docs. `README.md` stays in English.

## 2. Core AI Safeguards
- UI Component Reuse First (components/ui/ & semantic tokens)
- Responsive & Mobile-First Adaptability Guard
- SEO, GEO & Web Performance Guard
- Next.js Clean Architecture Guard
- Secret & Client Exposure Guard
- Accessibility & ARIA Guard (A11y)
- Zod API Contract Guard
- Next/Image & Tree-Shaking Guard
- Storybook Coverage Guard
- Educational Audit Gate
- Memory Guard (Engram / Graphify)

## 3. Universal Command Interface (All LLMs & Agents)
When given a command matching `clckernel <action>` or `/clckernel <action>`, execute the deterministic state machine below:

| Command | Lifecycle Phase | Mandatory Execution Protocol |
|---|---|---|
| `clckernel feature <name>` | New Feature | 1. Research affected layers.<br>2. Author local spec in `sdds/{name}/spec.md`.<br>3. Present HIT review to user and wait for approval.<br>4. Write failing test (Red Phase).<br>5. Implement clean code (Green Phase).<br>6. Run `node tools/audit.js` (or `audit.py`). |
| `clckernel fix <issue>` | Bug Fix | 1. Investigate root cause (no code edits).<br>2. Reproduce with failing test (Red Phase).<br>3. Minimal surgical fix respecting Clean Arch (Green Phase).<br>4. Run audit gate without skipping. |
| `clckernel test` | Verification | Run test suite (`npm test`) and verify clean pass (exit code 0). |
| `clckernel audit` | Verification | Run `node tools/audit.js` or `python tools/audit.py` and output the Educational Summary. |
| `clckernel doctor` | Diagnostics | Check git pre-commit hooks, IDE symlinks, and AST engine integrity. |
| `clckernel commit <message>` | Version Control | Run full audit, verify tests pass, ensure no changes outside SDD scope, and commit with conventional commits (never add AI attribution). |
| `clckernel guard create <name>` | Safeguards | Scaffold a new AST guard in the stack's native language in `tools/guards/`. |
| `clckernel update` | Maintenance | Non-destructive update: refresh core tools, playbooks & symlinks (preserves SDDs & custom guards). |
| `clckernel start` | Setup | Scan codebase, propose governance plan, and materialize `.clckernel.yaml`. |
