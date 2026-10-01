import type {
  LabelTemplate,
  RecordItem,
  ValidationIssue,
} from '../types';
import { measureTextWidthMm, calculateFitFontSize, parseNameAndInitials } from '../utils/textMetrics';

export interface ResolvedLabelDimensions {
  widthMm: number;
  heightMm: number;
  mainTextFontSizePt: number;
  numberShapeSizeMm: number;
  drawingShapeSizeMm: number;
  isOverflow: boolean;
}

/**
 * Calculate effective label dimensions, auto-scaled element sizes, and fitted font size
 */
/**
 * Automatically adjusts all template element metrics (main text font size, number shape & font size, drawing shape size)
 * proportionally whenever the label height (heightMm) is changed, scaling relative to existing values.
 */
export function adjustTemplateToHeight(template: LabelTemplate, newHeightMm: number): LabelTemplate {
  const validHeight = Math.max(10, Math.min(200, newHeightMm || 20));
  const oldHeight = Math.max(10, template.heightMm || 24);

  if (validHeight === oldHeight) return template;

  const ratio = validHeight / oldHeight;

  return {
    ...template,
    heightMm: validHeight,
    padding: {
      topMm: Math.max(1, Math.round((template.padding.topMm ?? 3) * ratio)),
      rightMm: Math.max(1, Math.round((template.padding.rightMm ?? 4) * ratio)),
      bottomMm: Math.max(1, Math.round((template.padding.bottomMm ?? 3) * ratio)),
      leftMm: Math.max(1, Math.round((template.padding.leftMm ?? 4) * ratio)),
    },
    elements: {
      ...template.elements,
      mainText: {
        ...template.elements.mainText,
        fontSizePt: Math.max(6, Math.round((template.elements.mainText.fontSizePt || 20) * ratio)),
        paddingLeftMm: Math.max(1, Math.round((template.elements.mainText.paddingLeftMm ?? 6) * ratio)),
        paddingRightMm: Math.max(1, Math.round((template.elements.mainText.paddingRightMm ?? 6) * ratio)),
        boxBorderRadiusMm: Math.max(0, Math.round((template.elements.mainText.boxBorderRadiusMm ?? 1) * ratio)),
        boxHeightMm: template.elements.mainText.boxHeightMm ? Math.max(6, Math.round(template.elements.mainText.boxHeightMm * ratio)) : undefined,
      },
      number: {
        ...template.elements.number,
        shapeSizeMm: Math.max(6, Math.round((template.elements.number.shapeSizeMm || 16) * ratio)),
        fontSizePt: Math.max(6, Math.round((template.elements.number.fontSizePt || 16) * ratio)),
      },
      drawing: {
        ...template.elements.drawing,
        shapeSizeMm: Math.max(6, Math.round((template.elements.drawing.shapeSizeMm || 18) * ratio)),
      },
      photo: {
        ...template.elements.photo,
        borderRadiusMm: Math.max(0, Math.round((template.elements.photo.borderRadiusMm ?? 1) * ratio)),
      },
    },
  };
}

