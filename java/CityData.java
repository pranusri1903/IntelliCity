import java.util.*;

class Junction {
    int id;
    String name;
    String zone;
    boolean hasSignal;
    int vehicleCount;

    Junction(int id, String name, String zone, boolean hasSignal, int vehicleCount) {
        this.id = id;
        this.name = name;
        this.zone = zone;
        this.hasSignal = hasSignal;
        this.vehicleCount = vehicleCount;
    }
}

class Road {
    int from, to;
    String name;
    int dist;
    int cong;
    boolean blocked;

    Road(int from, int to, String name, int dist, int cong) {
        this.from = from;
        this.to = to;
        this.name = name;
        this.dist = dist;
        this.cong = cong;
        this.blocked = false;
    }

    int effectiveWeight() {
        return blocked ? CityData.INF : dist + cong * 50;
    }
}

class Edge {
    int to;
    Road road;

    Edge(int to, Road road) {
        this.to = to;
        this.road = road;
    }
}

class Vehicle {
    int id;
    String plate;
    String type;
    int from, to;
    double fuel;

    Vehicle(int id, String plate, String type, int from, int to, double fuel) {
        this.id = id;
        this.plate = plate;
        this.type = type;
        this.from = from;
        this.to = to;
        this.fuel = fuel;
    }

    boolean isEmergency() {
        return type.equals("AMBULANCE") || type.equals("FIRE_TRUCK") || type.equals("POLICE");
    }
}

class Signal {
    String phase = "RED";
    int green, yellow = 5, red, density, timeLeft;
    boolean emergency = false;
    Integer emergencyUntilTick = null;
}

public class CityData {
    static final int INF = 1_000_000_000;

    static List<Junction> junctions = new ArrayList<>();
    static List<Road> roads = new ArrayList<>();
    static List<Vehicle> vehicles = new ArrayList<>();
    static Map<Integer, List<Edge>> adj = new HashMap<>();
    static Map<Integer, Signal> signals = new LinkedHashMap<>();
    static int simTick = 0;

