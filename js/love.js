const BLOCK_SIZE = 28;

const blk_pitn = {
        block1: [[0, 1], [0, 0], [-1, 0], [-1, -1]],
        block2: [[0, 1], [0, 0], [-1, 0], [0, -1]],
        block3: [[-1, 1], [0, 0], [-1, 0], [-1, -1]],
        block4: [[0, 1], [0, 0], [-1, 0], [-1, -1]],
        block5: [[-1, 1], [0, 0], [-1, 0], [0, -1]],
        block6: [[0, -1], [0, 0], [-1, 0], [1, -1]],
        block7: [[-1, -1], [0, 0], [-1, 0], [1, 0]],
        block8: [[-1, 1], [0, 0], [-1, 0], [-1, -1]],
        block9: [[0, -1], [0, 0], [-1, 0], [1, 0]],
        block10: [[-1, 1], [0, 0], [-1, 0], [1, 0]],
        block11: [[2, 0], [0, 0], [-1, 0], [1, 0]],
        block12: [[0, 1], [0, 0], [-1, 0], [0, -1]],
        block13: [[0, 1], [0, 0], [-1, 0], [-1, -1]],
        block14: [[1, 1], [0, 0], [-1, 0], [1, 0]],
        block15: [[1, -1], [0, 0], [-1, 0], [1, 0]],
        block16: [[-1, -1], [0, 0], [-1, 0], [1, 0]],
        block17: [[0, 1], [0, 0], [-1, 0], [0, -1]],
        block18: [[0, 1], [0, 0], [-1, 0], [-1, -1]],
        block19: [[0, -1], [0, 0], [-1, 0], [1, 0]],
        block20: [[1, -1], [0, 0], [-1, 0], [1, 0]],
        block21: [[0, 1], [0, 0], [-1, 0], [-1, -1]],
        block22: [[1, 1], [0, 0], [-1, 0], [1, 0]],
        block23: [[0, 2], [0, 0], [0, -1], [0, 1]]
    },
    offset_pitn = {
        block1: [5, 3],
        block2: [5, 1],
        block3: [3, 4],
        block4: [3, 2],
        block5: [3, -1],
        block6: [2, 5],
        block7: [2, 1],
        block8: [1, -1],
        block9: [1, -3],
        block10: [1, 2],
        block11: [0, 3],
        block12: [0, 0],
        block13: [-1, -4],
        block14: [0, -2],
        block15: [-2, 4],
        block16: [-2, 2],
        block17: [-2, 0],
        block18: [-3, -2],
        block19: [-4, 0],
        block20: [-3, 5],
        block21: [-5, 3],
        block22: [-4, 1],
        block23: [-6, 1]
    };

let blocks = document.getElementsByClassName("block"),
    block = blocks[0],
    love = document.getElementsByClassName("love")[0],
    index = 0,
    clone_block,
    isFiringStarted = false;

const halfBlock = BLOCK_SIZE / 2;

block.style.top = "50%";
block.style.left = "50%";
block.style.margin = `-${halfBlock}px 0 0 -${halfBlock}px`;

const block_left = parseFloat(window.getComputedStyle(block, null).left.slice(0, -2)),
    block_top = parseFloat(window.getComputedStyle(block, null).top.slice(0, -2));

function Next() {
    if (++index >= 24) {
        love.classList.add("heart-complete");
        Rise();
        return;
    }

    block.style.visibility = "visible";
    block.style.left = block_left + BLOCK_SIZE * offset_pitn["block" + index][0] + "px";
    block.style.top = block_top - BLOCK_SIZE * offset_pitn["block" + index][1] + "px";

    for (let i = 0; i < block.children.length; i++) {
        block.children[i].style.left = blk_pitn["block" + index][i][0] * -BLOCK_SIZE + "px";
        block.children[i].style.top = blk_pitn["block" + index][i][1] * -BLOCK_SIZE + "px";
    }

    clone_block = block.cloneNode(true);
    love.appendChild(clone_block);

    if (love.children.length >= 24) {
        blocks[blocks.length - 1].children[2].style.display = "none";
        block.style.display = "none";
    }
}

function Rise() {
    let timer2 = null,
        distance = 0;

    const target = 80,
        speed = 0.8;

    let love_top = parseFloat(window.getComputedStyle(love, null).top.slice(0, -2));

    timer2 = setInterval(() => {
        distance += speed;
        if (distance >= target) {
            clearInterval(timer2);
            revealPhotoGallery();
        }
        love.style.top = (love_top - distance) + "px";
    }, 22);
}

