// Blockchain Don Talk 💘
// The score is keccak256("name1|name2") → first 2 bytes mod 101.
// Same formula lives in contracts/LoveSeal.sol, so on-chain seals can't be faked.

// ── Config ────────────────────────────────────────────────────────────────
// After deploying contracts/LoveSeal.sol, paste the address here.
const CONTRACT = {
  address: "", // e.g. "0x1234…"
  chainId: 84532,
  chainHex: "0x14a34",
  chainName: "Base Sepolia",
  rpc: "https://sepolia.base.org",
  explorer: "https://sepolia.basescan.org",
};
const ETHERS_URL = "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js";
const ABI = [
  "function seal(bytes32 pairHash)",
  "function sealCount(bytes32) view returns (uint256)",
  "function totalSeals() view returns (uint256)",
];

const TIERS = [
  { min: 90, emoji: "💍", color: "#ffcc33", verdict: "Una go marry for Ikoyi Registry!", sub: "Blockchain don confirm am. Start to dey plan owambe, aso-ebi loading… 🎉", short: "Wedding bells 💍" },
  { min: 75, emoji: "🔥", color: "#ff3d7f", verdict: "Correct match! Sharp sharp!", sub: "This love get strong network, e no dey drop call. Make una no fumble am. ❤️", short: "Correct match 🔥" },
  { min: 60, emoji: "😏", color: "#ff7a45", verdict: "E get as e be… but e fit work", sub: "Small effort, small data, small 'good morning dear' every day. You fit carry first. 🙏🏾", short: "E fit work 😏" },
  { min: 40, emoji: "🫠", color: "#a78bfa", verdict: "Na situationship be this o", sub: "Una dey talk, but nobody wan define am. Blockchain dey watch una. 👀", short: "Situationship 🫠" },
  { min: 20, emoji: "🤝", color: "#38bdf8", verdict: "Abeg, make una just be friends", sub: "Friendship na also love. Na just say no be the romantic type. 😅", short: "Just friends 🤝" },
  { min: 0, emoji: "🏃🏾‍♂️", color: "#94a3b8", verdict: "Run! Even blockchain no fit save this one", sub: "The hash don talk, and e no sweet. Delete the number, block, move on. 😂💨", short: "RUN 🏃🏾‍♂️💨" },
];
const SELF_LOVE = { emoji: "💯", color: "#00c46a", verdict: "Self-love na the best love!", sub: "You test yourself with yourself? Respect. Nobody fit love you pass you. 👑", short: "Self-love 💯" };

const $ = (sel) => document.querySelector(sel);
const views = { form: $("#form-view"), mining: $("#mining-view"), result: $("#result-view") };
let current = null; // { a, b, input, hash, score, tier }

// ── Core: the "blockchain" maths ──────────────────────────────────────────
const normalize = (name) => name.trim().replace(/\s+/g, " ").toLowerCase();
const display = (name) => name.trim().replace(/\s+/g, " ").replace(/\b\p{L}/gu, (c) => c.toUpperCase());

function compute(rawA, rawB) {
  const input = [normalize(rawA), normalize(rawB)].sort().join("|");
  const hash = "0x" + window.keccak256(input);
  const score = parseInt(hash.slice(2, 6), 16) % 101;
  const self = normalize(rawA) === normalize(rawB);
  const tier = self ? SELF_LOVE : TIERS.find((t) => score >= t.min);
  return { a: display(rawA), b: display(rawB), input, hash, score: self ? 100 : score, tier };
}

// ── Views ─────────────────────────────────────────────────────────────────
function show(name) {
  for (const [key, el] of Object.entries(views)) el.hidden = key !== name;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function playMining(hash) {
  show("mining");
  const stream = $("#hash-stream");
  const hex = "0123456789abcdef";
  const duration = matchMedia("(prefers-reduced-motion: reduce)").matches ? 300 : 1800;
  const start = performance.now();
  await new Promise((resolve) => {
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const locked = Math.floor(progress * 64);
      let s = "0x" + hash.slice(2, 2 + locked);
      for (let i = locked; i < 64; i++) s += hex[(Math.random() * 16) | 0];
      stream.textContent = s;
      progress < 1 ? requestAnimationFrame(tick) : resolve();
    };
    requestAnimationFrame(tick);
  });
}

