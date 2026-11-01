import { describe, expect, it } from 'vitest';
import { estadoDaLoja, hora, minutosNoFuso } from '../../src/lib/horario';

const SP = 'America/Sao_Paulo';
// São Paulo está em UTC-3 (sem horário de verão desde 2019).
const emSP = (hh: number, mm = 0) => new Date(Date.UTC(2026, 9, 31, hh + 3, mm));
const BIO = { abre: 19 * 60, fecha: 24 * 60, fuso: SP };
const ATE_1H = { abre: 19 * 60, fecha: 25 * 60, fuso: SP };

describe('horário', () => {
  it('converte para o fuso da loja', () => {
    expect(minutosNoFuso(emSP(21, 15), SP)).toBe(21 * 60 + 15);
    expect(minutosNoFuso(emSP(0, 5), SP)).toBe(5);
  });

  it('formata horas', () => {
    expect(hora(1140)).toBe('19h');
    expect(hora(1440)).toBe('00h');
    expect(hora(1500)).toBe('1h');
    expect(hora(1170)).toBe('19h30');
  });

  it('19h às 00h: antes, durante, perto de fechar e depois', () => {
    expect(estadoDaLoja(emSP(15), BIO)).toMatchObject({ aberto: false, texto: 'Abre hoje às 19h' });
    expect(estadoDaLoja(emSP(18, 20), BIO)).toMatchObject({ aberto: false, texto: 'Abre em 40 min' });
    expect(estadoDaLoja(emSP(19), BIO)).toMatchObject({ aberto: true, texto: 'Aberto · até 00h' });
    expect(estadoDaLoja(emSP(23, 40), BIO)).toMatchObject({ aberto: true, texto: 'Fecha em 20 min' });
    expect(estadoDaLoja(emSP(23, 59), BIO)).toMatchObject({ aberto: true, minutos: 1 });
    expect(estadoDaLoja(emSP(0, 0), BIO)).toMatchObject({ aberto: false });
    expect(estadoDaLoja(emSP(0, 30), BIO)).toMatchObject({ aberto: false, texto: 'Abre hoje às 19h' });
  });

  it('19h à 1h: a madrugada ainda está aberta', () => {
    expect(estadoDaLoja(emSP(0, 10), ATE_1H)).toMatchObject({ aberto: true, texto: 'Aberto · até 1h' });
    expect(estadoDaLoja(emSP(0, 45), ATE_1H)).toMatchObject({ aberto: true, texto: 'Fecha em 15 min' });
    expect(estadoDaLoja(emSP(1, 0), ATE_1H)).toMatchObject({ aberto: false });
    expect(estadoDaLoja(emSP(23), ATE_1H)).toMatchObject({ aberto: true, minutos: 120 });
  });
});
