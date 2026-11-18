<p align="center">
  <a href="https://andrew1407.github.io/DiscreteStructures/" title="Open the labs in the browser">
    <img src="web/icon.svg" alt="Discrete Structures Labs" width="96" height="96">
  </a>
</p>

[![pages](https://github.com/Andrew1407/DiscreteStructures/actions/workflows/pages.yml/badge.svg)](https://github.com/Andrew1407/DiscreteStructures/actions/workflows/pages.yml)

# DiscreteStructures

A set of Scilab scripts for a discrete structures course, covering graph representation, vertex degrees, path enumeration, reachability and connectivity, and classic graph traversal and optimization algorithms. Each script builds a pseudo-random graph from a fixed seed, draws it, and prints the corresponding matrices and results.

## Overview

All scripts share the same setup. A seed is derived from four constants (`n1`–`n4`), a random adjacency matrix `A` is generated and thresholded, and the graph is laid out with its vertices on a circle plus one central vertex. The scripts then build the symmetric (undirected) matrix `A2` and the directed matrix `A3`, render the graph with Scilab's plotting primitives (`xarc`, `xsegs`, `xarrows`, `xnumb`), and print results to the console. A `_switch`/`bool` flag toggles between drawing the graph as undirected (segments) or directed (arrows).

Console output and labels are in Ukrainian.

## Scripts

| File | Topic | What it does |
| --- | --- | --- |
| [`Scilab/1-lab_3.1.1.sce`](Scilab/1-lab_3.1.1.sce) | Graph construction | Generates the random graph and draws it in directed or undirected form; prints the directed (`A3`) and undirected (`A2`) adjacency matrices. |
| [`Scilab/2-lab.sce`](Scilab/2-lab.sce) | Vertex degrees | Builds and draws the graph, then computes vertex degrees, in/out semi-degrees (`δ(+)`, `δ(-)`), identifies isolated and pendant vertices, and checks whether the undirected graph is regular. |
| [`Scilab/3-lab.sce`](Scilab/3-lab.sce) | Paths, reachability, condensation | Computes paths of length 2 and 3 via powers of the adjacency matrix (`E^2`, `E^3`), builds the reachability matrix `R` and connectivity matrix `S`, finds strongly connected components, and draws/prints the condensation graph. |
| [`Scilab/4-lab.sce`](Scilab/4-lab.sce) | Depth-first traversal | Draws the directed graph, then runs a depth-first search using an explicit stack, prints the traversal order and the vertex/order correspondence matrix, and draws the resulting spanning tree. |
| [`Scilab/5-lab_1.1.sce`](Scilab/5-lab_1.1.sce) | Minimum spanning tree (Kruskal) | Assigns random edge weights, then builds a minimum spanning tree with Kruskal's algorithm (selecting the lightest cycle-free edge each step using matrix powers for cycle detection), animating each added edge and printing the tree's adjacency matrix. |
| [`Scilab/6-lab.sce`](Scilab/6-lab.sce) | Shortest paths (Dijkstra) | Assigns random edge weights and runs Dijkstra's algorithm from an automatically chosen start vertex, marking permanent vertices step by step and printing the shortest path and its total weight to every other vertex. |

## Algorithms

- Adjacency-matrix graph representation (directed `A3` and undirected `A2`)
- Vertex degree and in/out semi-degree computation; isolated, pendant, and regular-graph checks
- Path enumeration by adjacency-matrix powers
- Reachability and connectivity matrices; strongly connected components and graph condensation
- Depth-first traversal with a spanning tree
- Kruskal's minimum spanning tree algorithm
- Dijkstra's shortest-path algorithm

## Tech stack

- [Scilab](https://www.scilab.org/) — `.sce` scripts using built-in matrix operations and 2D graphics primitives (`plot2d`, `xarc`, `xsegs`, `xarrows`, `xnumb`).

## Running

Open a script in Scilab and execute it, for example:

```scilab
exec("Scilab/3-lab.sce", -1);
```

Or run it from the Scilab console with `File > Execute…`. Each script opens a graphics window and pauses at `halt()` calls, so press Enter (or click the console) to advance through the steps; the traversal and algorithm scripts step through their stages one at a time. The graph is determined by the `n1`–`n4` constants at the top of each file; edit them to change the generated graph.

## In the browser

**[andrew1407.github.io/DiscreteStructures](https://andrew1407.github.io/DiscreteStructures/)** runs all six labs without Scilab. Pick a variant (`n1`–`n4`), step through DFS, Kruskal and Dijkstra, read the console output next to the graph (translated into English), and copy or download the graph as a PNG. You can also change the number of vertices (the scripts use `10 + n3`) and choose whether the last vertex is drawn in the centre or on the circle.

Scilab has no browser build, so [`web/`](web) is a JavaScript port. It reproduces Scilab's `rand()` generator exactly, so each variant produces the same graph as in Scilab. [`web/test/compare.mjs`](web/test/compare.mjs) runs every `.sce` in real Scilab (graphics stubbed out) for several variants and checks that the port prints the same lines. CI runs it before each deploy.

Run the page locally (ES modules need a server):

```bash
python3 -m http.server -d web 8000   # then open http://localhost:8000
```

Check it against Scilab (needs `scilab-cli`, or Docker):

```bash
node web/test/compare.mjs
SCILAB_DOCKER=<image with scilab-cli> node web/test/compare.mjs
```

Two quirks of the original scripts are flagged on the page, and each has an optional fix:

- **Lab 5 (Kruskal):** the cycle test checks `M^k(a, b)` on the directed tree matrix, so it misses undirected cycles. For the default variant 8506 the result contains the cycle 2–10–6–4–2 and is not a spanning tree.
- **Lab 6 (Dijkstra):** distances are correct, but a printed route can be longer than its distance. Every recorded route ending at a vertex is tagged with that vertex's best weight.

## Project structure

```
DiscreteStructures/
├── Scilab/
│   ├── 1-lab_3.1.1.sce   # graph construction and rendering
│   ├── 2-lab.sce         # vertex degrees and graph properties
│   ├── 3-lab.sce         # paths, reachability, connectivity, condensation
│   ├── 4-lab.sce         # depth-first traversal and spanning tree
│   ├── 5-lab_1.1.sce     # minimum spanning tree (Kruskal)
│   └── 6-lab.sce         # shortest paths (Dijkstra)
├── web/                  # browser version (GitHub Pages)
│   ├── index.html, style.css
│   ├── js/core.js        # Scilab rand() port, matrix helpers, graph setup
│   ├── js/labs.js        # the six labs, ported step for step
│   ├── js/render.js      # SVG graph drawing
│   ├── js/app.js         # page UI
│   └── test/             # comparison against real Scilab
└── .github/workflows/pages.yml
```
