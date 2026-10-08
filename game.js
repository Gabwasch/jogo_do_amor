// Inicializa a engine do Kaboom
kaboom({
    width: 800,
    height: 600,
    background: [10, 25, 15], // Fundo Verde Escuro (Vibe Terminal/Placa-mãe)
});

//
// BASE DAS IMAGENS
// Deixe "" para rodar com os PNGs na mesma pasta (local).
// Para publicar no Google AI Studio / GitHub Pages, troque por uma URL base
// terminada em barra, ex: "https://SEU-USUARIO.github.io/jogo_do_amor/"
//
const ASSETS_URL = "";

//
// CARREGAMENTO DE IMAGENS (SPRITES)
//
loadSprite("heroina", `${ASSETS_URL}heroina_anim3.png`, {
    sliceX: 6,
    anims: {
        "idle": { from: 0, to: 1, speed: 2, loop: true },
        "run": { from: 2, to: 5, speed: 10, loop: true }
    }
});

// Carregando o sprite do Vírus
loadSprite("virus", `${ASSETS_URL}virus.png`);
loadSprite("portal", `${ASSETS_URL}portal.png`);
loadSprite("plataforma", `${ASSETS_URL}plataforma.png`);
loadSprite("moeda", `${ASSETS_URL}moeda.png`, {
    sliceX: 12, // Coloque aqui o número TOTAL de rosquinhas que tem na imagem
    anims: {
        "spin": {
            from: 0,
            to: 11, // Se tem 13 frames, vai do 0 ao 12
            speed: 8,
            loop: true
        }
    }
});

const VELOCIDADE_MOVIMENTO = 320;
const FORCA_PULO = 850;
const TEMPO_COYOTE = 0.12;   // Janela (em segundos) para ainda pular após sair da plataforma
const BITS_PARA_PORTAL = 3;  // Quantos Bits são necessários para liberar o portal
const VELOCIDADE_MAX_QUEDA = 1200; // Teto da velocidade de queda (anti-tunneling)

//
// SOM PROCEDURAL (Web Audio) — não depende de arquivos de áudio
// Gera "bips" para moeda e dano usando o oscilador do navegador.
//
let audioCtx = null;
function retomarAudio() {
    // Navegadores só deixam tocar som após uma interação do usuário.
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }
}
function bip(freq, duracao, tipo = "square", volume = 0.08) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = tipo;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duracao);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duracao);
}
// Som agudo e curto ao pegar um Bit
function somMoeda() { bip(880, 0.12, "square"); bip(1320, 0.10, "square", 0.05); }
// Som grave ao levar dano
function somDano() { bip(160, 0.25, "sawtooth", 0.1); }

//
// HELPERS DA HEROÍNA (reaproveitados entre o prólogo e as fases)
//

// Cria a heroína com física, área de colisão e opacidade (para a piscada de dano)
// scale(0.5) deixa a Ellen com metade do tamanho original.
function criarHeroina(x = 50, y = 400) {
    return add([
        sprite("heroina"),
        pos(x, y),
        scale(0.5),
        area({ scale: 0.8 }),
        body(),
        opacity(1),
        "heroina"
    ]);
}

// Faz um objeto piscar por um tempo (feedback visual de dano)
function piscar(obj, tempo = 0.6) {
    let t = 0;
    const ev = obj.onUpdate(() => {
        t += dt();
        obj.opacity = (Math.floor(t * 20) % 2 === 0) ? 0.3 : 1;
        if (t >= tempo) {
            obj.opacity = 1;
            ev.cancel();
        }
    });
}

