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