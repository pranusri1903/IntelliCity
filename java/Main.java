import java.util.*;

public class Main {
    static Scanner sc = new Scanner(System.in);
    static Random rand = new Random();

    public static void main(String[] args) {
        CityData.init();
        System.out.println("=== IntelliCity — Smart City Traffic Simulator (Java CLI) ===");
        boolean running = true;
        while (running) {
            printMenu();
            int choice = readInt("Choose an option: ");
            switch (choice) {
                case 1:  listJunctions(); break;
                case 2:  listRoads(); break;
                case 3:  listVehicles(); break;
                case 4:  runDijkstra(); break;
                case 5:  runBFS(); break;
                case 6:  runDFS(); break;
                case 7:  runFloydWarshall(); break;
                case 8:  runKruskalMST(); break;
                case 9:  viewSignals(); break;
                case 10: optimizeSignals(); break;
                case 11: congestionReport(); break;
                case 12: blockOrUnblockRoad(); break;
                case 13: editJunctionVehicleCount(); break;
                case 14: editRoadCongestion(); break;
                case 15: dispatchEmergencyVehicle(); break;
                case 16: clearEmergencyOverrides(); break;
                case 17: simulateTick(); break;
                case 0:  running = false; break;
                default: System.out.println("Invalid option.");
            }
        }
        System.out.println("Goodbye!");
    }

    static void printMenu() {
        System.out.println();
        System.out.println("---------------------------------------------");
        System.out.println(" 1. List Junctions");
        System.out.println(" 2. List Roads");
        System.out.println(" 3. List Vehicles");
        System.out.println(" 4. Dijkstra - Shortest Path");
        System.out.println(" 5. BFS - Alternate Route");
        System.out.println(" 6. DFS - Network Traversal");
        System.out.println(" 7. Floyd-Warshall - All-Pairs Matrix");
        System.out.println(" 8. Kruskal MST - Infrastructure Planning");
        System.out.println(" 9. View Traffic Signals");
        System.out.println("10. Optimize Signals (Greedy)");
        System.out.println("11. Congestion Report");
        System.out.println("12. Block / Unblock Road");
        System.out.println("13. Edit Junction Vehicle Count");
        System.out.println("14. Edit Road Congestion");
        System.out.println("15. Dispatch Emergency Vehicle");
        System.out.println("16. Clear Emergency Overrides");
        System.out.println("17. Simulate Tick (+30s)");
        System.out.println(" 0. Exit");
        System.out.println("---------------------------------------------");
    }

    static int readInt(String prompt) {
        System.out.print(prompt);
        while (true) {
            String line = sc.nextLine().trim();
            try {
                return Integer.parseInt(line);
            } catch (NumberFormatException e) {
                System.out.print("Enter a valid number: ");
            }
        }
    }

    static boolean validJunction(int id) {
        if (id < 0 || id >= CityData.junctions.size()) {
            System.out.println("Invalid junction ID.");
            return false;
        }
        return true;
    }

    static void listJunctions() {
        System.out.printf("%-4s %-26s %-9s %-8s %-8s%n", "ID", "Name", "Zone", "Signal", "Vehicles");
        for (Junction j : CityData.junctions) {
            System.out.printf("%-4d %-26s %-9s %-8s %-8d%n",
                j.id, j.name, j.zone, j.hasSignal ? "Yes" : "No", j.vehicleCount);
        }
    }

    static void listRoads() {
        System.out.printf("%-30s %-22s %-8s %-6s %-8s%n", "Road Name", "From -> To", "Dist(m)", "Cong", "Status");
        for (Road r : CityData.roads) {
            String link = CityData.jName(r.from) + " -> " + CityData.jName(r.to);
            System.out.printf("%-30s %-22s %-8d %-6d %-8s%n",
                r.name, link, r.dist, r.cong, r.blocked ? "BLOCKED" : "OPEN");
        }
    }

