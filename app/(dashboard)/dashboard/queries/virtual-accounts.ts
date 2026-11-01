import {
  DashboardData,
  Business,
  Merchant,
  Till,
  Transaction,
  UploadedDocument,
  VerificationStatus
} from '../types/virtual-accounts';

export const REQUIRED_DOCUMENTS = ['CAC Doc', 'MEMART', 'Tax Document'];

const names = [
  'Adebayo Retail',
  'Bloom Foods',
  'Cedar Logistics',
  'Dune Fashion',
  'Eko Pharmacy',
  'Fresh Market',
  'Greenfield Supplies',
  'Harbour Electronics',
  'Ife Studios',
  'Jade Hospitality',
  'Kora Ventures',
  'Lagos Books'
];
const people = [
  ['Tunde', 'Adebayo'],
  ['Amaka', 'Okafor'],
  ['Chidi', 'Obi'],
  ['Zainab', 'Bello'],
  ['Bola', 'Adeyemi'],
  ['Fatima', 'Hassan'],
  ['Emeka', 'Nwosu'],
  ['Funke', 'Ojo'],
  ['Ife', 'Adekunle'],
  ['Aisha', 'Yusuf'],
  ['Kola', 'Balogun'],
  ['Ngozi', 'Eze']
];
const documents = [
  {
    label: 'CAC Doc',
    filename: 'cac-certificate.pdf',
    type: 'application/pdf' as const,
    url: '/documents/certificate',
    size: '0.7 KB'
  },
  {
    label: 'MEMART',
    filename: 'memorandum.pdf',
    type: 'application/pdf' as const,
    url: '/documents/certificate'
  },
  {
    label: 'Tax Document',
    filename: 'tax-certificate.svg',
    type: 'image/svg+xml' as const,
    url: '/documents/tax-certificate.svg'
  }
];
const merchants: Merchant[] = names.map((name, i) => ({
  id: `merchant-${i + 1}`,
  name: people[i].join(' '),
  email: `${people[i].join('.').toLowerCase()}@example.com`,
  createdAt: `2026-${String(1 + (i % 9)).padStart(2, '0')}-${String(4 + i).padStart(2, '0')}`,
  status: i % 4 === 2 ? 'Suspended' : 'Active',
  verification: {
    status: 'Pending',
    submittedAt: `2026-10-${String(1 + (i % 9)).padStart(2, '0')}T09:30:00+01:00`
  },
  firstName: people[i][0],
  lastName: people[i][1],
  phone: i === 8 ? undefined : `+234 803 450 ${String(1200 + i)}`,
  bvnLastFour: String(4200 + i),
  businesses: Array.from({ length: i === 0 ? 2 : 1 }, (_, j) => ({
    status: 'Pending',
    id: `business-${i + 1}-${j + 1}`,
    name: j ? 'Adebayo Wholesale' : `${name} Limited`,
    registrationType: 'Limited liability company',
    rcNumber: `RC${1842000 + i * 2 + j}`,
    taxId: i === 8 ? undefined : `${10240000 + i}-0001`,
    registrationDate: `2024-03-${String(10 + i).padStart(2, '0')}`,
    email: j ? 'wholesale@adebayoretail.ng' : `business@${name.toLowerCase().replace(/ /g, '')}.ng`,
    address: `${12 + i} Adeola Odeku Street, Victoria Island, Lagos`,
    verification: {
      status: 'Pending',
      submittedAt: `2026-10-${String(1 + (i % 9)).padStart(2, '0')}T09:30:00+01:00`
    },
    documents: (j ? [documents[0]] : documents.slice(0, i % 3 === 1 ? 2 : 3)).map((document) => ({
      ...document,
      uploadedAt: `2026-10-${String(1 + (i % 9)).padStart(2, '0')}T09:30:00+01:00`
    }))
  }))
}));
const tills: Till[] = merchants.flatMap((merchant, i) =>
  Array.from({ length: i === 0 ? 7 : i === 11 ? 0 : 2 }, (_, j) => ({
    id: `till-${i + 1}-${j + 1}`,
    merchantId: merchant.id,
    businessId: merchant.businesses[j % merchant.businesses.length].id,
    name: `${names[i]} ${j === 0 ? 'Main' : `Branch ${j}`}`,
    number: `0${String(123456780 + i * 10 + j)}`,
    balance: Math.round((125000 + i * 34000 + j * 7250.5) * 100) / 100,
    status: j === 1 && i % 3 === 0 ? 'Inactive' : 'Active'
  }))
);
const transactions: Transaction[] = tills.flatMap((till, i) =>
  Array.from({ length: i === 5 ? 0 : 14 }, (_, j) => ({
    reference: `VA-${String(i + 1).padStart(3, '0')}-${String(j + 1).padStart(4, '0')}`,
    tillId: till.id,
    date: `2026-09-${String(28 - j).padStart(2, '0')}T${String(9 + (j % 8)).padStart(2, '0')}:30:00+01:00`,
    type: j % 3 === 1 ? 'Debit' : 'Credit',
    counterparty: ['Ada Okeke', 'Bola Adeyemi', 'Chinedu Eze', 'Fatima Hassan'][j % 4],
    counterpartyNumber: `0${String(221345670 + j)}`,
    bank: ['Access Bank', 'GTBank', 'Zenith Bank'][j % 3],
    description: j % 3 === 1 ? 'Supplier payment' : 'Customer payment',
    amount: 12500 + j * 1750.25,
    status: j % 7 === 5 ? 'Failed' : j % 7 === 6 ? 'Pending' : 'Successful'
  }))
);

