// Política de cancelación global. El cálculo lo hace el back (CancellationRefundService);
// el front solo la muestra y presenta lo que devuelve la vista previa.
export const POLITICA_CANCELACION: ReadonlyArray<{ anticipacion: string; reembolso: string }> = [
    { anticipacion: '7 días o más antes del inicio', reembolso: '100%' },
    { anticipacion: 'Entre 48 h y 7 días antes', reembolso: '50%' },
    { anticipacion: 'Menos de 48 h antes', reembolso: 'Sin reembolso' },
];

// Respuesta de GET /reservations/{id}/cancellation-preview
export interface CancellationRefund {
    paid: boolean;
    refundPercentage: number;
    refundAmount: number;
}

const formatoPesos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

export function pesos(monto: number | null | undefined): string {
    return formatoPesos.format(monto ?? 0);
}

// Texto de la confirmación de cancelación
export function textoVistaPrevia(p: CancellationRefund): string {
    if (!p.paid) return 'La reserva no está pagada, así que no hay nada que reintegrar.';
    if (p.refundPercentage === 0) return 'Según la política de cancelación, no corresponde reembolso.';
    return `Reembolso al cliente: ${p.refundPercentage}% de lo pagado (${pesos(p.refundAmount)}).`;
}
