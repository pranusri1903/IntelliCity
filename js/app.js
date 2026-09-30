// ═══════════════════════════════════════════════════════
//  UI LAYER — rendering, event handlers, simulation loop
// ═══════════════════════════════════════════════════════

// ─── UI HELPERS ───
function showView(name, evt) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
  const trigger = evt || window.event;
  if (trigger && trigger.currentTarget) trigger.currentTarget.classList.add('active');
  if (name === 'signals')    renderSignals();
  if (name === 'congestion') { updateCongestion(); renderJunctionEditor(); renderRoadEditor(); }
  if (name === 'vehicles')   renderVehicles();
  if (name === 'roads')      renderRoads();
  if (name === 'emergency')  renderEmergency();
  if (name === 'city-map')   renderCityMap();
  if (name === 'algorithms') renderAlgorithms();
  if (name === 'mst')        renderMST();
}

function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ─── POPULATE SELECTS ───
function populateSelects() {
  const selectIds = ['dijk-from','dijk-to','bfs-from','bfs-to','dfs-start','quick-from','quick-to','block-from','block-to'];
  selectIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = JUNCTIONS.map(j => `<option value="${j.id}">${j.id} — ${j.name}</option>`).join('');
  });
  document.getElementById('dijk-to').value = 14;
  document.getElementById('bfs-to').value  = 14;
}

// ─── ZONES (derived from data, not hardcoded) ───
const ZONE_COLORS = { Central:'#00e5ff', North:'#00e676', South:'#ff1744', East:'#ffea00', West:'#b39ddb' };
const ZONE_ORDER = ['Central', 'North', 'South', 'East', 'West'];

function getActiveZones() {
  const present = new Set(JUNCTIONS.map(j => j.zone));
  const ordered = ZONE_ORDER.filter(z => present.has(z));
  const extra = [...present].filter(z => !ZONE_ORDER.includes(z));
  return ordered.concat(extra);
}

function renderZoneLegend() {
  const el = document.getElementById('zone-legend');
  if (!el) return;
  el.innerHTML = getActiveZones().map(z =>
    `<span class="info-tag" style="color:${ZONE_COLORS[z] || 'var(--accent)'}">● ${z}</span>`
  ).join('') + `<span style="font-family:'Share Tech Mono',monospace; font-size:10px; color:var(--text-dim); align-self:center;">Click a junction to inspect</span>`;
}

// Stats that are constant for the lifetime of the page (vehicle/junction/zone
// counts never change at runtime) — computed once instead of hardcoded in
// the markup, so they can't drift out of sync with JUNCTIONS/VEHICLES.
function initStaticStats() {
  const zones = getActiveZones();
  const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };

  setText('dash-zones-active', `${zones.length} zones active`);

  const emergencyCount = VEHICLES.filter(v => EMERGENCY_TYPES.includes(v.type)).length;
  setText('dash-emergency-units', `${emergencyCount} emergency units`);

  const signalCount = JUNCTIONS.filter(j => j.hasSignal).length;
  const uncontrolled = JUNCTIONS.length - signalCount;
  setText('dash-signals-active', signalCount);
  setText('dash-signals-sub', `${uncontrolled} junction${uncontrolled === 1 ? '' : 's'} uncontrolled`);

  setText('header-junction-count', JUNCTIONS.length);
  setText('header-vehicle-count', VEHICLES.length);

  renderZoneLegend();
}

