// === CONFIGURAÇÕES DO USUÁRIO ===
const MIN_DELAY = 30000;
const MAX_DELAY = 300000;
const DELAY_CURTIDA = 3000;
const TEMPO_ESPERA_ENTRE_ACOES = 7000;
const MAX_CURTIDAS = 4;

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
let falhasDeSeguir = 0;
let bloqueioSeguirAtivo = false;
let tentativasDeDesbloqueio = 0;
let horaInicio = null;
let horaBloqueio = null;
let horaFim = null;
let totalSeguidos = 0;
let contaAlvo = '';
let timeoutBloqueio = null;

// === FUNÇÕES DE UI E LOG ===
function criarPainel() {
  logBox.style = `position: fixed; bottom: 10px; right: 10px; background: rgba(0,0,0,0.8); color: lime; font-family: monospace; font-size: 13px; padding: 10px; max-height: 200px; width: 240px; overflow-y: auto; z-index: 9999; box-shadow: 0 0 6px rgba(0,0,0,0.5);`;
  document.body.appendChild(logBox);
  log('✅ Iniciando automação...');
  addBotaoParar();
}

function addBotaoParar() {
  const btn = document.createElement('button');
  btn.innerText = 'PARAR';
  btn.style = `position: fixed; bottom: 10px; left: 10px; background: #d9534f; color: white; border: none; padding: 10px 12px; z-index: 9999; font-weight: bold; cursor: pointer; box-shadow: 0 0 4px rgba(0,0,0,0.3);`;
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
  try { chrome.runtime.sendMessage({ tipo: 'log', msg }); } catch (_) {}
}

function registrarSucessoSeguir() {
  totalSeguidos++;
  falhasDeSeguir = 0;
}

function registrarFalhaSeguir() {
  falhasDeSeguir++;
  if (falhasDeSeguir >= 3) detectarBloqueio();
}

function detectarBloqueio() {
  if (bloqueioSeguirAtivo) return;
  bloqueioSeguirAtivo = true;
  horaBloqueio = new Date();
  log(`⚠️ Limitação de seguir detectada em ${horaBloqueio.toLocaleTimeString()}`);
  encerrarAutomacao();
}

function encerrarAutomacao() {
  if (horaFim) return;
  horaFim = new Date();
  const duracaoMin = ((horaFim - horaInicio) / 60000).toFixed(1);
  log('---- RELATÓRIO ----');
  log(`Início: ${horaInicio?.toLocaleString()}`);
  log(`Bloqueio: ${horaBloqueio?.toLocaleString() || 'n/a'}`);
  log(`Conta: @${contaAlvo || 'desconhecido'}`);
  log(`Seguidos com sucesso: ${totalSeguidos}`);
  log(`Duração: ${duracaoMin} min`);
  log(`Encerramento: ${horaFim.toLocaleString()}`);
  parar = true;
}

