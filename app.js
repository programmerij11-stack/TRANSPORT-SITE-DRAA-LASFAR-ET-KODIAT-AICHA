/* =========================================================
   Transport Draa Lasfar & Koudiat Aicha
   Gestion du personnel transporte (CMG / TECHSUB)
   Donnees: Firestore (temps reel) + import/export Excel
   ========================================================= */

let RECORDS = [];
let formModal = null;
let confirmModal = null;

/* Confirmation via modale interne (immunisee contre la suppression
   des boites de dialogue natives du navigateur, qui ferait echouer
   silencieusement confirm()). Retourne une Promise<boolean>. */
function askConfirm(message, okLabel) {
  return new Promise((resolve) => {
    const modalEl = el("confirmModal");
    el("confirmMessage").textContent = message;
    const okBtn = el("confirmOkBtn");
    okBtn.innerHTML = `<i class="bi bi-check-lg"></i> ${okLabel || "Confirmer"}`;
    let settled = false;
    const done = (val) => {
      if (settled) return;
      settled = true;
      okBtn.removeEventListener("click", onOk);
      modalEl.removeEventListener("hidden.bs.modal", onHide);
      resolve(val);
    };
    const onOk = () => { done(true); confirmModal.hide(); };
    const onHide = () => done(false);
    okBtn.addEventListener("click", onOk);
    modalEl.addEventListener("hidden.bs.modal", onHide);
    confirmModal.show();
  });
}

/* --- Dictionnaire des coordonnees (approximatives, Marrakech) --- */
const GEO = {
  "MHAMID BOUAAKAZ": [31.585, -8.055],
  "MHAMID": [31.583, -8.052],
  "MHAMID 10": [31.58, -8.05],
  "SIDI YOUSSEF BEN ALI": [31.6, -7.95],
  "SEV YSF BEN ALI": [31.6, -7.95],
  "BAB DOUKALA": [31.635, -8.005],
  "BAD DOUKALA": [31.635, -8.005],
  "TAMANSOURT": [31.7, -8.14],
  "SAADA": [31.66, -8.09],
  "JWAMAYA": [31.705, -8.145],
  "JWAMAAIA": [31.705, -8.145],
  "DOUAR AL ASKAR": [31.62, -8.09],
  "COCA": [31.62, -8.09],
  "DAR SALAM": [31.61, -8.03],
  "DAR ESSALAM": [31.61, -8.03],
  "KODIAT AICHA": [31.6, -8.02],
  "KOUDIAT AICHA": [31.6, -8.02],
  "KATARA": [31.6, -8.02],
  "AFAK": [31.63, -8.06],
  "MASSIRA": [31.64, -8.03],
  "MASSIRA 1": [31.64, -8.03],
  "MASSIRA 3": [31.645, -8.035],
  "DRAA LASFAR": [31.55, -8.16],
  // Zone Mhamid / sud-ouest
  "MHAMID 7": [31.586, -8.048],
  "MHAMID 9": [31.578, -8.058],
  "BOUAAKAZ": [31.588, -8.06],
  "FARANE TRAB": [31.59, -8.045],
  "GLACEMAR": [31.575, -8.043],
  "AZLI": [31.6, -8.04],
  "FKHARA": [31.605, -8.06],
  // Zone centre Marrakech
  "KANTRA": [31.63, -7.986],
  "ANBAR": [31.638, -7.99],
  "WILAYA": [31.626, -8.0],
  "JAMAA": [31.625, -7.989],
  "SOUK RBII": [31.642, -7.995],
  "MSALA": [31.62, -7.995],
  "OIL LIBYA": [31.648, -8.0],
  "DOHHA": [31.634, -7.978],
  "LIBRERAIE": [31.629, -7.992],
  "SIDI MBAREK": [31.622, -7.982],
  "KHALD": [31.645, -7.985],
  "NAKHIL": [31.655, -7.97],
  "INARA": [31.618, -8.005],
  "HAMAM MOGADOUR": [31.631, -7.996],
  "FERAILLE": [31.615, -7.998],
  "HANOUT LHEHDI": [31.627, -7.984],
  "PHARMACIE FERDAWSS": [31.64, -7.982],
  "CAFE FINJANE": [31.636, -7.988],
  "ECOLE MANFALOUTI": [31.633, -7.993],
  "BOULANGERIE AMAL": [31.637, -7.997],
  "MOSQEE AMINA": [31.643, -7.991],
  "SYBA": [31.612, -7.99],
  "NOHA": [31.608, -7.985],
  "JBILAT": [31.66, -7.99],
  "AZZOUZIA": [31.66, -8.03],
  "DOUAR": [31.62, -8.02],
  "REZEAU": [31.7, -8.135],
  // Zone Tamansourt
  "CHATR 2": [31.695, -8.13],
  "CHATR 4": [31.698, -8.138],
  "CHATR 5": [31.702, -8.142],
  "CHATR 6": [31.7, -8.148],
  "CHATR 7": [31.704, -8.15],
  "CHATR 8": [31.706, -8.146],
};

/* --- Destination finale commune : la mine de Draa Lasfar --- */
const MINE = {
  name: "Mine Draa Lasfar",
  coord: [31.71116466608541, -8.134161265753367],
};

