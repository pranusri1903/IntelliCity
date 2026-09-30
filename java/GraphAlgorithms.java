import java.util.*;

public class GraphAlgorithms {

    static class PathResult {
        int[] dist;
        int[] prev;
        Edge[] prevEdge;
    }

    // used to find the shortest distance from src to every junction, weighted by distance + congestion
    static PathResult dijkstra(int src) {
        int n = CityData.junctions.size();
        int[] dist = new int[n];
        int[] prev = new int[n];
        Edge[] prevEdge = new Edge[n];
        Arrays.fill(dist, CityData.INF);
        Arrays.fill(prev, -1);
        dist[src] = 0;

        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
        pq.add(new int[]{0, src});

        while (!pq.isEmpty()) {
            int[] top = pq.poll();
            int d = top[0], u = top[1];
            if (d > dist[u]) continue;
            for (Edge e : CityData.adj.getOrDefault(u, Collections.emptyList())) {
                int w = e.road.effectiveWeight();
                if (w >= CityData.INF) continue;
                int nd = dist[u] + w;
                if (nd < dist[e.to]) {
                    dist[e.to] = nd;
                    prev[e.to] = u;
                    prevEdge[e.to] = e;
                    pq.add(new int[]{nd, e.to});
                }
            }
        }
        PathResult r = new PathResult();
        r.dist = dist;
        r.prev = prev;
        r.prevEdge = prevEdge;
        return r;
    }

    static List<Integer> getPath(int[] prev, int dst) {
        List<Integer> path = new LinkedList<>();
        int cur = dst;
        while (cur != -1) {
            path.add(0, cur);
            cur = prev[cur];
        }
        return path;
    }

    // finds the route with the fewest hops, ignoring distance/congestion weighting
    static List<Integer> bfs(int src, int dst) {
        int n = CityData.junctions.size();
        boolean[] visited = new boolean[n];
        int[] prev = new int[n];
        Arrays.fill(prev, -2);
        Queue<Integer> queue = new LinkedList<>();
        visited[src] = true;
        prev[src] = -1;
        queue.add(src);
        while (!queue.isEmpty()) {
            int u = queue.poll();
            if (u == dst) break;
            for (Edge e : CityData.adj.getOrDefault(u, Collections.emptyList())) {
                if (!e.road.blocked && !visited[e.to]) {
                    visited[e.to] = true;
                    prev[e.to] = u;
                    queue.add(e.to);
                }
            }
        }
        if (prev[dst] == -2) return new ArrayList<>();
        return getPath(prev, dst);
    }

    // full depth-first traversal, used to check whether the network is fully connected
    static List<Integer> dfs(int src) {
        List<Integer> order = new ArrayList<>();
        boolean[] seen = new boolean[CityData.junctions.size()];
        dfsRec(src, seen, order);
        return order;
    }

    private static void dfsRec(int u, boolean[] seen, List<Integer> order) {
        if (seen[u]) return;
        seen[u] = true;
        order.add(u);
        for (Edge e : CityData.adj.getOrDefault(u, Collections.emptyList())) {
            if (!e.road.blocked) dfsRec(e.to, seen, order);
        }
    }

    // computes shortest paths between every pair of junctions via dynamic programming
    static int[][] floydWarshall() {
        int n = CityData.junctions.size();
        int[][] d = new int[n][n];
        for (int[] row : d) Arrays.fill(row, CityData.INF);
        for (int i = 0; i < n; i++) d[i][i] = 0;
        for (Junction j : CityData.junctions) {
            for (Edge e : CityData.adj.getOrDefault(j.id, Collections.emptyList())) {
                int w = e.road.effectiveWeight();
                if (w < d[j.id][e.to]) d[j.id][e.to] = w;
            }
        }
        for (int k = 0; k < n; k++)
            for (int i = 0; i < n; i++)
                for (int j = 0; j < n; j++)
                    if (d[i][k] < CityData.INF && d[k][j] < CityData.INF && d[i][k] + d[k][j] < d[i][j])
                        d[i][j] = d[i][k] + d[k][j];
        return d;
    }

    static class DisjointSet {
        int[] parent, rank;

        DisjointSet(int n) {
            parent = new int[n];
            rank = new int[n];
            for (int i = 0; i < n; i++) parent[i] = i;
        }

        int find(int x) {
            if (parent[x] != x) parent[x] = find(parent[x]);
            return parent[x];
        }

        boolean union(int a, int b) {
            int ra = find(a), rb = find(b);
            if (ra == rb) return false;
            if (rank[ra] < rank[rb]) parent[ra] = rb;
            else if (rank[ra] > rank[rb]) parent[rb] = ra;
            else { parent[rb] = ra; rank[ra]++; }
            return true;
        }
    }

    static class MSTResult {
        List<Road> edges = new ArrayList<>();
        int totalDist = 0;
        int candidateTotalDist = 0;
        boolean connected;
    }

    // greedily picks the cheapest roads that don't form a cycle, tracked with union-find
    static MSTResult kruskalMST() {
        List<Road> candidates = new ArrayList<>();
        for (Road r : CityData.roads) if (!r.blocked) candidates.add(r);
        candidates.sort(Comparator.comparingInt(r -> r.dist));

        DisjointSet dsu = new DisjointSet(CityData.junctions.size());
        MSTResult result = new MSTResult();
        for (Road r : candidates) {
            result.candidateTotalDist += r.dist;
            if (dsu.union(r.from, r.to)) {
                result.edges.add(r);
                result.totalDist += r.dist;
            }
        }
        Set<Integer> roots = new HashSet<>();
        for (Junction j : CityData.junctions) roots.add(dsu.find(j.id));
        result.connected = roots.size() == 1;
        return result;
    }
}
