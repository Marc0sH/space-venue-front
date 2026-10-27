// Por el momento esta interfaz es inservible, 
// el tipo de estructura de las políticas de cancelación se gestionan en el back y 
// se asignan desde la BD

export interface Cancellationpolicies{
    idCancellationPolicies: number,
    type: string,
    daysAnticipation: number,
    refundPercentage: number
}

export function emptyPolicies(){
    return {idCancellationPolicies:-1, type:'', daysAnticipation:0, refundPercentage: 0}
}