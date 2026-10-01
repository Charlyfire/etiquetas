import React, { useEffect, useState } from 'react';
import type { Project, FontResource, ValidationIssue } from './types';
import { db } from './storage/db';
import { loadAllFonts } from './utils/fontManager';
import { INITIAL_TEMPLATES } from './templates/initialTemplates';
import { SAMPLE_STUDENT_RECORDS } from './data/sampleData';
import { autoAssignDrawings, detectRecordIssues, calculateLabelDimensions } from './engine/compositionEngine';
import { exportSheetPagesToPdf, exportLabelsToZip, exportProjectToJsonFile, importProjectFromJsonFile } from './utils/exportEngine';

// Components
import { AppHeader } from './components/header/AppHeader';
import { DataSpreadsheet } from './components/data/DataSpreadsheet';
import { LabelCanvas } from './components/editor/LabelCanvas';
import { InspectorSidebar } from './components/inspector/InspectorSidebar';
import { PrintPageSheet } from './components/print/PrintPageSheet';
import { FontManagerModal } from './components/fonts/FontManagerModal';
import { FontTesterModal } from './components/fonts/FontTesterModal';
import { TemplateTesterModal } from './components/preview/TemplateTesterModal';
import { DrawingSelectorModal } from './components/resources/DrawingSelectorModal';
import { PhotoCropperModal } from './components/resources/PhotoCropperModal';
import { ProjectManagerModal } from './components/projects/ProjectManagerModal';
import { WelcomeModal } from './components/welcome/WelcomeModal';

// Sample drawing icons
import { SAMPLE_DRAWING_CATEGORIES } from './resources/sampleDrawings';

