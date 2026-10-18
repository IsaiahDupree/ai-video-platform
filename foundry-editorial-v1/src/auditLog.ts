/** Reconcile actual Chromium guard messages against the requested frame range. */
export function reconcileLayoutLog(text: string, startFrame: number, endFrame: number) {
  if (!Number.isInteger(startFrame) || !Number.isInteger(endFrame) || startFrame < 0 || endFrame < startFrame) {
    throw new Error('Expected an inclusive, ordered integer frame range.');
  }
  const frames = new Set<number>();
  let totalRecords = 0;
  let invalidRecords = 0;
  let outsideRangeRecords = 0;
  let minimumElements = Number.POSITIVE_INFINITY;
  for (const line of text.split(/\r?\n/)) {
    const marker = line.indexOf('EDITORIAL_LAYOUT_QC ');
    if (marker < 0) continue;
    totalRecords++;
    try {
      // Remove terminal color codes, but do not invent or coerce record fields.
      const payload = line.slice(marker + 'EDITORIAL_LAYOUT_QC '.length).replace(/\x1b\[[0-9;]*m/g, '').trim();
      const data = JSON.parse(payload);
      if (!Number.isInteger(data.frame) || data.frame < 0 || data.passed !== true ||
          !Number.isInteger(data.elements) || data.elements < 1) throw new Error('Invalid guard record');
      if (data.frame < startFrame || data.frame > endFrame) {
        outsideRangeRecords++;
        continue;
      }
      frames.add(data.frame);
      minimumElements = Math.min(minimumElements, data.elements);
    } catch {
      invalidRecords++;
    }
  }
  const missingFrames: number[] = [];
  for (let frame = startFrame; frame <= endFrame; frame++) if (!frames.has(frame)) missingFrames.push(frame);
  return {
    contract_type: 'editorial_layout_frame_coverage_v1',
    passed: invalidRecords === 0 && missingFrames.length === 0,
    start_frame: startFrame,
    end_frame_inclusive: endFrame,
    expected_frames: endFrame - startFrame + 1,
    audited_frames: frames.size,
    total_records: totalRecords,
    duplicate_records: totalRecords - invalidRecords - outsideRangeRecords - frames.size,
    outside_range_records: outsideRangeRecords,
    invalid_records: invalidRecords,
    minimum_semantic_elements: Number.isFinite(minimumElements) ? minimumElements : 0,
    missing_frames: missingFrames,
  };
}
