import React, { useState } from 'react';
import type { RecordItem } from '../../types';
import { Upload, X, ZoomIn, ZoomOut, Check, Trash2 } from 'lucide-react';

interface PhotoCropperModalProps {
  record: RecordItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSavePhoto: (recordId: string, photoDataUrl: string) => void;
}

export const PhotoCropperModal: React.FC<PhotoCropperModalProps> = ({
  record,
  isOpen,
  onClose,
  onSavePhoto,
}) => {
  const [tempPhotoUrl, setTempPhotoUrl] = useState<string>('');
  const [zoom, setZoom] = useState<number>(1);

  if (!isOpen || !record) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      setTempPhotoUrl(evt.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const photoToSave = tempPhotoUrl || record.photoUrl || '';
    onSavePhoto(record.id, photoToSave);
    onClose();
  };

  const handleClear = () => {
    onSavePhoto(record.id, '');
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-md">
        <div className="modal-header">
          <div>
            <h3>Fotografía del Registro</h3>
            <p className="modal-subtitle">Asigna y ajusta el encuadre para {record.displayText}</p>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Upload area or photo preview */}
        <div className="photo-crop-area">
          {tempPhotoUrl || record.photoUrl ? (
            <div className="photo-viewport-container">
              <div className="photo-viewport">
                <img
                  src={tempPhotoUrl || record.photoUrl}
                  alt="Foto"
                  style={{
                    transform: `scale(${zoom})`,
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="photo-upload-placeholder">
              <Upload size={36} />
              <p>Haz clic para subir una foto de tu ordenador</p>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} />
            </div>
          )}
        </div>

        {(tempPhotoUrl || record.photoUrl) && (
          <div className="photo-controls">
            <label className="btn btn-secondary file-upload-btn btn-sm">
              Cambiar foto
              <input type="file" accept="image/*" onChange={handlePhotoUpload} hidden />
            </label>

            <div className="zoom-slider-box">
              <ZoomOut size={16} />
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
              />
              <ZoomIn size={16} />
            </div>
          </div>
        )}

        <div className="modal-footer">
          {(tempPhotoUrl || record.photoUrl) && (
            <button className="btn btn-danger btn-sm" onClick={handleClear}>
              <Trash2 size={14} /> Quitar Foto
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            <Check size={16} /> Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};
