import type { Chapter, Node } from '../runner';

// Atalhos de escrita
const say = (who: string, name: string, expr: string, text: string): Node => ({ t: 'say', who, name, expr, text });
const label = (name: string): Node => ({ t: 'label', name });

const Y = (expr: string, text: string) => say('yugi_muto', 'Yugi', expr, text);
const J = (expr: string, text: string) => say('joey_wheeler', 'Joey', expr, text);
const K = (expr: string, text: string) => say('seto_kaiba', 'Kaiba', expr, text);

export const ch1: Chapter = {
  id: 'ch1',
  title: 'Capítulo 1 — O desafio',
  nodes: [
    { t: 'show', who: 'yugi_muto', side: 'left' },
    { t: 'show', who: 'joey_wheeler', side: 'right' },
    J('laugh', 'Yug! Hoje eu não perco pra ninguém. Duela comigo!'),
    Y('neutral', 'Joey, você fala isso toda semana…'),
    J('angry', 'Dessa vez é diferente! Montei um deck novo!'),
    { t: 'choice', options: [
      { text: 'Aceitar o duelo', goto: 'accept' },
      { text: 'Deixar para depois', goto: 'refuse', set: 'refused_joey' },
    ] },

    label('refuse'),
    J('sad', 'Poxa… Tá bom, mas um dia você não escapa.'),
    { t: 'goto', to: 'kaiba' },

    label('accept'),
    Y('laugh', 'Tá bom, vamos lá!'),
    J('laugh', 'Prepare-se, Yugi!'),
    { t: 'duel', opponent: 'joey_wheeler', win: 'joey_win', lose: 'joey_lose' },

    label('joey_win'),
    J('surprised', 'Eu perdi?! De novo?!'),
    Y('embarrassed', 'Foi um duelo difícil, Joey. De verdade.'),
    { t: 'goto', to: 'kaiba' },

    label('joey_lose'),
    J('laugh', 'HAHA! Eu venci o Yugi! Ninguém vai acreditar!'),
    Y('embarrassed', 'Você jogou muito bem…'),
    { t: 'goto', to: 'kaiba' },

    label('kaiba'),
    { t: 'hide', who: 'joey_wheeler' },
    { t: 'show', who: 'seto_kaiba', side: 'right' },
    K('neutral', 'Que espetáculo patético.'),
    Y('surprised', 'Kaiba!'),
    K('angry', 'Yugi. Seu nome está na minha lista. Quero o seu deck, e quero agora.'),
    { t: 'choice', options: [
      { text: 'Aceitar o desafio', goto: 'kaiba_duel' },
      { text: 'Provocar o Kaiba', goto: 'kaiba_taunt', set: 'taunted_kaiba' },
    ] },

    label('kaiba_taunt'),
    Y('laugh', 'Calma, Kaiba. Você vai ter a sua vez.'),
    K('angry', 'Chega de conversa.'),

    label('kaiba_duel'),
    { t: 'duel', opponent: 'seto_kaiba', win: 'kaiba_win', lose: 'kaiba_lose' },

    label('kaiba_win'),
    K('surprised', 'Impossível… Eu perdi para você?'),
    Y('neutral', 'Foi uma ótima partida, Kaiba.'),
    { t: 'goto', to: 'fim' },

    label('kaiba_lose'),
    K('laugh', 'Fraco. Volte quando tiver um deck de verdade.'),
    Y('sad', 'Da próxima vez eu vou ganhar.'),

    label('fim'),
    { t: 'end', text: 'Fim da demonstração do capítulo 1' },
  ],
};
