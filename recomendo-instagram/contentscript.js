// == Recomendo Instagram - Bot para seguir e curtir perfis ==

let stopBot = false;
let perfisSeguidos = new Set();
let isBotRunning = false;
let botConfig = { maxPerfis: 10, maxCurtidas: 1, minDelay: 3, maxDelay: 6 };
let panelInitialized = false;

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

const startAutomation = () => iniciarBot();

const criarPainel = () => {
  const painel = document.createElement('div');
  painel.id = 'botPanel';
  painel.style = 'position:fixed;top:10px;right:10px;background:#fff;border:2px solid #000;padding:10px;z-index:9999999;font-family:sans-serif';
  painel.innerHTML = `
    <h3>Recomendo Instagram</h3>
    N\u00ba m\u00e1x. de perfis por sess\u00e3o:<br><input id="max" value="10"><br>
    Qtd. de fotos para curtir (0-4):<br><input id="curtidas" value="1"><br>
    Delay m\u00ednimo (s):<br><input id="delayMin" value="3"><br>
    Delay m\u00e1ximo (s):<br><input id="delayMax" value="6"><br><br>
    <button id="startBot">Iniciar Bot</button>
    <button id="stopBot" style="background:red;color:white;margin-left:5px;">Parar</button>
  `;
  document.body.appendChild(painel);

  const startBtn = document.getElementById('startBot');
  startBtn.addEventListener('click', () => {
    botConfig = {
      maxPerfis: parseInt(document.getElementById('max').value, 10),
      maxCurtidas: parseInt(document.getElementById('curtidas').value, 10),
      minDelay: parseInt(document.getElementById('delayMin').value, 10),
      maxDelay: parseInt(document.getElementById('delayMax').value, 10)
    };
    startBtn.disabled = true;
    startAutomation();
  }, { once: true });

  document.getElementById('stopBot').addEventListener('click', pararBot);
  panelInitialized = true;
};

if (!window.recomendoMessageListenerAdded) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'config') {
      botConfig = request.data;
      iniciarBot();
      sendResponse({ status: 'started' });
    }
  });
  window.recomendoMessageListenerAdded = true;
}

if (!document.getElementById('botPanel')) {
  criarPainel();
}

