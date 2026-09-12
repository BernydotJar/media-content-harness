import importlib.util,pathlib,sys,unittest
sys.dont_write_bytecode=True
ROOT=pathlib.Path(__file__).parent

from materialize import fixture_modules
host,ctl,original,original_ctl=fixture_modules()
ALLOWED=['/robots.txt','/sitemap.xml','/llms.txt','/llm.txt','/opengraph-image']
BASE={'access_policy':'form_session_single_operator','hostname':'media-factory.textilesdemedellin.com','edge_alias':'media-factory-frontend','edge_port':3000,'blocked_paths':['/.env*']}
class DiscoveryTests(unittest.TestCase):
 def test_exact_ordered_paths_and_no_default_opt_in(self):
  self.assertEqual(host.public_get_path_patterns('media-factory',BASE),[])
  product={**BASE,'public_get_paths':list(reversed(ALLOWED))}
  self.assertEqual(host.public_get_path_patterns('media-factory',product),ALLOWED)
  self.assertEqual(ctl.validate_public_get_paths('media-factory','form_session_single_operator',list(reversed(ALLOWED))),ALLOWED)
 def test_defaults_preserve_existing_caddy_output_byte_for_byte(self):
  for key in ['media-factory','another-product']:
   for policy in ['form_session_single_operator','basic_auth_single_operator']:
    product={**BASE,'access_policy':policy}
    self.assertEqual(host.caddy_product_block(key,product,'fixture-user','fixture-hash'),original.caddy_product_block(key,product,'fixture-user','fixture-hash'))
 def test_non_product_and_non_form_policies_cannot_opt_in(self):
  for key,policy in [('another-product','form_session_single_operator'),('media-factory','basic_auth_single_operator')]:
   with self.subTest(key=key,policy=policy):
    with self.assertRaises(host.ReconcileError):host.public_get_path_patterns(key,{**BASE,'access_policy':policy,'public_get_paths':ALLOWED})
    with self.assertRaises(SystemExit):ctl.validate_public_get_paths(key,policy,ALLOWED)
 def test_no_wildcards_private_routes_queries_path_traversal_or_duplicates(self):
  for paths in [['/api/v1/jobs'],['/api/preview/session'],['/'],['/dashboard'],['/jobs/*'],['/_next/*'],['/robots.txt?x=1'],['/robots.txt/'],['/robots.txt\n/api/v1'],['/../robots.txt'],['/%2e%2e/robots.txt'],['/robots.txt','/robots.txt'],[{}],None,'/robots.txt']:
   with self.subTest(paths=paths):
    with self.assertRaises(host.ReconcileError):host.public_get_path_patterns('media-factory',{**BASE,'public_get_paths':paths})
    with self.assertRaises(SystemExit):ctl.validate_public_get_paths('media-factory','form_session_single_operator',paths)
 def test_only_entrypoint_get_head_expands_and_auth_gates_remain(self):
  block=host.caddy_product_block('media-factory',{**BASE,'public_get_paths':ALLOWED},'fixture-user','fixture-hash')
  original_block=original.caddy_product_block('media-factory',BASE,'fixture-user','fixture-hash')
  before='                path /login /favicon.ico /_next/static/*'
  after=before+' '+' '.join(ALLOWED)
  self.assertEqual(block,original_block.replace(before,after))
  self.assertIn('method GET HEAD\n'+after,block)
  self.assertIn('method POST\n                path /api/preview/login /api/preview/logout',block)
  self.assertIn('forward_auth media-factory-frontend:3000',block)
  self.assertIn('uri /api/preview/session',block)
  self.assertIn('/api/preview/session*',block)
  self.assertLess(block.index('_blocked path'),block.index('_entry {'))
 def test_validate_product_rejects_unsupported_public_field_before_release_work(self):
  with self.assertRaisesRegex(host.ReconcileError,'outside the reviewed exact allowlist'):
   host.validate_product('media-factory',{**BASE,'public_get_paths':['/api/v1']},{},pathlib.Path('/unused'))
if __name__=='__main__':unittest.main(verbosity=2)