const STORAGE_KEY = 'virtual-account-disabled-tills-v1';
const RESTORED_MERCHANTS_KEY = 'virtual-account-restored-merchants-v1';
const UPLOADS_KEY = 'virtual-account-document-uploads-v1';
const VERIFICATION_DECISIONS_KEY = 'virtual-account-verification-decisions-v1';
interface SavedVerificationDecision {
  merchantId: string;
  businessId: string;
  fingerprint: string;
  status: Exclude<VerificationStatus, 'Pending'>;
  reason: string;
  reviewedAt: string;
}
interface SavedUpload {
  merchantId: string;
  businessId: string;
  document: UploadedDocument;
}
function readUploads(): SavedUpload[] {
  const value: unknown = JSON.parse(localStorage.getItem(UPLOADS_KEY) || '[]');
  if (
    !Array.isArray(value) ||
    value.some(
      (item) =>
        !item ||
        typeof item.merchantId !== 'string' ||
        typeof item.businessId !== 'string' ||
        !item.document ||
        !REQUIRED_DOCUMENTS.includes(item.document.label) ||
        typeof item.document.filename !== 'string' ||
        typeof item.document.url !== 'string' ||
        !['application/pdf', 'image/png', 'image/jpeg'].includes(item.document.type) ||
        !item.document.url.startsWith(`data:${item.document.type};base64,`) ||
        typeof item.document.uploadedAt !== 'string' ||
        !Number.isFinite(Date.parse(item.document.uploadedAt))
    )
  )
    throw new Error('Saved document uploads could not be read.');
  return value;
}
function currentMerchants(): Merchant[] {
  const uploads = readUploads();
  return merchants.map((merchant) => ({
    ...merchant,
    businesses: merchant.businesses.map((business) => {
      const replacements = uploads
        .filter((item) => item.merchantId === merchant.id && item.businessId === business.id)
        .map((item) => item.document);
      return {
        ...business,
        documents: [
          ...business.documents.filter(
            (document) => !replacements.some((item) => item.label === document.label)
          ),
          ...replacements
        ]
      };
    })
  }));
}
const delay = () => new Promise<void>((resolve) => setTimeout(resolve, 350));
function readRestoredMerchants(): string[] {
  const value: unknown = JSON.parse(localStorage.getItem(RESTORED_MERCHANTS_KEY) || '[]');
  if (!Array.isArray(value) || value.some((id) => typeof id !== 'string'))
    throw new Error('Saved merchant settings could not be read.');
  return value;
}
function readDisabled(): string[] {
  const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  if (!Array.isArray(value) || value.some((id) => typeof id !== 'string'))
    throw new Error('Saved account settings could not be read.');
  return value;
}
function readVerificationDecisions(): SavedVerificationDecision[] {
  const value: unknown = JSON.parse(localStorage.getItem(VERIFICATION_DECISIONS_KEY) || '[]');
  if (
    !Array.isArray(value) ||
    value.some(
      (decision) =>
        !decision ||
        typeof decision.merchantId !== 'string' ||
        typeof decision.businessId !== 'string' ||
        typeof decision.fingerprint !== 'string' ||
        !['Approved', 'Declined'].includes(decision.status) ||
        typeof decision.reason !== 'string' ||
        typeof decision.reviewedAt !== 'string'
    )
  )
    throw new Error('Saved verification decisions could not be read.');
  return value;
}