function renderResult(r) {
  current = r;
  const names = $("#result-names");
  names.replaceChildren(r.a, Object.assign(document.createElement("span"), { className: "amp", textContent: " ❤️ " }), r.b);

  $("#result-verdict").textContent = `${r.tier.emoji} ${r.tier.verdict}`;
  $("#result-sub").textContent = r.tier.sub;
  $("#proof-input").textContent = `"${r.input}"`;
  $("#proof-hash").textContent = r.hash;
  $("#seal-status").hidden = true;

  const ring = $("#score-ring");
  ring.style.setProperty("--ring", r.tier.color);
  ring.classList.remove("pop");
  void ring.offsetWidth;
  ring.classList.add("pop");

  const scoreEl = $("#result-score");
  const start = performance.now();
  const dur = 900;
  const step = (now) => {
    const t = Math.min((now - start) / dur, 1);
    const v = Math.round(r.score * (1 - Math.pow(1 - t, 3)));
    scoreEl.textContent = v;
    ring.style.setProperty("--p", v);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);

  show("result");
}

// ── Share links ───────────────────────────────────────────────────────────
function shareUrl(r) {
  const base = location.origin + location.pathname;
  // Hash fragment: never sent to any server.
  return `${base}#a=${encodeURIComponent(r.a)}&b=${encodeURIComponent(r.b)}`;
}

function shareText(r) {
  return [
    `💘 *The blockchain don talk!*`,
    ``,
    `${r.a} + ${r.b} = *${r.score}%*`,
    `${r.tier.short}`,
    ``,
    `No be me talk am o, na keccak256 🔐😂`,
    `Test you and your crush 👉 ${shareUrl(r)}`,
  ].join("\n");
}

function shareToWhatsApp() {
  if (!current) return;
  window.open(`https://wa.me/?text=${encodeURIComponent(shareText(current))}`, "_blank", "noopener");
}

// ── Status card (1080×1920 PNG for WhatsApp Status) ──────────────────────
function wrapLines(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

async function drawCard(r) {
  await document.fonts.ready;
  const c = $("#card-canvas");
  const ctx = c.getContext("2d");
  const W = c.width, H = c.height, F = "'Bricolage Grotesque', system-ui, sans-serif";

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#2a0a1c");
  bg.addColorStop(0.5, "#0b1a12");
  bg.addColorStop(1, "#063d24");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.font = `64px ${F}`;
  for (let i = 0; i < 18; i++) {
    ctx.globalAlpha = 0.12;
    ctx.fillText(["💘", "❤️", "💕", "🔐"][i % 4], (i * 197) % W, 120 + ((i * 331) % (H - 200)));
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = "center";

  ctx.fillStyle = "#a9c7b5";
  ctx.font = `500 44px ${F}`;
  ctx.fillText("🇳🇬 THE BLOCKCHAIN DON TALK", W / 2, 260);

  ctx.fillStyle = "#f4fff8";
  ctx.font = `800 96px ${F}`;
  let y = 440;
  for (const line of wrapLines(ctx, `${r.a} ❤️ ${r.b}`, W - 160)) { ctx.fillText(line, W / 2, y); y += 110; }

  // Ring
  const cx = W / 2, cy = y + 300, rad = 260;
  ctx.lineWidth = 44;
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = r.tier.color;
  ctx.beginPath(); ctx.arc(cx, cy, rad, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * r.score) / 100); ctx.stroke();

  ctx.fillStyle = "#f4fff8";
  ctx.font = `800 220px ${F}`;
  ctx.textBaseline = "middle";
  ctx.fillText(`${r.score}%`, cx, cy + 10);
  ctx.textBaseline = "alphabetic";

  y = cy + rad + 170;
  ctx.font = `800 72px ${F}`;
  ctx.fillStyle = r.tier.color;
  for (const line of wrapLines(ctx, `${r.tier.emoji} ${r.tier.verdict}`, W - 160)) { ctx.fillText(line, W / 2, y); y += 86; }

  y += 20;
  ctx.font = `500 46px ${F}`;
  ctx.fillStyle = "#cfe3d7";
  for (const line of wrapLines(ctx, r.tier.sub, W - 200)) { ctx.fillText(line, W / 2, y); y += 60; }

  ctx.font = `500 34px 'JetBrains Mono', monospace`;
  ctx.fillStyle = "#00c46a";
  ctx.fillText(`keccak256 ${r.hash.slice(0, 18)}…${r.hash.slice(-6)}`, W / 2, H - 260);

  ctx.font = `800 50px ${F}`;
  ctx.fillStyle = "#ffcc33";
  ctx.fillText("Test your own 👉 " + location.host, W / 2, H - 160);

  return new Promise((res) => c.toBlob(res, "image/png"));
}

async function saveForStatus() {
  if (!current) return;
  const btn = $("#save-status");
  btn.disabled = true;
  try {
    const blob = await drawCard(current);
    const file = new File([blob], `blockchain-don-talk-${current.score}.png`, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text: shareText(current) });
    } else {
      const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: file.name });
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }
  } catch (err) {
    if (err?.name !== "AbortError") console.error(err);
  } finally {
    btn.disabled = false;
  }
}

