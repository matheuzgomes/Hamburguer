/**
 * Aberto ou fechado, no fuso da loja. Horários em minutos desde 00:00; um
 * `fecha` maior que 1440 atravessa a meia-noite (ex.: 1500 = 1h da manhã).
 */

export interface Horario {
  abre: number;
  fecha: number;
  fuso: string;
}

export interface Estado {
  aberto: boolean;
  /** Frase curta para o selo ("Aberto · até 00h", "Abre hoje às 19h", "Fecha em 20 min"). */
  texto: string;
  /** Minutos até fechar (aberto) ou até abrir (fechado). */
  minutos: number;
}

const DIA = 24 * 60;

/** Minutos desde 00:00 no fuso indicado. */
export function minutosNoFuso(data: Date, fuso: string): number {
  const partes = new Intl.DateTimeFormat('en-GB', {
    timeZone: fuso,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(data);
  const h = Number(partes.find((p) => p.type === 'hour')?.value ?? 0);
  const m = Number(partes.find((p) => p.type === 'minute')?.value ?? 0);
  return (h % 24) * 60 + m;
}

/** 1140 → "19h", 1440 → "00h", 1500 → "1h", 1170 → "19h30". */
export function hora(minutos: number): string {
  const h = Math.floor(minutos / 60) % 24;
  const m = minutos % 60;
  return `${h === 0 ? '00' : h}h${m ? String(m).padStart(2, '0') : ''}`;
}

export function estadoDaLoja(agora: Date, horario: Horario): Estado {
  const m = minutosNoFuso(agora, horario.fuso);
  const { abre, fecha } = horario;
  const viraDia = fecha > DIA;
  const aberto = viraDia ? m >= abre || m < fecha - DIA : m >= abre && m < fecha;

  if (aberto) {
    const minutos = m >= abre ? fecha - m : fecha - DIA - m;
    return {
      aberto,
      minutos,
      texto: minutos <= 30 ? `Fecha em ${minutos} min` : `Aberto · até ${hora(fecha)}`,
    };
  }
  const minutos = abre - m;
  return {
    aberto,
    minutos,
    texto: minutos <= 60 ? `Abre em ${minutos} min` : `Abre hoje às ${hora(abre)}`,
  };
}