const SAMPLE = [
  { nom: "LARHRISSI", prenom: "REDOUAN", lieuDepart: "AFAK", service: "EXTRACTION", trajet: "DAR SALAM", societe: "CMG", typeTransport: "BUS", qte: 1, poste: "3" },
  { nom: "ABAJBAJ", prenom: "ABDELLKABIR", lieuDepart: "AFAK", service: "Maintenance", trajet: "DAR SALAM", societe: "CMG", typeTransport: "MINI BUS", qte: 1, poste: "1" },
  { nom: "OUJADDOUR", prenom: "AHMED", lieuDepart: "DAR SALAM", service: "EXTRACTION", trajet: "DAR SALAM", societe: "CMG", typeTransport: "BUS", qte: 1, poste: "1" },
  { nom: "CHAKIRI", prenom: "MOHAMMED", lieuDepart: "AFAK", service: "DSN", trajet: "MHAMID 10", societe: "CMG", typeTransport: "MINI BUS", qte: 1, poste: "2" },
  { nom: "LADIB", prenom: "MOHAMED", lieuDepart: "MASSIRA 3", service: "Maintenance", trajet: "COCA", societe: "CMG", typeTransport: "MINI BUS", qte: 1, poste: "2" },
  { nom: "OUMHIND", prenom: "ABDELAZIZ", lieuDepart: "CHATR 6", service: "MAINTENANCE", trajet: "TAMANSOURT", societe: "CMG", typeTransport: "MINI BUS", qte: 1, poste: "3" },
  { nom: "AIT AISSA", prenom: "LAHCEN", lieuDepart: "MOSQEE AMINA", service: "EXTRACTION", trajet: "TAMANSOURT", societe: "CMG", typeTransport: "MINI BUS", qte: 1, poste: "2" },
  { nom: "BEN TALEB", prenom: "SAID", lieuDepart: "MASSIRA 1", service: "TECHSUB", trajet: "COCA", societe: "TECHSUB", typeTransport: "BUS", qte: 1, poste: "3" },
];

/* --- Helpers --- */
const norm = (s) => (s || "").toString().trim().toUpperCase()
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const el = (id) => document.getElementById(id);
const typeClass = (t) => {
  const n = norm(t);
  if (n.includes("MINI")) return "t-minibus";
  if (n.includes("BUS")) return "t-bus";
  return "t-car";
};

function setStatus(txt, ok = true) {
  const s = el("fbStatus");
  s.innerHTML = `<i class="bi ${ok ? "bi-cloud-check" : "bi-cloud-slash"}"></i> ${txt}`;
  s.style.display = "block";
}

/* --- Firestore temps reel --- */
function listen() {
  db.collection(COLLECTION).onSnapshot(
    (snap) => {
      RECORDS = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      RECORDS.sort((a, b) =>
        (norm(a.lieuDepart) + norm(a.nom)).localeCompare(norm(b.lieuDepart) + norm(b.nom)),
      );
      el("loadingOverlay").style.display = "none";
      setStatus("Synchronise");
      renderAll();
    },
    (err) => {
      console.error(err);
      el("loadingOverlay").style.display = "none";
      setStatus("Hors-ligne", false);
    },
  );
}

/* --- Rendu global --- */
function renderAll() {
  el("countBadge").textContent = RECORDS.length;
  buildFilterOptions();
  renderTable();
  renderDashboard();
  renderLignes();
  renderCartes();
  if (el("carte").classList.contains("active")) renderMap();
}

