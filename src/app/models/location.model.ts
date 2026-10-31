export interface Location{
     idLocation: number,
     longitude: number,
     latitude: number
}

export function emptyLocation(){
     return {idLocation:-1, longitude:0, latitude:0}
}

export type Coordenadas = Omit<Location, 'idLocation'>

// 0,0 se usa como "sin ubicación" porque es el valor inicial al crear un espacio
export function sinUbicacion({ latitude, longitude }: Coordenadas){
     return latitude === 0 && longitude === 0
}

// Filtro de la lista de espacios: los que están a menos de radioKm de una ubicación
export interface FiltroCercania extends Coordenadas{
     radioKm: number
}