export async function calculateLabelDimensions(
  template: LabelTemplate,
  record: RecordItem
): Promise<ResolvedLabelDimensions> {
  const textToShow = record.overrides?.displayText || record.displayText || record.fullName;
  const mainTextConfig = template.elements.mainText;

  // 1. Proportional Height Auto-Scaling (Point 1)
  const labelHeightMm = template.heightMm || 24;
  const topPadMm = template.padding.topMm ?? 3;
  const bottomPadMm = template.padding.bottomMm ?? 3;
  const innerHeightMm = Math.max(10, labelHeightMm - topPadMm - bottomPadMm);

  const isVerticalLayout =
    template.layoutPreset === 'medalla_circular' ||
    template.layoutPreset === 'foto_arriba_nombre_abajo';

  // Frame sizes: use explicit template shapeSizeMm if configured (> 0), otherwise compute default proportional size
  const numberShapeSizeMm = template.elements.number.shapeSizeMm || (isVerticalLayout ? Math.round(innerHeightMm * 0.28) : Math.round(innerHeightMm * 0.75));
  const drawingShapeSizeMm = template.elements.drawing.shapeSizeMm || (isVerticalLayout ? Math.round(innerHeightMm * 0.42) : Math.round(innerHeightMm * 0.85));

  // Default font size scaled to label height
  const idealFontSizePt = isVerticalLayout ? Math.max(8, Math.round(innerHeightMm * 0.38)) : Math.max(8, Math.round(innerHeightMm * 0.95));
  let effectiveFontSizePt = record.overrides?.customFontSizePt || mainTextConfig.fontSizePt || idealFontSizePt;

  let effectiveWidthMm = template.widthMm;
  let isOverflow = false;

  const gapMm = 3;
  const nameBoxPaddingLeftMm = mainTextConfig.paddingLeftMm ?? 6;
  const nameBoxPaddingRightMm = mainTextConfig.paddingRightMm ?? 6;
  const nameBoxBorderWidthMm = mainTextConfig.boxBorderWidthMm ?? 1.5;

  let numberWidthMm = 0;
  if (template.elements.number.visible && !record.overrides?.hideNumber) {
    numberWidthMm = numberShapeSizeMm;
  }

  let photoWidthMm = 0;
  if (template.elements.photo.visible) {
    photoWidthMm = Math.round(innerHeightMm * 0.85);
  }

  let drawingWidthMm = 0;
  if (template.elements.drawing.visible && (record.drawingUrl || template.elements.drawing.url)) {
    drawingWidthMm = drawingShapeSizeMm;
  }

  if (isVerticalLayout) {
    // Vertical Layout: Elements stacked top-to-bottom
    const availableForNameBoxMm = template.widthMm - (template.padding.leftMm || 4) - (template.padding.rightMm || 4);
    const numberWidthForNameMm = (template.elements.number.visible && !record.overrides?.hideNumber && template.layoutPreset === 'foto_arriba_nombre_abajo') ? numberShapeSizeMm + gapMm : 0;
    const availableTextMm = availableForNameBoxMm - numberWidthForNameMm - nameBoxPaddingLeftMm - nameBoxPaddingRightMm - (nameBoxBorderWidthMm * 2);

    const fittedFontSizePt = calculateFitFontSize(
      textToShow,
      mainTextConfig.fontFamily || 'Massallera',
      Math.max(10, availableTextMm),
      effectiveFontSizePt,
      8
    );

    if (fittedFontSizePt < effectiveFontSizePt) {
      effectiveFontSizePt = fittedFontSizePt;
    }

    const rawName = record.firstName || record.overrides?.displayText || record.displayText || record.fullName;
    const surnameText = record.surnames || '';
    if (template.rectangleMode === 'auto' && mainTextConfig.visible) {
      const nameSplit = parseNameAndInitials(rawName, surnameText, mainTextConfig.surnameDisplayMode || 'outside_initials');
      const boxTextWidthMm = await measureTextWidthMm({
        text: nameSplit.firstName,
        fontFamily: mainTextConfig.fontFamily || 'Massallera',
        fontSizePt: effectiveFontSizePt,
        fontWeight: mainTextConfig.fontWeight,
        fontStyle: mainTextConfig.fontStyle,
        letterSpacingMm: mainTextConfig.letterSpacingMm,
        transform: mainTextConfig.transform,
      });
      const outsideInitialsWidthMm = nameSplit.outsideInitials
        ? await measureTextWidthMm({
            text: nameSplit.outsideInitials,
            fontFamily: mainTextConfig.fontFamily || 'Massallera',
            fontSizePt: effectiveFontSizePt,
            fontWeight: mainTextConfig.fontWeight,
            fontStyle: mainTextConfig.fontStyle,
            letterSpacingMm: mainTextConfig.letterSpacingMm,
            transform: mainTextConfig.transform,
          })
        : 0;

      const nameBoxTotalWidthMm = (mainTextConfig.boxWidthMm ? mainTextConfig.boxWidthMm : (boxTextWidthMm + nameBoxPaddingLeftMm + nameBoxPaddingRightMm + (nameBoxBorderWidthMm * 2))) + (outsideInitialsWidthMm > 0 ? outsideInitialsWidthMm + 2 : 0);
      const totalPaddingMm = (template.padding.leftMm || 4) + (template.padding.rightMm || 4);
      effectiveWidthMm = Math.max(template.widthMm || 45, Math.ceil(nameBoxTotalWidthMm + numberWidthForNameMm + totalPaddingMm));
    }
  } else if (template.rectangleMode === 'auto' && mainTextConfig.visible) {
    // Mode 1: Auto Width — Label expands dynamically so NOTHING is cut off!
    const rawName = record.firstName || record.overrides?.displayText || record.displayText || record.fullName;
    const surnameText = record.surnames || '';
    const nameSplit = parseNameAndInitials(rawName, surnameText, mainTextConfig.surnameDisplayMode || 'outside_initials');
    const boxTextWidthMm = await measureTextWidthMm({
      text: nameSplit.firstName,
      fontFamily: mainTextConfig.fontFamily || 'Massallera',
      fontSizePt: effectiveFontSizePt,
      fontWeight: mainTextConfig.fontWeight,
      fontStyle: mainTextConfig.fontStyle,
      letterSpacingMm: mainTextConfig.letterSpacingMm,
      transform: mainTextConfig.transform,
    });
    const outsideInitialsWidthMm = nameSplit.outsideInitials
      ? await measureTextWidthMm({
          text: nameSplit.outsideInitials,
          fontFamily: mainTextConfig.fontFamily || 'Massallera',
          fontSizePt: effectiveFontSizePt,
          fontWeight: mainTextConfig.fontWeight,
          fontStyle: mainTextConfig.fontStyle,
          letterSpacingMm: mainTextConfig.letterSpacingMm,
          transform: mainTextConfig.transform,
        })
      : 0;

    const nameBoxTotalWidthMm = (mainTextConfig.boxWidthMm ? mainTextConfig.boxWidthMm : (boxTextWidthMm + nameBoxPaddingLeftMm + nameBoxPaddingRightMm + (nameBoxBorderWidthMm * 2))) + (outsideInitialsWidthMm > 0 ? outsideInitialsWidthMm + 2 : 0);

    let visibleElementCount = 0;
    if (numberWidthMm > 0) visibleElementCount++;
    if (photoWidthMm > 0) visibleElementCount++;
    if (nameBoxTotalWidthMm > 0) visibleElementCount++;
    if (drawingWidthMm > 0) visibleElementCount++;

    const totalGapsMm = Math.max(0, visibleElementCount - 1) * gapMm;
    const totalPaddingMm = (template.padding.leftMm || 4) + (template.padding.rightMm || 4);

    const calculatedTotalWidthMm =
      numberWidthMm +
      photoWidthMm +
      nameBoxTotalWidthMm +
      drawingWidthMm +
      totalGapsMm +
      totalPaddingMm;

    effectiveWidthMm = Math.max(30, Math.ceil(calculatedTotalWidthMm));
  } else if (template.rectangleMode === 'fixed' && mainTextConfig.visible) {
    // Mode 2: Fixed Width — Auto-shrink font size so text fits 100% inside fixed label!
    const availableForNameBoxMm =
      template.widthMm -
      numberWidthMm -
      photoWidthMm -
      drawingWidthMm -
      (gapMm * 3) -
      (template.padding.leftMm || 4) -
      (template.padding.rightMm || 4);

    const availableTextMm = availableForNameBoxMm - nameBoxPaddingLeftMm - nameBoxPaddingRightMm - (nameBoxBorderWidthMm * 2);

    const fittedFontSizePt = calculateFitFontSize(
      textToShow,
      mainTextConfig.fontFamily || 'Massallera',
      Math.max(10, availableTextMm),
      effectiveFontSizePt,
      8 // Min font size
    );

    if (fittedFontSizePt < effectiveFontSizePt) {
      effectiveFontSizePt = fittedFontSizePt;
    }
  }

  return {
    widthMm: effectiveWidthMm,
    heightMm: labelHeightMm,
    mainTextFontSizePt: effectiveFontSizePt,
    numberShapeSizeMm,
    drawingShapeSizeMm,
    isOverflow,
  };
}