    static void listVehicles() {
        System.out.printf("%-4s %-14s %-12s %-22s %-8s %-10s%n", "ID", "Plate", "Type", "From -> To", "Fuel%", "Emergency");
        for (Vehicle v : CityData.vehicles) {
            String link = CityData.jName(v.from) + " -> " + CityData.jName(v.to);
            System.out.printf("%-4d %-14s %-12s %-22s %-8.1f %-10s%n",
                v.id, v.plate, v.type, link, v.fuel, v.isEmergency() ? "YES" : "-");
        }
    }

    static void runDijkstra() {
        listJunctions();
        int src = readInt("Source junction ID: ");
        int dst = readInt("Destination junction ID: ");
        if (!validJunction(src) || !validJunction(dst)) return;
        if (src == dst) { System.out.println("Source and destination are the same."); return; }
        GraphAlgorithms.PathResult r = GraphAlgorithms.dijkstra(src);
        List<Integer> path = GraphAlgorithms.getPath(r.prev, dst);
        if (path.isEmpty() || r.dist[dst] >= CityData.INF) {
            System.out.println("No path found from " + CityData.jName(src) + " to " + CityData.jName(dst));
            return;
        }
        printPath(path);
        System.out.println("Effective Cost: " + r.dist[dst] + " (distance + congestion penalty)");
        System.out.println("Hops: " + (path.size() - 1));
        for (int i = 1; i < path.size(); i++) {
            Edge e = r.prevEdge[path.get(i)];
            System.out.println("  " + CityData.jName(path.get(i - 1)) + " -> " + CityData.jName(path.get(i))
                + ": " + e.road.dist + "m + " + e.road.cong + "x50 penalty (" + e.road.name + ")");
        }
    }

    static void runBFS() {
        listJunctions();
        int src = readInt("Source junction ID: ");
        int dst = readInt("Destination junction ID: ");
        if (!validJunction(src) || !validJunction(dst)) return;
        List<Integer> path = GraphAlgorithms.bfs(src, dst);
        if (path.isEmpty()) {
            System.out.println("No BFS path found from " + CityData.jName(src) + " to " + CityData.jName(dst));
            return;
        }
        printPath(path);
        System.out.println("Hops (unweighted): " + (path.size() - 1));
    }

    static void runDFS() {
        listJunctions();
        int start = readInt("Start junction ID: ");
        if (!validJunction(start)) return;
        List<Integer> order = GraphAlgorithms.dfs(start);
        printPath(order);
        System.out.println("Nodes reached: " + order.size() + " / " + CityData.junctions.size());
        System.out.println(order.size() == CityData.junctions.size()
            ? "Network is fully connected."
            : "Network has disconnected components!");
    }

    static void runFloydWarshall() {
        int[][] d = GraphAlgorithms.floydWarshall();
        int n = CityData.junctions.size();
        System.out.printf("%-6s", "");
        for (Junction j : CityData.junctions) System.out.printf("%7s", shortName(j));
        System.out.println();
        for (int i = 0; i < n; i++) {
            System.out.printf("%-6s", shortName(CityData.junctions.get(i)));
            for (int j = 0; j < n; j++) {
                String val = d[i][j] >= CityData.INF ? "INF" : String.valueOf(d[i][j]);
                System.out.printf("%7s", val);
            }
            System.out.println();
        }
    }

    static String shortName(Junction j) {
        String first = j.name.split(" ")[0];
        return first.length() > 6 ? first.substring(0, 6) : first;
    }

    static void runKruskalMST() {
        GraphAlgorithms.MSTResult r = GraphAlgorithms.kruskalMST();
        System.out.printf("%-30s %-22s %-8s%n", "Road Name", "From -> To", "Dist(m)");
        for (Road road : r.edges) {
            String link = CityData.jName(road.from) + " -> " + CityData.jName(road.to);
            System.out.printf("%-30s %-22s %-8d%n", road.name, link, road.dist);
        }
        System.out.println("Roads selected: " + r.edges.size() + " / " + (CityData.junctions.size() - 1));
        System.out.println(r.connected ? "Network fully connected." : "Network has disconnected components!");
        System.out.println("MST total distance: " + r.totalDist + "m vs " + r.candidateTotalDist + "m across all open roads");
        double savings = r.candidateTotalDist > 0 ? (100.0 * (1 - (double) r.totalDist / r.candidateTotalDist)) : 0;
        System.out.printf("Infrastructure savings: %.1f%%%n", savings);
    }

