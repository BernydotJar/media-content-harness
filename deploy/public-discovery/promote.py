"""Host-only reviewed controller promotion. Default check is read-only; no sudo."""
import sys
sys.dont_write_bytecode=True
import argparse, contextlib, datetime, fcntl, json, os, platform, plistlib, pwd, stat, tempfile, uuid
from pathlib import Path
from materialize import ROOT, TARGETS, manifest, reconstruct, sha

def require(value,message):
 if not value: raise RuntimeError(message)

def open_directory(path):
 path=Path(path).absolute();fd=os.open('/',os.O_RDONLY|os.O_DIRECTORY)
 try:
  for part in path.parts[1:]:
   require(part not in ('.','..'),'Relative traversal is forbidden')
   child=os.open(part,os.O_RDONLY|os.O_DIRECTORY|os.O_NOFOLLOW,dir_fd=fd);os.close(fd);fd=child
  return fd
 except BaseException:
  os.close(fd);raise

def directory(path,uid):
 fd=open_directory(path)
 try:
  m=os.fstat(fd);require(m.st_uid==uid and not stat.S_IMODE(m.st_mode)&0o022,'Unexpected directory ownership/mode: '+str(path));return m
 finally:os.close(fd)

def mkdir_safe(path,mode):
 fd=open_directory(path.parent)
 try:os.mkdir(path.name,mode,dir_fd=fd);os.fsync(fd)
 finally:os.close(fd)

def read_regular(path,uid=None,*,parent_identity=None):
 parent=open_directory(Path(path).parent)
 if parent_identity is not None:
  meta=os.fstat(parent)
  if (meta.st_dev,meta.st_ino)!=parent_identity:os.close(parent);raise RuntimeError('Parent directory changed: '+str(path))
 try:fd=os.open(Path(path).name,os.O_RDONLY|os.O_NOFOLLOW,dir_fd=parent)
 finally:os.close(parent)
 try:
  meta=os.fstat(fd);require(stat.S_ISREG(meta.st_mode) and meta.st_nlink==1,'Unsafe file type/link count: '+str(path))
  if uid is not None: require(meta.st_uid==uid,'Unexpected file owner: '+str(path))
  with os.fdopen(os.dup(fd),'rb') as handle: data=handle.read()
  return data,{'uid':meta.st_uid,'gid':meta.st_gid,'mode':stat.S_IMODE(meta.st_mode),'dev':meta.st_dev,'ino':meta.st_ino}
 finally: os.close(fd)

@contextlib.contextmanager
def locks(root,uid):
 with contextlib.ExitStack() as stack:
  for name in ('host-reconciler.execution.lock','registry.lock'):
   parent=open_directory(root)
   try:fd=os.open(name,os.O_RDONLY|os.O_NOFOLLOW,dir_fd=parent)
   finally:os.close(parent)
   stack.callback(os.close,fd)
   meta=os.fstat(fd);require(stat.S_ISREG(meta.st_mode) and meta.st_nlink==1 and meta.st_uid in ({0,uid} if name.startswith('host-') else {uid}),'Unsafe existing lock')
   try: fcntl.flock(fd,fcntl.LOCK_EX|fcntl.LOCK_NB)
   except BlockingIOError as exc: raise RuntimeError('Busy existing lock; retry later: '+name) from exc
   stack.callback(fcntl.flock,fd,fcntl.LOCK_UN)
  yield

def sync_dir(path):
 fd=open_directory(path)
 try:os.fsync(fd)
 finally:os.close(fd)

def atomic_write(path,data,meta,*,parent_identity=None):
 parent=open_directory(path.parent)
 if parent_identity is not None:
  current=os.fstat(parent)
  if (current.st_dev,current.st_ino)!=parent_identity:os.close(parent);raise RuntimeError('Parent directory changed: '+str(path))
 name='.'+path.name+'.promotion-'+uuid.uuid4().hex
 try:
  fd=os.open(name,os.O_WRONLY|os.O_CREAT|os.O_EXCL|os.O_NOFOLLOW,0o600,dir_fd=parent)
  with os.fdopen(fd,'wb') as handle:
   handle.write(data);handle.flush();os.fchown(handle.fileno(),meta['uid'],meta['gid']);os.fchmod(handle.fileno(),meta['mode']);os.fsync(handle.fileno())
  os.replace(name,path.name,src_dir_fd=parent,dst_dir_fd=parent);os.fsync(parent)
 finally:
  try:os.unlink(name,dir_fd=parent)
  except FileNotFoundError:pass
  os.close(parent)

