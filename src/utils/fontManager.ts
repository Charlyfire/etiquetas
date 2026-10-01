import type { FontResource } from '../types';
import { db } from '../storage/db';

// Default built-in fonts with Massallera as top priority default
export const BUILTIN_FONTS: FontResource[] = [
  {
    id: 'font-massallera',
    familyName: 'Massallera',
    fullName: 'Massallera Regular',
    source: 'built-in',
    format: 'ttf',
    category: 'Escolar',
    isFavorite: true,
  },
  {
    id: 'font-short-stack',
    familyName: 'Short Stack',
    fullName: 'Short Stack Regular',
    source: 'built-in',
    format: 'woff2',
    category: 'Escolar',
    isFavorite: true,
  },
  {
    id: 'font-comic-neue',
    familyName: 'Comic Neue',
    fullName: 'Comic Neue',
    source: 'built-in',
    format: 'woff2',
    category: 'Escolar',
    isFavorite: true,
  },
  {
    id: 'font-inter',
    familyName: 'Inter',
    fullName: 'Inter Regular',
    source: 'built-in',
    format: 'woff2',
    category: 'Estándar',
    isFavorite: true,
  },
  {
    id: 'font-patrick-hand',
    familyName: 'Patrick Hand',
    fullName: 'Patrick Hand Regular',
    source: 'built-in',
    format: 'woff2',
    category: 'Manuscrita',
    isFavorite: true,
  },
  {
    id: 'font-caveat',
    familyName: 'Caveat',
    fullName: 'Caveat Regular',
    source: 'built-in',
    format: 'woff2',
    category: 'Manuscrita',
    isFavorite: false,
  },
  {
    id: 'font-fredoka',
    familyName: 'Fredoka',
    fullName: 'Fredoka Medium',
    source: 'built-in',
    format: 'woff2',
    category: 'Decorativa',
    isFavorite: true,
  },
  {
    id: 'font-quicksand',
    familyName: 'Quicksand',
    fullName: 'Quicksand Medium',
    source: 'built-in',
    format: 'woff2',
    category: 'Estándar',
    isFavorite: false,
  },
];

// Load Google Fonts dynamically
export function loadBuiltinGoogleFonts() {
  const fontFamilies = [
    'Short+Stack',
    'Comic+Neue:wght@400;700',
    'Inter:wght@400;600;700',
    'Patrick+Hand',
    'Caveat:wght@400;700',
    'Fredoka:wght@400;600',
    'Quicksand:wght@500;700',
  ];
  const linkId = 'google-fonts-etiquetas';
  if (!document.getElementById(linkId)) {
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamilies.join('&family=')}&display=swap`;
    document.head.appendChild(link);
  }
}

// Register custom uploaded font using FontFace API
export async function registerCustomFont(font: FontResource): Promise<void> {
  if (!font.dataUrl && !font.blob) return;

  try {
    let arrayBuffer: ArrayBuffer;
    if (font.blob) {
      arrayBuffer = await font.blob.arrayBuffer();
    } else if (font.dataUrl) {
      const response = await fetch(font.dataUrl);
      arrayBuffer = await response.arrayBuffer();
    } else {
      return;
    }

    const fontFace = new FontFace(font.familyName, arrayBuffer);
    const loadedFace = await fontFace.load();
    document.fonts.add(loadedFace);
    console.log(`Font registered successfully: ${font.familyName}`);
  } catch (err) {
    console.error(`Error loading font ${font.familyName}:`, err);
  }
}

// Convert uploaded file to FontResource & register it
export async function processFontFile(file: File): Promise<FontResource> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  let format: 'ttf' | 'otf' | 'woff' | 'woff2' = 'ttf';
  if (ext === 'otf') format = 'otf';
  if (ext === 'woff') format = 'woff';
  if (ext === 'woff2') format = 'woff2';

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const familyName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

  const fontResource: FontResource = {
    id: `font-custom-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    familyName,
    fullName: familyName,
    source: 'custom',
    dataUrl,
    format,
    category: 'Escolar',
    isFavorite: true,
  };

  await registerCustomFont(fontResource);
  await db.fonts.put(fontResource);

  return fontResource;
}

// Initialize all stored fonts from IndexedDB
export async function loadAllFonts(): Promise<FontResource[]> {
  loadBuiltinGoogleFonts();

  const customFonts = await db.fonts.toArray();
  for (const font of customFonts) {
    await registerCustomFont(font);
  }

  return [...BUILTIN_FONTS, ...customFonts];
}

export function checkFontMissingChars(fontFamily: string, text: string): string[] {
  const missing: string[] = [];
  const charsToCheck = Array.from(new Set(text.split(''))).filter((c) => c.trim() !== '');

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];

  const fontSize = 32;

  charsToCheck.forEach((char) => {
    ctx.font = `${fontSize}px "${fontFamily}", monospace`;
    const w1 = ctx.measureText(char).width;

    if (w1 === 0 && char !== ' ') {
      missing.push(char);
    }
  });

  return missing;
}
