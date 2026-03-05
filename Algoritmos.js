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

// ============== PEDIR PESO NUMÉRICO (solo números enteros) ==============
function askNumericWeight(defaultValue = "1") {
  let value = null;
  while (true) {
    const input = prompt("Peso de la arista (solo números enteros):", defaultValue);
    if (input === null) return null; // canceló
    const trimmed = input.trim();
    if (/^-?\d+$/.test(trimmed)) {
      value = trimmed;
      break;
    } else {
      alert("⚠️ Solo se permiten números enteros (ej: 1, 5, -3). Inténtalo de nuevo.");
    }
  }
  return value;
}

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
          const newWeight = askNumericWeight(edge.weight);
          if (newWeight !== null) edge.weight = newWeight;
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
          const weight = askNumericWeight("1");
          if (weight === null) {
            selectedNode = null;
            render();
            return;
          }
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
  titleBar.className = "matrix-title-bar";
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

  const titleIcon = document.createElement("span");
  titleIcon.textContent = "⊞";
  titleIcon.style.cssText = "font-size: 18px; opacity: 0.9;";

  const titleText = document.createElement("span");
  titleText.textContent = "Matriz de Adyacencia Ponderada Dirigida";
  titleText.style.cssText =
    "font-size: 14px; font-weight: 600; letter-spacing: 0.3px;";

  titleInfo.appendChild(titleIcon);
  titleInfo.appendChild(titleText);

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "✕";
  closeBtn.style.cssText = `
        background: rgba(255, 255, 255, 0.15);
        border: none;
        color: white;
        cursor: pointer;
        font-size: 18px;
        line-height: 1;
        padding: 6px 10px;
        border-radius: 6px;
        transition: all 0.2s ease;
    `;
  closeBtn.onmouseover = () =>
    (closeBtn.style.background = "rgba(255, 255, 255, 0.3)");
  closeBtn.onmouseout = () =>
    (closeBtn.style.background = "rgba(255, 255, 255, 0.15)");
  closeBtn.onclick = () => wrapper.remove();

  titleBar.appendChild(titleInfo);
  titleBar.appendChild(closeBtn);

  const body = document.createElement("div");
  body.className = "matrix-window-body";
  body.style.cssText = `
        padding: 20px;
        overflow-y: auto;
        flex: 1;
        background: #f8fafc;
    `;
  body.innerHTML = generateMatrixHTML();

  wrapper.appendChild(titleBar);
  wrapper.appendChild(body);

  let pos = { x: 50, y: 50 };

  titleBar.onmousedown = (e) => {
    isDragging = true;
    dragOffset.x = e.clientX - pos.x;
    dragOffset.y = e.clientY - pos.y;
    titleBar.style.cursor = "grabbing";

    const onMouseMove = (e) => {
      if (!isDragging) return;
      pos.x = e.clientX - dragOffset.x;
      pos.y = e.clientY - dragOffset.y;
      wrapper.style.left = pos.x + "px";
      wrapper.style.top = pos.y + "px";
    };

    const onMouseUp = () => {
      isDragging = false;
      titleBar.style.cursor = "grab";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  return wrapper;
}

function generateMatrixHTML() {
  if (nodes.length === 0) {
    return "<p style='text-align:center; color:#94a3b8; padding:40px;'>No hay nodos en el grafo. Crea nodos para generar la matriz.</p>";
  }

  let matrix = [];
  let rowSums = [];
  let colSums = new Array(nodes.length).fill(0);
  let rowEdgeCount = [];
  let colEdgeCount = new Array(nodes.length).fill(0);
  let directedEdges = 0;
  let undirectedEdges = 0;
  let selfLoops = 0;

  nodes.forEach((fromNode, i) => {
    matrix[i] = [];
    let weightSum = 0;
    let edgeCount = 0;

    nodes.forEach((toNode, j) => {
      const edge = edges.find(
        (e) => e.from.id === fromNode.id && e.to.id === toNode.id,
      );
      let value = edge ? parseInt(edge.weight) || 0 : 0;
      matrix[i][j] = value;

      if (edge) {
        if (i === j) selfLoops++;
        else if (edge.directed) directedEdges++;
        else undirectedEdges++;

        edgeCount++;
        colEdgeCount[j]++;
      }

      weightSum += value;
      colSums[j] += value;
    });

    rowSums[i] = weightSum;
    rowEdgeCount[i] = edgeCount;
  });

  let degrees = nodes.map((node, i) => {
    return {
      node: node.name,
      in: colSums[i],
      out: rowSums[i],
      inEdges: colEdgeCount[i],
      outEdges: rowEdgeCount[i],
      total: colSums[i] + rowSums[i],
    };
  });

  let maxWeightOut = Math.max(...rowSums);
  let minWeightOut = Math.min(...rowSums);
  let maxWeightIn = Math.max(...colSums);
  let minWeightIn = Math.min(...colSums);

  let maxEdgesOut = Math.max(...rowEdgeCount);
  let minEdgesOut = Math.min(...rowEdgeCount);
  let maxEdgesIn = Math.max(...colEdgeCount);
  let minEdgesIn = Math.min(...colEdgeCount);

  let maxWeightOutNode = nodes[rowSums.indexOf(maxWeightOut)].name;
  let minWeightOutNode = nodes[rowSums.indexOf(minWeightOut)].name;
  let maxWeightInNode = nodes[colSums.indexOf(maxWeightIn)].name;
  let minWeightInNode = nodes[colSums.indexOf(minWeightIn)].name;

  let maxEdgesOutNode = nodes[rowEdgeCount.indexOf(maxEdgesOut)].name;
  let minEdgesOutNode = nodes[rowEdgeCount.indexOf(minEdgesOut)].name;
  let maxEdgesInNode = nodes[colEdgeCount.indexOf(maxEdgesIn)].name;
  let minEdgesInNode = nodes[colEdgeCount.indexOf(minEdgesIn)].name;

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
  html += `<th style='padding:12px; border:1px solid #e2e8f0; font-weight:600; background:#7c3aed;'># Aristas Salida</th>`;
  html += "</tr>";

  matrix.forEach((row, i) => {
    html += `<tr><th style='background:#e0e7ff; padding:10px; border:1px solid #e2e8f0; font-weight:600; color:#4f46e5;'>${nodes[i].name}</th>`;
    row.forEach((val, j) => {
      const cellBg = val > 0 ? "#fef3c7" : "#f8fafc";
      const cellColor = val > 0 ? "#92400e" : "#94a3b8";
      const fontWeight = val > 0 ? "bold" : "normal";
      html += `<td style='padding:10px; border:1px solid #e2e8f0; background:${cellBg}; color:${cellColor}; font-weight:${fontWeight};'>${val > 0 ? val : "—"}</td>`;
    });
    html += `<td style='background:#dbeafe; padding:10px; border:1px solid #e2e8f0; font-weight:bold; color:#1e40af;'>${rowSums[i]}</td>`;
    html += `<td style='background:#fae8ff; padding:10px; border:1px solid #e2e8f0; font-weight:bold; color:#7c3aed;'>${rowEdgeCount[i]}</td>`;
    html += "</tr>";
  });

  html +=
    "<tr style='background:linear-gradient(135deg, #4f46e5, #6366f1); color:white;'><th style='padding:12px; border:1px solid #e2e8f0; font-weight:600;'>Σ Peso Entrada</th>";
  colSums.forEach((val) => {
    html += `<td style='padding:12px; border:1px solid #e2e8f0; font-weight:bold;'>${val}</td>`;
  });
  const totalWeightSum = rowSums.reduce((a, b) => a + b, 0);
  html += `<td style='background:#1e293b; padding:12px; border:1px solid #e2e8f0; font-weight:bold;'>Σ = ${totalWeightSum}</td>`;
  html += `<td style='background:#1e293b; padding:12px; border:1px solid #e2e8f0;'></td>`;
  html += "</tr>";

  html +=
    "<tr style='background:#7c3aed; color:white;'><th style='padding:12px; border:1px solid #e2e8f0; font-weight:600;'># Aristas Entrada</th>";
  colEdgeCount.forEach((val) => {
    html += `<td style='padding:12px; border:1px solid #e2e8f0; font-weight:bold;'>${val}</td>`;
  });
  const totalEdgeCount = edges.length;
  html += `<td style='background:#1e293b; padding:12px; border:1px solid #e2e8f0;'></td>`;
  html += `<td style='background:#1e293b; padding:12px; border:1px solid #e2e8f0; font-weight:bold;'>Total = ${totalEdgeCount}</td>`;
  html += "</tr>";

  html += "</table></div></div>";

  html += `
        <div style="background:white; padding:24px; border-radius:12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-bottom:20px;">
        <h3 style="color:#4f46e5; margin:0 0 20px 0; font-size:18px; display:flex; align-items:center; gap:8px;">
            <span>📈</span> Tabla Detallada de Grados
        </h3>
        <div style="overflow-x: auto;">
        <table style="border-collapse:collapse; width:100%; text-align:center; font-size:13px;">
    `;
  html += `
        <tr style='background:linear-gradient(135deg, #4f46e5, #6366f1); color:white;'>
            <th style='padding:12px; border:1px solid #e2e8f0;'>Nodo</th>
            <th style='padding:12px; border:1px solid #e2e8f0;'>Σ Peso Entrada</th>
            <th style='padding:12px; border:1px solid #e2e8f0;'># Aristas Entrada</th>
            <th style='padding:12px; border:1px solid #e2e8f0;'>Σ Peso Salida</th>
            <th style='padding:12px; border:1px solid #e2e8f0;'># Aristas Salida</th>
            <th style='padding:12px; border:1px solid #e2e8f0;'>Grado Total</th>
        </tr>
    `;

  degrees.forEach((d) => {
    html += `<tr>
            <td style='background:#e0e7ff; padding:10px; border:1px solid #e2e8f0; font-weight:bold; color:#4f46e5;'>${d.node}</td>
            <td style='padding:10px; border:1px solid #e2e8f0; ${d.in === maxWeightIn ? "background:#86efac; font-weight:bold;" : ""}'>${d.in}</td>
            <td style='padding:10px; border:1px solid #e2e8f0; ${d.inEdges === maxEdgesIn ? "background:#c7d2fe; font-weight:bold;" : ""}'>${d.inEdges}</td>
            <td style='padding:10px; border:1px solid #e2e8f0; ${d.out === maxWeightOut ? "background:#fde68a; font-weight:bold;" : ""}'>${d.out}</td>
            <td style='padding:10px; border:1px solid #e2e8f0; ${d.outEdges === maxEdgesOut ? "background:#fcd34d; font-weight:bold;" : ""}'>${d.outEdges}</td>
            <td style='background:#fef3c7; padding:10px; border:1px solid #e2e8f0; font-weight:bold; color:#92400e;'>${d.total}</td>
        </tr>`;
  });
  html += "</table></div></div>";

  html += `
        <div style="background:white; padding:24px; border-radius:12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
        <h3 style="color:#4f46e5; margin:0 0 20px 0; font-size:18px; display:flex; align-items:center; gap:8px;">
            <span>🎯</span> Análisis Completo del Grafo
        </h3>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:16px;">
            
            <div style="background:linear-gradient(135deg, #fef3c7, #fde68a); padding:18px; border-radius:10px; border-left:4px solid #f59e0b;">
                <h4 style="color:#92400e; margin:0 0 12px 0; font-size:15px; font-weight:600; display:flex; align-items:center; gap:6px;">
                    <span style="font-size:20px;">🔺</span> Suma de Pesos de Salida
                </h4>
                <div style="background:rgba(255,255,255,0.6); padding:10px; border-radius:6px; margin-bottom:8px;">
                    <p style="margin:4px 0; font-size:13px; color:#78350f;">
                        <strong>Máximo:</strong> <span style="font-size:16px; font-weight:bold; color:#92400e;">${maxWeightOut}</span> 
                        → Nodo <strong style="background:#fbbf24; padding:2px 8px; border-radius:4px;">${maxWeightOutNode}</strong>
                    </p>
                </div>
                <div style="background:rgba(255,255,255,0.6); padding:10px; border-radius:6px;">
                    <p style="margin:4px 0; font-size:13px; color:#78350f;">
                        <strong>Mínimo:</strong> <span style="font-size:16px; font-weight:bold; color:#92400e;">${minWeightOut}</span> 
                        → Nodo <strong style="background:#fbbf24; padding:2px 8px; border-radius:4px;">${minWeightOutNode}</strong>
                    </p>
                </div>
            </div>

            <div style="background:linear-gradient(135deg, #dbeafe, #bfdbfe); padding:18px; border-radius:10px; border-left:4px solid #3b82f6;">
                <h4 style="color:#1e40af; margin:0 0 12px 0; font-size:15px; font-weight:600; display:flex; align-items:center; gap:6px;">
                    <span style="font-size:20px;">🔻</span> Suma de Pesos de Entrada
                </h4>
                <div style="background:rgba(255,255,255,0.6); padding:10px; border-radius:6px; margin-bottom:8px;">
                    <p style="margin:4px 0; font-size:13px; color:#1e3a8a;">
                        <strong>Máximo:</strong> <span style="font-size:16px; font-weight:bold; color:#1e40af;">${maxWeightIn}</span> 
                        → Nodo <strong style="background:#60a5fa; padding:2px 8px; border-radius:4px; color:white;">${maxWeightInNode}</strong>
                    </p>
                </div>
                <div style="background:rgba(255,255,255,0.6); padding:10px; border-radius:6px;">
                    <p style="margin:4px 0; font-size:13px; color:#1e3a8a;">
                        <strong>Mínimo:</strong> <span style="font-size:16px; font-weight:bold; color:#1e40af;">${minWeightIn}</span> 
                        → Nodo <strong style="background:#60a5fa; padding:2px 8px; border-radius:4px; color:white;">${minWeightInNode}</strong>
                    </p>
                </div>
            </div>

            <div style="background:linear-gradient(135deg, #fef08a, #fde047); padding:18px; border-radius:10px; border-left:4px solid #eab308;">
                <h4 style="color:#854d0e; margin:0 0 12px 0; font-size:15px; font-weight:600; display:flex; align-items:center; gap:6px;">
                    <span style="font-size:20px;">➡️</span> Cantidad de Aristas Salientes
                </h4>
                <div style="background:rgba(255,255,255,0.6); padding:10px; border-radius:6px; margin-bottom:8px;">
                    <p style="margin:4px 0; font-size:13px; color:#713f12;">
                        <strong>Máximo:</strong> <span style="font-size:16px; font-weight:bold; color:#854d0e;">${maxEdgesOut}</span> aristas
                        → Nodo <strong style="background:#facc15; padding:2px 8px; border-radius:4px;">${maxEdgesOutNode}</strong>
                    </p>
                </div>
                <div style="background:rgba(255,255,255,0.6); padding:10px; border-radius:6px;">
                    <p style="margin:4px 0; font-size:13px; color:#713f12;">
                        <strong>Mínimo:</strong> <span style="font-size:16px; font-weight:bold; color:#854d0e;">${minEdgesOut}</span> aristas
                        → Nodo <strong style="background:#facc15; padding:2px 8px; border-radius:4px;">${minEdgesOutNode}</strong>
                    </p>
                </div>
            </div>

            <div style="background:linear-gradient(135deg, #bae6fd, #7dd3fc); padding:18px; border-radius:10px; border-left:4px solid #0ea5e9;">
                <h4 style="color:#075985; margin:0 0 12px 0; font-size:15px; font-weight:600; display:flex; align-items:center; gap:6px;">
                    <span style="font-size:20px;">⬅️</span> Cantidad de Aristas Entrantes
                </h4>
                <div style="background:rgba(255,255,255,0.6); padding:10px; border-radius:6px; margin-bottom:8px;">
                    <p style="margin:4px 0; font-size:13px; color:#0c4a6e;">
                        <strong>Máximo:</strong> <span style="font-size:16px; font-weight:bold; color:#075985;">${maxEdgesIn}</span> aristas
                        → Nodo <strong style="background:#38bdf8; padding:2px 8px; border-radius:4px; color:white;">${maxEdgesInNode}</strong>
                    </p>
                </div>
                <div style="background:rgba(255,255,255,0.6); padding:10px; border-radius:6px;">
                    <p style="margin:4px 0; font-size:13px; color:#0c4a6e;">
                        <strong>Mínimo:</strong> <span style="font-size:16px; font-weight:bold; color:#075985;">${minEdgesIn}</span> aristas
                        → Nodo <strong style="background:#38bdf8; padding:2px 8px; border-radius:4px; color:white;">${minEdgesInNode}</strong>
                    </p>
                </div>
            </div>

            <div style="background:linear-gradient(135deg, #e0e7ff, #c7d2fe); padding:18px; border-radius:10px; border-left:4px solid #6366f1;">
                <h4 style="color:#4338ca; margin:0 0 12px 0; font-size:15px; font-weight:600; display:flex; align-items:center; gap:6px;">
                    <span style="font-size:20px;">📊</span> Estadísticas Generales
                </h4>
                <p style="margin:8px 0; font-size:13px; color:#3730a3; display:flex; justify-content:space-between;">
                    <strong>Total Nodos:</strong> 
                    <span style="background:#818cf8; color:white; padding:2px 10px; border-radius:4px; font-weight:bold;">${nodes.length}</span>
                </p>
                <p style="margin:8px 0; font-size:13px; color:#3730a3; display:flex; justify-content:space-between;">
                    <strong>Total Aristas:</strong> 
                    <span style="background:#818cf8; color:white; padding:2px 10px; border-radius:4px; font-weight:bold;">${edges.length}</span>
                </p>
                <p style="margin:8px 0; font-size:13px; color:#3730a3; display:flex; justify-content:space-between;">
                    <strong>Bucles (Lazos):</strong> 
                    <span style="background:#818cf8; color:white; padding:2px 10px; border-radius:4px; font-weight:bold;">${selfLoops}</span>
                </p>
            </div>

            <div style="background:linear-gradient(135deg, #fce7f3, #fbcfe8); padding:18px; border-radius:10px; border-left:4px solid #ec4899;">
                <h4 style="color:#9f1239; margin:0 0 12px 0; font-size:15px; font-weight:600; display:flex; align-items:center; gap:6px;">
                    <span style="font-size:20px;">🔀</span> Clasificación de Aristas
                </h4>
                <p style="margin:8px 0; font-size:13px; color:#881337; display:flex; justify-content:space-between;">
                    <strong>Dirigidas:</strong> 
                    <span style="background:#f472b6; color:white; padding:2px 10px; border-radius:4px; font-weight:bold;">${directedEdges}</span>
                </p>
                <p style="margin:8px 0; font-size:13px; color:#881337; display:flex; justify-content:space-between;">
                    <strong>No Dirigidas:</strong> 
                    <span style="background:#f472b6; color:white; padding:2px 10px; border-radius:4px; font-weight:bold;">${undirectedEdges}</span>
                </p>
                <p style="margin:8px 0; font-size:13px; color:#881337; display:flex; justify-content:space-between;">
                    <strong>Suma Total Pesos:</strong> 
                    <span style="background:#f472b6; color:white; padding:2px 10px; border-radius:4px; font-weight:bold;">${totalWeightSum}</span>
                </p>
            </div>

        </div></div>
    `;

  return html;
}

// ============== EXPORTAR GRAFO (pide nombre de archivo) ==============
function exportGraph() {
  if (nodes.length === 0) {
    alert("No hay nodos para exportar.");
    return;
  }

  // Pedir nombre del archivo
  let fileName = prompt("¿Con qué nombre quieres guardar el archivo? (sin extensión):", "grafo");
  if (fileName === null) return; // canceló
  fileName = fileName.trim();
  if (fileName === "") fileName = "grafo";

  const graphData = {
    nodes: nodes.map((n) => ({
      id: n.id,
      name: n.name,
      x: n.x,
      y: n.y,
    })),
    edges: edges.map((e) => ({
      from: e.from.id,
      to: e.to.id,
      weight: e.weight,
      directed: e.directed,
    })),
  };

  const jsonString = JSON.stringify(graphData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}.json`;
  a.click();

  URL.revokeObjectURL(url);

  alert(`✅ Grafo exportado como "${fileName}.json"`);
}

// ============== IMPORTAR GRAFO ==============
function importGraph() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";

  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const graphData = JSON.parse(event.target.result);

        if (!graphData.nodes || !graphData.edges) {
          throw new Error("Formato JSON inválido");
        }

        nodes = graphData.nodes.map((n) => ({
          id: n.id,
          name: n.name,
          x: n.x,
          y: n.y,
        }));

        edges = graphData.edges.map((e) => {
          const fromNode = nodes.find((n) => n.id === e.from);
          const toNode = nodes.find((n) => n.id === e.to);

          if (!fromNode || !toNode) {
            throw new Error("Referencias de nodos inválidas");
          }

          return {
            from: fromNode,
            to: toNode,
            weight: e.weight,
            directed: e.directed,
          };
        });

        selectedNode = null;
        render();
        alert("✅ Grafo importado correctamente!");
      } catch (error) {
        alert("❌ Error al importar el grafo: " + error.message);
      }
    };

    reader.readAsText(file);
  };

  input.click();
}

// ============== COPIAR JSON ==============
function copyGraphJSON() {
  if (nodes.length === 0) {
    alert("No hay nodos para copiar.");
    return;
  }

  const graphData = {
    nodes: nodes.map((n) => ({
      id: n.id,
      name: n.name,
      x: n.x,
      y: n.y,
    })),
    edges: edges.map((e) => ({
      from: e.from.id,
      to: e.to.id,
      weight: e.weight,
      directed: e.directed,
    })),
  };

  const jsonString = JSON.stringify(graphData, null, 2);

  navigator.clipboard
    .writeText(jsonString)
    .then(() => {
      alert("✅ JSON copiado al portapapeles!");
    })
    .catch(() => {
      const textarea = document.createElement("textarea");
      textarea.value = jsonString;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      alert("✅ JSON copiado al portapapeles!");
    });
}

// ============== PEGAR JSON ==============
function pasteGraphJSON() {
  const jsonText = prompt("Pega el JSON del grafo aquí:");
  if (!jsonText) return;

  try {
    const graphData = JSON.parse(jsonText);

    if (!graphData.nodes || !graphData.edges) {
      throw new Error("Formato JSON inválido");
    }

    nodes = graphData.nodes.map((n) => ({
      id: n.id,
      name: n.name,
      x: n.x,
      y: n.y,
    }));

    edges = graphData.edges.map((e) => {
      const fromNode = nodes.find((n) => n.id === e.from);
      const toNode = nodes.find((n) => n.id === e.to);

      if (!fromNode || !toNode) {
        throw new Error("Referencias de nodos inválidas");
      }

      return {
        from: fromNode,
        to: toNode,
        weight: e.weight,
        directed: e.directed,
      };
    });

    selectedNode = null;
    render();
    alert("✅ Grafo cargado correctamente!");
  } catch (error) {
    alert("❌ Error al cargar el grafo: " + error.message);
  }
}
