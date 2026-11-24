export interface CommentComplete {
    idComment: number;
    idConsumer: number;
    username?: string | null;
    idSpace: number;
    description: string;
    score: number;
    isActive: boolean;
    deactivationReason: string | null;
    created_at: string;
}

export type CommentInsertion = Pick<CommentComplete, 'description' | 'score' > & {
    idConsumer: string,
    idSpace: string
}

export type CommentForm = Omit<CommentInsertion, 'idConsumer'> 

// Estado del comentario del usuario logueado en un espacio (GET /comments/spaces/{id}/comment-status)
export type CommentStatus = 'NONE' | 'ACTIVE' | 'MODERATED'
