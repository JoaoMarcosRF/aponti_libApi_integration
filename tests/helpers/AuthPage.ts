import { APIRequestContext, APIResponse } from '@playwright/test';

export interface LoginPayload {
  email: string;
  senha: string;
}

export interface RegisterPayload {
  nome: string;
  email: string;
  senha: string;
}

export class AuthPage {
  readonly request: APIRequestContext;
  readonly basePath = '/api/auth';

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  async login(credentials: LoginPayload): Promise<APIResponse> {
    return this.request.post(`${this.basePath}/login`, {
      data: credentials,
    });
  }

  async loginAsAdmin(): Promise<string> {
    const response = await this.login({
      email: 'admin@biblioteca.com',
      senha: 'Admin@123',
    });
    const body = await response.json();
    return body.token;
  }

  async loginAsLeitor(): Promise<string> {
    const response = await this.login({
      email: 'leitor@biblioteca.com',
      senha: 'Leitor@123',
    });
    const body = await response.json();
    return body.token;
  }

  async register(dados: RegisterPayload): Promise<APIResponse> {
    return this.request.post(`${this.basePath}/register`, {
      data: dados,
    });
  }

  async me(token?: string): Promise<APIResponse> {
    return this.request.get(`${this.basePath}/me`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }
}