// ─── DASHBOARD ───
function renderDashboard() {
  const tb = document.getElementById('junction-table-body');
  tb.innerHTML = JUNCTIONS.map(j => {
    const cong = Math.round(
      (adj[j.id] || []).reduce((s, e) => s + e.cong, 0) / Math.max(1, (adj[j.id] || []).length)
    );
    return `<tr>
      <td style="font-family:'Share Tech Mono',monospace; color:var(--accent)">${j.id}</td>
      <td>${j.name}</td>
      <td><span class="zone-tag zone-${j.zone}">${j.zone}</span></td>
      <td>${j.vehicleCount}</td>
      <td>
        <div class="congestion-bar-wrap">
          <div class="congestion-bar"><div class="congestion-fill cong-${cong}" style="width:${cong*10}%"></div></div>
          <span style="font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--text-dim)">${cong}</span>
        </div>
      </td>
    </tr>`;
  }).join('');

  const sorted = [...ROADS_RAW].sort((a, b) => b.cong - a.cong).slice(0, 8);
  document.getElementById('road-congestion-body').innerHTML = sorted.map(r => {
    const cc = `cong-${r.cong}`;
    return `<tr>
      <td>${r.name}</td>
      <td>${jName(r.from)} → ${jName(r.to)}</td>
      <td>
        <div class="congestion-bar-wrap">
          <div class="congestion-bar"><div class="congestion-fill ${cc}" style="width:${r.cong*10}%"></div></div>
          <span style="font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--text-dim)">${r.cong}/10</span>
        </div>
      </td>
    </tr>`;
  }).join('');

  const zones = {};
  JUNCTIONS.forEach(j => {
    if (!zones[j.zone]) zones[j.zone] = { junctions: 0, vehicles: 0 };
    zones[j.zone].junctions++;
    zones[j.zone].vehicles += j.vehicleCount;
  });
  document.getElementById('zone-summary').innerHTML = getActiveZones().map(z => {
    const v = zones[z];
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(26,58,92,.3);">
      <span class="zone-tag zone-${z}">${z}</span>
      <span style="font-size:12px;">${v.junctions} junctions</span>
      <span style="font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--accent)">${v.vehicles} vehicles</span>
    </div>`;
  }).join('');

  const allCongs = ROADS_RAW.map(r => r.cong);
  const avg = (allCongs.reduce((a, b) => a + b, 0) / allCongs.length).toFixed(1);
  document.getElementById('dash-congestion').textContent = avg;
}

// ─── CITY MAP SVG ───
const MAP_POSITIONS = {
  0:  [450,290], // Central Hub
  1:  [450,100], // North Gate
  2:  [310,140], // North Market
  3:  [630,200], // East Park
  4:  [720,290], // East Station
  5:  [450,450], // South Plaza
  6:  [580,510], // South Hospital
  7:  [200,290], // West Junction
  8:  [170,400], // West Mall
  9:  [340,70],  // Airport Road
  10: [680,390], // University Square
  11: [360,510], // Industrial Zone
  12: [110,330], // Fire Station
  13: [520,250], // Police HQ
  14: [800,390], // Tech Park
};

function renderCityMap() {
  const svg = document.getElementById('city-map-svg');
  const drawn = new Set();   // dedupe by the underlying road object, not by
                             // junction pair — two parallel roads between
                             // the same junctions must both get drawn
  const pairCount = {};      // offsets successive parallel roads apart
  let edgesHTML = '', nodesHTML = '', labelsHTML = '', glowsHTML = '';

  JUNCTIONS.forEach(j => {
    (adj[j.id] || []).forEach(e => {
      if (drawn.has(e.road)) return;
      drawn.add(e.road);

      const [x1, y1] = MAP_POSITIONS[j.id];
      const [x2, y2] = MAP_POSITIONS[e.to];
      const pairKey = [Math.min(j.id, e.to), Math.max(j.id, e.to)].join('-');
      const offsetIdx = pairCount[pairKey] || 0;
      pairCount[pairKey] = offsetIdx + 1;

      const c = e.cong;
      const col = c >= 8 ? '#ff1744' : c >= 6 ? '#ff6d00' : c >= 4 ? '#ffea00' : '#1a3a5c';
      const glow = c >= 6 ? `filter:drop-shadow(0 0 4px ${col})` : '';
      const blocked = e.blocked;
      const strokeAttrs = `stroke="${blocked ? '#555' : col}" stroke-width="${blocked ? 1 : c >= 6 ? 2.5 : 1.5}"
        stroke-dasharray="${blocked ? '6,4' : ''}" opacity="${blocked ? 0.4 : 0.8}" fill="none" style="${glow}"`;

      let midX = (x1 + x2) / 2, midY = (y1 + y2) / 2;
      if (offsetIdx === 0) {
        edgesHTML += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${strokeAttrs}/>`;
      } else {
        const dx = x2 - x1, dy = y2 - y1;
        const len = Math.hypot(dx, dy) || 1;
        const px = -dy / len, py = dx / len;
        const bend = 22 * Math.ceil(offsetIdx / 2) * (offsetIdx % 2 === 1 ? 1 : -1);
        const cx = midX + px * bend, cy = midY + py * bend;
        edgesHTML += `<path d="M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}" ${strokeAttrs}/>`;
        midX = cx; midY = cy;
      }

      if (c > 0) {
        edgesHTML += `<text x="${midX}" y="${midY - 4}" fill="${col}" font-size="9" font-family="Share Tech Mono" text-anchor="middle" opacity="0.8">${c}</text>`;
      }
    });
  });

  JUNCTIONS.forEach(j => {
    const [x, y] = MAP_POSITIONS[j.id];
    const col = ZONE_COLORS[j.zone] || '#7a9ab8';
    const sig = signals[j.id];
    const sigCol = sig ? (sig.phase === 'GREEN' ? '#00e676' : sig.phase === 'YELLOW' ? '#ffea00' : '#ff1744') : '#555';
    const r = j.vehicleCount > 60 ? 18 : j.vehicleCount > 30 ? 14 : 11;

    glowsHTML += `<circle cx="${x}" cy="${y}" r="${r+8}" fill="${col}" opacity="0.06"/>`;
    nodesHTML += `<circle cx="${x}" cy="${y}" r="${r}" fill="#0a1628" stroke="${col}" stroke-width="2"
      onclick="inspectJunction(${j.id})" style="cursor:pointer" class="map-node">
      <title>${j.name} — ${j.zone}\nVehicles: ${j.vehicleCount}\nSignal: ${sig?sig.phase:'N/A'}</title>
    </circle>`;

    if (j.hasSignal) {
      nodesHTML += `<circle cx="${x+r-2}" cy="${y-r+2}" r="4" fill="${sigCol}" opacity="0.9"/>`;
    }

    nodesHTML += `<text x="${x}" y="${y+4}" fill="${col}" font-size="10" font-weight="bold"
      font-family="Share Tech Mono" text-anchor="middle" pointer-events="none">${j.id}</text>`;

    labelsHTML += `<text x="${x}" y="${y+r+13}" fill="#7a9ab8" font-size="8.5" font-family="Exo 2"
      text-anchor="middle" pointer-events="none">${j.name.split(' ')[0]}</text>`;
  });

  svg.innerHTML = `
    <defs>
      <filter id="glow"><feGaussianBlur stdDeviation="2" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    ${glowsHTML}${edgesHTML}${nodesHTML}${labelsHTML}`;
}

