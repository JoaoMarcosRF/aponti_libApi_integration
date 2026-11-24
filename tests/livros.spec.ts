import { test, expect } from '@playwright/test';
import { AuthPage } from './helpers/AuthPage';
import { LivrosPage } from './helpers/LivrosPage';

test.describe('Módulo de Livros (/api/livros)', () => {
  test('Deve consultar o livro de id 1 e retornar status 200 com título "Dom Casmurro" e marcado como disponível', async ({ request }) => {
    const livrosPage = new LivrosPage(request);

    const response = await livrosPage.buscarPorId(1);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.id).toBe(1);
    expect(body.titulo).toBe('Dom Casmurro');
    expect(body.disponivel).toBe(true);
  });

  test('Deve fazer login como administrador, cadastrar um livro novo (status 201 com dados enviados e id) e excluí-lo ao final', async ({ request }) => {
    const authPage = new AuthPage(request);
    const livrosPage = new LivrosPage(request);

    // 1. Login como administrador e validação da resposta
    const loginResponse = await authPage.login({
      email: 'admin@biblioteca.com',
      senha: 'Admin@123',
    });
    expect(loginResponse.status()).toBe(200);

    const loginBody = await loginResponse.json();
    expect(loginBody.token).toBeTruthy();
    expect(loginBody.usuario.perfil).toBe('admin');

    const adminToken = loginBody.token;

    // 2. Cadastro de um livro novo com o token de administrador
    const novoLivro = {
      titulo: 'Grande Sertão: Veredas',
      autor: 'João Guimarães Rosa',
      isbn: '9788520923251',
      anoPublicacao: 1956,
      quantidade: 4,
    };

    const createResponse = await livrosPage.cadastrar(novoLivro, adminToken);
    expect(createResponse.status()).toBe(201);

    const livroCriado = await createResponse.json();
    expect(livroCriado).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        titulo: novoLivro.titulo,
        autor: novoLivro.autor,
        isbn: novoLivro.isbn,
        anoPublicacao: novoLivro.anoPublicacao,
        quantidade: novoLivro.quantidade,
        quantidadeDisponivel: novoLivro.quantidade,
        disponivel: true,
      })
    );

    // 3. Teardown: Exclui o livro criado para não deixar sujeira no banco
    const deleteResponse = await livrosPage.excluir(livroCriado.id, adminToken);
    expect(deleteResponse.status()).toBe(204);

    // Confirma que o livro não existe mais no banco (404 + mensagem de erro)
    const getAfterDeleteResponse = await livrosPage.buscarPorId(livroCriado.id);
    expect(getAfterDeleteResponse.status()).toBe(404);
    const getAfterDeleteBody = await getAfterDeleteResponse.json();
    expect(getAfterDeleteBody.erro).toBe('Livro não encontrado');
  });

  test('Deve recusar o cadastro de um livro sem envio de token com status 401', async ({ request }) => {
    const livrosPage = new LivrosPage(request);

    const response = await livrosPage.cadastrar({
      titulo: 'Capitães da Areia',
      autor: 'Jorge Amado',
      isbn: '9788535911695',
      anoPublicacao: 1937,
      quantidade: 2,
    });

    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body.status).toBe(401);
    expect(body.erro).toBe('Token não informado');
  });

  test('Extra: Deve recusar o cadastro de livro com token de leitor retornando status 403 (sem permissão)', async ({ request }) => {
    const authPage = new AuthPage(request);
    const livrosPage = new LivrosPage(request);

    const leitorToken = await authPage.loginAsLeitor();

    const response = await livrosPage.cadastrar(
      {
        titulo: 'Quincas Borba',
        autor: 'Machado de Assis',
        isbn: '9788500000097',
        anoPublicacao: 1891,
        quantidade: 2,
      },
      leitorToken
    );

    expect(response.status()).toBe(403);

    const body = await response.json();
    expect(body.status).toBe(403);
    expect(body.erro).toContain('Acesso negado');
  });

  test('Extra: Deve filtrar livros por autor ("machado") e retornar status 200 apenas com livros de Machado de Assis', async ({ request }) => {
    const livrosPage = new LivrosPage(request);

    const response = await livrosPage.listar({ autor: 'machado' });
    expect(response.status()).toBe(200);

    const livros = await response.json();
    expect(Array.isArray(livros)).toBe(true);
    expect(livros.length).toBe(2);
    for (const livro of livros) {
      expect(livro.autor).toBe('Machado de Assis');
    }
  });

  test('Extra: Deve recusar o cadastro de livro com ISBN já existente retornando status 409 e mensagem "ISBN já cadastrado"', async ({ request }) => {
    const authPage = new AuthPage(request);
    const livrosPage = new LivrosPage(request);

    const adminToken = await authPage.loginAsAdmin();

    const response = await livrosPage.cadastrar(
      {
        titulo: 'Dom Casmurro - Edição Duplicada',
        autor: 'Machado de Assis',
        isbn: '9788500000011', // ISBN já pertencente ao livro id 1 no seed
        anoPublicacao: 1899,
        quantidade: 1,
      },
      adminToken
    );

    expect(response.status()).toBe(409);

    const body = await response.json();
    expect(body.status).toBe(409);
    expect(body.erro).toBe('ISBN já cadastrado');
  });
});
