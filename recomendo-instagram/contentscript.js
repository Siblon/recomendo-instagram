// === CONFIGURAÇÕES DO USUÁRIO ===
const MIN_DELAY = 30000; // 30 segundos
const MAX_DELAY = 300000; // 5 minutos
const DELAY_CURTIDA = 3000; // Delay entre curtidas
const TEMPO_ESPERA_ENTRE_ACOES = 7000; // Delay entre seguir e curtir, etc.
const MAX_CURTIDAS = 4; // Configurável entre 0 e 4

const DEFAULT_CONFIG = {
  maxPerfis: Infinity,
  maxCurtidas: MAX_CURTIDAS,
  minDelay: MIN_DELAY,
  maxDelay: MAX_DELAY
};

let config = { ...DEFAULT_CONFIG };
let iniciado = false;

// === VARIÁVEIS ===
let parar = false;
const logBox = document.createElement('div');
const perfisSeguidos = new Set();
let falhasDeSeguir = 0;
let bloqueioSeguirAtivo = false;
let tentativasDeDesbloqueio = 0;
let horaInicio = null;
let horaBloqueio = null;
let horaFim = null;
let totalSeguidos = 0;
let contaAlvo = '';
let timeoutBloqueio = null;

// === INTERFACE ===
function criarPainel() {
  logBox.style = `
    position: fixed;
    bottom: 10px;
    right: 10px;
    background: rgba(0,0,0,0.8);
    color: lime;
    font-family: monospace;
    font-size: 13px;
    padding: 10px;
    max-height: 200px;
    width: 240px;
    overflow-y: auto;
    z-index: 9999;
    box-shadow: 0 0 6px rgba(0,0,0,0.5);
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
    background: #d9534f;
    color: white;
    border: none;
    padding: 10px 12px;
    z-index: 9999;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 0 4px rgba(0,0,0,0.3);
  `;
  btn.onclick = () => parar = true;
  document.body.appendChild(btn);
}

function log(msg) {
  const tempo = new Date().toLocaleTimeString();
  const linha = document.createElement('div');
  linha.textContent = `[${tempo}] ${msg}`;
  linha.style.marginBottom = '4px';

  if (/⚠️|❌/.test(msg)) linha.style.color = 'orange';
  if (/✅|❤️/.test(msg)) linha.style.color = 'lime';

  logBox.appendChild(linha);
  logBox.scrollTop = logBox.scrollHeight;

  try {
    chrome.runtime.sendMessage({ tipo: 'log', msg });
  } catch (_) {}
}

function registrarSucessoSeguir() {
  totalSeguidos++;
  falhasDeSeguir = 0;
  bloqueioSeguirAtivo = false;
  tentativasDeDesbloqueio = 0;
  if (timeoutBloqueio) {
    clearTimeout(timeoutBloqueio);
    timeoutBloqueio = null;
  }
}

function registrarFalhaSeguir() {
  falhasDeSeguir++;
  if (falhasDeSeguir >= 3 && !bloqueioSeguirAtivo) detectarBloqueio();
}

function detectarBloqueio() {
  bloqueioSeguirAtivo = true;
  horaBloqueio = new Date();
  log('⚠️ Limitação de seguir detectada. Pausando...');
  parar = true;
  agendarNovaTentativa();
}

function agendarNovaTentativa() {
  tentativasDeDesbloqueio++;
  let delay;
  if (tentativasDeDesbloqueio === 1) {
    delay = delayAleatorio(3600000, 7200000);
  } else if (tentativasDeDesbloqueio === 2) {
    delay = 6 * 3600000;
  } else {
    log('❌ Limitação persistente. Encerrando automação.');
    encerrarAutomacao();
    return;
  }
  log(`⏸️ Próxima tentativa em ${(delay / 3600000).toFixed(1)}h`);
  timeoutBloqueio = setTimeout(() => {
    parar = false;
    bloqueioSeguirAtivo = false;
    falhasDeSeguir = 0;
    iniciar();
  }, delay);
}

