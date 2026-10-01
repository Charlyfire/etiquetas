import React, { useState } from 'react';
import type { FontResource } from '../../types';
import { X, Check, Search } from 'lucide-react';

interface FontTesterModalProps {
  fonts: FontResource[];
  isOpen: boolean;
  onClose: () => void;
  onSelectFont: (fontFamily: string) => void;
}

const DEFAULT_TEST_TEXTS = [
  'ANA',
  'LUCAS',
  'MARTINA',
  'EMMA S. L.',
  'MARÍA DEL CARMEN',
  'ÁLVARO',
  'ÍÑIGO',
  'PEÑA',
];

export const FontTesterModal: React.FC<FontTesterModalProps> = ({
  fonts,
  isOpen,
  onClose,
  onSelectFont,
}) => {
  const [customText, setCustomText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [fontSize, setFontSize] = useState<number>(24);

  if (!isOpen) return null;

  const testList = customText.trim() ? [customText] : DEFAULT_TEST_TEXTS;

  const filteredFonts = fonts.filter((f) => {
    const matchesSearch = f.familyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || f.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-xl">
        <div className="modal-header">
          <div>
            <h2>PROBAR FUENTE</h2>
            <p className="modal-subtitle">
              Comprueba cómo responden distintas fuentes a nombres escolares cortos, largos y con tildes/Ñ.
            </p>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Controls bar */}
        <div className="font-tester-controls">
          <div className="input-group">
            <label>Texto personalizado:</label>
            <input
              type="text"
              placeholder="Escribe tu texto aquí..."
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Buscar fuente:</label>
            <div className="search-input-wrapper">
              <Search size={16} />
              <input
                type="text"
                placeholder="Nombre de fuente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="input-group">
            <label>Categoría:</label>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              <option value="all">Todas las categorías</option>
              <option value="Escolar">Escolar</option>
              <option value="Manuscrita">Manuscrita</option>
              <option value="Decorativa">Decorativa</option>
              <option value="Estándar">Estándar</option>
            </select>
          </div>

          <div className="input-group" style={{ width: '120px' }}>
            <label>Tamaño: {fontSize}pt</label>
            <input
              type="range"
              min="14"
              max="48"
              value={fontSize}
              onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
            />
          </div>
        </div>

        {/* Font test preview list */}
        <div className="font-tester-list">
          {filteredFonts.map((font) => (
            <div key={font.id} className="font-tester-card">
              <div className="font-card-header">
                <div>
                  <span className="font-name">{font.familyName}</span>
                  <span className="font-badge">{font.category}</span>
                  {font.source === 'custom' && <span className="font-badge custom">Cargada</span>}
                </div>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    onSelectFont(font.familyName);
                    onClose();
                  }}
                >
                  <Check size={14} /> Usar esta fuente
                </button>
              </div>

              <div className="font-preview-grid">
                {testList.map((testStr, idx) => (
                  <div key={idx} className="font-sample-item">
                    <span className="sample-label">{testStr}:</span>
                    <span
                      className="sample-text"
                      style={{
                        fontFamily: `"${font.familyName}", sans-serif`,
                        fontSize: `${fontSize}px`,
                      }}
                    >
                      {testStr}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