// Liga os controles de movimento, pulo (com coyote time) e animação da heroína
function ativarControles(heroina) {
    let coyote = 0; // tempo restante da "graça" do pulo após sair do chão

    onKeyDown("right", () => {
        heroina.move(VELOCIDADE_MOVIMENTO, 0);
        heroina.flipX = false;
        if (heroina.curAnim() !== "run") heroina.play("run");
    });

    onKeyDown("left", () => {
        heroina.move(-VELOCIDADE_MOVIMENTO, 0);
        heroina.flipX = true;
        if (heroina.curAnim() !== "run") heroina.play("run");
    });

    onKeyPress("space", () => {
        retomarAudio();
        // Pula se está no chão OU se ainda está dentro da janela do coyote time
        if (coyote > 0) {
            heroina.jump(FORCA_PULO);
            coyote = 0;
        }
    });

    heroina.onUpdate(() => {
        // Recarrega o coyote enquanto estiver no chão; senão, vai descontando
        if (heroina.isGrounded()) {
            coyote = TEMPO_COYOTE;
        } else {
            coyote -= dt();
        }

        // Limita a velocidade de queda. Evita "tunneling" (atravessar o chão)
        // quando o navegador engasga e gera um frame gigante (ex: trocar de aba).
        if (heroina.vel && heroina.vel.y > VELOCIDADE_MAX_QUEDA) {
            heroina.vel.y = VELOCIDADE_MAX_QUEDA;
        }

        // Trava a heroína dentro da tela
        if (heroina.pos.x < 0) heroina.pos.x = 0;
        if (heroina.pos.x > width() - 32) heroina.pos.x = width() - 32;

        // Volta pra animação parada quando não está andando
        if (!isKeyDown("left") && !isKeyDown("right")) {
            if (heroina.curAnim() !== "idle") heroina.play("idle");
        }
    });
}

//
// CENA 1: INTRODUÇÃO
//
scene("intro", () => {
    add([ text("ALERTA DE SISTEMA: VÍRUS DETECTADO!", { size: 32 }), pos(width() / 2, height() / 2 - 100), anchor("center"), color(255, 0, 0) ]);
    add([ text("Seu namorado foi sugado para a Placa-Mãe!", { size: 24 }), pos(width() / 2, height() / 2), anchor("center"), color(0, 255, 0) ]);
    add([ text("Pressione [ESPAÇO] para hackear o sistema!", { size: 20 }), pos(width() / 2, height() / 2 + 100), anchor("center"), color(0, 200, 0) ]);

    onKeyPress("space", () => { retomarAudio(); go("prologo"); });
});

//
// CENA 2: O PRÓLOGO (A Armadilha do Vírus)
//
scene("prologo", () => {
    setGravity(1600);

    addLevel([
        "                         ",
        "                         ",
        "                         ",
        "                         ",
        "                         ",
        "           ======        ",
        "                         ",
        "                         ",
        "      ======             ",
        "                         ",
        "                         ",
        "  ======        ======   ",
        "                         ",
        "                         ",
        "                         ",
        "                         ",
        "                         ",
        "=========================",
    ], {
        tileWidth: 32, tileHeight: 32,
        tiles: {
            // Usando a imagem da placa de circuito no tamanho exato do bloco
            "=": () => [ sprite("plataforma", { width: 32, height: 32 }), area(), body({ isStatic: true }) ]
        }
    });

    const heroina = criarHeroina(50, 400);

    // O Mocinho continua sendo o bloco verde por enquanto
    const mocinho = add([ rect(32, 32), pos(400, 100), color(50, 255, 50), area(), body({ isStatic: true }), "objetivo" ]);

    ativarControles(heroina);

    // O EVENTO DO RAPTO
    let raptado = false;
    heroina.onCollide("objetivo", () => {
        if (raptado) return;
        raptado = true;

        // O Vírus Chefão aparece GIGANTE para engolir o programador!
        const virus = add([
            sprite("virus", { width: 96, height: 96 }), // Aumentado para 96x96
            // Ajustamos a posição para ele nascer centralizado em cima do mocinho
            pos(mocinho.pos.x - 32, mocinho.pos.y - 32),
            area()
        ]);

        mocinho.unuse("body");

        virus.onUpdate(() => {
            virus.move(0, -200);
            mocinho.move(0, -200);
        });

        add([ text("DADOS CRIPTOGRAFADOS!", { size: 32 }), pos(width() / 2, height() / 2), anchor("center"), color(255, 0, 0) ]);

        wait(2.5, () => {
            // Começa na primeira fase, com 0 bits e 3 vidas
            go("game", { fase: 0, moedas: 0, vidas: 3 });
        });
    });
});