function inspectJunction(id) {
  const j = jMap[id];
  const sig = signals[id];
  const roads = adj[id] || [];
  const el = document.getElementById('junction-inspector');
  const ct = document.getElementById('inspector-content');
  el.style.display = 'block';
  ct.innerHTML = `
    <div style="font-family:'Rajdhani',sans-serif;font-size:16px;font-weight:700;color:var(--accent);margin-bottom:6px;">${j.name}</div>
    <div style="margin-bottom:8px;"><span class="zone-tag zone-${j.zone}">${j.zone}</span></div>
    <div style="font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--text-dim);line-height:1.8;">
      ID: <span style="color:var(--text)">${j.id}</span><br>
      Vehicles: <span style="color:var(--accent)">${j.vehicleCount}</span><br>
      Signal: <span style="color:${sig?'var(--green)':'var(--text-dim)'}">${j.hasSignal ? (sig?sig.phase:'N/A') : 'None'}</span><br>
      Connected: <span style="color:var(--text)">${roads.length} roads</span>
    </div>
    <div style="margin-top:8px;font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--text-dim);">CONNECTIONS:</div>
    ${roads.map(e=>`<div style="font-size:10px;padding:3px 0;border-bottom:1px solid rgba(26,58,92,.3);">${e.blocked?'🚧':'→'} ${jName(e.to)} <span style="color:var(--text-dim)">(${e.dist}m${e.blocked?', blocked':''})</span></div>`).join('')}
  `;
}

// ─── SIGNALS ───
function renderSignals() {
  const tb = document.getElementById('signal-table-body');
  const qg = document.getElementById('signal-quick-grid');
  const jWithSig = JUNCTIONS.filter(j => j.hasSignal);

  tb.innerHTML = jWithSig.map(j => {
    const s = signals[j.id];
    if (!s) return '';
    const pclass = s.phase.toLowerCase();
    return `<tr>
      <td><span style="font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--accent)">${j.id}</span> ${j.name}</td>
      <td><span class="zone-tag zone-${j.zone}">${j.zone}</span></td>
      <td><span class="signal-badge ${pclass}"><span class="signal-dot"></span>${s.phase}</span></td>
      <td>
        <div class="congestion-bar-wrap">
          <div class="congestion-bar"><div class="congestion-fill cong-${Math.round(s.density/10)}" style="width:${s.density}%"></div></div>
          <span style="font-family:'Share Tech Mono',monospace;font-size:10px;color:var(--text-dim)">${s.density}%</span>
        </div>
      </td>
      <td style="font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--green)">${s.green}s</td>
      <td style="font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--red)">${s.red}s</td>
      <td>${s.emergency ? '<span style="color:var(--red);font-size:10px;font-family:Share Tech Mono,monospace">OVERRIDE</span>' : '—'}</td>
    </tr>`;
  }).join('');

  qg.innerHTML = jWithSig.slice(0, 12).map(j => {
    const s = signals[j.id];
    if (!s) return '';
    return `<div class="signal-cell" onclick="inspectJunction(${j.id})">
      <div class="signal-light ${s.phase.toLowerCase()}"></div>
      <div class="signal-cell-name">${j.name.split(' ')[0]}</div>
    </div>`;
  }).join('');
}

function optimizeSignals() {
  // Greedy: re-derive timing from each junction's current density, giving
  // longer green phases to denser junctions. Reuses applySignalDensity so
  // timeLeft always matches the newly assigned phase duration.
  Object.entries(signals).forEach(([id, s]) => applySignalDensity(id, s.density));
  renderSignals();
  toast('Signals optimized using greedy algorithm!', 'success');
}

// ─── DIJKSTRA VIEW ───
function runDijkstra() {
  const src = parseInt(document.getElementById('dijk-from').value);
  const dst = parseInt(document.getElementById('dijk-to').value);
  if (src === dst) { document.getElementById('dijk-result').innerHTML = 'Source and destination are the same.'; return; }
  const { dist, prev, prevEdge } = dijkstra(src);
  const path = getPath(prev, dst);
  const el = document.getElementById('dijk-result');
  if (!path.length || dist[dst] === INF) {
    el.innerHTML = `<span style="color:var(--red)">No path found from ${jName(src)} to ${jName(dst)}.</span>`;
    return;
  }
  let html = `<div style="margin-bottom:10px;">`;
  html += path.map((id,i) => {
    const part = `<span class="path-node">${jName(id)}</span>`;
    return i < path.length-1 ? part + `<span class="path-arrow">→</span>` : part;
  }).join('');
  html += `</div>`;
  html += `<div style="font-family:'Share Tech Mono',monospace; font-size:11px; color:var(--text-dim); line-height:1.9;">`;
  html += `Effective Cost: <span style="color:var(--accent)">${dist[dst]}</span> (distance + congestion penalty)<br>`;
  html += `Hops: <span style="color:var(--green)">${path.length-1}</span><br>`;
  // Show per-segment breakdown using the exact edge Dijkstra relaxed through —
  // not a re-lookup by junction pair, which could pick the wrong parallel road.
  for (let i=1; i<path.length; i++) {
    const e = prevEdge[path[i]];
    if (e) html += `  ${jName(path[i-1])} → ${jName(path[i])}: ${e.dist}m + ${e.cong}×50 penalty (${e.name})<br>`;
  }
  html += `</div>`;
  el.innerHTML = html;
  toast(`Route found: ${path.length-1} hops, ${dist[dst]} effective cost`, 'success');
}