export function autoAssignDrawings(
  records: RecordItem[],
  availableDrawingUrls: string[],
  options: { mode: 'order' | 'random'; allowRepeats: boolean }
): RecordItem[] {
  if (availableDrawingUrls.length === 0) return records;

  let pool = [...availableDrawingUrls];
  if (options.mode === 'random') {
    pool = pool.sort(() => Math.random() - 0.5);
  }

  return records.map((record, index) => {
    let assignedUrl: string;
    if (options.allowRepeats) {
      assignedUrl = pool[index % pool.length];
    } else {
      assignedUrl = pool[index] || pool[index % pool.length];
    }

    return {
      ...record,
      drawingUrl: assignedUrl,
    };
  });
}

export function detectRecordIssues(
  template: LabelTemplate,
  record: RecordItem,
  dimensions: ResolvedLabelDimensions
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const textToShow = record.overrides?.displayText || record.displayText || record.fullName;

  if (dimensions.isOverflow) {
    issues.push({
      recordId: record.id,
      recordName: textToShow,
      type: 'overflow_text',
      message: `El texto "${textToShow}" supera el ancho fijo de la etiqueta (${template.widthMm}mm).`,
      severity: 'warning',
    });
  }

  if (dimensions.mainTextFontSizePt < 9) {
    issues.push({
      recordId: record.id,
      recordName: textToShow,
      type: 'small_font',
      message: `El tamaño de letra (${dimensions.mainTextFontSizePt}pt) se ha reducido para caber en la etiqueta.`,
      severity: 'warning',
    });
  }

  return issues;
}

