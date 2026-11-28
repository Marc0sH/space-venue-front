import { inject } from "@angular/core"
import { Coordinates, Location } from "./location.model"
import { ServiceReg, ServiceSpace } from "./service.model"
import { consumerOwner } from "./user.model"
import { Comment } from "../spaces/comments/comment"

export interface Space{
    idSpace: number,
    consumerOwner: consumerOwner,
    location: Location,
    floor?: number | null,

    nameSpace: string,
    description: string,
    basePrice: number,
    publicationDate: Date,
    bufferTime: number,
    isActive: boolean,
    rating: number,
    commentCount: number,
    //true si el dueño lo eliminó (soft delete); el admin lo sigue viendo pero no puede reactivarlo
    deletedByOwner: boolean,
    //Por qué está inactivo (ESpaceDeactivationReason en el back). null si está activo
    deactivationReason: SpaceDeactivationReason | null,
    //false si el dueño está dado de baja o ya no es oferente: el espacio queda oculto y no se puede reservar aunque isActive sea true
    ownerAvailable: boolean,
    services: ServiceSpace[]
}

//Filtro por nombre, rango de precio y calificación mínima de la lista de espacios; los campos vacíos no filtran
export interface SpaceSearch {
    nombre: string,
    precioMin: number | null,
    precioMax: number | null,
    calificacionMin: number | null
}

export type SpaceDeactivationReason = 'OWNER_DELETED' | 'OWNER_PAUSED' | 'ADMIN' | 'PENDING_APPROVAL';

//Texto del estado de un espacio para mostrar en la tabla del admin y en las tarjetas
export function etiquetaEstadoEspacio(s: Pick<Space, 'isActive' | 'deactivationReason' | 'ownerAvailable'>): string {
    if (s.isActive) return s.ownerAvailable === false ? 'Oculto: dueño no disponible' : 'Activo';
    switch (s.deactivationReason) {
        case 'OWNER_DELETED': return 'Eliminado por el dueño';
        case 'OWNER_PAUSED': return 'Pausado'
        case 'ADMIN': return 'Desactivado por el admin';
        case 'PENDING_APPROVAL': return 'Pendiente de aprobación';
        default: return 'Inactivo'; //Espacios desactivados antes de que existiera el motivo
    }
}

export type NewSpace = Omit<
    Space,
    'idSpace' | 'consumerOwner' | 'publicationDate' | 'isActive' | 'deletedByOwner' | 'deactivationReason' | 'ownerAvailable' | 'location' | 'services' | 'rating' | 'commentCount'
> & {
    location: Coordinates
    services: ServiceReg[]
}

// Al editar no se mandan los servicios: tienen sus propias rutas en el back
export type SpaceUpdate = Omit<NewSpace, 'services'>