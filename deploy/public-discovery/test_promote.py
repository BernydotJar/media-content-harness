import contextlib,fcntl,hashlib,json,os,pathlib,shutil,sys,tempfile,unittest
sys.dont_write_bytecode=True
from materialize import ROOT,TARGETS,manifest,reconstruct,sha
import promote
raw_apply,raw_rollback=promote.apply,promote.rollback
def apply(*args,**kwargs):
 kwargs.setdefault('reviewed_digest',promote.package_digest(args[1]));return raw_apply(*args,**kwargs)
def rollback(*args,**kwargs):
 kwargs.setdefault('reviewed_digest',promote.package_digest(args[1]));return raw_rollback(*args,**kwargs)
CANON=pathlib.Path(os.environ.get('PUBLIC_DISCOVERY_CANONICAL_ROOT','/shared-auth/deployment/host-reconciler'))
BASE=reconstruct(CANON)
class PromotionTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.root=pathlib.Path(self.tmp.name)/'deployment';self.root.mkdir();(self.root/'host-reconciler').mkdir();self.uid=os.geteuid()
  for entry in manifest():
   p=self.root/entry['target'];p.write_bytes(BASE[p.name][0]);p.chmod(entry['mode'])
  for name in ['host-reconciler.execution.lock','registry.lock']:(self.root/name).write_text('')
  (self.root/'registry.json').write_text('{"products":{}}')
 def tearDown(self):self.tmp.cleanup()
 def hashes(self):return [sha((self.root/p).read_bytes()) for p in TARGETS]
 def original(self):self.assertEqual(self.hashes(),[e['before_sha256'] for e in manifest()])
 def test_read_only_default_and_mode_preserving_apply_then_rollback(self):
  before=set(self.root.rglob('*'));modes=[(self.root/p).stat().st_mode for p in TARGETS]
  self.assertEqual(apply(self.root,ROOT,self.uid)['action'],'CHECKED');self.assertEqual(before,set(self.root.rglob('*')))
  result=apply(self.root,ROOT,self.uid,commit=True);self.assertEqual(self.hashes(),[e['after_sha256'] for e in manifest()]);self.assertEqual(modes,[(self.root/p).stat().st_mode for p in TARGETS])
  backup=pathlib.Path(result['backup']);self.assertEqual(rollback(self.root,ROOT,self.uid,backup)['action'],'ROLLED_BACK');self.original()
 def test_failure_after_first_and_second_replace_rolls_all_bytes_back(self):
  for fail_index in [0,1]:
   def fault(index):
    if index==fail_index:raise OSError('injected replacement failure')
   with self.assertRaisesRegex(OSError,'injected'):apply(self.root,ROOT,self.uid,commit=True,after_replace=fault)
   self.original();journals=list((self.root/'control-plane-backups').glob('*/journal.json'));self.assertEqual(json.loads(journals[-1].read_text())['status'],'AUTO_ROLLED_BACK')
 def test_process_crash_journal_supports_explicit_recovery(self):
  def crash(index):raise KeyboardInterrupt('simulated process death')
  with self.assertRaises(KeyboardInterrupt):apply(self.root,ROOT,self.uid,commit=True,after_replace=crash)
  with self.assertRaisesRegex(RuntimeError,'Incomplete'):apply(self.root,ROOT,self.uid)
  backup=next((self.root/'control-plane-backups').iterdir());rollback(self.root,ROOT,self.uid,backup);self.original()
 def test_every_target_drift_is_rejected_without_backup_or_replacement(self):
  for target in TARGETS:
   p=self.root/target;before=p.read_bytes();p.write_bytes(before+b'# drift\n')
   with self.assertRaisesRegex(RuntimeError,'Source drift'):apply(self.root,ROOT,self.uid,commit=True)
   self.assertFalse((self.root/'control-plane-backups').exists());p.write_bytes(before)
  self.original()
 def test_each_existing_lock_contention_fails_without_waiting(self):
  for name in ['host-reconciler.execution.lock','registry.lock']:
   fd=os.open(self.root/name,os.O_RDONLY)
   try:
    fcntl.flock(fd,fcntl.LOCK_EX|fcntl.LOCK_NB)
    with self.assertRaisesRegex(RuntimeError,'Busy existing lock'):apply(self.root,ROOT,self.uid,commit=True)
   finally:os.close(fd)
  self.original()
 def test_readonly_lock_mode_supported(self):
  for name in ['host-reconciler.execution.lock','registry.lock']:(self.root/name).chmod(0o444)
  self.assertEqual(apply(self.root,ROOT,self.uid)['action'],'CHECKED')
 def test_target_and_lock_symlinks_fail_closed(self):
  for target in [*TARGETS,'registry.lock','host-reconciler.execution.lock']:
   p=self.root/target;storage=p.with_name(p.name+'.original');p.rename(storage);p.symlink_to(storage)
   with self.assertRaises((OSError,RuntimeError)):apply(self.root,ROOT,self.uid,commit=True)
   p.unlink();storage.rename(p)
  self.original()
 def test_directory_symlink_and_wrong_uid_rejected(self):
  with self.assertRaises(RuntimeError):apply(self.root,ROOT,self.uid+1,commit=True)
  alias=self.root.parent/'alias';alias.symlink_to(self.root)
  with self.assertRaises((OSError,RuntimeError)):apply(alias,ROOT,self.uid,commit=True)
  self.original()
 def test_rollback_refuses_tampered_backup_or_current_drift(self):
  result=apply(self.root,ROOT,self.uid,commit=True);backup=pathlib.Path(result['backup']);p=backup/TARGETS[0];original=p.read_bytes();p.write_bytes(original+b'# altered')
  with self.assertRaisesRegex(RuntimeError,'Backup integrity'):rollback(self.root,ROOT,self.uid,backup)
  p.write_bytes(original);target=self.root/TARGETS[0];target.write_bytes(target.read_bytes()+b'# drift')
  with self.assertRaisesRegex(RuntimeError,'Current source drift'):rollback(self.root,ROOT,self.uid,backup)
 def test_rollback_refuses_registry_opt_in_before_any_mutation(self):
  result=apply(self.root,ROOT,self.uid,commit=True);before=self.hashes();(self.root/'registry.json').write_text('{"products":{"media-factory":{"public_get_paths":["/robots.txt"]}}}')
  with self.assertRaisesRegex(RuntimeError,'Registry still requests'):rollback(self.root,ROOT,self.uid,pathlib.Path(result['backup']))
  self.assertEqual(before,self.hashes())
 def test_mutated_payload_and_manifest_target_fail_before_writes(self):
  proposal=self.root.parent/'proposal';proposal.mkdir()
  for name in ['manifest.json','host_reconciler.patch','productctl.patch','materialize.py','promote.py']:shutil.copyfile(ROOT/name,proposal/name)
  p=proposal/'host_reconciler.patch';p.write_text(p.read_text().replace('public_get_path_patterns(key, product)','public_get_path_patterns(key, product, None)',1))
  with self.assertRaisesRegex(ValueError,'payload hash'):apply(self.root,proposal,self.uid,commit=True)
  shutil.copyfile(ROOT/'host_reconciler.patch',p);p=proposal/'manifest.json';data=json.loads(p.read_text());data['entries'][0]['target']='../outside';p.write_text(json.dumps(data))
  with self.assertRaisesRegex(ValueError,'target set'):apply(self.root,proposal,self.uid,commit=True)
  self.original();self.assertFalse((self.root/'control-plane-backups').exists())
 def test_swapped_parent_symlink_cannot_write_external_target(self):
  external=self.root.parent/'moved-controller';captured={}
  def swap(index):
   if index==0:
    (self.root/'host-reconciler').rename(external);(self.root/'host-reconciler').symlink_to(external)
    captured.update({p.name:p.read_bytes() for p in external.iterdir()})
  with self.assertRaises((OSError,RuntimeError)):apply(self.root,ROOT,self.uid,commit=True,after_replace=swap)
  self.assertEqual(captured,{p.name:p.read_bytes() for p in external.iterdir()})
  journal=next((self.root/'control-plane-backups').glob('*/journal.json'));self.assertEqual(json.loads(journal.read_text())['status'],'RECOVERY_REQUIRED')
 def test_swapped_parent_directory_identity_prevents_rollback_writes(self):
  external=self.root.parent/'moved-controller';captured={}
  def swap(index):
   if index==0:
    (self.root/'host-reconciler').rename(external);shutil.copytree(external,self.root/'host-reconciler')
    captured.update({p.name:p.read_bytes() for p in (self.root/'host-reconciler').iterdir()})
  with self.assertRaisesRegex(RuntimeError,'Parent directory changed'):apply(self.root,ROOT,self.uid,commit=True,after_replace=swap)
  self.assertEqual(captured,{p.name:p.read_bytes() for p in (self.root/'host-reconciler').iterdir()})
  journal=next((self.root/'control-plane-backups').glob('*/journal.json'));self.assertEqual(json.loads(journal.read_text())['status'],'RECOVERY_REQUIRED')
 def test_review_digest_refuses_coordinated_patch_and_manifest_change(self):
  proposal=self.root.parent/'proposal';proposal.mkdir()
  for name in ['manifest.json','host_reconciler.patch','productctl.patch','materialize.py','promote.py']:shutil.copyfile(ROOT/name,proposal/name)
  digest=promote.package_digest(proposal);patch=proposal/'host_reconciler.patch';patch.write_text(patch.read_text().replace('public_get_paths must be a list','public_get_paths requires a list'))
  from materialize import apply_patch
  body=apply_patch(BASE['host_reconciler.py'][0],patch.read_bytes(),'host_reconciler.py');manifest_path=proposal/'manifest.json';data=json.loads(manifest_path.read_text());data['entries'][0]['after_sha256']=sha(body);manifest_path.write_text(json.dumps(data))
  with self.assertRaisesRegex(RuntimeError,'Reviewed proposal digest'):raw_apply(self.root,proposal,self.uid,commit=True,reviewed_digest=digest)
  self.original();self.assertFalse((self.root/'control-plane-backups').exists())
 def test_cli_host_guard_rejects_linux_and_wrong_real_user(self):
  from unittest.mock import patch
  import argparse
  args=argparse.Namespace(expected_uid=501,deployment_root='/Users/example/.cloud-sandbox-mcp-data/shared-auth/deployment')
  with patch('promote.platform.system',return_value='Linux'),self.assertRaisesRegex(RuntimeError,'Mac host'):promote.host_context(args)
  with patch('promote.platform.system',return_value='Darwin'),patch('promote.os.geteuid',return_value=0),self.assertRaisesRegex(RuntimeError,'host file owner'):promote.host_context(args)
if __name__=='__main__':unittest.main(verbosity=2)
