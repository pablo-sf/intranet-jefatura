/* ==========================================================================
   app.js · el visor de horarios

   Guarda el estado (qué iteración, qué propuesta y a quién se está mirando),
   carga el manifest y reparte el trabajo: ghc.js lee los XML de Peñalara y
   render.js dibuja las tablas.
   ========================================================================== */

import { decodificar, parsearGHC } from "./ghc.js";
import { construirTabla } from "./render.js";

const RUTA_DATOS = "data/";

let manifest = null;        // contenido de manifest.json
let iterIdx = -1;           // iteración seleccionada (índice en manifest.iteraciones)
let propIdx = -1;           // propuesta activa dentro de la iteración
let cacheDatos = new Map(); // "fecha/archivo" -> datos parseados
let modo = "prof";
let seleccion = "";

/* ---------- Utilidades ---------- */
const $ = id => document.getElementById(id);
const iterActual = () => manifest.iteraciones[iterIdx];
const nombrePropuesta = archivo =>
  archivo.replace(/\.xml$/i,"")           // quita extensión
    .replace(/^\d{8}[-_]?/,"")            // quita prefijo de fecha AAAAMMDD
    .replace(/[-_]/g," ")
    .trim()
    .replace(/^./, c=>c.toUpperCase());
const fechaBonita = valor => {
  // Acepta AAAAMMDD o AAAA-MM-DD
  const s = String(valor).replace(/-/g,"");
  const iso = `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`;
  return new Date(iso+"T12:00:00").toLocaleDateString("es-ES",{day:"numeric",month:"long",year:"numeric"});
};

async function datosDePropuesta(iter, archivo){
  const clave = iter.fecha + "/" + archivo;
  if (!cacheDatos.has(clave)){
    const resp = await fetch(RUTA_DATOS + clave);
    if (!resp.ok) throw new Error(`No se encontró ${clave}`);
    cacheDatos.set(clave, parsearGHC(decodificar(await resp.arrayBuffer())));
  }
  return cacheDatos.get(clave);
}

/* ---------- Arranque ---------- */

// Aplica las marcas de ocultación del manifest. Los archivos siguen en el
// repositorio: simplemente no se muestran. Admite ocultar una iteración
// entera ("oculta": true) o propuestas sueltas ("ocultas": [...]).
function filtrarOcultos(man){
  const visibles = (man.iteraciones || [])
    .filter(it => it.oculta !== true)
    .map(it => {
      const ocultas = new Set(it.ocultas || []);
      const propuestas = (it.propuestas || []).filter(p => !ocultas.has(p));
      const copia = { ...it, propuestas };
      // Si la propuesta marcada como definitiva se ha ocultado, retiramos la
      // marca: no tiene sentido anunciar un horario que no se puede abrir.
      if (copia.aprobada && !propuestas.includes(copia.aprobada)) delete copia.aprobada;
      return copia;
    })
    // Una iteración sin propuestas visibles no se muestra
    .filter(it => it.propuestas.length > 0);

  man.iteraciones = visibles;
  return man;
}

async function iniciar(){
  try {
    const resp = await fetch(RUTA_DATOS + "manifest.json", {cache:"no-store"});
    if (!resp.ok) throw new Error("No se pudo cargar manifest.json");
    manifest = filtrarOcultos(await resp.json());
    if (!manifest.iteraciones.length)
      throw new Error("No hay ninguna propuesta visible en manifest.json");
    // Iteraciones ordenadas de más antigua a más reciente
    const norm = f => String(f).replace(/-/g,"");
    manifest.iteraciones.sort((a,b) => norm(a.fecha).localeCompare(norm(b.fecha)));
    $("curso").textContent = manifest.curso || "";
    iterIdx = manifest.iteraciones.length - 1;
    propIdx = 0;
    $("cargando").hidden = true;
    $("zonaPropuestas").hidden = false;
    await refrescarTodo();
  } catch(e){
    $("cargando").hidden = true;
    $("error").hidden = false;
    $("error").textContent = "Error al cargar los horarios: " + e.message;
  }
}

/* ---------- Render general ---------- */
async function refrescarTodo(){
  pintarBannerDefinitivo();
  pintarSelectorIteracion();
  pintarChips();
  await pintarSelectorYCuadricula();
}

function pintarBannerDefinitivo(){
  const ultima = manifest.iteraciones[manifest.iteraciones.length-1];
  const hay = ultima && ultima.aprobada;
  $("bannerDefinitivo").hidden = !hay;
  if (hay){
    $("tituloDefinitivo").textContent =
      `Horario definitivo: ${nombrePropuesta(ultima.aprobada)}`;
    $("detalleDefinitivo").textContent =
      `Iteración del ${fechaBonita(ultima.fecha)}` + (ultima.nota ? ` · ${ultima.nota}` : "");
  }
}

function pintarSelectorIteracion(){
  const sel = $("selIteracion");
  sel.innerHTML = manifest.iteraciones.map((it,i) =>
    `<option value="${i}"${i===iterIdx?" selected":""}>${fechaBonita(it.fecha)}${it.aprobada?" ★":""}</option>`
  ).reverse().join("");
  sel.parentElement.style.display = manifest.iteraciones.length > 1 ? "" : "none";
}

function pintarChips(){
  const it = iterActual();
  $("chips").innerHTML = "";
  it.propuestas.forEach((archivo,i) => {
    const chip = document.createElement("button");
    chip.className = "chip" + (i===propIdx ? " activa" : "");
    chip.innerHTML = (it.aprobada===archivo ? `<span class="estrella">★</span>` : "") +
      `<span>${nombrePropuesta(archivo)}</span>`;
    chip.addEventListener("click", async () => { propIdx = i; await refrescarTodo(); });
    $("chips").appendChild(chip);
  });
  $("notaIteracion").textContent = it.nota || "";
}

