// import { Cancellationpolicies } from "./cancellationpolicies.model"
import { Location } from "./location.model"
import { ServiceReg, ServiceSpace } from "./service.model"
import { consumerOwner } from "./user.model"

export interface Space{
    idSpace: number,
    consumerOwner: consumerOwner,
    location: Location,

    // En el back, el atributo cancellationPolicies es un string y se compara como enum. 
    // Desde el front debemos asignar el valor enum y desde el back se compara la política entera (harcodeada desde la BD)
    cancellationPolicies: string,

    nameSpace: string,
    description: string,
    basePrice: number,
    publicationDate: Date,
    bufferTime: number,
    isActive: boolean,
    services: ServiceSpace[]
}

export type NewSpace = Omit<
    Space,
    'idSpace' | 'consumerOwner' | 'publicationDate' | 'isActive' | 'location' | 'services'
> & {
    location: Omit<Location, 'idLocation'>
    services: ServiceReg[]
}