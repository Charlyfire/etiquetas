import React from 'react';
import type { Project, LabelTemplate, ValidationIssue, FontResource } from '../../types';
import { adjustTemplateToHeight } from '../../engine/compositionEngine';
import { AlertTriangle, Type, Hash, Layout, ShieldAlert, Image as ImageIcon, Camera } from 'lucide-react';

interface InspectorSidebarProps {
  project: Project;
  selectedElementKey: string | null;
  issues: ValidationIssue[];
  fonts: FontResource[];
  onChangeTemplate: (updatedTemplate: LabelTemplate) => void;
  onOpenFontManager: () => void;
  onOpenFontTester: () => void;
}

export const InspectorSidebar: React.FC<InspectorSidebarProps> = ({
  project,
  issues,
  fonts,
  onChangeTemplate,
  onOpenFontManager,
  onOpenFontTester,
}) => {
  const { template } = project;

  const updateMainText = (fields: Partial<LabelTemplate['elements']['mainText']>) => {
    onChangeTemplate({
      ...template,
      elements: {
        ...template.elements,
        mainText: { ...template.elements.mainText, ...fields },
      },
    });
  };

  const updateNumber = (fields: Partial<LabelTemplate['elements']['number']>) => {
    onChangeTemplate({
      ...template,
      elements: {
        ...template.elements,
        number: { ...template.elements.number, ...fields },
      },
    });
  };

  const updateDrawing = (fields: Partial<LabelTemplate['elements']['drawing']>) => {
    onChangeTemplate({
      ...template,
      elements: {
        ...template.elements,
        drawing: { ...template.elements.drawing, ...fields },
      },
    });
  };

  const updatePhoto = (fields: Partial<LabelTemplate['elements']['photo']>) => {
    onChangeTemplate({
      ...template,
      elements: {
        ...template.elements,
        photo: { ...template.elements.photo, ...fields },
      },
    });
  };

  const updateBorder = (fields: Partial<LabelTemplate['border']>) => {
    onChangeTemplate({
      ...template,
      border: { ...template.border, ...fields },
    });
  };

  return (
    <div className="inspector-sidebar">
      {/* Issues Alerts Banner */}
      {issues.length > 0 && (
        <div className="inspector-section issues-section">
          <div className="section-header danger">
            <ShieldAlert size={16} /> Avisos de Diseño ({issues.length})
          </div>
          <div className="issues-list">
            {issues.map((issue, idx) => (
              <div key={idx} className={`issue-card ${issue.severity}`}>
                <AlertTriangle size={14} />
                <span>{issue.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MARCO 1: ETIQUETA GENERAL */}
      <div className="inspector-section">
        <div className="section-header">
          <Layout size={16} /> Marco 1: Marco de la Etiqueta
        </div>

        <div className="property-group">
          <div className="input-row">
            <label>Modo de Anchura Etiqueta:</label>
            <select
              value={template.rectangleMode}
              onChange={(e) => onChangeTemplate({ ...template, rectangleMode: e.target.value as any })}
            >
              <option value="auto">Anchura Automática (se alarga al texto)</option>
              <option value="fixed">Anchura Fija (ancho igual + auto-encoge letra)</option>
            </select>
          </div>

          <div className="input-row-double">
            <div>
              <label>Alto Etiqueta (mm):</label>
              <input
                type="number"
                min="10"
                max="200"
                value={template.heightMm}
                onChange={(e) => onChangeTemplate(adjustTemplateToHeight(template, parseInt(e.target.value, 10) || 20))}
              />
            </div>
            <div>
              <label>Ancho Base (mm):</label>
              <input
                type="number"
                min="20"
                max="300"
                value={template.widthMm}
                onChange={(e) => onChangeTemplate({ ...template, widthMm: parseInt(e.target.value, 10) || 60 })}
              />
            </div>
          </div>

          <div className="input-row">
            <label>Color Fondo Etiqueta:</label>
            <input
              type="color"
              value={template.backgroundColor}
              onChange={(e) => onChangeTemplate({ ...template, backgroundColor: e.target.value })}
            />
          </div>

          <div className="input-row">
            <label>Patrón Decorativo de Fondo:</label>
            <select
              value={template.backgroundPattern || 'none'}
              onChange={(e) => onChangeTemplate({ ...template, backgroundPattern: e.target.value as any })}
            >
              <option value="none">Ninguno (Fondo Liso)</option>
              <option value="estrellas">⭐ Estrellas Bonitas</option>
              <option value="pompas">🫧 Pompas / Burbujas</option>
              <option value="lunares">🔴 Lunares / Puntos</option>
              <option value="rayos_medalla">☀️ Rayos de Sol (Medalla)</option>
              <option value="corazones">❤️ Corazones</option>
              <option value="ondas">🌊 Ondas Marinas</option>
              <option value="lineas">📏 Rayas Diagonales</option>
            </select>
          </div>

          {template.backgroundPattern && template.backgroundPattern !== 'none' && (
            <div className="input-row">
              <label>Color del Patrón:</label>
              <input
                type="color"
                value={template.backgroundPatternColor || '#fbbf24'}
                onChange={(e) => onChangeTemplate({ ...template, backgroundPatternColor: e.target.value })}
              />
            </div>
          )}

          <div className="input-row flex flex-col gap-1.5 pt-1 border-t border-slate-200">
            <label className="font-semibold text-xs text-slate-700">Imagen de Fondo Personalizada:</label>
            {template.backgroundImageUrl ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between bg-slate-100 p-2 rounded border">
                  <span className="text-xs text-slate-600 truncate max-w-[150px]">Imagen de fondo activa</span>
                  <button
                    className="btn btn-outline btn-xs text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => onChangeTemplate({ ...template, backgroundImageUrl: undefined })}
                  >
                    Eliminar
                  </button>
                </div>
                <div className="input-row-double">
                  <div>
                    <label>Ajuste:</label>
                    <select
                      value={template.backgroundImageFit || 'cover'}
                      onChange={(e) => onChangeTemplate({ ...template, backgroundImageFit: e.target.value as any })}
                    >
                      <option value="cover">Rellenar (Cover)</option>
                      <option value="contain">Ajustar (Contain)</option>
                      <option value="tile">Mosaico (Tile)</option>
                    </select>
                  </div>
                  <div>
                    <label>Opacidad:</label>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={template.backgroundImageOpacity ?? 1.0}
                      onChange={(e) => onChangeTemplate({ ...template, backgroundImageOpacity: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <label className="btn btn-outline btn-xs flex items-center justify-center gap-1.5 cursor-pointer py-1.5">
                <ImageIcon size={14} /> Subir Imagen de Fondo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        if (event.target?.result) {
                          onChangeTemplate({
                            ...template,
                            backgroundImageUrl: event.target.result as string,
                          });
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            )}
          </div>

          <div className="input-row">
            <label>Borde Exterior Etiqueta:</label>
            <input
              type="checkbox"
              checked={template.border.enabled}
              onChange={(e) => updateBorder({ enabled: e.target.checked })}
            />
          </div>

          {template.border.enabled && (
            <>
              <div className="input-row">
                <label>Color Borde Etiqueta:</label>
                <input
                  type="color"
                  value={template.border.color}
                  onChange={(e) => updateBorder({ color: e.target.value })}
                />
              </div>

              <div className="input-row-double">
                <div>
                  <label>Grosor Borde (mm):</label>
                  <input
                    type="number"
                    step="0.2"
                    min="0.2"
                    max="10"
                    value={template.border.widthMm}
                    onChange={(e) => updateBorder({ widthMm: parseFloat(e.target.value) || 1 })}
                  />
                </div>
                <div>
                  <label>Radio Esquina (mm):</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={template.border.radiusMm}
                    onChange={(e) => updateBorder({ radiusMm: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* MARCO 2: MARCO DEL NÚMERO */}
      <div className="inspector-section">
        <div className="section-header">
          <Hash size={16} /> Marco 2: Marco del Número
        </div>

        <div className="property-group">
          <div className="input-row">
            <label>Mostrar Número:</label>
            <input
              type="checkbox"
              checked={template.elements.number.visible}
              onChange={(e) => updateNumber({ visible: e.target.checked })}
            />
          </div>

          {template.elements.number.visible && (
            <>
              <div className="input-row">
                <label>Forma del Marco:</label>
                <select
                  value={template.elements.number.shape}
                  onChange={(e) => updateNumber({ shape: e.target.value as any })}
                >
                  <option value="circle">Círculo (Estándar)</option>
                  <option value="square">Cuadrado</option>
                  <option value="rounded_rectangle">Rectángulo Redondeado</option>
                  <option value="none">Sin marco (solo número)</option>
                </select>
              </div>

              <div className="input-row">
                <label>Tipografía Número:</label>
                <select
                  value={template.elements.number.fontFamily || 'Massallera'}
                  onChange={(e) => updateNumber({ fontFamily: e.target.value })}
                >
                  {fonts.map((f) => (
                    <option key={f.id} value={f.familyName}>
                      {f.familyName} ({f.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-row">
                <label>Tamaño Forma (mm): {template.elements.number.shapeSizeMm || 16} mm</label>
                <input
                  type="range"
                  min="6"
                  max="60"
                  value={template.elements.number.shapeSizeMm || 16}
                  onChange={(e) => updateNumber({ shapeSizeMm: parseInt(e.target.value, 10) || 16 })}
                />
              </div>

              <div className="input-row">
                <label>Tamaño Texto Número (pt): {template.elements.number.fontSizePt || 16} pt</label>
                <input
                  type="range"
                  min="6"
                  max="48"
                  value={template.elements.number.fontSizePt || 16}
                  onChange={(e) => updateNumber({ fontSizePt: parseInt(e.target.value, 10) || 16 })}
                />
              </div>

              <div className="input-row">
                <label>Color Texto Número:</label>
                <input
                  type="color"
                  value={template.elements.number.color || '#0f172a'}
                  onChange={(e) => updateNumber({ color: e.target.value })}
                />
              </div>

              <div className="input-row">
                <label>Color Fondo Marco:</label>
                <input
                  type="color"
                  value={template.elements.number.shapeBackgroundColor || '#ffffff'}
                  onChange={(e) => updateNumber({ shapeBackgroundColor: e.target.value })}
                />
              </div>

              <div className="input-row">
                <label>Color Borde Marco:</label>
                <input
                  type="color"
                  value={template.elements.number.shapeBorderColor || '#0f172a'}
                  onChange={(e) => updateNumber({ shapeBorderColor: e.target.value })}
                />
              </div>

              <div className="input-row-double">
                <div>
                  <label>Grosor Borde (mm):</label>
                  <input
                    type="number"
                    step="0.2"
                    min="0"
                    max="10"
                    value={template.elements.number.shapeBorderWidthMm ?? 1.5}
                    onChange={(e) => updateNumber({ shapeBorderWidthMm: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label>Radio Esquina (mm):</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={template.elements.number.shapeBorderRadiusMm ?? 50}
                    onChange={(e) => updateNumber({ shapeBorderRadiusMm: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
              </div>

              <div className="input-row-double">
                <div>
                  <label>Ajuste X (mm):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={template.elements.number.offsetXmm || 0}
                    onChange={(e) => updateNumber({ offsetXmm: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label>Ajuste Y (mm):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={template.elements.number.offsetYmm || 0}
                    onChange={(e) => updateNumber({ offsetYmm: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* MARCO 3: MARCO DEL NOMBRE */}
      <div className="inspector-section">
        <div className="section-header">
          <Type size={16} /> Marco 3: Marco del Nombre
        </div>

        <div className="property-group">
          <div className="input-row">
            <label>Tipografía Nombre:</label>
            <select
              value={template.elements.mainText.fontFamily || 'Massallera'}
              onChange={(e) => updateMainText({ fontFamily: e.target.value })}
            >
              {fonts.map((f) => (
                <option key={f.id} value={f.familyName}>
                  {f.familyName} ({f.category})
                </option>
              ))}
            </select>
          </div>

          <div className="input-row">
            <label>Formato Nombre / Apellidos:</label>
            <select
              value={template.elements.mainText.surnameDisplayMode || 'outside_initials'}
              onChange={(e) => updateMainText({ surnameDisplayMode: e.target.value as any })}
            >
              <option value="outside_initials">Iniciales fuera del marco (Método Escolar)</option>
              <option value="inside_box">Todo dentro del marco</option>
              <option value="first_name_only">Solo Nombre (sin apellidos)</option>
            </select>
          </div>

          <div className="input-row">
            <label>Tamaño Texto Nombre (pt): {template.elements.mainText.fontSizePt} pt</label>
            <input
              type="range"
              min="8"
              max="48"
              value={template.elements.mainText.fontSizePt}
              onChange={(e) => updateMainText({ fontSizePt: parseInt(e.target.value, 10) || 16 })}
            />
          </div>

          <div className="input-row">
            <label>Alto Cuadro Nombre (mm): {template.elements.mainText.boxHeightMm ? `${template.elements.mainText.boxHeightMm} mm` : 'Auto (Uniforme Proporcional)'}</label>
            <input
              type="range"
              min="0"
              max="40"
              step="1"
              value={template.elements.mainText.boxHeightMm || 0}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                updateMainText({ boxHeightMm: val > 0 ? val : undefined });
              }}
            />
          </div>

          <div className="input-row">
            <label>Adaptar Ancho al Texto:</label>
            <input
              type="checkbox"
              checked={!template.elements.mainText.boxWidthMm}
              onChange={(e) => {
                if (e.target.checked) {
                  onChangeTemplate({
                    ...template,
                    rectangleMode: 'auto',
                    elements: {
                      ...template.elements,
                      mainText: { ...template.elements.mainText, boxWidthMm: undefined },
                    },
                  });
                } else {
                  updateMainText({ boxWidthMm: 50 });
                }
              }}
            />
          </div>

          {!template.elements.mainText.boxWidthMm ? (
            <div className="input-row">
              <label>Margen Interno Cuadro (mm): {template.elements.mainText.paddingLeftMm ?? 6} mm</label>
              <input
                type="range"
                min="1"
                max="25"
                value={template.elements.mainText.paddingLeftMm ?? 6}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) || 6;
                  updateMainText({ paddingLeftMm: val, paddingRightMm: val });
                }}
              />
            </div>
          ) : (
            <div className="input-row">
              <label>Ancho Cuadro Fijo (mm): {template.elements.mainText.boxWidthMm} mm</label>
              <input
                type="range"
                min="20"
                max="120"
                step="2"
                value={template.elements.mainText.boxWidthMm}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) || 50;
                  updateMainText({ boxWidthMm: val });
                }}
              />
            </div>
          )}


          <div className="input-row">
            <label>Color Texto Nombre:</label>
            <input
              type="color"
              value={template.elements.mainText.color}
              onChange={(e) => updateMainText({ color: e.target.value })}
            />
          </div>

          <div className="input-row">
            <label>Fondo Caja Nombre:</label>
            <input
              type="color"
              value={template.elements.mainText.boxBackgroundColor || '#ffffff'}
              onChange={(e) => updateMainText({ boxBackgroundColor: e.target.value })}
            />
          </div>

          <div className="input-row">
            <label>Color Borde Caja:</label>
            <input
              type="color"
              value={template.elements.mainText.boxBorderColor || '#0f172a'}
              onChange={(e) => updateMainText({ boxBorderColor: e.target.value })}
            />
          </div>

          <div className="input-row-double">
            <div>
              <label>Grosor Borde (mm):</label>
              <input
                type="number"
                step="0.2"
                min="0"
                max="10"
                value={template.elements.mainText.boxBorderWidthMm ?? 1.5}
                onChange={(e) => updateMainText({ boxBorderWidthMm: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label>Radio Esquina (mm):</label>
              <input
                type="number"
                min="0"
                max="20"
                value={template.elements.mainText.boxBorderRadiusMm ?? 2}
                onChange={(e) => updateMainText({ boxBorderRadiusMm: parseInt(e.target.value, 10) || 0 })}
              />
            </div>
          </div>

          <div className="input-row-double">
            <div>
              <label>Ajuste X (mm):</label>
              <input
                type="number"
                step="0.5"
                value={template.elements.mainText.offsetXmm || 0}
                onChange={(e) => updateMainText({ offsetXmm: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label>Ajuste Y (mm):</label>
              <input
                type="number"
                step="0.5"
                value={template.elements.mainText.offsetYmm || 0}
                onChange={(e) => updateMainText({ offsetYmm: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="btn-group-row" style={{ marginTop: '8px' }}>
            <button
              className="btn btn-xs btn-secondary"
              onClick={() => updateMainText({ offsetXmm: 0, offsetYmm: 0, boxWidthMm: undefined })}
            >
              Restablecer Ancho Auto
            </button>
            <button className="btn btn-xs btn-outline" onClick={onOpenFontManager}>
              Gestionar Fuentes...
            </button>
            <button className="btn btn-xs btn-outline" onClick={onOpenFontTester}>
              Probar Fuentes...
            </button>
          </div>
        </div>
      </div>

      {/* MARCO FOTO: FOTO DEL ALUMNO */}
      <div className="inspector-section">
        <div className="section-header">
          <Camera size={16} /> Marco Foto: Foto del Alumno
        </div>

        <div className="property-group">
          <div className="input-row">
            <label>Mostrar Fotografía:</label>
            <input
              type="checkbox"
              checked={template.elements.photo.visible}
              onChange={(e) => updatePhoto({ visible: e.target.checked })}
            />
          </div>

          {template.elements.photo.visible && (
            <>
              <div className="input-row">
                <label>Forma de la Foto:</label>
                <select
                  value={template.elements.photo.shape || 'circle'}
                  onChange={(e) => updatePhoto({ shape: e.target.value as any })}
                >
                  <option value="circle">Círculo</option>
                  <option value="square">Cuadrado</option>
                  <option value="rounded">Rectángulo Redondeado</option>
                </select>
              </div>

              <div className="input-row">
                <label>Color Borde Foto:</label>
                <input
                  type="color"
                  value={template.elements.photo.borderColor || '#0f172a'}
                  onChange={(e) => updatePhoto({ borderColor: e.target.value })}
                />
              </div>

              <div className="input-row-double">
                <div>
                  <label>Grosor Borde (mm):</label>
                  <input
                    type="number"
                    step="0.2"
                    min="0"
                    max="10"
                    value={template.elements.photo.borderWidthMm ?? 1.2}
                    onChange={(e) => updatePhoto({ borderWidthMm: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label>Radio Esquina (mm):</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={template.elements.photo.borderRadiusMm ?? 3}
                    onChange={(e) => updatePhoto({ borderRadiusMm: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* MARCO 4: MARCO DEL DIBUJO */}
      <div className="inspector-section">
        <div className="section-header">
          <ImageIcon size={16} /> Marco 4: Marco del Dibujo
        </div>

        <div className="property-group">
          <div className="input-row">
            <label>Mostrar Dibujo:</label>
            <input
              type="checkbox"
              checked={template.elements.drawing.visible}
              onChange={(e) => updateDrawing({ visible: e.target.checked })}
            />
          </div>

          {template.elements.drawing.visible && (
            <>
              <div className="input-row">
                <label>Forma del Marco:</label>
                <select
                  value={template.elements.drawing.shape || 'rounded_rectangle'}
                  onChange={(e) => updateDrawing({ shape: e.target.value as any })}
                >
                  <option value="rounded_rectangle">Rectángulo Redondeado</option>
                  <option value="square">Cuadrado</option>
                  <option value="circle">Círculo</option>
                  <option value="none">Sin marco</option>
                </select>
              </div>

              <div className="input-row">
                <label>Tamaño Marco Dibujo (mm): {template.elements.drawing.shapeSizeMm || 18} mm</label>
                <input
                  type="range"
                  min="6"
                  max="60"
                  value={template.elements.drawing.shapeSizeMm || 18}
                  onChange={(e) => updateDrawing({ shapeSizeMm: parseInt(e.target.value, 10) || 18 })}
                />
              </div>

              <div className="input-row">
                <label>Color Fondo Marco:</label>
                <input
                  type="color"
                  value={template.elements.drawing.shapeBackgroundColor || '#ffffff'}
                  onChange={(e) => updateDrawing({ shapeBackgroundColor: e.target.value })}
                />
              </div>

              <div className="input-row">
                <label>Color Borde Marco:</label>
                <input
                  type="color"
                  value={template.elements.drawing.shapeBorderColor || '#0f172a'}
                  onChange={(e) => updateDrawing({ shapeBorderColor: e.target.value })}
                />
              </div>

              <div className="input-row-double">
                <div>
                  <label>Grosor Borde (mm):</label>
                  <input
                    type="number"
                    step="0.2"
                    min="0"
                    max="10"
                    value={template.elements.drawing.shapeBorderWidthMm ?? 1.5}
                    onChange={(e) => updateDrawing({ shapeBorderWidthMm: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label>Radio Esquina (mm):</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={template.elements.drawing.shapeBorderRadiusMm ?? 3}
                    onChange={(e) => updateDrawing({ shapeBorderRadiusMm: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
              </div>

              <div className="input-row-double">
                <div>
                  <label>Ajuste X (mm):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={template.elements.drawing.offsetXmm || 0}
                    onChange={(e) => updateDrawing({ offsetXmm: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label>Ajuste Y (mm):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={template.elements.drawing.offsetYmm || 0}
                    onChange={(e) => updateDrawing({ offsetYmm: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
