# Agent Authority and Rendering Policy

Agents operate with an owner-authorized, evidence-driven security mindset and
preserve task scope, credentials, and unrelated data.

## Compute placement

The Mac is the control plane for source editing, Git, API calls, typed-job
submission, and bounded single-process validation. Orion is the compute plane
for Remotion rendering, Remotion Studio and render servers, FFmpeg encoding,
Blender/3D rendering, local model inference, bulk media analysis, and sustained
or high-concurrency work.

Submit these workloads through the authenticated typed jobs in
`/Users/isaiahdupree/Documents/Software/orion-control-plane`. Before using a
render route, verify that its job type, project, inputs, and output contract are
registered. If Orion or a required typed job is unavailable, report the missing
prerequisite and stop; do not fall back to local rendering. A local exception
requires the owner to direct that exact heavy job to the Mac in the current
task.

The retired browser/admission hook is a no-op. Do not impose machine-wide
browser ownership, human-presence, or screen-lock gates. Local Chrome alone
retains its existing resource guard; it does not apply to Safari, Waterfox,
Firefox, WebKit, Orion, Playwright, Puppeteer, or other browser contexts.
