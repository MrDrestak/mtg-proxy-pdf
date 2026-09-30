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
 * Uses MCP device filesystem tools via callback to access user's computer
 *
 * Parameters:
 * - cardNames: Array of card names to search for (one per line from textarea)
 * - folderPath: Absolute path to start search (e.g., /Users/walter/MTG/Cards)
 * - readDirFn: Callback to read directory contents from device
 * - readFileFn: Callback to read file as data URL from device
 *
 * Returns SearchResult with:
 * - processed: Total card names from input
 * - found: Cards with images successfully located (sourcePath = file path)
 * - notFound: Card names with no matching files
 * - conflicts: Card names → array of multiple file paths (user must resolve)
 */
export async function folderSearchCards(
  cardNames: string[],
  folderPath: string,
  readDirFn: (path: string) => Promise<string[]>,
  readFileFn: (path: string) => Promise<string>
): Promise<SearchResult> {
  const result: SearchResult = {
    processed: cardNames.length,
    found: [],
    notFound: [],
    conflicts: {}
  };

  // Map: card name (lowercase) -> array of file paths
  const cardFileMap = new Map<string, string[]>();

  /**
   * Recursively search folder and its subfolders for image files
   */
  async function recursiveSearch(currentPath: string, maxDepth: number = 10): Promise<void> {
    if (maxDepth <= 0) return; // Prevent infinite recursion

    try {
      const entries = await readDirFn(currentPath);

      for (const entry of entries) {
        const fullPath = `${currentPath}/${entry}`.replace(/\/+/g, '/');
        const filename = entry;

        // If it's an image file, extract stem and track it
        if (isSupportedImageFile(filename)) {
          const stem = getFilenameStem(filename).toLowerCase();
          if (!cardFileMap.has(stem)) {
            cardFileMap.set(stem, []);
          }
          cardFileMap.get(stem)!.push(fullPath);
        }

        // Recursively search subdirectories
        // Note: In real device filesystem, we'd check if it's a directory first
        // For now, attempt recursion and catch errors for non-directories
        try {
          await recursiveSearch(fullPath, maxDepth - 1);
        } catch {
          // Not a directory, skip
        }
      }
    } catch (err) {
      console.error(`Error reading directory ${currentPath}:`, err);
    }
  }

  try {
    // Start recursive search from folder path
    await recursiveSearch(folderPath);

    // Now match card names against found files
    for (const cardName of cardNames) {
      const searchKey = cardName.toLowerCase().trim();
      if (!searchKey) continue;

      const foundPaths = cardFileMap.get(searchKey);

      if (!foundPaths || foundPaths.length === 0) {
        // Card not found
        result.notFound.push(cardName);
      } else if (foundPaths.length === 1) {
        // Exactly one match - process it
        try {
          const dataUrl = await readFileFn(foundPaths[0]);

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
            sourcePath: foundPaths[0]
          };

          result.found.push(card);
        } catch (err) {
          console.error(`Error processing ${foundPaths[0]}:`, err);
          result.notFound.push(cardName);
        }
      } else {
        // Multiple matches - record as conflict
        result.conflicts[cardName] = foundPaths;
      }
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