    static void viewSignals() {
        System.out.printf("%-26s %-9s %-7s %-8s %-6s %-6s %-10s%n", "Junction", "Zone", "Phase", "Density", "Green", "Red", "Override");
        for (Junction j : CityData.junctions) {
            Signal s = CityData.signals.get(j.id);
            if (s == null) continue;
            System.out.printf("%-26s %-9s %-7s %-8d %-6d %-6d %-10s%n",
                j.name, j.zone, s.phase, s.density, s.green, s.red, s.emergency ? "YES" : "-");
        }
    }

    static void optimizeSignals() {
        for (Map.Entry<Integer, Signal> e : CityData.signals.entrySet()) {
            CityData.applySignalDensity(e.getKey(), e.getValue().density);
        }
        System.out.println("Signals optimized using greedy algorithm.");
    }

    static void congestionReport() {
        List<Junction> byVehicles = new ArrayList<>(CityData.junctions);
        byVehicles.sort((a, b) -> b.vehicleCount - a.vehicleCount);
        System.out.println("Top congested junctions:");
        for (Junction j : byVehicles) {
            System.out.printf("  %-26s %-9s vehicles: %d%n", j.name, j.zone, j.vehicleCount);
        }
        List<Road> byCong = new ArrayList<>(CityData.roads);
        byCong.sort((a, b) -> b.cong - a.cong);
        System.out.println();
        System.out.println("Road congestion ranking:");
        for (Road r : byCong) {
            System.out.printf("  %-30s %2d/10  %s%n", r.name, r.cong, r.blocked ? "BLOCKED" : "OPEN");
        }
    }

    static void blockOrUnblockRoad() {
        listRoads();
        int from = readInt("Junction A ID: ");
        int to = readInt("Junction B ID: ");
        if (!validJunction(from) || !validJunction(to)) return;
        int mode = readInt("Block (1) or Unblock (0)? ");
        boolean doBlock = mode == 1;
        List<Road> matches = new ArrayList<>();
        for (Road r : CityData.roads) {
            if ((r.from == from && r.to == to) || (r.from == to && r.to == from)) matches.add(r);
        }
        if (matches.isEmpty()) {
            System.out.println("No road between " + CityData.jName(from) + " and " + CityData.jName(to));
            return;
        }
        for (Road r : matches) r.blocked = doBlock;
        System.out.println((doBlock ? "Blocked " : "Unblocked ") + matches.size() + " road(s) between "
            + CityData.jName(from) + " and " + CityData.jName(to));
    }

    static void editJunctionVehicleCount() {
        listJunctions();
        int id = readInt("Junction ID: ");
        if (!validJunction(id)) return;
        int val = readInt("New vehicle count: ");
        Junction j = CityData.findJunction(id);
        j.vehicleCount = val;
        CityData.applySignalDensity(id, val);
        System.out.println("Updated " + j.name + " -> " + val + " vehicles");
    }

    static void editRoadCongestion() {
        int from = readInt("Junction A ID: ");
        int to = readInt("Junction B ID: ");
        if (!validJunction(from) || !validJunction(to)) return;
        List<Road> matches = new ArrayList<>();
        for (Road r : CityData.roads) {
            if ((r.from == from && r.to == to) || (r.from == to && r.to == from)) matches.add(r);
        }
        if (matches.isEmpty()) { System.out.println("No road between those junctions."); return; }
        Road target = matches.get(0);
        if (matches.size() > 1) {
            System.out.println("Multiple roads found:");
            for (int i = 0; i < matches.size(); i++) System.out.println("  " + i + ": " + matches.get(i).name);
            int idx = readInt("Choose road index: ");
            target = matches.get(Math.max(0, Math.min(matches.size() - 1, idx)));
        }
        int val = readInt("New congestion (0-10): ");
        target.cong = Math.max(0, Math.min(10, val));
        System.out.println("Updated \"" + target.name + "\" congestion -> " + target.cong + "/10");
    }

