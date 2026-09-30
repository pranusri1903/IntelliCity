# IntelliCity — Java CLI

Same city graph and algorithms as the web version, as a terminal menu app instead of a browser UI.

## Files

- `CityData.java` — junctions, roads, vehicles, adjacency list, signal state
- `GraphAlgorithms.java` — Dijkstra, BFS, DFS, Floyd-Warshall, Kruskal's MST (Union-Find)
- `Main.java` — menu loop and console I/O

## Run

```bash
cd java
javac *.java
java Main
```

## Notes

Things that only make sense as a graphical UI (animated SVG map, sliders, toast popups,
a real-time auto-simulation timer) were left out. Everything else — routing, traversal,
MST, signal optimization, congestion editing, road blocking, emergency dispatch, manual
tick simulation — works the same as the web version.