//
// DEFINIÇÃO DAS FASES (grid de texto)
// "=" chão  |  "$" Bit  |  "^" vírus  |  "@" portal
//
const FASES = [
    // FASE 1 — Aquecimento
    [
        "                         ",
        "                         ",
        "                         ",
        "                         ",
        "           $             ",
        "         ====            ",
        "                         ",
        "               ^         ",
        "             ====        ",
        "    $                    ",
        "  ====              @    ",
        "                  ====   ",
        "                         ",
        "       $   ^       ^     ",
        "=========================",
    ],
    // FASE 2 — Saltos mais longos e mais vírus
    [
        "                         ",
        "                         ",
        "             $           ",
        "           =====         ",
        "                      $  ",
        "      $            ===== ",
        "    =====                ",
        "              ^          ",
        "          =======        ",
        "   ^                 @   ",
        "                  ===== ",
        "        $                ",
        "      =====      ^       ",
        "  ^        ^             ",
        "=========================",
    ],
    // FASE 3 — Plataformas estreitas e enxame de vírus
    [
        "                         ",
        "        $        $       ",
        "      =====    =====     ",
        "                         ",
        "   $                 $   ",
        "  ====             ====  ",
        "            ^            ",
        "         =======         ",
        "   ^                ^    ",
        "                         ",
        " ====   $   ====    ==== ",
        "              ^          ",
        "        =====      @     ",
        "       ^      ^   =====  ",
        "=========================",
    ],
];

//
// CENA DE TRANSIÇÃO ENTRE FASES ("FASE 2", "FASE 3"...)
//
scene("transicao", ({ fase, vidas }) => {
    add([ text("FASE " + (fase + 1), { size: 56 }), pos(width() / 2, height() / 2 - 20), anchor("center"), color(0, 255, 0) ]);
    add([ text("Carregando novo setor da placa-mãe...", { size: 20 }), pos(width() / 2, height() / 2 + 50), anchor("center"), color(0, 200, 0) ]);
    add([ text("Vidas: " + vidas, { size: 18 }), pos(width() / 2, height() / 2 + 90), anchor("center"), color(255, 0, 0) ]);

    // Após a pausa, entra na fase com os Bits zerados (precisa coletar de novo)
    wait(1.6, () => go("game", { fase: fase, moedas: 0, vidas: vidas }));
});

