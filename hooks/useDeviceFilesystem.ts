/**
 * Hook para integrar device filesystem access via MCP
 * Proporciona callbacks para folderSearch
 *
 * En producción, esto usaría las herramientas:
 * - mcp__remote-devices__device_bash para listar directorios
 * - mcp__remote-devices__device_read_file para leer archivos
 *
 * Por ahora, proporciona implementación base para testing
 */

export function useDeviceFilesystem() {
  /**
   * Lee el contenido de un directorio
   * Retorna array de nombres de archivos/carpetas
   */
  const readDirectory = async (path: string): Promise<string[]> => {
    // Placeholder - sería implementado con device bash MCP tool
    // Ejemplo: mcp__remote-devices__device_bash con comando ls
    console.warn('Device filesystem not yet fully integrated');
    throw new Error(
      'Acceso al dispositivo no disponible. Asegúrate de que Claude Desktop esté conectado.'
    );
  };

  /**
   * Lee un archivo y lo convierte a data URL
   * Para imágenes, retorna data:image/... URL
   */
  const readFileAsDataUrl = async (path: string): Promise<string> => {
    // Placeholder - sería implementado con device file read MCP tool
    // Ejemplo: mcp__remote-devices__device_read_file
    console.warn('Device file reading not yet fully integrated');
    throw new Error(
      'No se puede leer archivos del dispositivo. Asegúrate de que Claude Desktop esté conectado.'
    );
  };

  return {
    readDirectory,
    readFileAsDataUrl,
    isAvailable: false // Flag para indicar si el acceso está disponible
  };
}