/* --- Filtres --- */
function uniq(field) {
  return [...new Set(RECORDS.map((r) => (r[field] || "").toString().trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
}
function fillSelect(sel, values, placeholder) {
  const cur = sel.value;
  sel.innerHTML = `<option value="">${placeholder}</option>` +
    values.map((v) => `<option>${v}</option>`).join("");
  if (values.includes(cur)) sel.value = cur;
}
function buildFilterOptions() {
  fillSelect(el("fDepart"), uniq("lieuDepart"), "Lieu depart");
  fillSelect(el("fTrajet"), uniq("trajet"), "Trajet");
  fillSelect(el("fType"), uniq("typeTransport"), "Type transport");
  fillSelect(el("fPoste"), uniq("poste"), "Poste");
  fillSelect(el("cartesDepart"), uniq("lieuDepart"), "Tous les departs");
  const put = (id, vals) => (el(id).innerHTML = vals.map((v) => `<option value="${v}">`).join(""));
  put("dl_depart", uniq("lieuDepart"));
  put("dl_service", uniq("service"));
  put("dl_trajet", uniq("trajet"));
  put("dl_societe", uniq("societe").concat(["CMG", "TECHSUB"]));
}
function resetFilters() {
  ["q", "fDepart", "fTrajet", "fType", "fPoste"].forEach((id) => (el(id).value = ""));
  renderTable();
}
function filtered() {
  const q = norm(el("q").value);
  const fd = el("fDepart").value, ft = el("fTrajet").value,
        fty = el("fType").value, fp = el("fPoste").value;
  return RECORDS.filter((r) => {
    if (fd && r.lieuDepart !== fd) return false;
    if (ft && r.trajet !== ft) return false;
    if (fty && r.typeTransport !== fty) return false;
    if (fp && (r.poste || "").toString() !== fp) return false;
    if (q && !(norm(r.nom) + " " + norm(r.prenom)).includes(q)) return false;
    return true;
  });
}

/* --- Table personnel --- */
function renderTable() {
  const rows = filtered();
  if (!rows.length) {
    el("tbody").innerHTML = `<tr><td colspan="10" class="text-center py-4" style="color:#7fae91">
      Aucun agent. <button class="btn btn-sm btn-primary ms-2 edit-only" onclick="openForm()">Ajouter</button>
      ${RECORDS.length ? "" : `<button class="btn btn-sm btn-outline-light ms-2 edit-only" onclick="loadSamples()">Charger des exemples</button>`}
      </td></tr>`;
    return;
  }
  el("tbody").innerHTML = rows.map((r) => `
    <tr>
      <td class="fw-semibold">${r.nom || ""}</td>
      <td>${r.prenom || ""}</td>
      <td>${r.lieuDepart || ""}</td>
      <td>${r.service || ""}</td>
      <td>${r.trajet || ""}</td>
      <td>${r.societe || ""}</td>
      <td><span class="badge-t ${typeClass(r.typeTransport)}">${r.typeTransport || ""}</span></td>
      <td>${r.qte ?? ""}</td>
      <td>${r.poste ?? ""}</td>
      <td class="text-end text-nowrap edit-only">
        <button class="btn btn-sm btn-outline-light" onclick="editRec('${r.id}')"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-outline-danger" onclick="delRec('${r.id}')"><i class="bi bi-trash"></i></button>
      </td>
    </tr>`).join("");
}

/* --- Dashboard --- */
function bar(label, value, max, color) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return `<div class="mb-2">
    <div class="d-flex justify-content-between small"><span>${label}</span><span class="fw-semibold">${value}</span></div>
    <div style="background:#08120c;border-radius:.5rem;height:10px;overflow:hidden">
      <div style="width:${pct}%;height:100%;background:${color}"></div></div></div>`;
}
function groupCount(field) {
  const m = {};
  RECORDS.forEach((r) => { const k = (r[field] || "—").toString().trim() || "—"; m[k] = (m[k] || 0) + 1; });
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
}
function renderDashboard() {
  const total = RECORDS.length;
  const mini = RECORDS.filter((r) => norm(r.typeTransport).includes("MINI")).length;
  const bus = RECORDS.filter((r) => {
    const t = norm(r.typeTransport);
    return t.startsWith("BUS") && !t.includes("MINI");
  }).length;
  const departs = uniq("lieuDepart").length;
  const trajets = uniq("trajet").length;
  const kpi = [
    ["bi-people-fill", total, "Agents"],
    ["bi-signpost-2", departs, "Lieux de depart"],
    ["bi-geo-alt-fill", trajets, "Trajets"],
    ["bi-bus-front", bus, "Bus"],
    ["bi-truck-front", mini, "Mini bus"],
  ];
  el("kpis").innerHTML = kpi.map(([ic, v, l]) => `
    <div class="col-6 col-md-4 col-xl-3">
      <div class="kpi-card"><div class="kpi-value"><i class="bi ${ic}"></i> ${v}</div>
      <div class="kpi-label">${l}</div></div></div>`).join("");

  const gt = groupCount("trajet"); const mt = Math.max(1, ...gt.map((x) => x[1]));
  el("byTrajet").innerHTML = gt.map(([k, v]) => bar(k, v, mt, "linear-gradient(90deg,#22c55e,#16a34a)")).join("")
    || `<p class="text-muted small mb-0">Aucune donnee</p>`;
  const gy = groupCount("typeTransport"); const my = Math.max(1, ...gy.map((x) => x[1]));
  el("byType").innerHTML = gy.map(([k, v]) => bar(k, v, my, "linear-gradient(90deg,#3b82f6,#2563eb)")).join("")
    || `<p class="text-muted small mb-0">Aucune donnee</p>`;
}

/* --- Departs & Lignes ---
   Chaque bus / mini bus a sa propre ligne (depart -> regroupement -> mine),
   pour bien identifier les points de depart de chaque vehicule. */
function vehicleEmoji(type) {
  return norm(type).includes("MINI") ? "🚐" : "🚌";
}
function renderLignes() {
  const m = {};
  RECORDS.forEach((r) => {
    const type = r.typeTransport || "—";
    const key = `${r.lieuDepart || "—"}||${r.trajet || "—"}||${norm(type)}`;
    if (!m[key]) m[key] = { dep: r.lieuDepart || "—", dest: r.trajet || "—", type, count: 0, services: {} };
    m[key].count++;
    if (r.service) m[key].services[r.service] = (m[key].services[r.service] || 0) + 1;
  });
  const list = Object.values(m).sort((a, b) =>
    (norm(a.dep) + norm(a.type)).localeCompare(norm(b.dep) + norm(b.type)));
  el("lignesGrid").innerHTML = list.map((g) => `
    <div class="col-md-6 col-xl-4">
      <div class="line-card">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <div class="dep"><i class="bi bi-geo-alt-fill text-success"></i> ${g.dep}</div>
            <div style="color:#7fae91;font-size:.85rem"><i class="bi bi-arrow-right"></i> ${g.dest}</div>
            <div style="color:#f59e0b;font-size:.8rem"><i class="bi bi-flag-fill"></i> Arrivée : ${MINE.name}</div>
          </div>
          <span class="badge-t ${typeClass(g.type)}">${vehicleEmoji(g.type)} ${g.type}</span>
        </div>
        <div class="mt-2">
          <span class="chip">${g.count} agents</span>
          ${Object.keys(g.services).slice(0, 6).map((s) => `<span class="chip">${s}</span>`).join("")}
        </div>
      </div>
    </div>`).join("") || `<p class="text-muted">Aucune ligne. Ajoutez des agents.</p>`;
}

/* --- Cartes de transport (format carte nationale) --- */
const esc = (s) => (s ?? "").toString()
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function cardInitials(r) {
  const i = ((r.nom || "").trim()[0] || "") + ((r.prenom || "").trim()[0] || "");
  return i.toUpperCase() || "?";
}
function matricule(r) {
  return (r.id || "").toString().replace(/[^a-z0-9]/gi, "").slice(-6).toUpperCase().padStart(6, "0");
}
function cartesFiltered() {
  const q = norm(el("cartesQ").value);
  const fd = el("cartesDepart").value;
  return RECORDS.filter((r) => {
    if (fd && r.lieuDepart !== fd) return false;
    if (q && !(norm(r.nom) + " " + norm(r.prenom)).includes(q)) return false;
    return true;
  });
}
function renderCartes() {
  const rows = cartesFiltered();
  el("cartesCount").textContent = rows.length;
  el("cartesGrid").innerHTML = rows.map((r) => `
    <div class="col-cart" data-id="${esc(r.id)}">
      <div class="tcard">
        <div class="tcard-head">
          <div class="tcard-title"><i class="bi bi-bus-front"></i> CARTE DE TRANSPORT</div>
          <div class="tcard-soc">${esc(r.societe) || "—"}</div>
        </div>
        <div class="tcard-body">
          <div class="tcard-photo">${esc(cardInitials(r))}</div>
          <div class="tcard-fields">
            <div><b>Nom</b> : ${esc(r.nom) || "—"}</div>
            <div><b>Prénom</b> : ${esc(r.prenom) || "—"}</div>
            <div><b>Départ</b> : ${esc(r.lieuDepart) || "—"}</div>
            <div><b>Trajet</b> : ${esc(r.trajet) || "—"} → Mine Draa Lasfar</div>
            <div><b>Transport</b> : ${esc(r.typeTransport) || "—"} · <b>Poste</b> ${esc(r.poste) || "—"}</div>
          </div>
        </div>
        <div class="tcard-foot">
          <span class="mat">N° ${matricule(r)}</span>
          <span>Draa Lasfar &amp; Koudiat Aicha</span>
        </div>
      </div>
      <button class="btn btn-sm btn-outline-light w-100 mt-2 no-print" onclick="printOne('${esc(r.id)}')">
        <i class="bi bi-printer"></i> Imprimer
      </button>
    </div>`).join("") || `<p class="text-muted">Aucun agent. Ajoutez ou importez des agents.</p>`;
}
function printAllCartes() {
  document.body.classList.remove("print-one");
  window.print();
}
function printOne(id) {
  document.querySelectorAll(".col-cart").forEach((c) => c.classList.toggle("print-target", c.dataset.id === id));
  document.body.classList.add("print-one");
  window.print();
}
window.addEventListener("afterprint", () => document.body.classList.remove("print-one"));

/* --- Carte --- */
let map = null, layer = null;
let vehicles = [];          // { marker, path, t, speed }
let animId = null, animOn = true;

function vehicleIcon(type) {
  const n = norm(type);
  const emoji = n.includes("MINI") ? "🚐" : "🚌";
  return L.divIcon({
    className: "veh-icon",
    html: `<div style="font-size:22px;line-height:22px;filter:drop-shadow(0 0 3px #000)">${emoji}</div>`,
    iconSize: [24, 24], iconAnchor: [12, 12],
  });
}
function mineIcon() {
  return L.divIcon({
    className: "mine-icon",
    html: `<div style="font-size:26px;line-height:26px;filter:drop-shadow(0 0 4px #000)">⛏️</div>`,
    iconSize: [28, 28], iconAnchor: [14, 14],
  });
}
function lerp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
function segDist(a, b) { const dx = a[0] - b[0], dy = a[1] - b[1]; return Math.sqrt(dx * dx + dy * dy); }

/* Position sur un trajet multi-segments (depart -> ... -> mine) selon t (0..1) */
function pointOnPath(path, t) {
  if (path.length < 2) return path[0];
  const segs = []; let total = 0;
  for (let i = 1; i < path.length; i++) { const d = segDist(path[i - 1], path[i]); segs.push(d); total += d; }
  if (total === 0) return path[0];
  let target = t * total;
  for (let i = 0; i < segs.length; i++) {
    if (target <= segs[i]) return lerp(path[i], path[i + 1], segs[i] ? target / segs[i] : 0);
    target -= segs[i];
  }
  return path[path.length - 1];
}

function animateStep() {
  vehicles.forEach((v) => {
    v.t += v.speed;
    if (v.t >= 1) v.t = 0;               // boucle : repart du depart
    v.marker.setLatLng(pointOnPath(v.path, v.t));
  });
  animId = requestAnimationFrame(animateStep);
}
function startAnim() {
  if (animId) cancelAnimationFrame(animId);
  if (animOn && vehicles.length) animId = requestAnimationFrame(animateStep);
}
function toggleAnim() {
  animOn = !animOn;
  el("animToggle").innerHTML = animOn
    ? '<i class="bi bi-pause-fill"></i> Animation'
    : '<i class="bi bi-play-fill"></i> Animation';
  if (animOn) startAnim(); else if (animId) { cancelAnimationFrame(animId); animId = null; }
}

function buildTrajetSelect() {
  const sel = el("mapTrajet"); if (!sel) return;
  const cur = sel.value;
  const vals = uniq("trajet");
  sel.innerHTML = `<option value="">Tous les trajets</option>` +
    vals.map((v) => `<option>${v}</option>`).join("");
  if (vals.includes(cur)) sel.value = cur;
}

function renderMap() {
  if (!map) {
    map = L.map("map").setView([31.63, -8.03], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);
  }
  buildTrajetSelect();
  if (animId) { cancelAnimationFrame(animId); animId = null; }
  vehicles = [];
  if (layer) layer.remove();
  layer = L.layerGroup().addTo(map);

  const only = el("mapTrajet") ? el("mapTrajet").value : "";
  const recs = only ? RECORDS.filter((r) => r.trajet === only) : RECORDS;

  // Regroupe par (depart -> regroupement) et par vehicule (bus / mini bus)
  const pairs = {};
  recs.forEach((r) => {
    const key = `${norm(r.lieuDepart)}||${norm(r.trajet)}||${norm(r.typeTransport)}`;
    if (!pairs[key]) {
      pairs[key] = {
        dep: GEO[norm(r.lieuDepart)], via: GEO[norm(r.trajet)],
        depName: r.lieuDepart, viaName: r.trajet,
        type: r.typeTransport, count: 0,
      };
    }
    pairs[key].count++;
  });

  const bounds = [MINE.coord];
  const seen = new Set();
  Object.values(pairs).forEach((p) => {
    if (p.dep) {
      // Trajet : 1er depart -> (point de regroupement) -> mine de Draa Lasfar
      const path = [p.dep];
      if (p.via && (p.via[0] !== p.dep[0] || p.via[1] !== p.dep[1])) path.push(p.via);
      path.push(MINE.coord);
      L.polyline(path, {
        color: norm(p.type).includes("MINI") ? "#22c55e" : "#3b82f6",
        weight: 3, opacity: .55, dashArray: "6 6",
      }).addTo(layer);
      // vehicule anime, du depart jusqu'a la mine
      const m = L.marker(p.dep, { icon: vehicleIcon(p.type) })
        .bindTooltip(`${p.depName} → ${p.viaName} → ${MINE.name} (${p.count})`).addTo(layer);
      vehicles.push({ marker: m, path, t: Math.random(), speed: 0.0016 + Math.random() * 0.0012 });
      bounds.push(...path);
    }
    if (p.dep && !seen.has(p.depName)) {
      seen.add(p.depName);
      L.circleMarker(p.dep, { radius: 7, color: "#fff", weight: 2, fillColor: "#3b82f6", fillOpacity: 1 })
        .bindPopup(`<b>${p.depName}</b><br><small>Départ</small>`).addTo(layer);
      bounds.push(p.dep);
    }
    if (p.via && !seen.has(p.viaName)) {
      seen.add(p.viaName);
      L.circleMarker(p.via, { radius: 6, color: "#fff", weight: 2, fillColor: "#ef4444", fillOpacity: 1 })
        .bindPopup(`<b>${p.viaName}</b><br><small>Regroupement</small>`).addTo(layer);
      bounds.push(p.via);
    }
  });

  // Point d'arrivee commun : la mine de Draa Lasfar
  L.marker(MINE.coord, { icon: mineIcon() })
    .bindPopup(`<b>${MINE.name}</b><br><small>Arrivée</small>`).addTo(layer);

  if (bounds.length) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  setTimeout(() => map.invalidateSize(), 100);
  startAnim();
}

/* --- CRUD --- */
function openForm() {
  if (!requireEditor()) return;
  el("formTitle").textContent = "Ajouter un agent";
  ["f_id", "f_nom", "f_prenom", "f_lieuDepart", "f_service", "f_trajet"].forEach((id) => (el(id).value = ""));
  el("f_societe").value = "CMG"; el("f_typeTransport").value = "BUS";
  el("f_qte").value = 1; el("f_poste").value = "1";
  formModal.show();
}
function editRec(id) {
  if (!requireEditor()) return;
  const r = RECORDS.find((x) => x.id === id); if (!r) return;
  el("formTitle").textContent = "Modifier un agent";
  el("f_id").value = r.id;
  el("f_nom").value = r.nom || ""; el("f_prenom").value = r.prenom || "";
  el("f_lieuDepart").value = r.lieuDepart || ""; el("f_service").value = r.service || "";
  el("f_trajet").value = r.trajet || ""; el("f_societe").value = r.societe || "CMG";
  el("f_typeTransport").value = r.typeTransport || "BUS";
  el("f_qte").value = r.qte ?? 1; el("f_poste").value = (r.poste ?? "1").toString();
  formModal.show();
}
async function saveForm() {
  if (!requireEditor()) return;
  const data = {
    nom: el("f_nom").value.trim(),
    prenom: el("f_prenom").value.trim(),
    lieuDepart: el("f_lieuDepart").value.trim(),
    service: el("f_service").value.trim(),
    trajet: el("f_trajet").value.trim(),
    societe: el("f_societe").value.trim(),
    typeTransport: el("f_typeTransport").value,
    qte: Number(el("f_qte").value) || 1,
    poste: el("f_poste").value,
    updatedAt: Date.now(),
  };
  if (!data.nom && !data.prenom) { alert("Renseignez au moins le nom ou le prenom."); return; }
  const id = el("f_id").value;
  try {
    if (id) await db.collection(COLLECTION).doc(id).update(data);
    else await db.collection(COLLECTION).add({ ...data, createdAt: Date.now() });
    formModal.hide();
  } catch (e) { alert("Erreur: " + e.message); }
}
async function delRec(id) {
  if (!requireEditor()) return;
  const r = RECORDS.find((x) => x.id === id);
  if (!(await askConfirm(`Supprimer ${r ? r.nom + " " + r.prenom : "cet agent"} ?`, "Supprimer"))) return;
  try {
    await db.collection(COLLECTION).doc(id).delete();
    RECORDS = RECORDS.filter((x) => x.id !== id);
    renderAll();
    setStatus("Agent supprime");
  } catch (e) { alert("Erreur: " + e.message); }
}

/* --- Exemples --- */
async function loadSamples() {
  if (!requireEditor()) return;
  if (!confirm("Charger " + SAMPLE.length + " agents d'exemple ?")) return;
  const batch = db.batch();
  SAMPLE.forEach((s) => batch.set(db.collection(COLLECTION).doc(), { ...s, createdAt: Date.now() }));
  await batch.commit();
}

/* --- Vider toute la liste --- */
async function clearAll() {
  if (!requireEditor()) return;
  if (!RECORDS.length) { alert("La liste est deja vide."); return; }
  if (!(await askConfirm(`Supprimer DEFINITIVEMENT les ${RECORDS.length} agents ? Cette action est irreversible.`, "Tout supprimer"))) return;
  setStatus("Suppression en cours...");
  try {
    const ids = RECORDS.map((r) => r.id);
    for (let i = 0; i < ids.length; i += 400) {
      const batch = db.batch();
      ids.slice(i, i + 400).forEach((id) => batch.delete(db.collection(COLLECTION).doc(id)));
      await batch.commit();
    }
    RECORDS = [];
    renderAll();
    setStatus("Synchronise");
    alert("Liste videe.");
  } catch (e) { alert("Erreur: " + e.message); }
}

/* --- Import Excel --- */
const HEADER_MAP = {
  NOM: "nom", PRENOM: "prenom", "LIEU DEPART": "lieuDepart", "LIEU DE DEPART": "lieuDepart",
  SERVICE: "service", TRAJET: "trajet", SOCIETE: "societe", "TYPE TRANSPORT": "typeTransport",
  QTE: "qte", POSTE: "poste", "POSTE/SERVICE": "posteService",
};
function mapRow(row) {
  const out = {};
  Object.keys(row).forEach((k) => {
    const key = HEADER_MAP[norm(k)];
    if (key) out[key] = row[k];
  });
  out.nom = (out.nom || "").toString().trim();
  out.prenom = (out.prenom || "").toString().trim();
  out.qte = Number(out.qte) || 1;
  out.poste = (out.poste ?? "").toString().trim();
  out.typeTransport = (out.typeTransport || "").toString().trim().toUpperCase();
  return out;
}
// Detecte la ligne d'en-tete (celle qui contient NOM et PRENOM), meme si
// des lignes de titre / cellules fusionnees se trouvent au-dessus.
function rowsFromSheet(ws) {
  const grid = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  let hIdx = -1;
  for (let i = 0; i < Math.min(grid.length, 15); i++) {
    const cells = grid[i].map((c) => norm(c));
    if (cells.includes("NOM") && cells.includes("PRENOM")) { hIdx = i; break; }
  }
  if (hIdx === -1) return { rows: [], headers: (grid[0] || []).map(String) };
  const headers = grid[hIdx];
  const rows = grid.slice(hIdx + 1).map((arr) => {
    const o = {};
    headers.forEach((h, j) => { o[h] = arr[j] ?? ""; });
    return o;
  });
  return { rows, headers: headers.map(String) };
}
el("importFile").addEventListener("change", async (e) => {
  if (!requireEditor()) { e.target.value = ""; return; }
  const file = e.target.files[0]; if (!file) return;
  try {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const { rows, headers } = rowsFromSheet(ws);
    const mapped = rows.map(mapRow).filter((r) => r.nom || r.prenom);
    if (!mapped.length) {
      alert("Aucune ligne exploitable.\n\nColonnes detectees : " +
        (headers.filter(Boolean).join(", ") || "(aucune)") +
        "\n\nAssurez-vous d'avoir les colonnes NOM et PRENOM.");
      return;
    }
    if (!confirm(`Importer ${mapped.length} agents depuis "${file.name}" ?`)) return;
    setStatus("Import en cours...");
    for (let i = 0; i < mapped.length; i += 400) {
      const batch = db.batch();
      mapped.slice(i, i + 400).forEach((r) =>
        batch.set(db.collection(COLLECTION).doc(), { ...r, createdAt: Date.now() }));
      await batch.commit();
    }
    setStatus("Synchronise");
    alert("Import termine : " + mapped.length + " agents ajoutes.");
  } catch (err) { alert("Erreur d'import: " + err.message); }
  finally { e.target.value = ""; }
});

/* --- Export Excel (repli CSV si la librairie ne peut pas se charger) --- */
const EXPORT_COLS = [
  "NOM", "PRENOM", "LIEU DEPART", "SERVICE",
  "TRAJET", "SOCIETE", "TYPE TRANSPORT", "QTE", "POSTE",
];
function exportRows() {
  return filtered().map((r) => ({
    NOM: r.nom, PRENOM: r.prenom, "LIEU DEPART": r.lieuDepart, SERVICE: r.service,
    TRAJET: r.trajet, SOCIETE: r.societe, "TYPE TRANSPORT": r.typeTransport,
    QTE: r.qte, POSTE: r.poste,
  }));
}
function downloadBlob(content, filename, mime) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function exportCSV(data) {
  const escCsv = (v) => {
    const s = (v ?? "").toString();
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [EXPORT_COLS.join(";")].concat(
    data.map((r) => EXPORT_COLS.map((c) => escCsv(r[c])).join(";"))
  );
  // BOM UTF-8 pour qu'Excel affiche correctement les accents
  downloadBlob("\uFEFF" + lines.join("\r\n"), "transport-personnel.csv", "text/csv;charset=utf-8");
}
function exportExcel() {
  const data = exportRows();
  if (!data.length) {
    alert("Aucun agent a exporter. Ajoutez ou importez des agents d'abord.");
    return;
  }
  if (typeof XLSX !== "undefined" && XLSX.utils) {
    try {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Personnel");
      XLSX.writeFile(wb, "transport-personnel.xlsx");
      return;
    } catch (e) {
      console.warn("Export XLSX echoue, repli CSV:", e);
    }
  }
  // La librairie Excel n'a pas pu se charger (CDN bloque) : repli CSV lisible par Excel
  exportCSV(data);
  alert("La liste a ete exportee au format CSV (ouvrable dans Excel).\nLa librairie Excel (.xlsx) n'a pas pu etre chargee.");
}

/* ===== Suivi GPS (temps reel) ===== */
const POSITIONS = "transport_positions";
const GPS_ACTIVE_MS = 2 * 60 * 1000;
let gpsMap = null, gpsMarkers = {}, gpsUnsub = null, gpsData = [], gpsTick = null, gpsFitDone = false;

function gpsIcon(type, active) {
  const emoji = norm(type).includes("MINI") ? "🚐" : "🚌";
  return L.divIcon({
    className: "veh-icon",
    html: `<div style="font-size:24px;line-height:24px;filter:drop-shadow(0 0 3px #000);opacity:${active ? 1 : .5}">${emoji}</div>`,
    iconSize: [26, 26], iconAnchor: [13, 13],
  });
}
function timeAgo(ts) {
  if (!ts) return "—";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return s + " s";
  const m = Math.floor(s / 60);
  if (m < 60) return m + " min";
  return Math.floor(m / 60) + " h";
}
function renderGps() {
  if (!gpsMap) {
    gpsMap = L.map("gpsMap").setView([31.63, -8.03], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
    }).addTo(gpsMap);
  }
  setTimeout(() => gpsMap.invalidateSize(), 100);
  if (!gpsUnsub) listenGps();
  drawGps();
}
function listenGps() {
  gpsUnsub = db.collection(POSITIONS).onSnapshot(
    (snap) => { gpsData = snap.docs.map((d) => ({ id: d.id, ...d.data() })); drawGps(); },
    (e) => console.error("GPS:", e),
  );
  if (!gpsTick) gpsTick = setInterval(drawGps, 15000); // rafraichit "actif" et "il y a X"
}
function drawGps() {
  const now = Date.now();
  let active = 0;
  const seen = new Set();
  const bounds = [];
  gpsData.forEach((p) => {
    if (typeof p.lat !== "number" || typeof p.lng !== "number") return;
    seen.add(p.id);
    const isActive = p.updatedAt && (now - p.updatedAt) < GPS_ACTIVE_MS;
    if (isActive) active++;
    bounds.push([p.lat, p.lng]);
    if (gpsMap) {
      if (gpsMarkers[p.id]) gpsMarkers[p.id].setLatLng([p.lat, p.lng]).setIcon(gpsIcon(p.type, isActive));
      else gpsMarkers[p.id] = L.marker([p.lat, p.lng], { icon: gpsIcon(p.type, isActive) }).addTo(gpsMap);
      gpsMarkers[p.id].bindTooltip(`${p.label || p.id} — ${timeAgo(p.updatedAt)}`);
    }
  });
  if (gpsMap) {
    Object.keys(gpsMarkers).forEach((id) => {
      if (!seen.has(id)) { gpsMap.removeLayer(gpsMarkers[id]); delete gpsMarkers[id]; }
    });
  }
  if (el("gpsActiveCount")) el("gpsActiveCount").textContent = active;
  const list = el("gpsList");
  if (list) {
    if (!gpsData.length) {
      list.innerHTML = `<p class="text-muted px-2" style="font-size:.85rem">Aucun véhicule ne partage sa position pour l'instant.</p>`;
    } else {
      list.innerHTML = gpsData.slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).map((p) => {
        const isActive = p.updatedAt && (now - p.updatedAt) < GPS_ACTIVE_MS;
        const emoji = norm(p.type).includes("MINI") ? "🚐" : "🚌";
        return `<div class="gps-item"><span class="gps-dot ${isActive ? "gps-on" : "gps-off"}"></span>
          <span style="font-size:1.1rem">${emoji}</span>
          <span style="flex:1"><b>${p.label || p.id}</b><br>
            <small style="color:#7fae91">${isActive ? "En ligne" : "Hors ligne"} · maj il y a ${timeAgo(p.updatedAt)}</small></span>
          <button class="btn btn-sm btn-outline-light" onclick="focusGps('${p.id}')"><i class="bi bi-crosshair"></i></button></div>`;
      }).join("");
    }
  }
  if (gpsMap && bounds.length && !gpsFitDone) { gpsMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 }); gpsFitDone = true; }
}
function focusGps(id) {
  const p = gpsData.find((x) => x.id === id);
  if (p && gpsMap && typeof p.lat === "number") {
    gpsMap.setView([p.lat, p.lng], 15);
    if (gpsMarkers[id]) gpsMarkers[id].openTooltip();
  }
}

