/**
 * Converts a File object to a data URL string
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to read file as data URL'));
      }
    };
    reader.onerror = () => reject(new Error('FileReader error'));
    reader.readAsDataURL(file);
  });
}

/**
 * Processes card images to ensure that rounded transparent or white corners
 * are seamlessly filled with black for MTG proxy cutting.
 */
export interface ImageProcessOptions {
  fixWhiteCorners?: boolean;
  foilMode?: boolean;
  deepBlackThreshold?: number; // 0 to 100 (default ~35-45)
  boostContrast?: boolean;
}

/**
 * Processes card images to ensure that rounded transparent or white corners
 * are seamlessly filled with black for MTG proxy cutting, with optional
 * Foil/Holographic mode and Deep Black enhancement.
 */
export async function processCardImageWithBlackCorners(
  dataUrl: string,
  options: boolean | ImageProcessOptions = true
): Promise<string> {
  const opts: ImageProcessOptions = typeof options === 'boolean' 
    ? { fixWhiteCorners: options, foilMode: false, deepBlackThreshold: 0, boostContrast: false }
    : {
        fixWhiteCorners: options.fixWhiteCorners ?? true,
        foilMode: options.foilMode ?? false,
        deepBlackThreshold: options.deepBlackThreshold ?? 0,
        boostContrast: options.boostContrast ?? false
      };

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      // If NOT in foil mode, fill canvas with solid black so transparent parts get black
      // In foil mode, leave canvas transparent so alpha channels remain preserved
      if (!opts.foilMode) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      // Draw image
      ctx.drawImage(img, 0, 0);

      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const w = canvas.width;
        const h = canvas.height;
        const totalPixels = w * h;

        // 1. Deep Black & Contrast enhancement (ideal for Foil printing so black blocks the foil)
        const deepBlackThreshold = opts.deepBlackThreshold ?? 0;
        const boostContrast = opts.boostContrast ?? false;

        if (deepBlackThreshold > 0 || boostContrast) {
          const contrastFactor = boostContrast ? 1.15 : 1.0;
          for (let i = 0; i < totalPixels; i++) {
            const idx = i * 4;
            const a = data[idx + 3];
            
            // Skip fully transparent pixels in foil mode so transparency stays 100% clean
            if (opts.foilMode && a === 0) continue;

            let r = data[idx];
            let g = data[idx + 1];
            let b = data[idx + 2];

            // Deep Black: Crush near-black/dark grey pixels to pure rich black #000000
            // This ensures maximum ink density on foil, blocking light reflections on borders & text
            const maxVal = Math.max(r, g, b);
            if (maxVal <= deepBlackThreshold) {
              data[idx] = 0;
              data[idx + 1] = 0;
              data[idx + 2] = 0;
            } else if (boostContrast) {
              // Apply subtle S-curve contrast boost
              r = Math.min(255, Math.max(0, Math.round(((r / 255 - 0.5) * contrastFactor + 0.5) * 255)));
              g = Math.min(255, Math.max(0, Math.round(((g / 255 - 0.5) * contrastFactor + 0.5) * 255)));
              b = Math.min(255, Math.max(0, Math.round(((b / 255 - 0.5) * contrastFactor + 0.5) * 255)));

              data[idx] = r;
              data[idx + 1] = g;
              data[idx + 2] = b;
            }
          }
        }

        // 2. Corner checking (fill white corners with black if requested)
        if (opts.fixWhiteCorners) {
          const cornerW = Math.max(10, Math.min(Math.ceil(w * 0.08), 100));
          const cornerH = Math.max(10, Math.min(Math.ceil(h * 0.06), 100));

          const isLightCorner = (idx: number) => {
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];
            // Only consider opaque white/light pixels as white rounded corners
            // (If foilMode, transparent pixels in corners should remain transparent unless user wanted white corners fixed)
            if (opts.foilMode) {
              return a > 150 && r > 200 && g > 200 && b > 200;
            }
            return a < 150 || (r > 200 && g > 200 && b > 200);
          };

          const fillCorner = (
            startX: number,
            startY: number,
            minX: number,
            maxX: number,
            minY: number,
            maxY: number
          ) => {
            const startIndex = (startY * w + startX) * 4;
            if (!isLightCorner(startIndex)) {
              return;
            }

            const visited = new Uint8Array(w * h);
            const queue: [number, number][] = [[startX, startY]];
            visited[startY * w + startX] = 1;

            while (queue.length > 0) {
              const [cx, cy] = queue.pop()!;
              const idx = (cy * w + cx) * 4;

              // Paint pixel black
              data[idx] = 0;
              data[idx + 1] = 0;
              data[idx + 2] = 0;
              data[idx + 3] = 255;

              const neighbors: [number, number][] = [
                [cx + 1, cy],
                [cx - 1, cy],
                [cx, cy + 1],
                [cx, cy - 1]
              ];

              for (const [nx, ny] of neighbors) {
                if (nx >= minX && nx <= maxX && ny >= minY && ny <= maxY) {
                  const nPos = ny * w + nx;
                  if (!visited[nPos]) {
                    visited[nPos] = 1;
                    const nIdx = nPos * 4;
                    if (isLightCorner(nIdx)) {
                      queue.push([nx, ny]);
                    }
                  }
                }
              }
            }
          };

          fillCorner(0, 0, 0, cornerW, 0, cornerH);
          fillCorner(w - 1, 0, w - 1 - cornerW, w - 1, 0, cornerH);
          fillCorner(0, h - 1, 0, cornerW, h - 1 - cornerH, h - 1);
          fillCorner(w - 1, h - 1, w - 1 - cornerW, w - 1, h - 1 - cornerH, h - 1);
        }

        ctx.putImageData(imageData, 0, 0);

        // If in foilMode or PNG format, output as image/png to preserve alpha transparency!
        const mimeType = opts.foilMode ? 'image/png' : 'image/jpeg';
        resolve(canvas.toDataURL(mimeType, 0.95));
      } catch (err) {
        console.error('Error processing image:', err);
        resolve(dataUrl);
      }
    };
    img.onerror = () => {
      resolve(dataUrl);
    };
    img.src = dataUrl;
  });
}
