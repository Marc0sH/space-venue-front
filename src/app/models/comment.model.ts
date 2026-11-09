import { Space } from "./space.model";
import { UserComplete } from "./user.model";

export interface CommentComplete {
    idComment: string,
    consumer: UserComplete,
    space: Space,
    description: string,
    score: number,
    createdAt: Date 
}

export type CommentInsertion = Pick<CommentComplete, 'description' | 'score' > & {
    idConsumer: string,
    idSpace: string
}

export type CommentForm = Omit<CommentInsertion, 'idConsumer'> 