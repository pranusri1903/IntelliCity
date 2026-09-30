# IntelliCity — Smart City Management & Optimization System

A futuristic **Smart City Traffic Management Simulator** built using **HTML, CSS, and JavaScript**, inspired by graph theory and advanced routing algorithms used in modern urban infrastructure systems.

IntelliCity simulates a real-time city traffic ecosystem with intelligent routing, congestion analysis, emergency vehicle dispatching, dynamic signal optimization, and interactive visualization of a city road network.

Originally conceptualized as a Data Structures & Algorithms project in C++, this implementation transforms the system into a fully interactive and visually rich web-based simulation. 

---

## 🚀 Features

* 🌐 Interactive Smart City Dashboard
* 🛣️ Dynamic Road Network Visualization
* 🚦 Smart Traffic Signal Optimization
* 🚑 Emergency Vehicle Dispatch System
* 📍 Shortest Path Routing using Dijkstra’s Algorithm (binary min-heap priority queue)
* 🔄 Alternate Route Detection using BFS
* 🧭 Network Traversal using DFS
* 📊 All-Pairs Routing using Floyd-Warshall Algorithm
* 🌲 Minimum Spanning Tree Infrastructure Planning using Kruskal's Algorithm & Union-Find
* 📈 Real-Time Congestion Monitoring
* 🚧 Road Blocking & Rerouting Simulation (including parallel/multi-edge roads)
* 🚑 Auto-expiring Emergency Signal Overrides
* 🚘 Vehicle Registry & Simulation
* 🧠 Algorithm Visualisation & Analysis
* 🎨 Futuristic Cyberpunk-inspired UI Design

---

# 🧠 Algorithms Used

### Dijkstra’s Algorithm

Computes the shortest congestion-aware route between two junctions using weighted graphs. 

### Floyd-Warshall Algorithm

Generates an all-pairs shortest path matrix for complete city-wide routing analysis. 

### BFS (Breadth-First Search)

Finds minimum-hop alternate routes during congestion or road blockage scenarios. 

### DFS (Depth-First Search)

Used for complete network traversal and connectivity verification. 

### Greedy Traffic Optimization

Dynamically adjusts traffic signal timing based on vehicle density. 

### Kruskal's Algorithm (Minimum Spanning Tree)

Uses a disjoint-set (union-find) structure to compute the minimum-cost subset of roads needed to keep every junction connected — used for optimal infrastructure planning.

---

# 🏙️ City Simulation

The simulation models a smart city inspired by Lucknow with:

* 15 Junctions
* Multiple city zones
* 20+ interconnected roads
* Real-time congestion metrics
* Emergency routing support
* Dynamic signal systems

The web interface provides an interactive visualization of the city graph and live traffic state. 

---

# 🛠️ Tech Stack

### Frontend

* HTML5
* CSS3
* JavaScript (Vanilla JS)

### Concepts & DSA

* Graph Theory
* Adjacency Lists
* Priority Queues (custom binary min-heap)
* Disjoint Set / Union-Find
* Dynamic Programming
* Greedy Algorithms
* Graph Traversal Algorithms

---

# 📂 Project Structure

```bash
IntelliCity/
│
├── index.html          # Markup only
├── css/
│   └── style.css       # All styling
├── js/
│   ├── data.js          # Junctions, roads, vehicles, adjacency list, signal state
│   ├── algorithms.js    # Dijkstra (min-heap), BFS, DFS, Floyd-Warshall, Kruskal/Union-Find
│   └── app.js           # Rendering, event handlers, simulation loop
└── README.md
```

---

# 💻 Running the Project Locally

1. Clone the repository

```bash
git clone https://github.com/your-username/IntelliCity.git
```

2. Open the project folder

```bash
cd IntelliCity
```

3. Run the project

Simply open:

```bash
index.html
```

in your browser.

---


# 📸 Highlights

* Futuristic UI with animated smart-city dashboard
* Real-time traffic signal visualization
* Interactive city map rendering
* Congestion heat indicators
* Emergency override system
* Responsive layout with cyberpunk-inspired aesthetics

The frontend implementation and UI are available in the attached HTML source file. 

---


# 📌 Future Improvements

* Backend integration with live APIs
* Real-time vehicle simulation engine
* AI-powered congestion prediction
* Database integration
* Authentication & admin dashboard
* Multi-city scalability
* Real-time IoT traffic sensor integration

---

# 📄 License

This project is developed for educational and demonstration purposes.

---

# ⭐ Support

If you liked this project, consider giving it a ⭐ on GitHub.
