// === CONFIGURAÇÕES DO USUÁRIO ===
const MIN_DELAY = 30000;
const MAX_DELAY = 300000;
const DELAY_CURTIDA = 3000;
const TEMPO_ESPERA_ENTRE_ACOES = 7000;
const MAX_CURTIDAS = 4;
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

// === INTERFACE ===
function criarPainel() {
  logBox.style = `
    position: fixed; bottom: 10px; right: 10px;
    background: #000; color: lime;
    font-family: monospace; font-size: 12px;
    padding: 10px; max-height: 200px;
    overflow-y: auto; z-index: 9999;
  `;
  document.body.appendChild(logBox);
  log('✅ Iniciando automação...');
  addBotaoParar();
}

function addBotaoParar() {
  const btn = document.createElement('button');
  btn.innerText = 'PARAR';
  btn.style = `
    position: fixed; bottom: 10px; left: 10px;
    background: red; color: white;
    border: none; padding: 10px;
    z-index: 9999; font-weight: bold;
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

// === FUNÇÕES ===
const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const select = (selector, parent = document) => parent.querySelector(selector);
const SELECTOR_MODAL = 'div[role="dialog"]';

const getFollowerModal = () => select(SELECTOR_MODAL);

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
  const start = container.scrollTop;
  container.scrollTo({ top: start + container.clientHeight, behavior: 'smooth' });
  await esperar(delayAleatorio(DELAY_SCROLL_MIN, DELAY_SCROLL_MAX));
}

async function clicarBotaoSeguir(botao, perfil) {
  if (!botao) return false;
  const texto = botao.innerText.trim().toLowerCase();
  if (isBotaoSeguir(botao)) {
    botao.click();
    log(`👤 Seguiu @${perfil}`);
    return true;
  }
  if (texto === 'solicitado' || texto === 'seguindo') {
    log(`ℹ️ Já segue @${perfil}`);
  }
  return false;
}

async function curtirFotos() {
  const links = [...document.querySelectorAll('article a')].filter((a) => a.href.includes('/p/'));
  const fotosCurtidas = Math.min(links.length, Math.floor(Math.random() * (config.maxCurtidas + 1)));
  for (let i = 0; i < fotosCurtidas; i++) {
    if (parar) return 0;
    try {
      links[i].click();
      await esperar(TEMPO_ESPERA_ENTRE_ACOES);
      const botaoLike = select('svg[aria-label="Curtir"], svg[aria-label="Like"]');
      botaoLike?.closest('button')?.click();
      const botaoFechar = select('svg[aria-label="Fechar"]');
      botaoFechar?.closest('button')?.click();
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
  let modal = getFollowerModal();
  if (!modal) {
    const abrirLink = select('a[href$="/followers/"]');
    if (abrirLink) {
      abrirLink.click();
      await esperar(TEMPO_ESPERA_ENTRE_ACOES * 2);
      modal = getFollowerModal();
    }
    if (!modal) {
      log('⚠️ Falha ao reabrir a lista de seguidores');
      return;
    }
  }
  log('⬅️ Voltou para lista de seguidores');
}

function extrairNomeDoPerfil(botao) {
  const item = botao.closest('li') || botao.closest('div');
  if (!item) return { item: null, link: null, nome: null };
  let linkPerfil = null;
  let nome = null;
  const anchors = [...item.querySelectorAll('a[href]')];

  for (const a of anchors) {
    const href = a.getAttribute('href');
    if (!href) continue;
    const match = href.match(/(?:https?:\/\/[^/]+)?\/(.*?)\/?$/);
    if (!match) continue;
    const candidate = match[1];
    if (!candidate || candidate.includes('explore') || candidate.includes('direct')) continue;
    linkPerfil = a;
    nome = candidate;
    break;
  }

  if (!nome) {
    const tentativaAlt = item.querySelector('span, strong');
    if (tentativaAlt) {
      nome = tentativaAlt.textContent?.trim().replace(/^@/, '').split(/\s/)[0];
    }
  }

  if (!nome) {
    log('⚠️ Dados do perfil incompletos. Pulando.');
    log(item.outerHTML);
    return { item: null, link: null, nome: null };
  }

  return { item, link: linkPerfil, nome };
}

function obterProximoBotao(modal) {
  const botoesSeguir = [...modal.querySelectorAll('button')].filter(isBotaoSeguir);
  if (botoesSeguir.length === 0) return null;
  if (!ultimoItemProcessado) return botoesSeguir[0];
  for (const btn of botoesSeguir) {
    const item = btn.closest('li') || btn.closest('div');
    if (item && (ultimoItemProcessado.compareDocumentPosition(item) & Node.DOCUMENT_POSITION_FOLLOWING)) {
      return btn;
    }
  }
  return null;
}

async function processarPerfil(botao) {
  if (parar) return false;
  const modal = getFollowerModal();
  const { item, link: linkPerfil, nome: nomePerfil } = extrairNomeDoPerfil(botao);

  if (!item || !modal || !item.closest(SELECTOR_MODAL) || !nomePerfil) {
    log('⚠️ Dados do perfil incompletos. Pulando.');
    return false;
  }

  const textoBotao = botao.innerText?.trim().toLowerCase();
  if (textoBotao.includes('seguindo') || textoBotao.includes('solicitado')) {
    log(`⚠️ Perfil já seguido ou solicitado: @${nomePerfil}`);
    perfisSeguidos.add(nomePerfil);
    ultimoItemProcessado = item;
    await scrollModal();
    return false;
  }

  if (perfisSeguidos.has(nomePerfil)) {
    log(`⚠️ Perfil já processado: @${nomePerfil}`);
    ultimoItemProcessado = item;
    await scrollModal();
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
  const proximo = item.nextElementSibling;
  if (proximo) {
    proximo.scrollIntoView({ behavior: 'smooth', block: 'start' });
    await esperar(delayAleatorio(800, 1500));
  } else {
    await scrollModal();
  }
  return true;
}

async function iniciar() {
  criarPainel();
  let modal = getFollowerModal();
  if (!modal) return log('⚠️ Modal de seguidores não encontrado');

  let processados = 0;
  while (!parar && processados < config.maxPerfis) {
    modal = getFollowerModal();
    if (!modal) {
      log('⚠️ Modal de seguidores não encontrado');
      break;
    }

    await esperar(1000); // Aguarda carregamento
    let botao = obterProximoBotao(modal);

    if (!botao) {
      log('⚠️ Nenhum botão "Seguir" encontrado. Scrollando...');
      await scrollModal(modal);
      botao = obterProximoBotao(modal);
      if (!botao) continue;
    }

    const perfilProcessado = await processarPerfil(botao);
    if (perfilProcessado) processados++;

    if (parar) break;
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
