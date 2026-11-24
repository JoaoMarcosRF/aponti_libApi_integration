import { test, expect } from '@playwright/test';
import { AuthPage } from './helpers/AuthPage';
import { EmprestimosPage } from './helpers/EmprestimosPage';
import { LivrosPage } from './helpers/LivrosPage';

test.describe('Módulo de Empréstimos (/api/emprestimos)', () => {
  test('Deve recusar o empréstimo do livro "Vidas Secas" (id 4, sem exemplares) com status 409 e mensagem "Livro indisponível"', async ({ request }) => {
    const authPage = new AuthPage(request);
    const emprestimosPage = new EmprestimosPage(request);

    const leitorToken = await authPage.loginAsLeitor();

    const response = await emprestimosPage.emprestar(4, leitorToken);
    expect(response.status()).toBe(409);

    const body = await response.json();
    expect(body.status).toBe(409);
    expect(body.erro).toBe('Livro indisponível');
  });

  test('Extra: Deve realizar um empréstimo com sucesso (status 201), reduzir estoque disponível, devolver o livro (status 200) e limpar o registro', async ({ request }) => {
    const authPage = new AuthPage(request);
    const emprestimosPage = new EmprestimosPage(request);
    const livrosPage = new LivrosPage(request);

    const leitorToken = await authPage.loginAsLeitor();
    const adminToken = await authPage.loginAsAdmin();

    // 1. Empresta o livro id 1 ("Dom Casmurro", 3 exemplares disponíveis inicialmente)
    const emprestimoResponse = await emprestimosPage.emprestar(1, leitorToken);
    expect(emprestimoResponse.status()).toBe(201);

    const emprestimo = await emprestimoResponse.json();
    expect(emprestimo.id).toEqual(expect.any(Number));
    expect(emprestimo.livroId).toBe(1);
    expect(emprestimo.status).toBe('ativo');
    expect(emprestimo.dataDevolucao).toBeNull();

    // 2. Verifica que a quantidadeDisponivel do livro 1 reduziu de 3 para 2
    const livroDuranteResponse = await livrosPage.buscarPorId(1);
    expect(livroDuranteResponse.status()).toBe(200);
    const livroDurante = await livroDuranteResponse.json();
    expect(livroDurante.quantidadeDisponivel).toBe(2);

    // 3. Devolve o empréstimo e valida status 200 e status "devolvido"
    const devolucaoResponse = await emprestimosPage.devolver(emprestimo.id, leitorToken);
    expect(devolucaoResponse.status()).toBe(200);

    const devolucaoBody = await devolucaoResponse.json();
    expect(devolucaoBody.status).toBe('devolvido');
    expect(devolucaoBody.dataDevolucao).toBeTruthy();

    // 4. Teardown: Exclui o registro de empréstimo como admin
    const deleteResponse = await emprestimosPage.excluir(emprestimo.id, adminToken);
    expect(deleteResponse.status()).toBe(204);
  });
});
