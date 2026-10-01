import React from 'react';
import type { Project, LabelTemplate } from '../../types';
import {
  FolderPlus,
  RotateCcw,
  RotateCw,
  Type,
  Sparkles,
  CheckCircle2,
  FolderOpen,
  Download,
  Home,
} from 'lucide-react';

interface AppHeaderProps {
  currentProject: Project;
  savingStatus: 'saved' | 'saving' | 'idle';
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onNewProject: () => void;
  onOpenProjectList: () => void;
  onOpenFontManager: () => void;
  onOpenFontTester: () => void;
  onOpenTemplateTester: () => void;
  onOpenWelcomeModal: () => void;
  onSelectPresetTemplate: (template: LabelTemplate) => void;
  onExportProjectBackup: () => void;
  onImportProjectBackup: () => void;
  activeTab: 'datos' | 'editor' | 'impresion';
  onChangeTab: (tab: 'datos' | 'editor' | 'impresion') => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentProject,
  savingStatus,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onNewProject,
  onOpenProjectList,
  onOpenFontManager,
  onOpenFontTester,
  onOpenTemplateTester,
  onOpenWelcomeModal,
  onExportProjectBackup,
  onImportProjectBackup,
  activeTab,
  onChangeTab,
}) => {
  return (
    <header className="app-header">
      <div className="header-left">
        <div className="app-branding cursor-pointer" onClick={onOpenWelcomeModal} title="Ir a la pantalla de Inicio y Plantillas">
          <span className="app-logo-icon">🏷️</span>
          <h1 className="app-title">GENERADOR DE ETIQUETAS</h1>
        </div>

        <div className="project-title-box" onClick={onOpenProjectList} title="Cambiar de proyecto">
          <span className="project-name">{currentProject.name}</span>
          <span className="mode-badge">{currentProject.mode === 'alumnos' ? 'Modo Alumnos' : 'Texto Libre'}</span>
          <FolderOpen size={14} className="icon-subtle" />
        </div>

        <div className="saving-indicator">
          {savingStatus === 'saving' ? (
            <span className="saving-text">Guardando...</span>
          ) : (
            <span className="saved-text">
              <CheckCircle2 size={13} /> Guardado
            </span>
          )}
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="header-center">
        <div className="nav-tabs">
          <button
            className={`tab-link ${activeTab === 'datos' ? 'active' : ''}`}
            onClick={() => onChangeTab('datos')}
          >
            1. Datos ({currentProject.records.length})
          </button>
          <button
            className={`tab-link ${activeTab === 'editor' ? 'active' : ''}`}
            onClick={() => onChangeTab('editor')}
          >
            2. Diseñador / Lienzo
          </button>
          <button
            className={`tab-link ${activeTab === 'impresion' ? 'active' : ''}`}
            onClick={() => onChangeTab('impresion')}
          >
            3. Imprimir / Hoja A4
          </button>
        </div>
      </div>

      {/* Header Actions */}
      <div className="header-right">
        <button
          className="btn btn-primary btn-sm flex items-center gap-1.5 font-bold"
          onClick={onOpenWelcomeModal}
          title="Abrir Pantalla de Inicio y Menú de Plantillas"
        >
          <Home size={15} /> Inicio / Plantillas
        </button>

        <div className="header-divider" />

        <button className="btn-icon" title="Deshacer (Ctrl+Z)" disabled={!canUndo} onClick={onUndo}>
          <RotateCcw size={16} />
        </button>
        <button className="btn-icon" title="Rehacer (Ctrl+Y)" disabled={!canRedo} onClick={onRedo}>
          <RotateCw size={16} />
        </button>

        <div className="header-divider" />

        <button className="btn btn-secondary btn-sm" onClick={onOpenFontManager}>
          <Type size={14} /> Fuentes
        </button>

        <button className="btn btn-secondary btn-sm" onClick={onOpenFontTester}>
          <Sparkles size={14} /> Probar Fuentes
        </button>

        <button className="btn btn-secondary btn-sm" onClick={onOpenTemplateTester}>
          <Sparkles size={14} /> Probar Plantilla
        </button>

        <div className="header-divider" />

        <button className="btn btn-outline btn-sm" title="Importar copia de proyecto" onClick={onImportProjectBackup}>
          <FolderOpen size={14} /> Importar .etiquetas
        </button>

        <button className="btn btn-outline btn-sm" title="Copia de seguridad del proyecto" onClick={onExportProjectBackup}>
          <Download size={14} /> Exportar .etiquetas
        </button>

        <button className="btn btn-outline btn-sm" onClick={onNewProject}>
          <FolderPlus size={14} /> Nuevo Proyecto
        </button>
      </div>
    </header>
  );
};
