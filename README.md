# Recomendo Instagram

This repository contains a small Chrome extension used for automating interactions on Instagram. The extension injects a script that follows profiles and likes photos from the followers modal. The follow detection logic recognizes buttons containing "Seguir" or "Follow" to adapt to minor UI changes.

## Usage

1. Load the `recomendo-instagram` directory as an unpacked extension in Chrome.
2. Open Instagram and click the extension icon.
3. Navegue até o perfil desejado e clique em **seguidores** (ou **seguindo**) para abrir o modal de listas.
4. Com o modal de seguidores visível, clique em **Iniciar Bot** na popup. O script será injetado e iniciará automaticamente.

Logs são enviados para o console da página para acompanhar o progresso.

When visiting a profile the bot now scrolls the page a few times before liking
posts. This ensures that enough posts are loaded in cases where Instagram uses
lazy loading.

After each visit the script tries multiple times to return to the followers
modal, reducing failures when the page navigation lags.

The bot processes follow buttons sequentially from top to bottom and only
scrolls the followers list when necessary. After each scroll it now waits a few
seconds longer so the next batch of users loads properly before continuing.
Profile links are extracted by scanning each list item from top to bottom,
garantindo que o perfil correto seja aberto.

The popup menu received a small visual overhaul. Logs são enviados para o
`background.js` e podem ser visualizados pelo console do navegador.

Use responsibly and at your own risk.
