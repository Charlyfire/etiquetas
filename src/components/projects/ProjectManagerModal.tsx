import React, { useState } from 'react';
import type { Project, DataMode } from '../../types';
import { INITIAL_TEMPLATES } from '../../templates/initialTemplates';
import { SAMPLE_STUDENT_RECORDS, SAMPLE_TEXT_RECORDS } from '../../data/sampleData';
import { X, FolderPlus, FolderOpen, Trash2, Upload } from 'lucide-react';

interface ProjectManagerModalProps {
  projects: Project[];
  currentProjectId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (newProject: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onImportProject: () => void;
}

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
  projects,
  currentProjectId,
  isOpen,
  onClose,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onImportProject,
}) => {
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectMode, setNewProjectMode] = useState<DataMode>('alumnos');

  if (!isOpen) return null;

  const handleCreate = () => {
    if (!newProjectName.trim()) return;

    const initialTemplate = newProjectMode === 'alumnos' ? INITIAL_TEMPLATES[2] : INITIAL_TEMPLATES[8];
    const initialRecords = newProjectMode === 'alumnos' ? SAMPLE_STUDENT_RECORDS : SAMPLE_TEXT_RECORDS;

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: newProjectName.trim(),
      mode: newProjectMode,
      records: initialRecords,
      template: initialTemplate,
      printSettings: {
        paperSize: 'A4',
        orientation: 'portrait',
        marginTopMm: 10,
        marginBottomMm: 10,
        marginLeftMm: 10,
        marginRightMm: 10,
        gapHorizontalMm: 0,
        gapVerticalMm: 0,
        layoutMode: 'compact_auto',
        gridRows: 6,
        gridCols: 3,
        showCropMarks: false,
        showLabelBorders: true,
        bleedMm: 0,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    onCreateProject(newProject);
    setNewProjectName('');
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-lg">
        <div className="modal-header">
          <div>
            <h2>MIS PROYECTOS DE ETIQUETAS</h2>
            <p className="modal-subtitle">Gestiona o cambia entre tus listas y plantillas guardadas.</p>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Create new project form */}
        <div className="new-project-box">
          <h4>
            <FolderPlus size={16} /> Crear Nuevo Proyecto
          </h4>
          <div className="form-row">
            <input
              type="text"
              placeholder="Ej. Etiquetas Libros 1º Infantil C"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
            />
            <select value={newProjectMode} onChange={(e) => setNewProjectMode(e.target.value as DataMode)}>
              <option value="alumnos">Modo Alumnos (Nº, Nombre, Foto)</option>
              <option value="texto_libre">Modo Texto Libre / Material</option>
            </select>
            <button className="btn btn-primary" onClick={handleCreate}>
              Crear Proyecto
            </button>
          </div>
        </div>

        {/* Existing projects list */}
        <div className="projects-grid">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className={`project-card ${proj.id === currentProjectId ? 'active-project' : ''}`}
            >
              <div className="card-top">
                <span className="project-title">{proj.name}</span>
                <span className="project-badge">{proj.mode === 'alumnos' ? 'Alumnos' : 'Texto Libre'}</span>
              </div>

              <div className="card-details">
                <span>Registros: {proj.records.length}</span>
                <span>Plantilla: {proj.template.name}</span>
              </div>

              <div className="card-actions">
                <button
                  className="btn btn-sm btn-primary"
                  disabled={proj.id === currentProjectId}
                  onClick={() => {
                    onSelectProject(proj.id);
                    onClose();
                  }}
                >
                  <FolderOpen size={14} /> {proj.id === currentProjectId ? 'Abierto' : 'Abrir'}
                </button>

                {projects.length > 1 && proj.id !== currentProjectId && (
                  <button className="btn btn-sm btn-danger" onClick={() => onDeleteProject(proj.id)}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onImportProject}>
            <Upload size={14} /> Importar Copia (.etiquetas)
          </button>
          <div style={{ flex: 1 }} />
          <button className="btn btn-outline" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