// ── On-chain seal (optional, needs a wallet) ─────────────────────────────
function sealStatus(html) {
  const el = $("#seal-status");
  el.innerHTML = html;
  el.hidden = false;
}

async function sealOnChain() {
  if (!current) return;
  if (!CONTRACT.address) {
    sealStatus("⛓️ The LoveSeal contract never deploy yet. Check the README to deploy am.");
    return;
  }
  if (!window.ethereum) {
    const deepLink = `https://metamask.app.link/dapp/${location.host}${location.pathname}${location.hash}`;
    sealStatus(`You need a crypto wallet for this one. <a href="${deepLink}">Open inside MetaMask</a> or Trust Wallet browser.`);
    return;
  }

  const btn = $("#seal-chain");
  btn.disabled = true;
  try {
    sealStatus("Connecting wallet…");
    const { ethers } = await import(ETHERS_URL);
    await window.ethereum.request({ method: "eth_requestAccounts" });
    await switchChain();
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT.address, ABI, signer);

    sealStatus("Confirm the transaction for your wallet 🙏🏾");
    const tx = await contract.seal(current.hash);
    sealStatus("Mining your love block… ⛏️");
    await tx.wait();

    const count = await contract.sealCount(current.hash);
    sealStatus(`✅ Sealed forever! This pair don seal ${count} time(s). <a href="${CONTRACT.explorer}/tx/${tx.hash}" target="_blank" rel="noopener">View transaction</a>`);
    loadTotal();
  } catch (err) {
    const msg = err?.code === "ACTION_REJECTED" || err?.code === 4001 ? "You cancel am. No wahala 😅" : "E no work this time. Try again small.";
    sealStatus(msg);
    console.error(err);
  } finally {
    btn.disabled = false;
  }
}

async function switchChain() {
  try {
    await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CONTRACT.chainHex }] });
  } catch (err) {
    if (err.code !== 4902) throw err;
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [{
        chainId: CONTRACT.chainHex,
        chainName: CONTRACT.chainName,
        rpcUrls: [CONTRACT.rpc],
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        blockExplorerUrls: [CONTRACT.explorer],
      }],
    });
  }
}

async function loadTotal() {
  if (!CONTRACT.address) return;
  try {
    const { ethers } = await import(ETHERS_URL);
    const contract = new ethers.Contract(CONTRACT.address, ABI, new ethers.JsonRpcProvider(CONTRACT.rpc));
    const total = await contract.totalSeals();
    $("#seal-total").textContent = `· ${total} love seals on-chain`;
  } catch { /* read-only counter is a nice-to-have */ }
}

// ── Wiring ────────────────────────────────────────────────────────────────
$("#love-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const a = $("#name-a").value, b = $("#name-b").value;
  if (!a.trim() || !b.trim()) return;
  const r = compute(a, b);
  $("#friend-banner").hidden = true;
  $("#try-again").textContent = "↺ Test another person";
  history.replaceState(null, "", `#a=${encodeURIComponent(r.a)}&b=${encodeURIComponent(r.b)}`);
  await playMining(r.hash);
  renderResult(r);
});

$("#share-wa").addEventListener("click", shareToWhatsApp);
$("#save-status").addEventListener("click", saveForStatus);
$("#seal-chain").addEventListener("click", sealOnChain);
$("#try-again").addEventListener("click", () => {
  history.replaceState(null, "", location.pathname);
  $("#name-b").value = "";
  show("form");
  $("#name-b").focus();
});

function spawnHearts() {
  const box = $(".hearts");
  const icons = ["💘", "❤️", "💕", "💚", "🤍"];
  for (let i = 0; i < 14; i++) {
    const s = document.createElement("span");
    s.textContent = icons[i % icons.length];
    s.style.left = `${Math.random() * 100}%`;
    s.style.fontSize = `${14 + Math.random() * 18}px`;
    s.style.animationDuration = `${9 + Math.random() * 10}s`;
    s.style.animationDelay = `${-Math.random() * 18}s`;
    box.appendChild(s);
  }
}

// Opened from a friend's WhatsApp link → show their result, then hook the visitor.
function boot() {
  spawnHearts();
  loadTotal();
  const params = new URLSearchParams(location.hash.slice(1));
  const a = params.get("a"), b = params.get("b");
  if (a && b) {
    const r = compute(a.slice(0, 24), b.slice(0, 24));
    renderResult(r);
    $("#friend-banner").textContent = `👀 Somebody test ${r.a} & ${r.b}. Your own nko?`;
    $("#friend-banner").hidden = false;
    $("#try-again").textContent = "😏 Test me and my crush";
    $("#try-again").addEventListener("click", () => { $("#name-a").value = ""; $("#name-a").focus(); }, { once: true });
  }
}
boot();