    static void init() {
        junctions.add(new Junction(0,  "Hazratganj Circle",       "Central", true,  85));
        junctions.add(new Junction(1,  "Charbagh Junction",       "South",   true,  60));
        junctions.add(new Junction(2,  "Alambagh Crossing",       "South",   true,  30));
        junctions.add(new Junction(3,  "Gomti Nagar Extension",   "East",    true,  72));
        junctions.add(new Junction(4,  "Indira Nagar Turn",       "East",    true,  30));
        junctions.add(new Junction(5,  "Aminabad Market",         "Central", true,  45));
        junctions.add(new Junction(6,  "SGPGI Hospital Road",     "South",   true,  10));
        junctions.add(new Junction(7,  "Dubagga Crossing",        "West",    true,  5));
        junctions.add(new Junction(8,  "Rajajipuram Square",      "West",    true,  8));
        junctions.add(new Junction(9,  "Amausi Airport Road",     "South",   true,  20));
        junctions.add(new Junction(10, "Lucknow University Gate", "Central", true,  12));
        junctions.add(new Junction(11, "Transport Nagar",         "South",   false, 90));
        junctions.add(new Junction(12, "Chowk Intersection",      "West",    true,  4));
        junctions.add(new Junction(13, "Kaiserbagh Bus Stand",    "Central", true,  6));
        junctions.add(new Junction(14, "IT City Park",            "East",    true,  9));

        roads.add(new Road(0,  1,  "Hazratganj-Charbagh Road",    800,  7));
        roads.add(new Road(0,  3,  "Gomti River Boulevard",       600,  4));
        roads.add(new Road(0,  5,  "Hazratganj-Aminabad Link",    700,  0));
        roads.add(new Road(0,  7,  "Ring Road West Corridor",     500,  0));
        roads.add(new Road(0,  13, "Kaiserbagh Connector",        200,  0));
        roads.add(new Road(1,  2,  "Charbagh-Alambagh Route",     400,  0));
        roads.add(new Road(1,  9,  "Airport Express Road",        900,  2));
        roads.add(new Road(2,  9,  "Amausi Link Road",            600,  0));
        roads.add(new Road(2,  3,  "Shaheed Path East",           1100, 0));
        roads.add(new Road(3,  4,  "Gomti Nagar Main Street",     350,  6));
        roads.add(new Road(3,  10, "University Connector",        400,  0));
        roads.add(new Road(4,  10, "Indira-Uni Route",            300,  0));
        roads.add(new Road(4,  14, "IT Corridor Road",            500,  0));
        roads.add(new Road(4,  9,  "Airport Outer Highway",       1200, 0));
        roads.add(new Road(5,  6,  "SGPGI Access Road",           250,  0));
        roads.add(new Road(5,  11, "Transport Nagar Route",       700,  8));
        roads.add(new Road(6,  11, "Southern Ring Road",          500,  0));
        roads.add(new Road(7,  8,  "Dubagga-Rajajipuram Road",    400,  0));
        roads.add(new Road(7,  12, "Chowk Heritage Route",        300,  0));
        roads.add(new Road(8,  12, "Rajajipuram-Chowk Link",      350,  0));
        roads.add(new Road(8,  11, "Industrial Freight Corridor", 800,  0));
        roads.add(new Road(10, 14, "IT City Flyover",             200,  0));
        roads.add(new Road(0,  5,  "Central Market Road",         500,  2));
        roads.add(new Road(1,  5,  "Charbagh-Aminabad Link",      650,  4));
        roads.add(new Road(2,  11, "Alambagh Freight Route",      550,  3));
        roads.add(new Road(3,  10, "Gomti-University Road",       400,  2));
        roads.add(new Road(4,  10, "Indira-University Route",     350,  2));
        roads.add(new Road(6,  5,  "Hospital Market Road",        700,  1));
        roads.add(new Road(7,  0,  "West Ring Road",              600,  2));
        roads.add(new Road(8,  11, "Rajajipuram Industrial Road", 750,  4));
        roads.add(new Road(9,  1,  "Airport-Charbagh Expressway", 850,  5));
        roads.add(new Road(12, 13, "Chowk-Kaiserbagh Heritage Rd",500,  2));
        roads.add(new Road(14, 3,  "IT-Gomti Smart Road",         450,  1));

        vehicles.add(new Vehicle(1,  "UP32-AB1234", "CAR",        0,  14, 100.0));
        vehicles.add(new Vehicle(2,  "UP32-CD5678", "TRUCK",      1,  5,  88.5));
        vehicles.add(new Vehicle(3,  "AMB-001",     "AMBULANCE",  6,  9,  95.0));
        vehicles.add(new Vehicle(4,  "FIRE-002",    "FIRE_TRUCK", 12, 3,  100.0));
        vehicles.add(new Vehicle(5,  "POL-003",     "POLICE",     13, 11, 91.0));
        vehicles.add(new Vehicle(6,  "UP32-EF9012", "MOTORCYCLE", 7,  10, 78.0));
        vehicles.add(new Vehicle(7,  "UP32-GH3456", "CAR",        9,  5,  65.5));
        vehicles.add(new Vehicle(8,  "UP32-IJ7890", "TRUCK",      2,  8,  55.0));
        vehicles.add(new Vehicle(9,  "POL-007",     "POLICE",     0,  11, 99.0));
        vehicles.add(new Vehicle(10, "AMB-002",     "AMBULANCE",  3,  12, 82.0));

        for (Road r : roads) {
            adj.computeIfAbsent(r.from, k -> new ArrayList<>()).add(new Edge(r.to, r));
            adj.computeIfAbsent(r.to, k -> new ArrayList<>()).add(new Edge(r.from, r));
        }

        for (Junction j : junctions) {
            if (j.hasSignal) {
                signals.put(j.id, new Signal());
                applySignalDensity(j.id, j.vehicleCount);
            }
        }
    }

    static void applySignalDensity(int id, int density) {
        Signal s = signals.get(id);
        if (s == null || s.emergency) return;
        s.density = Math.min(100, density);
        int d = density;
        s.green = d > 70 ? 60 : d > 40 ? 40 : 20;
        s.red   = d > 70 ? 20 : d > 40 ? 30 : 45;
        s.phase = d > 60 ? "GREEN" : d > 30 ? "YELLOW" : "RED";
        s.timeLeft = s.phase.equals("GREEN") ? s.green : s.phase.equals("YELLOW") ? s.yellow : s.red;
    }

    static Junction findJunction(int id) {
        for (Junction j : junctions) if (j.id == id) return j;
        return null;
    }

    static String jName(int id) {
        Junction j = findJunction(id);
        return j != null ? j.name : "J" + id;
    }
}
