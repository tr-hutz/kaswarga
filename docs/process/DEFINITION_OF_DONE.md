A task is considered DONE only if:

- Business rules remain unchanged.
- Playwright tests pass.
- TypeScript passes.
- ESLint passes.
- No console.log/debug code.
- i18n keys added (if needed).
- Documentation updated (if applicable).
- Activity Log preserved (if applicable).
- Permission checks preserved.
- Responsive layout verified.
- Accessibility not degraded.
- Code follows CODING_STANDARD.md.
- AGENTS.md rules are respected.

TailAdmin Migration is DONE only if:

- No business logic changes.
- No service layer changes.
- No database changes.
- No API contract changes.
- No permission changes.
- Visual design matches TailAdmin.
- Generic DataTable behavior is unchanged.
- Existing Playwright tests pass without modification (except selectors/UI adjustments where justified).
- No measurable performance regression beyond the accepted threshold.