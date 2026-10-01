import type { TextTransform } from '../types';

export const DPI = 96;
export const MM_PER_INCH = 25.4;
export const PX_PER_MM = DPI / MM_PER_INCH; // ~3.779527559 px per mm
export const PT_PER_PX = 72 / DPI; // 0.75

export function mmToPx(mm: number): number {
  return mm * PX_PER_MM;
}

export function pxToMm(px: number): number {
  return px / PX_PER_MM;
}

export function ptToPx(pt: number): number {
  return pt * (DPI / 72);
}

export function pxToPt(px: number): number {
  return px * PT_PER_PX;
}

export function applyTextTransform(text: string, transform: TextTransform): string {
  if (!text) return '';
  switch (transform) {
    case 'uppercase':
      return text.toUpperCase();
    case 'lowercase':
      return text.toLowerCase();
    case 'capitalize':
      return text.replace(/\b\w/g, (l) => l.toUpperCase());
    case 'none':
    default:
      return text;
  }
}

export interface NameSplitResult {
  firstName: string;
  outsideInitials: string;
}

export function parseNameAndInitials(
  rawText: string,
  surnamesArg?: string,
  mode: 'outside_initials' | 'inside_box' | 'first_name_only' = 'outside_initials'
): NameSplitResult {
  const trimmedText = (rawText || '').trim();
  const trimmedSurnames = (surnamesArg || '').trim();

  if (!trimmedText && !trimmedSurnames) {
    return { firstName: '', outsideInitials: '' };
  }

  let firstName = trimmedText;
  let surnameText = trimmedSurnames;

  // If surnames are not explicitly passed, split rawText into first word + surname words
  if (!surnameText && trimmedText) {
    const parts = trimmedText.split(/\s+/);
    firstName = parts[0] || '';
    if (parts.length > 1) {
      surnameText = parts.slice(1).join(' ');
    }
  }

  if (mode === 'inside_box') {
    const fullCombined = [firstName, surnameText].filter(Boolean).join(' ');
    return { firstName: fullCombined, outsideInitials: '' };
  }

  if (mode === 'first_name_only') {
    return { firstName, outsideInitials: '' };
  }

  // mode === 'outside_initials': compute initials from surnameText
  let outsideInitials = '';
  if (surnameText) {
    const surnameWords = surnameText.split(/\s+/);
    const initials = surnameWords
      .map((w) => {
        const clean = w.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, '');
        if (clean.length > 0) {
          return clean[0].toUpperCase() + '.';
        }
        return '';
      })
      .filter(Boolean);
    outsideInitials = initials.join(' ');
  }

  return { firstName, outsideInitials };
}

let offscreenCanvas: HTMLCanvasElement | null = null;

function getOffscreenContext(): CanvasRenderingContext2D | null {
  if (!offscreenCanvas) {
    offscreenCanvas = document.createElement('canvas');
  }
  return offscreenCanvas.getContext('2d');
}

export interface MeasureTextOptions {
  text: string;
  fontFamily: string;
  fontSizePt: number;
  fontWeight?: string;
  fontStyle?: string;
  letterSpacingMm?: number;
  transform?: TextTransform;
  paddingLeftMm?: number;
  paddingRightMm?: number;
}

export async function measureTextWidthMm(options: MeasureTextOptions): Promise<number> {
  const {
    text,
    fontFamily,
    fontSizePt,
    fontWeight = 'bold',
    fontStyle = 'normal',
    letterSpacingMm = 0,
    transform = 'none',
    paddingLeftMm = 0,
    paddingRightMm = 0,
  } = options;

  if (!text) {
    return paddingLeftMm + paddingRightMm;
  }

  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  const transformedText = applyTextTransform(text, transform);
  const ctx = getOffscreenContext();

  if (!ctx) {
    return transformedText.length * fontSizePt * 0.35 + paddingLeftMm + paddingRightMm;
  }

  const fontSizePx = ptToPx(fontSizePt);
  ctx.font = `${fontStyle} ${fontWeight} ${fontSizePx}px "${fontFamily}", sans-serif`;

  const measuredPx = ctx.measureText(transformedText).width;
  const letterSpacingPx = mmToPx(letterSpacingMm);
  const totalLetterSpacingPx = Math.max(0, transformedText.length - 1) * letterSpacingPx;

  const totalWidthPx = measuredPx + totalLetterSpacingPx;
  const totalWidthMm = pxToMm(totalWidthPx) + paddingLeftMm + paddingRightMm;

  return Math.ceil(totalWidthMm * 10) / 10;
}

/**
 * Calculate optimal font size so text shrinks automatically to fit inside available box width
 */
export function calculateFitFontSize(
  text: string,
  fontFamily: string,
  targetWidthMm: number,
  initialFontSizePt: number,
  minFontSizePt: number = 8,
  paddingLeftMm: number = 0,
  paddingRightMm: number = 0
): number {
  const availableWidthMm = targetWidthMm - (paddingLeftMm + paddingRightMm);
  if (availableWidthMm <= 0) return minFontSizePt;

  const ctx = getOffscreenContext();
  if (!ctx) return initialFontSizePt;

  let currentPt = initialFontSizePt;

  while (currentPt >= minFontSizePt) {
    const fontSizePx = ptToPx(currentPt);
    ctx.font = `bold ${fontSizePx}px "${fontFamily}", sans-serif`;
    const measuredPx = ctx.measureText(text).width;
    const measuredMm = pxToMm(measuredPx);

    if (measuredMm <= availableWidthMm) {
      return currentPt;
    }
    currentPt -= 0.5;
  }

  return minFontSizePt;
}
