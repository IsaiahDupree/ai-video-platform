# Editorial layout verification

`LayoutGuard` runs inside Chromium on Orion before Remotion captures each frame.
It waits for web fonts and decoded images, then measures actual element bounds,
text-node line rectangles, scroll overflow and the smallest descendant font.
Any failed check calls `cancelRender`; it cannot silently produce a passing video.

```tsx
const canvasRef = useRef<HTMLDivElement>(null);
return <AbsoluteFill ref={canvasRef}>
  <div data-layout-box="scene-title" data-layout-zone="content"
       data-layout-text="true" data-layout-min-font="40">...</div>
  <LayoutGuard rootRef={canvasRef} frame={frame} />
</AbsoluteFill>;
```

Annotate every semantic block with a unique `data-layout-box` and an explicit
zone. Mark text-only containers with `data-layout-text="true"`. The default
minimum font is 28 composition pixels; use a stricter value for primary copy.
Unannotated illustrations, decorative borders and background layers are excluded
from collision checks. Annotated parents may intentionally contain annotated
children, but children must fit the parent, and siblings may never overlap.
CSS groups, matching zone names and z-index do not waive collisions.

The 1920 × 1080 design reserves x = 72 through 1848. Zones are:

| Zone | Top | Bottom |
| --- | ---: | ---: |
| Header | 72 | 145 |
| Content | 188 | 836 |
| Caption | 882 | 984 |
| Footer | 1012 | 1046 |

Animate illustrations inside their unannotated crop and fade semantic blocks
without moving them outside their zones. Concurrent unrelated text layers still
collide during a transition. Fully transparent elements are excluded; a frame
with no visible semantic annotation fails instead of passing an empty audit.

`geometry.ts` also validates scene and caption timing. Scene intervals must cover
every frame exactly once. Caption intervals may leave silence but cannot overlap
or extend outside the composition. Ends are exclusive integer frame numbers.

Run lightweight pure edge-case tests on the Mac:

```sh
node --test platform/foundry/remotion-editorial/tests/*.test.ts
```

Each captured frame emits an `EDITORIAL_LAYOUT_QC` JSON line with the frame,
result and element count. The installed Remotion CLI prints browser logs only
at verbose level; set `Config.setLevel('verbose')` in this project's config.
`reconcileLayoutLog` in `src/auditLog.ts` checks the full requested inclusive
frame range. Missing, malformed, empty-element or failing records cannot pass.
Duplicate renders and initialization frames outside a preview slice are reported
separately and do not conceal a missing frame.
Preserve the render source hash, props hash, worker
receipt and complete logs so coverage can be reconciled with the requested frame
range. A passing full render with this guard establishes bounds for the annotated
DOM elements at the captured resolution. Sampled-image review must still inspect
unannotated artwork, visual balance, factual meaning, and continuity. These checks
do not claim aesthetic taste, all-device readability, or audience performance.

Render and image extraction use the existing typed Orion worker routes. Never
start a Remotion renderer or Studio on the Mac.

`LayoutGuardProbe` is an isolated one-frame diagnostic composition. Run
`kind="clean"` as a positive control, then `kind="overlap"` and
`kind="overflow"` as negative controls through the same typed worker. Only the
clean control should succeed. This tests the actual browser guard and its
failure propagation; it is not a production video or a mocked provider.

The shared `palette.ts` supplies the production colors. Its tests require at
least 4.5:1 WCAG contrast for the five solid, full-opacity text/background pairs.
They do not claim contrast for text over imagery or for intentionally dimmed
preview states. Any such use still requires rendered-frame review.