/* ── Firing Particle Canvas Engine ── */
let firingCanvas, firingCtx;
let activeProjectiles = [];
let activeImpacts = [];

function initFiringCanvas() {
    firingCanvas = document.getElementById("firing-canvas");
    if (!firingCanvas) return;
    firingCtx = firingCanvas.getContext("2d");

    function resize() {
        firingCanvas.width = window.innerWidth;
        firingCanvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);
    requestAnimationFrame(animateFiringEngine);
}

function animateFiringEngine() {
    if (!firingCtx) return;
    firingCtx.clearRect(0, 0, firingCanvas.width, firingCanvas.height);

    // Draw active projectiles
    for (let i = activeProjectiles.length - 1; i >= 0; i--) {
        const p = activeProjectiles[i];
        p.progress += p.speed;

        // Quadratic Bezier
        const t = p.progress;
        const currentX = (1-t)*(1-t)*p.startX + 2*(1-t)*t*p.controlX + t*t*p.endX;
        const currentY = (1-t)*(1-t)*p.startY + 2*(1-t)*t*p.controlY + t*t*p.endY;

        // Record trail
        p.trail.push({ x: currentX, y: currentY, alpha: 1 });
        if (p.trail.length > 18) p.trail.shift();

        // Draw glowing trail — two-layer (outer glow + inner bright)
        p.trail.forEach((pt, idx) => {
            pt.alpha *= 0.80;
            const r = (idx / p.trail.length) * 5 + 0.5;

            // Outer rose glow
            firingCtx.beginPath();
            firingCtx.arc(pt.x, pt.y, r * 2.2, 0, Math.PI * 2);
            firingCtx.fillStyle = `rgba(220, 60, 110, ${pt.alpha * 0.28})`;
            firingCtx.fill();

            // Inner bright core
            firingCtx.beginPath();
            firingCtx.arc(pt.x, pt.y, r * 0.9, 0, Math.PI * 2);
            firingCtx.fillStyle = `rgba(255, 200, 225, ${pt.alpha})`;
            firingCtx.fill();
        });

        // Stardust sparkles along the path
        if (Math.random() < 0.45) {
            activeImpacts.push({
                x: currentX + (Math.random()-0.5)*12,
                y: currentY + (Math.random()-0.5)*12,
                vx: (Math.random()-0.5)*0.8,
                vy: -(Math.random()*1.2 + 0.4),
                size: Math.random()*2.5 + 0.8,
                color: Math.random() < 0.5 ? "#ffd6e8" : "#e8c47a",
                alpha: 0.9,
                decay: 0.045,
                isStar: true
            });
        }

        // Glowing heart projectile head
        firingCtx.save();
        firingCtx.translate(currentX, currentY);
        firingCtx.shadowColor = "rgba(255, 80, 130, 1)";
        firingCtx.shadowBlur = 22;
        firingCtx.font = "22px sans-serif";
        firingCtx.textAlign = "center";
        firingCtx.textBaseline = "middle";
        firingCtx.fillText("💖", 0, 0);
        firingCtx.restore();

        if (p.progress >= 1) {
            spawnImpactBurst(p.endX, p.endY);
            if (p.onImpact) p.onImpact();
            activeProjectiles.splice(i, 1);
        }
    }

    // Draw impact + stardust particles
    for (let i = activeImpacts.length - 1; i >= 0; i--) {
        const impact = activeImpacts[i];
        impact.alpha -= (impact.decay || 0.025);
        impact.x += impact.vx;
        impact.y += impact.vy;
        impact.size *= 0.97;

        if (impact.alpha <= 0) { activeImpacts.splice(i, 1); continue; }

        firingCtx.save();
        firingCtx.globalAlpha = impact.alpha;

        if (impact.isRing) {
            // Ring burst
            firingCtx.beginPath();
            firingCtx.arc(impact.x, impact.y, impact.size, 0, Math.PI * 2);
            firingCtx.strokeStyle = impact.color;
            firingCtx.lineWidth = 1.5;
            firingCtx.stroke();
        } else if (impact.isStar) {
            // Tiny diamond star
            firingCtx.beginPath();
            firingCtx.moveTo(impact.x, impact.y - impact.size);
            firingCtx.lineTo(impact.x + impact.size*0.4, impact.y);
            firingCtx.lineTo(impact.x, impact.y + impact.size);
            firingCtx.lineTo(impact.x - impact.size*0.4, impact.y);
            firingCtx.closePath();
            firingCtx.fillStyle = impact.color;
            firingCtx.fill();
        } else {
            // Regular spark dot
            firingCtx.beginPath();
            firingCtx.arc(impact.x, impact.y, impact.size, 0, Math.PI * 2);
            firingCtx.fillStyle = impact.color;
            firingCtx.fill();
        }

        firingCtx.restore();
    }

    requestAnimationFrame(animateFiringEngine);
}

