// === CONFIGURAÇÕES DO USUÁRIO ===
let MIN_DELAY = 30000; // 30 segundos
let MAX_DELAY = 300000; // 5 minutos
const DELAY_CURTIDA = 3000; // Delay entre curtidas
const TEMPO_ESPERA_ENTRE_ACOES = 7000; // Delay entre seguir e curtir, etc.
let MAX_CURTIDAS = 4; // Configurável entre 0 e 4

let MAX_PERFIS = Infinity; // Número máximo de perfis a seguir
// === VARIÁVEIS ===
let parar = false;
if (window.recomendoBotRunning) {
  console.warn('Bot já em execução');
}
const logBox = document.createElement('div');
  const logMessages = document.createElement('div');
  const contadorEl = document.createElement('div');
  const progressoEl = document.createElement('div');
const perfisSeguidos = new Set();
let perfisSeguidosCount = 0;

// === INTERFACE ===

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
    width: 300px;
    overflow: hidden;
    z-index: 9999;
  `;
  logMessages.style = 'max-height: 160px; overflow-y: auto; white-space: pre-wrap;';
  contadorEl.style = 'margin-top:4px; font-weight:bold;';
  progressoEl.id = 'progresso';
  progressoEl.style = `
    position: fixed;
    top: 10px;
    left: 10px;
    background: #000;
    color: lime;
    font-family: monospace;
    font-size: 12px;
    font-weight: bold;
    padding: 5px;
    z-index: 999999;
  `;
  logBox.appendChild(logMessages);
  logBox.appendChild(contadorEl);
  document.body.appendChild(logBox);
  document.body.appendChild(progressoEl);
  log('✅ Iniciando automação...');
  atualizarProgresso();
  addBotaoParar();
}

function addBotaoParar() {
  const btn = document.createElement('button');
  btn.innerText = 'PARAR';
  btn.style = `position: fixed; bottom: 10px; left: 10px; background: red; color: white; border: none; padding: 10px; z-index: 9999; font-weight: bold;`;
  btn.onclick = () => parar = true;
  document.body.appendChild(btn);
}

function log(msg) {
  const tempo = new Date().toLocaleTimeString();
  const entry = document.createElement('div');
  entry.textContent = `[${tempo}] ${msg}`;
  logMessages.appendChild(entry);
  if (logMessages.childElementCount > 100) {
    logMessages.removeChild(logMessages.firstChild);
  }
  logBox.scrollTop = logBox.scrollHeight;
}

// === FUNÇÕES ===
async function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let contadorAtivo = false;
function atualizarContador(seg) {
  contadorEl.textContent = seg > 0 ? `⏳ Próxima ação em: ${seg}s` : '';
}

function atualizarProgresso() {
  progressoEl.textContent = `Progresso: ${perfisSeguidosCount}/${MAX_PERFIS}`;
}

async function esperarComContador(segundos) {
  if (contadorAtivo || parar) return;
  contadorAtivo = true;
  for (let i = segundos; i > 0; i--) {
    if (parar) break;
    atualizarContador(i);
    await esperar(1000);
  }
  atualizarContador(0);
  contadorAtivo = false;
}

function delayAleatorio(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function esperarElemento(selector, timeout = 10000, intervalo = 500) {
  const inicio = Date.now();
  while (Date.now() - inicio < timeout) {
    const el = document.querySelector(selector);
    if (el) return el;
    await esperar(intervalo);
  }
  return null;
}

async function clicarBotaoSeguir(botao) {
  if (!botao || botao.innerText.trim() !== 'Seguir') return false;
  botao.click();
  await esperar(3000);
  if (botao.innerText.trim() === 'Seguir' || botao.innerText.trim() === 'Solicitado') {
    return false;
  }
  log('✅ Seguiu perfil');
  return true;
}

async function curtirFotos(qtd) {
  try {
    // Scroll forçado para carregar as fotos
    window.scrollTo({ top: 500, behavior: 'smooth' });
    await new Promise(resolve => setTimeout(resolve, 1000));
    window.scrollTo({ top: 1000, behavior: 'smooth' });
    await new Promise(resolve => setTimeout(resolve, 2000));

    const botoesLike = document.querySelectorAll('article svg[aria-label="Curtir"], article svg[aria-label="Like"]');
    let count = 0;

    for (const btn of botoesLike) {
      if (count >= qtd) break;
      btn.parentElement?.click();
      count++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`❤️ Curtiu ${count} foto(s)`);
  } catch (e) {
    console.warn("❌ Erro ao tentar curtir fotos", e);
  }
}

async function scrollModal() {
  const modal = document.querySelector('div[role="dialog"] .isgrP') ||
                document.querySelector('div[role="dialog"]');
  if (modal) {
    modal.scrollBy({ top: 200, behavior: 'smooth' });
    await esperar(500);
  }
}

async function voltarParaModal() {
  history.back();
  let modal = await esperarElemento('div[role="dialog"]', TEMPO_ESPERA_ENTRE_ACOES * 4);

  if (!modal) {
    const seguidoresBtn = await esperarElemento('a[href$="/followers/"], a[href$="/followers"]', TEMPO_ESPERA_ENTRE_ACOES * 2);
    if (seguidoresBtn) {
      seguidoresBtn.click();
      modal = await esperarElemento('div[role="dialog"]', TEMPO_ESPERA_ENTRE_ACOES * 4);
    }
  }

  if (modal) {
    await scrollModal();
  }

  log('⬅️ Voltou para lista de seguidores');
}

async function processarPerfil(botao) {
  if (parar) return false;

  const item = botao.closest('div[role="dialog"] li');
  let nomePerfil = item?.querySelector('a')?.getAttribute('href')?.split('/')?.[1];

  if (perfisSeguidos.has(nomePerfil)) {
    log(`⚠️ Perfil já processado: ${nomePerfil}`);
    await scrollModal();
    return false;
  }

  botao.click();
  await esperar(TEMPO_ESPERA_ENTRE_ACOES * 2);

  nomePerfil = document.querySelector('header a, h2')?.innerText || nomePerfil || 'desconhecido';
  if (perfisSeguidos.has(nomePerfil)) {
    log(`⚠️ Perfil já processado: ${nomePerfil}`);
    await voltarParaModal();
    return false;
  }

  perfisSeguidos.add(nomePerfil);

  if (nomePerfil === 'desconhecido') {
    log('⚠️ Nome do perfil não encontrado');
  }
  log(`🔍 Visitando: ${nomePerfil}`);

  await esperar(2000);
  const botaoSeguir = Array.from(document.querySelectorAll('button'))
    .find(btn => btn.innerText.trim() === 'Seguir');

  if (!botaoSeguir) {
    console.warn("⚠️ Nenhum botão 'Seguir' encontrado. Pulando perfil.");
    log("⚠️ Nenhum botão 'Seguir' encontrado. Pulando perfil.");
    await scrollModal();
    return false;
  }

  const seguiu = await clicarBotaoSeguir(botaoSeguir);

  if (seguiu) {
    perfisSeguidosCount++;
    atualizarProgresso();
  }

  await esperar(TEMPO_ESPERA_ENTRE_ACOES);
  await curtirFotos(MAX_CURTIDAS);

  await voltarParaModal();
  return seguiu;
}

async function iniciar() {
  criarPainel();
  const modal = document.querySelector('div[role="dialog"]');

  if (!modal) return log('⚠️ Modal de seguidores não encontrado');

  const botoes = [...modal.querySelectorAll('button')].filter(btn => btn.innerText.toLowerCase() === 'seguir');
  let count = 0;
  for (const botao of botoes) {
    if (parar || count >= MAX_PERFIS) break;
    const delay = delayAleatorio(MIN_DELAY, MAX_DELAY);
    const seguiu = await processarPerfil(botao);
    if (seguiu) count++;
    await esperarComContador(Math.ceil(delay / 1000));
  }
  log('✅ Fim da automação');
}

chrome.runtime.onMessage.addListener((request) => {
  if (request.type === 'config') {
    if (window.recomendoBotRunning) return;
    parar = false;
    contadorAtivo = false;
    MAX_PERFIS = request.data.maxPerfis;
    MAX_CURTIDAS = request.data.maxCurtidas;
    MIN_DELAY = request.data.minDelay * 1000;
    MAX_DELAY = request.data.maxDelay * 1000;
    perfisSeguidosCount = 0;
    atualizarProgresso();
    window.recomendoBotRunning = true;
    iniciar().finally(() => {
      window.recomendoBotRunning = false;
    });
  }
});
