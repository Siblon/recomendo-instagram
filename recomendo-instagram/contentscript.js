// === Painel Recomendo Instagram (Versão Única, Robusta e Modular) === //

(function () {
  // Evita duplicar o painel
  if (document.getElementById("recomendoPainel")) return;

  // Variáveis de controle
  let stopBot = false;
  let isRunning = false;

  // === Estilo do painel === //
  const style = document.createElement("style");
  style.textContent = `
    #recomendoPainel {
      position: fixed;
      top: 50px;
      right: 20px;
      background: #111;
      color: #fff;
      padding: 15px;
      border-radius: 12px;
      box-shadow: 0 0 15px rgba(0,0,0,0.5);
      font-family: sans-serif;
      font-size: 14px;
      z-index: 999999;
      width: 260px;
    }
    #recomendoPainel input {
      width: 100%;
      margin-bottom: 8px;
      padding: 6px;
      border: none;
      border-radius: 6px;
    }
    #recomendoPainel button {
      width: 48%;
      padding: 8px;
      border: none;
      border-radius: 6px;
      font-weight: bold;
      cursor: pointer;
    }
    #iniciarBtn { background: #008cff; color: white; }
    #pararBtn { background: red; color: white; float: right; }
    #logPainel {
      background: #000;
      color: #0f0;
      padding: 8px;
      margin-top: 10px;
      height: 150px;
      overflow-y: auto;
      font-family: monospace;
      font-size: 12px;
      border-radius: 6px;
    }
  `;
  document.head.appendChild(style);

  // === Painel === //
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

  // === Função principal da automação === //
  async function startBot() {
    if (isRunning) return;
    isRunning = true;
    stopBot = false;

    const max = parseInt(document.getElementById("maxPerfis").value);
    const fotos = parseInt(document.getElementById("fotosCurtir").value);
    const delayMin = parseInt(document.getElementById("delayMin").value) * 1000;
    const delayMax = parseInt(document.getElementById("delayMax").value) * 1000;

    log("Iniciando automação...");

    let perfis = [...document.querySelectorAll("button")].filter(btn => btn.innerText.toLowerCase() === "seguir");

    for (let i = 0; i < Math.min(max, perfis.length); i++) {
      if (stopBot) break;

      let btn = perfis[i];
      let nome = btn.closest("li")?.innerText?.split("\n")[0] || `Perfil ${i + 1}`;
      log(`Seguindo: ${nome}`);

      btn.click();

      // Curte fotos se quiser (placeholder, implementar depois)
      if (fotos > 0) {
        log(`▶️ Curtindo ${fotos} fotos (em breve)`);
        // Aqui pode-se abrir o perfil e curtir N fotos
      }

      let espera = Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin;
      log(`⏳ Aguardando ${Math.floor(espera / 1000)}s para o próximo...`);
      await delay(espera);
    }

    log("✅ Finalizado ou interrompido.");
    isRunning = false;
  }

  // === Botões === //
  document.getElementById("iniciarBtn").onclick = () => {
    stopBot = false;
    startBot();
  };

  document.getElementById("pararBtn").onclick = () => {
    stopBot = true;
    log("⛔ Automação interrompida.", 'orange');
  };
})();
