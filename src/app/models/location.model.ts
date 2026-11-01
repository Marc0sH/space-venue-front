export interface Location{
     idLocation: number,
     longitude: number,
     latitude: number
}

export function emptyLocation(){
     return {idLocation:-1, longitude:0, latitude:0}
}

export type Coordinates = Omit<Location, 'idLocation'>

// Los espacios creados antes del mapa pueden haber quedado en 0, 0 (el valor por defecto del formulario viejo)
export function hasLocation(location: Coordinates | null | undefined): location is Coordinates {
     return !!location && (location.latitude !== 0 || location.longitude !== 0)
}
