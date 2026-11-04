// Reglas de imágenes compartidas por la creación y la edición de espacios.
// Mismos límites que valida el back en /spaceimages/upload-url
export const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp'];
export const TAMANIO_MAX_IMAGEN = 5 * 1024 * 1024;
export const CANTIDAD_MAX_IMAGENES = 10;

// Imagen elegida en el input que todavía no se subió
export interface ImagenSeleccionada {
  file: File,
  preview: string
}

// Filtra los archivos válidos, respeta los lugares libres y arma las previews.
// Devuelve un mensaje de error si algo quedó afuera (vacío si se agregaron todas)
export function seleccionarImagenes(archivos: File[], lugares: number): { agregadas: ImagenSeleccionada[], error: string } {
  const validos = archivos.filter(f => TIPOS_IMAGEN.includes(f.type) && f.size <= TAMANIO_MAX_IMAGEN);
  const agregados = validos.slice(0, Math.max(lugares, 0));

  let error = '';
  if (validos.length < archivos.length) {
    error = 'Algunas imágenes no se agregaron: solo se permiten JPG, PNG o WEBP de hasta 5 MB';
  } else if (agregados.length < validos.length) {
    error = `Se pueden subir hasta ${CANTIDAD_MAX_IMAGENES} imágenes`;
  }

  return { agregadas: agregados.map(file => ({ file, preview: URL.createObjectURL(file) })), error };
}
