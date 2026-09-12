import contextlib, copy, hashlib, importlib.util, io, itertools, pathlib, shutil, subprocess, sys, tempfile, unittest
from unittest.mock import patch
sys.dont_write_bytecode = True
P = pathlib.Path('/tmp/media-public-discovery-proposal')
spec = importlib.util.spec_from_file_location('discovery_fixture', P/'test_public_discovery.py')
f = importlib.util.module_from_spec(spec); sys.modules[spec.name] = f; spec.loader.exec_module(f)
host, ctl, original, BASE, ALLOWED = f.host, f.ctl, f.original, f.BASE, f.ALLOWED
oldctl = f.load('original_productctl', '/shared-auth/deployment/host-reconciler/productctl.py')
CANON = pathlib.Path('/shared-auth/deployment')
ORIGINALS = {'host-reconciler/host_reconciler.py':'074cfea8afb469c112c87724e892862ffd8dfb2e52863d160349eb8509ee69bd', 'host-reconciler/productctl.py':'f282304749348053bec91fc9607dd1b06f844cb0c9c1c2fc05e475ab5cb8ab69', 'productctl.py':'f282304749348053bec91fc9607dd1b06f844cb0c9c1c2fc05e475ab5cb8ab69'}
def digest(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def argv():
 return ['request-deploy','Media Factory','--key','media-factory','--release-sha','a'*40,'--release-bundle','bundle.tar','--bundle-sha256','b'*64,'--compose-file','compose.yml','--edge-network','cloud-edge','--edge-alias','media-factory-frontend','--edge-port','3000','--critic-receipt','critic.json','--critic-receipt-sha256','c'*64,'--critic-signature','critic.sig','--critic-signature-sha256','d'*64,'--critic-public-key-sha256','e'*64,'--critic-finalizer-sha256','f'*64,'--critic-model','review-model','--critic-workspace','review','--source-repository','fixture-only','--runbook','runbook.md']
def invoke(module,args,source):
 data = copy.deepcopy(source); saved = []
 with patch.object(module,'root_from_args',return_value=pathlib.Path('/unused')), patch.object(module,'lock',return_value=contextlib.nullcontext()), patch.object(module,'load',return_value=data), patch.object(module,'save',side_effect=lambda root,value:saved.append(copy.deepcopy(value))), patch.object(module,'uuid4',return_value='fixture-request'), patch.object(module,'utcnow',return_value='fixture-time'), contextlib.redirect_stdout(io.StringIO()):
  module.cmd_request_deploy(args)
 return saved
class IndependentTests(unittest.TestCase):
 def test_canonical_original_hashes_and_exact_zero_fuzz_patch(self):
  for path,expected in ORIGINALS.items(): self.assertEqual(digest(CANON/path),expected,path)
  with tempfile.TemporaryDirectory(prefix='discovery-patch-') as tmp:
   dest=pathlib.Path(tmp); (dest/'host-reconciler').mkdir()
   for name in ['host_reconciler','productctl']:
    shutil.copyfile(CANON/f'host-reconciler/{name}.py',dest/f'host-reconciler/{name}.py')
    result=subprocess.run(['patch','--batch','--fuzz=0','-p0','--directory',tmp,'--input',str(P/f'{name}.patch')],capture_output=True,text=True)
    self.assertEqual(result.returncode,0,result.stdout+result.stderr)
    self.assertNotIn('offset',result.stdout.lower())
    self.assertEqual((dest/f'host-reconciler/{name}.py').read_bytes(),(P/f'{name}.py').read_bytes())
  for path,expected in ORIGINALS.items(): self.assertEqual(digest(CANON/path),expected,path)
 def test_all_326_allowlist_permutations_are_canonical(self):
  total=0
  for n in range(6):
   for paths in itertools.permutations(ALLOWED,n):
    expected=[x for x in ALLOWED if x in paths]
    self.assertEqual(host.public_get_path_patterns('media-factory',{**BASE,'public_get_paths':list(paths)}),expected)
    self.assertEqual(ctl.validate_public_get_paths('media-factory',BASE['access_policy'],list(paths)),expected); total+=1
  self.assertEqual(total,326)
 def test_malformed_types_and_encoded_or_collision_paths_fail_closed(self):
  invalid=[False,True,0,1,{},(),{'/robots.txt'},[None],[False],[0],[[]],[{}],['/robots.txt',None]]
  invalid += [[x] for x in ['/Robots.txt','/robots.txt*','/robots.txt#x','/robots.txt%3fx','/robots.txt%00','//robots.txt','/robots.txt/..','/opengraph-image/anything','/opengraph-image%2f..%2fapi',' /robots.txt','/robots.txt\n','/health','/api/preview/login','/api/preview/logout','/api/preview/session*','/_next/server/*']]
  for paths in invalid:
   with self.subTest(paths=paths):
    with self.assertRaises(host.ReconcileError): host.public_get_path_patterns('media-factory',{**BASE,'public_get_paths':paths})
    with self.assertRaises(SystemExit): ctl.validate_public_get_paths('media-factory',BASE['access_policy'],paths)
 def test_unknown_keys_policies_never_enable_discovery(self):
  for key in ['Media-Factory','media-factory-other','unknown',None,False]:
   for policy in ['form_session_single_operator','unknown',None,False]:
    if key=='media-factory' and policy==BASE['access_policy']: continue
    with self.assertRaises(host.ReconcileError): host.public_get_path_patterns(key,{**BASE,'access_policy':policy,'public_get_paths':ALLOWED})
    with self.assertRaises(SystemExit): ctl.validate_public_get_paths(key,policy,ALLOWED)
  for policy in ['unknown',None,False,'basic_auth_single_operator']:
   with self.assertRaises(host.ReconcileError): host.public_get_path_patterns('media-factory',{**BASE,'access_policy':policy,'public_get_paths':ALLOWED})
   with self.assertRaises(SystemExit): ctl.validate_public_get_paths('media-factory',policy,ALLOWED)
 def test_block_collision_stays_first_and_legacy_blocks_are_identical(self):
  for blocked in [[],['/robots.txt'],['/robots.txt*','/health','/api/v1*'],['/opengraph-image','/api/preview/session']]:
   for policy in ['basic_auth_single_operator','form_session_single_operator']:
    base={**BASE,'access_policy':policy,'blocked_paths':blocked}
    for opt in [{},{'public_get_paths':[]}]:
     self.assertEqual(host.caddy_product_block('media-factory',{**base,**opt},'fixture','fixture'),original.caddy_product_block('media-factory',base,'fixture','fixture'))
   block=host.caddy_product_block('media-factory',{**BASE,'blocked_paths':blocked,'public_get_paths':ALLOWED},'fixture','fixture')
   before='                path /login /favicon.ico /_next/static/*'
   self.assertEqual(block, original.caddy_product_block('media-factory',{**BASE,'blocked_paths':blocked},'fixture','fixture').replace(before,before+' '+' '.join(ALLOWED)))
   self.assertLess(block.index('handle @hr_media_factory_blocked'),block.index('handle @hr_media_factory_entry'))
   self.assertLess(block.index('handle @hr_media_factory_health'),block.index('handle @hr_media_factory_entry'))
 def test_default_cli_request_matches_old_state_except_empty_new_field(self):
  source={'defaults':{'domain':'example.test'},'products':{}}
  args=ctl.parser().parse_args(argv()); oldargs=oldctl.parser().parse_args(argv())
  self.assertEqual(args.public_get_path,[])
  self.assertEqual(args.access_policy,oldargs.access_policy)
  proposed=invoke(ctl,args,source)[0]; prior=invoke(oldctl,oldargs,source)[0]
  self.assertEqual(proposed['products']['media-factory'].pop('public_get_paths'),[])
  self.assertEqual(proposed,prior)
 def test_invalid_public_input_does_not_mutate_or_save_registry(self):
  for bad in [None,False,'/robots.txt',['/api/v1/jobs'],['/robots.txt','/robots.txt']]:
   args=ctl.parser().parse_args(argv()+['--access-policy',BASE['access_policy']]); args.public_get_path=bad
   source={'defaults':{'domain':'example.test'},'products':{}}
   with patch.object(ctl,'root_from_args',return_value=pathlib.Path('/unused')),patch.object(ctl,'lock',return_value=contextlib.nullcontext()),patch.object(ctl,'load',return_value=source),patch.object(ctl,'save') as save:
    with self.assertRaises(SystemExit): ctl.cmd_request_deploy(args)
    save.assert_not_called(); self.assertEqual(source,{'defaults':{'domain':'example.test'},'products':{}})
 def test_omitting_optin_closes_prior_public_paths_on_next_desired_request(self):
  source={'defaults':{'domain':'example.test'},'products':{'media-factory':{'display_name':'Media Factory','public_get_paths':ALLOWED}}}
  args=ctl.parser().parse_args(argv()+['--access-policy',BASE['access_policy']])
  self.assertEqual(invoke(ctl,args,source)[0]['products']['media-factory']['public_get_paths'],[])
if __name__=='__main__': unittest.main(verbosity=2)
