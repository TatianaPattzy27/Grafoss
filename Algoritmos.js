let nodes = [];
let edges = [];
let selectedNode = null;
let currentMode = 'create'; 

function showSection(id) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function toggleMode() {
    currentMode = (currentMode === 'create') ? 'modify' : 'create';
    const btn = document.getElementById('btn-mode');
    const hint = document.getElementById('hint');
    
    if (currentMode === 'modify') {
        btn.innerText = "Modo: Modificar";
        btn.classList.add('modify');
        hint.innerText = "Haz clic en una flecha o número para editar/borrar.";
    } else {
        btn.innerText = "Modo: Crear";
        btn.classList.remove('modify');
        hint.innerText = "Click en el fondo para crear nodo. Selecciona dos para conectar.";
    }
    selectedNode = null;
    render();
}

const container = document.getElementById('graph-container');
const svgCanvas = document.getElementById('svg-canvas');
const edgesGroup = document.getElementById('edges-group');
const nodesLayer = document.getElementById('nodes-layer');

container.addEventListener('mousedown', (e) => {
    if (currentMode !== 'create') return;
    if (e.target === container || e.target === svgCanvas) {
        const name = prompt("Nombre del vértice (ej. 1, A, v2):");
        if (name) {
            const rect = container.getBoundingClientRect();
            const newNode = { 
                id: Date.now(), 
                name, 
                x: e.clientX - rect.left, 
                y: e.clientY - rect.top 
            };
            nodes.push(newNode);
            render();
        }
    }
});

function render() {
    nodesLayer.innerHTML = '';
    edgesGroup.innerHTML = '';

    edges.forEach((edge, index) => {
        const isDouble = edges.some(e => e.from.id === edge.to.id && e.to.id === edge.from.id && e !== edge);
        const isReverse = isDouble && (edge.from.id > edge.to.id); 
        
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
            d = `M ${x-10} ${y} C ${x-25} ${y-40}, ${x+25} ${y-40}, ${x+10} ${y}`;
        } else if (isDouble) {
            const midX = (edge.from.x + edge.to.x) / 2;
            const midY = (edge.from.y + edge.to.y) / 2;
            const dx = edge.to.x - edge.from.x;
            const dy = edge.to.y - edge.from.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
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
            if (currentMode === 'modify') {
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



    nodes.forEach(node => {
        const div = document.createElement('div');
        div.className = `node ${selectedNode === node ? 'selected' : ''}`;
        div.style.left = (node.x - 22) + 'px';
        div.style.top = (node.y - 22) + 'px';
        div.innerText = node.name;

        div.onclick = (e) => {
            e.stopPropagation();
            if (currentMode === 'modify') {
                const act = prompt("1: Eliminar Nodo, 2: Cambiar Nombre", "1");
                if (act === "1") {
                    nodes = nodes.filter(n => n.id !== node.id);
                    edges = edges.filter(ed => ed.from.id !== node.id && ed.to.id !== node.id);
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

function clearCanvas() {
    if (confirm("¿Estás seguro de que quieres borrar todo el grafo?")) {
        nodes = [];
        edges = [];
        selectedNode = null;
        render();
    }
}

function showMatrix() {
    showSection('matriz');
    generateMatrix();
}

function generateMatrix() {
    const container = document.getElementById("matrix-container");
    const results = document.getElementById("matrix-results");

    if (nodes.length === 0) {
        container.innerHTML = "<p>No hay nodos.</p>";
        results.innerHTML = "";
        return;
    }

    let matrix = [];
    let rowSums = [];
    let colSums = new Array(nodes.length).fill(0);

    nodes.forEach((fromNode, i) => {
        matrix[i] = [];
        let sum = 0;

        nodes.forEach((toNode, j) => {
            const edge = edges.find(e => e.from.id === fromNode.id && e.to.id === toNode.id);
            let value = edge ? parseInt(edge.weight) : 0;
            matrix[i][j] = value;

            sum += value;
            colSums[j] += value;
        });

        rowSums[i] = sum;
    });

    let html = "<table border='1' cellpadding='8' style='border-collapse:collapse; width:100%; text-align:center;'>";
    
    html += "<tr><th></th>";
    nodes.forEach(n => {
        html += `<th>${n.name}</th>`;
    });
    html += "<th>Total Salida</th></tr>";

    matrix.forEach((row, i) => {
        html += `<tr><th>${nodes[i].name}</th>`;
        row.forEach(val => {
            html += `<td>${val}</td>`;
        });
        html += `<td><strong>${rowSums[i]}</strong></td></tr>`;
    });

    html += "<tr><th>Total Entrada</th>";
    colSums.forEach(val => {
        html += `<td><strong>${val}</strong></td>`;
    });
    html += "<td></td></tr>";

    html += "</table>";
    container.innerHTML = html;

    let maxRow = Math.max(...rowSums);
    let minRow = Math.min(...rowSums);

    let maxCol = Math.max(...colSums);
    let minCol = Math.min(...colSums);

    let maxRowNode = nodes[rowSums.indexOf(maxRow)].name;
    let minRowNode = nodes[rowSums.indexOf(minRow)].name;

    let maxColNode = nodes[colSums.indexOf(maxCol)].name;
    let minColNode = nodes[colSums.indexOf(minCol)].name;

    results.innerHTML = `
        <h3>Resultados</h3>
        <p><strong>Salida Máxima:</strong> ${maxRow} → Nodo ${maxRowNode}</p>
        <p><strong>Salida Mínima:</strong> ${minRow} → Nodo ${minRowNode}</p>
        <hr>
        <p><strong>Entrada Máxima:</strong> ${maxCol} → Nodo ${maxColNode}</p>
        <p><strong>Entrada Mínima:</strong> ${minCol} → Nodo ${minColNode}</p>
    `;
}