def package_digest(proposal):
 names=('manifest.json','host_reconciler.patch','productctl.patch','materialize.py','promote.py')
 return sha(json.dumps([(name,sha(read_regular(Path(proposal)/name)[0])) for name in names],separators=(',',':')).encode())

def journal_write(backup,journal,uid):
 atomic_write(backup/'journal.json',(json.dumps(journal,indent=2)+'\n').encode(),{'uid':uid,'gid':os.getegid(),'mode':0o600})

def snapshot(root,entries,uid,allowed='before_sha256'):
 directory(root,uid);directory(root/'host-reconciler',uid);result={}
 for entry in entries:
  data,meta=read_regular(root/entry['target'],uid)
  require(sha(data)==entry[allowed],'Source drift: '+entry['target'])
  require(meta['mode']==entry['mode'],'Unexpected mode: '+entry['target'])
  result[entry['target']]=(data,meta)
 require(result[TARGETS[1]][0]==result[TARGETS[2]][0],'Source and active dispatcher differ')
 return result

def check_no_incomplete(root,uid):
 base=root/'control-plane-backups'
 if not base.exists(): return
 directory(base,uid)
 for backup in base.iterdir():
  directory(backup,uid)
  data,_=read_regular(backup/'journal.json',uid);status=json.loads(data).get('status')
  require(status in ('APPLIED','ROLLED_BACK','AUTO_ROLLED_BACK'),'Incomplete promotion requires explicit rollback: '+str(backup))

