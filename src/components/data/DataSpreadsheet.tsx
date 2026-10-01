import React, { useState } from 'react';
import type { RecordItem, DataMode, LabelTemplate } from '../../types';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { parseNameAndInitials } from '../../utils/textMetrics';
import {
  Plus,
  Trash2,
  Copy,
  Upload,
  Clipboard,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react';

interface DataSpreadsheetProps {
  mode: DataMode;
  records: RecordItem[];
  onChangeRecords: (records: RecordItem[]) => void;
  onOpenDrawingSelector: (recordId: string) => void;
  onOpenPhotoCropper: (recordId: string) => void;
  onAutoAssignDrawings: () => void;
  template?: LabelTemplate;
  onChangeTemplate?: (template: LabelTemplate) => void;
}

export const DataSpreadsheet: React.FC<DataSpreadsheetProps> = ({
  mode,
  records,
  onChangeRecords,
  onOpenDrawingSelector,
  onOpenPhotoCropper,
  onAutoAssignDrawings,
  template,
  onChangeTemplate,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [globalCopiesInput, setGlobalCopiesInput] = useState<number>(1);
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [pasteRawText, setPasteRawText] = useState('');

  const surnameDisplayMode = template?.elements.mainText.surnameDisplayMode || 'outside_initials';

  // Row selection toggles
  const toggleSelectAll = () => {
    if (selectedIds.length === records.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(records.map((r) => r.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  // Record mutators
  const updateRecord = (id: string, fields: Partial<RecordItem>) => {
    onChangeRecords(
      records.map((r) => {
        if (r.id === id) {
          const updated = { ...r, ...fields };

          if (fields.firstName !== undefined || fields.surnames !== undefined) {
            const fn = fields.firstName !== undefined ? fields.firstName : (r.firstName || '');
            const sn = fields.surnames !== undefined ? fields.surnames : (r.surnames || '');
            updated.fullName = [fn, sn].filter(Boolean).join(' ');
            updated.displayText = fn || updated.fullName;
          } else if (fields.fullName !== undefined) {
            const parts = fields.fullName.trim().split(/\s+/);
            updated.firstName = parts[0] || '';
            updated.surnames = parts.slice(1).join(' ');
            updated.displayText = updated.firstName || fields.fullName;
          }

          return updated;
        }
        return r;
      })
    );
  };

  const addRecord = () => {
    const nextNumber = records.length > 0 ? Math.max(...records.map((r) => r.listNumber)) + 1 : 1;
    const newRecord: RecordItem = {
      id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      listNumber: nextNumber,
      fullName: mode === 'alumnos' ? 'Nuevo Alumno' : 'Nuevo Texto',
      firstName: mode === 'alumnos' ? 'Nuevo' : 'Nuevo Texto',
      surnames: mode === 'alumnos' ? 'Alumno' : '',
      displayText: mode === 'alumnos' ? 'Nuevo' : 'Nuevo Texto',
      secondText: '',
      copies: 1,
    };
    onChangeRecords([...records, newRecord]);
  };

  const deleteSelectedRecords = () => {
    if (selectedIds.length === 0) return;
    onChangeRecords(records.filter((r) => !selectedIds.includes(r.id)));
    setSelectedIds([]);
  };

  const duplicateRecord = (record: RecordItem) => {
    const duplicated: RecordItem = {
      ...record,
      id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      listNumber: record.listNumber + 1,
    };
    const index = records.findIndex((r) => r.id === record.id);
    const newRecords = [...records];
    newRecords.splice(index + 1, 0, duplicated);
    onChangeRecords(newRecords);
  };

  const applyGlobalCopies = () => {
    onChangeRecords(records.map((r) => ({ ...r, copies: Math.max(1, globalCopiesInput) })));
  };

  // CSV & Excel File Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          importRawRows(results.data as Record<string, string>[]);
        },
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const data = XLSX.utils.sheet_to_json(ws) as Record<string, string>[];
        importRawRows(data);
      };
      reader.readAsBinaryString(file);
    }
  };

  // Convert raw parsed rows into RecordItems
  const importRawRows = (rows: Record<string, string>[]) => {
    const imported: RecordItem[] = rows.map((row, idx) => {
      const keys = Object.keys(row);
      const nameVal = (row['Nombre'] || row['nombre'] || row['Texto'] || row[keys[0]] || `Alumno ${idx + 1}`).toString().trim();
      const surnameVal = (row['Apellidos'] || row['apellidos'] || row['Apellido'] || row[keys[1]] || '').toString().trim();
      const secondVal = (row['Curso'] || row['curso'] || row['Clase'] || row['Segundo texto'] || row[keys[2]] || '').toString().trim();

      let fn = nameVal;
      let sn = surnameVal;
      let full = nameVal;

      if (surnameVal) {
        full = `${nameVal} ${surnameVal}`;
      } else if (nameVal.includes(' ')) {
        const parts = nameVal.split(/\s+/);
        fn = parts[0];
        sn = parts.slice(1).join(' ');
        full = nameVal;
      }

      return {
        id: `rec-imp-${Date.now()}-${idx}`,
        listNumber: idx + 1,
        fullName: full,
        firstName: fn,
        surnames: sn,
        displayText: fn,
        secondText: secondVal,
        copies: 1,
      };
    });

    if (imported.length > 0) {
      onChangeRecords(imported);
    }
  };

  // Direct Clipboard TSV (Excel/Google Sheets) Paste Handler
  const handleProcessClipboardPaste = () => {
    if (!pasteRawText.trim()) return;

    const lines = pasteRawText.trim().split('\n');
    const parsedRecords: RecordItem[] = lines.map((line, idx) => {
      const cols = line.split('\t').map((c) => c.trim());
      let num = idx + 1;
      let fn = '';
      let sn = '';
      let second = '';

      if (!isNaN(parseInt(cols[0], 10))) {
        num = parseInt(cols[0], 10);
        fn = cols[1] || `Alumno ${idx + 1}`;
        sn = cols[2] || '';
        second = cols[3] || '';
      } else {
        fn = cols[0] || `Alumno ${idx + 1}`;
        sn = cols[1] || '';
        second = cols[2] || '';
      }

      let full = fn;
      if (sn) {
        full = `${fn} ${sn}`;
      } else if (fn.includes(' ')) {
        const parts = fn.split(/\s+/);
        fn = parts[0];
        sn = parts.slice(1).join(' ');
      }

      return {
        id: `rec-paste-${Date.now()}-${idx}`,
        listNumber: num,
        fullName: full,
        firstName: fn,
        surnames: sn,
        displayText: fn,
        secondText: second,
        copies: 1,
      };
    });

    if (parsedRecords.length > 0) {
      onChangeRecords(parsedRecords);
      setPasteModalOpen(false);
      setPasteRawText('');
    }
  };

  return (
    <div className="data-spreadsheet">
      {/* Toolbar controls */}
      <div className="spreadsheet-toolbar flex-wrap gap-2">
        <div className="toolbar-left flex items-center gap-2 flex-wrap">
          <button className="btn btn-primary" onClick={addRecord}>
            <Plus size={16} /> Añadir Registro
          </button>

          <button className="btn btn-secondary" onClick={() => setPasteModalOpen(true)}>
            <Clipboard size={16} /> Pegar desde Excel
          </button>

          <label className="btn btn-secondary file-upload-btn">
            <Upload size={16} /> Importar CSV/Excel
            <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} hidden />
          </label>

          <button className="btn btn-outline" onClick={onAutoAssignDrawings}>
            <Sparkles size={16} /> Asignar Dibujos Auto
          </button>

          {template && onChangeTemplate && mode === 'alumnos' && (
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-md text-xs font-semibold text-indigo-900 ml-2">
              <input
                type="checkbox"
                id="chk-surname-initials"
                className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                checked={surnameDisplayMode === 'outside_initials'}
                onChange={(e) => {
                  const newMode = e.target.checked ? 'outside_initials' : 'first_name_only';
                  onChangeTemplate({
                    ...template,
                    elements: {
                      ...template.elements,
                      mainText: {
                        ...template.elements.mainText,
                        surnameDisplayMode: newMode,
                      },
                    },
                  });
                }}
              />
              <label htmlFor="chk-surname-initials" className="cursor-pointer select-none">
                Mostrar iniciales de apellidos fuera del marco (ej: <strong>Lucas G. M.</strong>)
              </label>
            </div>
          )}
        </div>

        <div className="toolbar-right">
          <div className="copies-global-box">
            <label>Copias a todas:</label>
            <input
              type="number"
              min="1"
              max="99"
              value={globalCopiesInput}
              onChange={(e) => setGlobalCopiesInput(parseInt(e.target.value, 10) || 1)}
            />
            <button className="btn btn-sm btn-secondary" onClick={applyGlobalCopies}>
              Aplicar
            </button>
          </div>

          {selectedIds.length > 0 && (
            <button className="btn btn-danger btn-sm" onClick={deleteSelectedRecords}>
              <Trash2 size={15} /> Borrar ({selectedIds.length})
            </button>
          )}
        </div>
      </div>

      {/* Editable Table */}
      <div className="table-responsive-container">
        <table className="spreadsheet-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <button className="btn-icon" onClick={toggleSelectAll}>
                  {selectedIds.length === records.length && records.length > 0 ? (
                    <CheckSquare size={16} />
                  ) : (
                    <Square size={16} />
                  )}
                </button>
              </th>
              <th style={{ width: '50px' }}>Nº</th>
              {mode === 'alumnos' ? (
                <>
                  <th style={{ width: '150px' }}>Nombre</th>
                  <th style={{ width: '180px' }}>Apellidos</th>
                  <th style={{ width: '130px' }}>Dentro del Cuadro</th>
                  <th style={{ width: '130px' }}>Fuera del Cuadro</th>
                  <th style={{ width: '140px' }}>Curso / Texto 2</th>
                </>
              ) : (
                <>
                  <th>Texto Principal</th>
                  <th>Texto Mostrado</th>
                  <th>Segundo Texto</th>
                </>
              )}
              <th style={{ width: '80px' }}>Dibujo</th>
              <th style={{ width: '80px' }}>Foto</th>
              <th style={{ width: '70px' }}>Copias</th>
              <th style={{ width: '80px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => {
              const fn = r.firstName !== undefined ? r.firstName : (r.displayText || r.fullName.split(/\s+/)[0] || '');
              const sn = r.surnames !== undefined ? r.surnames : (r.fullName.includes(' ') ? r.fullName.split(/\s+/).slice(1).join(' ') : '');
              const preview = parseNameAndInitials(fn, sn, surnameDisplayMode);

              return (
                <tr key={r.id} className={selectedIds.includes(r.id) ? 'row-selected' : ''}>
                  <td>
                    <button className="btn-icon" onClick={() => toggleSelectRow(r.id)}>
                      {selectedIds.includes(r.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                  </td>
                  <td>
                    <input
                      type="number"
                      className="table-input num-input"
                      value={r.listNumber}
                      onChange={(e) => updateRecord(r.id, { listNumber: parseInt(e.target.value, 10) || 0 })}
                    />
                  </td>
                  {mode === 'alumnos' ? (
                    <>
                      <td>
                        <input
                          type="text"
                          className="table-input font-medium"
                          placeholder="Nombre..."
                          value={fn}
                          onChange={(e) => updateRecord(r.id, { firstName: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="table-input"
                          placeholder="Apellidos..."
                          value={sn}
                          onChange={(e) => updateRecord(r.id, { surnames: e.target.value })}
                        />
                      </td>
                      <td>
                        <div className="px-2 py-1 bg-white border border-slate-300 rounded text-center text-xs font-semibold text-slate-800 shadow-sm min-w-[70px]">
                          {preview.firstName || '—'}
                        </div>
                      </td>
                      <td>
                        <div className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-center text-xs font-bold text-indigo-700 min-w-[50px]">
                          {preview.outsideInitials || <span className="text-slate-400 font-normal italic">(ninguna)</span>}
                        </div>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="table-input"
                          placeholder="ej. 1º Infantil A"
                          value={r.secondText || ''}
                          onChange={(e) => updateRecord(r.id, { secondText: e.target.value })}
                        />
                      </td>
                    </>
                  ) : (
                    <>
                      <td>
                        <input
                          type="text"
                          className="table-input"
                          value={r.fullName}
                          onChange={(e) => updateRecord(r.id, { fullName: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="table-input"
                          value={r.displayText}
                          onChange={(e) => updateRecord(r.id, { displayText: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="table-input"
                          placeholder="Opcional..."
                          value={r.secondText || ''}
                          onChange={(e) => updateRecord(r.id, { secondText: e.target.value })}
                        />
                      </td>
                    </>
                  )}
                  <td className="text-center">
                    <button className="btn-table-asset" onClick={() => onOpenDrawingSelector(r.id)}>
                      {r.drawingUrl ? (
                        <img src={r.drawingUrl} alt="dibujo" className="asset-thumb" />
                      ) : (
                        <span className="asset-placeholder">+ Dibujo</span>
                      )}
                    </button>
                  </td>
                  <td className="text-center">
                    <button className="btn-table-asset" onClick={() => onOpenPhotoCropper(r.id)}>
                      {r.photoUrl ? (
                        <img src={r.photoUrl} alt="foto" className="asset-thumb photo-thumb" />
                      ) : (
                        <span className="asset-placeholder">+ Foto</span>
                      )}
                    </button>
                  </td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      className="table-input num-input"
                      value={r.copies}
                      onChange={(e) => updateRecord(r.id, { copies: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                    />
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-icon" title="Duplicar" onClick={() => duplicateRecord(r)}>
                        <Copy size={15} />
                      </button>
                      <button
                        className="btn-icon danger"
                        title="Eliminar"
                        onClick={() => onChangeRecords(records.filter((item) => item.id !== r.id))}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paste Modal */}
      {pasteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content modal-md">
            <h3>Pegar datos desde Excel o Google Sheets</h3>
            <p className="modal-subtitle">
              Copia filas directamente en Excel o Sheets y pégalas aquí. Las columnas se detectarán automáticamente:
              <strong> (Nº, Nombre, Apellidos, Curso)</strong> o <strong>(Nombre Completo, Curso)</strong>.
            </p>
            <textarea
              className="modal-textarea"
              rows={8}
              placeholder="1	Lucas	García Pérez	1º Infantil C&#10;2	Sara	Fernández Moreno	1º Infantil C"
              value={pasteRawText}
              onChange={(e) => setPasteRawText(e.target.value)}
            />
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setPasteModalOpen(false)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleProcessClipboardPaste}>
                Procesar e Importar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
