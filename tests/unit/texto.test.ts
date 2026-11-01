import { describe, expect, it } from 'vitest';
import { normalizar } from '../../src/lib/texto';

describe('normalizar', () => {
  it('tira acento e maiúscula', () => {
    expect(normalizar('  Clássico Catupiry ')).toBe('classico catupiry');
    expect(normalizar('Porção de Anéis')).toBe('porcao de aneis');
  });
});