/** Replace these methods with API requests when virtual-account endpoints are available. */
export const virtualAccountsService = {
  async getDashboard(): Promise<DashboardData> {
    await delay();
    const disabled = readDisabled();
    const restored = readRestoredMerchants();
    const decisions = readVerificationDecisions();
    const dashboardMerchants: Merchant[] = currentMerchants().map((merchant) => {
      const businesses = merchant.businesses.map((business): Business => {
        const fingerprint = JSON.stringify(business.documents);
        const decision = decisions.find(
          (item) =>
            item.merchantId === merchant.id &&
            item.businessId === business.id &&
            item.fingerprint === fingerprint
        );
        const submittedAt =
          business.documents
            .map((document) => document.uploadedAt)
            .sort((a, b) => Date.parse(a) - Date.parse(b))
            .at(-1) || merchant.createdAt;
        return {
          ...business,
          status:
            decision?.status === 'Approved'
              ? 'Active'
              : decision?.status === 'Declined'
                ? 'Declined'
                : 'Pending',
          verification: decision
            ? {
                submittedAt,
                status: decision.status,
                reason: decision.reason,
                reviewedAt: decision.reviewedAt
              }
            : { status: 'Pending', submittedAt }
        };
      });
      const submittedAt =
        merchant.businesses
          .flatMap((business) => business.documents.map((document) => document.uploadedAt))
          .sort()
          .at(-1) || merchant.createdAt;
      return {
        ...merchant,
        businesses,
        status: restored.includes(merchant.id) ? 'Active' : merchant.status,
        verification: {
          submittedAt,
          status: businesses.some((business) => business.verification.status === 'Pending')
            ? 'Pending'
            : businesses.some((business) => business.verification.status === 'Declined')
              ? 'Declined'
              : businesses.length
                ? 'Approved'
                : 'Pending'
        }
      };
    });
    return {
      merchants: dashboardMerchants,
      transactions,
      tills: tills.map((till) => ({
        ...till,
        status: disabled.includes(till.id) || till.status === 'Inactive' ? 'Inactive' : 'Active'
      }))
    };
  },
  async reviewBusiness(
    id: string,
    businessId: string,
    status: Exclude<VerificationStatus, 'Pending'>,
    reason = ''
  ): Promise<void> {
    await delay();
    const merchant = currentMerchants().find((item) => item.id === id);
    if (!merchant) throw new Error('Merchant not found.');
    const business = merchant.businesses.find((item) => item.id === businessId);
    if (!business) throw new Error('Merchant business not found.');
    if (!['Approved', 'Declined'].includes(status))
      throw new Error('Invalid verification decision.');
    if (status === 'Declined' && !reason.trim())
      throw new Error('Enter a reason for declining verification.');
    if (reason.trim().length > 1000)
      throw new Error('The reason must be 1,000 characters or fewer.');
    if (
      status === 'Approved' &&
      REQUIRED_DOCUMENTS.some(
        (label) => !business.documents.some((document) => document.label === label)
      )
    )
      throw new Error('All required documents must be uploaded before approval.');
    const decisions = readVerificationDecisions();
    localStorage.setItem(
      VERIFICATION_DECISIONS_KEY,
      JSON.stringify([
        ...decisions.filter((decision) => decision.merchantId !== id || decision.businessId !== businessId),
        {
          merchantId: id,
          businessId,
          fingerprint: JSON.stringify(business.documents),
          status,
          reason: reason.trim(),
          reviewedAt: new Date().toISOString()
        }
      ])
    );
  },
  async uploadDocument(
    merchantId: string,
    businessId: string,
    document: Omit<UploadedDocument, 'uploadedAt'>
  ): Promise<void> {
    await delay();
    const merchant = merchants.find((item) => item.id === merchantId);
    if (!merchant?.businesses.some((business) => business.id === businessId))
      throw new Error('Merchant business not found.');
    if (!REQUIRED_DOCUMENTS.includes(document.label)) throw new Error('Invalid document category.');
    if (
      !['application/pdf', 'image/png', 'image/jpeg'].includes(document.type) ||
      !document.url.startsWith(`data:${document.type};base64,`) ||
      !document.filename.trim()
    )
      throw new Error('Upload a PDF, PNG or JPEG document.');
    if (document.url.length > 2800000) throw new Error('Documents must be 2 MB or smaller.');
    const uploads = readUploads();
    localStorage.setItem(
      UPLOADS_KEY,
      JSON.stringify([
        ...uploads.filter(
          (item) =>
            !(
              item.merchantId === merchantId &&
              item.businessId === businessId &&
              item.document.label === document.label
            )
        ),
        { merchantId, businessId, document: { ...document, uploadedAt: new Date().toISOString() } }
      ])
    );
  },
  async restoreMerchant(id: string): Promise<void> {
    await delay();
    if (!merchants.some((merchant) => merchant.id === id)) throw new Error('Merchant not found.');
    const restored = readRestoredMerchants();
    localStorage.setItem(
      RESTORED_MERCHANTS_KEY,
      JSON.stringify(Array.from(new Set([...restored, id])))
    );
  },
  async disableTill(id: string): Promise<void> {
    await delay();
    if (!tills.some((till) => till.id === id)) throw new Error('Account not found.');
    const disabled = readDisabled();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(new Set([...disabled, id]))));
  },
  async findTransaction(reference: string): Promise<Transaction | null> {
    await delay();
    // Useful for exercising the retry state without a live API.
    if (reference.toUpperCase() === 'DEMO-ERROR')
      throw new Error('Transaction lookup is temporarily unavailable. Please retry.');
    return (
      transactions.find(
        (transaction) => transaction.reference.toLowerCase() === reference.trim().toLowerCase()
      ) || null
    );
  }
};