//
// CENA 3: O JOGO REAL (FASES)
//
scene("game", ({ fase, moedas, vidas }) => {
    setGravity(1600);

    const configMapa = {
        tileWidth: 32,
        tileHeight: 32,
        tiles: {
            // Chão (Placa de circuito)
            "=": () => [ sprite("plataforma", { width: 32, height: 32 }), area(), body({ isStatic: true }), "chao" ],

            // Moeda (Bit amarelo) - Tamanho menorzinho
            "$": () => [ sprite("moeda", { width: 16, height: 16, anim: "spin" }), area(), pos(8, 8), "moeda" ],

            // Inimigo (Vírus menor)
            "^": () => [ sprite("virus", { width: 32, height: 32 }), area({ scale: 0.8 }), body({ isStatic: true }), "inimigo" ],

            // Portal Cyber - Um pouco mais alto
            "@": () => [ sprite("portal", { width: 32, height: 48 }), area(), body({ isStatic: true }), "portal" ],
        }
    };

    addLevel(FASES[fase], configMapa);

    const heroina = criarHeroina(50, 400);

    // --- HUD ---
    add([ text("FASE " + (fase + 1) + "/" + FASES.length, { size: 22 }), pos(20, 20), color(0, 255, 255), fixed(), z(100) ]);
    const uiMoedas = add([ text("Bits: " + moedas + "/" + BITS_PARA_PORTAL, { size: 22 }), pos(20, 48), color(0, 255, 0), fixed(), z(100) ]);
    const uiVidas = add([ text("Vidas: " + vidas, { size: 22 }), pos(20, 76), color(255, 0, 0), fixed(), z(100) ]);
    add([ text("Colete " + BITS_PARA_PORTAL + " Bits e chegue no portal", { size: 16 }), pos(width() - 20, 20), anchor("topright"), color(0, 200, 0), fixed(), z(100) ]);

    ativarControles(heroina);

    // Rede de segurança: se a heroína cair para fora do mundo (buraco ou falha
    // de física), perde 1 vida e volta para o início da fase em vez de travar.
    heroina.onUpdate(() => {
        if (heroina.pos.y > height() + 150) {
            vidas -= 1;
            uiVidas.text = "Vidas: " + vidas;
            if (vidas <= 0) {
                go("gameover");
                return;
            }
            heroina.pos = vec2(50, 0);
            heroina.vel.y = 0;
        }
    });

    // Pega um Bit
    heroina.onCollide("moeda", (moeda) => {
        destroy(moeda);
        moedas += 1;
        uiMoedas.text = "Bits: " + moedas + "/" + BITS_PARA_PORTAL;
        somMoeda();
    });

    // Bate em um vírus: perde vida, toma empurrão, pisca e pode dar game over
    // Começa invulnerável por 1s para não tomar dano no instante do spawn.
    let invulneravel = true;
    wait(1.0, () => { invulneravel = false; });
    heroina.onCollide("inimigo", (inimigo) => {
        if (invulneravel) return;
        invulneravel = true;

        vidas -= 1;
        uiVidas.text = "Vidas: " + vidas;
        heroina.jump(FORCA_PULO / 1.5);
        somDano();
        piscar(heroina, 0.6);

        if (vidas <= 0) {
            go("gameover");
            return;
        }

        // Curto período de invulnerabilidade pra não perder várias vidas de uma vez
        wait(0.8, () => { invulneravel = false; });
    });

    // Chega no portal
    heroina.onCollide("portal", () => {
        if (moedas >= BITS_PARA_PORTAL) {
            if (fase + 1 < FASES.length) {
                // Vai para a tela de transição da próxima fase
                go("transicao", { fase: fase + 1, vidas: vidas });
            } else {
                go("vitoria");
            }
        } else {
            const aviso = add([ text("Precisa de " + BITS_PARA_PORTAL + " Bits!", { size: 20 }), pos(heroina.pos.x, heroina.pos.y - 40), color(255, 0, 0) ]);
            wait(1, () => destroy(aviso));
        }
    });
});

//
// CENA 4: GAME OVER E VITÓRIA
//
scene("gameover", () => {
    add([ text("ERRO FATAL: SISTEMA CORROMPIDO", { size: 32 }), pos(width() / 2, height() / 2), anchor("center"), color(255, 0, 0) ]);
    add([ text("Aperte [ESPAÇO] para reiniciar o boot", { size: 20 }), pos(width() / 2, height() / 2 + 50), anchor("center"), color(0, 255, 0) ]);
    onKeyPress("space", () => go("prologo"));
});

scene("vitoria", () => {
    add([ text("ACESSO ROOT CONCEDIDO!", { size: 40 }), pos(width() / 2, height() / 2 - 50), anchor("center"), color(0, 255, 0) ]);
    add([ text("Você hackeou o coração dele! <3", { size: 24 }), pos(width() / 2, height() / 2 + 30), anchor("center"), color(255, 255, 255) ]);
    add([ text("Aperte [ESPAÇO] para jogar de novo", { size: 18 }), pos(width() / 2, height() / 2 + 90), anchor("center"), color(0, 200, 0) ]);
    onKeyPress("space", () => go("intro"));
});

// Inicia o jogo
go("intro");
