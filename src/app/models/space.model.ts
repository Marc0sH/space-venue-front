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
    services: ServiceSpace[]
}

export type NewSpace = Omit<
    Space,
    'idSpace' | 'consumerOwner' | 'publicationDate' | 'isActive' | 'deletedByOwner' | 'location' | 'services' | 'cancellationPolicies'
> & {
    cancellationPolicies: string
    location: Coordinates
    services: ServiceReg[]
}

// Al editar no se mandan los servicios: tienen sus propias rutas en el back
export type SpaceUpdate = Omit<NewSpace, 'services'>