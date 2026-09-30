// ═══════════════════════════════════════════════════════
//  ALGORITHMS LAYER — pathfinding, traversal & network analysis
// ═══════════════════════════════════════════════════════

function effectiveWeight(edge) {
  if (edge.blocked) return INF;
  return edge.dist + edge.cong * 50;
}

/**
 * Binary min-heap keyed on item[0]. Dijkstra below uses it as its priority
 * queue so relaxation runs in true O((V+E) log V) instead of re-sorting a
 * plain array on every pop.
 */
class MinHeap {
  constructor() { this.data = []; }
  size() { return this.data.length; }
  push(item) {
    this.data.push(item);
    this._bubbleUp(this.data.length - 1);
  }
  pop() {
    const top = this.data[0];
    const last = this.data.pop();
    if (this.data.length) { this.data[0] = last; this._bubbleDown(0); }
    return top;
  }
  _bubbleUp(i) {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.data[parent][0] <= this.data[i][0]) break;
      [this.data[parent], this.data[i]] = [this.data[i], this.data[parent]];
      i = parent;
    }
  }
  _bubbleDown(i) {
    const n = this.data.length;
    for (;;) {
      let smallest = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && this.data[l][0] < this.data[smallest][0]) smallest = l;
      if (r < n && this.data[r][0] < this.data[smallest][0]) smallest = r;
      if (smallest === i) break;
      [this.data[smallest], this.data[i]] = [this.data[i], this.data[smallest]];
      i = smallest;
    }
  }
}

/**
 * Dijkstra — shortest path from `src` to every junction, weighted by
 * distance + congestion penalty. Also records the exact edge object used
 * to reach each junction (`prevEdge`), since two junctions can be joined
 * by more than one physical road — without it, a caller trying to show a
 * per-hop breakdown could describe a different (cheaper-looking) parallel
 * road than the one the algorithm actually used.
 */
function dijkstra(src) {
  const dist = {}, prev = {}, prevEdge = {};
  JUNCTIONS.forEach(j => { dist[j.id] = INF; prev[j.id] = null; prevEdge[j.id] = null; });
  dist[src] = 0;
  const heap = new MinHeap();
  heap.push([0, src]);
  while (heap.size()) {
    const [d, u] = heap.pop();
    if (d > dist[u]) continue;
    (adj[u] || []).forEach(e => {
      const w = effectiveWeight(e);
      if (w === INF) return;
      const nd = dist[u] + w;
      if (nd < dist[e.to]) {
        dist[e.to] = nd;
        prev[e.to] = u;
        prevEdge[e.to] = e;
        heap.push([nd, e.to]);
      }
    });
  }
  return { dist, prev, prevEdge };
}

function getPath(prev, dst) {
  const path = [];
  let cur = dst;
  while (cur !== null && cur !== undefined) { path.unshift(cur); cur = prev[cur]; }
  return path;
}

// BFS — fewest-hops route, ignoring distance/congestion weighting.
function bfs(src, dst) {
  const visited = new Set([src]);
  const prev = { [src]: null };
  const queue = [src];
  while (queue.length) {
    const u = queue.shift();
    if (u === dst) break;
    (adj[u] || []).forEach(e => {
      if (!e.blocked && !visited.has(e.to)) {
        visited.add(e.to);
        prev[e.to] = u;
        queue.push(e.to);
      }
    });
  }
  if (!(dst in prev)) return [];
  return getPath(prev, dst);
}

// DFS — full depth-first traversal from `src`, used for connectivity checks.
function dfs(src) {
  const visited = [];
  const seen = new Set();
  function rec(u) {
    if (seen.has(u)) return;
    seen.add(u);
    visited.push(u);
    (adj[u] || []).forEach(e => { if (!e.blocked) rec(e.to); });
  }
  rec(src);
  return visited;
}

// Floyd-Warshall — all-pairs shortest paths via dynamic programming.
function floydWarshall() {
  const n = JUNCTIONS.length;
  const ids = JUNCTIONS.map(j => j.id);
  const idx = {};
  ids.forEach((id, i) => idx[id] = i);
  const D = Array.from({ length: n }, () => Array(n).fill(INF));
  ids.forEach((_, i) => D[i][i] = 0);
  JUNCTIONS.forEach(j => {
    (adj[j.id] || []).forEach(e => {
      const w = effectiveWeight(e);
      if (w < D[idx[j.id]][idx[e.to]]) D[idx[j.id]][idx[e.to]] = w;
    });
  });
  for (let k = 0; k < n; k++)
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++)
        if (D[i][k] !== INF && D[k][j] !== INF && D[i][k] + D[k][j] < D[i][j])
          D[i][j] = D[i][k] + D[k][j];
  return { D, ids, idx };
}

// Disjoint Set (Union-Find) with path compression + union by rank.
class DisjointSet {
  constructor(ids) {
    this.parent = {};
    this.rank = {};
    ids.forEach(id => { this.parent[id] = id; this.rank[id] = 0; });
  }
  find(x) {
    if (this.parent[x] !== x) this.parent[x] = this.find(this.parent[x]);
    return this.parent[x];
  }
  union(a, b) {
    const ra = this.find(a), rb = this.find(b);
    if (ra === rb) return false;
    if (this.rank[ra] < this.rank[rb]) this.parent[ra] = rb;
    else if (this.rank[ra] > this.rank[rb]) this.parent[rb] = ra;
    else { this.parent[rb] = ra; this.rank[ra]++; }
    return true;
  }
}

/**
 * Kruskal's MST — the minimum-cost set of roads (ranked by physical
 * distance, not congestion) needed to keep every junction reachable.
 * Blocked roads are excluded since they aren't usable infrastructure
 * right now. Demonstrates the union-find structure above.
 */
function kruskalMST() {
  const candidateRoads = ROADS_RAW.filter(r => {
    const edge = (adj[r.from] || []).find(e => e.road === r);
    return !(edge && edge.blocked);
  });
  const sorted = [...candidateRoads].sort((a, b) => a.dist - b.dist);
  const dsu = new DisjointSet(JUNCTIONS.map(j => j.id));
  const mstEdges = [];
  let mstDist = 0;
  sorted.forEach(r => {
    if (dsu.union(r.from, r.to)) {
      mstEdges.push(r);
      mstDist += r.dist;
    }
  });
  const totalDist = candidateRoads.reduce((s, r) => s + r.dist, 0);
  const roots = new Set(JUNCTIONS.map(j => dsu.find(j.id)));
  return { mstEdges, mstDist, totalDist, connected: roots.size === 1, componentCount: roots.size };
}
