const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function setup() {
  const storage = new Map();
  const context = { exports: {}, crypto: require('node:crypto').webcrypto, structuredClone, localStorage: { getItem: k => storage.get(k) || null, setItem: (k,v) => storage.set(k,v) } };
  function load(file) { const target = { ...context, exports: {}, require: () => load('approval-workflow') }; vm.runInNewContext(ts.transpileModule(fs.readFileSync(`lib/${file}.ts`, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, target); return target.exports; }
  return { storage, ...load('approval-workflow'), ...load('user-management') };
}
const business = () => ({ id: 'business-test', documents: ['CAC Doc','MEMART','Tax Document'].map(label => ({ label, uploadedAt: '2026-10-01T09:00:00Z', url: '/sample.pdf' })) });
test('strict role sequence, stale decisions, and final approval only after Admin', () => {
  const {storage,workflowService:w}=setup(); const b=business(); let s=w.current('merchant-1',b);
  assert.throws(()=>w.decide(s.id,'Admin','Approved',''), /permission/);
  for (const [role,next] of [['Staff','Compliance'],['Compliance','Admin'],['Admin','Approved']]) {
    storage.set('virtual-account-demo-role',role); w.decide(s.id,role,'Approved','Checked');
    s=w.current('merchant-1',b); assert.equal(s.stage,next);
    assert.throws(()=>w.decide(s.id,role,'Approved',''), /permission/);
  }
  assert.equal(s.reviews.length,3); assert.ok(s.reviews.every(r=>r.reviewer && r.timestamp && r.comment==='Checked'));
});
test('rejection reason, stopped cycle, corrected resubmission and independent businesses', () => {
  const {storage,workflowService:w}=setup(); storage.set('virtual-account-demo-role','Staff'); const b=business(); const old=w.current('merchant-1',b);
  assert.throws(()=>w.decide(old.id,'Staff','Rejected',' '), /reason/);
  w.decide(old.id,'Staff','Rejected','Incorrect tax details');
  assert.throws(()=>w.decide(old.id,'Staff','Approved',''), /permission/);
  b.documents[2].url='/corrected.pdf'; const next=w.current('merchant-1',b);
  assert.equal(next.stage,'Staff'); assert.notEqual(next.id,old.id); assert.equal(w.history('merchant-1',b.id)[0].reviews[0].comment,'Incorrect tax details');
  const other=w.current('merchant-1',{...business(),id:'other-business'}); w.decide(next.id,'Staff','Approved',''); assert.equal(w.current('merchant-1',{...business(),id:'other-business'}).stage,other.stage);
});
test('invitation permissions, duplicates, resend tokens and assigned role on acceptance', () => {
  const {storage,userManagementService:u}=setup(); storage.set('virtual-account-demo-role','Staff'); assert.throws(()=>u.invite('Test Person','test@example.com','Admin'),/Only Admin/);
  storage.set('virtual-account-demo-role','Admin'); assert.throws(()=>u.invite('Test','invalid','Staff'),/valid email/);
  const user=u.invite('Test Person','Test@example.com','Compliance'); assert.equal(user.status,'Pending'); assert.throws(()=>u.invite('Other',' test@example.com ','Staff'),/already/);
  const resent=u.resend(user.id); assert.notEqual(resent.token,user.token); assert.equal(u.inspect(user.token),undefined);
  const accepted=u.accept(resent.token,'demo-password'); assert.equal(accepted.role,'Compliance'); assert.equal(accepted.status,'Accepted'); assert.throws(()=>u.accept(resent.token,'demo-password'),/already/);
});
