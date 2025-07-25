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

let contadorAtivo = false;
async function esperarComContador(segundos) {
  if (contadorAtivo) return;
  contadorAtivo = true;
  for (let i = segundos; i > 0; i--) {
    if (parar) break;
    log(`⏳ Próxima ação em: ${i}s`);
    await new Promise(r => setTimeout(r, 1000));
  }
  contadorAtivo = false;
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
  await esperar(2000);
  const links = [...document.querySelectorAll('article a')].filter(a => a.href.includes('/p/'));
  if (!links.length) {
    log('⚠️ Nenhuma foto encontrada para curtir neste perfil.');
    return 0;
  }

  let fotosCurtidas = Math.floor(Math.random() * (MAX_CURTIDAS + 1));
  if (MAX_CURTIDAS > 0 && fotosCurtidas === 0) fotosCurtidas = 1;
  fotosCurtidas = Math.min(links.length, fotosCurtidas);
  let curtidasRealizadas = 0;
  for (let i = 0; i < fotosCurtidas; i++) {
    if (parar) return curtidasRealizadas;
    try {
      links[i].click();
      await esperar(TEMPO_ESPERA_ENTRE_ACOES);
      const botoesLike = document.querySelectorAll('article svg[aria-label="Curtir"], article svg[aria-label="Like"]');
      await esperar(500);
      if (botoesLike.length && botoesLike[0].closest('button')) {
        botoesLike[0].closest('button').click();
        curtidasRealizadas++;
        log('❤️ Curtiu 1 foto');
      } else {
        log('⚠️ Botão curtir não encontrado');
      }
      const botaoFechar = document.querySelector('svg[aria-label="Fechar"]');
      if (botaoFechar && botaoFechar.closest('button')) {
        botaoFechar.closest('button').click();
      }
      await esperar(DELAY_CURTIDA);
    } catch (e) {
      log('❌ Erro ao curtir foto');
    }
  }
  return curtidasRealizadas;
}

async function voltarParaModal() {
  history.back();
  await esperar(TEMPO_ESPERA_ENTRE_ACOES * 2);
  log('⬅️ Voltou para lista de seguidores');
}

async function processarPerfil(botao) {
  if (parar) return false;

  const item = botao.closest('div[role="dialog"] li');
  let nomePerfil = item
    ?.querySelector('a')
    ?.getAttribute('href')
    ?.split('/')?.[3];

  if (perfisSeguidos.has(nomePerfil)) {
    log(`⚠️ Perfil já processado: ${nomePerfil}`);
    return false;
  }

  perfisSeguidos.add(nomePerfil);

  botao.click();
  await esperar(TEMPO_ESPERA_ENTRE_ACOES * 2);

  nomePerfil = document.querySelector('header a, h2')?.innerText || 'desconhecido';
  if (nomePerfil === 'desconhecido') {
    log('⚠️ Nome do perfil não encontrado');
  }
  log(`🔍 Visitando: ${nomePerfil}`);

  await esperar(2000);
  const seguirBtn = Array.from(document.querySelectorAll('button')).find(btn => btn.innerText === 'Seguir');
  if (!seguirBtn) {
    log("⚠️ Nenhum botão 'Seguir' encontrado. Pulando perfil.");
    await voltarParaModal();
    return false;
  }

  const seguiu = await clicarBotaoSeguir(seguirBtn);

  await esperar(TEMPO_ESPERA_ENTRE_ACOES);
  const curtidas = await curtirFotos();
  log(`❤️ Curtiu ${curtidas} foto(s)`);

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
    window.recomendoBotRunning = true;
    iniciar().finally(() => {
      window.recomendoBotRunning = false;
    });
  }
});
