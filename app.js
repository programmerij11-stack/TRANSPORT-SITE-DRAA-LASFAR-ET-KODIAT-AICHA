/* =========================================================
   Transport Draa Lasfar & Koudiat Aicha
   Gestion du personnel transporte (CMG / TECHSUB)
   Donnees: Firestore (temps reel) + import/export Excel
   ========================================================= */

let RECORDS = [];
let formModal = null;

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
      Aucun agent. <button class="btn btn-sm btn-primary ms-2" onclick="openForm()">Ajouter</button>
      ${RECORDS.length ? "" : `<button class="btn btn-sm btn-outline-light ms-2" onclick="loadSamples()">Charger des exemples</button>`}
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
      <td class="text-end text-nowrap">
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

/* --- Departs & Lignes --- */
function renderLignes() {
  const m = {};
  RECORDS.forEach((r) => {
    const key = `${r.lieuDepart || "—"}||${r.trajet || "—"}`;
    if (!m[key]) m[key] = { dep: r.lieuDepart || "—", dest: r.trajet || "—", count: 0, types: {}, services: {} };
    m[key].count++;
    const t = r.typeTransport || "—"; m[key].types[t] = (m[key].types[t] || 0) + 1;
    if (r.service) m[key].services[r.service] = (m[key].services[r.service] || 0) + 1;
  });
  const list = Object.values(m).sort((a, b) => b.count - a.count);
  el("lignesGrid").innerHTML = list.map((g) => `
    <div class="col-md-6 col-xl-4">
      <div class="line-card">
        <div class="d-flex justify-content-between align-items-start">
          <div><div class="dep"><i class="bi bi-geo-alt-fill text-success"></i> ${g.dep}</div>
          <div style="color:#7fae91;font-size:.85rem"><i class="bi bi-arrow-right"></i> ${g.dest}</div></div>
          <span class="badge-t t-minibus">${g.count} agents</span>
        </div>
        <div class="mt-2">
          ${Object.entries(g.types).map(([t, c]) => `<span class="chip">${t}: ${c}</span>`).join("")}
        </div>
        <div class="mt-2" style="font-size:.78rem;color:#8fb7a1">
          ${Object.keys(g.services).slice(0, 6).join(" · ") || ""}
        </div>
      </div>
    </div>`).join("") || `<p class="text-muted">Aucune ligne. Ajoutez des agents.</p>`;
}

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
function lerp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }

function animateStep() {
  vehicles.forEach((v) => {
    v.t += v.speed;
    if (v.t >= 1) v.t = 0;               // boucle : repart du depart
    v.marker.setLatLng(lerp(v.path[0], v.path[1], v.t));
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

  // Regroupe par (depart -> destination)
  const pairs = {};
  recs.forEach((r) => {
    const key = `${norm(r.lieuDepart)}||${norm(r.trajet)}`;
    if (!pairs[key]) {
      pairs[key] = {
        dep: GEO[norm(r.lieuDepart)], dest: GEO[norm(r.trajet)],
        depName: r.lieuDepart, destName: r.trajet,
        type: r.typeTransport, count: 0,
      };
    }
    pairs[key].count++;
  });

  const bounds = [];
  const seen = new Set();
  Object.values(pairs).forEach((p) => {
    if (p.dep && p.dest) {
      L.polyline([p.dep, p.dest], {
        color: norm(p.type).includes("MINI") ? "#22c55e" : "#3b82f6",
        weight: 3, opacity: .55, dashArray: "6 6",
      }).addTo(layer);
      // vehicule anime sur ce trajet
      const m = L.marker(p.dep, { icon: vehicleIcon(p.type) })
        .bindTooltip(`${p.depName} → ${p.destName} (${p.count})`).addTo(layer);
      vehicles.push({ marker: m, path: [p.dep, p.dest], t: Math.random(), speed: 0.0016 + Math.random() * 0.0012 });
      bounds.push(p.dep, p.dest);
    }
    [["dep", "#3b82f6"], ["dest", "#ef4444"]].forEach(([k, col]) => {
      const c = p[k]; const nm = k === "dep" ? p.depName : p.destName;
      if (c && !seen.has(nm)) {
        seen.add(nm);
        L.circleMarker(c, { radius: k === "dest" ? 9 : 7, color: "#fff", weight: 2, fillColor: col, fillOpacity: 1 })
          .bindPopup(`<b>${nm}</b>`).addTo(layer);
        bounds.push(c);
      }
    });
  });

  if (bounds.length) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  setTimeout(() => map.invalidateSize(), 100);
  startAnim();
}

/* --- CRUD --- */
function openForm() {
  el("formTitle").textContent = "Ajouter un agent";
  ["f_id", "f_nom", "f_prenom", "f_lieuDepart", "f_service", "f_trajet"].forEach((id) => (el(id).value = ""));
  el("f_societe").value = "CMG"; el("f_typeTransport").value = "BUS";
  el("f_qte").value = 1; el("f_poste").value = "1";
  formModal.show();
}
function editRec(id) {
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
  const r = RECORDS.find((x) => x.id === id);
  if (!confirm(`Supprimer ${r ? r.nom + " " + r.prenom : "cet agent"} ?`)) return;
  try { await db.collection(COLLECTION).doc(id).delete(); }
  catch (e) { alert("Erreur: " + e.message); }
}

/* --- Exemples --- */
async function loadSamples() {
  if (!confirm("Charger " + SAMPLE.length + " agents d'exemple ?")) return;
  const batch = db.batch();
  SAMPLE.forEach((s) => batch.set(db.collection(COLLECTION).doc(), { ...s, createdAt: Date.now() }));
  await batch.commit();
}

/* --- Vider toute la liste --- */
async function clearAll() {
  if (!RECORDS.length) { alert("La liste est deja vide."); return; }
  if (!confirm(`Supprimer DEFINITIVEMENT les ${RECORDS.length} agents ?\nCette action est irreversible.`)) return;
  if (!confirm("Confirmer une derniere fois : tout supprimer ?")) return;
  setStatus("Suppression en cours...");
  try {
    const ids = RECORDS.map((r) => r.id);
    for (let i = 0; i < ids.length; i += 400) {
      const batch = db.batch();
      ids.slice(i, i + 400).forEach((id) => batch.delete(db.collection(COLLECTION).doc(id)));
      await batch.commit();
    }
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

/* --- Export Excel --- */
function exportExcel() {
  const data = filtered().map((r) => ({
    NOM: r.nom, PRENOM: r.prenom, "LIEU DEPART": r.lieuDepart, SERVICE: r.service,
    TRAJET: r.trajet, SOCIETE: r.societe, "TYPE TRANSPORT": r.typeTransport,
    QTE: r.qte, POSTE: r.poste,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Personnel");
  XLSX.writeFile(wb, "transport-personnel.xlsx");
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
  });
});
["q", "fDepart", "fTrajet", "fType", "fPoste"].forEach((id) =>
  el(id).addEventListener("input", renderTable));
el("mapTrajet").addEventListener("change", renderMap);

/* --- Init --- */
window.addEventListener("DOMContentLoaded", () => {
  formModal = new bootstrap.Modal(el("formModal"));
  listen();
  setTimeout(() => { if (el("loadingOverlay").style.display !== "none") el("loadingOverlay").style.display = "none"; }, 6000);
});
