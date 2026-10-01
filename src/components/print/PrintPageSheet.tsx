import React, { useState, useEffect } from 'react';
import type { Project, RecordItem, PrintSettings, LabelTemplate } from '../../types';
import { LabelCanvas } from '../editor/LabelCanvas';
import { mmToPx } from '../../utils/textMetrics';
import { paginateRecordsForSheet, optimizeSmartRecordPlacement, adjustTemplateToHeight } from '../../engine/compositionEngine';
import { 
  ChevronLeft, 
  ChevronRight, 
  Printer, 
  Download, 
  Grid, 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  Ruler, 
  Layers,
  Sparkles,
  Zap,
  X
} from 'lucide-react';

interface PrintPageSheetProps {
  project: Project;
  pageIndex: number;
  onPageChange: (newIndex: number) => void;
  onExportPdf: () => void;
  onExportPngZip: () => void;
  onChangePrintSettings?: (settings: PrintSettings) => void;
  onChangeTemplate?: (template: LabelTemplate) => void;
  onChangeRecords?: (records: RecordItem[]) => void;
}

export const PrintPageSheet: React.FC<PrintPageSheetProps> = ({
  project,
  pageIndex,
  onPageChange,
  onExportPdf,
  onExportPngZip,
  onChangePrintSettings,
  onChangeTemplate,
  onChangeRecords,
}) => {
  const { printSettings, template, records } = project;

  // Zoom control state for previewing sheet comfortably
  const [previewScale, setPreviewScale] = useState<number>(0.8);
  const [isCopiesModalOpen, setIsCopiesModalOpen] = useState<boolean>(false);
  const [smartNotice, setSmartNotice] = useState<string | null>(null);
  const [collateMode, setCollateMode] = useState<'sets' | 'grouped'>('sets');

  const handleSmartPlacement = () => {
    const result = optimizeSmartRecordPlacement(records, template, printSettings);
    if (onChangeRecords) {
      onChangeRecords(result.optimizedRecords);
    }

    if (onChangePrintSettings) {
      onChangePrintSettings({
        ...printSettings,
        smartPacking: true,
        orientation: result.bestOrientation,
        gridCols: result.bestCols || printSettings.gridCols,
      });
    }

    setSmartNotice(
      `🧩 ¡Colocación Inteligente activada! Las etiquetas se han reorganizado para llenar el ancho del folio a la derecha (aprovechando 3 etiquetas por fila) sin dejar espacios vacíos.`
    );
  };

  // Expand records according to copies (Collated sets: 1..21, 1..21 vs Grouped: 1,1,2,2)
  const expandedRecords: RecordItem[] = [];
  if (collateMode === 'sets') {
    const maxCopies = Math.max(1, ...records.map((r) => r.copies || 1));
    for (let copyIdx = 0; copyIdx < maxCopies; copyIdx++) {
      records.forEach((rec) => {
        if ((rec.copies || 1) > copyIdx) {
          expandedRecords.push(rec);
        }
      });
    }
  } else {
    records.forEach((rec) => {
      const numCopies = rec.copies || 1;
      for (let i = 0; i < numCopies; i++) {
        expandedRecords.push(rec);
      }
    });
  }

  const isPortrait = printSettings.orientation === 'portrait';
  const isAutoWidthMode = template.rectangleMode === 'auto';

  const paperWidthMm = isPortrait ? 210 : 297;
  const paperHeightMm = isPortrait ? 297 : 210;

  const marginTopMm = printSettings.marginTopMm ?? 0;
  const marginBottomMm = printSettings.marginBottomMm ?? 0;
  const marginLeftMm = printSettings.marginLeftMm ?? 0;
  const marginRightMm = printSettings.marginRightMm ?? 0;

  const printableWidthMm = paperWidthMm - (marginLeftMm + marginRightMm);
  const printableHeightMm = paperHeightMm - (marginTopMm + marginBottomMm);

  // Exact Label Height from user template config (e.g. 20mm, 25mm)
  const cellHeightMm = Math.max(10, template.heightMm || 20);

  // Maximum rows that fit on page
  const rows = Math.max(1, Math.floor(printableHeightMm / cellHeightMm));

  // Grid columns and cell width for fixed and auto mode
  const cellWidthMm = Math.max(15, template.widthMm || 60);
  const cols = Math.max(1, Math.floor(printableWidthMm / cellWidthMm));

  // Exact multi-page distribution calculations
  const pagesData = paginateRecordsForSheet(expandedRecords, template, printSettings);
  const totalPages = pagesData.length || 1;

  const safePageIndex = Math.min(pageIndex, totalPages - 1);
  const currentPageRecords = pagesData[safePageIndex]?.records || [];

  // Capacity estimate per single A4 sheet
  const sheetCapacity = pagesData[0]?.records.length || Math.max(1, cols * rows);

  // Keyboard navigation for switching pages easily with left/right arrows
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea', 'select'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) {
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        if (safePageIndex > 0) onPageChange(safePageIndex - 1);
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        if (safePageIndex < totalPages - 1) onPageChange(safePageIndex + 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [safePageIndex, totalPages, onPageChange]);

  const cellTemplate: LabelTemplate = {
    ...template,
    widthMm: cellWidthMm,
    heightMm: cellHeightMm,
    rectangleMode: template.rectangleMode,
  };

  const updateSettings = (fields: Partial<PrintSettings>) => {
    if (onChangePrintSettings) {
      onChangePrintSettings({
        ...printSettings,
        ...fields,
      });
    }
  };

  const handleUpdateHeight = (newHeight: number) => {
    const validHeight = Math.max(10, Math.min(150, newHeight || 20));
    if (onChangeTemplate) {
      onChangeTemplate(adjustTemplateToHeight(template, validHeight));
    }
  };

  const handleUpdateWidth = (newWidth: number) => {
    const validWidth = Math.max(15, Math.min(250, newWidth || 50));
    if (onChangeTemplate) {
      onChangeTemplate({
        ...template,
        widthMm: validWidth,
      });
    }
  };

  const toggleRectangleMode = (mode: 'auto' | 'fixed') => {
    if (onChangeTemplate) {
      onChangeTemplate({
        ...template,
        rectangleMode: mode,
      });
    }
  };

  const handleZoomIn = () => setPreviewScale((prev) => Math.min(1.4, prev + 0.1));
  const handleZoomOut = () => setPreviewScale((prev) => Math.max(0.4, prev - 0.1));
  const handleZoomReset = () => setPreviewScale(0.8);

  // Helper: Apply uniform copies to all records
  const handleApplyUniformCopies = (copiesCount: number) => {
    if (!onChangeRecords || records.length === 0) return;
    const updated = records.map((rec) => ({
      ...rec,
      copies: Math.max(1, copiesCount),
    }));
    onChangeRecords(updated);
  };

  // Helper: Auto-fill sheet to 100% capacity without wasted empty paper slots
  const handleAutoFillSheet = () => {
    if (!onChangeRecords || records.length === 0) return;
    const totalCapacity = sheetCapacity;

    if (records.length <= totalCapacity) {
      // Fit copies so the single sheet is completely filled
      const baseCopies = Math.max(1, Math.floor(totalCapacity / records.length));
      const remainder = totalCapacity - (records.length * baseCopies);

      const updated = records.map((rec, idx) => ({
        ...rec,
        copies: baseCopies + (idx < remainder ? 1 : 0),
      }));
      onChangeRecords(updated);
    } else {
      // Multiple pages: fill out the last page to 100% capacity
      const pagesNeeded = Math.ceil(records.length / totalCapacity);
      const totalTargetSlots = pagesNeeded * totalCapacity;
      const baseCopies = Math.max(1, Math.floor(totalTargetSlots / records.length));
      const remainder = totalTargetSlots - (records.length * baseCopies);

      const updated = records.map((rec, idx) => ({
        ...rec,
        copies: baseCopies + (idx < remainder ? 1 : 0),
      }));
      onChangeRecords(updated);
    }
  };

  return (
    <div className="print-view-container">
      {/* Top Modern Header Toolbar */}
      <header className="print-toolbar">
        {/* Section 1: Page Navigation */}
        <div className="print-toolbar-group nav-group">
          <div className="pagination-pill">
            <button
              className="nav-btn"
              disabled={safePageIndex === 0}
              onClick={() => onPageChange(safePageIndex - 1)}
              title="Página Anterior (Flecha Izquierda ⬅️)"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="page-counter">
              <span className="page-current">{safePageIndex + 1}</span>
              <span className="page-sep">/</span>
              <span className="page-total">{totalPages}</span>
            </div>

            <button
              className="nav-btn"
              disabled={safePageIndex >= totalPages - 1}
              onClick={() => onPageChange(safePageIndex + 1)}
              title="Página Siguiente (Flecha Derecha ➡️)"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="records-count-badge">
            <Layers size={13} />
            <span>
              <strong>{currentPageRecords.length}</strong> de {expandedRecords.length} etiq.
            </span>
          </div>
        </div>

        {/* Section 2: Copies & Sheet Optimization */}
        <div className="print-toolbar-group flex items-center gap-2">
          <div className="segmented-control" title="Orden de impresión cuando hay repeticiones o copias">
            <button
              className={`segmented-item ${collateMode === 'sets' ? 'active' : ''}`}
              onClick={() => setCollateMode('sets')}
              title="Imprime la lista completa en orden (1 a N), y después la lista completa de nuevo (1 a N)"
            >
              📦 Por Juegos (1..N, 1..N)
            </button>
            <button
              className={`segmented-item ${collateMode === 'grouped' ? 'active' : ''}`}
              onClick={() => setCollateMode('grouped')}
              title="Coloca las copias del mismo alumno seguidas (1, 1, 2, 2...)"
            >
              👥 Juntas (1, 1, 2, 2...)
            </button>
          </div>

          <button
            className="btn-copies-optimize"
            onClick={() => setIsCopiesModalOpen(true)}
            title="Ajustar número de copias para aprovechar al máximo la hoja A4"
          >
            <Zap size={14} className="zap-icon" />
            <span>Aprovechar Folio</span>
          </button>

          <button
            className={`btn btn-sm font-bold flex items-center gap-1.5 shadow-sm transition-all ${
              printSettings.smartPacking
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-0 ring-2 ring-emerald-300'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0'
            }`}
            onClick={() => {
              if (printSettings.smartPacking) {
                updateSettings({ smartPacking: false });
                setSmartNotice('Orden numérico estricto restablecido (1, 2, 3...).');
              } else {
                handleSmartPlacement();
              }
            }}
            title="Reordenar etiquetas por tamaño para llenar la derecha del folio A4 y eliminar espacios vacíos"
          >
            <Sparkles size={14} className={printSettings.smartPacking ? 'animate-pulse' : ''} />
            <span>{printSettings.smartPacking ? '🧩 Colocación Inteligente: ACTIVADA' : '🧩 Colocación Inteligente'}</span>
          </button>
        </div>

        {/* Section 3: Layout & Orientation */}
        <div className="print-toolbar-group">
          <div className="segmented-control" title="Orientación del papel A4">
            <button
              className={`segmented-item ${isPortrait ? 'active' : ''}`}
              onClick={() => updateSettings({ orientation: 'portrait', gridCols: 3 })}
            >
              📄 Vertical (210×297)
            </button>
            <button
              className={`segmented-item ${!isPortrait ? 'active' : ''}`}
              onClick={() => updateSettings({ orientation: 'landscape', gridCols: 4 })}
            >
              🖼️ Horizontal (297×210)
            </button>
          </div>

          <div className="segmented-control" title="Margen exterior de la hoja">
            <button
              className={`segmented-item ${marginTopMm === 0 ? 'active' : ''}`}
              onClick={() => updateSettings({ marginTopMm: 0, marginBottomMm: 0, marginLeftMm: 0, marginRightMm: 0 })}
            >
              <Ruler size={13} /> 0 mm (Tabla unida)
            </button>
            <button
              className={`segmented-item ${marginTopMm === 5 ? 'active' : ''}`}
              onClick={() => updateSettings({ marginTopMm: 5, marginBottomMm: 5, marginLeftMm: 5, marginRightMm: 5 })}
            >
              🔲 5 mm Margen
            </button>
          </div>
        </div>

        {/* Section 4: Label Mode Switcher */}
        <div className="print-toolbar-group">
          <div className="segmented-control primary-accent" title="Modo de anchura de etiquetas">
            <button
              className={`segmented-item ${isAutoWidthMode ? 'active' : ''}`}
              onClick={() => toggleRectangleMode('auto')}
            >
              <Sparkles size={13} /> Adaptado al Nombre
            </button>
            <button
              className={`segmented-item ${!isAutoWidthMode ? 'active' : ''}`}
              onClick={() => toggleRectangleMode('fixed')}
            >
              <Grid size={13} /> Columnas Iguales
            </button>
          </div>

          {!isAutoWidthMode && (
            <div className="columns-select-wrapper" title="Número de columnas fijas">
              <select
                className="select-custom"
                value={cols}
                onChange={(e) => updateSettings({ gridCols: parseInt(e.target.value, 10), layoutMode: 'grid' })}
              >
                <option value={2}>2 Col</option>
                <option value={3}>3 Col</option>
                <option value={4}>4 Col</option>
                <option value={5}>5 Col</option>
              </select>
            </div>
          )}
        </div>

        {/* Section 5: Height & Width Control & Rows Summary */}
        <div className="print-toolbar-group info-group flex items-center gap-2">
          {/* Height Pill */}
          <div className="height-adjust-pill" title="Cambia la altura de la etiqueta en mm para ver cómo se ajusta la hoja A4 en tiempo real">
            <span className="height-label">📐 Alto:</span>

            <button
              className="height-btn"
              disabled={cellHeightMm <= 10}
              onClick={() => handleUpdateHeight(cellHeightMm - 1)}
              title="Reducir altura (-1 mm)"
            >
              -
            </button>

            <input
              type="number"
              className="height-input"
              min={10}
              max={150}
              value={cellHeightMm}
              onChange={(e) => handleUpdateHeight(parseInt(e.target.value, 10))}
            />

            <span className="height-unit">mm</span>

            <button
              className="height-btn"
              disabled={cellHeightMm >= 150}
              onClick={() => handleUpdateHeight(cellHeightMm + 1)}
              title="Aumentar altura (+1 mm)"
            >
              +
            </button>

            <span className="height-rows-badge">
              ({rows} filas)
            </span>
          </div>

          {/* Width Pill */}
          <div className="height-adjust-pill" title="Cambia el ancho de la etiqueta en mm para ver cómo se ajusta la hoja A4 en tiempo real">
            <span className="height-label">↔️ Ancho:</span>

            <button
              className="height-btn"
              disabled={(template.widthMm || 60) <= 15}
              onClick={() => handleUpdateWidth((template.widthMm || 60) - 1)}
              title="Reducir ancho (-1 mm)"
            >
              -
            </button>

            <input
              type="number"
              className="height-input"
              min={15}
              max={250}
              value={template.widthMm || 60}
              onChange={(e) => handleUpdateWidth(parseInt(e.target.value, 10))}
            />

            <span className="height-unit">mm</span>

            <button
              className="height-btn"
              disabled={(template.widthMm || 60) >= 250}
              onClick={() => handleUpdateWidth((template.widthMm || 60) + 1)}
              title="Aumentar ancho (+1 mm)"
            >
              +
            </button>
          </div>
        </div>

        {/* Section 6: Main Export Actions */}
        <div className="print-toolbar-group actions-group">
          <button className="btn-export-secondary" onClick={onExportPngZip} title="Descargar todas las etiquetas en archivo ZIP de imágenes PNG">
            <Download size={15} /> Lote PNG
          </button>

          <button className="btn-export-pdf" onClick={onExportPdf} title="Generar documento PDF listo para imprimir en tamaño A4 sin desajustes">
            <Printer size={16} /> Imprimir PDF ({totalPages} Págs)
          </button>
        </div>
      </header>

      {/* Sheet Preview Stage Area */}
      <main className="sheet-preview-stage">
        {smartNotice && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs px-4 py-2.5 rounded-lg mb-3 flex items-center justify-between shadow-sm max-w-2xl mx-auto z-10">
            <span className="font-medium">{smartNotice}</span>
            <button className="text-blue-600 hover:text-blue-800 p-1" onClick={() => setSmartNotice(null)}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Floating Zoom Controls Bar */}
        <div className="zoom-floating-bar">
          <button className="zoom-btn" onClick={handleZoomOut} title="Alejar vista">
            <ZoomOut size={15} />
          </button>
          <span className="zoom-indicator" onClick={handleZoomReset} title="Restablecer zoom al 80%">
            {Math.round(previewScale * 100)}%
          </span>
          <button className="zoom-btn" onClick={handleZoomIn} title="Acercar vista">
            <ZoomIn size={15} />
          </button>
          <button className="zoom-btn reset-btn" onClick={handleZoomReset} title="Ajustar al centro">
            <Maximize2 size={13} /> Fit
          </button>
        </div>

        {/* The Printable A4 Sheet Paper Mockup */}
        <div
          id="print-sheet-page-container"
          className="a4-paper-canvas"
          style={{
            width: `${mmToPx(paperWidthMm) * previewScale}px`,
            height: `${mmToPx(paperHeightMm) * previewScale}px`,
            paddingTop: `${mmToPx(marginTopMm) * previewScale}px`,
            paddingRight: `${mmToPx(marginRightMm) * previewScale}px`,
            paddingBottom: `${mmToPx(marginBottomMm) * previewScale}px`,
            paddingLeft: `${mmToPx(marginLeftMm) * previewScale}px`,
          }}
        >
          {isAutoWidthMode ? (
            /* MODE 1: Dynamic text-adapted width labels joined contiguously */
            <div className="sheet-flow-auto">
              {currentPageRecords.map((rec, idx) => (
                <div
                  key={`${rec.id}-${idx}`}
                  className="sheet-auto-cell"
                  style={{
                    height: `${mmToPx(cellHeightMm) * previewScale}px`,
                  }}
                >
                  <LabelCanvas
                    template={cellTemplate}
                    record={rec}
                    zoomLevel={previewScale}
                    selectedElementKey={null}
                    onSelectElement={() => {}}
                  />
                </div>
              ))}
            </div>
          ) : (
            /* MODE 2: Fixed Grid Column Table */
            <div
              className="sheet-grid-fixed"
              style={{
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gridTemplateRows: `repeat(${rows}, ${mmToPx(cellHeightMm) * previewScale}px)`,
              }}
            >
              {currentPageRecords.map((rec, idx) => (
                <div
                  key={`${rec.id}-${idx}`}
                  className="sheet-grid-cell"
                  style={{
                    height: `${mmToPx(cellHeightMm) * previewScale}px`,
                  }}
                >
                  <LabelCanvas
                    template={cellTemplate}
                    record={rec}
                    zoomLevel={previewScale}
                    selectedElementKey={null}
                    onSelectElement={() => {}}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Hidden Multi-Page PDF Export Container (Off-screen rendering for ALL pages) */}
      <div id="all-pdf-export-container" style={{ position: 'fixed', left: '-9999px', top: '-9999px', zIndex: -1000 }}>
        {pagesData.map((pData, pIdx) => {
          return (
            <div
              key={`pdf-export-page-${pIdx}`}
              className="a4-sheet-pdf-page"
              style={{
                width: `${mmToPx(paperWidthMm)}px`,
                height: `${mmToPx(paperHeightMm)}px`,
                paddingTop: `${mmToPx(marginTopMm)}px`,
                paddingRight: `${mmToPx(marginRightMm)}px`,
                paddingBottom: `${mmToPx(marginBottomMm)}px`,
                paddingLeft: `${mmToPx(marginLeftMm)}px`,
                backgroundColor: '#ffffff',
                boxSizing: 'border-box',
                overflow: 'hidden',
              }}
            >
              {isAutoWidthMode ? (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignContent: 'flex-start',
                    justifyContent: 'flex-start',
                    width: '100%',
                    maxHeight: '100%',
                    gap: 0,
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                  }}
                >
                  {pData.records.map((rec, idx) => (
                    <div
                      key={`pdf-cell-${rec.id}-${idx}`}
                      style={{
                        height: `${mmToPx(cellHeightMm)}px`,
                        margin: 0,
                        padding: 0,
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                        borderRight: '1px solid #0f172a',
                        borderBottom: '1px solid #0f172a',
                        display: 'inline-flex',
                      }}
                    >
                      <LabelCanvas
                        template={cellTemplate}
                        record={rec}
                        zoomLevel={1.0}
                        selectedElementKey={null}
                        onSelectElement={() => {}}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${cols}, 1fr)`,
                    gridTemplateRows: `repeat(${rows}, ${mmToPx(cellHeightMm)}px)`,
                    width: '100%',
                    height: '100%',
                    gap: 0,
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                  }}
                >
                  {pData.records.map((rec, idx) => (
                    <div
                      key={`pdf-cell-${rec.id}-${idx}`}
                      style={{
                        width: '100%',
                        height: `${mmToPx(cellHeightMm)}px`,
                        margin: 0,
                        padding: 0,
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                        borderRight: '1px solid #0f172a',
                        borderBottom: '1px solid #0f172a',
                      }}
                    >
                      <LabelCanvas
                        template={cellTemplate}
                        record={rec}
                        zoomLevel={1.0}
                        selectedElementKey={null}
                        onSelectElement={() => {}}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Modal: Aprovechar Folio y Copias */}
      {isCopiesModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCopiesModalOpen(false)}>
          <div className="modal-content modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', color: '#0f172a' }}>
                  <Zap size={18} style={{ color: '#0284c7' }} /> Optimizar Copias y Aprovechar Folio
                </h3>
                <p className="modal-subtitle">
                  Ajusta las copias para llenar al 100% la hoja A4 sin dejar espacios en blanco.
                </p>
              </div>
              <button className="btn-icon" onClick={() => setIsCopiesModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="copies-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: '16px 0' }}>
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#334155' }}>
                <div>📄 <strong>Capacidad estimada:</strong> ~{sheetCapacity} etiquetas por hoja A4</div>
                <div style={{ marginTop: '4px' }}>👥 <strong>Alumnos en la lista:</strong> {records.length} alumnos</div>
              </div>

              <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                Selecciona una opción de copias:
              </div>

              <div className="copies-preset-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  className="btn btn-outline"
                  style={{ padding: '12px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '4px', border: '1px solid #cbd5e1', color: '#0f172a', background: '#ffffff' }}
                  onClick={() => {
                    handleApplyUniformCopies(1);
                    setIsCopiesModalOpen(false);
                  }}
                >
                  <strong style={{ fontSize: '13px' }}>1 Copia por alumno</strong>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Total: {records.length} etiquetas</span>
                </button>

                <button
                  className="btn btn-outline"
                  style={{ padding: '12px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '4px', border: '1px solid #cbd5e1', color: '#0f172a', background: '#ffffff' }}
                  onClick={() => {
                    handleApplyUniformCopies(2);
                    setIsCopiesModalOpen(false);
                  }}
                >
                  <strong style={{ fontSize: '13px' }}>2 Copias por alumno</strong>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Total: {records.length * 2} etiquetas</span>
                </button>

                <button
                  className="btn btn-outline"
                  style={{ padding: '12px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '4px', border: '1px solid #cbd5e1', color: '#0f172a', background: '#ffffff' }}
                  onClick={() => {
                    handleApplyUniformCopies(3);
                    setIsCopiesModalOpen(false);
                  }}
                >
                  <strong style={{ fontSize: '13px' }}>3 Copias por alumno</strong>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Total: {records.length * 3} etiquetas</span>
                </button>

                <button
                  className="btn btn-primary"
                  style={{ padding: '12px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '4px', background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)', color: 'white', border: 'none' }}
                  onClick={() => {
                    handleAutoFillSheet();
                    setIsCopiesModalOpen(false);
                  }}
                >
                  <strong style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Zap size={14} /> Rellenar Folio Completo
                  </strong>
                  <span style={{ fontSize: '11px', opacity: 0.9 }}>Llega al 100% de la hoja A4</span>
                </button>
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsCopiesModalOpen(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