export function estimateRecordWidthMm(template: LabelTemplate, record: RecordItem): number {
  const rawName = record.firstName || record.overrides?.displayText || record.displayText || record.fullName || '';
  const surnameText = record.surnames || '';
  const fontSizePt = record.overrides?.customFontSizePt || template.elements.mainText.fontSizePt || 20;
  const mainTextConfig = template.elements.mainText;

  const nameSplit = parseNameAndInitials(rawName, surnameText, mainTextConfig.surnameDisplayMode || 'outside_initials');
  // Realistic character width for school cursive/handwritten fonts (Massallera) is ~0.46 * fontSizePt
  const approxCharWidthMm = fontSizePt * 0.46;
  const boxTextWidthMm = Math.max(10, nameSplit.firstName.length * approxCharWidthMm);
  const outsideInitialsWidthMm = nameSplit.outsideInitials ? (nameSplit.outsideInitials.length * approxCharWidthMm + 3) : 0;

  const nameBoxPaddingLeftMm = mainTextConfig.paddingLeftMm ?? 6;
  const nameBoxPaddingRightMm = mainTextConfig.paddingRightMm ?? 6;
  const nameBoxBorderWidthMm = mainTextConfig.boxBorderWidthMm ?? 1.5;

  const nameBoxTotalWidthMm = (mainTextConfig.boxWidthMm ? mainTextConfig.boxWidthMm : (boxTextWidthMm + nameBoxPaddingLeftMm + nameBoxPaddingRightMm + (nameBoxBorderWidthMm * 2))) + outsideInitialsWidthMm;

  const isVerticalLayout =
    template.layoutPreset === 'medalla_circular' ||
    template.layoutPreset === 'foto_arriba_nombre_abajo';

  if (isVerticalLayout) {
    const totalPaddingMm = (template.padding.leftMm || 4) + (template.padding.rightMm || 4);
    return Math.max(template.widthMm || 45, Math.ceil(nameBoxTotalWidthMm + totalPaddingMm));
  }

  const labelHeightMm = template.heightMm || 24;
  const topPadMm = template.padding.topMm ?? 3;
  const bottomPadMm = template.padding.bottomMm ?? 3;
  const innerHeightMm = Math.max(10, labelHeightMm - topPadMm - bottomPadMm);

  const numberShapeSizeMm = template.elements.number.shapeSizeMm || Math.round(innerHeightMm * 0.75);
  const drawingShapeSizeMm = template.elements.drawing.shapeSizeMm || Math.round(innerHeightMm * 0.85);

  let numberWidthMm = 0;
  if (template.elements.number.visible && !record.overrides?.hideNumber) {
    numberWidthMm = numberShapeSizeMm;
  }

  let photoWidthMm = 0;
  if (template.elements.photo.visible) {
    photoWidthMm = Math.round(innerHeightMm * 0.85);
  }

  let drawingWidthMm = 0;
  if (template.elements.drawing.visible && (record.drawingUrl || template.elements.drawing.url)) {
    drawingWidthMm = drawingShapeSizeMm;
  }

  let visibleElementCount = 0;
  if (numberWidthMm > 0) visibleElementCount++;
  if (photoWidthMm > 0) visibleElementCount++;
  if (nameBoxTotalWidthMm > 0) visibleElementCount++;
  if (drawingWidthMm > 0) visibleElementCount++;

  const gapMm = 3;
  const totalGapsMm = Math.max(0, visibleElementCount - 1) * gapMm;
  const totalPaddingMm = (template.padding.leftMm || 4) + (template.padding.rightMm || 4);

  const calculatedTotalWidthMm =
    numberWidthMm +
    photoWidthMm +
    nameBoxTotalWidthMm +
    drawingWidthMm +
    totalGapsMm +
    totalPaddingMm;

  return Math.max(30, Math.ceil(calculatedTotalWidthMm));
}

export interface PageLayoutData {
  pageIndex: number;
  records: RecordItem[];
}

