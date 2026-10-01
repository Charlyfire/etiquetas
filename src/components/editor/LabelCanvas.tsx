import React, { useEffect, useState } from 'react';
import type { LabelTemplate, RecordItem } from '../../types';
import { calculateLabelDimensions, type ResolvedLabelDimensions } from '../../engine/compositionEngine';
import { mmToPx, applyTextTransform, parseNameAndInitials } from '../../utils/textMetrics';

interface LabelCanvasProps {
  template: LabelTemplate;
  record: RecordItem;
  zoomLevel: number; // 0.5 to 2.0
  selectedElementKey: string | null;
  onSelectElement: (elementKey: string | null) => void;
  onUpdateTemplateElements?: (updatedElements: LabelTemplate['elements']) => void;
}

function getPatternBackgroundStyle(pattern?: string, patternColor: string = '#fbbf24'): React.CSSProperties {
  if (!pattern || pattern === 'none') return {};
  const encodedColor = encodeURIComponent(patternColor);
  switch (pattern) {
    case 'estrellas':
      return {
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24'%3E%3Cpath fill='${encodedColor}' opacity='0.38' d='M12 2l2.4 4.8 5.3.8-3.8 3.7.9 5.3-4.8-2.5-4.8 2.5.9-5.3-3.8-3.7 5.3-.8z'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
      };
    case 'pompas':
      return {
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 44 44'%3E%3Ccircle cx='12' cy='12' r='7' fill='%2360a5fa' opacity='0.28'/%3E%3Ccircle cx='34' cy='28' r='10' fill='%23a78bfa' opacity='0.24'/%3E%3Ccircle cx='22' cy='38' r='5' fill='%23f472b6' opacity='0.28'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
      };
    case 'lunares':
      return {
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Ccircle cx='10' cy='10' r='3.5' fill='${encodedColor}' opacity='0.32'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
      };
    case 'rayos_medalla':
      return {
        background: `conic-gradient(from 0deg at 50% 50%, rgba(234, 179, 8, 0.25) 0deg 15deg, transparent 15deg 30deg, rgba(234, 179, 8, 0.25) 30deg 45deg, transparent 45deg 60deg, rgba(234, 179, 8, 0.25) 60deg 75deg, transparent 75deg 90deg, rgba(234, 179, 8, 0.25) 90deg 105deg, transparent 105deg 120deg, rgba(234, 179, 8, 0.25) 120deg 135deg, transparent 135deg 150deg, rgba(234, 179, 8, 0.25) 150deg 165deg, transparent 165deg 180deg, rgba(234, 179, 8, 0.25) 180deg 195deg, transparent 195deg 210deg, rgba(234, 179, 8, 0.25) 210deg 225deg, transparent 225deg 240deg, rgba(234, 179, 8, 0.25) 240deg 255deg, transparent 255deg 270deg, rgba(234, 179, 8, 0.25) 270deg 285deg, transparent 285deg 300deg, rgba(234, 179, 8, 0.25) 300deg 315deg, transparent 315deg 330deg, rgba(234, 179, 8, 0.25) 330deg 345deg, transparent 345deg 360deg)`,
      };
    case 'corazones':
      return {
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24'%3E%3Cpath fill='%23f43f5e' opacity='0.28' d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
      };
    case 'ondas':
      return {
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='20' viewBox='0 0 40 20'%3E%3Cpath fill='none' stroke='${encodedColor}' stroke-width='2' opacity='0.35' d='M0 10 Q10 0, 20 10 T40 10'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
      };
    case 'lineas':
      return {
        background: `repeating-linear-gradient(45deg, rgba(99, 102, 241, 0.12), rgba(99, 102, 241, 0.12) 10px, transparent 10px, transparent 20px)`,
      };
    default:
      return {};
  }
}