function esperar(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function delayAleatorio(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

async function scrollModal(modal) {
  if (!modal) return;
  const container = modal.querySelector('[style*="overflow"]') || modal;
  container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  await esperar(delayAleatorio(1000, 2000));
}

async function scrollProfile() {
  const maxScrolls = 10;
  let scrolls = 0;
  while (scrolls < maxScrolls) {
    const posts = [...document.querySelectorAll('article a[href*="/p/"]')];
    if (posts.length >= config.maxCurtidas) break;
    window.scrollBy(0, 400);
    await esperar(delayAleatorio(1000, 2000));
    scrolls++;
  }
}

async function curtirFotos() {
  const maxCurtidas = Math.floor(Math.random() * (config.maxCurtidas + 1));
  await esperar(delayAleatorio(3000, 5000));
  let posts = [...document.querySelectorAll('article a[href*="/p/"]')];

  if (posts.length === 0) {
    window.scrollBy(0, 500);
    await esperar(delayAleatorio(2000, 4000));
    posts = [...document.querySelectorAll('article a[href*="/p/"]')];
  }

  let curtidas = 0;
  for (const post of posts) {
    if (curtidas >= maxCurtidas || parar) break;
    try {
      post.click();
      await esperar(2000);

      let likeSvg = null;
      for (let i = 0; i < 10; i++) {
        likeSvg = document.querySelector('svg[aria-label="Curtir"]');
        if (likeSvg) break;
        await esperar(500);
      }

      if (likeSvg) {
        likeSvg.closest('button')?.click();
        log(`❤️ ${post.href}`);
        curtidas++;
        await esperar(DELAY_CURTIDA);
      }

      document.querySelector('[aria-label="Fechar"]')?.click();
    } catch (e) { log('⚠️ Erro ao curtir'); }
  }
  return curtidas;
}

async function processarPerfil(botao) {
  const item = botao.closest('li') || botao.closest('div');
  const nome = item?.querySelector('a')?.href.split('/')[3];
  if (!nome || perfisSeguidos.has(nome)) return false;
  perfisSeguidos.add(nome);

  botao.click();
  await esperar(TEMPO_ESPERA_ENTRE_ACOES * 2);

  log(`➡️ Visitando: @${nome}`);

  const btnSeguir = [...document.querySelectorAll('button')].find(b => b.innerText.toLowerCase() === 'seguir');
  if (btnSeguir) {
    btnSeguir.click();
    await esperar(4000); // aumenta o tempo de resposta
    let tentativas = 0;
    let txt = btnSeguir.innerText.toLowerCase();

 while (
  !txt.includes('seguindo') &&
  !txt.includes('solicitado') &&
  !txt.includes('following') &&
  !txt.includes('requested') &&
  tentativas < 6
) {
  await esperar(1000);
  txt = btnSeguir.innerText.toLowerCase();
  tentativas++;
}

    if (txt.includes('seguindo') || txt.includes('solicitado') || txt.includes('following') || txt.includes('requested')) {
      registrarSucessoSeguir();
    } else {
      registrarFalhaSeguir();
    }
  }

  await esperar(TEMPO_ESPERA_ENTRE_ACOES);
  await scrollProfile();
  const curtidas = await curtirFotos();
  log(`❤️ @${nome}: curtiu ${curtidas} foto(s)`);

  history.back();
  await esperar(TEMPO_ESPERA_ENTRE_ACOES * 2);
  return true;
}

async function iniciar() {
  if (!horaInicio) {
    horaInicio = new Date();
    contaAlvo = location.pathname.split('/')[1] || 'desconhecido';
  }
  criarPainel();

  const modal = document.querySelector('div[role="dialog"]');
  if (!modal) return log('⚠️ Modal de seguidores não encontrado');

  let processados = 0;
  while (!parar && processados < config.maxPerfis) {
    const botoesSeguir = [...modal.querySelectorAll('button')].filter(btn => btn.innerText.toLowerCase() === 'seguir');

    if (botoesSeguir.length === 0) {
      log('⚠️ Nenhum novo perfil visível. Scrollando...');
      await scrollModal(modal);
      continue;
    }

    let perfilProcessado = false;
    for (const botao of botoesSeguir) {
      perfilProcessado = await processarPerfil(botao);
      if (perfilProcessado) break;
    }

    processados++;
    const delay = delayAleatorio(config.minDelay, config.maxDelay);
    log(`⏳ Aguardando ${(delay / 1000).toFixed(0)}s para o próximo...`);
    await esperar(delay);
  }
  log('✅ Fim da automação');
  encerrarAutomacao();
}

chrome.runtime.onMessage.addListener((request) => {
  if (request.type === 'config') {
    config.maxPerfis = Number(request.data.maxPerfis) || DEFAULT_CONFIG.maxPerfis;
    config.maxCurtidas = Math.min(Number(request.data.maxCurtidas), MAX_CURTIDAS);
    config.minDelay = (Number(request.data.minDelay) || MIN_DELAY / 1000) * 1000;
    config.maxDelay = (Number(request.data.maxDelay) || MAX_DELAY / 1000) * 1000;
    if (!iniciado) {
      iniciado = true;
      iniciar();
    }
  }
});
