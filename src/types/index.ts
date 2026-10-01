export type DataMode = 'alumnos' | 'texto_libre';

export type RectangleWidthMode = 'auto' | 'fixed';

export type TextTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize';

export type FontCategory = 'Escolar' | 'Manuscrita' | 'Decorativa' | 'Estándar' | 'Otras';

export interface FontResource {
  id: string;
  familyName: string;
  fullName: string;
  source: 'built-in' | 'custom';
  dataUrl?: string;
  blob?: Blob;
  format: 'ttf' | 'otf' | 'woff' | 'woff2';
  category: FontCategory;
  isFavorite: boolean;
  fallbackFontId?: string;
  missingCharsWarnings?: string[];
}

export interface TextElementConfig {
  visible: boolean;
  fontFamily: string;
  fontSizePt: number;
  color: string;
  fontWeight: 'normal' | 'bold' | '600' | '700' | '800';
  fontStyle: 'normal' | 'italic';
  letterSpacingMm: number;
  lineHeight: number;
  alignHorizontal: 'left' | 'center' | 'right';
  alignVertical: 'top' | 'middle' | 'bottom';
  transform: TextTransform;
  offsetXmm: number;
  offsetYmm: number;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  rotation: number;
  zIndex: number;
  locked: boolean;
  // Frame 3: Name Box Frame styling
  boxBackgroundColor: string;
  boxBorderColor: string;
  boxBorderWidthMm: number;
  boxBorderRadiusMm: number;
  boxWidthMm?: number;
  boxHeightMm?: number;
  paddingLeftMm: number;
  paddingRightMm: number;
  surnameDisplayMode?: 'outside_initials' | 'inside_box' | 'first_name_only';
}

export type NumberShape = 'none' | 'circle' | 'square' | 'rectangle' | 'rounded_rectangle';

export interface NumberElementConfig extends TextElementConfig {
  shape: NumberShape;
  shapeSizeMm: number;
  shapeBackgroundColor: string;
  shapeBorderColor: string;
  shapeBorderWidthMm: number;
  shapeBorderRadiusMm: number;
}

export type ElementShapeFrame = 'none' | 'circle' | 'square' | 'rectangle' | 'rounded_rectangle';

export interface ImageElementConfig {
  visible: boolean;
  url: string;
  category: string;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  rotation: number;
  offsetXmm?: number;
  offsetYmm?: number;
  keepAspectRatio: boolean;
  zIndex: number;
  locked: boolean;
  // Frame 4: Drawing Frame styling
  shape: ElementShapeFrame;
  shapeSizeMm: number;
  shapeBackgroundColor: string;
  shapeBorderColor: string;
  shapeBorderWidthMm: number;
  shapeBorderRadiusMm: number;
}

export type PhotoShape = 'rectangle' | 'square' | 'circle' | 'rounded';

export interface PhotoElementConfig {
  visible: boolean;
  url: string;
  shape: PhotoShape;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  rotation: number;
  cropZoom: number;
  cropOffsetX: number;
  cropOffsetY: number;
  borderEnabled: boolean;
  borderColor: string;
  borderWidthMm: number;
  borderRadiusMm: number;
  zIndex: number;
  locked: boolean;
}

export interface ItemOverride {
  displayText?: string;
  secondText?: string;
  drawingUrl?: string;
  photoUrl?: string;
  hideNumber?: boolean;
  customFontSizePt?: number;
  offsetXmm?: number;
  offsetYmm?: number;
  copies?: number;
}

export interface RecordItem {
  id: string;
  listNumber: number;
  fullName: string;
  firstName?: string;
  surnames?: string;
  displayText: string;
  secondText?: string;
  drawingUrl?: string;
  photoUrl?: string;
  category?: string;
  copies: number;
  overrides?: ItemOverride;
}

export interface LabelPadding {
  topMm: number;
  rightMm: number;
  bottomMm: number;
  leftMm: number;
}

export interface LabelBorder {
  enabled: boolean;
  color: string;
  widthMm: number;
  radiusMm: number;
  style: 'solid' | 'dashed' | 'dotted';
}

export type PresetLayoutType =
  | 'custom'
  | 'solo_nombre'
  | 'numero_nombre'
  | 'numero_nombre_dibujo'
  | 'nombre_dibujo'
  | 'foto_arriba_nombre_abajo'
  | 'foto_izq_nombre_der'
  | 'nombre_izq_foto_der'
  | 'foto_circular_nombre'
  | 'medalla_circular'
  | 'texto_libre';

export interface LabelTemplate {
  id: string;
  name: string;
  description: string;
  mode: DataMode;
  layoutPreset: PresetLayoutType;
  widthMm: number;
  heightMm: number;
  autoHeight: boolean;
  rectangleMode: RectangleWidthMode;
  minWidthMm: number;
  maxWidthMm: number;
  padding: LabelPadding;
  backgroundColor: string;
  backgroundGradient?: string;
  backgroundPattern?: 'none' | 'estrellas' | 'pompas' | 'lunares' | 'rayos_medalla' | 'ondas' | 'corazones' | 'lineas';
  backgroundPatternColor?: string;
  backgroundImageUrl?: string;
  backgroundImageOpacity?: number;
  backgroundImageFit?: 'cover' | 'contain' | 'tile';
  border: LabelBorder;
  elements: {
    mainText: TextElementConfig;
    number: NumberElementConfig;
    drawing: ImageElementConfig;
    photo: PhotoElementConfig;
    secondText: TextElementConfig;
  };
}

export interface PrintSettings {
  paperSize: 'A4' | 'A3' | 'Letter';
  orientation: 'portrait' | 'landscape';
  marginTopMm: number;
  marginBottomMm: number;
  marginLeftMm: number;
  marginRightMm: number;
  gapHorizontalMm: number; // 0 mm for joined contiguous labels
  gapVerticalMm: number;   // 0 mm for joined contiguous labels
  layoutMode: 'grid' | 'compact_auto' | 'manual';
  gridRows: number;
  gridCols: number;
  showCropMarks: boolean;
  showLabelBorders: boolean;
  bleedMm: number;
  smartPacking?: boolean;
}

export interface ColorPalette {
  id: string;
  name: string;
  colors: string[];
}

export interface SizePreset {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  rectangleMode: RectangleWidthMode;
  description: string;
}

export interface Project {
  id: string;
  name: string;
  mode: DataMode;
  records: RecordItem[];
  template: LabelTemplate;
  printSettings: PrintSettings;
  createdAt: number;
  updatedAt: number;
}

export interface ValidationIssue {
  recordId: string;
  recordName: string;
  type: 'overflow_text' | 'image_out_of_bounds' | 'overlap' | 'small_font' | 'missing_glyphs';
  message: string;
  severity: 'warning' | 'error';
}
