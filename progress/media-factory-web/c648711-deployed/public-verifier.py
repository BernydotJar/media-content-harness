#!/usr/bin/env python3
"""Credential-free public verification. Run only after the authorized host publishes."""
import hashlib,json,re,struct,subprocess,sys,time,urllib.request,urllib.error,urllib.parse
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
ORIGIN='https://media-factory.textilesdemedellin.com'
OUTPUT=Path('/tmp/media-final-public-verification.json')
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,req,fp,code,msg,headers,newurl): return None
class Document(HTMLParser):
    def __init__(self): super().__init__(convert_charrefs=True);self.title=[];self.in_title=False;self.metas={};self.canonicals=[]
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag=='title':self.in_title=True
        if tag=='meta':
            key=attrs.get('name') or attrs.get('property')
            if key:self.metas.setdefault(key,[]).append(attrs.get('content',''))
        if tag=='link' and attrs.get('rel')=='canonical':self.canonicals.append(attrs.get('href',''))
    def handle_endtag(self,tag):
        if tag=='title':self.in_title=False
    def handle_data(self,data):
        if self.in_title:self.title.append(data)
def sha(data):return hashlib.sha256(data).hexdigest()
def require(condition,message):
    if not condition:raise AssertionError(message)
def run(candidate):
    require(bool(re.fullmatch(r'[a-f0-9]{40}',candidate or '')),'Provide the reviewed candidate SHA')
    baseline=json.loads(Path('/tmp/media-final-delta-verification.json').read_text())
    package=json.loads(Path('/tmp/media-final-independent-packaging-audit.json').read_text())
    require(baseline.get('candidate_sha')==candidate and baseline.get('status')=='PASS' and baseline.get('full_e2e_repeated') is False,'Exact candidate delta evidence is required')
    require(package.get('candidate_sha')==candidate and package.get('result')=='PASS','Exact candidate packaging evidence is required')
    expected=subprocess.check_output(['git','show',candidate+':assets/media-factory-og.png'],cwd='/workspace')
    opener=urllib.request.build_opener(NoRedirect())
    checks=[];requests=[];stage='initialization'
    def request(path,method='GET',accept='*/*'):
        nonlocal stage
        stage=method+' '+path
        url=urllib.parse.urljoin(ORIGIN,path)
        require(urllib.parse.urlsplit(url).netloc==urllib.parse.urlsplit(ORIGIN).netloc and url.startswith(ORIGIN+'/'),'Probe destination must stay on the declared HTTPS origin')
        headers={'Accept':accept,'User-Agent':'MediaFactoryIndependentVerifier/1.0','Cache-Control':'no-cache'}
        if method=='POST':headers.update({'Origin':ORIGIN,'Content-Type':'application/json'})
        req=urllib.request.Request(url,method=method,headers=headers,data=b'{}' if method=='POST' else None)
        try:r=opener.open(req,timeout=30)
        except urllib.error.HTTPError as error:r=error
        with r:
            body=r.read(3*1024*1024+1)
            require(len(body)<=3*1024*1024,'Public response exceeds the verification bound')
            info={'method':method,'path':path,'status':r.status,'content_type':r.headers.get('Content-Type',''),'x_robots_tag':r.headers.get('X-Robots-Tag'),'location':r.headers.get('Location'),'body_sha256':sha(body),'body_bytes':len(body)}
            requests.append(info)
            return info,body
    def denied(info,body,label):
        require(info['status'] in [401,403,404,302,303,307,308],label+' was not denied at the edge')
        if info['status'] in [302,303,307,308]:
            target=urllib.parse.urlsplit(urllib.parse.urljoin(ORIGIN,info['location'] or ''))
            require(target.scheme=='https' and target.netloc==urllib.parse.urlsplit(ORIGIN).netloc and target.path=='/login',label+' redirects outside the sign-in surface')
        require(not re.search(rb'"(?:tenants|jobs|releases|sources|source_assets|provider_execution|sessions)"\s*:',body),label+' response exposed a private data structure')
    started=time.time()
    try:
        info,body=request('/login',accept='text/html');require(info['status']==200,'Anonymous login must return200');require('text/html' in info['content_type'],'Login MIME must be HTML')
        doc=Document();doc.feed(body.decode('utf8'))
        require(''.join(doc.title).strip()=='Entrar al estudio · Media Factory','Login page title differs from reviewed metadata')
        require(any('Tu material, tu identidad' in value for value in doc.metas.get('description',[])),'Login description is missing')
        require(doc.canonicals==[ORIGIN+'/login'],'Login canonical differs from the configured public origin')
        require(any('noindex' in value.lower() for value in doc.metas.get('robots',[])),'Controlled preview login must be noindex')
        images=doc.metas.get('og:image',[]);require(len(images)==1,'Expected exactly one public Open Graph image')
        image=urllib.parse.urlsplit(images[0]);require(image.scheme=='https' and image.netloc==urllib.parse.urlsplit(ORIGIN).netloc and re.fullmatch(r'/_next/static/media/[A-Za-z0-9._-]+\.png',image.path) and not image.query and not image.fragment,'OG image must use the existing public static-asset path')
        require(doc.metas.get('twitter:image')==images,'Twitter and OG must share the reviewed static image')
        info,png=request(image.path);require(info['status']==200 and 'image/png' in info['content_type'],'Static OG must be public PNG')
        require(png[:8]==bytes.fromhex('89504e470d0a1a0a') and struct.unpack('>II',png[16:24])==(1200,630),'OG image must be the1200×630 PNG')
        require(sha(png)==sha(expected),'Public OG bytes differ from candidate asset')
        checks.append('anonymous login metadata and publicly served OG match the candidate asset')
        documents={}
        for path in ['/robots.txt','/sitemap.xml','/llms.txt','/llm.txt']:
            info,text=request(path);require(info['status']==200,path+' GET must be public')
            mime=info['content_type'].split(';')[0].strip()
            require(mime in (['application/xml','text/xml'] if path=='/sitemap.xml' else ['text/plain']),path+' MIME differs from its document type')
            if path in ['/llms.txt','/llm.txt']:require('noindex' in (info['x_robots_tag'] or '').lower(),path+' must advertise noindex')
            documents[path]=text.decode('utf8')
            head,empty=request(path,'HEAD');require(head['status']==200 and not empty,path+' HEAD must be public with no response body');require(head['content_type'].split(';')[0].strip()==mime,path+' HEAD MIME must match GET')
            if path in ['/llms.txt','/llm.txt']:require('noindex' in (head['x_robots_tag'] or '').lower(),path+' HEAD must retain noindex')
        require(re.search(r'^User-[Aa]gent:\s*\*\s*$',documents['/robots.txt'],re.M) is not None,'Robots must cover all user agents')
        require(re.search(r'^Disallow:\s*/\s*$',documents['/robots.txt'],re.M) is not None,'Controlled preview must disallow crawling')
        require('Sitemap: '+ORIGIN+'/sitemap.xml' in documents['/robots.txt'],'Robots sitemap URL differs from the configured origin')
        sitemap=ET.fromstring(documents['/sitemap.xml']);require(sitemap.tag.endswith('urlset') and not list(sitemap.iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')),'Preview sitemap must not expose URLs')
        require(documents['/llms.txt']==documents['/llm.txt'],'llm alias must match llms document')
        require(documents['/llms.txt'].startswith('# Media Factory\n') and 'requieren autorización' in documents['/llms.txt'],'LLM document must identify public product and private access boundary')
        require(re.findall(r'\]\(([^)]+)\)',documents['/llms.txt'])==[ORIGIN+'/login'],'LLM discovery must link only to public login')
        require(not re.search(r'/(?:workspace|workspaces|jobs|review|releases|api)/|tenant_id|source_asset_snapshot|password|token=',documents['/llms.txt']),'LLM discovery exposed a private resource or credential-shaped value')
        checks.append('GET and HEAD discovery documents preserve MIME and preview noindex with an empty private-free sitemap')
        for path in ['/dashboard','/workspaces','/workspace/public-probe/weekly','/jobs/public-probe','/jobs/public-probe/review','/review','/releases','/api/v1/tenants','/api/v1/jobs','/api/v1/releases']:
            info,body=request(path,accept='application/json' if path.startswith('/api/') else 'text/html');denied(info,body,path)
        checks.append('anonymous private pages and APIs are denied or return only same-origin login redirects')
        for path in documents:
            info,body=request(path,'POST',accept='application/json');denied(info,body,'POST '+path)
        checks.append('discovery POST requests do not inherit the public GET/HEAD bypass')
        info,body=request('/api/preview/session',accept='application/json');require(info['status']==404,'Internal preview session route must return404 publicly');denied(info,body,'Internal preview session')
        info,body=request('/health',accept='application/json');require(info['status']==401,'Anonymous health must return401');denied(info,body,'Health')
        checks.append('public session endpoint stays404 and health requires authentication')
        result={'result':'PASS','candidate_sha':candidate,'origin':ORIGIN,'credentials_used':False,'elapsed_seconds':round(time.time()-started,2),'checks':checks,'opengraph_sha256':sha(expected),'requests':requests}
    except Exception as error:
        result={'result':'FAIL','candidate_sha':candidate,'origin':ORIGIN,'credentials_used':False,'stage':stage,'error_class':type(error).__name__,'reason':str(error),'checks_completed':checks,'requests':requests}
    OUTPUT.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2));return 0 if result['result']=='PASS' else 1
if __name__=='__main__':
    if len(sys.argv)!=2:raise SystemExit('Usage: python3 /tmp/media-factory-public-verifier.py <reviewed-candidate-sha>; run only after host publication')
    raise SystemExit(run(sys.argv[1]))