// ─── BFS ───
function runBFS() {
  const src = parseInt(document.getElementById('bfs-from').value);
  const dst = parseInt(document.getElementById('bfs-to').value);
  const path = bfs(src, dst);
  const el = document.getElementById('bfs-result');
  if (!path.length) {
    el.innerHTML = `<span style="color:var(--red)">No BFS path from ${jName(src)} to ${jName(dst)}.</span>`;
    return;
  }
  let html = path.map((id,i) => {
    const part = `<span class="path-node">${jName(id)}</span>`;
    return i < path.length-1 ? part + `<span class="path-arrow">→</span>` : part;
  }).join('');
  html += `<div style="margin-top:10px;font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--text-dim);">
    Hops (unweighted): <span style="color:var(--green)">${path.length-1}</span>
  </div>`;
  el.innerHTML = html;
  toast(`BFS route: ${path.length-1} hops`, 'success');
}

// ─── DFS ───
function runDFS() {
  const src = parseInt(document.getElementById('dfs-start').value);
  const order = dfs(src);
  let html = order.map((id,i) => {
    const part = `<span class="path-node">${jName(id)}</span>`;
    return i < order.length-1 ? part+`<span class="path-arrow">→</span>` : part;
  }).join('');
  html += `<div style="margin-top:10px;font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--text-dim);">
    Nodes reached: <span style="color:var(--accent)">${order.length} / ${JUNCTIONS.length}</span>
    ${order.length === JUNCTIONS.length ? '<span style="color:var(--green)"> — Fully Connected ✓</span>' : '<span style="color:var(--red)"> — Network has disconnected components!</span>'}
  </div>`;
  document.getElementById('dfs-result').innerHTML = html;
}