export const LabelCanvas: React.FC<LabelCanvasProps> = ({
  template,
  record,
  zoomLevel = 1.0,
  selectedElementKey,
  onSelectElement,
}) => {
  const [dimensions, setDimensions] = useState<ResolvedLabelDimensions>({
    widthMm: template.widthMm,
    heightMm: template.heightMm,
    mainTextFontSizePt: template.elements.mainText.fontSizePt,
    numberShapeSizeMm: 16,
    drawingShapeSizeMm: 18,
    isOverflow: false,
  });

  useEffect(() => {
    let isMounted = true;
    calculateLabelDimensions(template, record).then((res) => {
      if (isMounted) {
        setDimensions(res);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [template, record]);

  const containerWidthPx = mmToPx(dimensions.widthMm) * zoomLevel;
  const containerHeightPx = mmToPx(dimensions.heightMm) * zoomLevel;

  const textToShow = record.firstName || record.overrides?.displayText || record.displayText || record.fullName;
  const surnameText = record.surnames || '';
  const secondTextToShow = record.secondText || '';
  const nameSplit = parseNameAndInitials(
    textToShow,
    surnameText,
    template.elements.mainText.surnameDisplayMode || 'outside_initials'
  );
  const drawingUrl = record.drawingUrl || template.elements.drawing.url;
  const photoUrl = record.photoUrl || template.elements.photo.url;

  // MARCO 1: GROSOR BORDE ETIQUETA GENERAL
  const borderPx = mmToPx(template.border.widthMm || 1.2) * zoomLevel;
  const borderRadiusPx = mmToPx(template.border.radiusMm || 4) * zoomLevel;

  let bgStyle = template.backgroundColor;
  if (template.layoutPreset === 'numero_nombre_dibujo' && template.backgroundColor === '#ffffff') {
    bgStyle = record.listNumber % 2 === 0 ? '#dbeafe' : '#e0e7ff';
  }

  // MARCO 2: MARCO DEL NÚMERO (GROSOR Y BORDE)
  const numConfig = template.elements.number;
  const numFontFamily = numConfig.fontFamily || 'Massallera';
  const numShapeSizePx = mmToPx(dimensions.numberShapeSizeMm) * zoomLevel;
  const numBorderPx = mmToPx(numConfig.shapeBorderWidthMm ?? 1.5) * zoomLevel;
  const numBorderColor = numConfig.shapeBorderColor || '#0f172a';
  const numBgColor = numConfig.shapeBackgroundColor || '#ffffff';

  // MARCO 3: MARCO DEL NOMBRE (GROSOR Y BORDE DE CAJA BLANCA)
  const mainTextConfig = template.elements.mainText;
  const nameFontFamily = mainTextConfig.fontFamily || 'Massallera';
  const nameBoxBg = mainTextConfig.boxBackgroundColor || '#ffffff';
  const nameBoxBorderColor = mainTextConfig.boxBorderColor || '#0f172a';
  const nameBoxBorderPx = mmToPx(mainTextConfig.boxBorderWidthMm ?? 1.5) * zoomLevel;
  const nameBoxRadiusPx = mmToPx(mainTextConfig.boxBorderRadiusMm || 2) * zoomLevel;
  const nameBoxPaddingLeftPx = mmToPx(mainTextConfig.paddingLeftMm || 6) * zoomLevel;
  const nameBoxPaddingRightPx = mmToPx(mainTextConfig.paddingRightMm || 6) * zoomLevel;

  // MARCO 4: MARCO DEL DIBUJO (GROSOR Y BORDE DEL DIBUJO)
  const drawingConfig = template.elements.drawing;
  const drawingShapeSizePx = mmToPx(dimensions.drawingShapeSizeMm) * zoomLevel;
  const drawingBorderPx = mmToPx(drawingConfig.shapeBorderWidthMm ?? 1.5) * zoomLevel;
  const drawingBgColor = drawingConfig.shapeBackgroundColor || '#ffffff';
  const drawingBorderColor = drawingConfig.shapeBorderColor || '#0f172a';
  const drawingRadiusPx =
    drawingConfig.shape === 'circle'
      ? '50%'
      : drawingConfig.shape === 'rounded_rectangle' || drawingConfig.shape === 'none'
      ? `${mmToPx(drawingConfig.shapeBorderRadiusMm || 3) * zoomLevel}px`
      : `${mmToPx(2) * zoomLevel}px`;

  const isMedal = template.layoutPreset === 'medalla_circular';
  const isPhotoTop = template.layoutPreset === 'foto_arriba_nombre_abajo';

  return (
    <div className="canvas-wrapper" onClick={() => onSelectElement(null)}>
      {/* MARCO 1: ETIQUETA GENERAL */}
      <div
        className={`label-container ${template.rectangleMode === 'auto' ? 'mode-auto-width' : ''}`}
        style={{
          width: `${containerWidthPx}px`,
          height: `${containerHeightPx}px`,
          backgroundColor: bgStyle,
          border: template.border.enabled ? `${borderPx}px ${template.border.style} ${template.border.color}` : 'none',
          borderRadius: isMedal ? '50%' : `${borderRadiusPx}px`,
          padding: `${mmToPx(template.padding.topMm || 2) * zoomLevel}px ${mmToPx(template.padding.rightMm || 2) * zoomLevel}px ${mmToPx(template.padding.bottomMm || 2) * zoomLevel}px ${mmToPx(template.padding.leftMm || 2) * zoomLevel}px`,
          position: 'relative',
          boxSizing: 'border-box',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: isMedal || isPhotoTop ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: template.layoutPreset === 'custom' ? 'unset' : 'center',
          gap: `${mmToPx(2) * zoomLevel}px`,
          boxShadow: isMedal ? '0 4px 12px rgba(202, 138, 4, 0.25)' : 'none',
        }}
      >
        {/* Background Pattern Layer */}
        {template.backgroundPattern && template.backgroundPattern !== 'none' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: isMedal ? '50%' : `${borderRadiusPx}px`,
              pointerEvents: 'none',
              zIndex: 0,
              ...getPatternBackgroundStyle(template.backgroundPattern, template.backgroundPatternColor),
            }}
          />
        )}

        {/* Custom Uploaded Background Image Layer */}
        {template.backgroundImageUrl && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: isMedal ? '50%' : `${borderRadiusPx}px`,
              backgroundImage: `url("${template.backgroundImageUrl}")`,
              backgroundSize: template.backgroundImageFit || 'cover',
              backgroundPosition: 'center center',
              backgroundRepeat: template.backgroundImageFit === 'tile' ? 'repeat' : 'no-repeat',
              opacity: template.backgroundImageOpacity ?? 1.0,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        )}
        {isMedal ? (
          /* PRESET: MEDALLA CIRCULAR */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', gap: `${mmToPx(1.5) * zoomLevel}px` }}>
            {/* Number (Top Badge) */}
            {numConfig.visible && !record.overrides?.hideNumber && (
              <div
                className={`label-element element-number ${selectedElementKey === 'number' ? 'element-selected' : ''}`}
                onClick={(e) => { e.stopPropagation(); onSelectElement('number'); }}
                style={{ zIndex: numConfig.zIndex, flexShrink: 0 }}
              >
                <div
                  style={{
                    width: `${mmToPx(dimensions.numberShapeSizeMm || 12) * zoomLevel}px`,
                    height: `${mmToPx(dimensions.numberShapeSizeMm || 12) * zoomLevel}px`,
                    backgroundColor: numBgColor,
                    border: `${numBorderPx}px solid ${numBorderColor}`,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: `"${numFontFamily}", sans-serif`,
                    fontSize: `${numConfig.fontSizePt * zoomLevel * 1.2}px`,
                    fontWeight: numConfig.fontWeight,
                    color: numConfig.color || '#1e293b',
                    boxSizing: 'border-box',
                  }}
                >
                  {record.listNumber}
                </div>
              </div>
            )}

            {/* Center Image/Drawing or Photo */}
            {drawingConfig.visible && drawingUrl ? (
              <div
                className={`label-element element-drawing ${selectedElementKey === 'drawing' ? 'element-selected' : ''}`}
                onClick={(e) => { e.stopPropagation(); onSelectElement('drawing'); }}
                style={{
                  width: `${mmToPx(dimensions.drawingShapeSizeMm || 18) * zoomLevel}px`,
                  height: `${mmToPx(dimensions.drawingShapeSizeMm || 18) * zoomLevel}px`,
                  backgroundColor: drawingBgColor,
                  border: `${drawingBorderPx}px solid ${drawingBorderColor}`,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  zIndex: drawingConfig.zIndex,
                  flexShrink: 0,
                  boxSizing: 'border-box',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url("${drawingUrl}")`,
                    backgroundSize: 'contain',
                    backgroundPosition: 'center center',
                    backgroundRepeat: 'no-repeat',
                  }}
                />
              </div>
            ) : template.elements.photo.visible ? (
              <div
                className={`label-element element-photo ${selectedElementKey === 'photo' ? 'element-selected' : ''}`}
                onClick={(e) => { e.stopPropagation(); onSelectElement('photo'); }}
                style={{
                  width: `${mmToPx(dimensions.heightMm * 0.45) * zoomLevel}px`,
                  height: `${mmToPx(dimensions.heightMm * 0.45) * zoomLevel}px`,
                  backgroundColor: '#f1f5f9',
                  borderRadius: '50%',
                  border: `${mmToPx(1.2) * zoomLevel}px solid ${template.elements.photo.borderColor || '#ca8a04'}`,
                  overflow: 'hidden',
                  zIndex: template.elements.photo.zIndex,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxSizing: 'border-box',
                }}
              >
                {photoUrl ? (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundImage: `url("${photoUrl}")`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center center',
                      backgroundRepeat: 'no-repeat',
                      transform: `scale(${template.elements.photo.cropZoom || 1})`,
                    }}
                  />
                ) : (
                  <div style={{ color: '#64748b', fontSize: `${9 * zoomLevel}px`, fontWeight: 'bold' }}>👤 FOTO</div>
                )}
              </div>
            ) : null}

            {/* Bottom Name Box */}
            {mainTextConfig.visible && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: `${mmToPx(1.5) * zoomLevel}px`, maxWidth: '94%' }}>
                <div
                  className={`label-element element-text ${selectedElementKey === 'mainText' ? 'element-selected' : ''}`}
                  onClick={(e) => { e.stopPropagation(); onSelectElement('mainText'); }}
                  style={{
                    backgroundColor: nameBoxBg,
                    border: nameBoxBorderPx > 0 ? `${nameBoxBorderPx}px solid ${nameBoxBorderColor}` : 'none',
                    borderRadius: `${nameBoxRadiusPx}px`,
                    padding: `${mmToPx(1) * zoomLevel}px ${nameBoxPaddingRightPx}px ${mmToPx(1) * zoomLevel}px ${nameBoxPaddingLeftPx}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: `"${nameFontFamily}", sans-serif`,
                    fontSize: `${(mainTextConfig.fontSizePt || dimensions.mainTextFontSizePt) * zoomLevel * 1.2}px`,
                    fontWeight: mainTextConfig.fontWeight,
                    fontStyle: mainTextConfig.fontStyle,
                    color: mainTextConfig.color || '#0f172a',
                    whiteSpace: 'nowrap',
                    zIndex: mainTextConfig.zIndex,
                    userSelect: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  {applyTextTransform(nameSplit.firstName, mainTextConfig.transform)}
                </div>
                {nameSplit.outsideInitials ? (
                  <span
                    style={{
                      fontFamily: `"${nameFontFamily}", sans-serif`,
                      fontSize: `${(mainTextConfig.fontSizePt || dimensions.mainTextFontSizePt) * zoomLevel * 1.1}px`,
                      fontWeight: mainTextConfig.fontWeight,
                      fontStyle: mainTextConfig.fontStyle,
                      color: mainTextConfig.color || '#0f172a',
                      whiteSpace: 'nowrap',
                      userSelect: 'none',
                    }}
                  >
                    {nameSplit.outsideInitials}
                  </span>
                ) : null}
              </div>
            )}
          </div>
        ) : isPhotoTop ? (
          /* PRESET: FOTO ARRIBA + NOMBRE ABAJO */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', width: '100%', height: '100%', gap: `${mmToPx(2) * zoomLevel}px` }}>
            {/* Top Photo / Image */}
            {template.elements.photo.visible ? (
              <div
                className={`label-element element-photo ${selectedElementKey === 'photo' ? 'element-selected' : ''}`}
                onClick={(e) => { e.stopPropagation(); onSelectElement('photo'); }}
                style={{
                  width: `${mmToPx(dimensions.heightMm * 0.52) * zoomLevel}px`,
                  height: `${mmToPx(dimensions.heightMm * 0.52) * zoomLevel}px`,
                  backgroundColor: '#f1f5f9',
                  borderRadius: `${mmToPx(template.elements.photo.borderRadiusMm || 3) * zoomLevel}px`,
                  border: `${mmToPx(template.elements.photo.borderWidthMm || 1.2) * zoomLevel}px solid ${template.elements.photo.borderColor || '#0f172a'}`,
                  overflow: 'hidden',
                  zIndex: template.elements.photo.zIndex,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxSizing: 'border-box',
                  marginTop: `${mmToPx(1) * zoomLevel}px`,
                }}
              >
                {photoUrl ? (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundImage: `url("${photoUrl}")`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center center',
                      backgroundRepeat: 'no-repeat',
                      transform: `scale(${template.elements.photo.cropZoom || 1})`,
                    }}
                  />
                ) : (
                  <div style={{ color: '#64748b', fontSize: `${9 * zoomLevel}px`, fontWeight: 'bold' }}>👤 FOTO</div>
                )}
              </div>
            ) : drawingConfig.visible && drawingUrl ? (
              <div
                className={`label-element element-drawing ${selectedElementKey === 'drawing' ? 'element-selected' : ''}`}
                onClick={(e) => { e.stopPropagation(); onSelectElement('drawing'); }}
                style={{
                  width: `${drawingShapeSizePx}px`,
                  height: `${drawingShapeSizePx}px`,
                  backgroundColor: drawingBgColor,
                  border: `${drawingBorderPx}px solid ${drawingBorderColor}`,
                  borderRadius: drawingRadiusPx,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  zIndex: drawingConfig.zIndex,
                  flexShrink: 0,
                  boxSizing: 'border-box',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url("${drawingUrl}")`,
                    backgroundSize: 'contain',
                    backgroundPosition: 'center center',
                    backgroundRepeat: 'no-repeat',
                  }}
                />
              </div>
            ) : null}

            {/* Bottom Row: Number + Name */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: `${mmToPx(2) * zoomLevel}px`, width: '100%', marginBottom: `${mmToPx(1) * zoomLevel}px` }}>
              {numConfig.visible && !record.overrides?.hideNumber && (
                <div
                  className={`label-element element-number ${selectedElementKey === 'number' ? 'element-selected' : ''}`}
                  onClick={(e) => { e.stopPropagation(); onSelectElement('number'); }}
                  style={{ zIndex: numConfig.zIndex, flexShrink: 0 }}
                >
                  <div
                    style={{
                      width: `${numShapeSizePx}px`,
                      height: `${numShapeSizePx}px`,
                      backgroundColor: numBgColor,
                      border: `${numBorderPx}px solid ${numBorderColor}`,
                      borderRadius: numConfig.shape === 'circle' ? '50%' : `${mmToPx(numConfig.shapeBorderRadiusMm || 0) * zoomLevel}px`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: `"${numFontFamily}", sans-serif`,
                      fontSize: `${numConfig.fontSizePt * zoomLevel * 1.2}px`,
                      fontWeight: numConfig.fontWeight,
                      color: numConfig.color || '#1e293b',
                      boxSizing: 'border-box',
                    }}
                  >
                    {record.listNumber}
                  </div>
                </div>
              )}

              {mainTextConfig.visible && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: `${mmToPx(1.5) * zoomLevel}px` }}>
                  <div
                    className={`label-element element-text ${selectedElementKey === 'mainText' ? 'element-selected' : ''}`}
                    onClick={(e) => { e.stopPropagation(); onSelectElement('mainText'); }}
                    style={{
                      backgroundColor: nameBoxBg,
                      border: nameBoxBorderPx > 0 ? `${nameBoxBorderPx}px solid ${nameBoxBorderColor}` : 'none',
                      borderRadius: `${nameBoxRadiusPx}px`,
                      padding: `${mmToPx(1) * zoomLevel}px ${nameBoxPaddingRightPx}px ${mmToPx(1) * zoomLevel}px ${nameBoxPaddingLeftPx}px`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: `"${nameFontFamily}", sans-serif`,
                      fontSize: `${(mainTextConfig.fontSizePt || dimensions.mainTextFontSizePt) * zoomLevel * 1.2}px`,
                      fontWeight: mainTextConfig.fontWeight,
                      fontStyle: mainTextConfig.fontStyle,
                      color: mainTextConfig.color || '#0f172a',
                      whiteSpace: 'nowrap',
                      zIndex: mainTextConfig.zIndex,
                      userSelect: 'none',
                      boxSizing: 'border-box',
                    }}
                  >
                    {applyTextTransform(nameSplit.firstName, mainTextConfig.transform)}
                  </div>
                  {nameSplit.outsideInitials ? (
                    <span
                      style={{
                        fontFamily: `"${nameFontFamily}", sans-serif`,
                        fontSize: `${(mainTextConfig.fontSizePt || dimensions.mainTextFontSizePt) * zoomLevel * 1.1}px`,
                        fontWeight: mainTextConfig.fontWeight,
                        fontStyle: mainTextConfig.fontStyle,
                        color: mainTextConfig.color || '#0f172a',
                        whiteSpace: 'nowrap',
                        userSelect: 'none',
                      }}
                    >
                      {nameSplit.outsideInitials}
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* STANDARD HORIZONTAL PRESETS */
          <>
            {/* MARCO 2: MARCO DEL NÚMERO */}
            {numConfig.visible && !record.overrides?.hideNumber && (
              <div
                className={`label-element element-number ${selectedElementKey === 'number' ? 'element-selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectElement('number');
                }}
                style={{
                  position: template.layoutPreset === 'custom' ? 'absolute' : 'relative',
                  left: template.layoutPreset === 'custom' ? `${numConfig.xPercent}%` : undefined,
                  top: template.layoutPreset === 'custom' ? `${numConfig.yPercent}%` : undefined,
                  transform: `translate(${mmToPx(numConfig.offsetXmm) * zoomLevel}px, ${mmToPx(numConfig.offsetYmm) * zoomLevel}px)`,
                  zIndex: numConfig.zIndex,
                  flexShrink: 0,
                }}
              >
                <div
                  className={`number-shape shape-${numConfig.shape}`}
                  style={{
                    width: `${numShapeSizePx}px`,
                    height: `${numShapeSizePx}px`,
                    backgroundColor: numConfig.shape === 'none' ? 'transparent' : numBgColor,
                    border: numConfig.shape === 'none' || numConfig.shapeBorderWidthMm === 0 ? 'none' : `${numBorderPx}px solid ${numBorderColor}`,
                    borderRadius: numConfig.shape === 'circle' ? '50%' : `${mmToPx(numConfig.shapeBorderRadiusMm || 0) * zoomLevel}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: `"${numFontFamily}", sans-serif`,
                    fontSize: `${numConfig.fontSizePt * zoomLevel * 1.33}px`,
                    fontWeight: numConfig.fontWeight,
                    color: numConfig.color || '#1e293b',
                    boxSizing: 'border-box',
                  }}
                >
                  {record.listNumber}
                </div>
              </div>
            )}

            {/* MARCO DE FOTOGRAFÍA (Si está habilitada) */}
            {template.elements.photo.visible && (
              <div
                className={`label-element element-photo ${selectedElementKey === 'photo' ? 'element-selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectElement('photo');
                }}
                style={{
                  position: template.layoutPreset === 'custom' ? 'absolute' : 'relative',
                  left: template.layoutPreset === 'custom' ? `${template.elements.photo.xPercent}%` : undefined,
                  top: template.layoutPreset === 'custom' ? `${template.elements.photo.yPercent}%` : undefined,
                  width: `${mmToPx(dimensions.heightMm * 0.75) * zoomLevel}px`,
                  height: `${mmToPx(dimensions.heightMm * 0.75) * zoomLevel}px`,
                  backgroundColor: '#f1f5f9',
                  borderRadius: template.elements.photo.shape === 'circle' ? '50%' : `${mmToPx(template.elements.photo.borderRadiusMm || 3) * zoomLevel}px`,
                  border: `${mmToPx(template.elements.photo.borderWidthMm || 1.2) * zoomLevel}px solid ${template.elements.photo.borderColor || '#0f172a'}`,
                  overflow: 'hidden',
                  zIndex: template.elements.photo.zIndex,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxSizing: 'border-box',
                }}
              >
                {photoUrl ? (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundImage: `url("${photoUrl}")`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center center',
                      backgroundRepeat: 'no-repeat',
                      transform: `scale(${template.elements.photo.cropZoom || 1})`,
                    }}
                  />
                ) : (
                  <div style={{ color: '#64748b', fontSize: `${10 * zoomLevel}px`, fontWeight: 'bold', textAlign: 'center', lineHeight: 1 }}>
                    👤 FOTO
                  </div>
                )}
              </div>
            )}

            {/* MARCO 3: MARCO DEL NOMBRE + INICIALES FUERA DEL MARCO */}
            {mainTextConfig.visible && (
              <div
                style={{
                  position: template.layoutPreset === 'custom' ? 'absolute' : 'relative',
                  left: template.layoutPreset === 'custom' ? `${mainTextConfig.xPercent}%` : undefined,
                  top: template.layoutPreset === 'custom' ? `${mainTextConfig.yPercent}%` : undefined,
                  display: 'flex',
                  alignItems: 'center',
                  gap: `${mmToPx(1.5) * zoomLevel}px`,
                  transform: `translate(${mmToPx(mainTextConfig.offsetXmm) * zoomLevel}px, ${mmToPx(mainTextConfig.offsetYmm) * zoomLevel}px)`,
                  zIndex: mainTextConfig.zIndex,
                  flexShrink: 0,
                }}
              >
                <div
                  className={`label-element element-text ${selectedElementKey === 'mainText' ? 'element-selected' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectElement('mainText');
                  }}
                  style={{
                    width: mainTextConfig.boxWidthMm ? `${mmToPx(mainTextConfig.boxWidthMm) * zoomLevel}px` : undefined,
                    height: `${mmToPx(mainTextConfig.boxHeightMm || Math.round(dimensions.heightMm * 0.75)) * zoomLevel}px`,
                    backgroundColor: nameBoxBg,
                    border: mainTextConfig.boxBorderWidthMm === 0 ? 'none' : `${nameBoxBorderPx}px solid ${nameBoxBorderColor}`,
                    borderRadius: `${nameBoxRadiusPx}px`,
                    padding: `${mmToPx(1) * zoomLevel}px ${nameBoxPaddingRightPx}px ${mmToPx(1) * zoomLevel}px ${nameBoxPaddingLeftPx}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: `"${nameFontFamily}", sans-serif`,
                    fontSize: `${(mainTextConfig.fontSizePt || dimensions.mainTextFontSizePt) * zoomLevel * 1.33}px`,
                    fontWeight: mainTextConfig.fontWeight,
                    fontStyle: mainTextConfig.fontStyle,
                    color: mainTextConfig.color || '#0f172a',
                    letterSpacing: `${mmToPx(mainTextConfig.letterSpacingMm) * zoomLevel}px`,
                    lineHeight: mainTextConfig.lineHeight,
                    textAlign: mainTextConfig.alignHorizontal,
                    whiteSpace: 'nowrap',
                    userSelect: 'none',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    flexShrink: 0,
                    boxSizing: 'border-box',
                  }}
                >
                  {applyTextTransform(nameSplit.firstName, mainTextConfig.transform)}
                </div>
                {nameSplit.outsideInitials ? (
                  <span
                    style={{
                      fontFamily: `"${nameFontFamily}", sans-serif`,
                      fontSize: `${(mainTextConfig.fontSizePt || dimensions.mainTextFontSizePt) * zoomLevel * 1.2}px`,
                      fontWeight: mainTextConfig.fontWeight,
                      fontStyle: mainTextConfig.fontStyle,
                      color: mainTextConfig.color || '#0f172a',
                      whiteSpace: 'nowrap',
                      userSelect: 'none',
                    }}
                  >
                    {nameSplit.outsideInitials}
                  </span>
                ) : null}
              </div>
            )}

            {/* SEGUNDO TEXTO */}
            {template.elements.secondText.visible && secondTextToShow && (
              <div
                className={`label-element element-second-text ${selectedElementKey === 'secondText' ? 'element-selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectElement('secondText');
                }}
                style={{
                  fontFamily: `"${template.elements.secondText.fontFamily}", sans-serif`,
                  fontSize: `${template.elements.secondText.fontSizePt * zoomLevel * 1.33}px`,
                  fontWeight: template.elements.secondText.fontWeight,
                  color: template.elements.secondText.color,
                  transform: `translate(${mmToPx(template.elements.secondText.offsetXmm) * zoomLevel}px, ${mmToPx(template.elements.secondText.offsetYmm) * zoomLevel}px)`,
                  whiteSpace: 'nowrap',
                  zIndex: template.elements.secondText.zIndex,
                }}
              >
                {secondTextToShow}
              </div>
            )}

            {/* MARCO 4: MARCO DEL DIBUJO */}
            {drawingConfig.visible && drawingUrl && (
              <div
                className={`label-element element-drawing ${selectedElementKey === 'drawing' ? 'element-selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectElement('drawing');
                }}
                style={{
                  position: template.layoutPreset === 'custom' ? 'absolute' : 'relative',
                  left: template.layoutPreset === 'custom' ? `${drawingConfig.xPercent}%` : undefined,
                  top: template.layoutPreset === 'custom' ? `${drawingConfig.yPercent}%` : undefined,
                  width: `${drawingShapeSizePx}px`,
                  height: `${drawingShapeSizePx}px`,
                  backgroundColor: drawingConfig.shape === 'none' ? 'transparent' : drawingBgColor,
                  border: drawingConfig.shape === 'none' || drawingConfig.shapeBorderWidthMm === 0 ? 'none' : `${drawingBorderPx}px solid ${drawingBorderColor}`,
                  borderRadius: drawingRadiusPx,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `translate(${mmToPx(drawingConfig.offsetXmm || 0) * zoomLevel}px, ${mmToPx(drawingConfig.offsetYmm || 0) * zoomLevel}px)`,
                  zIndex: drawingConfig.zIndex,
                  flexShrink: 0,
                  padding: `${mmToPx(1) * zoomLevel}px`,
                  overflow: 'hidden',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  boxSizing: 'border-box',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundImage: `url("${drawingUrl}")`,
                    backgroundSize: 'contain',
                    backgroundPosition: 'center center',
                    backgroundRepeat: 'no-repeat',
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
