// ═══════════════════════════════════════════════════════
//  DATA LAYER — junctions, roads, vehicles & derived structures
// ═══════════════════════════════════════════════════════

const JUNCTIONS = [
  { id:0,  name:'Hazratganj Circle',      zone:'Central', hasSignal:true,  vehicleCount:85 },
  { id:1,  name:'Charbagh Junction',      zone:'South',   hasSignal:true,  vehicleCount:60 },
  { id:2,  name:'Alambagh Crossing',      zone:'South',   hasSignal:true,  vehicleCount:30 },
  { id:3,  name:'Gomti Nagar Extension',  zone:'East',    hasSignal:true,  vehicleCount:72 },
  { id:4,  name:'Indira Nagar Turn',      zone:'East',    hasSignal:true,  vehicleCount:30 },
  { id:5,  name:'Aminabad Market',        zone:'Central', hasSignal:true,  vehicleCount:45 },
  { id:6,  name:'SGPGI Hospital Road',    zone:'South',   hasSignal:true,  vehicleCount:10 },
  { id:7,  name:'Dubagga Crossing',       zone:'West',    hasSignal:true,  vehicleCount:5  },
  { id:8,  name:'Rajajipuram Square',     zone:'West',    hasSignal:true,  vehicleCount:8  },
  { id:9,  name:'Amausi Airport Road',    zone:'South',   hasSignal:true,  vehicleCount:20 },
  { id:10, name:'Lucknow University Gate',zone:'Central', hasSignal:true,  vehicleCount:12 },
  { id:11, name:'Transport Nagar',        zone:'South',   hasSignal:false, vehicleCount:90 },
  { id:12, name:'Chowk Intersection',     zone:'West',    hasSignal:true,  vehicleCount:4  },
  { id:13, name:'Kaiserbagh Bus Stand',   zone:'Central', hasSignal:true,  vehicleCount:6  },
  { id:14, name:'IT City Park',           zone:'East',    hasSignal:true,  vehicleCount:9  },
];

const ROADS_RAW = [
  { from:0,  to:1,  dist:800,  name:'Hazratganj-Charbagh Road',     bidir:true, cong:7 },
  { from:0,  to:3,  dist:600,  name:'Gomti River Boulevard',        bidir:true, cong:4 },
  { from:0,  to:5,  dist:700,  name:'Hazratganj-Aminabad Link',     bidir:true, cong:0 },
  { from:0,  to:7,  dist:500,  name:'Ring Road West Corridor',      bidir:true, cong:0 },
  { from:0,  to:13, dist:200,  name:'Kaiserbagh Connector',         bidir:true, cong:0 },
  { from:1,  to:2,  dist:400,  name:'Charbagh-Alambagh Route',      bidir:true, cong:0 },
  { from:1,  to:9,  dist:900,  name:'Airport Express Road',         bidir:true, cong:2 },
  { from:2,  to:9,  dist:600,  name:'Amausi Link Road',             bidir:true, cong:0 },
  { from:2,  to:3,  dist:1100, name:'Shaheed Path East',            bidir:true, cong:0 },
  { from:3,  to:4,  dist:350,  name:'Gomti Nagar Main Street',      bidir:true, cong:6 },
  { from:3,  to:10, dist:400,  name:'University Connector',         bidir:true, cong:0 },
  { from:4,  to:10, dist:300,  name:'Indira-Uni Route',             bidir:true, cong:0 },
  { from:4,  to:14, dist:500,  name:'IT Corridor Road',             bidir:true, cong:0 },
  { from:4,  to:9,  dist:1200, name:'Airport Outer Highway',        bidir:true, cong:0 },
  { from:5,  to:6,  dist:250,  name:'SGPGI Access Road',            bidir:true, cong:0 },
  { from:5,  to:11, dist:700,  name:'Transport Nagar Route',        bidir:true, cong:8 },
  { from:6,  to:11, dist:500,  name:'Southern Ring Road',           bidir:true, cong:0 },
  { from:7,  to:8,  dist:400,  name:'Dubagga-Rajajipuram Road',     bidir:true, cong:0 },
  { from:7,  to:12, dist:300,  name:'Chowk Heritage Route',         bidir:true, cong:0 },
  { from:8,  to:12, dist:350,  name:'Rajajipuram-Chowk Link',       bidir:true, cong:0 },
  { from:8,  to:11, dist:800,  name:'Industrial Freight Corridor',  bidir:true, cong:0 },
  { from:10, to:14, dist:200,  name:'IT City Flyover',              bidir:true, cong:0 },
  { from:0,  to:5,  dist:500,  name:'Central Market Road',           bidir:true, cong:2 },
  { from:1,  to:5,  dist:650,  name:'Charbagh-Aminabad Link',        bidir:true, cong:4 },
  { from:2,  to:11, dist:550,  name:'Alambagh Freight Route',        bidir:true, cong:3 },
  { from:3,  to:10, dist:400,  name:'Gomti-University Road',         bidir:true, cong:2 },
  { from:4,  to:10, dist:350,  name:'Indira-University Route',       bidir:true, cong:2 },
  { from:6,  to:5,  dist:700,  name:'Hospital Market Road',          bidir:true, cong:1 },
  { from:7,  to:0,  dist:600,  name:'West Ring Road',                bidir:true, cong:2 },
  { from:8,  to:11, dist:750,  name:'Rajajipuram Industrial Road',   bidir:true, cong:4 },
  { from:9,  to:1,  dist:850,  name:'Airport-Charbagh Expressway',   bidir:true, cong:5 },
  { from:12, to:13, dist:500,  name:'Chowk-Kaiserbagh Heritage Rd',  bidir:true, cong:2 },
  { from:14, to:3,  dist:450,  name:'IT-Gomti Smart Road',           bidir:true, cong:1 },
];