// ─── FLOYD ───
function renderFloyd() {
  const { D, ids } = floydWarshall();
  let html = '<table class="matrix-table"><thead><tr><th>↓ From / To →</th>';
  ids.forEach(id => html += `<th>${jName(id).split(' ')[0]}</th>`);
  html += '</tr></thead><tbody>';
  ids.forEach((fromId, i) => {
    html += `<tr><th>${jName(fromId).split(' ')[0]}</th>`;
    ids.forEach((toId, j) => {
      const v = D[i][j];
      let cls = '';
      if (i===j) cls='diagonal';
      else if (v===INF) cls='inf';
      else if (v < 600) cls='low-cost';
      else if (v > 2000) cls='high-cost';
      const display = v===INF ? '∞' : v===0 ? '0' : v.toLocaleString();
      html += `<td class="${cls}">${display}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  document.getElementById('floyd-matrix').innerHTML = html;
  toast('Floyd-Warshall matrix computed!', 'success');
}

// ─── MST (Kruskal + Union-Find) ───
function renderMST() {
  const { mstEdges, mstDist, totalDist, connected, componentCount } = kruskalMST();
  const savings = totalDist > 0 ? (100 * (1 - mstDist / totalDist)).toFixed(1) : '0.0';

  document.getElementById('mst-summary').innerHTML = `
    <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:0;">
      <div class="stat-card" style="--accent-bar:var(--accent2); --accent-color:var(--accent2)">
        <div class="stat-label">Roads Selected</div>
        <div class="stat-value">${mstEdges.length} / ${JUNCTIONS.length - 1}</div>
        <div class="stat-sub">${connected ? 'Network fully connected' : `${componentCount} disconnected components!`}</div>
      </div>
      <div class="stat-card" style="--accent-bar:var(--accent); --accent-color:var(--accent)">
        <div class="stat-label">MST Total Distance</div>
        <div class="stat-value">${mstDist.toLocaleString()}m</div>
        <div class="stat-sub">vs ${totalDist.toLocaleString()}m across all open roads</div>
      </div>
      <div class="stat-card" style="--accent-bar:var(--green); --accent-color:var(--green)">
        <div class="stat-label">Infrastructure Savings</div>
        <div class="stat-value">${savings}%</div>
        <div class="stat-sub">length saved vs building every road</div>
      </div>
    </div>`;

  document.getElementById('mst-table-body').innerHTML = mstEdges.map(r => `
    <tr>
      <td>${r.name}</td>
      <td>${jName(r.from)}</td>
      <td>${jName(r.to)}</td>
      <td style="font-family:'Share Tech Mono',monospace">${r.dist}m</td>
    </tr>`).join('');

  toast(`MST computed: ${mstEdges.length} roads, ${mstDist.toLocaleString()}m total.`, 'success');
}

// ─── CONGESTION ───
function updateCongestion() {
  const sorted = [...JUNCTIONS].sort((a,b) => b.vehicleCount - a.vehicleCount);
  document.getElementById('congestion-junctions').innerHTML = sorted.map(j => {
    const pct = Math.min(100, j.vehicleCount);
    const cIdx = Math.min(10, Math.round(pct/10));
    return `<div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid rgba(26,58,92,.3);">
      <span style="font-family:'Share Tech Mono',monospace;font-size:11px;width:20px;color:var(--accent)">${j.id}</span>
      <span style="flex:1;font-size:12px;">${j.name}</span>
      <span class="zone-tag zone-${j.zone}">${j.zone}</span>
      <div class="congestion-bar" style="width:120px"><div class="congestion-fill cong-${cIdx}" style="width:${pct}%"></div></div>
      <span style="font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--text-dim);width:40px;text-align:right">${j.vehicleCount}</span>
    </div>`;
  }).join('');

  const roadsSorted = [...ROADS_RAW].sort((a,b)=>b.cong-a.cong);
  document.getElementById('congestion-roads-body').innerHTML = roadsSorted.map(r => {
    const col = r.cong>=8?'var(--red)':r.cong>=6?'var(--orange)':r.cong>=4?'var(--yellow)':'var(--green)';
    // Match on the exact road object — matching by `to` alone would report
    // the wrong blocked state when two parallel roads share the same pair.
    const blocked = (adj[r.from]||[]).find(e=>e.road===r)?.blocked;
    return `<tr>
      <td>${r.name}</td>
      <td>${jName(r.from)}</td>
      <td>${jName(r.to)}</td>
      <td style="font-family:'Share Tech Mono',monospace">${r.dist}m</td>
      <td><div class="congestion-bar-wrap">
        <div class="congestion-bar"><div class="congestion-fill cong-${r.cong}" style="width:${r.cong*10}%"></div></div>
        <span style="font-family:'Share Tech Mono',monospace;font-size:10px;color:${col}">${r.cong}/10</span>
      </div></td>
      <td>${blocked ? '<span style="color:var(--red);font-family:Share Tech Mono,monospace;font-size:10px">BLOCKED</span>' : '<span style="color:var(--green);font-size:10px">OPEN</span>'}</td>
    </tr>`;
  }).join('');
}

// ─── ROADS ───
function renderRoads() {
  // Every entry in ROADS_RAW is a distinct physical road (some junction
  // pairs are connected by more than one), so nothing here should be
  // deduped away — a pair-based dedup used to silently drop one of two
  // parallel roads from the table.
  const rows = ROADS_RAW.map(r => {
    const edge = (adj[r.from]||[]).find(e=>e.road===r);
    const blocked = edge?.blocked;
    return `<tr>
      <td>${r.name}</td>
      <td>${jName(r.from)}</td>
      <td>${jName(r.to)}</td>
      <td style="font-family:'Share Tech Mono',monospace">${r.dist}</td>
      <td style="text-align:center">${r.bidir?'↔':'→'}</td>
      <td><div class="congestion-bar-wrap">
        <div class="congestion-bar"><div class="congestion-fill cong-${r.cong}" style="width:${r.cong*10}%"></div></div>
        <span style="font-size:10px;font-family:'Share Tech Mono',monospace;color:var(--text-dim)">${r.cong}/10</span>
      </div></td>
      <td>${blocked
        ? '<span style="color:var(--red);font-family:Share Tech Mono,monospace;font-size:10px">🚧 BLOCKED</span>'
        : '<span style="color:var(--green);font-size:10px">OPEN</span>'
      }</td>
    </tr>`;
  }).join('');
  document.getElementById('road-table-body').innerHTML = rows;
}

function blockRoad(doBlock) {
  const from = parseInt(document.getElementById('block-from').value);
  const to   = parseInt(document.getElementById('block-to').value);
  // A junction pair can be joined by more than one physical road — block
  // (or unblock) all of them, not just whichever one .find() hits first.
  const matches = [
    ...(adj[from]||[]).filter(e=>e.to===to),
    ...(adj[to]  ||[]).filter(e=>e.to===from),
  ];
  if (!matches.length) {
    document.getElementById('block-result').innerHTML = `<span style="color:var(--red)">No road between ${jName(from)} and ${jName(to)}.</span>`;
    return;
  }
  matches.forEach(e => e.blocked = doBlock);
  const roadCount = new Set(matches.map(e => e.road)).size;
  const action = doBlock ? '🚧 BLOCKED' : '✓ UNBLOCKED';
  const col = doBlock ? 'var(--red)' : 'var(--green)';
  document.getElementById('block-result').innerHTML = `<span style="color:${col}">${action}: ${jName(from)} ↔ ${jName(to)} (${roadCount} road${roadCount>1?'s':''})</span>`;
  toast(`Road ${doBlock?'blocked':'unblocked'}: ${jName(from)} ↔ ${jName(to)}`, doBlock?'error':'success');
  renderRoads();
  if (document.getElementById('view-city-map').classList.contains('active')) renderCityMap();
}

// ─── EMERGENCY ───
function renderEmergency() {
  const el = document.getElementById('emergency-vehicles-list');
  const evs = VEHICLES.filter(v => EMERGENCY_TYPES.includes(v.type));
  const activeOverrides = Object.values(signals).filter(s => s.emergency).length;
  el.innerHTML = evs.map(v => {
    const dispatched = dispatchLog.some(d=>d.vid===v.id);
    return `<button class="emergency-btn ${dispatched?'dispatched':''}" onclick="dispatchVehicle(${v.id})">
      <span style="font-size:18px;">${v.type==='AMBULANCE'?'🚑':v.type==='FIRE_TRUCK'?'🚒':'🚓'}</span>
      <span>
        <div style="font-size:12px;">${v.plate} — ${v.type}</div>
        <div style="font-size:9px;opacity:.7;">${jName(v.from)} → ${jName(v.to)} | Fuel: ${v.fuel.toFixed(1)}%</div>
      </span>
      <span style="margin-left:auto;font-size:10px">${dispatched?'DISPATCHED':'DISPATCH'}</span>
    </button>`;
  }).join('') + `<button class="btn-secondary" onclick="clearEmergencyOverrides()">↺ CLEAR ALL OVERRIDES${activeOverrides ? ` (${activeOverrides} active)` : ''}</button>`;
}

function dispatchVehicle(vid) {
  const v = VEHICLES.find(v=>v.id===vid);
  if (!v) return;
  const { dist, prev } = dijkstra(v.from);
  const path = getPath(prev, v.to);
  if (!path.length || dist[v.to] === INF) {
    toast(`No route available for ${v.plate}!`, 'error');
    return;
  }
  const entry = { vid, time: simSeconds, path, vehicle: v };
  dispatchLog.push(entry);

  // Signal overrides clear automatically once the vehicle has had enough
  // ticks to clear the route, so a dispatch doesn't leave junctions stuck
  // on GREEN forever (they can also be cleared early — see the "Clear All
  // Overrides" button rendered by renderEmergency()).
  const clearAtTick = simTick + Math.max(3, (path.length - 1) * 2);
  path.forEach(id => {
    if (signals[id]) {
      signals[id].emergency = true;
      signals[id].phase = 'GREEN';
      signals[id].emergencyUntil = clearAtTick;
    }
  });

  const log = document.getElementById('emergency-log');
  let msg = `[TICK ${simTick}] DISPATCH: ${v.type} ${v.plate}\n`;
  msg += `Route: ${path.map(jName).join(' → ')}\n`;
  msg += `Effective Cost: ${dist[v.to]} | Hops: ${path.length-1}\n`;
  msg += `Signal override active on ${path.length} junctions (auto-clears by tick ${clearAtTick}).\n\n`;
  log.innerHTML = `<span style="color:var(--green)">${msg}</span>` + log.innerHTML;

  toast(`${v.type} dispatched! Route cleared.`, 'warning');
  renderSignals();
  renderEmergency();
}

function clearEmergencyOverrides() {
  let cleared = 0;
  Object.entries(signals).forEach(([id, s]) => {
    if (s.emergency) {
      s.emergency = false;
      delete s.emergencyUntil;
      applySignalDensity(id, jMap[id].vehicleCount);
      cleared++;
    }
  });
  renderSignals();
  renderEmergency();
  toast(cleared ? `${cleared} signal override(s) cleared.` : 'No active overrides to clear.', 'info');
}

// ─── VEHICLES ───
function renderVehicles() {
  document.getElementById('vehicle-table-body').innerHTML = VEHICLES.map(v => {
    const isEmerg = EMERGENCY_TYPES.includes(v.type);
    const fuelCol = v.fuel > 70 ? 'var(--green)' : v.fuel > 30 ? 'var(--yellow)' : 'var(--red)';
    return `<tr>
      <td style="font-family:'Share Tech Mono',monospace;color:var(--accent)">${v.id}</td>
      <td style="font-family:'Share Tech Mono',monospace;font-size:11px">${v.plate}</td>
      <td><span class="vtype ${v.type}">${v.type}</span></td>
      <td>${jName(v.from)}</td>
      <td>${jName(v.to)}</td>
      <td>
        <div class="congestion-bar-wrap">
          <div class="congestion-bar"><div class="congestion-fill" style="width:${v.fuel}%;background:${fuelCol}"></div></div>
          <span style="font-family:'Share Tech Mono',monospace;font-size:10px;color:${fuelCol}">${v.fuel.toFixed(1)}%</span>
        </div>
      </td>
      <td>${isEmerg ? '<span style="color:var(--red);font-size:11px;">⚠ YES</span>' : '—'}</td>
    </tr>`;
  }).join('');

  const types = {};
  VEHICLES.forEach(v => types[v.type] = (types[v.type]||0)+1);
  document.getElementById('vehicle-stats').innerHTML = Object.entries(types).map(([t,c])=>
    `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(26,58,92,.3);">
      <span class="vtype ${t}">${t}</span>
      <span style="font-family:'Share Tech Mono',monospace;font-size:14px;color:var(--accent)">${c}</span>
    </div>`
  ).join('');
}

// ─── ALGORITHMS ───
const ALGOS = [
  { name:"Dijkstra's Algorithm", complexity:"O((V+E) log V)", badge:"Shortest Path",
    desc:"Finds the optimal path from a source junction to all other junctions using a binary min-heap priority queue. Considers both road distance and congestion penalty (congestion × 50m). Used for routing vehicles and emergency dispatch through the city." },
  { name:"Floyd-Warshall", complexity:"O(V³)", badge:"All-Pairs",
    desc:"Computes shortest paths between every pair of junctions in a single O(V³) pass. Creates a complete distance matrix enabling instant city-wide navigation queries. Uses dynamic programming." },
  { name:"BFS (Breadth-First Search)", complexity:"O(V+E)", badge:"Alternate Routes",
    desc:"Finds the unweighted shortest path (fewest hops) between junctions. Used for detecting alternate routes during congestion or road blockage scenarios. Explores all neighbors level by level." },
  { name:"DFS (Depth-First Search)", complexity:"O(V+E)", badge:"Connectivity",
    desc:"Traverses the road network depth-first from a starting junction. Used to verify full network connectivity — if all 15 junctions are reached, the city is fully connected." },
  { name:"Kruskal's MST (Union-Find)", complexity:"O(E log E)", badge:"Infrastructure Planning",
    desc:"Sorts all roads by physical distance and greedily adds the cheapest ones that don't form a cycle, tracked with a disjoint-set (union-find) structure. Reveals the minimum-cost subset of roads needed to keep every junction connected." },
  { name:"Greedy (Signal Optimization)", complexity:"O(n log n)", badge:"Signal Timing",
    desc:"Sorts junctions by vehicle density and assigns longer green-light durations to high-density junctions. Emergency override forces GREEN phase on the entire dispatch route until it auto-clears." },
  { name:"Sorting Algorithms", complexity:"O(n log n)", badge:"Congestion Ranking",
    desc:"Applied to rank junctions and roads by congestion level and vehicle density. Generates the congestion report showing top-congested locations and zone summaries for traffic management decisions." },
];

function renderAlgorithms() {
  document.getElementById('algo-cards').innerHTML = ALGOS.map(a => `
    <div class="algo-card">
      <div class="algo-card-title">${a.name}</div>
      <span class="algo-badge">${a.badge}</span>
      <span class="algo-badge" style="background:rgba(0,229,255,.1);border-color:rgba(0,229,255,.2);color:var(--accent);">${a.complexity}</span>
      <div class="algo-desc">${a.desc}</div>
    </div>
  `).join('');
}

// ─── QUICK ROUTE ───
function quickRoute() {
  const src = parseInt(document.getElementById('quick-from').value);
  const dst = parseInt(document.getElementById('quick-to').value);
  if (src === dst) { document.getElementById('quick-result').textContent = 'Same junction.'; return; }
  const { dist, prev } = dijkstra(src);
  const path = getPath(prev, dst);
  const el = document.getElementById('quick-result');
  if (!path.length || dist[dst] === INF) {
    el.innerHTML = `<span style="color:var(--red)">No route!</span>`;
    return;
  }
  el.innerHTML = path.map((id,i) => {
    const p = `<span class="path-node" style="font-size:9px;padding:1px 5px;">${jName(id).split(' ')[0]}</span>`;
    return i<path.length-1 ? p+`<span class="path-arrow">→</span>` : p;
  }).join('') + `<div style="margin-top:6px;color:var(--text-dim)">${dist[dst]} cost | ${path.length-1} hops</div>`;
}

// ─── SIMULATION TICK ───
function simulateTick() {
  simTick++;
  simSeconds += 30;

  Object.entries(signals).forEach(([id, s]) => {
    if (s.emergency) {
      // Emergency overrides expire on their own rather than freezing the
      // signal on GREEN forever once no one remembers to clear it.
      if (s.emergencyUntil !== undefined && simTick >= s.emergencyUntil) {
        s.emergency = false;
        delete s.emergencyUntil;
        applySignalDensity(id, jMap[id].vehicleCount);
      }
      return;
    }
    s.timeLeft -= 30;
    if (s.timeLeft <= 0) {
      if (s.phase==='GREEN') { s.phase='YELLOW'; s.timeLeft=s.yellow||5; }
      else if (s.phase==='YELLOW') { s.phase='RED'; s.timeLeft=s.red; }
      else { s.phase='GREEN'; s.timeLeft=s.green; }
    }
  });

  JUNCTIONS.forEach(j => {
    j.vehicleCount = Math.max(0, j.vehicleCount + Math.floor(Math.random()*7)-3);
  });

  VEHICLES.forEach(v => { v.fuel = Math.max(0, v.fuel - Math.random()*0.8); });

  const t = String(simTick).padStart(3,'0');
  document.getElementById('tick-display').textContent = t;
  document.getElementById('tick-right').textContent = t;

  const mins = Math.floor(simSeconds/60), secs = simSeconds%60;
  document.getElementById('sim-time').textContent =
    `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;

  renderSignals();
  if (document.getElementById('view-city-map').classList.contains('active')) renderCityMap();
  if (document.getElementById('view-emergency').classList.contains('active')) renderEmergency();
  toast(`Tick ${simTick} simulated (+30s)`, 'info');
}

function autoSimulate() {
  if (autoRunning) {
    clearInterval(autoSimInterval);
    autoRunning = false;
    document.getElementById('auto-sim-status').textContent = 'Auto-sim stopped.';
    return;
  }
  autoRunning = true;
  document.getElementById('auto-sim-status').textContent = 'Auto-simulating every 2s...';
  autoSimInterval = setInterval(simulateTick, 2000);
}

// ─── CONGESTION EDITOR ───
const CONG_COLORS = ['#00e676','#00e676','#64dd17','#aeea00','#ffea00','#ffd600','#ffab00','#ff6d00','#ff3d00','#ff1744','#d50000'];

// Pending edits (live sliders)
const pendingJunctionEdits = {};
const pendingRoadEdits = {};

function switchEditorTab(tab, btn) {
  document.querySelectorAll('.editor-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.editor-pane').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('editor-pane-' + tab).classList.add('active');
}

function congDot(val, max) {
  const idx = Math.min(10, Math.round((val / max) * 10));
  return `<div class="cong-preview" style="background:${CONG_COLORS[idx]};box-shadow:0 0 5px ${CONG_COLORS[idx]}55;"></div>`;
}

function renderJunctionEditor() {
  const q = (document.getElementById('junction-search').value || '').toLowerCase();
  const list = document.getElementById('junction-editor-list');
  list.innerHTML = JUNCTIONS
    .filter(j => j.name.toLowerCase().includes(q) || String(j.id).includes(q))
    .map(j => {
      const cur = pendingJunctionEdits[j.id] !== undefined ? pendingJunctionEdits[j.id] : j.vehicleCount;
      const pct = Math.min(100, cur);
      const cIdx = Math.min(10, Math.round(pct / 10));
      return `<div class="editor-row">
        <div style="display:flex;align-items:center;gap:8px;">
          ${congDot(cur, 100)}
          <span class="editor-label"><span style="color:var(--accent);font-family:'Share Tech Mono',monospace;font-size:10px">${j.id}</span> ${j.name}</span>
        </div>
        <span class="editor-val" id="jval-${j.id}" style="color:${CONG_COLORS[cIdx]}">${cur}</span>
        <input type="range" min="0" max="120" value="${cur}" class="editor-slider"
          oninput="previewJunction(${j.id}, this.value)"
          style="accent-color:${CONG_COLORS[cIdx]}">
        <button class="btn-apply" onclick="applySingleJunction(${j.id})">SET</button>
      </div>`;
    }).join('');
}

function previewJunction(id, val) {
  val = parseInt(val);
  pendingJunctionEdits[id] = val;
  const cIdx = Math.min(10, Math.round(Math.min(100, val) / 10));
  const el = document.getElementById('jval-' + id);
  if (el) { el.textContent = val; el.style.color = CONG_COLORS[cIdx]; }
}

function applySingleJunction(id) {
  const val = pendingJunctionEdits[id];
  if (val === undefined) return;
  const j = JUNCTIONS.find(j => j.id === id);
  if (!j) return;
  j.vehicleCount = val;
  applySignalDensity(id, val);
  delete pendingJunctionEdits[id];
  renderJunctionEditor();
  updateCongestion();
  renderSignals();
  if (document.getElementById('view-city-map').classList.contains('active')) renderCityMap();
  showFeedback(`Junction ${id} updated → ${val} vehicles`);
  toast(`Junction ${jName(id)} → ${val} vehicles`, 'success');
}

function renderRoadEditor() {
  const q = (document.getElementById('road-search').value || '').toLowerCase();
  const list = document.getElementById('road-editor-list');
  list.innerHTML = ROADS_RAW
    .filter(r => r.name.toLowerCase().includes(q) || jName(r.from).toLowerCase().includes(q) || jName(r.to).toLowerCase().includes(q))
    .map(r => {
      const rkey = roadKey(r);
      const cur = pendingRoadEdits[rkey] !== undefined ? pendingRoadEdits[rkey] : r.cong;
      const safeId = rkey.replace(/[^a-z0-9]/gi, '_');
      return `<div class="editor-row">
        <div style="display:flex;align-items:center;gap:8px;">
          ${congDot(cur, 10)}
          <span class="editor-label" title="${r.name}">${r.name}</span>
        </div>
        <span class="editor-val" id="rval-${safeId}" style="color:${CONG_COLORS[cur]}">${cur}/10</span>
        <input type="range" min="0" max="10" value="${cur}" class="editor-slider road-slider"
          oninput="previewRoad('${rkey}', this.value)"
          style="accent-color:${CONG_COLORS[cur]}">
        <button class="btn-apply" onclick="applySingleRoad('${rkey}')">SET</button>
      </div>`;
    }).join('');
}

function previewRoad(rkey, val) {
  val = parseInt(val);
  pendingRoadEdits[rkey] = val;
  const safeId = rkey.replace(/[^a-z0-9]/gi, '_');
  const el = document.getElementById('rval-' + safeId);
  if (el) { el.textContent = val + '/10'; el.style.color = CONG_COLORS[val]; }
}

function applySingleRoad(rkey) {
  const val = pendingRoadEdits[rkey];
  if (val === undefined) return;
  const road = ROAD_BY_KEY.get(rkey);
  if (!road) return;
  road.cong = val;
  (adj[road.from]||[]).forEach(e => { if (e.road === road) e.cong = val; });
  (adj[road.to]  ||[]).forEach(e => { if (e.road === road) e.cong = val; });
  delete pendingRoadEdits[rkey];
  renderRoadEditor();
  updateCongestion();
  if (document.getElementById('view-city-map').classList.contains('active')) renderCityMap();
  showFeedback(`Road "${road.name}" congestion → ${val}/10`);
  toast(`Road congestion updated: ${val}/10`, 'success');
}

function applyAllEdits() {
  Object.keys(pendingJunctionEdits).forEach(id => applySingleJunction(parseInt(id)));
  Object.keys(pendingRoadEdits).forEach(rkey => applySingleRoad(rkey));
  updateCongestion();
  renderSignals();
  renderVehicles();
  if (document.getElementById('view-city-map').classList.contains('active')) renderCityMap();
  showFeedback('All changes applied!');
  toast('All congestion edits applied!', 'success');
}

function resetAllCongestion() {
  DEFAULT_JUNCTIONS.forEach(d => {
    const j = JUNCTIONS.find(j => j.id === d.id);
    if (j) j.vehicleCount = d.vehicleCount;
    applySignalDensity(d.id, d.vehicleCount);
  });
  DEFAULT_ROADS.forEach(d => {
    const road = ROAD_BY_KEY.get(roadKey(d));
    if (!road) return;
    road.cong = d.cong;
    (adj[road.from]||[]).forEach(e => { if (e.road === road) e.cong = d.cong; });
    (adj[road.to]  ||[]).forEach(e => { if (e.road === road) e.cong = d.cong; });
  });
  Object.keys(pendingJunctionEdits).forEach(k => delete pendingJunctionEdits[k]);
  Object.keys(pendingRoadEdits).forEach(k => delete pendingRoadEdits[k]);
  renderJunctionEditor();
  renderRoadEditor();
  updateCongestion();
  renderSignals();
  if (document.getElementById('view-city-map').classList.contains('active')) renderCityMap();
  showFeedback('All values reset to defaults.');
  toast('Congestion reset to defaults.', 'info');
}

function showFeedback(msg) {
  const el = document.getElementById('editor-feedback');
  if (!el) return;
  el.textContent = '✓ ' + msg;
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.textContent = ''; }, 3500);
}

// ─── INIT ───
populateSelects();
initStaticStats();
renderDashboard();
renderSignals();
renderJunctionEditor();
renderRoadEditor();
