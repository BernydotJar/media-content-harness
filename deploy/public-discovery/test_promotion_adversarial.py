"""Independent regression probes; exclusively mutate disposable fixtures."""
import json, pathlib, shutil, unittest
from unittest.mock import patch
import materialize, promote
import test_promote as fixture
BASE=fixture.BASE
class PromotionAdversarialTests(unittest.TestCase):
 setUp = fixture.PromotionTests.setUp
 tearDown = fixture.PromotionTests.tearDown
 def test_changed_parent_never_receives_later_write_or_false_rollback_success(self):
  root=self.root;outside=root.parent/'outside-host';writes=[];moved=False;write=promote.atomic_write
  def observe(path,data,meta,**kwargs):
   if moved and path.resolve().is_relative_to(outside):writes.append(str(path.resolve().relative_to(outside)))
   return write(path,data,meta,**kwargs)
  def switch_parent(index):
   nonlocal moved
   if index==0:
    (root/'host-reconciler').rename(outside)
    (root/'host-reconciler').symlink_to(outside,target_is_directory=True)
    moved=True
  with patch.object(promote,'atomic_write',side_effect=observe):
   with self.assertRaises((RuntimeError,OSError)):
    promote.apply(root,promote.ROOT,self.uid,commit=True,after_replace=switch_parent,reviewed_digest=promote.package_digest(promote.ROOT))
  self.assertEqual(writes,[], 'Must never follow the substituted parent during replacement or recovery')
  journals=[json.loads(x.read_text()) for x in (root/'control-plane-backups').glob('*/journal.json')]
  self.assertEqual(len(journals),1)
  self.assertEqual(journals[0]['status'],'RECOVERY_REQUIRED')
 def test_changed_payload_plus_matching_manifest_is_not_review_authority(self):
  proposal=self.root.parent/'changed-proposal';proposal.mkdir()
  reviewed=promote.package_digest(promote.ROOT)
  for name in ['manifest.json','host_reconciler.patch','productctl.patch','materialize.py','promote.py']:
   shutil.copyfile(promote.ROOT/name,proposal/name)
  path=proposal/'host_reconciler.patch';before=path.read_text();after=before.replace('public discovery is authorized only for Media Factory form-session mode','UNREVIEWED policy text',1)
  self.assertNotEqual(before,after);path.write_text(after)
  path=proposal/'manifest.json';data=json.loads(path.read_text())
  data['entries'][0]['after_sha256']=materialize.sha(materialize.apply_patch(BASE['host_reconciler.py'][0],(proposal/'host_reconciler.patch').read_bytes(),'host_reconciler.py'))
  path.write_text(json.dumps(data))
  with self.assertRaises((RuntimeError,ValueError)):
   promote.apply(self.root,proposal,self.uid,commit=True,reviewed_digest=reviewed)
  self.assertFalse((self.root/'control-plane-backups').exists())
  for entry in materialize.manifest():
   self.assertEqual(materialize.sha((self.root/entry['target']).read_bytes()),entry['before_sha256'])
if __name__=='__main__':unittest.main(verbosity=2)
