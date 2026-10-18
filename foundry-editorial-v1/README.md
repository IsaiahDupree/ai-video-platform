# Editorial explainer composition

Canonical Foundry source for landscape, evidence-led video reports. The AI-demand
example retains its approved 410-word narration and adds 13 editorial scenes,
five original contextual illustrations, source labels, explanatory cards and a
separate sentence-safe caption rail. Images are illustrative, not product proof.

## Execution

Rendering runs only through Orion's authenticated `video.remotion_render` job,
registered project `foundry-editorial-v1`, composition `EditorialExplainer`.
The dedicated deployed source is under
`E:\orion-jobs\workspaces\Remotion\foundry-editorial-v1`; it resolves the already
installed, pinned Remotion 4.0.434 dependency runtime from its parent. Canonical
source authority stays in this directory. Deployment does not start a Mac
renderer or alter another composition. Resource admission remains enforced.

Stage a public directory containing `audio/narration.mp3` and the five image
paths named by the real example props. Keep generated assets, approved script
receipts, source research, exact visual-copy audit and provider outputs outside
Git in the job's media workspace. `auditFrames` renders a diagnostic sequence
of selected actual timeline frames through the same layout and guard; omit it
for the final narration-synchronized render.

## Verification

Run lightweight tests with `node --test tests/*.test.ts`. See
[LAYOUT-QC.md](LAYOUT-QC.md) for the actual Chromium measurement contract.

Before accepting a new deployment, render `LayoutGuardProbe` with
`kind: clean`, `overlap`, and `overflow` through the same typed Orion worker.
The clean control must render; the negative controls must fail for the specific
expected findings. A compile error or resource rejection is not a passing
negative control.

The final render must retain a passing `EDITORIAL_LAYOUT_QC` record for each
captured frame. Reconcile its log with `reconcileLayoutLog`; then independently
decode/check the downloaded MP4 with Orion's `video.ffmpeg_qc`, verify its hash,
and inspect representative extracted frames. Source/asset/props hashes bind the
video to its receipts. These checks establish annotated layout correctness and
media integrity, not aesthetic perfection, audience retention or virality.

The approved narration is unchanged in this example. New spoken claims require
a new ScriptHub approval and exact copy/provenance lineage. New display wording
also requires an exact visual-plan audit. Publication remains an Airtime action;
this project does not upload, spend Connects or contact clients.
