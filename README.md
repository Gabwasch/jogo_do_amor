# O Resgate Romântico 🕹️💚

Platformer 2D em **Kaboom.js** com tema hacker/placa-mãe. A heroína **Ellen** entra
na placa-mãe pra resgatar o namorado sequestrado por um vírus: colete 3 **Bits**,
desvie dos vírus e chegue no portal.

- `index.html` — carrega o Kaboom e o `game.js`
- `game.js` — toda a lógica e as cenas (intro → prologo → game → gameover/vitoria)
- `style.css` — centraliza o canvas na tela
- `*.png` — sprites (heroína, vírus, moeda, portal, plataforma)

---

## 1. Rodar localmente (teste rápido)

Os navegadores bloqueiam o carregamento de imagens quando você abre o `index.html`
com duplo-clique (`file://`). Suba um servidor local simples:

```bash
# dentro da pasta do jogo, escolha UM:
python -m http.server 8000
# ou, se tiver Node:
npx serve
```

Depois abra `http://localhost:8000` no navegador. Com `ASSETS_URL = ""` (padrão),
ele pega os PNGs da própria pasta.

---

## 2. Por que os PNGs precisam de um host

O **"Build" do Google AI Studio gera código, mas não hospeda arquivos `.png`**.
Se você só colar o `game.js` lá, o jogo roda **sem as imagens** (erros 404).

A solução é hospedar as imagens em algum lugar público e apontar o jogo pra lá.
O jeito mais simples e gratuito é o **GitHub Pages**. O código já está preparado:
existe uma constante no topo do `game.js`:

```js
const ASSETS_URL = "";
```

Quando você publicar as imagens, é só trocar `""` pela URL base (terminada em `/`).

---

## 3. Publicar as imagens no GitHub Pages (grátis)

1. Crie uma conta em <https://github.com> (se ainda não tiver).
2. Crie um repositório **público** chamado, por exemplo, `jogo_do_amor`.
3. Faça o **upload de todos os arquivos** da pasta (os `.png`, o `index.html`,
   `game.js`, `style.css`). No GitHub: botão **Add file → Upload files** →
   arraste tudo → **Commit changes**.
4. No repositório, vá em **Settings → Pages**.
5. Em **Build and deployment → Source**, escolha **Deploy from a branch**,
   selecione a branch `main` e a pasta `/ (root)` → **Save**.
6. Aguarde ~1 minuto. O GitHub vai mostrar a URL do site, algo como:

   ```
   https://SEU-USUARIO.github.io/jogo_do_amor/
   ```

7. **Teste:** abra no navegador
   `https://SEU-USUARIO.github.io/jogo_do_amor/virus.png`
   — se a imagem do vírus aparecer, o host está funcionando. ✅

> Pronto: nesse ponto o próprio GitHub Pages **já está rodando o jogo completo**
> em `https://SEU-USUARIO.github.io/jogo_do_amor/` (com `ASSETS_URL = ""`, porque
> `index.html` e as imagens estão no mesmo lugar). Isso já é uma forma de publicar.

---

## 4. Usar no Google AI Studio

Se quiser continuar desenvolvendo dentro do **AI Studio** (que roda o código mas
não guarda os PNGs), aponte o jogo pras imagens hospedadas no GitHub:

1. No `game.js`, troque a constante:

   ```js
   const ASSETS_URL = "https://SEU-USUARIO.github.io/jogo_do_amor/";
   ```

2. Cole o `index.html` e o `game.js` no AI Studio (ou peça pra ele evoluir o jogo).
3. Como os caminhos agora são URLs completas, as imagens carregam de qualquer lugar.

### Alternativa sem host (Base64)
Se não quiser usar GitHub, dá pra **embutir as imagens no próprio código** em
Base64. Fica tudo num arquivo só (sem 404), mas o `game.js` fica bem grande.
No AI Studio você pode pedir: *"converta meus PNGs em Base64 e embuta no game.js
com loadSprite usando data:image/png;base64,..."*.

---

## 5. Caminhos que usam ASSETS_URL

Já estão preparados no `game.js`:

| Sprite       | Arquivo             |
|--------------|---------------------|
| `heroina`    | `heroina_anim3.png` |
| `virus`      | `virus.png`         |
| `portal`     | `portal.png`        |
| `plataforma` | `plataforma.png`    |
| `moeda`      | `moeda.png`         |

> Sprites extras na pasta (`ellen_sprite_*`, `heroina_anim*.png`, `memória_ram.png`,
> `moeda.png` com contagem de frames) ainda não são usados — dá pra aproveitar
> em fases novas ou trocar a animação da heroína.

---

## 6. Controles

- **Setas ←/→** — mover
- **Espaço** — pular / avançar telas
- Colete **3 Bits** pra liberar o portal de cada fase.
