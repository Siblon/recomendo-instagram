// === CONFIGURAÇÕES DO USUÁRIO ===
let MIN_DELAY = 30000; // 30 segundos
let MAX_DELAY = 300000; // 5 minutos
const DELAY_CURTIDA = 3000; // Delay entre curtidas
const TEMPO_ESPERA_ENTRE_ACOES = 7000; // Delay entre seguir e curtir, etc.
let MAX_CURTIDAS = 4; // Configurável entre 0 e 4

let MAX_PERFIS = Infinity; // Número máximo de perfis a seguir
// === VARIÁVEIS ===
let parar = false;
const logBox = document.createElement('div');
const perfisSeguidos = new Set();

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
  btn.style = `position: fixed; bottom: 10px; left: 10px; background: red; color: white; border: none; padding: 10px; z-index: 9999; font-weight: bold;`;
  btn.onclick = () => parar = true;
  document.body.appendChild(btn);
}

function log(msg) {
  const tempo = new Date().toLocaleTimeString();
  logBox.innerHTML += `\n[${tempo}] ${msg}`;
  logBox.scrollTop = logBox.scrollHeight;
}

// === FUNÇÕES ===
async function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function esperarComContador(ms) {
  let restante = Math.ceil(ms / 1000);
  while (restante > 0 && !parar) {
    log(`⏳ Próxima ação em: ${restante}s`);
    await esperar(1000);
    restante--;
  }
}

function delayAleatorio(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function clicarBotaoSeguir(botao) {
  if (!botao || botao.innerText.toLowerCase() !== 'seguir') return false;
  botao.click();
  log('👤 Seguiu perfil');
  return true;
}

async function curtirFotos() {
  const links = [...document.querySelectorAll('article a')].filter(a => a.href.includes('/p/'));
  const fotosCurtidas = Math.min(links.length, Math.floor(Math.random() * (MAX_CURTIDAS + 1)));
  for (let i = 0; i < fotosCurtidas; i++) {
    if (parar) return 0;
    links[i].click();
    await esperar(TEMPO_ESPERA_ENTRE_ACOES);
    const botaoLike = document.querySelector('svg[aria-label="Curtir"], svg[aria-label="Like"]');
    if (botaoLike && botaoLike.closest('button')) {
      botaoLike.closest('button').click();
      log('❤️ Curtiu 1 foto');
    }
    const botaoFechar = document.querySelector('svg[aria-label="Fechar"]');
    if (botaoFechar && botaoFechar.closest('button')) {
      botaoFechar.closest('button').click();
    }
    await esperar(DELAY_CURTIDA);
  }
  return fotosCurtidas;
}

async function voltarParaModal() {
  history.back();
  await esperar(TEMPO_ESPERA_ENTRE_ACOES * 2);
  log('⬅️ Voltou para lista de seguidores');
}

async function processarPerfil(botao) {
  if (parar) return;

  const item = botao.closest('div[role="dialog"] li');
  let nomePerfil = item
    ?.querySelector('a')
    ?.getAttribute('href')
    ?.split('/')?.[3];

  if (perfisSeguidos.has(nomePerfil)) {
    log(`⚠️ Perfil já processado: ${nomePerfil}`);
    return;
  }

  perfisSeguidos.add(nomePerfil);

  botao.click();
  await esperar(TEMPO_ESPERA_ENTRE_ACOES * 2);

  nomePerfil = document.querySelector('h2, header a')?.innerText || nomePerfil;
  if (nomePerfil) {
    log(`➡️ Visitando: ${nomePerfil}`);
  } else {
    log('⚠️ Nome do perfil não encontrado');
  }

  const seguirBtn = [...document.querySelectorAll('button')].find(btn => btn.innerText.toLowerCase() === 'seguir');
  await clicarBotaoSeguir(seguirBtn);

  await esperar(TEMPO_ESPERA_ENTRE_ACOES);
  const curtidas = await curtirFotos();
  log(`❤️ ${nomePerfil}: curtiu ${curtidas} foto(s)`);

  await voltarParaModal();
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
    await processarPerfil(botao);
    count++;
    await esperarComContador(delay);
  }
  log('✅ Fim da automação');
}

chrome.runtime.onMessage.addListener((request) => {
  if (request.type === 'config') {
    MAX_PERFIS = request.data.maxPerfis;
    MAX_CURTIDAS = request.data.maxCurtidas;
    MIN_DELAY = request.data.minDelay * 1000;
    MAX_DELAY = request.data.maxDelay * 1000;
    iniciar();
  }
});