export const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  // History stack for Undo/Redo
  const [history, setHistory] = useState<Project[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Fonts & Resources
  const [fonts, setFonts] = useState<FontResource[]>([]);
  const [savingStatus, setSavingStatus] = useState<'saved' | 'saving' | 'idle'>('saved');

  // Active Tab View ('datos' | 'editor' | 'impresion')
  const [activeTab, setActiveTab] = useState<'datos' | 'editor' | 'impresion'>('editor');

  // Modals state
  const [fontManagerOpen, setFontManagerOpen] = useState(false);
  const [fontTesterOpen, setFontTesterOpen] = useState(false);
  const [templateTesterOpen, setTemplateTesterOpen] = useState(false);
  const [projectManagerOpen, setProjectManagerOpen] = useState(false);
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(false);

  // Selected item modal targets
  const [drawingModalRecordId, setDrawingModalRecordId] = useState<string | null>(null);
  const [photoModalRecordId, setPhotoModalRecordId] = useState<string | null>(null);

  // Editor states
  const [selectedRecordId] = useState<string | null>(null);
  const [selectedElementKey, setSelectedElementKey] = useState<string | null>('mainText');
  const [zoomLevel] = useState<number>(1.25);
  const [printPageIndex, setPrintPageIndex] = useState<number>(0);
  const [recordIssues, setRecordIssues] = useState<ValidationIssue[]>([]);

  // Initial app load: load fonts & database projects
  useEffect(() => {
    async function initApp() {
      const loadedFonts = await loadAllFonts();
      setFonts(loadedFonts);

      const dbProjects = await db.projects.toArray();
      if (dbProjects.length > 0) {
        setProjects(dbProjects);
        setCurrentProject(dbProjects[0]);
        setHistory([dbProjects[0]]);
        setHistoryIndex(0);
      } else {
        // Create initial default project
        const defaultProj: Project = {
          id: 'proj-default-1',
          name: 'Etiquetas Libros 1º Infantil C',
          mode: 'alumnos',
          records: SAMPLE_STUDENT_RECORDS,
          template: INITIAL_TEMPLATES[2], // Número + Nombre + Dibujo
          printSettings: {
            paperSize: 'A4',
            orientation: 'portrait',
            marginTopMm: 10,
            marginBottomMm: 10,
            marginLeftMm: 10,
            marginRightMm: 10,
            gapHorizontalMm: 0, // Joined contiguous labels with 0 space between them
            gapVerticalMm: 0,   // Joined contiguous labels with 0 space between them
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

        await db.projects.put(defaultProj);
        setProjects([defaultProj]);
        setCurrentProject(defaultProj);
        setHistory([defaultProj]);
        setHistoryIndex(0);
      }
    }
    initApp();
  }, []);

  // Keyboard undo/redo shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);

  // Project state mutator with undo history & auto-save to IndexedDB
  const updateCurrentProject = async (updatedProject: Project, addToHistory: boolean = true) => {
    setCurrentProject(updatedProject);
    setSavingStatus('saving');

    if (addToHistory) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(updatedProject);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }

    await db.projects.put(updatedProject);
    setProjects((prev) => prev.map((p) => (p.id === updatedProject.id ? updatedProject : p)));

    setTimeout(() => {
      setSavingStatus('saved');
    }, 400);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      const prevProject = history[prevIndex];
      setCurrentProject(prevProject);
      db.projects.put(prevProject);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      const nextProject = history[nextIndex];
      setCurrentProject(nextProject);
      db.projects.put(nextProject);
    }
  };

  // Issue Detection runner
  useEffect(() => {
    if (!currentProject) return;

    let isMounted = true;
    async function runValidation() {
      const activeRecord = currentProject!.records[0];
      if (!activeRecord) return;

      const dims = await calculateLabelDimensions(currentProject!.template, activeRecord);
      const issues = detectRecordIssues(currentProject!.template, activeRecord, dims);
      if (isMounted) {
        setRecordIssues(issues);
      }
    }
    runValidation();
    return () => {
      isMounted = false;
    };
  }, [currentProject?.template, currentProject?.records]);

  if (!currentProject) {
    return <div className="loading-screen">Cargando Generador de Etiquetas...</div>;
  }

  // Active record for preview
  const activeRecord = currentProject.records.find((r) => r.id === selectedRecordId) || currentProject.records[0] || SAMPLE_STUDENT_RECORDS[0];
  const drawingRecord = currentProject.records.find((r) => r.id === drawingModalRecordId) || null;
  const photoRecord = currentProject.records.find((r) => r.id === photoModalRecordId) || null;

  // Auto assign drawings
  const handleAutoAssignDrawings = () => {
    const defaultIcons = SAMPLE_DRAWING_CATEGORIES[0].items.map((i) => i.svgDataUrl);
    const updatedRecords = autoAssignDrawings(currentProject.records, defaultIcons, {
      mode: 'order',
      allowRepeats: true,
    });
    updateCurrentProject({ ...currentProject, records: updatedRecords });
  };

  // Export handlers
  const handleExportPdf = async () => {
    const safeName = currentProject.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const pageNodes = document.querySelectorAll('.a4-sheet-pdf-page');
    if (pageNodes.length > 0) {
      const pageElements = Array.from(pageNodes) as HTMLElement[];
      await exportSheetPagesToPdf(pageElements, `${safeName}.pdf`, currentProject.printSettings.orientation);
    } else {
      const elem = document.getElementById('print-sheet-page-container');
      if (elem) {
        await exportSheetPagesToPdf([elem], `${safeName}.pdf`, currentProject.printSettings.orientation);
      }
    }
  };

  const handleExportPngZip = () => {
    const elem = document.getElementById('print-sheet-page-container');
    if (elem) {
      const safeName = currentProject.name.replace(/[^a-zA-Z0-9_-]/g, '_');
      exportLabelsToZip([{ name: currentProject.name, element: elem }], `${safeName}_imagenes.zip`);
    }
  };

  // Import project backup file
  const handleImportBackup = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.etiquetas, .json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const imported = await importProjectFromJsonFile(file);
        await db.projects.put(imported);
        setProjects((prev) => [...prev.filter((p) => p.id !== imported.id), imported]);
        setCurrentProject(imported);
        setHistory([imported]);
        setHistoryIndex(0);
      } catch (err) {
        alert('Error al importar el proyecto.');
      }
    };
    input.click();
  };

  return (
    <div className="app-main-layout">
      <AppHeader
        currentProject={currentProject}
        savingStatus={savingStatus}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onNewProject={() => setProjectManagerOpen(true)}
        onOpenProjectList={() => setProjectManagerOpen(true)}
        onOpenFontManager={() => setFontManagerOpen(true)}
        onOpenFontTester={() => setFontTesterOpen(true)}
        onOpenTemplateTester={() => setTemplateTesterOpen(true)}
        onOpenWelcomeModal={() => setWelcomeModalOpen(true)}
        onSelectPresetTemplate={(tmpl) => updateCurrentProject({ ...currentProject, template: tmpl })}
        onExportProjectBackup={() => exportProjectToJsonFile(currentProject)}
        onImportProjectBackup={handleImportBackup}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
      />

      <div className="app-container">
        <main className="main-content-area">
          {/* TAB 1: DATA SPREADSHEET */}
          {activeTab === 'datos' && (
            <DataSpreadsheet
              mode={currentProject.mode}
              records={currentProject.records}
              onChangeRecords={(recs) => updateCurrentProject({ ...currentProject, records: recs })}
              onOpenDrawingSelector={(id) => setDrawingModalRecordId(id)}
              onOpenPhotoCropper={(id) => setPhotoModalRecordId(id)}
              onAutoAssignDrawings={handleAutoAssignDrawings}
              template={currentProject.template}
              onChangeTemplate={(template) => updateCurrentProject({ ...currentProject, template })}
            />
          )}

          {/* TAB 2: CANVAS DESIGNER */}
          {activeTab === 'editor' && (
            <div className="editor-workspace">
              <div className="canvas-center-stage">
                <LabelCanvas
                  template={currentProject.template}
                  record={activeRecord}
                  zoomLevel={zoomLevel}
                  selectedElementKey={selectedElementKey}
                  onSelectElement={setSelectedElementKey}
                />
              </div>

              <InspectorSidebar
                project={currentProject}
                selectedElementKey={selectedElementKey}
                issues={recordIssues}
                fonts={fonts}
                onChangeTemplate={(tmpl) => updateCurrentProject({ ...currentProject, template: tmpl })}
                onOpenFontManager={() => setFontManagerOpen(true)}
                onOpenFontTester={() => setFontTesterOpen(true)}
              />
            </div>
          )}

          {/* TAB 3: PRINT SHEET VIEW */}
          {activeTab === 'impresion' && (
            <PrintPageSheet
              project={currentProject}
              pageIndex={printPageIndex}
              onPageChange={setPrintPageIndex}
              onExportPdf={handleExportPdf}
              onExportPngZip={handleExportPngZip}
              onChangePrintSettings={(printSettings) => updateCurrentProject({ ...currentProject, printSettings })}
              onChangeTemplate={(tmpl) => updateCurrentProject({ ...currentProject, template: tmpl })}
              onChangeRecords={(records) => updateCurrentProject({ ...currentProject, records })}
            />
          )}
        </main>
      </div>

      {/* MODALS */}
      <FontManagerModal
        fonts={fonts}
        isOpen={fontManagerOpen}
        onClose={() => setFontManagerOpen(false)}
        onFontsUpdated={async () => {
          const updated = await loadAllFonts();
          setFonts(updated);
        }}
        onOpenTester={() => {
          setFontManagerOpen(false);
          setFontTesterOpen(true);
        }}
      />

      <FontTesterModal
        fonts={fonts}
        isOpen={fontTesterOpen}
        onClose={() => setFontTesterOpen(false)}
        onSelectFont={(family) => {
          updateCurrentProject({
            ...currentProject,
            template: {
              ...currentProject.template,
              elements: {
                ...currentProject.template.elements,
                mainText: { ...currentProject.template.elements.mainText, fontFamily: family },
              },
            },
          });
        }}
      />

      <TemplateTesterModal
        template={currentProject.template}
        isOpen={templateTesterOpen}
        onClose={() => setTemplateTesterOpen(false)}
      />

      <DrawingSelectorModal
        record={drawingRecord}
        isOpen={!!drawingModalRecordId}
        onClose={() => setDrawingModalRecordId(null)}
        onSelectDrawing={(recordId, url) => {
          const updated = currentProject.records.map((r) => (r.id === recordId ? { ...r, drawingUrl: url } : r));
          updateCurrentProject({ ...currentProject, records: updated });
        }}
      />

      <PhotoCropperModal
        record={photoRecord}
        isOpen={!!photoModalRecordId}
        onClose={() => setPhotoModalRecordId(null)}
        onSavePhoto={(recordId, photoUrl) => {
          const updated = currentProject.records.map((r) => (r.id === recordId ? { ...r, photoUrl } : r));
          updateCurrentProject({ ...currentProject, records: updated });
        }}
      />

      <ProjectManagerModal
        projects={projects}
        currentProjectId={currentProject.id}
        isOpen={projectManagerOpen}
        onClose={() => setProjectManagerOpen(false)}
        onSelectProject={(id) => {
          const found = projects.find((p) => p.id === id);
          if (found) {
            setCurrentProject(found);
            setHistory([found]);
            setHistoryIndex(0);
          }
        }}
        onCreateProject={async (newProj) => {
          await db.projects.put(newProj);
          setProjects((prev) => [...prev, newProj]);
          setCurrentProject(newProj);
          setHistory([newProj]);
          setHistoryIndex(0);
        }}
        onDeleteProject={async (id) => {
          await db.projects.delete(id);
          setProjects((prev) => prev.filter((p) => p.id !== id));
        }}
        onImportProject={handleImportBackup}
      />

      <WelcomeModal
        isOpen={welcomeModalOpen}
        onClose={() => setWelcomeModalOpen(false)}
        onSelectTemplate={(tmpl) => updateCurrentProject({ ...currentProject, template: tmpl })}
        onNewCustomProject={() => setProjectManagerOpen(true)}
        onOpenProjectList={() => setProjectManagerOpen(true)}
        onImportBackup={handleImportBackup}
        currentProjectName={currentProject?.name}
      />
    </div>
  );
};

export default App;