/* --- Navigation --- */
document.querySelectorAll(".nav-link").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const id = btn.dataset.section;
    document.querySelectorAll(".section").forEach((s) => s.classList.remove("active"));
    el(id).classList.add("active");
    el("pageTitle").textContent = btn.textContent.trim();
    document.getElementById("sidebar").classList.remove("show");
    if (id === "carte") renderMap();
    if (id === "suivi") renderGps();
  });
});
["q", "fDepart", "fTrajet", "fType", "fPoste"].forEach((id) =>
  el(id).addEventListener("input", renderTable));
el("mapTrajet").addEventListener("change", renderMap);
el("cartesQ").addEventListener("input", renderCartes);
el("cartesDepart").addEventListener("change", renderCartes);

/* ===== Authentification & roles ===== */
let CURRENT_USER = null, CURRENT_ROLE = null, usersUnsub = null, appStarted = false;

function isEditor() { return CURRENT_ROLE === "editeur"; }

function requireEditor() {
  if (!isEditor()) { alert("Action réservée aux éditeurs. Votre compte est en lecture seule."); return false; }
  return true;
}

function applyRoleUI() {
  const editor = isEditor();
  document.body.classList.toggle("readonly", !editor);
  el("navUsers").style.display = editor ? "" : "none";
  el("userBox").style.setProperty("display", "flex", "important");
  el("userEmail").textContent = CURRENT_USER ? CURRENT_USER.email : "";
  const rb = el("userRole");
  rb.textContent = editor ? "Éditeur" : "Consultation";
  rb.className = "badge-t " + (editor ? "role-editeur" : "role-consultation");
}

