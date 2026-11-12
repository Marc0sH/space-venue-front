// Solo para pruebas con el backend local (npm run start:local).
// Levantar antes el backend con space-venue-api/deploy/local/levantar-backend.sh
export const environment = {
  apiUrl: 'http://localhost:8080/api',
  // En local no hay S3: las imágenes que ya existan en producción no se ven y la subida falla
  mediaUrl: 'https://d3l047wlzqnbc6.cloudfront.net'
};
