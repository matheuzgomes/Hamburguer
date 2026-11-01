import { describe, expect, it } from 'vitest';
import { cardapio, porSlug } from '../../src/data/cardapio';
import { preco, valor } from '../../src/lib/dinheiro';
import {
  aceitarUpgrade,
  adicionar,
  contagem,
  definir,
  faltaParaMinimo,
  limparTexto,
  linhas,
  montarMensagem,
  QTD_MAX,
  remover,
  sugestaoUpgrade,
  total,
} from '../../src/lib/sacola';

describe('preço', () => {
  it('formata em reais com vírgula e milhar', () => {
    expect(preco(3990, ' ')).toBe('R$ 39,90');
    expect(preco(790, ' ')).toBe('R$ 7,90');
    expect(preco(123456, ' ')).toBe('R$ 1.234,56');
    expect(preco(500)).toBe('R$ 5,00');
    expect(valor(11790)).toBe('117,90');
  });
});

describe('sacola', () => {
  it('adiciona, soma e remove sem mexer no estado anterior', () => {
    const vazia = {};
    const um = adicionar(vazia, 'combo-nosso-smash');
    const dois = adicionar(um, 'combo-nosso-smash');
    expect(vazia).toEqual({});
    expect(um).toEqual({ 'combo-nosso-smash': 1 });
    expect(dois).toEqual({ 'combo-nosso-smash': 2 });
    expect(remover(dois, 'combo-nosso-smash')).toEqual({});
  });

  it('limita a quantidade entre 0 e o máximo', () => {
    expect(definir({}, 'familia-1', 999)).toEqual({ 'familia-1': QTD_MAX });
    expect(definir({ 'familia-1': 3 }, 'familia-1', -2)).toEqual({});
    expect(definir({}, 'familia-1', 2.7)).toEqual({ 'familia-1': 2 });
  });

  it('calcula total e contagem com os preços do cardápio', () => {
    const s = { 'combo-duplo-smash-bacon': 2, 'batata-cheddar-bacon': 1 };
    expect(total(s, porSlug)).toBe(2 * 3990 + 1890);
    expect(contagem(s, porSlug)).toBe(3);
  });

  it('ignora slugs que não estão no cardápio', () => {
    const s = { 'nao-existe': 3, 'porcao-nuggets': 1 };
    expect(linhas(s, porSlug).map((l) => l.item.slug)).toEqual(['porcao-nuggets']);
    expect(total(s, porSlug)).toBe(790);
  });

  it('diz quanto falta para o pedido mínimo', () => {
    expect(faltaParaMinimo(0, 3000)).toBe(0);
    expect(faltaParaMinimo(2590, 3000)).toBe(410);
    expect(faltaParaMinimo(3000, 3000)).toBe(0);
  });
});

describe('upgrade', () => {
  it('sugere o próximo degrau da escada do smash', () => {
    const sugestao = sugestaoUpgrade({ 'combo-smash-bacon': 1 }, porSlug);
    expect(sugestao?.para.slug).toBe('combo-duplo-smash-bacon');
    expect(sugestao?.diferenca).toBe(500);
  });

  it('não sugere o que já está na sacola nem item sem degrau', () => {
    expect(sugestaoUpgrade({ 'combo-smash-bacon': 1, 'combo-duplo-smash-bacon': 1 }, porSlug)?.de.slug).toBe(
      'combo-duplo-smash-bacon',
    );
    expect(sugestaoUpgrade({ 'familia-2': 1 }, porSlug)).toBeNull();
  });

  it('troca todas as unidades mantendo a quantidade', () => {
    expect(aceitarUpgrade({ 'combo-nosso-smash': 2, 'porcao-nuggets': 1 }, 'combo-nosso-smash', 'combo-smash-bacon')).toEqual({
      'porcao-nuggets': 1,
      'combo-smash-bacon': 2,
    });
  });

  it('toda escada aponta para um item existente e mais caro', () => {
    for (const item of cardapio) {
      if (!item.upgrade) continue;
      const para = porSlug.get(item.upgrade);
      expect(para, item.slug).toBeDefined();
      expect(para!.preco).toBeGreaterThan(item.preco);
    }
  });
});

describe('mensagem do WhatsApp', () => {
  it('lista itens, total, dados do pedido e deixa o endereço para preencher', () => {
    const msg = montarMensagem({ 'combo-duplo-smash-bacon': 2, 'porcao-aneis-de-cebola': 1 }, porSlug, {
      bairro: 'Madureira',
      pagamento: 'Pix',
      observacao: 'sem cebola\nno segundo',
      origem: '(origem: instagram · bio)',
    });
    expect(msg).toBe(
      [
        'Oi, Nossa! Quero fazer um pedido:',
        '',
        '2x Combo Duplo Smash Bacon — R$ 79,80',
        '1x Porção de Anéis de Cebola — R$ 7,90',
        '',
        'Total dos itens: R$ 87,70',
        'Entrega em: Madureira',
        'Pagamento: Pix',
        'Obs.: sem cebola no segundo',
        'Endereço: ',
        '',
        '(origem: instagram · bio)',
      ].join('\n'),
    );
  });

  it('omite o que não foi preenchido', () => {
    const msg = montarMensagem({ 'porcao-nuggets': 1 }, porSlug);
    expect(msg).not.toMatch(/Entrega em|Pagamento|Obs\./);
    expect(msg.endsWith('Endereço: ')).toBe(true);
  });

  it('limpa texto livre', () => {
    expect(limparTexto('  a\u0000b\n\n c ')).toBe('a b c');
    expect(limparTexto('x'.repeat(500)).length).toBe(200);
  });
});

describe('cardápio', () => {
  it('tem slugs únicos e só [a-z0-9-]', () => {
    const slugs = cardapio.map((i) => i.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9-]+$/);
  });

  it('todos os itens têm foto, alt e preço positivo', () => {
    for (const item of cardapio) {
      expect(item.foto, item.slug).toBeTruthy();
      expect(item.alt.length, item.slug).toBeGreaterThan(20);
      expect(item.preco, item.slug).toBeGreaterThan(0);
    }
  });
});
