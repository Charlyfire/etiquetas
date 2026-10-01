import { db, type StoredDrawing } from '../storage/db';

export async function processUploadedImageFiles(files: FileList | File[], category: string = 'Mis Imágenes'): Promise<StoredDrawing[]> {
  const newDrawings: StoredDrawing[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const cleanName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;

    const drawingItem: StoredDrawing = {
      id: `img-user-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: cleanName,
      category,
      dataUrl,
      createdAt: Date.now(),
    };

    await db.drawings.put(drawingItem);
    newDrawings.push(drawingItem);
  }

  return newDrawings;
}

export async function loadUserDrawings(): Promise<StoredDrawing[]> {
  return await db.drawings.toArray();
}

export async function deleteUserDrawing(id: string): Promise<void> {
  await db.drawings.delete(id);
}
