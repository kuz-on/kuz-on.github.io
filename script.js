const $ = id => document.getElementById(id);

const cord = $('cord'),
    line = $('line'),
    bead = $('bead'),
    lineh = $('lineh'),
    beadh = $('beadh'),
    bulb = $('bulb'),
    lit = $('lit'),
    dark = $('dark');

const root = document.documentElement,
    REST = 110,
    MAX = 165;

const lines = [
    'Hey, I was reading that.',
    'Lights out.',
    'Back in the dark.'
];

let y = REST,
    v = 0,
    drag = false,
    grab = 0,
    running = false,
    ctx = null,
    lock = 0,
    li = 0;

root.style.overflow = 'hidden';

let saved = null;

try {
    saved = localStorage.getItem('light');
} catch (e) {}

const applyLight = d => document.body.classList.toggle('dark', d);

applyLight(
    saved
        ? saved === 'white'
        : matchMedia('(prefers-color-scheme: dark)').matches
);

function draw() {
    const sway = Math.max(-6, Math.min(6, v * 0.7));
    const d = `M20 0Q${20 + sway} ${y / 2} ${20 + sway} ${y}`;

    line.setAttribute('d', d);
    lineh.setAttribute('d', d);

    for (const b of [bead, beadh]) {
        b.setAttribute('cx', 20 + sway);
        b.setAttribute('cy', y);
    }
}

function loop() {
    if (!drag) {
        v += (REST - y) * 0.18;
        v *= 0.78;
        y += v;
    }

    draw();

    if (
        drag ||
        Math.abs(v) > 0.05 ||
        Math.abs(y - REST) > 0.2
    ) {
        requestAnimationFrame(loop);
    } else {
        running = false;
        y = REST;
        v = 0;
        draw();
    }
}

function kick() {
    if (!running) {
        running = true;
        requestAnimationFrame(loop);
    }
}

function click() {
    try {
        ctx = ctx || new (
            window.AudioContext || window.webkitAudioContext
        )();

        const len = Math.floor(ctx.sampleRate * .02),
            b = ctx.createBuffer(1, len, ctx.sampleRate),
            d = b.getChannelData(0);

        for (let i = 0; i < len; i++) {
            d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4);
        }

        const s = ctx.createBufferSource(),
            g = ctx.createGain();

        g.gain.value = .45;

        s.buffer = b;
        s.connect(g).connect(ctx.destination);
        s.start();
    } catch (e) {}
}

function restart(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
}

function toggle() {
    const on = document.body.classList.toggle('on');

    clearTimeout(lock);

    if (on) {
        root.style.overflow = '';
        restart(lit, 'flick');
    } else {
        lock = setTimeout(() => {
            root.style.overflow = 'hidden';
        }, 1100);

        dark.textContent = lines[li++ % lines.length];
    }

    restart(bulb, 'swing');
    click();
}

cord.addEventListener('pointerdown', e => {
    drag = true;
    grab = e.clientY - y;
    cord.setPointerCapture(e.pointerId);
    kick();
});

cord.addEventListener('pointermove', e => {
    if (drag) {
        y = Math.max(REST, Math.min(MAX, e.clientY - grab));
    }
});

const release = () => {
    if (!drag) return;

    drag = false;

    if (y - REST > 28) {
        toggle();
    }

    kick();
};

cord.addEventListener('pointerup', release);
cord.addEventListener('pointercancel', release);

cord.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        y = MAX;
        v = 0;
        toggle();
        kick();
    }
});

function changeLight() {
    const d = !document.body.classList.contains('dark');

    applyLight(d);

    try {
        localStorage.setItem('light', d ? 'white' : 'yellow');
    } catch (e) {}

    restart(bulb, 'swing');
    click();
}

bulb.addEventListener('click', changeLight);

bulb.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        changeLight();
    }
});

draw();
