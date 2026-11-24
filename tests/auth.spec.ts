import { test, expect } from '@playwright/test';
import { AuthPage } from './helpers/AuthPage';

test.describe('Módulo de Autenticação (/api/auth)', () => {
  test('Extra: Deve autenticar o administrador com sucesso e retornar status 200 com token Bearer e dados do usuário', async ({ request }) => {
    const authPage = new AuthPage(request);

    const response = await authPage.login({
      email: 'admin@biblioteca.com',
      senha: 'Admin@123',
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.token).toEqual(expect.any(String));
    expect(body.tipo).toBe('Bearer');
    expect(body.usuario.email).toBe('admin@biblioteca.com');
    expect(body.usuario.perfil).toBe('admin');
  });

  test('Extra: Deve recusar login com senha incorreta retornando status 401 e mensagem "E-mail ou senha inválidos"', async ({ request }) => {
    const authPage = new AuthPage(request);

    const response = await authPage.login({
      email: 'admin@biblioteca.com',
      senha: 'SenhaErrada123',
    });

    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.status).toBe(401);
    expect(body.erro).toBe('E-mail ou senha inválidos');
  });
});