const VEHICLES = [
  { id:1,  plate:'UP32-AB1234', type:'CAR',        from:0,  to:14, fuel:100.0 },
  { id:2,  plate:'UP32-CD5678', type:'TRUCK',      from:1,  to:5,  fuel:88.5  },
  { id:3,  plate:'AMB-001',     type:'AMBULANCE',  from:6,  to:9,  fuel:95.0  },
  { id:4,  plate:'FIRE-002',    type:'FIRE_TRUCK', from:12, to:3,  fuel:100.0 },
  { id:5,  plate:'POL-003',     type:'POLICE',     from:13, to:11, fuel:91.0  },
  { id:6,  plate:'UP32-EF9012', type:'MOTORCYCLE', from:7,  to:10, fuel:78.0  },
  { id:7,  plate:'UP32-GH3456', type:'CAR',        from:9,  to:5,  fuel:65.5  },
  { id:8,  plate:'UP32-IJ7890', type:'TRUCK',      from:2,  to:8,  fuel:55.0  },
  { id:9,  plate:'POL-007',     type:'POLICE',     from:0,  to:11, fuel:99.0  },
  { id:10, plate:'AMB-002',     type:'AMBULANCE',  from:3,  to:12, fuel:82.0  },
];

const INF = 1e9;
const EMERGENCY_TYPES = ['AMBULANCE', 'FIRE_TRUCK', 'POLICE'];

// ─── Build adjacency list ───
// Both directions of a road share the same underlying `road` object, so
// code that needs to tell parallel roads between the same two junctions
// apart (blocking, congestion edits, map rendering) can match on identity
// instead of guessing from endpoints alone.
const adj = {};
JUNCTIONS.forEach(j => adj[j.id] = []);
ROADS_RAW.forEach(r => {
  adj[r.from].push({ to: r.to,   dist: r.dist, name: r.name, cong: r.cong, blocked: false, road: r });
  adj[r.to].push({   to: r.from, dist: r.dist, name: r.name, cong: r.cong, blocked: false, road: r });
});

const jMap = {};
JUNCTIONS.forEach(j => jMap[j.id] = j);

// O(1) lookup for the congestion editor: "from__to__name" -> road object
const roadKey = r => `${r.from}__${r.to}__${r.name}`;
const ROAD_BY_KEY = new Map(ROADS_RAW.map(r => [roadKey(r), r]));

const jName = id => jMap[id] ? jMap[id].name : `J${id}`;

/**
 * Recomputes a signal's phase/green/red timing from a vehicle density and
 * resets `timeLeft` to match. Centralizing this (instead of duplicating the
 * thresholds at every call site) keeps the countdown from ever running
 * against a duration left over from the signal's previous phase.
 * Emergency-overridden signals are left untouched.
 */
function applySignalDensity(id, density) {
  const s = signals[id];
  if (!s) return;
  s.density = Math.min(100, density);
  if (s.emergency) return;
  const d = density;
  s.green = d > 70 ? 60 : d > 40 ? 40 : 20;
  s.red   = d > 70 ? 20 : d > 40 ? 30 : 45;
  s.phase = d > 60 ? 'GREEN' : d > 30 ? 'YELLOW' : 'RED';
  s.timeLeft = s.phase === 'GREEN' ? s.green : s.phase === 'YELLOW' ? s.yellow : s.red;
}

// ─── Signals state ───
const signals = {};
JUNCTIONS.filter(j => j.hasSignal).forEach(j => {
  signals[j.id] = { phase: 'RED', green: 20, yellow: 5, red: 45, density: 0, emergency: false, timeLeft: 45 };
  applySignalDensity(j.id, j.vehicleCount);
});

// ─── Snapshots used by the congestion editor's "reset to default" ───
const DEFAULT_JUNCTIONS = JUNCTIONS.map(j => ({ id: j.id, vehicleCount: j.vehicleCount }));
const DEFAULT_ROADS = ROADS_RAW.map(r => ({ from: r.from, to: r.to, name: r.name, cong: r.cong }));

// ─── Simulation state ───
let simTick = 0;
let simSeconds = 0;
let autoSimInterval = null;
let autoRunning = false;
let dispatchLog = [];
