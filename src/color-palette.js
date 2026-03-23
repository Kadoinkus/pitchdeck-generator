export const DEFAULT_THEME_COLORS = {
  primaryColor: '#004B49',
  accentColor: '#30D89E',
  secondaryColor: '#0B6E6C',
  backgroundColor: '#F2F4F6',
  textColor: '#0B1D2E'
};

export const HARMONY_MODES = [
  'complementary',
  'split-complementary',
  'analogous',
  'triad',
  'monochromatic'
];

const THEME_SAFETY_THRESHOLDS = {
  textOnBackground: 7,
  accentOnBackground: 2.2,
  secondaryOnBackground: 3,
  secondaryOnWhite: 4.8
};

const HARMONY_VARIANTS = {
  complementary: [
    { a: 180, b: 160, accentL: 0.5, secondaryL: 0.24, accentS: 0.72, secondaryS: 0.62 },
    { a: 180, b: 200, accentL: 0.56, secondaryL: 0.28, accentS: 0.78, secondaryS: 0.56 },
    { a: 170, b: 190, accentL: 0.48, secondaryL: 0.22, accentS: 0.68, secondaryS: 0.66 },
    { a: 188, b: 152, accentL: 0.54, secondaryL: 0.26, accentS: 0.74, secondaryS: 0.6 }
  ],
  'split-complementary': [
    { a: 150, b: 210, accentL: 0.52, secondaryL: 0.25, accentS: 0.74, secondaryS: 0.62 },
    { a: 145, b: 215, accentL: 0.56, secondaryL: 0.28, accentS: 0.68, secondaryS: 0.56 },
    { a: 135, b: 225, accentL: 0.49, secondaryL: 0.23, accentS: 0.76, secondaryS: 0.68 },
    { a: 158, b: 202, accentL: 0.54, secondaryL: 0.27, accentS: 0.72, secondaryS: 0.6 }
  ],
  analogous: [
    { a: -28, b: 32, accentL: 0.5, secondaryL: 0.23, accentS: 0.7, secondaryS: 0.62 },
    { a: -22, b: 38, accentL: 0.56, secondaryL: 0.29, accentS: 0.64, secondaryS: 0.56 },
    { a: -38, b: 22, accentL: 0.47, secondaryL: 0.22, accentS: 0.76, secondaryS: 0.66 },
    { a: -18, b: 48, accentL: 0.53, secondaryL: 0.25, accentS: 0.7, secondaryS: 0.58 }
  ],
  triad: [
    { a: 120, b: 240, accentL: 0.52, secondaryL: 0.24, accentS: 0.74, secondaryS: 0.64 },
    { a: 115, b: 235, accentL: 0.56, secondaryL: 0.28, accentS: 0.68, secondaryS: 0.58 },
    { a: 125, b: 245, accentL: 0.48, secondaryL: 0.22, accentS: 0.76, secondaryS: 0.68 },
    { a: 105, b: 225, accentL: 0.54, secondaryL: 0.26, accentS: 0.7, secondaryS: 0.6 }
  ],
  monochromatic: [
    { a: 0, b: 0, accentL: 0.52, secondaryL: 0.24, accentS: 0.5, secondaryS: 0.56 },
    { a: 0, b: 0, accentL: 0.58, secondaryL: 0.29, accentS: 0.44, secondaryS: 0.5 },
    { a: 0, b: 0, accentL: 0.47, secondaryL: 0.21, accentS: 0.58, secondaryS: 0.62 },
    { a: 0, b: 0, accentL: 0.55, secondaryL: 0.26, accentS: 0.48, secondaryS: 0.54 }
  ]
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toFinite(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function wrapHue(h) {
  return ((h % 360) + 360) % 360;
}

export function normalizeHexColor(value, fallback = DEFAULT_THEME_COLORS.primaryColor) {
  const raw = String(value || '').trim();
  if (/^#?[0-9a-fA-F]{6}$/.test(raw)) {
    return (raw.startsWith('#') ? raw : `#${raw}`).toUpperCase();
  }
  if (raw.length === 0 && fallback) return normalizeHexColor(fallback, '#004B49');
  return '#004B49';
}

function hexToRgb(hex) {
  const normalized = normalizeHexColor(hex);
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16)
  };
}

function rgbToHex({ r, g, b }) {
  const toHex = (channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function rgbToHsl({ r, g, b }) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  if (delta !== 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
    h *= 60;
  }

  if (h < 0) h += 360;
  return { h, s, l };
}

function hslToRgb({ h, s, l }) {
  const hue = wrapHue(h);
  const sat = clamp(s, 0, 1);
  const light = clamp(l, 0, 1);
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = light - c / 2;

  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (hue < 60) [r1, g1, b1] = [c, x, 0];
  else if (hue < 120) [r1, g1, b1] = [x, c, 0];
  else if (hue < 180) [r1, g1, b1] = [0, c, x];
  else if (hue < 240) [r1, g1, b1] = [0, x, c];
  else if (hue < 300) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];

  return {
    r: (r1 + m) * 255,
    g: (g1 + m) * 255,
    b: (b1 + m) * 255
  };
}

