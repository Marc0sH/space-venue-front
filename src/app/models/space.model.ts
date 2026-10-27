import { cancellationpolicies } from "./cancellationpolicies.model"
import { location } from "./location.model"
import { service } from "./service.model"
import { consumerOwner } from "./user.model"

export interface space{
    idSpace: number,
    consumerOwner: consumerOwner,
    location: location,

    // En el back, el atributo cancellationPolicies es un string y se compara como enum. 
    // Desde el front debemos asignar el valor enum y desde el back se compara la política entera (harcodeada desde la BD)
    cancellationPolicies: string,
    
    nameSpace: string,
    description: string,
    basePrice: number,
    publicationDate: Date,
    bufferTime: number,
    isActive: boolean,
    services: service[]
}

export type newSpace = Omit<space, 'idSpace' | 'consumerOwner' | 'publicationDate' | 'isActive'>