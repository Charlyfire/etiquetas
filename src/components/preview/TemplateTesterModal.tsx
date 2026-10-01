import React from 'react';
import type { LabelTemplate, RecordItem } from '../../types';
import { LabelCanvas } from '../editor/LabelCanvas';
import { X } from 'lucide-react';

interface TemplateTesterModalProps {
  template: LabelTemplate;
  isOpen: boolean;
  onClose: () => void;
}

const TEST_RECORDS: RecordItem[] = [
  { id: 'test-1', listNumber: 1, fullName: 'Ana', displayText: 'ANA', copies: 1 },
  { id: 'test-2', listNumber: 2, fullName: 'Lucas', displayText: 'LUCAS', copies: 1 },
  { id: 'test-3', listNumber: 3, fullName: 'Martina', displayText: 'MARTINA', copies: 1 },
  { id: 'test-4', listNumber: 4, fullName: 'Emma Seguín López', displayText: 'EMMA S. L.', copies: 1 },
  { id: 'test-5', listNumber: 5, fullName: 'María del Carmen', displayText: 'MARÍA DEL CARMEN', copies: 1 },
];

export const TemplateTesterModal: React.FC<TemplateTesterModalProps> = ({
  template,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-xl">
        <div className="modal-header">
          <div>
            <h2>PROBAR PLANTILLA</h2>
            <p className="modal-subtitle">
              Comprueba cómo se comporta el diseño actual con textos cortos, medianos y largos.
            </p>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="template-test-info">
          <div className="info-chip">
            <strong>Modo Rectángulo:</strong> {template.rectangleMode === 'auto' ? 'Anchura Automática' : 'Anchura Fija'}
          </div>
          <div className="info-chip">
            <strong>Dimensiones Base:</strong> {template.widthMm}mm × {template.heightMm}mm
          </div>
          <div className="info-chip">
            <strong>Fuente Principal:</strong> {template.elements.mainText.fontFamily} ({template.elements.mainText.fontSizePt}pt)
          </div>
        </div>

        <div className="template-test-grid">
          {TEST_RECORDS.map((rec) => (
            <div key={rec.id} className="test-card">
              <div className="test-card-label">
                <span>Texto: <strong>{rec.displayText}</strong> ({rec.displayText.length} caracteres)</span>
              </div>
              <div className="test-canvas-container">
                <LabelCanvas
                  template={template}
                  record={rec}
                  zoomLevel={1.0}
                  selectedElementKey={null}
                  onSelectElement={() => {}}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
