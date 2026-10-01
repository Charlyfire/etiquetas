import Dexie, { type Table } from 'dexie';
import type { Project, LabelTemplate, FontResource, ColorPalette } from '../types';

export interface StoredDrawing {
  id: string;
  name: string;
  category: string;
  dataUrl: string;
  createdAt: number;
}

export class EtiquetasDatabase extends Dexie {
  projects!: Table<Project, string>;
  templates!: Table<LabelTemplate, string>;
  fonts!: Table<FontResource, string>;
  drawings!: Table<StoredDrawing, string>;
  palettes!: Table<ColorPalette, string>;

  constructor() {
    super('GeneradorEtiquetasDB');

    this.version(1).stores({
      projects: 'id, name, mode, updatedAt',
      templates: 'id, name, mode, layoutPreset',
      fonts: 'id, familyName, category, isFavorite, source',
      drawings: 'id, category, name, createdAt',
      palettes: 'id, name',
    });
  }
}

export const db = new EtiquetasDatabase();
