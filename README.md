# Recomendo Instagram

This repository contains a small Chrome extension used for automating interactions on Instagram. The extension injects a script that follows profiles and likes photos from the followers modal. The follow detection logic recognizes buttons containing "Seguir" or "Follow" to adapt to minor UI changes.

## Usage

1. Load the `recomendo-instagram` directory as an unpacked extension in Chrome.
2. Open Instagram and click the extension icon.
3. Navegue até o perfil desejado e clique em **seguidores** (ou **seguindo**) para abrir o modal de listas.
4. Com o modal de seguidores visível, clique em **Iniciar Bot** na popup para iniciar a automação.

The extension logs actions directly on the page and provides a button to stop the automation at any time.

When visiting a profile the bot now scrolls the page a few times before liking
posts. This ensures that enough posts are loaded in cases where Instagram uses
lazy loading.

After each visit the script tries multiple times to return to the followers
modal, reducing failures when the page navigation lags.

The popup menu received a small visual overhaul and the in-page log panel now
colorizes messages. Logs are also forwarded to the extension background for easy
viewing in the browser console.

Use responsibly and at your own risk.
