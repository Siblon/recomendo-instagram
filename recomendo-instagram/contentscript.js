// === CONFIGURAÇÕES DO USUÁRIO ===
const MIN_DELAY = 30000; // 30 segundos
const MAX_DELAY = 300000; // 5 minutos
const DELAY_CURTIDA = 3000; // Delay entre curtidas
const TEMPO_ESPERA_ENTRE_ACOES = 7000; // Delay entre seguir e curtir, etc.
const MAX_CURTIDAS = 4; // Configurável entre 0 e 4
const DELAY_SCROLL_MIN = 5000;
const DELAY_SCROLL_MAX = 8000;

const DEFAULT_CONFIG = {
  maxPerfis: Infinity,
  maxCurtidas: MAX_CURTIDAS,
  minDelay: MIN_DELAY,
  maxDelay: MAX_DELAY
};

let config = { ...DEFAULT_CONFIG };
let iniciado = false;
let parar = false;
const logBox = document.createElement('div');
const perfisSeguidos = new Set();
let ultimoItemProcessado = null;

function criarPainel() {
  logBox.style = `
    position: fixed;
    bottom: 10px;
    right: 10px;
    background: #000;
    color: lime;
    font-family: monospace;
    font-size: 12px;
    padding: 10px;
    max-height: 200px;
    overflow-y: auto;
    z-index: 9999;
  `;
  document.body.appendChild(logBox);
  log('✅ Iniciando automação...');
  addBotaoParar();
}

function addBotaoParar() {
  const btn = document.createElement('button');
  btn.innerText = 'PARAR';
  btn.style = `
    position: fixed;
    bottom: 10px;
    left: 10px;
    background: red;
    color: white;
    border: none;
    padding: 10px;
    z-index: 9999;
    font-weight: bold;
  `;
  btn.onclick = () => parar = true;
  document.body.appendChild(btn);
}

function log(msg) {
  const tempo = new Date().toLocaleTimeString();
  const linha = document.createElement('div');
  linha.textContent = `[${tempo}] ${msg}`;
  linha.style.marginBottom = '4px';
  logBox.appendChild(linha);
  logBox.scrollTop = logBox.scrollHeight;
}

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const select = (selector, parent = document) => parent.querySelector(selector);
const SELECTOR_MODAL = 'div[role="dialog"]';

function getFollowerModal() {
  return select(SELECTOR_MODAL);
}

function getScrollableContainer(modal) {
  if (!modal) return null;
  const elements = [modal, ...modal.querySelectorAll('*')];
  for (const el of elements) {
    const style = getComputedStyle(el);
    if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
      return el;
    }
  }
  return modal;
}