export function packRecordsSmartly(
  records: RecordItem[],
  template: LabelTemplate,
  printableWidthMm: number
): RecordItem[] {
  if (records.length <= 1) return records;

  // Group records into distinct sets if records repeat (e.g. 1..N, 1..N)
  const sets: RecordItem[][] = [];
  let currentSet: RecordItem[] = [];

  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    if (currentSet.length > 0 && rec.listNumber === 1 && currentSet[0].listNumber === 1) {
      sets.push(currentSet);
      currentSet = [rec];
    } else {
      currentSet.push(rec);
    }
  }
  if (currentSet.length > 0) {
    sets.push(currentSet);
  }

  // Pack each set individually to keep sets intact and avoid cross-set scrambling
  const packedResult: RecordItem[] = [];
  for (const setRecords of sets) {
    const packedSet = packSingleSetSmartly(setRecords, template, printableWidthMm);
    packedResult.push(...packedSet);
  }

  return packedResult;
}

function packSingleSetSmartly(
  records: RecordItem[],
  template: LabelTemplate,
  printableWidthMm: number
): RecordItem[] {
  if (records.length <= 1) return records;

  const unplaced = records.map((r) => ({
    record: r,
    widthMm: estimateRecordWidthMm(template, r),
  }));

  const packed: RecordItem[] = [];

  while (unplaced.length > 0) {
    unplaced.sort((a, b) => b.widthMm - a.widthMm);

    const anchor = unplaced.splice(0, 1)[0];
    packed.push(anchor.record);

    let currentSum = anchor.widthMm;

    while (unplaced.length > 0) {
      const remainingW = printableWidthMm - currentSum - 1.5;
      if (remainingW <= 12) break;

      let bestIndex = -1;
      let bestFitWidth = -1;

      for (let i = 0; i < unplaced.length; i++) {
        const itemW = unplaced[i].widthMm;
        if (itemW <= remainingW) {
          if (itemW > bestFitWidth) {
            bestFitWidth = itemW;
            bestIndex = i;
          }
        }
      }

      if (bestIndex !== -1) {
        const bestItem = unplaced.splice(bestIndex, 1)[0];
        packed.push(bestItem.record);
        currentSum += bestItem.widthMm;
      } else {
        break;
      }
    }
  }

  return packed;
}

export function paginateRecordsForSheet(
  records: RecordItem[],
  template: LabelTemplate,
  printSettings: {
    orientation: 'portrait' | 'landscape';
    marginTopMm?: number;
    marginBottomMm?: number;
    marginLeftMm?: number;
    marginRightMm?: number;
    gridCols?: number;
    gridRows?: number;
    smartPacking?: boolean;
  }
): PageLayoutData[] {
  const isPortrait = printSettings.orientation === 'portrait';
  const paperWidthMm = isPortrait ? 210 : 297;
  const paperHeightMm = isPortrait ? 297 : 210;

  const marginTopMm = printSettings.marginTopMm ?? 0;
  const marginBottomMm = printSettings.marginBottomMm ?? 0;
  const marginLeftMm = printSettings.marginLeftMm ?? 0;
  const marginRightMm = printSettings.marginRightMm ?? 0;

  const printableWidthMm = paperWidthMm - (marginLeftMm + marginRightMm);
  const printableHeightMm = paperHeightMm - (marginTopMm + marginBottomMm);

  const cellHeightMm = Math.max(10, template.heightMm || 20);
  // Strictly bound maxRowsPerPage to what fits inside printableHeightMm with a 2mm safety buffer
  const maxRowsPerPage = Math.max(1, Math.floor((printableHeightMm - 2) / cellHeightMm));

  let recordsToProcess = records;
  if (printSettings.smartPacking && template.rectangleMode === 'auto') {
    recordsToProcess = packRecordsSmartly(records, template, printableWidthMm);
  }

  if (template.rectangleMode === 'fixed') {
    const cols = printSettings.gridCols || (isPortrait ? 3 : 4);
    const itemsPerPage = cols * maxRowsPerPage;
    const pages: PageLayoutData[] = [];
    const totalPages = Math.ceil(recordsToProcess.length / itemsPerPage) || 1;

    for (let p = 0; p < totalPages; p++) {
      pages.push({
        pageIndex: p,
        records: recordsToProcess.slice(p * itemsPerPage, (p + 1) * itemsPerPage),
      });
    }
    return pages;
  }

  // AUTO WIDTH MODE: Flow packager
  const pages: PageLayoutData[] = [];
  let currentPageItems: RecordItem[] = [];
  let currentRowWidth = 0;
  let currentRowsCount = 1;
  let pageIdx = 0;

  for (let i = 0; i < recordsToProcess.length; i++) {
    const rec = recordsToProcess[i];
    const recWidthMm = estimateRecordWidthMm(template, rec);

    let willFitCurrentRow = true;
    // Leave 1.5mm safety buffer so browser DOM flexbox never wraps earlier than estimated
    if (currentRowWidth > 0 && (currentRowWidth + recWidthMm > printableWidthMm - 1.5)) {
      willFitCurrentRow = false;
    }

    if (!willFitCurrentRow) {
      if (currentRowsCount + 1 > maxRowsPerPage) {
        pages.push({
          pageIndex: pageIdx,
          records: currentPageItems,
        });
        pageIdx++;
        currentPageItems = [rec];
        currentRowWidth = recWidthMm;
        currentRowsCount = 1;
      } else {
        currentRowsCount++;
        currentRowWidth = recWidthMm;
        currentPageItems.push(rec);
      }
    } else {
      currentPageItems.push(rec);
      currentRowWidth += recWidthMm;
    }
  }

  if (currentPageItems.length > 0 || pages.length === 0) {
    pages.push({
      pageIndex: pageIdx,
      records: currentPageItems,
    });
  }

  return pages;
}

