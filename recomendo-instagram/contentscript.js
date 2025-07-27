// === Painel Recomendo Instagram (Versão Atualizada - Modal Only) === //
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
    #recomendoPainel input, #recomendoPainel button {
      width: 100%; margin-bottom: 8px; padding: 6px;
      border: none; border-radius: 6px;
    }
    #iniciarBtn { background: #008cff; color: white; }
    #pararBtn { background: red; color: white; }
    #logPainel {
      background: #000; color: #0f0; padding: 8px;
      height: 150px; overflow-y: auto; font-family: monospace;
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
    <input id="fotosCurtir" type="number" value="0" />
    <label>Delay mínimo (s):</label>
    <input id="delayMin" type="number" value="30" />
    <label>Delay máximo (s):</label>
    <input id="delayMax" type="number" value="60" />
    <button id="iniciarBtn">Iniciar Bot</button>
    <button id="pararBtn">Parar</button>
    <div id="logPainel"></div>
  `;
  document.body.appendChild(painel);

  const log = (msg, cor = '#0f0') => {
    const el = document.getElementById("logPainel");
    const hora = new Date().toLocaleTimeString();
    el.innerHTML += `<div style="color:${cor}">[${hora}] ${msg}</div>`;
    el.scrollTop = el.scrollHeight;
  };

  const delay = (ms) => new Promise(r => setTimeout(r, ms));

  const getScrollContainer = () => {
    const dialog = document.querySelector('div[role="dialog"]');
    if (!dialog) return null;
    return dialog.querySelector('ul')?.parentElement;
  };

  const startBot = async () => {
    if (isRunning) return;
    isRunning = true;
    stopBot = false;

    const maxPerfis = +document.getElementById("maxPerfis").value;
    const delayMin = +document.getElementById("delayMin").value * 1000;
    const delayMax = +document.getElementById("delayMax").value * 1000;

    log("Iniciando automação...");

    const container = getScrollContainer();
    if (!container) {
      log("⚠️ Modal de seguidores não encontrado.", "orange");
      return;
    }

    let seguidos = 0;
    const visitados = new Set();

    while (seguidos < maxPerfis && !stopBot) {
      const botoes = [...container.querySelectorAll("li")];
      let encontrou = false;

      for (let li of botoes) {
        if (stopBot) break;

        const btn = li.querySelector("button");
        const nome = li.querySelector("a")?.innerText?.trim() || "Usuário";

        if (!btn || visitados.has(nome) || !/seguir|follow/i.test(btn.innerText)) continue;

        visitados.add(nome);
        log(`👤 Seguindo ${nome}...`);
        btn.click();
        seguidos++;
        encontrou = true;

        const espera = Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin;
        log(`⏳ Aguardando ${Math.floor(espera / 1000)}s...`);
        await delay(espera);
        break;
      }

      if (!encontrou) {
        container.scrollBy(0, 400);
        await delay(1500);
      }
    }

    log("✅ Finalizado.");
    isRunning = false;
  };

  document.getElementById("iniciarBtn").onclick = () => {
    stopBot = false;
    startBot();
  };

  document.getElementById("pararBtn").onclick = () => {
    stopBot = true;
    log("⛔ Automação interrompida.", "orange");
  };
})();
