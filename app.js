const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const $ = s => document.querySelector(s);
const CATS = {
  expense: ["Makan", "Transport", "Belanja", "Tagihan", "Hiburan", "Kesehatan", "Lainnya"],
  income: ["Gaji", "Bonus", "Usaha", "Lainnya"]
};
const ICON = { Makan:"🍜", Transport:"🚌", Belanja:"🛍️", Tagihan:"🧾", Hiburan:"🎬", Kesehatan:"💊", Gaji:"💼", Bonus:"🎁", Usaha:"🏪", Lainnya:"📦" };
const rp = n => "Rp " + Math.round(n).toLocaleString("id-ID");
const todayStr = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

let type = "expense", cat = null, txs = [];

/* ---------- Auth ---------- */
let authMode = "in";
document.querySelectorAll("#authForm button").forEach(b => b.onclick = () => authMode = b.dataset.mode);
$("#authForm").onsubmit = async e => {
  e.preventDefault();
  const msg = $("#authMsg"); msg.textContent = "Memproses…";
  const cred = { email: $("#email").value.trim(), password: $("#password").value };
  const { data, error } = authMode === "in"
    ? await db.auth.signInWithPassword(cred)
    : await db.auth.signUp(cred);
  if (error) msg.textContent = error.message;
  else if (authMode === "up" && !data.session) msg.textContent = "Pendaftaran berhasil. Cek email untuk konfirmasi, lalu masuk.";
  else msg.textContent = "";
};
$("#logout").onclick = () => db.auth.signOut();
db.auth.onAuthStateChange((_e, session) => showApp(!!session));
db.auth.getSession().then(({ data }) => showApp(!!data.session));

let loaded = false;
function showApp(on) {
  $("#auth").hidden = on; $("#app").hidden = !on;
  if (on && !loaded) { loaded = true; init(); }
  if (!on) { loaded = false; txs = []; }
}

/* ---------- UI ---------- */
function init() {
  $("#date").value = todayStr();
  $("#month").value = todayStr().slice(0, 7);
  renderChips(); load();
}
function renderChips() {
  const list = CATS[type];
  if (!list.includes(cat)) cat = null;
  $("#chips").innerHTML = list.map(c =>
    `<button type="button" role="radio" aria-checked="${c === cat}" data-c="${c}">${ICON[c] || ""} ${c}</button>`).join("");
}
$("#chips").onclick = e => { const b = e.target.closest("button"); if (b) { cat = b.dataset.c; renderChips(); } };
$("#typeSeg").onclick = e => {
  const b = e.target.closest("button"); if (!b) return;
  type = b.dataset.type;
  document.querySelectorAll("#typeSeg button").forEach(x => x.classList.toggle("on", x === b));
  renderChips();
};
$("#amount").oninput = e => {
  const d = e.target.value.replace(/\D/g, "").slice(0, 13);
  e.target.value = d ? Number(d).toLocaleString("id-ID") : "";
};
$("#month").onchange = render;

$("#quick").onsubmit = async e => {
  e.preventDefault();
  const msg = $("#qMsg");
  const amount = Number($("#amount").value.replace(/\D/g, ""));
  if (!amount) return (msg.textContent = "Masukkan nominal terlebih dahulu.");
  if (!cat) return (msg.textContent = "Pilih kategori.");
  msg.textContent = "Menyimpan…";
  const { error } = await db.from("transactions").insert({
    type, amount, category: cat,
    note: $("#note").value.trim() || null,
    occurred_on: $("#date").value || todayStr()
  });
  if (error) return (msg.textContent = "Gagal menyimpan: " + error.message);
  msg.textContent = "Tersimpan.";
  $("#amount").value = ""; $("#note").value = ""; $("#date").value = todayStr();
  cat = null; renderChips(); $("#amount").focus();
  load();
};

/* ---------- Data ---------- */
async function load() {
  const { data, error } = await db.from("transactions").select("*")
    .order("occurred_on", { ascending: false }).order("created_at", { ascending: false }).limit(5000);
  if (error) { $("#history").innerHTML = `<li class="empty">Gagal memuat data: ${esc(error.message)}</li>`; return; }
  txs = data; render();
}
async function del(id) {
  if (!confirm("Hapus transaksi ini?")) return;
  const { error } = await db.from("transactions").delete().eq("id", id);
  if (error) alert("Gagal menghapus: " + error.message); else load();
}
$("#history").onclick = e => { const b = e.target.closest(".del"); if (b) del(b.dataset.id); };

function render() {
  const m = $("#month").value;
  const sum = (arr, t) => arr.filter(x => x.type === t).reduce((s, x) => s + Number(x.amount), 0);
  const inMonth = txs.filter(x => x.occurred_on.startsWith(m));
  const inc = sum(inMonth, "income"), exp = sum(inMonth, "expense");
  $("#balance").textContent = rp(sum(txs, "income") - sum(txs, "expense"));
  $("#inc").textContent = rp(inc); $("#exp").textContent = rp(exp);

  const by = {};
  inMonth.filter(x => x.type === "expense").forEach(x => by[x.category] = (by[x.category] || 0) + Number(x.amount));
  const rows = Object.entries(by).sort((a, b) => b[1] - a[1]);
  $("#report").innerHTML = rows.length ? rows.map(([c, v]) =>
    `<div class="bar"><div><span>${esc(c)}</span><span>${rp(v)} · ${Math.round(v / exp * 100)}%</span></div><i style="width:${v / rows[0][1] * 100}%"></i></div>`
  ).join("") : `<p class="empty">Belum ada pengeluaran bulan ini.</p>`;

  $("#history").innerHTML = inMonth.length ? inMonth.map(x => {
    const d = new Date(x.occurred_on + "T00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    const isIn = x.type === "income";
    return `<li><span class="ico">${ICON[x.category] || "📦"}</span><div class="info"><b>${esc(x.category)}</b><small>${d}${x.note ? " · " + esc(x.note) : ""}</small></div>
      <b class="${isIn ? "pos" : "neg"}">${isIn ? "+" : "−"}${rp(x.amount)}</b>
      <button class="del" data-id="${x.id}" aria-label="Hapus">Hapus</button></li>`;
  }).join("") : `<li class="empty">Belum ada transaksi bulan ini. Catat yang pertama di atas.</li>`;
}
