import { Cancellationpolicies } from "./cancellationpolicies.model"
import { Coordinates, Location } from "./location.model"
import { ServiceReg, ServiceSpace } from "./service.model"
import { consumerOwner } from "./user.model"

export interface Space{
    idSpace: number,
    consumerOwner: consumerOwner,
    location: Location,

    // El back devuelve la política completa; al crear o editar se manda solo el tipo (FLEXIBLE, MODERATED o STRICT)
    cancellationPolicies: Cancellationpolicies | null,

    nameSpace: string,
    description: string,
    basePrice: number,
    publicationDate: Date,
    bufferTime: number,
    isActive: boolean,
    //true si el dueño lo eliminó (soft delete); el admin lo sigue viendo pero no puede reactivarlo
    deletedByOwner: boolean,
    //Por qué está inactivo (ESpaceDeactivationReason en el back). null si está activo
    deactivationReason: SpaceDeactivationReason | null,
    services: ServiceSpace[]
}

export type SpaceDeactivationReason = 'OWNER_DELETED' | 'ADMIN' | 'PENDING_APPROVAL';

//Texto del estado de un espacio para mostrar en la tabla del admin y en las tarjetas
export function etiquetaEstadoEspacio(s: Pick<Space, 'isActive' | 'deactivationReason'>): string {
    if (s.isActive) return 'Activo';
    switch (s.deactivationReason) {
        case 'OWNER_DELETED': return 'Eliminado por el dueño';
        case 'ADMIN': return 'Desactivado por el admin';
        case 'PENDING_APPROVAL': return 'Pendiente de aprobación';
        default: return 'Inactivo'; //Espacios desactivados antes de que existiera el motivo
    }
}

export type NewSpace = Omit<
    Space,
    'idSpace' | 'consumerOwner' | 'publicationDate' | 'isActive' | 'deletedByOwner' | 'deactivationReason' | 'location' | 'services' | 'cancellationPolicies'
> & {
    cancellationPolicies: string
    location: Coordinates
    services: ServiceReg[]
}

// Al editar no se mandan los servicios: tienen sus propias rutas en el back
export type SpaceUpdate = Omit<NewSpace, 'services'>