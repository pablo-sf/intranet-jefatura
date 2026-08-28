/* ==========================================================================
   ghc.js · lector de los XML que exporta Peñalara

   Es la pieza más delicada del visor: si algún día Peñalara cambia su
   formato de exportación, es aquí donde hay que mirar. No sabe nada de la
   página, sólo convierte un XML en datos.
   ========================================================================== */

function decodificar(buffer){
  const cabecera = new TextDecoder("ascii").decode(buffer.slice(0,120));
  const m = cabecera.match(/encoding="([^"]+)"/i);
  const enc = m ? m[1].toLowerCase() : "utf-8";
  return new TextDecoder(enc).decode(buffer);
}

function parsearGHC(texto){
  const doc = new DOMParser().parseFromString(texto, "text/xml");
  if (doc.querySelector("parsererror")) throw new Error("XML no válido");
  const txt = (el, sel) => { const n = el.querySelector(sel); return n ? n.textContent.trim() : ""; };

  const marcos = new Map();
  doc.querySelectorAll("marcosDeHorario > marcoHorario").forEach(mh => {
    const id = mh.getAttribute("id");
    mh.querySelectorAll(":scope > tramo").forEach(tr => {
      marcos.set(`${id}|${txt(tr,"dia")}|${txt(tr,"indice")}`, {
        ini: txt(tr,"horaEntrada").slice(0,5),
        fin: txt(tr,"horaSalida").slice(0,5),
        tipo: txt(tr,"Tipo")
      });
    });
  });

  const sesiones = new Map();
  doc.querySelectorAll("sesionesLectivas > sesion").forEach(s => {
    // Peñalara declara aquí las materias compartidas: una sesión tiene un grupo
    // y un profesor "principales", y los demás cuelgan de otrosGrupos/otrosProfesores.
    const otrosG = [...s.querySelectorAll("otrosGrupos > grupo")].map(g => g.textContent.trim());
    const otrosP = [...s.querySelectorAll("otrosProfesores > profesor")].map(p => p.textContent.trim());
    sesiones.set(s.getAttribute("id"), {
      materia: txt(s,"materia"),
      grupo:   txt(s,"grupo"),
      grupos:      [txt(s,"grupo"),   ...otrosG].filter(Boolean),
      profesores:  [txt(s,"profesor"), ...otrosP].filter(Boolean)
    });
  });

  const reuniones = new Map();
  doc.querySelectorAll("reuniones > reunion").forEach(r => {
    reuniones.set(txt(r,"nombre"),
      [...r.querySelectorAll("integrantes > integrante")].map(i => i.textContent.trim()));
  });

  const porProf = new Map(), porGrupo = new Map();
  const meter = (mapa, clave, item) => {
    if (!mapa.has(clave)) mapa.set(clave, []);
    mapa.get(clave).push(item);
  };
  doc.querySelectorAll("horario > tramo").forEach(tr => {
    const dia = +tr.getAttribute("dia"), indice = tr.getAttribute("indice"),
          marco = tr.getAttribute("marco");
    const franja = marcos.get(`${marco}|${dia}|${indice}`);
    if (!franja) return;
    tr.querySelectorAll(":scope > aula").forEach(aula => {
      const ses = sesiones.get(txt(aula,"sesion"));
      if (!ses) return;
      const profAula = txt(aula,"profesor");
      // El profesor del tramo puede no estar en la lista de la sesión: lo añadimos
      const profesores = ses.profesores.includes(profAula)
        ? ses.profesores : [profAula, ...ses.profesores];
      const grupos = ses.grupos;
      const base = { dia, ini:franja.ini, fin:franja.fin, materia:ses.materia };
      const compartida = grupos.length > 1 || profesores.length > 1;

      // Una clase compartida es UNA sola clase: aparece una vez en el horario de
      // cada profesor implicado (mostrando todos los grupos) y una vez en el de
      // cada grupo implicado (mostrando todos los profesores).
      const masDeUnProf = profesores.length > 1;
      profesores.forEach(p => {
        const otros = profesores.filter(x => x !== p);
        const notas = [];
        if (grupos.length > 1) notas.push(`Grupos juntos: ${grupos.join(", ")}`);
        if (otros.length)      notas.push(`Con: ${otros.join(", ")}`);
        meter(porProf, p, {...base, grupo:ses.grupo, detalle: grupos.join(" · "),
                           compartida, nota: notas.join(" · ")});
      });
      grupos.forEach(g => {
        const otros = grupos.filter(x => x !== g);
        const notas = [];
        if (otros.length)   notas.push(`Junto a: ${otros.join(", ")}`);
        if (masDeUnProf)    notas.push(`Profesores: ${profesores.join(", ")}`);
        meter(porGrupo, g, {...base, grupo:ses.grupo, detalle: profesores.join(" · "),
                            compartida, nota: notas.join(" · ")});
      });
    });
    tr.querySelectorAll(":scope > reunion").forEach(re => {
      const nombre = re.textContent.trim();
      (reuniones.get(nombre) || []).forEach(p =>
        meter(porProf, p, { dia, ini:franja.ini, fin:franja.fin,
                            materia:nombre, detalle:"Reunión", reunion:true }));
    });
  });

  const recreos = [];
  marcos.forEach(f => {
    if (f.tipo === "recreo" && !recreos.some(r => r.ini===f.ini && r.fin===f.fin))
      recreos.push({ini:f.ini, fin:f.fin});
  });

  return {
    porProf, porGrupo, recreos,
    profesores: [...porProf.keys()].sort((a,b)=>a.localeCompare(b,"es")),
    grupos: [...porGrupo.keys()].sort((a,b)=>a.localeCompare(b,"es"))
  };
}

export { decodificar, parsearGHC };
