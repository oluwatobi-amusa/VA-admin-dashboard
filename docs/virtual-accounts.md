# Virtual Account Admin

Open `/dashboard` for Overview, `/dashboard/merchants` for Merchants, and
`/dashboard/disputes` for transaction lookup. The root URL redirects to Overview.

The dashboard reuses the starter's layout and UI components. No virtual-account
backend endpoints exist in this starter. Replace the methods in
`app/(dashboard)/dashboard/queries/virtual-accounts.ts` with API requests to connect
a backend. React Query manages loading, errors, retry and refreshed data.

Mock records include 12 merchants, 27 tills, multiple businesses, missing profile
fields and documents, and all requested statuses. Combined balances and counts
are computed from till records. Payment Value sums successful credits. Dates use
Africa/Lagos. Only the last four BVN digits are included in the mock data.

Account disabling is saved in localStorage under
`virtual-account-disabled-tills-v1`. Delete that key to reset mock account status.
The sample PDF and image uploads are demonstration documents.

Business verification at `/dashboard/document-verification` lists one submission
per business, with merchant and business names. Each business has a dedicated
review page at `/dashboard/document-verification/{merchantId}/{businessId}`.
Approval requires CAC Doc, MEMART and Tax Document for that business; decline
requires a reason. Decisions and replacement uploads affect only that business.
Uploading a document returns its verification to Pending while preserving the
other businesses' decisions. Merchant profiles show the selected business's
documents without a verification status section. Status and decline reasons are
shown on the Business verification review page. The merchants table summarizes business statuses:
Pending if any business is pending, otherwise Declined if any business is
declined, otherwise Approved.

Business decisions use `virtual-account-business-verifications-v2` in localStorage.
Matching decisions from the previous merchant-level storage are carried over.
Uploads use `virtual-account-document-uploads-v1`. These are local demo data;
merchant notifications and shared storage require a backend.

Merchant names are personal first and last names; business and till names remain
business names. Businesses become Active only after approval. Their enabled
tills remain Pending until approval, while disabled tills remain Disabled.
Replacement uploads return the affected business and its enabled tills to Pending.
Till accounts include a business-name column and a business filter for every merchant.

## Verification

For Vercel, use npm with the committed `package-lock.json`: install with `npm ci`
and build with `npm run build`. The project `.npmrc` preserves the legacy peer
dependency setting required by the existing React and ESLint packages.

Run `npm run check-types` and `node --test tests/virtual-accounts.test.cjs`.

For manual lookup checks, use:

- `VA-001-0001`: successful transaction.
- `VA-001-0006`: failed transaction.
- `VA-001-0007`: pending transaction.
- `NOT-FOUND`: no match.
- `DEMO-ERROR`: service failure with retry.

Tunde Adebayo owns Adebayo Retail and Adebayo Wholesale and has seven tills. Switch businesses in Profile
and Documents to see coordinated updates; filter businesses in Till accounts.
Ngozi Eze owns Lagos Books and has no tills; Adebayo Retail Branch 5 has no transactions.

Check merchant and transaction filters together, move to page two, then change a
filter to confirm pagination resets. Check that disabling requires confirmation,
Cancel preserves status, and confirming persists Disabled after reload. On small
screens, navigation opens from the header and tables scroll horizontally.
