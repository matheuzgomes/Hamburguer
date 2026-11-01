import { describe, expect, it } from 'vitest';
import { cardapio } from '../../src/data/cardapio';
import { codificar, decodificar, urlPedidoIgual } from '../../src/lib/pedido-igual';
import { lerUtm, textoOrigem, urlWhatsApp } from '../../src/lib/whatsapp';

const validos = new Set(cardapio.map((i) => i.slug));

describe('pede igual', () => {
  it('ida e volta', () => {
    const sacola = { 'combo-duplo-smash-bacon': 2, 'porcao-nuggets': 1 };
    expect(codificar(sacola)).toBe('combo-duplo-smash-bacon:2,porcao-nuggets');
    expect(decodificar(codificar(sacola), validos)).toEqual(sacola);
  });

  it('descarta slug inventado, quantidade absurda e lixo', () => {
    expect(
      decodificar('combo-nosso-smash:3,hacker:2,familia-1:0,familia-2:99,porcao-nuggets:1.5,<script>,batata-cheddar-bacon:abc', validos),
    ).toEqual({ 'combo-nosso-smash': 3 });
    expect(decodificar('', validos)).toEqual({});
    expect(decodificar(null, validos)).toEqual({});
  });

  it('soma repetidos sem passar do limite', () => {
    expect(decodificar('familia-1:15,familia-1:15', validos)).toEqual({ 'familia-1': 20 });
  });

  it('monta a URL limpa', () => {
    expect(urlPedidoIgual('https://nossa.example/teste/3-comanda/?utm_source=x#cardapio', { 'familia-1': 1 })).toBe(
      'https://nossa.example/teste/3-comanda/?pedido=familia-1',
    );
    expect(urlPedidoIgual('https://nossa.example/', {})).toBe('https://nossa.example/');
  });
});

describe('whatsapp', () => {
  it('codifica a mensagem', () => {
    expect(urlWhatsApp('5521966050013', 'Oi, Nossa!\n1x Combo')).toBe('https://wa.me/5521966050013?text=Oi%2C%20Nossa!%0A1x%20Combo');
    expect(urlWhatsApp('5521966050013')).toBe('https://wa.me/5521966050013');
  });

  it('lê e resume a UTM', () => {
    const utm = lerUtm('?utm_source=instagram&utm_medium=bio&utm_campaign=&x=1');
    expect(utm).toEqual({ source: 'instagram', medium: 'bio' });
    expect(textoOrigem(utm)).toBe('(origem: instagram · bio)');
    expect(textoOrigem({})).toBe('');
  });
});
