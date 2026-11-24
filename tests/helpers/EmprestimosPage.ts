import { APIRequestContext, APIResponse } from '@playwright/test';

export class EmprestimosPage {
  readonly request: APIRequestContext;
  readonly basePath = '/api/emprestimos';

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  async listar(token?: string, params?: { status?: string }): Promise<APIResponse> {
    return this.request.get(this.basePath, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      params,
    });
  }

  async buscarPorId(id: number, token?: string): Promise<APIResponse> {
    return this.request.get(`${this.basePath}/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  async emprestar(livroId: number, token?: string): Promise<APIResponse> {
    return this.request.post(this.basePath, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      data: { livroId },
    });
  }

  async devolver(id: number, token?: string): Promise<APIResponse> {
    return this.request.patch(`${this.basePath}/${id}/devolucao`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  async excluir(id: number, token?: string): Promise<APIResponse> {
    return this.request.delete(`${this.basePath}/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }
}
