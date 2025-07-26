// == Recomendo Instagram - Bot para seguir e curtir perfis ==

let stopBot = false;
let perfisSeguidos = new Set();
let isBotRunning = false;

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

  const maxPerfis = parseInt(document.getElementById('max').value);
  const fotosParaCurtir = parseInt(document.getElementById('curtidas').value);
  const delayMin = parseInt(document.getElementById('delayMin').value);
  const delayMax = parseInt(document.getElementById('delayMax').value);

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

const criarPainel = () => {
  const painel = document.createElement('div');
  painel.id = 'botPanel';
  painel.style = 'position:fixed;top:10px;right:10px;background:#fff;border:2px solid #000;padding:10px;z-index:9999999;font-family:sans-serif';
  painel.innerHTML = `
    <h3>Recomendo Instagram</h3>
    Nº máx. de perfis por sessão:<br><input id="max" value="10"><br>
    Qtd. de fotos para curtir (0-4):<br><input id="curtidas" value="1"><br>
    Delay mínimo (s):<br><input id="delayMin" value="3"><br>
    Delay máximo (s):<br><input id="delayMax" value="6"><br><br>
    <button id="startBot">Iniciar Bot</button>
    <button id="stopBot" style="background:red;color:white;margin-left:5px;">Parar</button>
  `;
  document.body.appendChild(painel);
  
  document.getElementById('startBot').onclick = iniciarBot;
  document.getElementById('stopBot').onclick = pararBot;
};

if (!document.getElementById('botPanel')) {
  criarPainel();
}
