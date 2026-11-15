import type { Chapter, Node } from './runner';
import type { Scene } from './world';

// {nome} vira o nome do jogador na hora de mostrar.
const label = (name: string): Node => ({ t: 'label', name });
const line = (who: string, name: string) => (expr: string, text: string): Node => ({ t: 'say', who, name, expr, text });
const P = (text: string): Node => ({ t: 'say', name: '{nome}', text });

/** Cena de revanche: cumprimento, escolha, duelo, reação e +1 coração se vencer. */
function rematch(id: string, who: string, name: string, l: { hello: [string, string]; win: [string, string]; lose: [string, string]; leave: [string, string] }): Chapter {
  const S = line(who, name);
  return { id, title: `${name} — revanche`, nodes: [
    { t: 'show', who, side: 'center' },
    S(l.hello[0], l.hello[1]),
    { t: 'choice', options: [{ text: 'Duelar', goto: 'duelo' }, { text: 'Agora não', goto: 'sair' }] },
    label('sair'), S(l.leave[0], l.leave[1]), { t: 'goto', to: 'fim' },
    label('duelo'),
    { t: 'duel', opponent: who, win: 'venceu', lose: 'perdeu' },
    label('venceu'), S(l.win[0], l.win[1]), { t: 'heart', who, delta: 1 }, { t: 'goto', to: 'fim' },
    label('perdeu'), S(l.lose[0], l.lose[1]),
    label('fim'), { t: 'end' },
  ] };
}

export function joeyScenes(location: string): Scene[] {
  const J = line('joey_wheeler', 'Joey');
  const who = 'joey_wheeler';
  return [
    { id: 'joey_intro', char: who, location, once: true, chapter: { id: 'joey_intro', title: 'Joey — o desafio', nodes: [
      { t: 'show', who, side: 'center' },
      J('laugh', 'Ei, {nome}! Chegou na hora certa!'),
      J('angry', 'Montei um deck novo e preciso testar em alguém. Duela comigo!'),
      P('Você diz isso toda semana, Joey…'),
      J('embarrassed', 'Dessa vez é diferente, juro!'),
      { t: 'choice', options: [{ text: 'Aceitar o duelo', goto: 'aceita' }, { text: 'Deixar para depois', goto: 'depois' }] },
      label('depois'), J('sad', 'Poxa… Tá bom, mas um dia você não escapa.'), { t: 'goto', to: 'fim' },
      label('aceita'), P('Tá bom, vamos lá!'), J('laugh', 'Prepare-se!'),
      { t: 'duel', opponent: who, win: 'venceu', lose: 'perdeu' },
      label('venceu'), J('surprised', 'Eu perdi?! De novo?!'), J('embarrassed', 'Foi um duelo e tanto. Revanche depois!'), { t: 'heart', who, delta: 1 }, { t: 'goto', to: 'fim' },
      label('perdeu'), J('laugh', 'HAHA! Venci! Ninguém vai acreditar!'),
      label('fim'), { t: 'end' },
    ] } },
    { id: 'joey_bond', char: who, location, once: true, requires: 4, chapter: { id: 'joey_bond', title: 'Joey — amizade', nodes: [
      { t: 'show', who, side: 'center' },
      J('serious', '{nome}… valeu por sempre topar meus duelos. Sério.'),
      J('embarrassed', 'Não conta pra ninguém que eu disse isso, tá?'),
      P('Seu segredo está seguro.'),
      J('laugh', 'Agora chega de papo. Quem perder paga o lanche!'),
      { t: 'end' },
    ] } },
    { id: 'joey_rematch', char: who, location, chapter: rematch('joey_rematch', who, 'Joey', {
      hello: ['laugh', 'Olha quem apareceu! Bora, mais uma partida?'],
      win: ['sad', 'Argh! Eu estava tão perto…'],
      lose: ['laugh', 'Ha! Hoje a sorte é minha!'],
      leave: ['neutral', 'Sem problema. Me procura quando quiser.'],
    }) },
  ];
}

