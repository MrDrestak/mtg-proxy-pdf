import { CardImage, SearchResult } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { processCardImageWithBlackCorners } from './imageProcessor';

/**
 * File types supported for card images
 */
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

/**
 * Extracts the filename without extension
 */
function getFilenameStem(fullPath: string): string {
  const filename = fullPath.split('/').pop() || '';
  return filename.replace(/\.[^/.]+$/, '');
}

/**
 * Checks if a file has a supported image extension
 */
function isSupportedImageFile(filename: string): boolean {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return SUPPORTED_EXTENSIONS.includes(ext);
}

/**
 * Performs a recursive folder search for card images matching a list of card names
 * Uses File System Access API with DirectoryHandle
 *
 * Parameters:
 * - cardNames: Array of card names to search for (one per line from textarea)
 * - dirHandle: FileSystemDirectoryHandle from showDirectoryPicker()
 * - onProgress: Optional callback to report search progress (current, total)
 *
 * Returns SearchResult with:
 * - processed: Total card names from input
 * - found: Cards with images successfully located
 * - notFound: Card names with no matching files
 * - conflicts: Card names → array of multiple file paths (user must resolve)
 */
export async function folderSearchCards(
  cardNames: string[],
  dirHandle: any,
  onProgress?: (current: number, total: number) => void
): Promise<SearchResult> {
  const result: SearchResult = {
    processed: cardNames.length,
    found: [],
    notFound: [],
    conflicts: {}
  };

  // Map: card name (lowercase) -> array of {filename, dirHandle}
  const cardFileMap = new Map<string, Array<{filename: string, dirHandle: any, path: string}>>();

  /**
   * Recursively search folder and its subfolders using DirectoryHandle
   */
  async function recursiveSearch(currentHandle: any, currentPath: string = '', maxDepth: number = 10): Promise<void> {
    if (maxDepth <= 0) return;

    try {
      for await (const entry of currentHandle.values()) {
        const fullPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;

        // If it's an image file, extract stem and track it
        if (entry.kind === 'file' && isSupportedImageFile(entry.name)) {
          const stem = getFilenameStem(entry.name).toLowerCase();
          if (!cardFileMap.has(stem)) {
            cardFileMap.set(stem, []);
          }
          cardFileMap.get(stem)!.push({
            filename: entry.name,
            dirHandle: currentHandle,
            path: fullPath
          });
        }

        // Recursively search subdirectories
        if (entry.kind === 'directory') {
          try {
            const subHandle = await currentHandle.getDirectoryHandle(entry.name);
            await recursiveSearch(subHandle, fullPath, maxDepth - 1);
          } catch (err) {
            console.error(`Error accessing subdirectory ${fullPath}:`, err);
          }
        }
      }
    } catch (err) {
      console.error(`Error reading directory:`, err);
    }
  }

  try {
    // Start recursive search from root handle
    await recursiveSearch(dirHandle);

    // Now match card names against found files
    for (let i = 0; i < cardNames.length; i++) {
      const cardName = cardNames[i];
      const searchKey = cardName.toLowerCase().trim();

      if (onProgress) {
        onProgress(i, cardNames.length);
      }

      if (!searchKey) continue;

      const foundFiles = cardFileMap.get(searchKey);

      if (!foundFiles || foundFiles.length === 0) {
        // Card not found
        result.notFound.push(cardName);
      } else if (foundFiles.length === 1) {
        // Exactly one match - process it
        try {
          const fileInfo = foundFiles[0];
          const fileHandle = await fileInfo.dirHandle.getFileHandle(fileInfo.filename);
          const file = await fileHandle.getFile();

          // Convert file to data URL
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          });

          // Process image with black corners
          const processedDataUrl = await processCardImageWithBlackCorners(dataUrl, {
            fixWhiteCorners: true,
            foilMode: false,
            deepBlackThreshold: 0,
            boostContrast: false
          });

          const card: CardImage = {
            id: uuidv4(),
            name: cardName,
            dataUrl: processedDataUrl,
            originalDataUrl: dataUrl,
            createdAt: new Date(),
            sourcePath: fileInfo.path
          };

          result.found.push(card);
        } catch (err) {
          console.error(`Error processing card ${cardName}:`, err);
          result.notFound.push(cardName);
        }
      } else {
        // Multiple matches - record as conflict
        result.conflicts[cardName] = foundFiles.map(f => f.path);
      }
    }

    // Final progress update
    if (onProgress) {
      onProgress(cardNames.length, cardNames.length);
    }
  } catch (err) {
    console.error('Folder search error:', err);
  }

  return result;
}

/**
 * Parses textarea input (one card name per line) into array
 * Strips whitespace and filters empty lines
 */
export function parseCardNamesList(text: string): string[] {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
}
