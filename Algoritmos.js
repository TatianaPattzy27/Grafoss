let nodes = [];
let edges = [];
let selectedNode = null;
let currentMode = "create";
let matrixWindow = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

function showSection(id) {
  document
    .querySelectorAll(".content-section")
    .forEach((s) => s.classList.remove("active"));
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
    hint.innerText =
      "Click en el fondo para crear nodo. Selecciona dos para conectar.";
  }
  selectedNode = null;
  render();
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
        if (act === "1") {
          edges.splice(index, 1);
        } else if (act === "2") {
          let newWeight = prompt("Nuevo peso (solo números):", edge.weight);
          if (newWeight !== null) {
             if (!isNaN(newWeight) && newWeight.trim() !== "") {
                edge.weight = newWeight;
             } else {
                alert("Error: Debes ingresar un número válido.");
             }
          }
        }
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
          edges = edges.filter(
            (ed) => ed.from.id !== node.id && ed.to.id !== node.id,
          );
        } else if (act === "2") node.name = prompt("Nuevo nombre:", node.name);
        render();
      } else {
        if (!selectedNode) {
          selectedNode = node;
        } else {
          let weight = prompt("Peso de la arista (solo números):", "1");
          if (weight !== null) {
            if (!isNaN(weight) && weight.trim() !== "") {
              const directed = confirm("¿Es una arista dirigida (con flecha)?");
              edges.push({ from: selectedNode, to: node, weight, directed });
            } else {
              alert("Error: El peso debe ser un número.");
            }
          }
          selectedNode = null;
        }
        render();
      }
    };
    nodesLayer.appendChild(div);
  });
}

function clearCanvas() {
  if (confirm("¿Estás seguro de que quieres borrar todo el grafo?")) {
    nodes = [];
    edges = [];
    selectedNode = null;
    render();
  }
}

// ============== MATRIZ DRAGGABLE ==============
function showMatrix() {
  if (matrixWindow) {
    matrixWindow.remove();
  }
  matrixWindow = createDraggableMatrix();
  document.body.appendChild(matrixWindow);
}