export function bakuraScenes(location: string): Scene[] {
  const B = line('bakura', 'Bakura');
  const who = 'bakura';
  return [
    { id: 'bakura_intro', char: who, location, once: true, chapter: { id: 'bakura_intro', title: 'Bakura — o parque', nodes: [
      { t: 'show', who, side: 'center' },
      B('laugh', 'Ah, {nome}. Que bom te ver. O parque fica tão quieto a essa hora… Um duelo seria uma boa companhia.'),
      { t: 'choice', options: [{ text: 'Duelar', goto: 'aceita' }, { text: 'Conversar um pouco', goto: 'conversa' }] },
      label('conversa'),
      B('neutral', 'Dizem que as cartas guardam lembranças de quem as usou. Às vezes acho que as minhas me conhecem melhor do que eu mesmo.'),
      B('sad', 'Mas não ligue para isso. Vamos jogar?'),
      { t: 'choice', options: [{ text: 'Duelar', goto: 'aceita' }, { text: 'Outra hora', goto: 'depois' }] },
      label('depois'), B('neutral', 'Tudo bem. Eu fico por aqui.'), { t: 'goto', to: 'fim' },
      label('aceita'), B('laugh', 'Que ótimo! Eu não sou muito bom, mas prometo me divertir.'),
      { t: 'duel', opponent: who, win: 'venceu', lose: 'perdeu' },
      label('venceu'), B('surprised', 'Você é muito bom…'), B('laugh', 'Obrigado por jogar comigo, {nome}.'), { t: 'heart', who, delta: 1 }, { t: 'goto', to: 'fim' },
      label('perdeu'), B('neutral', 'Foi uma boa partida. Venha de novo.'),
      label('fim'), { t: 'end' },
    ] } },
    { id: 'bakura_bond', char: who, location, once: true, requires: 4, chapter: { id: 'bakura_bond', title: 'Bakura — amizade', nodes: [
      { t: 'show', who, side: 'center' },
      B('embarrassed', 'Sabe, {nome}, eu não tinha muitos amigos para jogar…'),
      B('laugh', 'Obrigado por vir sempre. De verdade.'),
      { t: 'end' },
    ] } },
    { id: 'bakura_rematch', char: who, location, chapter: rematch('bakura_rematch', who, 'Bakura', {
      hello: ['laugh', 'Você voltou! Uma partida antes do anoitecer?'],
      win: ['embarrassed', 'Você ficou ainda melhor…'],
      lose: ['laugh', 'Fico feliz de ter jogado bem hoje.'],
      leave: ['neutral', 'Claro. O parque continua aqui.'],
    }) },
  ];
}

export function kaibaScenes(location: string): Scene[] {
  const K = line('seto_kaiba', 'Kaiba');
  const who = 'seto_kaiba';
  return [
    { id: 'kaiba_intro', char: who, location, once: true, chapter: { id: 'kaiba_intro', title: 'Kaiba — o convite', nodes: [
      { t: 'show', who, side: 'center' },
      K('neutral', 'Então você veio. Poucos têm coragem de entrar na Kaiba Corp sem convite.'),
      P('Ouvi falar do seu deck. Vim ver se é verdade.'),
      K('angry', 'Ouvir falar não basta. Prove. Agora.'),
      { t: 'choice', options: [{ text: 'Aceitar o desafio', goto: 'aceita' }, { text: 'Provocar o Kaiba', goto: 'provoca' }] },
      label('provoca'), P('Calma, Kaiba. Você vai ter a sua vez.'), K('angry', 'Chega de conversa.'),
      label('aceita'),
      { t: 'duel', opponent: who, win: 'venceu', lose: 'perdeu' },
      label('venceu'), K('surprised', 'Impossível… Eu perdi para você?'), K('angry', 'Isso não vai se repetir.'), { t: 'heart', who, delta: 1 }, { t: 'goto', to: 'fim' },
      label('perdeu'), K('laugh', 'Fraco. Volte com um deck de verdade.'),
      label('fim'), { t: 'end' },
    ] } },
    { id: 'kaiba_bond', char: who, location, once: true, requires: 4, chapter: { id: 'kaiba_bond', title: 'Kaiba — respeito', nodes: [
      { t: 'show', who, side: 'center' },
      K('neutral', 'Você me interessa, {nome}. Não espere que eu repita isso.'),
      K('embarrassed', 'A porta da Kaiba Corp estará aberta para você.'),
      { t: 'end' },
    ] } },
    { id: 'kaiba_rematch', char: who, location, chapter: rematch('kaiba_rematch', who, 'Kaiba', {
      hello: ['neutral', 'Voltou. Espero que tenha aprendido alguma coisa.'],
      win: ['angry', 'Tsc. Foi sorte.'],
      lose: ['laugh', 'Exatamente como esperado.'],
      leave: ['neutral', 'Não me faça perder tempo.'],
    }) },
  ];
}
