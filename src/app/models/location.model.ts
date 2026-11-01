export interface Location{
     idLocation: number,
     longitude: number,
     latitude: number
}

export function emptyLocation(){
     return {idLocation:-1, longitude:0, latitude:0}
}