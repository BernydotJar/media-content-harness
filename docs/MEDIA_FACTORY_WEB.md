# Media Factory Web

The Web extension uses the existing Media Content Harness contracts and pinned Graph Harness runtime. `specs/media-factory-web/MASTER_PRODUCT_PROMPT.md` preserves the requested product scope. Acceptance and execution state are recorded in `graph/media-factory-web.*`, with actual evidence in `progress/media-factory-web/`.

## Local development

Requirements: Node matching package.json, pnpm 11.7.0, Python 3.11+, and the separate Graph Harness checkout at the revision in config/upstreams.json. Install using `pnpm install --frozen-lockfile`. Set `GRAPH_HARNESS_RUNTIME_ROOT` to the actual pinned checkout; do not disable pin validation or copy/modify the runtime source.

Configure durable private storage with `MEDIA_FACTORY_DATA_ROOT`. Configure identities through `MEDIA_FACTORY_IDENTITY_FILE`. Provision a local operator with:

```sh
python3 scripts/provision-operator.py --identity-file .media-factory/identities.json --id local-operator --email operator@example.org --name 'Local operator' --can-create-tenants
```

The operator types their password directly into the hidden terminal prompt. Never put it in shell arguments, repository files, browser storage, screenshots or chat. The resulting verifier file must stay private and outside tracked source. Tenant memberships are explicit; creating one tenant does not grant access to any other tenant.

`pnpm dev` serves the studio. For a production build use `pnpm build` then `pnpm start`. Runtime `/health` requires a real `MEDIA_FACTORY_RELEASE_SHA` and deployment class; a missing release identity produces unavailable rather than a false successful release report.

## One execution boundary

Guided and Free Mode both prepare draft story contracts. The server resolves membership, selected tenant sources and Content DNA. Approval is an explicit actor action. Jobs are submitted asynchronously and the browser observes product events over SSE. Raw Graph ledgers, filesystem paths and credentials are not browser protocols.

A preferred provider is a constraint handled by the server, separate from the generic AUTO, REAL_FOOTAGE, HYBRID and GENERATIVE strategy. An unconfigured provider is unavailable. Availability does not mean that every requested capability is supported or that generation is approved. Cost-bearing actions require the configured approval and cost estimate; no undocumented pricing is assumed.

Reference observations describe permitted abstractions. Reference media never automatically becomes production footage. Content DNA revision and production authorization snapshots participate in idempotency and review integrity. Tests use only isolated fixtures; fixtures are not production releases.

## Authentication deployment

The established host reconciler supports a form-session operator verifier without exposing the password. The deployment adapter maps its host-owned preview verifier and username into the server's neutral operator configuration. External Google/enterprise identity is an extension point; it is not claimed as implemented. The MVP deploys one service process with durable storage. Multi-process/distributed storage requires a repository implementation with a shared transactional lock before scaling.

## Verification and evidence

```sh
GRAPH_HARNESS_RUNTIME_ROOT=/path/to/pinned/graph-harness-sdlc pnpm check
pnpm typecheck
pnpm build
GRAPH_HARNESS_RUNTIME_ROOT=/path/to/pinned/graph-harness-sdlc pnpm test:e2e
pnpm audit --prod
GRAPH_HARNESS_RUNTIME_ROOT=/path/to/pinned/graph-harness-sdlc node scripts/verify-web-evidence.mjs
```

Browser tests start an isolated production Next server with temporary identities/storage and the system Chromium binary. Secrets never enter reports. `scripts/verify-web-evidence.mjs` independently checks the actual evidence file hashes and commit references in addition to the runtime's event-chain validation. Use `--require-done` only for a claim that every graph node is complete.

## Deployment and recovery

Reuse the existing productctl/host reconciler, Caddy edge and Cloudflare named tunnel. See `MEDIA_FACTORY_DEPLOYMENT_RECOVERY.md` for the live recovered mechanism. A release requires exact-SHA tests, independent critic review, the existing signed receipt, immutable release archive, host reconciliation and public HTTPS verification. A successful build alone is not a deployment.

