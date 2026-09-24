# Creation Surface V19 — visual reference decisions

This note records how the current external references are translated into product rules. It is not a license to copy their artwork or runtime behavior.

## Suno — focused creation hierarchy

Observed direction from the supplied reference image:

- one large, centered creation question;
- the composer is the principal interactive object;
- secondary controls are compact and close to the composer;
- media can create atmosphere at the perimeter without competing with the task;
- navigation is deliberately sparse.

V19 applies the hierarchy, not the visual identity: centered prompt, reduced chrome, compact weekly allowance, and secondary character/place navigation below the composer.

## samyost1/3dicon — asset-production candidate

Repository: https://github.com/samyost1/3dicon

Useful pattern: generate a still icon, animate it into a seamless loop, remove the background, and export an animated transparent WebP.

Decision for V19:

- do not install or call the generator from product runtime;
- do not introduce generation-provider keys into the web app;
- keep the existing deterministic SVG icon contract as the fallback;
- if we adopt generated icons, treat them as reviewed, versioned UI assets with fixed hashes and a static fallback.

Proposed future asset convention:

`assets/ui-icons/3d/<version>/<semantic-name>.webp`

with a matching static fallback:

`assets/ui-icons/3d/<version>/<semantic-name>.png`

The semantic name must map to the existing icon vocabulary rather than introducing meaning through animation alone.

## Crux Garden Plasma UI — container material, not V19 runtime

Reference: https://cruxgarden.github.io/plasma-ui/

The material direction is useful for large surfaces: refractive/frosted containers, luminous rims, and spring-like depth. V19 deliberately implements the visual cues with the existing CSS layer instead of adding WebGL to the production path.

Reasons:

- Create needs a stable composer, not draggable/fusing panels;
- menus, fixed chrome, and scroll-clipped surfaces have different constraints from the library's strongest use cases;
- the current product already has reduced-motion and responsive CSS behavior that can be kept deterministic;
- the package can be revisited as a bounded experiment on a non-critical container after visual QA.

## Inspora — dimensional video cards

Reference: https://www.inspora.design/posts/3d-gradient-cards

The existing `.media-poster-card`, `.media-gradient-art`, `.dashboard-media-shelf`, and `.creation-video-card` already implement the relevant product pattern:

- real media first when available;
- gradient art only as a truthful placeholder;
- dimensional light, perspective, and depth around the artifact;
- reduced-motion fallback.

V19 keeps these primitives and avoids adding a second 3D-card system.

## Guardrails

- visual polish must not hide production state, approvals, or weekly usage rules;
- motion must never be the only carrier of meaning;
- no design reference may alter authorization, tenant isolation, content policy, or provider-spend gates;
- browser QA captures only bounded product evidence from the authorized workspace surface.
