// == Recomendo Instagram - Bot para seguir e curtir perfis ==

let stopBot = false;
let perfisSeguidos = new Set();
let isBotRunning = false;
let botConfig = { maxPerfis: 10, maxCurtidas: 1, minDelay: 3, maxDelay: 6 };

const log = (msg, tipo = 'info') => {
  const prefixo = `[${new Date().toLocaleTimeString()}]`;
  const cor = tipo === 'erro' ? '\x1b[31m' : tipo === 'aviso' ? '\x1b[33m' : '\x1b[32m';
  console.log(`${cor}${prefixo} ${msg}\x1b[0m`);
};

const delay = (s) => new Promise(res => setTimeout(res, s * 1000));

const getDelayAleatorio = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const clicarSeguir = async (botao) => {
  if (botao && botao.innerText.toLowerCase() === 'seguir') {
    botao.click();
    log(`\u2705 Seguiu com sucesso.`);
    return true;
  } else {
    log(`\u26A0\uFE0F Bot\u00e3o 'Seguir' n\u00e3o encontrado ou j\u00e1 seguido.`, 'aviso');
    return false;
  }
};

const extrairNomeDoPerfil = () => {
  const nomeEl = document.querySelector('header h2, header h1');
  return nomeEl ? nomeEl.innerText.trim() : null;
};

const voltarParaLista = () => {
  window.history.back();
};

const visitarPerfil = (link) => {
  return new Promise(resolve => {
    window.location.href = link;
    const checar = setInterval(() => {
      if (document.querySelector('header')) {
        clearInterval(checar);
        resolve();
      }
    }, 1000);
  });
};

const iniciarBot = async () => {
  if (isBotRunning) return;
  isBotRunning = true;
  stopBot = false;
  log('\u2705 Iniciando aut\u00f4mata\u00e7\u00e3o...');

  const {
    maxPerfis,
    maxCurtidas: fotosParaCurtir,
    minDelay: delayMin,
    maxDelay: delayMax
  } = botConfig;

  const lista = document.querySelectorAll('div[role="dialog"] li');

  for (let i = 0; i < lista.length && !stopBot && perfisSeguidos.size < maxPerfis; i++) {
    const item = lista[i];
    const linkPerfil = item.querySelector('a');

    if (!linkPerfil || perfisSeguidos.has(linkPerfil.href)) {
      log(`\u26A0\uFE0F Perfil j\u00e1 processado: ${linkPerfil?.href || '@desconhecido'}`, 'aviso');
      continue;
    }

    perfisSeguidos.add(linkPerfil.href);
    await visitarPerfil(linkPerfil.href);
    await delay(2);

    const nome = extrairNomeDoPerfil();
    log(`\u{1F465} Visitando: ${nome || 'Desconhecido'}`);

  const botaoSeguir = [...document.querySelectorAll('button')].find(b => b.innerText.toLowerCase() === 'seguir');
  const username = item.querySelector('span')?.innerText;
  if (username) log(`\u2795 Seguindo @${username}`);
  await clicarSeguir(botaoSeguir);

    await delay(getDelayAleatorio(delayMin, delayMax));
    voltarParaLista();
    await delay(3);
  }

  log('\u2705 Finalizado.');
  isBotRunning = false;
};

const pararBot = () => {
  stopBot = true;
  isBotRunning = false;
  log('\u274C Bot parado pelo usu\u00e1rio.', 'erro');
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'config') {
    botConfig = request.data;
    iniciarBot();
    sendResponse({ status: 'started' });
  }
});