function createDraggableMatrix() {
  const wrapper = document.createElement("div");
  wrapper.className = "drag-matrix-window";
  wrapper.style.cssText = `
        position: fixed;
        top: 50px;
        left: 50px;
        max-width: calc(100vw - 100px);
        max-height: calc(100vh - 100px);
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
        z-index: 1000;
        background: white;
        border: 1px solid #e2e8f0;
        overflow: hidden;
        user-select: none;
        display: flex;
        flex-direction: column;
    `;

  const titleBar = document.createElement("div");
  titleBar.style.cssText = `
        background: linear-gradient(135deg, #4f46e5, #6366f1);
        color: white;
        padding: 12px 16px;
        cursor: grab;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
    `;

  const titleInfo = document.createElement("div");
  titleInfo.style.cssText = "display: flex; align-items: center; gap: 10px;";
  titleInfo.innerHTML = `<span style="font-size: 18px;">⊞</span><span style="font-size: 14px; font-weight: 600;">Matriz de Adyacencia Ponderada Dirigida</span>`;

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "✕";
  closeBtn.style.cssText = `background: rgba(255, 255, 255, 0.15); border: none; color: white; cursor: pointer; padding: 6px 10px; border-radius: 6px;`;
  closeBtn.onclick = () => wrapper.remove();

  titleBar.appendChild(titleInfo);
  titleBar.appendChild(closeBtn);

  const body = document.createElement("div");
  body.style.cssText = `padding: 20px; overflow-y: auto; flex: 1; background: #f8fafc;`;
  body.innerHTML = generateMatrixHTML();

  wrapper.appendChild(titleBar);
  wrapper.appendChild(body);

  let pos = { x: 50, y: 50 };
  titleBar.onmousedown = (e) => {
    isDragging = true;
    dragOffset.x = e.clientX - pos.x;
    dragOffset.y = e.clientY - pos.y;
    const onMouseMove = (e) => {
      if (!isDragging) return;
      pos.x = e.clientX - dragOffset.x;
      pos.y = e.clientY - dragOffset.y;
      wrapper.style.left = pos.x + "px";
      wrapper.style.top = pos.y + "px";
    };
    const onMouseUp = () => {
      isDragging = false;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  return wrapper;
}function generateMatrixHTML() {
  if (nodes.length === 0) {
    return "<p style='text-align:center; color:#94a3b8; padding:40px;'>No hay nodos en el grafo. Crea nodos para generar la matriz.</p>";
  }

  let matrix = [];
  let rowSums = []; 
  let colSums = new Array(nodes.length).fill(0); 
  let rowEdgeCount = []; 
  let colEdgeCount = new Array(nodes.length).fill(0); 
  let selfLoops = 0;
  let directedEdges = 0;

  // 1. Cálculos de la matriz y estadísticas
  nodes.forEach((fromNode, i) => {
    matrix[i] = [];
    let weightSum = 0;
    let edgeCount = 0;

    nodes.forEach((toNode, j) => {
      const edge = edges.find(
        (e) => e.from.id === fromNode.id && e.to.id === toNode.id,
      );
      
      let valRaw = edge ? parseInt(edge.weight) : 0;
      let value = isNaN(valRaw) ? 0 : valRaw;
      
      matrix[i][j] = value;

      if (edge) {
        edgeCount++; 
        colEdgeCount[j]++; 
        if (i === j) selfLoops++;
        if (edge.directed) directedEdges++;
      }

      weightSum += value;
      colSums[j] += value;
    });

    rowSums[i] = weightSum;
    rowEdgeCount[i] = edgeCount;
  });

  // Cálculos para el análisis Max/Min
  let maxWeightOut = Math.max(...rowSums);
  let minWeightOut = Math.min(...rowSums);
  let maxWeightIn = Math.max(...colSums);
  let minWeightIn = Math.min(...colSums);

  let maxWeightOutNode = nodes[rowSums.indexOf(maxWeightOut)].name;
  let minWeightOutNode = nodes[rowSums.indexOf(minWeightOut)].name;
  let maxWeightInNode = nodes[colSums.indexOf(maxWeightIn)].name;
  let minWeightInNode = nodes[colSums.indexOf(minWeightIn)].name;

  // 2. Generación del HTML (Tabla Principal)
  let html = `
        <div style="background:white; padding:24px; border-radius:12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-bottom:20px;">
        <h3 style="color:#4f46e5; margin:0 0 20px 0; font-size:18px; display:flex; align-items:center; gap:8px;">
            <span>📊</span> Matriz de Adyacencia Ponderada Dirigida
        </h3>
        <div style="overflow-x: auto;">
        <table style="border-collapse:collapse; width:100%; text-align:center; font-size:13px;">
    `;

  html += `<tr style='background:linear-gradient(135deg, #4f46e5, #6366f1); color:white;'>
        <th style='padding:12px; border:1px solid #e2e8f0; font-weight:600;'>De \\ A</th>`;
  nodes.forEach((n) => {
    html += `<th style='padding:12px; border:1px solid #e2e8f0; font-weight:600;'>${n.name}</th>`;
  });
  html += `<th style='padding:12px; border:1px solid #e2e8f0; font-weight:600; background:#7c3aed;'>Σ Peso Salida</th>`;
  html += `<th style='padding:12px; border:1px solid #e2e8f0; font-weight:600; background:#7c3aed;'># Aristas Salida</th></tr>`;

  matrix.forEach((row, i) => {
    html += `<tr><th style='background:#e0e7ff; padding:10px; border:1px solid #e2e8f0; color:#4f46e5;'>${nodes[i].name}</th>`;
    row.forEach((val) => {
      html += `<td style='padding:10px; border:1px solid #e2e8f0; background:${val > 0 ? "#fef3c7" : "#f8fafc"}; color:${val > 0 ? "#92400e" : "#94a3b8"}; font-weight:${val > 0 ? "bold" : "normal"};'>${val > 0 ? val : "—"}</td>`;
    });
    html += `<td style='background:#dbeafe; padding:10px; border:1px solid #e2e8f0; font-weight:bold; color:#1e40af;'>${rowSums[i]}</td>`;
    html += `<td style='background:#fae8ff; padding:10px; border:1px solid #e2e8f0; font-weight:bold; color:#7c3aed;'>${rowEdgeCount[i]}</td></tr>`;
  });

  html += "<tr style='background:linear-gradient(135deg, #4f46e5, #6366f1); color:white;'><th style='padding:12px; border:1px solid #e2e8f0;'>Σ Peso Entrada</th>";
  colSums.forEach((val) => { html += `<td style='padding:12px; border:1px solid #e2e8f0; font-weight:bold;'>${val}</td>`; });
  html += `<td style='background:#1e293b; padding:12px; border:1px solid #e2e8f0; font-weight:bold;'>Σ = ${rowSums.reduce((a,b)=>a+b,0)}</td><td style='background:#1e293b;'></td></tr>`;

  html += "<tr style='background:#7c3aed; color:white;'><th style='padding:12px; border:1px solid #e2e8f0;'># Aristas Entrada</th>";
  colEdgeCount.forEach((val) => { html += `<td style='padding:12px; border:1px solid #e2e8f0; font-weight:bold;'>${val}</td>`; });
  html += `<td style='background:#1e293b;'></td><td style='background:#1e293b; padding:12px; border:1px solid #e2e8f0; font-weight:bold;'>Total = ${edges.length}</td></tr></table></div></div>`;

  // 3. Bloques de Análisis Max/Min (Restaurados)
  html += `
        <div style="background:white; padding:24px; border-radius:12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
        <h3 style="color:#4f46e5; margin:0 0 20px 0; font-size:18px;"><span>🎯</span> Análisis del Grafo</h3>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:16px;">
            <div style="background:linear-gradient(135deg, #fef3c7, #fde68a); padding:18px; border-radius:10px; border-left:4px solid #f59e0b;">
                <h4 style="color:#92400e; margin:0 0 12px 0;">🔺 Pesos Salida</h4>
                <p style="font-size:13px; margin:0;">Máx: <b>${maxWeightOut}</b> (${maxWeightOutNode})<br>Mín: <b>${minWeightOut}</b> (${minWeightOutNode})</p>
            </div>
            <div style="background:linear-gradient(135deg, #dbeafe, #bfdbfe); padding:18px; border-radius:10px; border-left:4px solid #3b82f6;">
                <h4 style="color:#1e40af; margin:0 0 12px 0;">🔻 Pesos Entrada</h4>
                <p style="font-size:13px; margin:0;">Máx: <b>${maxWeightIn}</b> (${maxWeightInNode})<br>Mín: <b>${minWeightIn}</b> (${minWeightInNode})</p>
            </div>
            <div style="background:linear-gradient(135deg, #e0e7ff, #c7d2fe); padding:18px; border-radius:10px; border-left:4px solid #6366f1;">
                <h4 style="color:#4338ca; margin:0 0 12px 0;">📊 Totales</h4>
                <p style="font-size:13px; margin:0;">Aristas: <b>${edges.length}</b><br>Lazos: <b>${selfLoops}</b></p>
            </div>
        </div></div>`;

  return html;
}

function exportGraph() {
  if (nodes.length === 0) return alert("No hay datos.");
  const data = { nodes, edges: edges.map(e => ({ from: e.from.id, to: e.to.id, weight: e.weight, directed: e.directed })) };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `grafo_${Date.now()}.json`;
  a.click();
}

function importGraph() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = (e) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        nodes = data.nodes;
        edges = data.edges.map(e => ({ from: nodes.find(n => n.id === e.from), to: nodes.find(n => n.id === e.to), weight: e.weight, directed: e.directed }));
        render();
      } catch(err) { alert("Error al cargar JSON"); }
    };
    reader.readAsText(e.target.files[0]);
  };
  input.click();
}

function copyGraphJSON() {
  const data = { nodes, edges: edges.map(e => ({ from: e.from.id, to: e.to.id, weight: e.weight, directed: e.directed })) };
  navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => alert("✅ Copiado!"));
}

function pasteGraphJSON() {
  const txt = prompt("Pega el JSON aquí:");
  if (txt) {
    try {
      const data = JSON.parse(txt);
      nodes = data.nodes;
      edges = data.edges.map(e => ({ from: nodes.find(n => n.id === e.from), to: nodes.find(n => n.id === e.to), weight: e.weight, directed: e.directed }));
      render();
    } catch(err) { alert("JSON inválido"); }
  }
}
