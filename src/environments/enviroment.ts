export const environment = {
  apiUrl: 'https://d3l047wlzqnbc6.cloudfront.net/api',

  // Se reemplaza apiUrl por la del localhost del backend local para pruebas, 
  // útil para los devs
  //apiUrl: 'http://localhost:8080/api', 

  // Las imágenes se guardan en S3 y CloudFront las sirve en /media/*
  mediaUrl: 'https://d3l047wlzqnbc6.cloudfront.net'
};
