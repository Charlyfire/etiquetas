import React, { useEffect, useState } from 'react';
import type { RecordItem } from '../../types';
import { SAMPLE_DRAWING_CATEGORIES } from '../../resources/sampleDrawings';
import { processUploadedImageFiles, loadUserDrawings, deleteUserDrawing } from '../../resources/drawingManager';
import type { StoredDrawing } from '../../storage/db';
import { X, Upload, Trash2, Image as ImageIcon, Plus } from 'lucide-react';

interface DrawingSelectorModalProps {
  record: RecordItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectDrawing: (recordId: string, drawingUrl: string) => void;
}

export const DrawingSelectorModal: React.FC<DrawingSelectorModalProps> = ({
  record,
  isOpen,
  onClose,
  onSelectDrawing,
}) => {
  const [selectedCat, setSelectedCat] = useState<string>('Mis Imágenes');
  const [userDrawings, setUserDrawings] = useState<StoredDrawing[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Load custom stored user drawings on open
  useEffect(() => {
    if (isOpen) {
      loadUserDrawings().then((drawings) => {
        setUserDrawings(drawings);
        if (drawings.length > 0) {
          setSelectedCat('Mis Imágenes');
        } else {
          setSelectedCat('Animales');
        }
      });
    }
  }, [isOpen]);

  if (!isOpen || !record) return null;

  const currentPresetCategory = SAMPLE_DRAWING_CATEGORIES.find((c) => c.name === selectedCat);

  // File Upload Handler (multiple images allowed!)
  const handleCustomUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newDrawings = await processUploadedImageFiles(files);
    setUserDrawings((prev) => [...newDrawings, ...prev]);
    setSelectedCat('Mis Imágenes');

    // Auto select first uploaded image if single file
    if (newDrawings.length === 1) {
      onSelectDrawing(record.id, newDrawings[0].dataUrl);
      onClose();
    }
  };

  // Drag & Drop Handler
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newDrawings = await processUploadedImageFiles(e.dataTransfer.files);
      setUserDrawings((prev) => [...newDrawings, ...prev]);
      setSelectedCat('Mis Imágenes');
    }
  };

  const handleDeleteUserImage = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteUserDrawing(id);
    setUserDrawings((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-lg">
        <div className="modal-header">
          <div>
            <h3>SELECCIONAR O SUBIR DIBUJO / IMAGEN</h3>
            <p className="modal-subtitle">
              Sube tus propias imágenes (PNG, JPG, SVG, WEBP) o elige de la biblioteca para {record.displayText}.
            </p>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Upload Drop Zone & Toolbar */}
        <div
          className={`image-upload-dropzone ${isDragging ? 'dragging' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <div className="dropzone-content">
            <Upload size={24} className="icon-primary" />
            <span>Arrastra aquí tus imágenes o</span>
            <label className="btn btn-primary btn-sm file-upload-btn">
              <Plus size={15} /> SUBIR IMÁGENES (.PNG, .JPG, .SVG, .WEBP)
              <input
                type="file"
                accept="image/png, image/jpeg, image/svg+xml, image/webp"
                multiple
                onChange={handleCustomUpload}
                hidden
              />
            </label>
          </div>
        </div>

        {/* Category tabs */}
        <div className="drawing-selector-tabs">
          <button
            className={`tab-btn ${selectedCat === 'Mis Imágenes' ? 'active' : ''}`}
            onClick={() => setSelectedCat('Mis Imágenes')}
          >
            <ImageIcon size={14} /> Mis Imágenes Subidas ({userDrawings.length})
          </button>

          {SAMPLE_DRAWING_CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              className={`tab-btn ${selectedCat === cat.name ? 'active' : ''}`}
              onClick={() => setSelectedCat(cat.name)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Grid of icons / user uploaded images */}
        <div className="drawing-grid">
          {selectedCat === 'Mis Imágenes' &&
            userDrawings.map((item) => (
              <div
                key={item.id}
                className={`drawing-card ${record.drawingUrl === item.dataUrl ? 'selected' : ''}`}
                onClick={() => {
                  onSelectDrawing(record.id, item.dataUrl);
                  onClose();
                }}
              >
                <img src={item.dataUrl} alt={item.name} />
                <span className="drawing-title">{item.name}</span>
                <button
                  className="btn-icon danger card-delete-btn"
                  title="Eliminar de mi biblioteca"
                  onClick={(e) => handleDeleteUserImage(e, item.id)}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}

          {selectedCat !== 'Mis Imágenes' &&
            currentPresetCategory?.items.map((item) => (
              <div
                key={item.id}
                className={`drawing-card ${record.drawingUrl === item.svgDataUrl ? 'selected' : ''}`}
                onClick={() => {
                  onSelectDrawing(record.id, item.svgDataUrl);
                  onClose();
                }}
              >
                <img src={item.svgDataUrl} alt={item.name} />
                <span className="drawing-title">{item.name}</span>
              </div>
            ))}
        </div>

        <div className="modal-footer">
          {record.drawingUrl && (
            <button
              className="btn btn-danger btn-sm"
              onClick={() => {
                onSelectDrawing(record.id, '');
                onClose();
              }}
            >
              <Trash2 size={14} /> Sin Dibujo
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