function delayAleatorio(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isBotaoSeguir(btn) {
  if (!btn || !btn.innerText) return false;
  const texto = btn.innerText.trim().toLowerCase();
  return texto.includes('seguir') || texto.includes('follow');
}

async function scrollModal(modal = getFollowerModal()) {
  if (!modal) return;
  const container = getScrollableContainer(modal);
  container.scrollTop += container.clientHeight;
  await esperar(delayAleatorio(DELAY_SCROLL_MIN, DELAY_SCROLL_MAX));
}

function extrairNomeDoPerfil(botao) {
  const item = botao.closest('li') || botao.closest('div');
  if (!item) return { item: null, link: null, nome: null };
  const linkPerfil = item.querySelector('a[href*="/"]');
  const nome = linkPerfil ? linkPerfil.getAttribute('href').split('/')[1] : null;
  return { item, link: linkPerfil, nome };
}

async function clicarBotaoSeguir(botao, nomePerfil) {
  if (!botao) return false;
  if (isBotaoSeguir(botao)) {
    botao.click();
    log(`👤 Seguiu @${nomePerfil}`);
    return true;
  }
  return false;
}

async function curtirFotos() {
  const links = [...document.querySelectorAll('article a')].filter(a => a.href.includes('/p/'));
  const fotosCurtidas = Math.min(links.length, Math.floor(Math.random() * (config.maxCurtidas + 1)));
  for (let i = 0; i < fotosCurtidas; i++) {
    if (parar) return 0;
    try {
      links[i].click();
      await esperar(TEMPO_ESPERA_ENTRE_ACOES);
      const likeBtn = select('svg[aria-label="Curtir"], svg[aria-label="Like"]');
      likeBtn?.closest('button')?.click();
      const closeBtn = select('svg[aria-label="Fechar"]');
      closeBtn?.closest('button')?.click();
      log('❤️ Curtiu 1 foto');
    } catch {
      log('⚠️ Erro ao curtir foto');
    }
    await esperar(DELAY_CURTIDA);
  }
  return fotosCurtidas;
}

async function voltarParaModal() {
  history.back();
  await esperar(TEMPO_ESPERA_ENTRE_ACOES * 2);
  const modal = getFollowerModal();
  if (!modal) {
    const abrirLink = select('a[href$="/followers/"]');
    abrirLink?.click();
    await esperar(TEMPO_ESPERA_ENTRE_ACOES * 2);
  }
  log('⬅️ Voltou para lista de seguidores');
}

function obterProximoBotao(modal) {
  const botoes = [...modal.querySelectorAll('button')].filter(isBotaoSeguir);
  return botoes.find(btn => {
    const item = btn.closest('li') || btn.closest('div');
    return item && (!ultimoItemProcessado || item.compareDocumentPosition(ultimoItemProcessado) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
}

async function processarPerfil(botao) {
  if (parar) return false;
  const modal = getFollowerModal();
  const { item, link: linkPerfil, nome: nomePerfil } = extrairNomeDoPerfil(botao);

  if (!item || !modal || !nomePerfil) {
    log('⚠️ Dados do perfil incompletos. Pulando.');
    return false;
  }

  if (perfisSeguidos.has(nomePerfil)) {
    log(`⚠️ Perfil já processado: @${nomePerfil}`);
    ultimoItemProcessado = item;
    return false;
  }

  perfisSeguidos.add(nomePerfil);
  linkPerfil?.click();
  await esperar(TEMPO_ESPERA_ENTRE_ACOES * 2);

  log(`➡️ Visitando: @${nomePerfil}`);
  const seguirBtn = [...document.querySelectorAll('button')].find(isBotaoSeguir);
  await clicarBotaoSeguir(seguirBtn, nomePerfil);

  await esperar(TEMPO_ESPERA_ENTRE_ACOES);
  const curtidas = await curtirFotos();
  log(`❤️ @${nomePerfil}: curtiu ${curtidas} foto(s)`);
  await voltarParaModal();

  ultimoItemProcessado = item;
  item.scrollIntoView({ behavior: 'smooth', block: 'start' });
  await esperar(delayAleatorio(800, 1500));
  return true;
}

async function iniciar() {
  criarPainel();
  let modal = getFollowerModal();
  if (!modal) return log('⚠️ Modal não encontrado');

  let processados = 0;
  while (!parar && processados < config.maxPerfis) {
    modal = getFollowerModal();
    let botao = obterProximoBotao(modal);
    if (!botao) {
      await scrollModal(modal);
      botao = obterProximoBotao(modal);
      if (!botao) continue;
    }
    if (await processarPerfil(botao)) processados++;
    const delay = delayAleatorio(config.minDelay, config.maxDelay);
    log(`⏳ Próxima ação em: ${(delay / 1000).toFixed(0)}s`);
    await esperar(delay);
  }
  log('✅ Fim da automação');
}

chrome.runtime.onMessage.addListener((request) => {
  if (request.type === 'config') {
    const { maxPerfis, maxCurtidas, minDelay, maxDelay } = request.data;
    config.maxPerfis = Number(maxPerfis) || DEFAULT_CONFIG.maxPerfis;
    config.maxCurtidas = Math.min(Number(maxCurtidas), MAX_CURTIDAS);
    config.minDelay = (Number(minDelay) || MIN_DELAY / 1000) * 1000;
    config.maxDelay = (Number(maxDelay) || MAX_DELAY / 1000) * 1000;
    if (!iniciado) {
      iniciado = true;
      iniciar();
    }
  }
});
