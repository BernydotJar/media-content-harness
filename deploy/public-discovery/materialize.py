"""Reconstruct reviewed controller bytes from exact baselines; never install them."""
import hashlib, importlib.util, json, os, re, sys, tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parent
TARGETS=('host-reconciler/host_reconciler.py','host-reconciler/productctl.py','productctl.py')
BEFORE=('074cfea8afb469c112c87724e892862ffd8dfb2e52863d160349eb8509ee69bd','f282304749348053bec91fc9607dd1b06f844cb0c9c1c2fc05e475ab5cb8ab69')
def sha(data): return hashlib.sha256(data).hexdigest()
def manifest(proposal=ROOT):
 data=json.loads((Path(proposal)/'manifest.json').read_text())
 if data.get('format')!='media-discovery-controller-promotion.v1': raise ValueError('Invalid manifest format')
 entries=data.get('entries',[])
 if tuple(e.get('target') for e in entries)!=TARGETS: raise ValueError('Manifest target set changed')
 for i,e in enumerate(entries):
  expected=BEFORE[0 if i==0 else 1]
  if e.get('before_sha256')!=expected or e.get('mode')!=[0o644,0o644,0o755][i] or not re.fullmatch('[0-9a-f]{64}',e.get('after_sha256','')): raise ValueError('Unreviewed baseline or mode')
 if entries[1]['after_sha256']!=entries[2]['after_sha256']: raise ValueError('Dispatcher payload hashes differ')
 return entries

def apply_patch(original,patch,name):
 lines=original.decode().splitlines(keepends=True);diff=patch.decode().splitlines(keepends=True)
 header='host-reconciler/'+name
 if diff[:2]!=['--- '+header+'\n','+++ '+header+'\n']: raise ValueError('Unexpected patch target')
 out=[];cursor=0;pos=2
 while pos<len(diff):
  match=re.fullmatch(r'@@ -(\d+),(\d+) \+(\d+),(\d+) @@\n',diff[pos])
  if not match: raise ValueError('Malformed patch hunk')
  start,oldcount,newstart,newcount=map(int,match.groups());start-=1;pos+=1
  if start<cursor or start>len(lines): raise ValueError('Invalid patch offset')
  out.extend(lines[cursor:start]);cursor=start
  if len(out)!=newstart-1: raise ValueError('New hunk offset mismatch')
  oldseen=newseen=0
  while pos<len(diff) and not diff[pos].startswith('@@ '):
   line=diff[pos];pos+=1;kind=line[:1];text=line[1:]
   if kind not in (' ','+','-'): raise ValueError('Unsupported patch line')
   if kind in (' ','-'):
    if cursor>=len(lines) or lines[cursor]!=text: raise ValueError('Patch context mismatch')
    cursor+=1;oldseen+=1
   if kind in (' ','+'): out.append(text);newseen+=1
  if (oldseen,newseen)!=(oldcount,newcount): raise ValueError('Patch length mismatch')
 out.extend(lines[cursor:]);return ''.join(out).encode()

def reconstruct(canonical_root,proposal=ROOT):
 canonical_root=Path(canonical_root);proposal=Path(proposal);entries=manifest(proposal);result={}
 for i,name in enumerate(('host_reconciler.py','productctl.py')):
  original=(canonical_root/name).read_bytes()
  if sha(original)!=BEFORE[i]: raise ValueError('Canonical source drift: '+name)
  updated=apply_patch(original,(proposal/(name.removesuffix('.py')+'.patch')).read_bytes(),name)
  if sha(updated)!=entries[i]['after_sha256']: raise ValueError('Reconstructed payload hash mismatch: '+name)
  compile(updated.decode(),name,'exec');result[name]=(original,updated)
 return result

def fixture_modules():
 source=Path(os.environ.get('PUBLIC_DISCOVERY_CANONICAL_ROOT','/shared-auth/deployment/host-reconciler'))
 content=reconstruct(source);modules=[]
 for name,data in [('proposed_host',content['host_reconciler.py'][1]),('proposed_ctl',content['productctl.py'][1]),('canonical_host',content['host_reconciler.py'][0]),('canonical_ctl',content['productctl.py'][0])]:
  import types
  module=types.ModuleType(name);module.__file__=str(source/(name+'.py'));sys.modules[name]=module;exec(compile(data,module.__file__,'exec'),module.__dict__);modules.append(module)
 return tuple(modules)
