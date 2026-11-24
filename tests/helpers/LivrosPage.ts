import { APIRequestContext, APIResponse } from '@playwright/test';

export interface LivroPayload {
  titulo: string;
  autor: string;
  isbn: string;
  anoPublicacao: number;
  quantidade: number;
}

export class LivrosPage {
  readonly request: APIRequestContext;
  readonly basePath = '/api/livros';

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  async listar(params?: { autor?: string; disponivel?: string }): Promise<APIResponse> {
    return this.request.get(this.basePath, {
      params,
    });
  }

  async buscarPorId(id: number | string): Promise<APIResponse> {
    return this.request.get(`${this.basePath}/${id}`);
  }

  async cadastrar(livro: Partial<LivroPayload>, token?: string): Promise<APIResponse> {
    return this.request.post(this.basePath, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      data: livro,
    });
  }

  async atualizarParcial(id: number, dados: Partial<LivroPayload>, token?: string): Promise<APIResponse> {
    return this.request.patch(`${this.basePath}/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      data: dados,
    });
  }

  async excluir(id: number, token?: string): Promise<APIResponse> {
    return this.request.delete(`${this.basePath}/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }
}
