export interface ServiceSpace{
    id: number,
    description: string,
    price: number,
    isActive: boolean
}
export interface ServiceReg{
    description: string,
    price: number
}
export interface ServiceSpaceItemDTO{
    id?: number | null,
    description: string,
    price: number,
    isActive: boolean,
    idSpace: number
}
export interface ServiceSpaceUpdateDTO extends ServiceSpaceItemDTO{
    id: number
}