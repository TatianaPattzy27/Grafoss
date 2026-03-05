let nodes = [];
let edges = [];
let selectedNode = null;
let currentMode = "create";
let matrixWindow = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let graphFileName = "grafo"; // Nombre personalizado para exportar

function showSection(id) {
  document.querySelectorAll(".content-section").forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function toggleMode() {
  currentMode = currentMode === "create" ? "modify" : "create";
  const btn = document.getElementById("btn-mode");
  const hint = document.getElementById("hint");

  if (currentMode === "modify") {
    btn.innerText = "Modo: Modificar";
    btn.classList.add("modify");
    hint.innerText = "Haz clic en una flecha o número para editar/borrar.";
  } else {
    btn.innerText = "Modo: Crear";
    btn.classList.remove("modify");
    hint.innerText = "Click en el fondo para crear nodo. Selecciona dos para conectar.";
  }
  selectedNode = null;
  render();
}

// Función para cambiar el nombre del archivo de exportación
function renameGraph() {
  const newName = prompt("Introduce el nombre para el archivo (sin extensión):", graphFileName);
  if (newName && newName.trim() !== "") {
    graphFileName = newName.trim();
    alert(`✅ El archivo se exportará como: ${graphFileName}.json`);
  }
}

const container = document.getElementById("graph-container");
const svgCanvas = document.getElementById("svg-canvas");
const edgesGroup = document.getElementById("edges-group");
const nodesLayer = document.getElementById("nodes-layer");

container.addEventListener("mousedown", (e) => {
  if (currentMode !== "create") return;
  if (e.target === container || e.target === svgCanvas) {
    const name = prompt("Nombre del vértice (ej. 1, A, v2):");
    if (name) {
      const rect = container.getBoundingClientRect();
      const newNode = {
        id: Date.now(),
        name,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      nodes.push(newNode);
      render();
    }
  }
});

function render() {
  nodesLayer.innerHTML = "";
  edgesGroup.innerHTML = "";

  edges.forEach((edge, index) => {
    const isDouble = edges.some(
      (e) => e.from.id === edge.to.id && e.to.id === edge.from.id && e !== edge,
    );
    const isReverse = isDouble && edge.from.id > edge.to.id;
    const color = isReverse ? "#333333" : "#f06292";
    const marker = isReverse ? "url(#arrow-black)" : "url(#arrow-pink)";

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("class", "edge-path");
    path.setAttribute("stroke", color);
    if (edge.directed) path.setAttribute("marker-end", marker);

    let d = "";
    if (edge.from.id === edge.to.id) {
      const x = edge.from.x;
      const y = edge.from.y - 22;
      d = `M ${x - 10} ${y} C ${x - 25} ${y - 40}, ${x + 25} ${y - 40}, ${x + 10} ${y}`;
    } else if (isDouble) {
      const midX = (edge.from.x + edge.to.x) / 2;
      const midY = (edge.from.y + edge.to.y) / 2;
      const dx = edge.to.x - edge.from.x;
      const dy = edge.to.y - edge.from.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const curveAmount = 35;
      const nx = -dy * (curveAmount / dist);
      const ny = dx * (curveAmount / dist);
      d = `M ${edge.from.x} ${edge.from.y} Q ${midX + nx} ${midY + ny} ${edge.to.x} ${edge.to.y}`;
    } else {
      d = `M ${edge.from.x} ${edge.from.y} L ${edge.to.x} ${edge.to.y}`;
    }

    path.setAttribute("d", d);

    path.onclick = (e) => {
      e.stopPropagation();
      if (currentMode === "modify") {
        const act = prompt("1: Eliminar Arista, 2: Cambiar Peso", "1");
        if (act === "1") edges.splice(index, 1);
        else if (act === "2") edge.weight = prompt("Nuevo peso:", edge.weight);
        render();
      }
    };

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    const point = path.getPointAtLength(path.getTotalLength() * 0.5);
    text.setAttribute("x", point.x);
    text.setAttribute("y", point.y - 15);
    text.setAttribute("fill", color);
    text.setAttribute("class", "edge-text");
    text.setAttribute("text-anchor", "middle");
    text.textContent = edge.weight;
    text.onclick = path.onclick;

    edgesGroup.appendChild(path);
    edgesGroup.appendChild(text);
  });

  nodes.forEach((node) => {
    const div = document.createElement("div");
    div.className = `node ${selectedNode === node ? "selected" : ""}`;
    div.style.left = node.x - 22 + "px";
    div.style.top = node.y - 22 + "px";
    div.innerText = node.name;

    div.onclick = (e) => {
      e.stopPropagation();
      if (currentMode === "modify") {
        const act = prompt("1: Eliminar Nodo, 2: Cambiar Nombre", "1");
        if (act === "1") {
          nodes = nodes.filter((n) => n.id !== node.id);
          edges = edges.filter((ed) => ed.from.id !== node.id && ed.to.id !== node.id);
        } else if (act === "2") node.name = prompt("Nuevo nombre:", node.name);
        render();
      } else {
        if (!selectedNode) {
          selectedNode = node;
        } else {
          const weight = prompt("Peso de la arista:", "1");
          const directed = confirm("¿Es una arista dirigida (con flecha)?");
          edges.push({ from: selectedNode, to: node, weight, directed });
          selectedNode = null;
        }
        render();
      }
    };
    nodesLayer.appendChild(div);
  });
}

// Función de exportación actualizada con nombre dinámico
function exportGraph() {
  if (nodes.length === 0) return alert("No hay datos para exportar.");
  const graphData = {
    nodes: nodes.map(n => ({ id: n.id, name: n.name, x: n.x, y: n.y })),
    edges: edges.map(e => ({ from: e.from.id, to: e.to.id, weight: e.weight, directed: e.directed }))
  };
  const blob = new Blob([JSON.stringify(graphData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${graphFileName}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
