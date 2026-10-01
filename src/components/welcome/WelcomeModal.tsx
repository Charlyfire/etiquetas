import React from 'react';
import type { LabelTemplate } from '../../types';
import { INITIAL_TEMPLATES } from '../../templates/initialTemplates';
import { Sparkles, FolderPlus, FolderOpen, CheckCircle, Tag, Award, Image, User, Layout, X } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: LabelTemplate) => void;
  onNewCustomProject: () => void;
  onOpenProjectList: () => void;
  onImportBackup: () => void;
  currentProjectName?: string;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  onNewCustomProject,
  onOpenProjectList,
  onImportBackup,
  currentProjectName,
}) => {
  if (!isOpen) return null;

  const getTemplateIcon = (layoutPreset: string) => {
    switch (layoutPreset) {
      case 'solo_nombre':
        return <Tag className="w-5 h-5 text-blue-600" />;
      case 'numero_nombre_dibujo':
        return <Sparkles className="w-5 h-5 text-purple-600" />;
      case 'foto_izq_nombre_der':
        return <Image className="w-5 h-5 text-emerald-600" />;
      case 'foto_circular_nombre':
        return <User className="w-5 h-5 text-amber-600" />;
      case 'medalla_circular':
        return <Award className="w-5 h-5 text-yellow-600" />;
      case 'foto_arriba_nombre_abajo':
        return <Layout className="w-5 h-5 text-indigo-600" />;
      default:
        return <Tag className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content welcome-modal-container max-w-4xl w-full max-h-[90vh] flex flex-col bg-white text-slate-900 p-6 rounded-2xl shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="modal-header border-b border-slate-200 pb-4 mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-900">
              🏷️ APP ETIQUETAS - Pantalla de Inicio
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Elige una plantilla escolar prediseñada o abre un proyecto existente.
            </p>
          </div>
          {currentProjectName && (
            <button className="btn-icon text-slate-500 hover:text-slate-800" onClick={onClose} title="Cerrar ventana">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Body content */}
        <div className="modal-body overflow-y-auto flex-1 pr-1 space-y-6">
          {/* Section: Templates Grid */}
          <div>
            <h3 className="text-base font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Sparkles size={18} className="text-blue-600" />
              Plantillas Prediseñadas Disponibles
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {INITIAL_TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="welcome-card border border-slate-200 rounded-xl p-4 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer bg-white flex flex-col justify-between group"
                  onClick={() => {
                    onSelectTemplate(tmpl);
                    onClose();
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 font-bold text-slate-900 text-base group-hover:text-blue-600">
                        {getTemplateIcon(tmpl.layoutPreset)}
                        <span>{tmpl.name}</span>
                      </div>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                        {tmpl.widthMm} × {tmpl.heightMm} mm
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                      {tmpl.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-2">
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <span className="font-semibold text-slate-700">Métricas:</span>
                      <span className="text-slate-600">0,6mm borde • 20pt texto</span>
                    </div>

                    <button className="btn btn-primary btn-xs font-semibold group-hover:bg-blue-600">
                      Usar plantilla
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Action Buttons */}
          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Otras Acciones de Inicio</h3>
            <div className="flex flex-wrap gap-3">
              <button
                className="btn btn-outline flex-1 min-w-[180px] justify-center py-2.5 text-sm gap-2 bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                onClick={() => {
                  onNewCustomProject();
                  onClose();
                }}
              >
                <FolderPlus size={16} className="text-blue-600" />
                Nuevo Proyecto Personalizado
              </button>

              <button
                className="btn btn-outline flex-1 min-w-[180px] justify-center py-2.5 text-sm gap-2 bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                onClick={() => {
                  onOpenProjectList();
                  onClose();
                }}
              >
                <FolderOpen size={16} className="text-purple-600" />
                Ver Mis Proyectos Guardados
              </button>

              <button
                className="btn btn-outline flex-1 min-w-[180px] justify-center py-2.5 text-sm gap-2 bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                onClick={() => {
                  onImportBackup();
                  onClose();
                }}
              >
                <FolderOpen size={16} className="text-emerald-600" />
                Importar Archivo .etiquetas
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        {currentProjectName && (
          <div className="modal-footer border-t border-slate-200 pt-3 mt-4 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Proyecto activo: <strong className="text-slate-800">{currentProjectName}</strong>
            </span>
            <button className="btn btn-secondary btn-sm flex items-center gap-1.5" onClick={onClose}>
              <CheckCircle size={14} /> Continuar con proyecto actual
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