Do not erase the durable job store to recover a failed provider. Preserve its request ID, source snapshot, graph ledger and evidence. Resume only the affected Graph subgraph after resolving the documented failure; never mark an unknown paid submission failed-and-retry without reconciling its actual provider state. Approvals and independent verification refer to the immutable candidate; modifying bytes requires a new verification and approval cycle.

This document describes the intended operating contract. Consult the latest persisted release report for verified coverage and remaining blockers; it is not itself evidence of completion.

## Host release packaging

`Dockerfile` packages the same existing Graph Harness implementation at the tested upstream revision as a runtime dependency; it adds no Graph daemon, new reverse proxy or tunnel. The application uses one nonroot Node process, a private named data volume and a read-only container root. The image compiles a verified Git archive directly with Next because an archive intentionally contains no Git metadata. Workspace builds and browser verification use `scripts/build-web.mjs` and an exact commit/source/BUILD_ID manifest. See [Next output tracing](https://nextjs.org/docs/app/api-reference/config/next-config-js/output) for the standalone packaging mechanism.

The deployment request must explicitly use `form_session_single_operator`, deployment class `controlled_single_operator_preview`, service `frontend`, edge alias `media-factory-frontend`, internal port3000 and the existing `cloud-sandbox-edge` network. Host-owned preview verifier environment values are mapped in `compose.host.yml`; do not enter passwords in repository files or deployment requests. The healthcheck verifies both exact deployment identity and actual service readiness before the existing host edge accepts traffic.

The host deployment requires two actual IBM Granite3.3:2b reviews of the exact candidate, then the unchanged canonical signed-receipt finalizer in `deploy/host_reconciler/critic_finalizer.py`. Private signing material remains external. No receipt or approval may be handwritten. An immutable Git archive, hashes and signed review go through the existing `productctl.py request-deploy` dispatcher; the host reconciler owns Docker, Caddy, DNS and tunnel changes.

Production media review needs distinct producer, critic and independent-verifier identities. The default host preview supplies one operator. The packaged provisioning CLI can create explicitly named identities in a private server-side identity file; an administrator must supply each password directly and configure `MEDIA_FACTORY_IDENTITY_FILE`. That file becomes the identity authority, so preserve any intended existing operator before switching. This is a configured access boundary, not automatic account enrollment. No reviewer accounts or customer media approvals were created by this software-completion session.

Backup the private `media-factory-data` volume together with its identity configuration using the host's established storage procedure. Preserve the entire state/graph/assets/evidence set. Rollback means request an earlier signed immutable software candidate through the same reconciler while retaining compatible durable data; do not delete the volume or manufacture new approvals to recover a release.

The final runtime is assembled by `scripts/prepare-runtime.mjs` from an explicit allowlist, excluding build traces, tests, progress, secrets and private data. It rejects dependency symlinks escaping the package. Docker and browser E2E use this same prepared tree; E2E boots its actual `server.js` from temporary isolated storage. Next tracing exclusions alone are not treated as proof of package contents.


### Shared-host operator access and rollback

The existing host reconciler creates or reuses a product-specific operator credential. After successful onboarding, the operator can inspect `/Users/eduardosacahui/.local/share/cloud-sandbox/secrets/media-factory.credentials.json` locally with administrative permissions and use its username/password at `/login`. Keep that file private and do not paste its values into chats or evidence. The application receives only the password verifier. No self-service password reset or automatic account rotation is claimed.

The host verifier exercises container restart and authenticated public session lifecycle. Its automatic rollback covers shared edge configuration (Caddy/cloudflared); software rollback requires requesting a prior immutable archive with its existing valid signed receipt. First onboarding has no previous Media Factory release, so a previous-version application rollback cannot be claimed as tested. Persistent media data is not reset by software deployment.

### Visual entry and discovery

See `MEDIA_FACTORY_DESIGN.md` for original artwork, Libraries.dev/Radix sources, motion and accessibility behavior; `MEDIA_FACTORY_SEO.md` for metadata, custom 404, canonical/public indexing policy, robots/sitemap/llms and the shared edge boundary. The login uses the same `api('/auth/login')` helper, which maps to `/api/preview/login`; signed-in product calls keep the versioned API and server membership checks.


## Crear con guía, personajes y lugares

El panel de cada espacio muestra el siguiente paso y trabajos reales: borrador, solicitud registrada, revisión humana o bloqueo. Guardar no inicia producción. La guía exige material seleccionado, Content DNA y una intención por historia; las flechas llevan al siguiente paso válido. Los enlaces a un plan guardado recuperan ese plan.

En **Personajes y lugares**, FIRMES resuelve el **Caballito FIRMES** desde el perfil de marca del tenant; ya no es necesario recrearlo como una ficha legacy para usarlo como personaje principal. El activo maestro, el personaje y el perfil de marca son objetos separados y el activo autorizado queda ligado por SHA. También puedes mantener otras mascotas ficticias y fichas de lugares para los flujos de planificación existentes. Los datos de lugares son información aportada con una fuente, no investigación automáticamente verificada.

**Escena guiada** es la ruta operacional para crear con personaje, entorno y acción. La solicitud estructurada compila de forma determinista un prompt con roles de referencia explícitos: `CHARACTER_IDENTITY_ONLY` conserva identidad; `ENVIRONMENT_ONLY` aporta únicamente el lugar; `STYLE_ONLY` se reserva para lenguaje visual. El entorno accidental de la referencia del personaje no es transferible. Si una referencia cambia de SHA, rol semántico, tenant o estado de autorización, el trabajo falla cerrado y exige recompilar. Un ajuste manual del prompt es de menor prioridad y no puede debilitar esos roles ni las exclusiones del contrato.

Cuando no existe un API adapter ejecutable, **Generación externa** (`manual-external`) es una ruta formal del mismo job, no un bloqueo ni una integración fingida. Media Factory prepara el prompt, referencias, hashes y checklist; el operador genera en una herramienta aprobada y devuelve el resultado al mismo trabajo. Cada intento conserva `retry_of`, request/prompt SHA, inputs y output SHA. Seedance y CapCut siguen como integraciones pendientes; Higgsfield ejecuta text-to-video sin referencias; **Gemini · Veo 3.1 Fast** dispone de un adapter server-side para video con referencia de personaje cuando la Gemini Developer API está configurada.

V20 separa dos operaciones que antes podían confundirse. **Crear video con personaje** envía los bytes exactos de la referencia autorizada como `CHARACTER_IDENTITY_ONLY` a Veo, exige ocho segundos y formato `9:16` o `16:9`, pasa por el gate de gasto antes de enviar, y conserva `generation_kind=REFERENCE_VIDEO`, prompt SHA y reference SHA en provenance. **Agregar como sticker** usa FFmpeg para superponer determinísticamente el arte autorizado sobre material real y se marca `generation_kind=STICKER_OVERLAY`; nunca se presenta como personaje generado. No existe fallback silencioso entre ambas rutas.

La ruta `manual-external` para video con personaje continúa siendo **image-first**: primero se importa una imagen hero, Critic la revisa, y solo su SHA aprobado puede convertirse en `APPROVED_HERO_IMAGE` para la fase image-to-video. En la ruta automática Gemini/Veo la referencia del personaje entra directamente en el request de video y el resultado vuelve al mismo Critic/Verifier/Release. Liberar no publica automáticamente en redes sociales.

### Mascot Avatar System v1

El Caballito FIRMES también dispone de un **avatar reutilizable** encima del mismo `BrandCharacter`. El catálogo tenant-scoped expone un `AvatarIdentityPack`, cinco looks iniciales (clásico, construcción, playa, formal y espacial), diez add-ons, ocho presets de movimiento generativo y cinco scene packs. La interfaz de **Crear una escena** presenta estas opciones como `Look`, `Accesorios`, `Movimiento` y `Escenas rápidas`; la persona no necesita editar prompts.

El `AvatarIdentityPack` es deliberadamente honesto: actualmente cuenta con la referencia maestra autorizada y marca el turnaround frontal/perfiles/espalda como **pendiente**, en vez de inventar vistas que no existen. V1 usa `GENERATIVE_MOTION`; no afirma tener todavía un rig esquelético 2.5D/3D. Un rig futuro puede adjuntarse al mismo contrato sin cambiar el identificador del personaje.

Cada selección compila un `avatar_contract` determinista y content-addressed. Ese contrato liga identity pack, outfit, add-ons, motion preset, scene pack y una política `ALWAYS_VISIBLE` que exige al menos un distintivo FIRMES. La compilación agrega secciones `AVATAR IDENTITY LOCK`, `AVATAR OUTFIT`, `AVATAR ADD-ONS`, `FIRMES BRAND MARKER POLICY` y `AVATAR MOTION PROFILE`. Accesorios incompatibles, IDs de otro tenant, mutaciones posteriores del catálogo o duraciones incompatibles fallan cerrado.

El Critic recibe además un `avatar-critic-plan.v1` con checks de identidad, drift prohibido, distintivo, outfit, add-ons, movimiento, escena y hash exacto. El paquete de generación externa y la provenance de release conservan `avatar_contract_sha256`. Para integración agéntica existe un contrato MCP-ready, transport-neutral, en `plugins/avatar-system-mcp.mjs` con `avatar.catalog`, `avatar.compile` y `avatar.critic_plan`; reutiliza la misma autoridad de producto y no se presenta como un proveedor externo ya conectado.

## Administración de APIs

El operador del despliegue compartido tiene **APIs e integraciones** en el menú. Con un archivo explícito de identidades, solo usuarios con `system_admin: true` acceden; ser dueño de un espacio no basta. El provisionador permite `--system-admin` para asignar ese permiso explícitamente.

Las claves se guardan cifradas con AES-256-GCM en el almacén privado y nunca se devuelven a la interfaz. Puedes reemplazarlas o retirarlas; el historial registra actor y fecha sin revelar secretos. Guarda copias de seguridad del almacén y de su clave separada, ambos bajo permisos privados: perder la clave impide recuperar las credenciales. El sistema falla sin regenerarla cuando existe ciphertext.

Guardar una API no autoriza consumo. El presupuesto mostrado por cada integración es una referencia administrativa; el gate de uso semanal y la aprobación de gasto siguen siendo controles separados y obligatorios antes de una solicitud pagada. FFmpeg funciona localmente con material real; Higgsfield y Gemini/Veo tienen adapters server-side con capacidades distintas; Seedance y CapCut continúan identificados según su disponibilidad real. Una clave Gemini se usa únicamente en el servidor para solicitudes aprobadas y nunca se devuelve al navegador. No hay registro público: el administrador provisiona usuarios. La URL y acceso existentes se conservan.

## FIRMES Brand Memory V2

Tenant-specific FIRMES surfaces use the derived rules in [`FIRMES_BRAND_MEMORY.md`](FIRMES_BRAND_MEMORY.md). The source manual remains private under `work/` and is not shipped in the runtime. Media Factory keeps its global product identity; FIRMES colors, condensed display hierarchy, derived hexagonal cue and restrained Gooey motion activate only inside a FIRMES tenant or a job belonging to that tenant. The UI cue is not a substitute for the official horse imagotype in published media.

Blocked `SOURCE_BYTES_REQUIRED` jobs now carry only the missing authorized source IDs. The job CTA deep-links to that exact material card; after upload, the browser verifies that the resume job belongs to the same tenant and references the uploaded source before restarting the same Graph. A malformed deep link cannot create an open redirect or requeue an unrelated job.
