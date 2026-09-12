# WEB005 — independent public discovery controller Critic

Verdict: **PASS for the exact proposed source and patches below**, with no blocking source finding. This is an independent source/adversarial-test review, not promotion authorization, model review, Caddy execution or public deployment evidence. Canonical controllers were only read and remained unchanged.

Reviewer: graph_engineer_recovery, independent of proposal author deployment_recovery. Review time: 2026-09-12T20:25:55Z. Proposal: `/tmp/media-public-discovery-proposal`. Canonical sources: `/shared-auth/deployment/host-reconciler/{host_reconciler.py,productctl.py}` and active `/shared-auth/deployment/productctl.py`.

## Security and compatibility result

The host and dispatcher independently admit a list containing only the five exact discovery paths `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/llm.txt`, `/opengraph-image`. Nonempty opt-in requires the exact product key `media-factory` and exact policy `form_session_single_operator`; unrecognized product/policy values cannot enable discovery. Missing opt-in is empty. Null, scalar, boolean, tuple, nested/nonstring, duplicate, wildcard, private/API, encoded/traversal, whitespace and malformed route data fail closed. Deterministic allowlist order holds for all 326 subsets/permutations.

Rendered form-session output differs from canonical output only by appending those exact paths to the existing entry matcher, which already requires GET or HEAD. POST discovery and other methods retain the catch-all session gate. The original login/logout POST exceptions, 2KB body limit, health Basic Auth, blocked session endpoint, upstream and forward-auth are byte-identical. Configured blocked-path collisions still win because the blocked handle precedes health and entry handles inside the unchanged Caddy route. Managed-block insertion/prelude machinery is outside the patch and unchanged; no new global route or API override is introduced.

Without opt-in, renderer output remains byte-identical for both access policies and other products, including variants of blocked paths. A default parsed dispatcher request was compared against the old dispatcher with isolated in-memory registry fixtures and fixed time/request ID: the saved state is identical except for the added empty `public_get_paths` field. Invalid public inputs do not mutate or save that registry. Omitting the option on a later request clears prior public paths, matching the explicitly documented desired-state contract. CLI parser construction supplies both new public_get_path and access_policy fields.

## Executed verification

- `python3 -m unittest -v test_public_discovery.py` in the proposal directory: **6/6 PASS**, independently rerun.
- `python3 /tmp/media-public-discovery-independent.py`: **8/8 PASS**, including 326 valid permutations and adversarial types/paths, wrong product/policy, blocked precedence, exact legacy default request, no-save on invalid input, explicit opt-in removal, and exact patch integrity.
- Both unified patches applied to temporary copies using `patch --batch --fuzz=0 -p0`; no offsets, byte-identical result to the reviewed proposed files. No patch was applied to a canonical file.
- All three original canonical SHA256 values checked before and after temporary patch verification and match the recorded originals.

Independent probes and TAP-equivalent unittest output are persisted beside this report as `WEB005-discovery-controller-adversarial.py` and `.log`. The probe imports the retained proposal fixture and compares the installed canonical originals; it is intentionally an artifact for this pre-promotion state, not an enduring test that should expect old hashes after promotion.

## Promotion boundary

`build-proposal.py` is a drafting generator: it does **not** enforce the original SHA values and must not be treated as a guarded installer. The reviewed proposal contains no installer and this review does not claim one exists. Promotion must compare all three original hashes under the existing exclusive execution lock, retain reversible backups, atomically install these exact reviewed bytes, and recheck installed hashes. Drift requires stopping and reviewing the new base, not regenerating and silently adopting changed controllers. Model review remains a separate pending gate. No permission conclusion is inferred from container uid mapping.

Caddy was not available as a local CLI in this workspace, so this review does not claim a Caddy adaptation or live HTTP test. After guarded promotion and normal reconciler publication, the required independent gate is actual five-path GET/HEAD status and MIME/contents, private GET/POST denial, blocked session path, authenticated health/session behavior, and unchanged unrelated product routing. Only that gate can establish public discovery delivery.

## Exact artifact hashes (SHA256)

| Artifact | SHA256 |
| --- | --- |
| Canonical original host_reconciler.py | `074cfea8afb469c112c87724e892862ffd8dfb2e52863d160349eb8509ee69bd` |
| Canonical original source and active productctl.py | `f282304749348053bec91fc9607dd1b06f844cb0c9c1c2fc05e475ab5cb8ab69` |
| Proposed host_reconciler.py | `aa40a01781d11f1857382b37037e6806bda6c5dd1235253ad9bafc45868716eb` |
| Proposed productctl.py | `46ba8e16972806a6668cf37a39e91c48ddbae046379bfca041e52d0a43dde5b4` |
| host_reconciler.patch | `e329a40f74cc28fd9274f9f27b2b270a1660c40b0b89e0f1ad1976492e2fd899` |
| productctl.patch | `842a405ffcbe84dc8cb444dcc11bc54802d111fdcc646e831404e7c11be8fe28` |
| Proposal test_public_discovery.py | `aabe26e9c4ec48dad7c4da4378c8f7f11baf5428bd0fd4583c80b3b1bcd24c3c` |
| Draft-only build-proposal.py | `1dfa218f621ec432eecea5fdea7291123408e9933bb49c72ffa8eea979d60891` |
| Independent adversarial test | `d947df4e1f04e7c6d395d239d1820b9c0a67fd7418eb426a8600e705efd5c981` |
| Independent test log | `7510bc566cddc6fe7b3eb045dc8aa736d12175fbb3451540b2138607b9b810b0` |

## Portable evidence follow-up

The same eight independent adversarial tests are now also preserved at `deploy/public-discovery/test_adversarial.py`, with **8/8 PASS** after adaptation. They reconstruct the exact reviewed source from patches plus verified originals via `materialize.fixture_modules()`. `PUBLIC_DISCOVERY_CANONICAL_ROOT` may point to the retained pre-promotion backup directory after installation. No complete shared controller is required in the repository. The independent differential assertion still applies patches with GNU patch at zero fuzz and no offset and compares that output against `materialize.reconstruct`, so the reconstruction implementation is not its own sole oracle. `WEB005-discovery-controller-portable.log` preserves this rerun. The historical first eight-test artifact beside this report remains unmodified.