function launchHeartShot(startX, startY, endX, endY, onImpactCallback) {
    // Arced control point — higher arc for drama
    const midX = (startX + endX) / 2 + (Math.random()-0.5)*60;
    const midY = Math.min(startY, endY) - (80 + Math.random() * 100);

    activeProjectiles.push({
        startX, startY,
        controlX: midX,
        controlY: midY,
        endX, endY,
        progress: 0,
        speed: 0.038 + Math.random() * 0.012,
        trail: [],
        onImpact: onImpactCallback
    });
}

function spawnImpactBurst(x, y) {
    const dotColors  = ["#ff2d6b", "#ff6e99", "#ffb3c6", "#fff0f5", "#e8c47a", "#ffd700"];
    const ringColors = ["rgba(255,100,150,0.6)", "rgba(255,200,230,0.4)", "rgba(232,196,122,0.5)"];

    // Dot sparks — lots of them
    for (let i = 0; i < 28; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 2;
        activeImpacts.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1,
            size: Math.random() * 5 + 1.5,
            color: dotColors[Math.floor(Math.random() * dotColors.length)],
            alpha: 1,
            decay: 0.022 + Math.random() * 0.018
        });
    }

    // Expanding ring halos
    for (let r = 0; r < 3; r++) {
        activeImpacts.push({
            x, y,
            vx: 0, vy: 0,
            size: 4 + r * 8,
            color: ringColors[r],
            alpha: 0.85,
            decay: 0.028,
            isRing: true
        });
    }

    // Gold stardust
    for (let s = 0; s < 10; s++) {
        const angle = Math.random() * Math.PI * 2;
        activeImpacts.push({
            x: x + (Math.random()-0.5)*20,
            y: y + (Math.random()-0.5)*20,
            vx: Math.cos(angle)*2.5,
            vy: Math.sin(angle)*2.5 - 2,
            size: Math.random()*3 + 1,
            color: Math.random() < 0.5 ? "#ffd700" : "#fff0b0",
            alpha: 1,
            decay: 0.030,
            isStar: true
        });
    }
}

/* ── Firing Action Trigger ── */
function startFiringSequence() {
    if (isFiringStarted) return;
    isFiringStarted = true;

    // Try starting music automatically if not playing
    const audio = document.getElementById("bg-music");
    const musicBtn = document.getElementById("music-toggle");
    if (audio && audio.paused) {
        audio.play().then(() => {
            musicBtn.classList.add("playing");
            musicBtn.querySelector(".music-text").textContent = "Pause Music";
        }).catch(() => {});
    }

    // Fade out speech bubble hint
    const fireHint = document.getElementById("fire-hint");
    if (fireHint) {
        fireHint.style.transition = "opacity 0.4s ease";
        fireHint.style.opacity = "0";
        setTimeout(() => fireHint.style.display = "none", 400);
    }

    const shooter = document.getElementById("shooter-container");
    const shooterRect = shooter.getBoundingClientRect();
    const startX = shooterRect.left + shooterRect.width * 0.75;
    const startY = shooterRect.top + shooterRect.height * 0.35;

    const loveRect = love.getBoundingClientRect();

    // Fire 24 shots sequentially
    for (let shotIndex = 0; shotIndex < 24; shotIndex++) {
        setTimeout(() => {
            let targetX, targetY;
            if (shotIndex === 0) {
                targetX = loveRect.left + loveRect.width / 2;
                targetY = loveRect.top + loveRect.height / 2;
            } else {
                const offX = offset_pitn["block" + shotIndex][0];
                const offY = offset_pitn["block" + shotIndex][1];
                targetX = loveRect.left + loveRect.width / 2 + offX * BLOCK_SIZE;
                targetY = loveRect.top + loveRect.height / 2 - offY * BLOCK_SIZE;
            }

            launchHeartShot(startX, startY, targetX, targetY, () => {
                Next();
            });
        }, shotIndex * 210);
    }
}

