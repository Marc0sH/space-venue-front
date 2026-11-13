import { HttpClient, httpResource } from '@angular/common/http';
import { inject, Service, Signal } from '@angular/core';
import { environment } from '../../../environments/enviroment';
import { CommentComplete, CommentForm } from '../../models/comment.model';

@Service()
export class Comment {
    private readonly http = inject(HttpClient)
    private readonly baseUrl = `${environment.apiUrl}/comments`

    createComment(comment : CommentForm){
        return this.http.post(this.baseUrl, comment)
    }

    getCommentsOfSpace(idSpace: Signal<string>){
        return httpResource<CommentComplete[]>(() => `${this.baseUrl}/byspaceid/${idSpace()}`)
    }

    getCommentsOfUser(idUser: Signal<string>){
        return httpResource<CommentComplete[]>(() => `${this.baseUrl}/byconsumerid/${idUser()}`)
    }

    hasCommentOnSpace(idSpace: Signal<string>){
        return httpResource<boolean>(() => `${this.baseUrl}/spaces/${idSpace()}/has-comment`)
    }

    canCommentOnSpace(idSpace: Signal<string>){
        return httpResource<boolean>(() => `${this.baseUrl}/spaces/${idSpace()}/can-comment`)
    }

    deleteComment(idComment: string){
        return this.http.delete(`${this.baseUrl}/deactivate/${idComment}`)
    }

    modifyComment(idComment: number, comment: CommentForm){
        return this.http.put(`${this.baseUrl}/${idComment}`, comment)
    }
}