export interface SmartPackingResult {
  optimizedRecords: RecordItem[];
  bestOrientation: 'portrait' | 'landscape';
  bestCols: number;
  totalPagesBefore: number;
  totalPagesAfter: number;
  savingsPercent: number;
}

/**
 * 2D Bin Packing Optimization algorithm for sheet layout
 * Maximize label density on A4 sheet by re-ordering labels and choosing optimal orientation
 */
export function optimizeSmartRecordPlacement(
  records: RecordItem[],
  template: LabelTemplate,
  printSettings: any
): SmartPackingResult {
  const initialPages = paginateRecordsForSheet(records, template, printSettings);
  const totalPagesBefore = initialPages.length;

  const isPortrait = printSettings.orientation === 'portrait';
  const paperW = isPortrait ? 210 : 297;
  const printableW = paperW - ((printSettings.marginLeftMm || 0) + (printSettings.marginRightMm || 0));

  const packedRecords = packRecordsSmartly(records, template, printableW);

  const testPortraitPages = paginateRecordsForSheet(packedRecords, template, { ...printSettings, orientation: 'portrait', smartPacking: true });
  const testLandscapePages = paginateRecordsForSheet(packedRecords, template, { ...printSettings, orientation: 'landscape', smartPacking: true });

  let bestOrientation: 'portrait' | 'landscape' = printSettings.orientation;
  let totalPagesAfter = totalPagesBefore;

  if (testPortraitPages.length <= testLandscapePages.length) {
    bestOrientation = 'portrait';
    totalPagesAfter = testPortraitPages.length;
  } else {
    bestOrientation = 'landscape';
    totalPagesAfter = testLandscapePages.length;
  }

  let bestCols = printSettings.gridCols;
  if (template.rectangleMode === 'fixed') {
    const pW = bestOrientation === 'portrait' ? 210 : 297;
    const pPrintableW = pW - ((printSettings.marginLeftMm || 0) + (printSettings.marginRightMm || 0));
    bestCols = Math.max(1, Math.floor(pPrintableW / template.widthMm));
  }

  const savingsPercent = totalPagesBefore > 0
    ? Math.max(0, Math.round(((totalPagesBefore - totalPagesAfter) / totalPagesBefore) * 100))
    : 0;

  return {
    optimizedRecords: packedRecords,
    bestOrientation,
    bestCols,
    totalPagesBefore,
    totalPagesAfter,
    savingsPercent,
  };
}

/**
 * Calculates the exact label height (heightMm) that fills 100% of the A4 paper height without leaving blank space at the bottom
 */
export function calculateOptimalHeightForFullSheet(
  template: LabelTemplate,
  printSettings: any
): number {
  const isPortrait = printSettings.orientation === 'portrait';
  const paperHeightMm = isPortrait ? 297 : 210;
  const marginTopMm = printSettings.marginTopMm ?? 0;
  const marginBottomMm = printSettings.marginBottomMm ?? 0;
  const availableHeightMm = paperHeightMm - marginTopMm - marginBottomMm;

  const currentHeight = Math.max(10, template.heightMm || 20);
  const rows = Math.max(1, Math.round(availableHeightMm / currentHeight));
  const optimalHeight = Math.floor((availableHeightMm / rows) * 10) / 10;

  return Math.max(10, Math.min(150, optimalHeight));
}