function startAppData() {
  if (appStarted) return;
  appStarted = true;
  listen();
  if (isEditor()) listenUsers();
}

function guardAuth() {
  if (!auth) { el("loadingOverlay").style.display = "none"; alert("Authentification indisponible."); return; }
  auth.onAuthStateChanged(async (user) => {
    if (!user) { location.href = "login.html"; return; }
    try {
      const doc = await db.collection(USERS_COLLECTION).doc(user.uid).get();
      if (!doc.exists) { await auth.signOut(); location.href = "login.html?err=unauthorized"; return; }
      CURRENT_USER = user;
      CURRENT_ROLE = (doc.data().role === "editeur") ? "editeur" : "consultation";
      applyRoleUI();
      startAppData();
    } catch (e) {
      console.error("auth/role:", e);
      el("loadingOverlay").style.display = "none";
      alert("Erreur de vérification des droits : " + e.message);
    }
  });
}

async function doLogout() {
  try { if (usersUnsub) usersUnsub(); } catch (e) {}
  try { await auth.signOut(); } catch (e) {}
  location.href = "login.html?out=1";
}

/* --- Gestion des utilisateurs (editeurs) --- */
function listenUsers() {
  if (usersUnsub) return;
  usersUnsub = db.collection(USERS_COLLECTION).onSnapshot(
    (snap) => {
      const users = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      users.sort((a, b) => (a.email || "").localeCompare(b.email || ""));
      renderUsers(users);
    },
    (e) => console.error("users:", e),
  );
}
function renderUsers(users) {
  const body = el("usersBody"); if (!body) return;
  if (!users.length) { body.innerHTML = `<tr><td colspan="4" class="text-center py-3" style="color:#7fae91">Aucun utilisateur.</td></tr>`; return; }
  body.innerHTML = users.map((u) => {
    const ed = u.role === "editeur";
    const me = CURRENT_USER && u.id === CURRENT_USER.uid;
    const date = u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—";
    return `<tr>
      <td class="fw-semibold">${u.email || u.id}${me ? ' <span style="color:#7fae91">(vous)</span>' : ""}</td>
      <td><span class="badge-t ${ed ? "role-editeur" : "role-consultation"}">${ed ? "Éditeur" : "Consultation"}</span></td>
      <td>${date}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-danger" ${me ? "disabled title='Vous ne pouvez pas retirer votre propre accès'" : ""} onclick="delUser('${u.id}','${(u.email || "").replace(/'/g, "")}')"><i class="bi bi-trash"></i></button>
      </td></tr>`;
  }).join("");
}
async function addUser() {
  if (!requireEditor()) return;
  const email = el("u_email").value.trim();
  const pass = el("u_pass").value;
  const role = el("u_role").value === "editeur" ? "editeur" : "consultation";
  if (!email || pass.length < 6) { alert("Renseignez l'e-mail et un mot de passe d'au moins 6 caractères."); return; }
  let secondary = null;
  try {
    // App Firebase secondaire pour creer le compte sans deconnecter l'admin
    secondary = firebase.apps.find((a) => a.name === "userCreator") || firebase.initializeApp(firebaseConfig, "userCreator");
    const cred = await secondary.auth().createUserWithEmailAndPassword(email, pass);
    await db.collection(USERS_COLLECTION).doc(cred.user.uid).set({ email, role, createdAt: Date.now() });
    await secondary.auth().signOut();
    el("u_email").value = ""; el("u_pass").value = "";
    setStatus("Utilisateur cree");
    alert("Utilisateur créé : " + email + " (" + (role === "editeur" ? "Éditeur" : "Consultation") + ")");
  } catch (e) {
    let m = e.message;
    if ((e.code || "").includes("email-already-in-use")) m = "Cet e-mail est déjà utilisé.";
    if ((e.code || "").includes("weak-password")) m = "Mot de passe trop faible (6 caractères minimum).";
    if ((e.code || "").includes("invalid-email")) m = "Adresse e-mail invalide.";
    alert("Erreur : " + m);
  } finally {
    if (secondary) { try { await secondary.delete(); } catch (e) {} }
  }
}
async function delUser(uid, email) {
  if (!requireEditor()) return;
  if (CURRENT_USER && uid === CURRENT_USER.uid) { alert("Vous ne pouvez pas retirer votre propre accès."); return; }
  if (!(await askConfirm(`Retirer l'accès de ${email || uid} à l'application ?`, "Retirer"))) return;
  try {
    await db.collection(USERS_COLLECTION).doc(uid).delete();
    setStatus("Accès retiré");
  } catch (e) { alert("Erreur : " + e.message); }
}

/* --- Init --- */
window.addEventListener("DOMContentLoaded", () => {
  formModal = new bootstrap.Modal(el("formModal"));
  confirmModal = new bootstrap.Modal(el("confirmModal"));
  guardAuth();
  setTimeout(() => { if (el("loadingOverlay").style.display !== "none") el("loadingOverlay").style.display = "none"; }, 8000);
});
