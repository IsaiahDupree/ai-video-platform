import {isIP} from 'node:net';

export const ALLOWED_COMPOSITIONS = new Set(['IsaiahStyleReel']);
export const ALLOWED_QUALITIES = new Set(['preview', 'production']);
export const MIN_DURATION_FRAMES = 10 * 30;
export const MAX_DURATION_FRAMES = 59 * 30;
export const MAX_PROPS_BYTES = 2_000_000;
export const AUDIO_SHA256_PATTERN = /^[a-f0-9]{64}$/;

const isPrivateIpv4 = (hostname) => {
  const octets = hostname.split('.').map(Number);
  if (octets.length !== 4 || octets.some((value) => !Number.isInteger(value))) {
    return false;
  }
  return (
    octets[0] === 10 ||
    octets[0] === 127 ||
    (octets[0] === 169 && octets[1] === 254) ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168) ||
    octets[0] === 0 ||
    octets[0] >= 224
  );
};

export const isPublicHttpsUrl = (value) => {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:' || !parsed.hostname) {
    return false;
  }
  const hostname = parsed.hostname
    .toLowerCase()
    .replace(/\.$/, '')
    .replace(/^\[|\]$/g, '');
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local')) {
    return false;
  }
  if (isIP(hostname) === 4) {
    return !isPrivateIpv4(hostname);
  }
  if (isIP(hostname) === 6) {
    const normalized = hostname.toLowerCase();
    return !(
      normalized === '::1' ||
      normalized === '::' ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      normalized.startsWith('fe8') ||
      normalized.startsWith('fe9') ||
      normalized.startsWith('fea') ||
      normalized.startsWith('feb')
    );
  }
  return true;
};

export const validateRenderRequest = ({composition, inputProps, quality}) => {
  if (!ALLOWED_COMPOSITIONS.has(composition)) {
    throw new Error(`composition is not allowed: ${composition}`);
  }
  if (!ALLOWED_QUALITIES.has(quality)) {
    throw new Error('quality must be preview or production');
  }
  if (!inputProps || typeof inputProps !== 'object' || Array.isArray(inputProps)) {
    throw new Error('input props must be a JSON object');
  }
  if (Buffer.byteLength(JSON.stringify(inputProps), 'utf8') > MAX_PROPS_BYTES) {
    throw new Error('input props exceed the 2 MB limit');
  }
  if (
    typeof inputProps.hook !== 'string' ||
    inputProps.hook.trim().length === 0 ||
    inputProps.hook.length > 180
  ) {
    throw new Error('IsaiahStyleReel hook must be a non-empty string <= 180 chars');
  }
  if (typeof inputProps.audioPath !== 'string' || !isPublicHttpsUrl(inputProps.audioPath)) {
    throw new Error('IsaiahStyleReel audioPath must be a public HTTPS URL');
  }
  if (
    typeof inputProps.audioSha256 !== 'string' ||
    !AUDIO_SHA256_PATTERN.test(inputProps.audioSha256)
  ) {
    throw new Error('IsaiahStyleReel audioSha256 must be a lowercase SHA-256');
  }
  if (
    !Array.isArray(inputProps.transcript) ||
    inputProps.transcript.length < 1 ||
    inputProps.transcript.length > 500
  ) {
    throw new Error('IsaiahStyleReel transcript must contain 1 to 500 words');
  }

  const durationInFrames = inputProps.durationInFrames;
  if (
    !Number.isInteger(durationInFrames) ||
    durationInFrames < MIN_DURATION_FRAMES ||
    durationInFrames > MAX_DURATION_FRAMES
  ) {
    throw new Error('IsaiahStyleReel durationInFrames must be an integer from 300 to 1770');
  }
  const durationSeconds = durationInFrames / 30;

  let previousEnd = 0;
  inputProps.transcript.forEach((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error(`transcript[${index}] must be an object`);
    }
    if (typeof item.word !== 'string' || item.word.trim().length === 0 || item.word.length > 80) {
      throw new Error(`transcript[${index}].word is invalid`);
    }
    if (
      typeof item.start !== 'number' ||
      typeof item.end !== 'number' ||
      !Number.isFinite(item.start) ||
      !Number.isFinite(item.end) ||
      item.start < 0 ||
      item.end <= item.start ||
      item.end > durationSeconds
    ) {
      throw new Error(`transcript[${index}] timestamps are outside the composition timeline`);
    }
    if (item.start < previousEnd) {
      throw new Error('transcript timestamps must be monotonic and non-overlapping');
    }
    previousEnd = item.end;
  });

  if (
    inputProps.visualMode !== undefined &&
    !new Set(['generic', 'lead_handoff']).has(inputProps.visualMode)
  ) {
    throw new Error('IsaiahStyleReel visualMode is invalid');
  }
  if (
    inputProps.safeCaptionBottom !== undefined &&
    (
      typeof inputProps.safeCaptionBottom !== 'number' ||
      !Number.isFinite(inputProps.safeCaptionBottom) ||
      inputProps.safeCaptionBottom < 180 ||
      inputProps.safeCaptionBottom > 360
    )
  ) {
    throw new Error('IsaiahStyleReel safeCaptionBottom must be 180 to 360 pixels');
  }
  if (
    inputProps.cta !== undefined &&
    (typeof inputProps.cta !== 'string' || inputProps.cta.trim().length === 0 || inputProps.cta.length > 220)
  ) {
    throw new Error('IsaiahStyleReel CTA must be a non-empty string <= 220 chars');
  }
  if (
    inputProps.ctaStartSeconds !== undefined &&
    (
      typeof inputProps.ctaStartSeconds !== 'number' ||
      !Number.isFinite(inputProps.ctaStartSeconds) ||
      inputProps.ctaStartSeconds < 3 ||
      inputProps.ctaStartSeconds >= durationSeconds
    )
  ) {
    throw new Error('IsaiahStyleReel ctaStartSeconds must be inside the composition timeline');
  }
  if (inputProps.points !== undefined) {
    if (
      !Array.isArray(inputProps.points) ||
      inputProps.points.length > 3 ||
      inputProps.points.some(
        (point) => typeof point !== 'string' || point.trim().length === 0 || point.length > 80,
      )
    ) {
      throw new Error('IsaiahStyleReel points must contain at most 3 short labels');
    }
  }

  return inputProps;
};
