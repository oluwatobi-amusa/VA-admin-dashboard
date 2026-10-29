const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

function service(storage = new Map(), transform = (source) => source) {
  const filename = path.join(__dirname, '../app/(dashboard)/dashboard/queries/virtual-accounts.ts');
  const source = ts.transpileModule(transform(fs.readFileSync(filename, 'utf8')), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  }).outputText;
  const context = {
    exports: {},
    setTimeout: (resolve) => resolve(),
    localStorage: {
      getItem: (key) => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, value)
    }
  };
  context.crypto = require('node:crypto').webcrypto;
  context.structuredClone = structuredClone;
  context.require = () => {
    const workflow = { ...context, exports: {} };
    vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib/approval-workflow.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, workflow);
    return workflow.exports;
  };
  vm.runInNewContext(source, context, { filename });
  return context.exports.virtualAccountsService;
}

test('mock relationships, account numbers, totals and all requested statuses are coherent', async () => {
  const data = await service().getDashboard();
  assert.equal(data.merchants.length, 12);
  assert.equal(data.tills.length, 27);
  assert.equal(data.merchants.filter((m) => m.status === 'Active').length, 9);
  assert.ok(data.tills.some((t) => t.status === 'Active'));
  assert.equal(
    data.tills.filter((t) => t.merchantId === 'merchant-1').reduce((sum, t) => sum + t.balance, 0),
    1027260.5
  );
  for (const till of data.tills) {
    const merchant = data.merchants.find((m) => m.id === till.merchantId);
    assert.ok(merchant.businesses.some((b) => b.id === till.businessId));
    assert.match(till.number, /^0\d{9}$/);
    assert.ok(till.balance >= 0);
  }
  assert.ok(data.merchants.every((merchant) => merchant.name === `${merchant.firstName} ${merchant.lastName}`));
  assert.ok(data.merchants.flatMap((merchant) => merchant.businesses).some((business) => business.status === 'Active'));
  for (const transaction of data.transactions) {
    assert.ok(data.tills.some((t) => t.id === transaction.tillId));
    assert.ok(['Successful', 'Pending', 'Failed'].includes(transaction.status));
  }
  assert.equal(new Set(data.transactions.map((t) => t.reference)).size, data.transactions.length);
  assert.ok(data.merchants[0].businesses.length > 1);
  assert.equal(data.merchants[0].businesses[1].documents.length, 1);
  assert.ok(data.merchants.every((m) => !('bvn' in m) && /^\d{4}$/.test(m.bvnLastFour)));
});

test('disabling persists across service loads, preserves balances, and rejects invalid accounts', async () => {
  const storage = new Map();
  const api = service(storage);
  const before = await api.getDashboard();
  await api.disableTill('till-1-1');
  await api.disableTill('till-1-1');
  const after = await service(storage).getDashboard();
  assert.equal(after.tills.find((t) => t.id === 'till-1-1').status, 'Disabled');
  assert.equal(after.tills.find((t) => t.id === 'till-1-1').balance, before.tills[0].balance);
  assert.equal(after.tills.filter((t) => t.status === 'Active').length, before.tills.filter((t) => t.status === 'Active').length);
  await assert.rejects(api.disableTill('unknown-account'), /Account not found/);
});

test('lookup trims references, matches case insensitively and supports empty and error responses', async () => {
  const api = service();
  const transaction = await api.findTransaction('  va-001-0001  ');
  assert.equal(transaction.tillId, 'till-1-1');
  assert.equal(transaction.status, 'Successful');
  assert.equal((await api.findTransaction('VA-001-0006')).status, 'Failed');
  assert.equal((await api.findTransaction('VA-001-0007')).status, 'Pending');
  assert.equal(await api.findTransaction('NOT-FOUND'), null);
  await assert.rejects(api.findTransaction('DEMO-ERROR'), /temporarily unavailable/);
});

test('storage failures do not change account state', async () => {
  const storage = new Map();
  await service(storage).getDashboard();
  storage.set = () => {
    throw new Error('Storage unavailable');
  };
  const api = service(storage);
  await assert.rejects(api.disableTill('till-1-1'), /Storage unavailable/);
  assert.equal((await api.getDashboard()).tills[0].status, 'Pending');
});

test('restoring a suspended merchant persists and preserves its accounts and history', async () => {
  const storage = new Map();
  const api = service(storage);
  const before = await api.getDashboard();
  assert.equal(before.merchants.find((m) => m.id === 'merchant-3').status, 'Suspended');
  await api.restoreMerchant('merchant-3');
  await api.restoreMerchant('merchant-3');
  const after = await service(storage).getDashboard();
  assert.equal(after.merchants.find((m) => m.id === 'merchant-3').status, 'Active');
  assert.equal(after.merchants.find((m) => m.id === 'merchant-7').status, 'Suspended');
  assert.equal(JSON.stringify(after.tills.map(({ status, ...account }) => account)), JSON.stringify(before.tills.map(({ status, ...account }) => account)));
  assert.equal(JSON.stringify(after.transactions), JSON.stringify(before.transactions));
  await assert.rejects(api.restoreMerchant('unknown-merchant'), /Merchant not found/);
});

test('failed merchant restoration leaves the merchant suspended', async () => {
  const storage = new Map();
  await service(storage).getDashboard();
  storage.set = () => { throw new Error('Storage unavailable'); };
  const api = service(storage);
  await assert.rejects(api.restoreMerchant('merchant-3'), /Storage unavailable/);
  assert.equal((await api.getDashboard()).merchants.find((m) => m.id === 'merchant-3').status, 'Suspended');
});

test('business reviews activate only the approved business and corrected uploads preserve history', async () => {
  const storage = new Map();
  const api = service(storage);
  const before = await api.getDashboard();
  for (const role of ['Staff', 'Compliance', 'Admin']) {
    storage.set('virtual-account-demo-role', role);
    await api.reviewBusiness('merchant-1', 'business-1-1', 'Approved', 'Verified');
    const merchant = (await api.getDashboard()).merchants[0];
    assert.equal(merchant.businesses[0].status, role === 'Admin' ? 'Active' : 'Pending');
    assert.equal(merchant.businesses[1].status, 'Pending');
  }
  let after = await api.getDashboard();
  assert.equal(JSON.stringify(after.transactions), JSON.stringify(before.transactions));
  assert.equal(JSON.stringify(after.tills.map(({status,...t}) => t)), JSON.stringify(before.tills.map(({status,...t}) => t)));
  await api.uploadDocument('merchant-1', 'business-1-1', { label: 'Tax Document', filename: 'corrected.pdf', type: 'application/pdf', url: 'data:application/pdf;base64,JVBERi0=' });
  after = await service(storage).getDashboard();
  assert.equal(after.merchants[0].businesses[0].status, 'Pending');
  const cycles = JSON.parse(storage.get('virtual-account-approval-cycles-v1')).filter(s => s.businessId === 'business-1-1');
  assert.equal(cycles.length, 2);
  assert.equal(cycles[0].stage, 'Approved');
  assert.equal(cycles[0].reviews.length, 3);
  assert.equal(cycles[1].stage, 'Staff');
  await assert.rejects(api.reviewBusiness('merchant-1', 'business-1-1', 'Approved'), /permission/);
});