function encerrarAutomacao() {
  horaFim = new Date();
  const duracaoMin = ((horaFim - horaInicio) / 60000).toFixed(1);
  log('---- RELATÓRIO ----');
  log(`Início: ${horaInicio?.toLocaleString()}`);
  log(`Conta: @${contaAlvo || 'desconhecido'}`);
  log(`Seguidos com sucesso: ${totalSeguidos}`);
  log(`Duração: ${duracaoMin} min`);
  log(`Encerramento: ${horaFim.toLocaleString()}`);
  parar = true;
}

// === FUNÇÕES ===
const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const select = (selector, parent = document) => parent.querySelector(selector);

const SELECTOR_MODAL = 'div[role="dialog"]';

const getFollowerModal = () => select(SELECTOR_MODAL);

function sugestoesDetectadas(modal) {
  if (!modal) return false;
  const texto = modal.textContent.toLowerCase();
  return (
    texto.includes('sugestões para você') ||
    texto.includes('sugestoes para voce')
  );
}

function estaNaListaDeSeguidores(item, modal) {
  if (!item || !modal) return false;
  const container = getScrollableContainer(modal);
  return container && container.contains(item);
}

function getScrollableContainer(modal) {
  if (!modal) return null;
  const elements = [modal, ...modal.querySelectorAll('*')];
  for (const el of elements) {
    const style = getComputedStyle(el);
    if (
      (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
      el.scrollHeight > el.clientHeight
    ) {
      return el;
    }
  }
  return modal;
}

function delayAleatorio(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function scrollModal(modal = getFollowerModal()) {
  if (!modal) return;
  const container = getScrollableContainer(modal);
  let previous = modal.querySelectorAll('button').length;
  let attempts = 0;
  do {
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    await esperar(delayAleatorio(1000, 6000));
    attempts++;
  } while (
    attempts < 3 &&
    modal.querySelectorAll('button').length <= previous
  );
}

async function scrollProfile() {
  let iterations = 0;
  do {
    window.scrollTo(0, document.body.scrollHeight);
    await esperar(delayAleatorio(500, 1500));
    const posts = [...document.querySelectorAll('article a')].filter((a) =>
      a.href.includes('/p/')
    );
    if (posts.length >= config.maxCurtidas) break;
    iterations++;
  } while (iterations < 3);
}

async function waitForPosts(timeout = 5000) {
  let start = Date.now();
  while (Date.now() - start < timeout) {
    const posts = document.querySelectorAll('article a[href*="/p/"]');
    if (posts.length > 0) return posts;
    await esperar(500);
  }
  return [];
}

async function clicarBotaoSeguir(botao, perfil) {
  if (!botao) return false;
  const texto = botao.innerText.toLowerCase();
  if (texto === 'seguir') {
    botao.click();
    await esperar(2000);
    const novoTexto = botao.innerText.toLowerCase();
    if (novoTexto === 'seguindo' || novoTexto === 'solicitado') {
      log(`👤 Seguiu @${perfil}`);
      registrarSucessoSeguir();
      return true;
    }
    log(`⚠️ Falha ao seguir @${perfil}`);
    registrarFalhaSeguir();
    return false;
  }
  if (texto === 'solicitado' || texto === 'seguindo') {
    log(`ℹ️ Já segue @${perfil}`);
  }
  return false;
}

async function curtirFotos() {
  const maxCurtidas = Math.floor(Math.random() * (config.maxCurtidas + 1));
  await esperar(delayAleatorio(3000, 5000));
  let posts = await waitForPosts();
  if (posts.length === 0) {
    window.scrollBy(0, 500);
    await esperar(delayAleatorio(2000, 4000));
    posts = await waitForPosts();
  }

  let curtidas = 0;
  for (const post of posts) {
    if (curtidas >= maxCurtidas) break;
    if (parar) return curtidas;

    const urlPost = post.href;
    try {
      post.click();

      let likeSvg = null;
      let attempts = 0;
      do {
        likeSvg = select('svg[aria-label="Curtir"], svg[aria-label="Descurtir"]');
        if (!likeSvg) await esperar(500);
        attempts++;
      } while (!likeSvg && attempts < 20);

      if (likeSvg?.getAttribute('aria-label') === 'Curtir') {
        likeSvg.closest('button')?.click();
        log(`❤️ ${urlPost} - ${new Date().toLocaleTimeString()}`);
      }

      const fechar = select('[aria-label="Fechar"]');
      if (fechar) {
        fechar.click();
      } else {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      }
    } catch (_) {
      log('⚠️ Erro ao curtir foto');
    }

    curtidas++;
    await esperar(DELAY_CURTIDA);
  }

  return curtidas;
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

  const modalRoot = item.closest(SELECTOR_MODAL);
  let current = item;
  let linkPerfil = null;
  let inspected = item;

  while (current) {
    inspected = current;
    linkPerfil =
      current.querySelector('a[href^="/"]') ||
      current.querySelector('a[href*="instagram.com"]');
    if (linkPerfil || current === modalRoot) break;
    current = current.parentElement;
  }

  if (!linkPerfil && current === modalRoot) {
    inspected = current;
    linkPerfil =
      current.querySelector('a[href^="/"]') ||
      current.querySelector('a[href*="instagram.com"]');
  }

  if (!linkPerfil) {
    log('⚠️ Link do perfil não encontrado');
    if (inspected) log(inspected.outerHTML);
    return { item, link: null, nome: null };
  }

  const hrefCompleto = linkPerfil.getAttribute('href') || linkPerfil.href;
  if (!hrefCompleto) {
    log('⚠️ Link do perfil sem href');
    return { item, link: linkPerfil, nome: null };
  }

  const hrefSemQuery = hrefCompleto.split('?')[0];
  const partes = hrefSemQuery.split('/').filter(Boolean);
  const nome = partes[partes.length - 1] || null;
  return { item, link: linkPerfil, nome };
}

async function processarPerfil(botao) {
  if (parar) return false;

  const modal = getFollowerModal();
  const { item, link: linkPerfil, nome: nomePerfil } = extrairNomeDoPerfil(botao);

  if (!item || !modal || !item.closest(SELECTOR_MODAL)) {
    log('⚠️ Item do perfil não encontrado no modal. Pulando.');
    return false;
  }

  if (sugestoesDetectadas(modal) || !estaNaListaDeSeguidores(item, modal)) {
    log('⚠️ Lista de seguidores indisponível. Ignorando sugestões do Instagram.');
    parar = true;
    return false;
  }

  if (!nomePerfil) {
    log('⚠️ Nome do perfil não identificado. Pulando.');
    return false;
  }

  const textoBotao = botao.innerText?.toLowerCase();

  if (textoBotao === 'seguindo' || textoBotao === 'solicitado') {
    log(`⚠️ Perfil já seguido ou solicitado: @${nomePerfil}`);
    await scrollModal();
    return false;
  }

  if (perfisSeguidos.has(nomePerfil)) {
    log(`⚠️ Perfil já processado: @${nomePerfil}`);
    await scrollModal();
    return false;
  }

  perfisSeguidos.add(nomePerfil);

  linkPerfil?.click();
  await esperar(TEMPO_ESPERA_ENTRE_ACOES * 2);

  log(`➡️ Visitando: @${nomePerfil}`);

  const seguirBtn = [...document.querySelectorAll('button')].find((btn) => btn.innerText.toLowerCase() === 'seguir');
  await clicarBotaoSeguir(seguirBtn, nomePerfil);
  if (bloqueioSeguirAtivo) {
    await voltarParaModal();
    return false;
  }

  await esperar(TEMPO_ESPERA_ENTRE_ACOES);
  await scrollProfile();
  const curtidas = await curtirFotos();
  log(`❤️ @${nomePerfil}: curtiu ${curtidas} foto(s)`);

  await voltarParaModal();
  await scrollModal();

  return true;
}

async function iniciar() {
  if (!horaInicio) {
    horaInicio = new Date();
    contaAlvo = location.pathname.split('/')[1] || 'desconhecido';
  }
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
    if (sugestoesDetectadas(modal)) {
      log('⚠️ Lista de seguidores indisponível. Ignorando sugestões do Instagram.');
      parar = true;
      break;
    }
    const botoesSeguir = [...modal.querySelectorAll('button')].filter((btn) => btn.innerText.toLowerCase() === 'seguir');

    if (botoesSeguir.length === 0) {
      log('⚠️ Nenhum botão "Seguir" restante');
      await scrollModal(modal);
      continue;
    }

    const perfilProcessado = await processarPerfil(botoesSeguir[0]);
    if (perfilProcessado) {
      processados++;
    }

    await scrollModal(modal);

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