def apply(root,proposal,uid,*,commit=False,after_replace=None,reviewed_digest=None):
 root=Path(root);entries=manifest(proposal)
 with locks(root,uid):
  require(reviewed_digest is not None and package_digest(proposal)==reviewed_digest,'Reviewed proposal digest mismatch')
  check_no_incomplete(root,uid);original=snapshot(root,entries,uid)
  parents={p:(m.st_dev,m.st_ino) for p in (root,root/'host-reconciler') for m in [directory(p,uid)]}
  payload=reconstruct(root/'host-reconciler',proposal)
  require(all(sha(payload[Path(e['target']).name][1])==e['after_sha256'] for e in entries),'Payload differs from captured manifest')
  require(package_digest(proposal)==reviewed_digest,'Proposal drift during preparation')
  result={'action':'CHECKED','host_uid':uid,'files':[{**e,'uid':original[e['target']][1]['uid'],'gid':original[e['target']][1]['gid']} for e in entries]}
  if not commit: return result
  base=root/'control-plane-backups'
  if not base.exists(): mkdir_safe(base,0o700);sync_dir(root)
  directory(base,uid)
  backup=base/('media-discovery-'+datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')+'-'+uuid.uuid4().hex)
  mkdir_safe(backup,0o700);mkdir_safe(backup/'host-reconciler',0o700)
  records=[]
  for entry in entries:
   target=entry['target'];data,meta=original[target]
   atomic_write(backup/target,data,{**meta,'mode':0o600})
   records.append({**entry,'metadata':meta})
  journal={'format':'media-discovery-promotion-journal.v1','root':str(root),'uid':uid,'status':'PREPARED','entries':records}
  journal_write(backup,journal,uid);sync_dir(base)
  try:
   # Host first, active dispatcher last: an incomplete install cannot newly opt in.
   for index,entry in enumerate(entries):
    target=entry['target'];current,meta=read_regular(root/target,uid,parent_identity=parents[(root/target).parent])
    require(current==original[target][0] and meta==original[target][1],'Concurrent source drift: '+target)
    name=Path(target).name;atomic_write(root/target,payload[name][1],original[target][1],parent_identity=parents[(root/target).parent])
    journal['status']='APPLYING';journal['last_replaced']=target;journal_write(backup,journal,uid)
    if after_replace: after_replace(index)
   snapshot(root,entries,uid,'after_sha256')
   journal['status']='APPLIED';journal_write(backup,journal,uid)
  except Exception:
   try:
    for entry in reversed(entries):
     target=entry['target'];data,meta=read_regular(root/target,uid,parent_identity=parents[(root/target).parent])
     require(sha(data) in (entry['before_sha256'],entry['after_sha256']),'Unexpected drift during automatic rollback: '+target)
     atomic_write(root/target,original[target][0],original[target][1],parent_identity=parents[(root/target).parent])
    journal['status']='AUTO_ROLLED_BACK';journal_write(backup,journal,uid)
   except Exception:
    journal['status']='RECOVERY_REQUIRED';journal_write(backup,journal,uid)
   raise
  return {**result,'action':'APPLIED','backup':str(backup),'next_step':'Wait for next existing daemon tick; no daemon restart performed'}

def rollback(root,proposal,uid,backup,*,reviewed_digest=None):
 root=Path(root);backup=Path(backup);entries=manifest(proposal)
 require(backup.parent==root/'control-plane-backups','Rollback must name an existing local controller backup')
 with locks(root,uid):
  require(reviewed_digest is not None and package_digest(proposal)==reviewed_digest,'Reviewed proposal digest mismatch')
  directory(root,uid);directory(root/'host-reconciler',uid);directory(backup.parent,uid);directory(backup,uid);directory(backup/'host-reconciler',uid)
  parents={p:(m.st_dev,m.st_ino) for p in (root,root/'host-reconciler') for m in [directory(p,uid)]}
  raw,_=read_regular(backup/'journal.json',uid);journal=json.loads(raw)
  require(journal.get('format')=='media-discovery-promotion-journal.v1' and journal.get('root')==str(root) and journal.get('uid')==uid,'Unexpected rollback journal')
  require(journal.get('status') in ('PREPARED','APPLYING','APPLIED','RECOVERY_REQUIRED','ROLLING_BACK'),'Journal does not require rollback')
  records=journal.get('entries',[]);require(len(records)==3,'Invalid journal entries');original={}
  for entry,record in zip(entries,records):
   require(all(record.get(k)==v for k,v in entry.items()),'Journal differs from reviewed manifest')
   data,_=read_regular(backup/entry['target'],uid);meta=record['metadata']
   require(sha(data)==entry['before_sha256'] and meta['uid']==uid and meta['mode']==entry['mode'],'Backup integrity/ownership mismatch')
   current,current_meta=read_regular(root/entry['target'],uid,parent_identity=parents[(root/entry['target']).parent])
   require(sha(current) in (entry['before_sha256'],entry['after_sha256']) and current_meta['gid']==meta['gid'] and current_meta['mode']==meta['mode'],'Current source drift prevents rollback')
   original[entry['target']]=(data,meta)
  # Do not silently remove capability already referenced by desired state.
  registry,_=read_regular(root/'registry.json');products=json.loads(registry).get('products',{})
  require(not any(p.get('public_get_paths') for p in products.values() if isinstance(p,dict)),'Registry still requests public discovery; reconcile a closing request before rollback')
  journal['status']='ROLLING_BACK';journal_write(backup,journal,uid)
  for entry in reversed(entries): atomic_write(root/entry['target'],*original[entry['target']],parent_identity=parents[(root/entry['target']).parent])
  snapshot(root,entries,uid);journal['status']='ROLLED_BACK';journal_write(backup,journal,uid)
  return {'action':'ROLLED_BACK','backup':str(backup),'host_uid':uid}

def host_context(args):
 require(platform.system()=='Darwin','Promotion CLI must run on the Mac host, never the Linux bind mount')
 uid=args.expected_uid;require(uid>0 and os.geteuid()==uid,'Run as the explicitly verified host file owner; no automatic sudo')
 user_home=Path(pwd.getpwuid(uid).pw_dir);root=Path(args.deployment_root).absolute()
 require(root==user_home/'.cloud-sandbox-mcp-data/shared-auth/deployment' and root.resolve()==root,'Deployment root does not match actual host user')
 plist=Path('/Library/LaunchDaemons/com.cloud-sandbox.host-deployment-reconciler.plist');data=plistlib.loads(plist.read_bytes());argv=data.get('ProgramArguments',[])
 require(data.get('Label')=='com.cloud-sandbox.host-deployment-reconciler' and len(argv)==4 and argv[1:]==[str(root/'host-reconciler/host_reconciler.py'),'--user-home',str(user_home)] and data.get('StartInterval')==60 and str(root/'registry.json') in data.get('WatchPaths',[]),'Installed daemon contract differs; inspect before promotion')
 return root

def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--deployment-root',required=True);parser.add_argument('--proposal-dir',type=Path,default=ROOT);parser.add_argument('--expected-uid',type=int,required=True);parser.add_argument('--reviewed-proposal-sha256',required=True)
 group=parser.add_mutually_exclusive_group();group.add_argument('--apply',action='store_true');group.add_argument('--rollback',type=Path)
 args=parser.parse_args();root=host_context(args)
 result=rollback(root,args.proposal_dir,args.expected_uid,args.rollback.absolute(),reviewed_digest=args.reviewed_proposal_sha256) if args.rollback else apply(root,args.proposal_dir,args.expected_uid,commit=args.apply,reviewed_digest=args.reviewed_proposal_sha256)
 print(json.dumps(result,indent=2))
if __name__=='__main__': main()