    static void dispatchEmergencyVehicle() {
        List<Vehicle> evs = new ArrayList<>();
        for (Vehicle v : CityData.vehicles) if (v.isEmergency()) evs.add(v);
        System.out.printf("%-4s %-14s %-12s %-22s%n", "ID", "Plate", "Type", "From -> To");
        for (Vehicle v : evs) {
            System.out.printf("%-4d %-14s %-12s %-22s%n", v.id, v.plate, v.type,
                CityData.jName(v.from) + " -> " + CityData.jName(v.to));
        }
        int vid = readInt("Vehicle ID to dispatch: ");
        Vehicle v = null;
        for (Vehicle ve : CityData.vehicles) if (ve.id == vid) v = ve;
        if (v == null) { System.out.println("Vehicle not found."); return; }

        GraphAlgorithms.PathResult r = GraphAlgorithms.dijkstra(v.from);
        List<Integer> path = GraphAlgorithms.getPath(r.prev, v.to);
        if (path.isEmpty() || r.dist[v.to] >= CityData.INF) {
            System.out.println("No route available for " + v.plate);
            return;
        }
        int clearAtTick = CityData.simTick + Math.max(3, (path.size() - 1) * 2);
        for (int id : path) {
            Signal s = CityData.signals.get(id);
            if (s != null) {
                s.emergency = true;
                s.phase = "GREEN";
                s.emergencyUntilTick = clearAtTick;
            }
        }
        System.out.println("DISPATCH: " + v.type + " " + v.plate);
        printPath(path);
        System.out.println("Effective Cost: " + r.dist[v.to] + " | Hops: " + (path.size() - 1));
        System.out.println("Signal override active on " + path.size() + " junctions (auto-clears by tick " + clearAtTick + ")");
    }

    static void clearEmergencyOverrides() {
        int cleared = 0;
        for (Map.Entry<Integer, Signal> e : CityData.signals.entrySet()) {
            Signal s = e.getValue();
            if (s.emergency) {
                s.emergency = false;
                s.emergencyUntilTick = null;
                CityData.applySignalDensity(e.getKey(), CityData.findJunction(e.getKey()).vehicleCount);
                cleared++;
            }
        }
        System.out.println(cleared > 0 ? cleared + " signal override(s) cleared." : "No active overrides to clear.");
    }

    static void simulateTick() {
        CityData.simTick++;
        for (Map.Entry<Integer, Signal> entry : CityData.signals.entrySet()) {
            Signal s = entry.getValue();
            if (s.emergency) {
                if (s.emergencyUntilTick != null && CityData.simTick >= s.emergencyUntilTick) {
                    s.emergency = false;
                    s.emergencyUntilTick = null;
                    CityData.applySignalDensity(entry.getKey(), CityData.findJunction(entry.getKey()).vehicleCount);
                }
                continue;
            }
            s.timeLeft -= 30;
            if (s.timeLeft <= 0) {
                if (s.phase.equals("GREEN")) { s.phase = "YELLOW"; s.timeLeft = s.yellow; }
                else if (s.phase.equals("YELLOW")) { s.phase = "RED"; s.timeLeft = s.red; }
                else { s.phase = "GREEN"; s.timeLeft = s.green; }
            }
        }
        for (Junction j : CityData.junctions) {
            j.vehicleCount = Math.max(0, j.vehicleCount + rand.nextInt(7) - 3);
        }
        for (Vehicle v : CityData.vehicles) {
            v.fuel = Math.max(0, v.fuel - rand.nextDouble() * 0.8);
        }
        System.out.println("Tick " + CityData.simTick + " simulated (+30s).");
    }

    static void printPath(List<Integer> path) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < path.size(); i++) {
            sb.append(CityData.jName(path.get(i)));
            if (i < path.size() - 1) sb.append(" -> ");
        }
        System.out.println(sb.toString());
    }
}
