import type {
  Business,
  UploadedDocument
} from '../app/(dashboard)/dashboard/types/virtual-accounts';

export const ROLES = ['Staff', 'Compliance', 'Admin'] as const;
export type Role = (typeof ROLES)[number];
export interface Review {
  role: Role;
  reviewer: string;
  decision: 'Approved' | 'Rejected';
  timestamp: string;
  comment: string;
}
export interface Submission {
  id: string;
  merchantId: string;
  businessId: string;
  fingerprint: string;
  submittedAt: string;
  documents: UploadedDocument[];
  stage: Role | 'Approved' | 'Rejected';
  reviews: Review[];
}
const KEY = 'virtual-account-approval-cycles-v1';
export const approvalStatus = (s: Submission) =>
  ROLES.includes(s.stage as Role) ? `Pending ${s.stage} Review` : s.stage;
export function stepStatus(s: Submission, role: Role) {
  return (
    s.reviews.find((r) => r.role === role)?.decision ||
    (s.stage === role ? 'Pending' : 'Awaiting previous stage')
  );
}
function read(): Submission[] {
  return JSON.parse(localStorage.getItem(KEY) || '[]');
}
function save(items: Submission[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}
export const workflowService = {
  current(merchantId: string, business: Business): Submission {
    const items = read();
    const fingerprint = JSON.stringify(business.documents);
    const previous = items.filter(
      (s) => s.merchantId === merchantId && s.businessId === business.id
    );
    const latest = previous.at(-1);
    if (latest?.fingerprint === fingerprint) return latest;
    const index = Number(merchantId.split('-')[1]) - 1;
    const seedStage =
      !previous.length && business.documents.length === 3
        ? (['Staff', 'Compliance', 'Admin', 'Approved', 'Rejected'] as const)[index % 5]
        : 'Staff';
    const submittedAt =
      business.documents
        .map((d) => d.uploadedAt)
        .sort()
        .at(-1) || new Date().toISOString();
    const count =
      seedStage === 'Approved' ? 3 : seedStage === 'Rejected' ? 2 : ROLES.indexOf(seedStage);
    const reviews: Review[] = ROLES.slice(0, count).map((role, i) => ({
      role,
      reviewer: ['Ada Okeke', 'Chidi Eze', 'Amina Bello'][i],
      decision: seedStage === 'Rejected' && i === count - 1 ? 'Rejected' : 'Approved',
      timestamp: submittedAt,
      comment:
        seedStage === 'Rejected' && i === count - 1
          ? 'Tax registration details do not match the business registration. Please upload corrected documents.'
          : 'Document details verified.'
    }));
    const submission: Submission = {
      id: crypto.randomUUID(),
      merchantId,
      businessId: business.id,
      fingerprint,
      submittedAt,
      documents: structuredClone(business.documents),
      stage: seedStage,
      reviews
    };
    save([...items, submission]);
    return submission;
  },
  history(merchantId: string, businessId: string) {
    return read().filter((s) => s.merchantId === merchantId && s.businessId === businessId);
  },
  all() {
    return read();
  },
  decide(id: string, expectedRole: Role, decision: 'Approved' | 'Rejected', comment: string) {
    const role = demoIdentity.role();
    const items = read();
    const submission = items.find((s) => s.id === id);
    if (
      !submission ||
      submission.stage !== role ||
      role !== expectedRole ||
      items
        .filter(
          (s) => s.businessId === submission.businessId && s.merchantId === submission.merchantId
        )
        .at(-1)?.id !== id
    )
      throw new Error(
        'This submission has moved stages or you do not have permission to review it. Refresh and try again.'
      );
    if (!['Approved', 'Rejected'].includes(decision)) throw new Error('Invalid decision.');
    if (decision === 'Rejected' && !comment.trim())
      throw new Error('A rejection reason is required.');
    if (comment.length > 1000) throw new Error('Comments must be 1,000 characters or fewer.');
    if (
      decision === 'Approved' &&
      ['CAC Doc', 'MEMART', 'Tax Document'].some(
        (label) => !submission.documents.some((d) => d.label === label)
      )
    )
      throw new Error('All three documents are required before approval.');
    submission.reviews.push({
      role,
      reviewer: demoIdentity.name(),
      decision,
      comment: comment.trim(),
      timestamp: new Date().toISOString()
    });
    submission.stage =
      decision === 'Rejected' ? 'Rejected' : ROLES[ROLES.indexOf(role) + 1] || 'Approved';
    save(items);
  }
};
export const demoIdentity = {
  role(): Role {
    const role = localStorage.getItem('virtual-account-demo-role');
    return ROLES.includes(role as Role) ? (role as Role) : 'Admin';
  },
  name() {
    return `Demo ${this.role()} reviewer`;
  }
};
