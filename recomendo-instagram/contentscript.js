// === Painel Recomendo Instagram (Versão Corrigida e Robusta) === //

(function () {
  if (document.getElementById("recomendoPainel")) return;

  let stopBot = false;
  let isRunning = false;

  const style = document.createElement("style");
  style.textContent = `
    #recomendoPainel {
      position: fixed; top: 50px; right: 20px;
      background: #111; color: #fff; padding: 15px;
      border-radius: 12px; box-shadow: 0 0 15px rgba(0,0,0,0.5);
      font-family: sans-serif; font-size: 14px;
      z-index: 999999; width: 260px;
    }
    #recomendoPainel input {
      width: 100%; margin-bottom: 8px;
      padding: 6px; border: none; border-radius: 6px;
    }
    #recomendoPainel button {
      width: 48%; padding: 8px;
      border: none; border-radius: 6px;
      font-weight: bold; cursor: pointer;
    }
    #iniciarBtn { background: #008cff; color: white; }
    #pararBtn { background: red; color: white; float: right; }
    #logPainel {
      background: #000; color: #0f0; padding: 8px;
      margin-top: 10px; height: 150px;
      overflow-y: auto; font-family: monospace;
      font-size: 12px; border-radius: 6px;
    }
  `;
  document.head.appendChild(style);

  const painel = document.createElement("div");
  painel.id = "recomendoPainel";
  painel.innerHTML = `
    <h4>Recomendo Instagram</h4>
    <label>Nº máx. de perfis:</label>
    <input id="maxPerfis" type="number" value="10" />
    <label>Qtd. de fotos para curtir (0-4):</label>
    <input id="fotosCurtir" type="number" value="1" />
    <label>Delay mínimo (s):</label>
    <input id="delayMin" type="number" value="30" />
    <label>Delay máximo (s):</label>
    <input id="delayMax" type="number" value="60" />
    <div style="display:flex; justify-content:space-between;">
      <button id="iniciarBtn">Iniciar Bot</button>
      <button id="pararBtn">Parar</button>
    </div>
    <div id="logPainel"></div>
  `;
  document.body.appendChild(painel);

  const log = (msg, cor = '#0f0') => {
    const logEl = document.getElementById("logPainel");
    const time = new Date().toLocaleTimeString();
    logEl.innerHTML += `<div style="color:${cor}">[${time}] ${msg}</div>`;
    logEl.scrollTop = logEl.scrollHeight;
  };

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const waitFor = (cond, timeout = 10000) =>
    new Promise(resolve => {
      const start = Date.now();
      const t = setInterval(() => {
        if (cond()) {
          clearInterval(t);
          resolve(true);
        } else if (Date.now() - start > timeout) {
          clearInterval(t);
          resolve(false);
        }
      }, 300);
    });

  async function curtirFotos(qtd) {
    for (let i = 0; i < qtd; i++) {
      const posts = document.querySelectorAll('article a[href*="/p/"]');
      if (i >= posts.length) break;
      posts[i].scrollIntoView();
      posts[i].click();
      await waitFor(() => document.querySelector('svg[aria-label="Curtir"], svg[aria-label="Like"], svg[aria-label="Descurtir"], svg[aria-label="Unlike"]'));
      const likeSvg = document.querySelector('svg[aria-label="Curtir"], svg[aria-label="Like"]');
      if (likeSvg) likeSvg.parentElement.click();
      const fechar = document.querySelector('svg[aria-label="Fechar"], svg[aria-label="Close"]');
      if (fechar) fechar.parentElement.click();
      await delay(800);
    }
  }

  async function startBot() {
    if (isRunning) return;
    isRunning = true;
    stopBot = false;

    const max = parseInt(document.getElementById("maxPerfis").value);
    const fotos = parseInt(document.getElementById("fotosCurtir").value);
    const delayMin = parseInt(document.getElementById("delayMin").value) * 1000;
    const delayMax = parseInt(document.getElementById("delayMax").value) * 1000;

    log("Iniciando automação...");

    const getScrollContainer = () => {
      const dialog = document.querySelector('div[role="dialog"]');
      if (!dialog) return null;
      return dialog.querySelector("div[style*='max-height'] ul");
    };

    const processed = new Set();

    while (processed.size < max) {
      if (stopBot) break;

      const listaEl = getScrollContainer();
      if (!listaEl) {
        log("⚠️ Modal de seguidores não encontrado.", "orange");
        break;
      }

      const itens = [...listaEl.querySelectorAll('li')];

      let item = itens.find(li => {
        const btn = li.querySelector('button');
        const a = li.querySelector('a[href^="/"]');
        return btn && /seguir|follow/i.test(btn.innerText.trim()) && a && !processed.has(a.href);
      });

      if (!item) {
        listaEl.scrollBy(0, 300);
        await delay(1500);
        continue;
      }

      const link = item.querySelector('a[href^="/"]');
      const nome = link.getAttribute('href').replace(/\//g, "");
      processed.add(link.href);
      log(`Visitando: @${nome}`);
      link.click();

      await waitFor(() => !document.querySelector('div[role="dialog"]'));
      await delay(2000);

      if (fotos > 0) {
        await curtirFotos(fotos);
      }

      const seguirBtn = [...document.querySelectorAll('button')]
        .find(b => /^(seguir|follow)$/i.test(b.innerText.trim()));
      if (seguirBtn) seguirBtn.click();

      window.history.back();
      const voltou = await waitFor(() => document.querySelector('div[role="dialog"]'), 10000);
      if (!voltou) {
        log("⚠️ Não voltou para o modal.", "orange");
        break;
      }

      const novaLista = getScrollContainer();
      if (novaLista) novaLista.scrollBy(0, 200);

      const espera = Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin;
      log(`⏳ Aguardando ${Math.floor(espera / 1000)}s para o próximo...`);
      await delay(espera);
    }

    log("✅ Finalizado ou interrompido.");
    isRunning = false;
  }

  document.getElementById("iniciarBtn").onclick = () => {
    stopBot = false;
    startBot();
  };

  document.getElementById("pararBtn").onclick = () => {
    stopBot = true;
    log("⛔ Automação interrompida.", "orange");
  };
})();