function channelLuminance(channel) {
  const normalized = channel / 255;
  if (normalized <= 0.03928) return normalized / 12.92;
  return ((normalized + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  );
}

export function contrastRatio(a, b) {
  const la = relativeLuminance(normalizeHexColor(a));
  const lb = relativeLuminance(normalizeHexColor(b));
  const brighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (brighter + 0.05) / (darker + 0.05);
}

function adjustForContrast(color, fixedColor, minContrast, direction = 'darker') {
  const fixed = normalizeHexColor(fixedColor, '#FFFFFF');
  const start = normalizeHexColor(color, '#000000');
  let best = start;
  let bestContrast = contrastRatio(start, fixed);
  if (bestContrast >= minContrast) return start;

  const hsl = rgbToHsl(hexToRgb(start));
  for (let step = 1; step <= 50; step += 1) {
    const amount = (step / 50) * 0.9;
    const nextL = direction === 'lighter'
      ? clamp(hsl.l + amount, 0.02, 0.98)
      : clamp(hsl.l - amount, 0.02, 0.98);
    const candidate = rgbToHex(hslToRgb({ h: hsl.h, s: hsl.s, l: nextL }));
    const ratio = contrastRatio(candidate, fixed);
    if (ratio > bestContrast) {
      best = candidate;
      bestContrast = ratio;
    }
    if (ratio >= minContrast) return candidate;
  }

  return best;
}

function normalizeThemeInput(themeInput = {}, fallbackTheme = DEFAULT_THEME_COLORS) {
  return {
    primaryColor: normalizeHexColor(themeInput.primaryColor, fallbackTheme.primaryColor),
    accentColor: normalizeHexColor(themeInput.accentColor, fallbackTheme.accentColor),
    secondaryColor: normalizeHexColor(themeInput.secondaryColor, fallbackTheme.secondaryColor),
    backgroundColor: normalizeHexColor(themeInput.backgroundColor, fallbackTheme.backgroundColor),
    textColor: normalizeHexColor(themeInput.textColor, fallbackTheme.textColor)
  };
}

function normalizeHarmonyMode(value) {
  const mode = String(value || '').trim().toLowerCase();
  if (HARMONY_MODES.includes(mode)) return mode;
  return 'complementary';
}

function resolveVariant(mode, shuffleSeed) {
  const options = HARMONY_VARIANTS[mode] || HARMONY_VARIANTS.complementary;
  const seed = Math.abs(Math.floor(toFinite(shuffleSeed, 0)));
  const index = seed % options.length;
  return {
    variant: options[index],
    index,
    count: options.length
  };
}

function generateHarmonyTheme(primaryColor, harmonyMode, shuffleSeed) {
  const primary = normalizeHexColor(primaryColor, DEFAULT_THEME_COLORS.primaryColor);
  const { h, s, l } = rgbToHsl(hexToRgb(primary));
  const mode = normalizeHarmonyMode(harmonyMode);
  const variantData = resolveVariant(mode, shuffleSeed);
  const v = variantData.variant;

  const accentHue = wrapHue(h + v.a);
  const secondaryHue = wrapHue(h + v.b);
  const baseSat = clamp(s, 0.2, 0.88);
  const baseLight = clamp(l, 0.16, 0.72);

  const accentColor = rgbToHex(
    hslToRgb({
      h: accentHue,
      s: clamp((baseSat * 0.55) + (v.accentS * 0.45), 0.35, 0.9),
      l: clamp((baseLight * 0.25) + (v.accentL * 0.75), 0.38, 0.66)
    })
  );

  const secondaryColor = rgbToHex(
    hslToRgb({
      h: secondaryHue,
      s: clamp((baseSat * 0.45) + (v.secondaryS * 0.55), 0.35, 0.9),
      l: clamp((baseLight * 0.2) + (v.secondaryL * 0.8), 0.16, 0.36)
    })
  );

  return {
    theme: {
      primaryColor: primary,
      accentColor,
      secondaryColor
    },
    harmonyMode: mode,
    variantIndex: variantData.index,
    variantCount: variantData.count
  };
}

export function evaluateTheme(themeInput = {}) {
  const theme = normalizeThemeInput(themeInput);
  return {
    textOnBackground: contrastRatio(theme.textColor, theme.backgroundColor),
    accentOnBackground: contrastRatio(theme.accentColor, theme.backgroundColor),
    secondaryOnBackground: contrastRatio(theme.secondaryColor, theme.backgroundColor),
    secondaryOnWhite: contrastRatio(theme.secondaryColor, '#FFFFFF')
  };
}

export function describeThemeSafety(themeInput = {}) {
  const metrics = evaluateTheme(themeInput);
  const warnings = [];

  if (metrics.textOnBackground < THEME_SAFETY_THRESHOLDS.textOnBackground) {
    warnings.push('Text and background contrast is too low.');
  }
  if (metrics.accentOnBackground < THEME_SAFETY_THRESHOLDS.accentOnBackground) {
    warnings.push('Accent color is too close to the background.');
  }
  if (metrics.secondaryOnWhite < THEME_SAFETY_THRESHOLDS.secondaryOnWhite) {
    warnings.push('Dark-slide color is too light for white text.');
  }

  return warnings;
}

export function enforceThemeSafety(themeInput = {}) {
  const theme = normalizeThemeInput(themeInput);
  const adjustments = [];

  function applyIfChanged(key, nextColor, reason) {
    const normalized = normalizeHexColor(nextColor, theme[key]);
    if (normalized === theme[key]) return;
    theme[key] = normalized;
    adjustments.push({ key, reason, color: normalized });
  }

  applyIfChanged(
    'textColor',
    adjustForContrast(theme.textColor, theme.backgroundColor, THEME_SAFETY_THRESHOLDS.textOnBackground, 'darker'),
    'darkened text for readability'
  );

  applyIfChanged(
    'backgroundColor',
    adjustForContrast(theme.backgroundColor, theme.textColor, THEME_SAFETY_THRESHOLDS.textOnBackground, 'lighter'),
    'lightened background for readability'
  );

  applyIfChanged(
    'accentColor',
    adjustForContrast(theme.accentColor, theme.backgroundColor, THEME_SAFETY_THRESHOLDS.accentOnBackground, 'darker'),
    'adjusted accent contrast on background'
  );

  applyIfChanged(
    'secondaryColor',
    adjustForContrast(theme.secondaryColor, '#FFFFFF', THEME_SAFETY_THRESHOLDS.secondaryOnWhite, 'darker'),
    'darkened dark-slide color for white text'
  );

  applyIfChanged(
    'secondaryColor',
    adjustForContrast(theme.secondaryColor, theme.backgroundColor, THEME_SAFETY_THRESHOLDS.secondaryOnBackground, 'darker'),
    'darkened dark-slide color to separate from deck background'
  );

  return {
    theme,
    adjustments,
    metrics: evaluateTheme(theme)
  };
}

export function generateThemePalette(input = {}) {
  const primaryColor = normalizeHexColor(input.primaryColor || input.baseColor, DEFAULT_THEME_COLORS.primaryColor);
  const harmonyMode = normalizeHarmonyMode(input.harmonyMode);
  const shuffleSeed = Math.max(0, Math.floor(toFinite(input.shuffleSeed, 0)));
  const generated = generateHarmonyTheme(primaryColor, harmonyMode, shuffleSeed);

  return {
    ...generated,
    shuffleSeed,
    generatedTheme: generated.theme
  };
}

export function resolveThemePalette(input = {}) {
  const primaryColor = normalizeHexColor(input.primaryColor || input.baseColor, DEFAULT_THEME_COLORS.primaryColor);
  const harmonyMode = normalizeHarmonyMode(input.harmonyMode);
  const shuffleSeed = Math.max(0, Math.floor(toFinite(input.shuffleSeed, 0)));
  const locks = input.locks && typeof input.locks === 'object' ? input.locks : {};

  const manualTheme = normalizeThemeInput({
    primaryColor,
    accentColor: input.manualColors?.accentColor,
    secondaryColor: input.manualColors?.secondaryColor,
    backgroundColor: input.manualColors?.backgroundColor,
    textColor: input.manualColors?.textColor
  });

  const generated = generateHarmonyTheme(primaryColor, harmonyMode, shuffleSeed);
  const nextTheme = {
    primaryColor,
    accentColor: locks.accentColor ? manualTheme.accentColor : generated.theme.accentColor,
    secondaryColor: locks.secondaryColor ? manualTheme.secondaryColor : generated.theme.secondaryColor,
    backgroundColor: manualTheme.backgroundColor,
    textColor: manualTheme.textColor
  };

  const enforced = enforceThemeSafety(nextTheme);

  return {
    primaryColor,
    harmonyMode: generated.harmonyMode,
    shuffleSeed,
    variantIndex: generated.variantIndex,
    variantCount: generated.variantCount,
    generatedTheme: generated.theme,
    locks: {
      accentColor: Boolean(locks.accentColor),
      secondaryColor: Boolean(locks.secondaryColor)
    },
    theme: enforced.theme,
    adjustments: enforced.adjustments,
    metrics: enforced.metrics,
    warnings: describeThemeSafety(enforced.theme)
  };
}