/* ── "Love of Pictures" Photo Gallery Logic ── */
const defaultPhotos = [
    { src: "images/You.gif", caption: "Your 💕" },
    { src: "images/Me.gif", caption: "Me 🌸" },
    { src: "images/our-1.gif", caption: "Forever & Always ✨" },
    { src: "images/Our-2.gif", caption: "You Have My Heart ❤️" }
];

function revealPhotoGallery() {
    const gallery = document.getElementById("photo-gallery");
    if (!gallery) return;

    gallery.classList.remove("hidden");
    document.body.classList.add("has-gallery");

    const grid = document.getElementById("polaroid-grid");
    grid.innerHTML = "";

    defaultPhotos.forEach((photo, idx) => {
        addPolaroidCard(photo.src, photo.caption, idx);
    });

    // Smooth scroll down towards the gallery
    setTimeout(() => {
        gallery.scrollIntoView({ behavior: "smooth" });
    }, 600);
}

function addPolaroidCard(src, caption, index = 0) {
    const grid = document.getElementById("polaroid-grid");
    if (!grid) return;

    const card = document.createElement("div");
    card.className = "polaroid-card";

    const rotations = [-5, 3.5, -2.5, 5.5, -3.5, 4, -1.5, 2];
    const rot = rotations[index % rotations.length];

    // Start invisible and off-bottom for cascade entrance
    card.style.opacity    = "0";
    card.style.transform  = `rotate(${rot}deg) translateY(40px) scale(0.88)`;
    card.style.transition = "opacity 0.7s ease, transform 0.7s cubic-bezier(0.22,1,0.36,1)";

    card.innerHTML = `
        <div class="polaroid-img-wrap">
            <img src="${src}" alt="${caption}" loading="lazy">
        </div>
        <p class="polaroid-caption">${caption}</p>
    `;

    card.addEventListener("click", () => openLightbox(src, caption));
    grid.appendChild(card);

    // Staggered cascade reveal
    setTimeout(() => {
        card.style.opacity   = "1";
        card.style.transform = `rotate(${rot}deg) translateY(0) scale(1)`;
    }, 120 + index * 160);
}

/* Custom Photo Upload */
function initPhotoUpload() {
    const input = document.getElementById("custom-photo-input");
    if (!input) return;

    input.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (evt) {
            const captionPrompt = prompt("Enter a sweet caption for your picture:", "Our Favorite Memory ❤️");
            const captionText = captionPrompt && captionPrompt.trim() !== "" ? captionPrompt.trim() : "Our Special Memory 💖";
            
            const grid = document.getElementById("polaroid-grid");
            const cardCount = grid.children.length;
            addPolaroidCard(evt.target.result, captionText, cardCount);
            
            // Scroll to newly added card
            grid.lastElementChild.scrollIntoView({ behavior: "smooth" });
        };
        reader.readAsDataURL(file);
    });
}

/* ── Lightbox Modal Logic ── */
function openLightbox(src, caption) {
    const lightbox = document.getElementById("lightbox");
    const lightboxImg = document.getElementById("lightbox-img");
    const lightboxCaption = document.getElementById("lightbox-caption");
    if (!lightbox) return;

    lightboxImg.src = src;
    lightboxCaption.textContent = caption;
    lightbox.classList.remove("hidden");
}

function initLightbox() {
    const lightbox = document.getElementById("lightbox");
    const closeBtn = document.getElementById("close-lightbox");
    const overlay = document.getElementById("lightbox-overlay");

    if (!lightbox) return;

    const close = () => lightbox.classList.add("hidden");
    if (closeBtn) closeBtn.addEventListener("click", close);
    if (overlay) overlay.addEventListener("click", close);

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !lightbox.classList.contains("hidden")) {
            close();
        }
    });
}

/* ── Music Control ── */
function initMusicPlayer() {
    const musicBtn = document.getElementById("music-toggle");
    const audio = document.getElementById("bg-music");
    if (!musicBtn || !audio) return;

    musicBtn.addEventListener("click", () => {
        if (audio.paused) {
            audio.play().then(() => {
                musicBtn.classList.add("playing");
                musicBtn.querySelector(".music-text").textContent = "Pause Music";
            }).catch(err => console.log("Audio playback blocked", err));
        } else {
            audio.pause();
            musicBtn.classList.remove("playing");
            musicBtn.querySelector(".music-text").textContent = "Play Music";
        }
    });
}

