import React from 'react';
import type { FontResource } from '../../types';
import { processFontFile } from '../../utils/fontManager';
import { db } from '../../storage/db';
import { Upload, Trash2, X, Sparkles } from 'lucide-react';

interface FontManagerModalProps {
  fonts: FontResource[];
  isOpen: boolean;
  onClose: () => void;
  onFontsUpdated: () => void;
  onOpenTester: () => void;
}

export const FontManagerModal: React.FC<FontManagerModalProps> = ({
  fonts,
  isOpen,
  onClose,
  onFontsUpdated,
  onOpenTester,
}) => {
  if (!isOpen) return null;

  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      try {
        await processFontFile(files[i]);
      } catch (err) {
        console.error('Error uploading font:', err);
      }
    }
    onFontsUpdated();
  };

  const deleteFont = async (id: string) => {
    await db.fonts.delete(id);
    onFontsUpdated();
  };

  const toggleFavorite = async (font: FontResource) => {
    if (font.source === 'custom') {
      await db.fonts.update(font.id, { isFavorite: !font.isFavorite });
      onFontsUpdated();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-lg">
        <div className="modal-header">
          <div>
            <h2>BIBLIOTECA DE TIPOGRAFÍAS</h2>
            <p className="modal-subtitle">
              Gestiona tus fuentes escolares y manuscritas. Añade archivos .TTF, .OTF, .WOFF de tu equipo.
            </p>
          </div>
          <div className="modal-header-actions">
            <button className="btn btn-secondary" onClick={onOpenTester}>
              <Sparkles size={16} /> Probar Fuentes
            </button>
            <button className="btn-icon" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Upload toolbar */}
        <div className="font-manager-toolbar">
          <label className="btn btn-primary file-upload-btn">
            <Upload size={16} /> + AÑADIR FUENTE (.ttf, .otf, .woff)
            <input type="file" accept=".ttf, .otf, .woff, .woff2" multiple onChange={handleFontUpload} hidden />
          </label>
        </div>

        {/* Font items list */}
        <div className="font-resource-grid">
          {fonts.map((font) => (
            <div key={font.id} className="font-resource-card">
              <div className="card-top">
                <span className="font-family-title">{font.familyName}</span>
                <div className="card-actions">
                  {font.source === 'custom' && (
                    <>
                      <button
                        className={`btn-icon ${font.isFavorite ? 'active' : ''}`}
                        title="Marcar como favorita"
                        onClick={() => toggleFavorite(font)}
                      >
                        ★
                      </button>
                      <button
                        className="btn-icon danger"
                        title="Eliminar de mi biblioteca"
                        onClick={() => deleteFont(font.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div
                className="font-preview-sample"
                style={{ fontFamily: `"${font.familyName}", sans-serif` }}
              >
                Carmen — 1º Infantil
              </div>

              <div className="card-bottom">
                <span className="font-category-tag">{font.category}</span>
                <span className="font-type-tag">{font.source === 'built-in' ? 'Incluida' : 'Personalizada'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
