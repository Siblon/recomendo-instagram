// === CONFIGURAÇÕES DO USUÁRIO ===
const MIN_DELAY = 30000; // 30 segundos
const MAX_DELAY = 300000; // 5 minutos
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
let horaInicio = null;
let horaBloqueio = null;
let horaFim = null;
let totalSeguidos = 0;
let contaAlvo = '';

// === INTERFACE E LOG ===
function criarPainel() {
  logBox.style = `position: fixed; bottom: 10px; right: 10px; background: #000; color: lime; font-family: monospace; font-size: 13px; padding: 10px; max-height: 200px; width: 240px; overflow-y: auto; z-index: 9999; box-shadow: 0 0 6px rgba(0,0,0,0.5);`;
  document.body.appendChild(logBox);
  log('✅ Iniciando automação...');
  const btn = document.createElement('button');
  btn.innerText = 'PARAR';
  btn.style = `position: fixed; bottom: 10px; left: 10px; background: red; color: white; border: none; padding: 10px; z-index: 9999; font-weight: bold;`;
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

function esperar(ms) { return new Promise(r => setTimeout(r, ms)); }
function delayAleatorio(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

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
  log(`⚠️ Limitação detectada em ${horaBloqueio.toLocaleTimeString()}`);
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

async function scrollModal(modal) {
  const container = modal.querySelector('[style*="overflow"]') || modal;
  container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  await esperar(delayAleatorio(1000, 2000));
}

async function scrollProfile() {
  for (let i = 0; i < 10; i++) {
    if ([...document.querySelectorAll('article a[href*="/p/"]')].length >= config.maxCurtidas) break;
    window.scrollBy(0, 400);
    await esperar(delayAleatorio(1000, 2000));
  }
}

async function curtirFotos() {
  const maxCurtidas = Math.floor(Math.random() * (config.maxCurtidas + 1));
  await esperar(delayAleatorio(3000, 5000));
  let posts = [...document.querySelectorAll('article a[href*="/p/"]')];
  if (!posts.length) {
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
      for (let i = 0; i < 10; i++) {
        const likeSvg = document.querySelector('svg[aria-label="Curtir"]');
        if (likeSvg) {
          likeSvg.closest('button')?.click();
          log(`❤️ ${post.href}`);
          curtidas++;
          break;
        }
        await esperar(500);
      }
      document.querySelector('[aria-label="Fechar"]')?.click();
      await esperar(DELAY_CURTIDA);
    } catch (_) { log('⚠️ Erro ao curtir'); }
  }
  return curtidas;
}

async function processarPerfil(botao) {
  const item = botao.closest('li') || botao.closest('div');
  const link = item?.querySelector('a');
  const nome = link?.href.split('/')[3];
  if (!nome || perfisSeguidos.has(nome)) return false;
  perfisSeguidos.add(nome);
  link.click();
  await esperar(TEMPO_ESPERA_ENTRE_ACOES * 2);
  log(`➡️ Visitando: @${nome}`);
  const btnSeguir = [...document.querySelectorAll('button')].find(b => /seguir|follow/i.test(b.innerText));
  if (btnSeguir) {
    btnSeguir.click();
    await esperar(4000);
    let txt = btnSeguir.innerText.toLowerCase();
    for (let i = 0; i < 6 && !/seguindo|solicitado|following|requested/.test(txt); i++) {
      await esperar(1000);
      txt = btnSeguir.innerText.toLowerCase();
    }
    /seguindo|solicitado|following|requested/.test(txt) ? registrarSucessoSeguir() : registrarFalhaSeguir();
  } else registrarFalhaSeguir();
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
    const botoes = [...modal.querySelectorAll('button')].filter(btn => /seguir|follow/i.test(btn.innerText));
    if (!botoes.length) {
      log('⚠️ Nenhum perfil novo. Scrollando...');
      await scrollModal(modal);
      continue;
    }
    for (const botao of botoes) {
      const ok = await processarPerfil(botao);
      if (ok) break;
    }
    processados++;
    const delay = delayAleatorio(config.minDelay, config.maxDelay);
    log(`⏳ Aguardando ${(delay / 1000).toFixed(0)}s para o próximo...`);
    await esperar(delay);
  }
  log('✅ Fim da automação');
  encerrarAutomacao();
}

chrome.runtime.onMessage.addListener((req) => {
  if (req.type === 'config') {
    config.maxPerfis = Number(req.data.maxPerfis) || DEFAULT_CONFIG.maxPerfis;
    config.maxCurtidas = Math.min(Number(req.data.maxCurtidas), MAX_CURTIDAS);
    config.minDelay = (Number(req.data.minDelay) || MIN_DELAY / 1000) * 1000;
    config.maxDelay = (Number(req.data.maxDelay) || MAX_DELAY / 1000) * 1000;
    if (!iniciado) {
      iniciado = true;
      iniciar();
    }
  }
});
