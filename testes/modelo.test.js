const bd = require('../bd/bd_utils.js');
const modelo = require('../modelo.js');

beforeEach(() => {
  bd.reconfig('./bd/esmforum-teste.db');
  // limpa dados de todas as tabelas
  bd.exec('delete from perguntas', []);
  bd.exec('delete from respostas', []);
});

test('Testando banco de dados vazio', () => {
  expect(modelo.listar_perguntas().length).toBe(0);
});

test('Testando cadastro de três perguntas', () => {
  modelo.cadastrar_pergunta('1 + 1 = ?');
  modelo.cadastrar_pergunta('2 + 2 = ?');
  modelo.cadastrar_pergunta('3 + 3 = ?');
  const perguntas = modelo.listar_perguntas(); 
  expect(perguntas.length).toBe(3);
  expect(perguntas[0].texto).toBe('1 + 1 = ?');
  expect(perguntas[1].texto).toBe('2 + 2 = ?');
  expect(perguntas[2].num_respostas).toBe(0);
  expect(perguntas[1].id_pergunta).toBe(perguntas[2].id_pergunta-1);
});


//Novos testes:
test('Testando cadastro de resposta', () => {
  // Primeiro cadastra uma pergunta
  const id_pergunta = modelo.cadastrar_pergunta('Qual a capital de Minas Gerais?');
  
  // Cadastra uma resposta
  modelo.cadastrar_resposta(id_pergunta, 'Belo Horizonte', 1);
  
  // Verifica se a resposta foi cadastrada
  const respostas = modelo.get_respostas(id_pergunta);
  expect(respostas.length).toBe(1);
  expect(respostas[0].texto).toBe('Belo Horizonte');
  expect(respostas[0].id_pergunta).toBe(id_pergunta);
});

test('Testando get_pergunta', () => {
  const texto_pergunta = 'Quanto é 2 + 2?';
  const id_pergunta = modelo.cadastrar_pergunta(texto_pergunta);
  
  const pergunta = modelo.get_pergunta(id_pergunta);
  expect(pergunta.texto).toBe(texto_pergunta);
  expect(pergunta.id_pergunta).toBe(id_pergunta);
});

test('Testando get_pergunta com ID inválido', () => {
  expect(() => modelo.get_pergunta(-1)).toThrow('ID de pergunta inválido');
});

test('Testando cadastrar_resposta com ID inválido', () => {
  expect(() => modelo.cadastrar_resposta(-1, 'Resposta', 1))
    .toThrow('ID de pergunta inválido');
});

test('Testando get_respostas com ID inválido', () => {
  expect(() => modelo.get_respostas(-1)).toThrow('ID de pergunta inválido');
});


test('Testando cadastro e listagem de respostas', () => {
  const id = modelo.cadastrar_pergunta('Qual a capital da França?');
  modelo.cadastrar_resposta(id, 'Paris', 1);
  modelo.cadastrar_resposta(id, 'Lyon', 2);

  const respostas = modelo.get_respostas(id);
  expect(respostas.length).toBe(2);
  expect(respostas[0].texto).toBe('Paris');
  expect(respostas[1].texto).toBe('Lyon');
  expect(respostas[0].id_usuario).toBe(1);
  expect(respostas[1].id_usuario).toBe(2);
});

test('Verificando número de respostas é atualizado corretamente', () => {
  const id = modelo.cadastrar_pergunta('Qual a cor do céu?');
  modelo.cadastrar_resposta(id, 'Azul');

  const perguntas = modelo.listar_perguntas();
  expect(perguntas[0].num_respostas).toBe(1);
});


// Testes para cobrir casos específicos que faltam
test('Testando get_respostas para pergunta sem respostas', () => {
  const id_pergunta = modelo.cadastrar_pergunta('Pergunta sem respostas');
  const respostas = modelo.get_respostas(id_pergunta);
  expect(respostas).toEqual([]);
});

test('Testando cadastrar_resposta com usuário inválido', () => {
  const id_pergunta = modelo.cadastrar_pergunta('Pergunta teste');
  expect(() => modelo.cadastrar_resposta(id_pergunta, 'Resposta', -1))
    .toThrow('ID de usuário inválido');
});

test('Testando cadastro múltiplo de respostas', () => {
  const id_pergunta = modelo.cadastrar_pergunta('Pergunta com múltiplas respostas');
  modelo.cadastrar_resposta(id_pergunta, 'Resposta 1', 1);
  modelo.cadastrar_resposta(id_pergunta, 'Resposta 2', 2);
  
  const respostas = modelo.get_respostas(id_pergunta);
  expect(respostas.length).toBe(2);
  expect(respostas[0].id_usuario).toBe(1);
  expect(respostas[1].id_usuario).toBe(2);
});

test('Testando num_respostas após devolução', () => {
  const id_pergunta = modelo.cadastrar_pergunta('Pergunta com resposta removida');
  modelo.cadastrar_resposta(id_pergunta, 'Resposta', 1);
  modelo.receberLivroEmprestado(id_pergunta); // Simula devolução
  
  const perguntas = modelo.listar_perguntas();
  expect(perguntas[0].num_respostas).toBe(0);
});

// Teste para verificar o retorno de lastInsertRowid em cadastrar_pergunta
test('Testando retorno de ID ao cadastrar pergunta', () => {
  const id = modelo.cadastrar_pergunta('Pergunta com retorno de ID');
  expect(typeof id).toBe('number');
  expect(id).toBeGreaterThan(0);
});

// Teste para verificar o retorno de lastInsertRowid em cadastrar_resposta
test('Testando retorno de ID ao cadastrar resposta', () => {
  const id_pergunta = modelo.cadastrar_pergunta('Pergunta para resposta');
  const id_resposta = modelo.cadastrar_resposta(id_pergunta, 'Resposta teste');
  expect(typeof id_resposta).toBe('number');
  expect(id_resposta).toBeGreaterThan(0);
});

// Teste para get_num_respostas diretamente
test('Testando get_num_respostas diretamente', () => {
  const id_pergunta = modelo.cadastrar_pergunta('Pergunta para contar respostas');
  expect(modelo.get_num_respostas(id_pergunta)).toBe(0);
  
  modelo.cadastrar_resposta(id_pergunta, 'Resposta 1');
  expect(modelo.get_num_respostas(id_pergunta)).toBe(1);
});

// Teste para reconfig_bd (mock de banco de dados)
test('Testando reconfig_bd com mock', () => {
  const mock_bd = {
    queryAll: jest.fn().mockReturnValue([{id_pergunta: 1, texto: 'Mock'}]),
    query: jest.fn().mockReturnValue({'count(*)': 2}),
    exec: jest.fn()
  };
  
  modelo.reconfig_bd(mock_bd);
  const perguntas = modelo.listar_perguntas();
  expect(perguntas.length).toBe(1);
  expect(perguntas[0].num_respostas).toBe(2);
});