/* ---------- Visor ---------- */
async function pintarSelectorYCuadricula(){
  const it = iterActual();
  let datos;
  try {
    datos = await datosDePropuesta(it, it.propuestas[propIdx]);
  } catch(e){
    $("cuadricula").innerHTML = "";
    $("titularVista").textContent = "";
    $("vacio").hidden = true;
    $("error").hidden = false;
    $("error").textContent = e.message;
    return;
  }
  $("error").hidden = true;

  const lista = modo==="prof" ? datos.profesores : datos.grupos;
  if (!lista.includes(seleccion)) seleccion = "";
  $("selector").innerHTML =
    `<option value="">— Elegir ${modo==="prof"?"profesor":"curso"} —</option>` +
    lista.map(n => `<option${n===seleccion?" selected":""}>${n}</option>`).join("");
  actualizarBotonesNav(lista);
  pintarCuadricula(datos);
}

function actualizarBotonesNav(lista){
  const idx = seleccion ? lista.indexOf(seleccion) : -1;
  $("btnAnterior").disabled = idx <= 0;
  $("btnSiguiente").disabled = idx < 0 || idx >= lista.length-1;
}

async function navegar(dir){
  const it = iterActual();
  const datos = await datosDePropuesta(it, it.propuestas[propIdx]);
  const lista = modo==="prof" ? datos.profesores : datos.grupos;
  const idx = seleccion ? lista.indexOf(seleccion) : -1;
  const nuevo = idx + dir;
  if (nuevo >= 0 && nuevo < lista.length){
    seleccion = lista[nuevo];
    $("selector").value = seleccion;
    actualizarBotonesNav(lista);
    pintarCuadricula(datos);
  }
}

function pintarCuadricula(datos){
  const cont = $("cuadricula"), tit = $("titularVista");
  cont.innerHTML = ""; tit.textContent = "";
  $("vacio").hidden = !!seleccion;
  if (!seleccion) return;

  const it = iterActual();
  tit.innerHTML = `${seleccion} <span class="propTag">${nombrePropuesta(it.propuestas[propIdx])} · ${fechaBonita(it.fecha)}</span>`;
  cont.appendChild(construirTabla(datos, modo, seleccion));
}

/* ---------- Eventos ---------- */
$("selIteracion").addEventListener("change", async e => {
  iterIdx = +e.target.value;
  propIdx = 0;
  seleccion = "";
  await refrescarTodo();
});
$("tabProf").addEventListener("click", async () => { modo="prof"; seleccion=""; marcarTabs(); await pintarSelectorYCuadricula(); });
$("tabGrupo").addEventListener("click", async () => { modo="grupo"; seleccion=""; marcarTabs(); await pintarSelectorYCuadricula(); });
function marcarTabs(){
  $("tabProf").classList.toggle("activa", modo==="prof");
  $("tabGrupo").classList.toggle("activa", modo==="grupo");
}
$("selector").addEventListener("change", async e => {
  seleccion = e.target.value;
  const it = iterActual();
  const datos = await datosDePropuesta(it, it.propuestas[propIdx]);
  actualizarBotonesNav(modo==="prof" ? datos.profesores : datos.grupos);
  pintarCuadricula(datos);
});
$("btnAnterior").addEventListener("click", () => navegar(-1));
$("btnSiguiente").addEventListener("click", () => navegar(1));
$("btnImprimir").addEventListener("click", () => {
  document.body.classList.remove("imprimir-todos");
  window.print();
});

// Descargar todos: despliega el horario de cada profesor/curso de la propuesta
// actual (uno por página) y abre el diálogo de impresión → "Guardar como PDF".
$("btnTodos").addEventListener("click", async () => {
  const btn = $("btnTodos");
  const textoOriginal = btn.textContent;
  const cont = $("impresionMasiva");

  const limpiar = () => {
    document.body.classList.remove("imprimir-todos");
    cont.hidden = true;
    cont.innerHTML = "";
    document.title = "Horarios · CDP Torrealba";
    btn.disabled = false;
    btn.textContent = textoOriginal;
  };

  btn.disabled = true;
  btn.textContent = "Preparando…";
  cont.innerHTML = "";   // partir siempre de cero, no acumular ejecuciones previas

  try {
    const it = iterActual();
    const datos = await datosDePropuesta(it, it.propuestas[propIdx]);
    const lista = modo==="prof" ? datos.profesores : datos.grupos;
    const etiquetaProp = `${nombrePropuesta(it.propuestas[propIdx])} · ${fechaBonita(it.fecha)}`;
    const rotulo = modo==="prof" ? "profesor" : "curso";

    lista.forEach(nombre => {
      const bloque = document.createElement("section");
      bloque.className = "hojaHorario";
      const h = document.createElement("div");
      h.className = "tituloHoja";
      h.innerHTML = `${nombre} <span class="propTag">${etiquetaProp}</span>`;
      bloque.appendChild(h);
      bloque.appendChild(construirTabla(datos, modo, nombre));
      cont.appendChild(bloque);
    });
    cont.hidden = false;
    document.body.classList.add("imprimir-todos");
    document.title = `Horarios por ${rotulo} — ${etiquetaProp}`;

    // Limpiar en cuanto el diálogo se cierre
    window.addEventListener("afterprint", limpiar, { once:true });

    await new Promise(r => setTimeout(r, 80));  // esperar al render
    window.print();
  } catch (e) {
    alert("No se pudo preparar la descarga: " + e.message);
    limpiar();
  }
});

iniciar();
