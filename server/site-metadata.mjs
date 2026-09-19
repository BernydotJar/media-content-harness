const PRIVATE_ROBOTS={index:false,follow:false,noarchive:true}
function privateHost(value){
 const host=value.toLowerCase().replace(/^\[|\]$/g,'').replace(/\.$/,'')
 if(host==='localhost'||!host.includes('.')&&!host.includes(':')||/\.(localhost|local|internal|lan|home|invalid|test)$/.test(host))return true
 if(host.includes(':'))return !/^[23][0-9a-f]{3}:/.test(host)||/^2001:(db8|2|10|20):/i.test(host)
 if(/^\d+\.\d+\.\d+\.\d+$/.test(host)){const [a,b,c]=host.split('.').map(Number);return a===0||a===10||a===127||a>=224||a===100&&b>=64&&b<=127||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&(b===168||b===0||b===88&&c===99)||a===198&&(b===18||b===19||b===51&&c===100)||a===203&&b===0&&c===113}
 return false
}
export function publicOrigin(env=process.env){try{const url=new URL(env.MEDIA_FACTORY_PUBLIC_ORIGIN);if(!['https:','http:'].includes(url.protocol)||url.username||url.password||url.search||url.hash||url.pathname!=='/'||url.port==='9222')return null;if(privateHost(url.hostname)&&env.MEDIA_FACTORY_DEPLOYMENT_CLASS!=='test')return null;return url.origin}catch{return null}}
export function publicIndexing(env=process.env){return env.MEDIA_FACTORY_PUBLIC_INDEXING==='1'&&env.MEDIA_FACTORY_DEPLOYMENT_CLASS==='production'&&publicOrigin(env)?.startsWith('https:')===true}
const descriptions={dashboard:'Organiza tus planes, producciones y revisiones en tu estudio privado.',workspaces:'Gestiona los espacios de trabajo de tu organización.',onboarding:'Conoce cómo funcionan las marcas, el material, el estilo y la revisión antes de crear.',review:'Revisa cada producción antes de aprobar una entrega.',releases:'Consulta entregas aprobadas y su procedencia verificable.',login:'Tu material, tu identidad y tus ideas. Entra a Media Factory para dar forma a tus próximas historias.'}
const titles={dashboard:'Inicio',workspaces:'Espacios de trabajo',onboarding:'Guía rápida',review:'Revisión de producciones',releases:'Liberaciones',login:'Entrar al estudio'}
const views={start:['Resumen de marca','Consulta el estado real y el siguiente paso de este espacio de marca.'],'creative-profiles':['Personajes y lugares','Prepara personajes ficticios y contextos con referencias de tu espacio.'],sources:['Fuentes y referencias','Organiza el material autorizado y las referencias de tu espacio.'],'content-dna':['Content DNA','Define la identidad narrativa a partir de referencias autorizadas.'],scene:['Escena guiada','Crea una escena estructurada con personaje, entorno, acción y generación verificable.'],weekly:['Producción semanal','Convierte ideas en un plan semanal con aprobación humana.'],free:['Modo libre','Describe las historias que quieres crear y revisa su plan de producción.'],team:['Equipo','Gestiona las personas y responsabilidades de aprobación de esta marca.']}
const id=value=>typeof value==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/.test(value)
export function pageInfo(segments=[]){
 if(!segments.length)return {title:titles.dashboard,description:descriptions.dashboard,public:false}
 const [kind,key,view]=segments
 if(kind==='admin'&&key==='integrations'&&segments.length===2)return {title:'APIs e integraciones',description:'Administración privada de integraciones del estudio.',public:false}
 if(segments.length===1&&Object.hasOwn(titles,kind))return {title:titles[kind],description:descriptions[kind],public:kind==='login'}
 if(kind==='jobs'&&(segments.length===2||segments.length===3&&view==='review')&&id(key))return {title:view==='review'?'Revisión de producción':'Detalle de producción',description:'Consulta el avance, la revisión y la procedencia de tu producción.',public:false}
 if(kind==='workspace'&&id(key)&&(segments.length===2||segments.length===3&&Object.hasOwn(views,view))){const [title,description]=views[view||'weekly'];return {title,description,public:false}}
 return null
}
export function pageMetadata(segments=[],env=process.env,sourceImage='/opengraph-image'){
 if(sourceImage!=='/opengraph-image'&&!/^\/_next\/static\/media\/[a-zA-Z0-9._-]+\.png$/.test(sourceImage))throw new Error('Social image path must be a controlled application asset')
 const info=pageInfo(segments)||{title:'Página no encontrada',description:'La página solicitada no está disponible en Media Factory.',public:false}
 const origin=publicOrigin(env),canonical=info.public&&origin?origin+'/login':undefined,indexable=info.public&&publicIndexing(env)
 return {title:info.title,description:info.description,robots:indexable?{index:true,follow:true}:PRIVATE_ROBOTS,alternates:canonical?{canonical}:undefined,openGraph:{type:'website',locale:'es',siteName:'Media Factory',title:info.title+' · Media Factory',description:info.description,...(canonical?{url:canonical}:{}),...(origin?{images:[{url:origin+sourceImage,width:1200,height:630,alt:'Media Factory — Tu próximo estudio de historias'}]}:{})},twitter:{card:'summary_large_image',title:info.title+' · Media Factory',description:info.description,...(origin?{images:[origin+sourceImage]}:{})}}
}
export function robotsMetadata(env=process.env){const origin=publicOrigin(env);return {rules:{userAgent:'*',disallow:'/',...(publicIndexing(env)?{allow:'/login$'}:{})},...(origin?{sitemap:origin+'/sitemap.xml'}:{})}}
export function sitemapMetadata(env=process.env){return publicIndexing(env)?[{url:publicOrigin(env)+'/login'}]:[]}
export function llmsText(env=process.env){const login=(publicOrigin(env)||'')+'/login';return '# Media Factory\n\n> Un estudio de producción de contenido con fuentes autorizadas, identidad narrativa y revisión humana.\n\n## Acceso público\n\n- [Entrar al estudio]('+login+'): información general y acceso para cuentas gestionadas por la organización.\n\n## Producto\n\nGuided Mode y Free Mode convierten ideas en planes que requieren aprobación explícita. Los proveedores de producción son intercambiables y su disponibilidad depende de las integraciones configuradas. Cada entrega conserva su archivo, procedencia y revisión. Liberar una entrega no la publica en redes sociales.\n\n## Espacios privados\n\nLos espacios de trabajo, fuentes, referencias, planes, producciones, revisiones, entregas y APIs requieren autorización. No se incluyen datos de clientes ni enlaces a sus recursos en este documento.\n'}
