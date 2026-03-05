let nodes = [];
let edges = [];
let selectedNode = null;
let currentMode = "create";
let matrixWindow = null;
let isDragging = false;let nodes = [];
let edges = [];
let selectedNode = null;
let currentMode = "create";

const container = document.getElementById("graph-container");
const svgCanvas = document.getElementById("svg-canvas");
const edgesGroup = document.getElementById("edges-group");
const nodesLayer = document.getElementById("nodes-layer");

function onlyLetters(text){
  return /^[A-Za-z]+$/.test(text);
}

function onlyNumbers(text){
  return /^[0-9]+$/.test(text);
}

container.addEventListener("mousedown",(e)=>{

  if(currentMode!=="create") return;

  if(e.target===container || e.target===svgCanvas){

    let name = prompt("Nombre del vértice (solo letras)");

    if(name===null) return;

    name = name.trim();

    if(!onlyLetters(name)){
      alert("Solo se permiten letras.");
      return;
    }

    const rect = container.getBoundingClientRect();

    const node={
      id:Date.now(),
      name:name,
      x:e.clientX-rect.left,
      y:e.clientY-rect.top
    };

    nodes.push(node);

    render();
  }

});

function render(){

  nodesLayer.innerHTML="";
  edgesGroup.innerHTML="";

  edges.forEach((edge,index)=>{

    const path=document.createElementNS("http://www.w3.org/2000/svg","line");

    path.setAttribute("x1",edge.from.x);
    path.setAttribute("y1",edge.from.y);
    path.setAttribute("x2",edge.to.x);
    path.setAttribute("y2",edge.to.y);
    path.setAttribute("stroke","#f06292");
    path.setAttribute("stroke-width","2");

    path.onclick=(e)=>{

      e.stopPropagation();

      if(currentMode==="modify"){

        const act=prompt("1 eliminar arista\n2 cambiar peso","1");

        if(act==="1"){
          edges.splice(index,1);
        }

        if(act==="2"){

          let newWeight=prompt("Nuevo peso (solo números)");

          if(newWeight===null) return;

          newWeight=newWeight.trim();

          if(!onlyNumbers(newWeight)){
            alert("El peso solo puede ser un número positivo.");
            return;
          }

          edge.weight=newWeight;

        }

        render();

      }

    };

    const text=document.createElementNS("http://www.w3.org/2000/svg","text");

    text.setAttribute("x",(edge.from.x+edge.to.x)/2);
    text.setAttribute("y",(edge.from.y+edge.to.y)/2-10);
    text.setAttribute("text-anchor","middle");
    text.setAttribute("fill","#f06292");

    text.textContent=edge.weight;

    text.onclick=path.onclick;

    edgesGroup.appendChild(path);
    edgesGroup.appendChild(text);

  });

  nodes.forEach(node=>{

    const div=document.createElement("div");

    div.className="node";

    div.style.left=node.x-22+"px";
    div.style.top=node.y-22+"px";

    div.innerText=node.name;

    div.onclick=(e)=>{

      e.stopPropagation();

      if(currentMode==="modify"){

        const act=prompt("1 eliminar nodo\n2 cambiar nombre","1");

        if(act==="1"){

          nodes=nodes.filter(n=>n.id!==node.id);

          edges=edges.filter(e=>e.from.id!==node.id && e.to.id!==node.id);

        }

        if(act==="2"){

          let newName=prompt("Nuevo nombre (solo letras)");

          if(newName===null) return;

          newName=newName.trim();

          if(!onlyLetters(newName)){
            alert("Solo letras permitidas.");
            return;
          }

          node.name=newName;

        }

        render();

      }

      else{

        if(!selectedNode){

          selectedNode=node;

        }
        else{

          let weight=prompt("Peso de la arista (solo números)");

          if(weight===null){
            selectedNode=null;
            return;
          }

          weight=weight.trim();

          if(!onlyNumbers(weight)){
            alert("El peso debe ser solo números positivos.");
            selectedNode=null;
            return;
          }

          edges.push({
            from:selectedNode,
            to:node,
            weight:weight
          });

          selectedNode=null;

          render();

        }

      }

    };

    nodesLayer.appendChild(div);

  });

}

function clearCanvas(){

  if(confirm("Borrar todo el grafo?")){

    nodes=[];
    edges=[];
    selectedNode=null;

    render();

  }

}
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

    let name = prompt("Nombre del vértice (solo letras):");

    if (!name || !/^[A-Za-z]+$/.test(name)) {
      alert("❌ Solo se permiten letras para los vértices.");
      return;
    }

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
        }

        else if (act === "2") {

          let newWeight = prompt("Nuevo peso (solo números):", edge.weight);

          if (!/^[0-9]+$/.test(newWeight)) {
            alert("❌ El peso debe ser solo números.");
            return;
          }

          edge.weight = newWeight;
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

        }

        else if (act === "2") {

          let newName = prompt("Nuevo nombre (solo letras):", node.name);

          if (!/^[A-Za-z]+$/.test(newName)) {
            alert("❌ Solo se permiten letras.");
            return;
          }

          node.name = newName;

        }

        render();

      }

      else {

        if (!selectedNode) {

          selectedNode = node;

        } else {

          let weight = prompt("Peso de la arista (solo números):", "1");

          if (!/^[0-9]+$/.test(weight)) {
            alert("❌ El peso debe ser solo números.");
            return;
          }

          const directed = confirm("¿Es una arista dirigida (con flecha)?");

          edges.push({
            from: selectedNode,
            to: node,
            weight,
            directed
          });

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

