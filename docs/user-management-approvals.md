User Management and approvals currently use replaceable browser mock adapters in
`lib/user-management.ts` and `lib/approval-workflow.ts`. Use the labelled Demo role
selector to switch between Staff, Compliance, and Admin. User Management is available
only to Admin. Setup links work in the browser holding the demo data; no emails,
real accounts, or passwords are stored or sent.

Approval records are scoped to merchant and business, with immutable document
snapshots for each cycle. Replacing a document starts a new cycle at Staff and
preserves earlier decisions. Staff and Compliance approvals leave the business
pending; only Admin approval activates it. Rejections close the cycle.

For a production connection, replace these adapters with authenticated server
endpoints. Derive reviewer identity and role from the server session, enforce Admin
permissions for listing/inviting/resending users, atomically compare the expected
cycle and stage when recording decisions, and persist reviewer identity, role,
timestamp, decision, and comment. Invitation tokens must be generated and validated
by the server, expire, be single-use, and be delivered through an email provider.
Account creation must preserve the invitation's assigned role. The demo role
selector must be removed when connecting production authentication.

Validation: `npm run check-types`, `node tests/approval-workflow.test.cjs`, and
`node tests/virtual-accounts.test.cjs`.