/* ── Floating CSS hearts ── */
function initFloatingHearts() {
    const container = document.querySelector(".floating-hearts");
    if (!container) return;

    const hearts = ["♥", "♡", "❤", "💖", "💕", "💗", "💞"];
    // Colour palette for hearts
    const colors = [
        "rgba(200,60,100,0.65)",
        "rgba(220,90,130,0.55)",
        "rgba(180,40,80,0.60)",
        "rgba(232,196,122,0.55)",
        "rgba(240,140,175,0.60)"
    ];
    for (let i = 0; i < 28; i++) {
        const span = document.createElement("span");
        span.textContent = hearts[i % hearts.length];
        span.style.left = Math.random() * 100 + "%";
        span.style.animationDuration = (9 + Math.random() * 18) + "s";
        span.style.animationDelay    = (Math.random() * 14) + "s";
        const size = 11 + Math.random() * 16;
        span.style.fontSize = size + "px";
        span.style.color = colors[i % colors.length];
        container.appendChild(span);
    }
}

/* ── Ambient Canvas sparkle particles ── */
function initParticles() {
    const canvas = document.getElementById("particles");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let particles = [];
    let w, h;

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }

    function createParticle() {
        return {
            x: Math.random() * w,
            y: Math.random() * h,
            size: Math.random() * 2.5 + 0.5,
            speedY: -(Math.random() * 0.4 + 0.15),
            speedX: (Math.random() - 0.5) * 0.3,
            opacity: Math.random() * 0.5 + 0.2,
            twinkle: Math.random() * Math.PI * 2
        };
    }

    for (let i = 0; i < 95; i++) {
        particles.push(createParticle());
    }

    // Two particle colour palettes: rose & gold
    const pColors = [
        [220, 80,  130],
        [200, 60,  100],
        [232, 196, 122],
        [255, 180, 210],
        [255, 230, 245],
    ];

    function draw() {
        ctx.clearRect(0, 0, w, h);

        particles.forEach((p, i) => {
            p.y += p.speedY;
            p.x += p.speedX;
            p.twinkle += 0.018 + (i % 4) * 0.003;

            if (p.y < -10) {
                p.y = h + 10;
                p.x = Math.random() * w;
            }

            const alpha = p.opacity * (0.45 + 0.55 * Math.sin(p.twinkle));
            const col   = pColors[i % pColors.length];

            // Soft glow halo
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${col[0]}, ${col[1]}, ${col[2]}, ${alpha * 0.12})`;
            ctx.fill();

            // Bright core
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${col[0]}, ${col[1]}, ${col[2]}, ${alpha * 0.85})`;
            ctx.fill();
        });

        requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    draw();
}

/* ── Interactive Click Heart Burst ── */
function initClickHeartBurst() {
    window.addEventListener("click", (e) => {
        if (e.target.closest("button, a, label, .polaroid-card, .lightbox-content")) return;

        // Spawn 3 hearts with different sizes & timings
        const symbols = ["💖", "💕", "✨"];
        for (let n = 0; n < 3; n++) {
            const heart = document.createElement("div");
            heart.textContent = symbols[n];
            const size = 14 + n * 6;
            heart.style.cssText = [
                "position:fixed",
                `left:${e.clientX + (n-1)*16}px`,
                `top:${e.clientY}px`,
                `font-size:${size}px`,
                "pointer-events:none",
                "z-index:999",
                `transform:translate(-50%,-50%) scale(0.5) rotate(${(Math.random()-0.5)*30}deg)`,
                `transition:all ${0.7 + n*0.15}s cubic-bezier(0.22,1,0.36,1)`,
                "opacity:1"
            ].join(";");

            document.body.appendChild(heart);

            const floatY  = -(70 + Math.random()*80);
            const rotateZ = (Math.random()-0.5)*50;
            requestAnimationFrame(() => {
                heart.style.transform  = `translate(-50%, ${floatY}px) scale(1.5) rotate(${rotateZ}deg)`;
                heart.style.opacity    = "0";
            });

            setTimeout(() => heart.remove(), 900 + n*150);
        }
    });
}

window.onload = function () {
    initFloatingHearts();
    initParticles();
    initFiringCanvas();
    initMusicPlayer();
    initLightbox();
    initPhotoUpload();
    initClickHeartBurst();

    // Click event on shooter GIF container to start firing sequence
    const shooterContainer = document.getElementById("shooter-container");
    if (shooterContainer) {
        shooterContainer.addEventListener("click", () => {
            startFiringSequence();
        });
    }
};

