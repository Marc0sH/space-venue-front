import { Service, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  text: string;
}

//Carteles "toasts" que se muestran en el centro de la pantalla y se cierran con "Aceptar".
//Si llegan varios, se muestran de a uno.
@Service()
export class ToastService {
  private nextId = 0;

  private readonly _toasts = signal<ToastMessage[]>([]);
  readonly toasts = this._toasts.asReadonly();

  success(text: string): void {
    const id = this.nextId++;
    this._toasts.update(lista => [...lista, { id, text }]);
  }

  dismiss(id: number): void {
    this._toasts.update(lista => lista.filter(t => t.id !== id));
  }
}
