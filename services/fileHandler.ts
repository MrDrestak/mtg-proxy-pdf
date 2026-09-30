import { CardImage } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { fileToDataUrl, processCardImageWithBlackCorners } from './imageProcessor';

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_CARDS = 45;
export const RESIZE_WIDTH = 1200; // Higher resolution for print quality

/**
 * Validates file is an image
 */
export function isValidImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(file.type);
}

/**
 * Validates file size
 */
export function isValidFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}

/**
 * Processes a single image file into a CardImage object
 * - Validates type and size
 * - Converts to data URL
 * - Processes with black corners (default)
 * - Returns CardImage ready for printCards state
 */
export async function processImageFile(
  file: File,
  applyProcessing: boolean = true
): Promise<{ card: CardImage; error?: string }> {
  // Validate type
  if (!isValidImageFile(file)) {
    return {
      card: null as any,
      error: `Formato no válido: ${file.name}. Solo JPG, PNG, GIF y WebP.`
    };
  }

  // Validate size
  if (!isValidFileSize(file)) {
    return {
      card: null as any,
      error: `Archivo muy grande: ${file.name}. Máximo 10MB.`
    };
  }

  try {
    // Convert file to data URL
    const dataUrl = await fileToDataUrl(file);

    // Process the image (black corners by default)
    const processedDataUrl = applyProcessing
      ? await processCardImageWithBlackCorners(dataUrl, {
          fixWhiteCorners: true,
          foilMode: false,
          deepBlackThreshold: 0,
          boostContrast: false
        })
      : dataUrl;

    // Create CardImage object
    const card: CardImage = {
      id: uuidv4(),
      name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
      dataUrl: processedDataUrl,
      originalDataUrl: dataUrl,
      type: file.type,
      createdAt: new Date(),
      sourcePath: file.name // Store original filename
    };

    return { card };
  } catch (err) {
    return {
      card: null as any,
      error: `Error procesando ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`
    };
  }
}

/**
 * Processes multiple image files
 * - Validates all files
 * - Returns processed cards and validation errors separately
 * - Respects MAX_CARDS limit
 */
export async function processMultipleImageFiles(
  files: File[],
  existingCardsCount: number = 0,
  applyProcessing: boolean = true
): Promise<{
  cards: CardImage[];
  errors: string[];
  skipped: number;
}> {
  const cards: CardImage[] = [];
  const errors: string[] = [];
  let skipped = 0;

  // Check total limit
  const remainingSlots = MAX_CARDS - existingCardsCount;
  if (files.length > remainingSlots) {
    errors.push(`Solo ${remainingSlots} espacios disponibles. Se procesarán los primeros ${remainingSlots} archivos.`);
    skipped = files.length - remainingSlots;
  }

  // Process files up to limit
  for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
    const { card, error } = await processImageFile(files[i], applyProcessing);
    if (error) {
      errors.push(error);
    } else if (card) {
      cards.push(card);
    }
  }

  return { cards, errors, skipped };
}

/**
 * Opens native file picker dialog
 */
export function openFilePickerDialog(): Promise<FileList | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/jpeg,image/png,image/gif,image/webp';

    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      resolve(target.files);
    };

    input.click();
  });
}
