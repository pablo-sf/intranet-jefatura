/* ==========================================================================
   render.js · dibuja la cuadrícula de un horario

   Convierte los datos que devuelve ghc.js en una <table>. Sirve tanto para
   el horario que se ve en pantalla como para los de "Descargar todos", por
   eso recibe el modo y el nombre en vez de consultarlos por su cuenta.
   ========================================================================== */

const DIAS = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];

// Hash FNV-1a: se usa solo para elegir el punto de partida de la paleta,
// de forma que cada profesor/curso tenga su propia gama pero siempre la misma.
function hash32(txt){
  let h = 0x811c9dc5;
  for (let i = 0; i < txt.length; i++){
    h ^= txt.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

// Construye una paleta para el horario que se está mostrando.
// El color identifica la pareja materia+grupo: un profesor que da la misma
// asignatura en varios cursos ve un color distinto en cada uno. Los tonos se
// reparten por el círculo cromático para que queden bien diferenciados.
function construirPaleta(items, semilla){
  const claves = [...new Set(
    items.filter(i => !i.reunion).map(i => `${i.materia}|${i.grupo || ""}`)
  )].sort((a,b) => a.localeCompare(b,"es"));

  const paleta = new Map();
  const n = claves.length || 1;
  const inicio = hash32(String(semilla)) % 360;   // gama propia de cada profesor/curso
  claves.forEach((clave, i) => {
    const tono = Math.round(inicio + i * (360 / n)) % 360;
    const sat  = i % 2 ? 46 : 38;                 // alterna para separar aún más
    const luz  = i % 3 === 1 ? 86 : 89;           // texto negro siempre legible
    paleta.set(clave, `hsl(${tono} ${sat}% ${luz}%)`);
  });
  return paleta;
}

// Construye la <table> del horario de un profesor/curso concreto.
// No depende de la selección actual, así se reutiliza para "imprimir todos".
function construirTabla(datos, modo, nombre){
  const items = (modo==="prof" ? datos.porProf : datos.porGrupo).get(nombre) || [];
  const paleta = construirPaleta(items, nombre);
  const dias = [...new Set(items.map(i=>i.dia))].sort((a,b)=>a-b);
  const diasVista = dias.length ? [...Array(Math.max(...dias)+1).keys()] : [0,1,2,3,4];

  const franjas = new Map();
  items.forEach(i => franjas.set(i.ini+"|"+i.fin, {ini:i.ini, fin:i.fin}));
  datos.recreos.forEach(r => franjas.set(r.ini+"|"+r.fin, {...r, recreo:true}));
  const filas = [...franjas.values()].sort((a,b)=> a.ini.localeCompare(b.ini) || a.fin.localeCompare(b.fin));

  const tabla = document.createElement("table");
  tabla.className = "horario";
  tabla.innerHTML = `<thead><tr><th></th>${diasVista.map(d=>`<th>${DIAS[d]}</th>`).join("")}</tr></thead>`;
  const cuerpo = document.createElement("tbody");

  filas.forEach(f => {
    const fila = document.createElement("tr");
    const celdas = diasVista.map(d => {
      const aqui = items.filter(i => i.dia===d && i.ini===f.ini && i.fin===f.fin);
      if (!aqui.length) return "<td></td>";
      return "<td class='" + (aqui[0].reunion?"reunion":"") + "'>" + aqui.map(i =>
        `<div class="bloque${i.compartida?" compartida":""}"${i.nota?` title="${i.nota}"`:""} style="background:${i.reunion?'':paleta.get(`${i.materia}|${i.grupo || ""}`)}">
           <span class="materia">${i.materia}</span>
           <span class="detalle">${i.detalle}</span></div>`).join("") + "</td>";
    });
    if (f.recreo && !items.some(i=>i.ini===f.ini && i.fin===f.fin)){
      fila.className = "recreo";
      fila.innerHTML = `<td class="hora">${f.ini}–${f.fin}</td><td colspan="${diasVista.length}">Recreo</td>`;
    } else {
      fila.innerHTML = `<td class="hora">${f.ini}–${f.fin}</td>` + celdas.join("");
    }
    cuerpo.appendChild(fila);
  });
  tabla.appendChild(cuerpo);
  return tabla;
}

export { DIAS, construirTabla };
