# Intranet Jefatura Torrealba

Intranet del equipo directivo del CDP Torrealba. Es un sitio estático: se
despliega solo con cada push a GitHub → Vercel. Sin login, sin base de datos
y sin nada que compilar. Los archivos que hay en el repositorio son
exactamente los que se publican.

Ahora mismo tiene tres páginas:

- **Portada** (`index.html`) — el índice de todo.
- **Horarios** (`horarios.html`) — visor de las propuestas de Peñalara.
- **Hoja de Avisos** (`hoja-de-avisos.html`) — manual de uso y administración
  del boletín semanal.

## Estructura del repositorio

```
/
├── index.html              ← portada
├── horarios.html           ← visor de propuestas de horarios
├── hoja-de-avisos.html     ← manual de la Hoja de Avisos
├── robots.txt              ← pide a los buscadores que no indexen nada
├── assets/
│   ├── css/
│   │   ├── base.css        ← colores y tipografías de la casa (ver abajo)
│   │   ├── portada.css
│   │   ├── horarios.css
│   │   └── avisos.css
│   └── js/
│       ├── nav.js          ← la barra de "Volver a la intranet"
│       ├── avisos.js       ← la calculadora del viernes
│       └── horarios/
│           ├── ghc.js      ← lee los XML de Peñalara
│           ├── render.js   ← dibuja las cuadrículas
│           └── app.js      ← estado, carga y botones
└── data/
    ├── manifest.json       ← índice de iteraciones
    └── AAAAMMDD/           ← una carpeta por iteración (p. ej. 20260720)
        ├── AAAAMMDD-propuesta-1.xml
        ├── AAAAMMDD-propuesta-2.xml
        └── AAAAMMDD-propuesta-3.xml
```

---

# Trabajo del día a día

## Cómo publicar una nueva iteración de propuestas

1. Exporta de Peñalara los XML (los que sean).
2. Crea una carpeta con la fecha en formato AAAAMMDD: `data/20260901/`.
3. Copia dentro los XML, p. ej. `20260901-propuesta-1.xml`, etc.
4. Añade la iteración a `iteraciones` en `manifest.json`:

```json
{
  "fecha": "20260901",
  "nota": "Ajustes tras reunión de septiembre",
  "propuestas": [
    "20260901-propuesta-1.xml",
    "20260901-propuesta-2.xml",
    "20260901-propuesta-3.xml"
  ]
}
```

5. `git push`. Vercel redespliega solo. El equipo ve la iteración más
   reciente al entrar; las anteriores quedan en el desplegable "Iteración".

Notas:
- El campo `fecha` debe ir en formato AAAAMMDD (ocho dígitos). La web lo
  usa para ordenar las iteraciones y para mostrar "Iteración del 1 de
  septiembre de 2026".
- El nombre de los XML es libre: el prefijo de fecha es solo para tu
  orden de archivos; en pantalla se muestra "Propuesta 1", "Propuesta 2"…
- Puedes poner las propuestas que quieras por iteración. El campo `nota`
  es opcional.
- El JSON **no admite comentarios** (`//` o `/* */` romperían el archivo)
  ni comas de más al final de una lista. Si la página deja de cargar
  después de tocarlo, ahí suele estar el problema.

## Cuando aprobéis una propuesta

Añade el campo `aprobada` a esa iteración con el nombre del XML elegido:

```json
{
  "fecha": "20260901",
  "propuestas": ["20260901-propuesta-1.xml", "20260901-propuesta-2.xml"],
  "aprobada": "20260901-propuesta-2.xml"
}
```

Al hacer push, la página muestra arriba un banner "Horario definitivo"
y marca esa propuesta con ★. Las propuestas siguen visibles como archivo.

## Ocultar propuestas o iteraciones sin borrarlas

Para tener los XML subidos pero mostrar solo los que interesen. Los archivos
siguen en el repositorio; simplemente no se muestran.

**Ocultar propuestas sueltas** — añade `ocultas` con los nombres a esconder:

```json
{
  "fecha": "20260722",
  "propuestas": [
    "20260722-propuesta-1.xml",
    "20260722-propuesta-2.xml",
    "20260722-propuesta-3.xml"
  ],
  "ocultas": ["20260722-propuesta-2.xml"]
}
```

Se verán la 1 y la 3. Para volver a mostrar la 2, quítala de `ocultas`.

**Ocultar una iteración entera** — añade `"oculta": true`:

```json
{
  "fecha": "20260720",
  "nota": "Borrador descartado",
  "propuestas": ["20260720-propuesta-1.xml"],
  "oculta": true
}
```

Detalles a tener en cuenta:
- Una iteración cuyas propuestas estén todas ocultas no aparece.
- Si ocultas la propuesta marcada como `aprobada`, el banner de "Horario
  definitivo" desaparece automáticamente (no anuncia algo que no se puede abrir).
- Si ocultas absolutamente todo, la página avisa de que no hay nada visible.
- El botón "Descargar todos (PDF)" también respeta lo oculto.
- No hace falta escribir `"ocultas": []` ni `"aprobada": ""` cuando no hay
  nada que ocultar ni nada aprobado: se dejan fuera y ya está.

---

# Tocar el código

## Los colores y las tipografías están en un solo sitio

Todo lo visual de la casa vive en `assets/css/base.css`: el teal y la lima
corporativos, los grises, las tipografías y la barra de navegación. Cambiar
ahí el color cambia las tres páginas a la vez. **No los repitas en las otras
hojas**: usa las variables (`var(--teal)`, `var(--tinta)`…).

Hay un grupo aparte, los **colores con significado**:

```css
--aviso-programado   /* el verde de los avisos ya programados */
--pendiente          /* el ámbar de las salidas por aprobar */
--urgente            /* el Tomate del calendario */
```

Esos no son decoración: reproducen los colores con los que la hoja de cálculo
y el calendario marcan cada estado. Si se cambian por gusto, la web deja de
corresponderse con lo que el equipo ve en la hoja.

Cada página tiene además su propia hoja para lo suyo: `portada.css`,
`horarios.css` y `avisos.css`.

En la portada, cada sección tiene su propio color de borde (`portada.css`),
en una progresión que va de la lima al teal corporativo: arriba la lima
contrasta con la cabecera teal, y abajo el teal cierra la página. Si añades o mueves
secciones, dale a la nueva su clase `s-loquesea` y comprueba que la gama
sigue teniendo sentido de arriba abajo.

## Después de tocar un CSS o un JS, sube el número de versión

Los enlaces llevan un número al final:

```html
<link rel="stylesheet" href="assets/css/base.css?v=5">
```

Ese `?v=4` existe para que nadie se quede con una versión antigua guardada en
la caché de su navegador. **Cuando cambies un archivo, sube su número en todas
las páginas que lo enlacen.** Si no, alguien puede seguir viendo lo de antes
durante días.

## Añadir una página nueva

Copia la cabecera de una página existente, enlaza `base.css` más la hoja que
necesites, y pon la barra de navegación con esta etiqueta:

```html
<barra-nav pagina="NOMBRE DE ESTA PÁGINA">
  <a href="index.html" class="btnVolver">← Volver a la intranet</a>
</barra-nav>
```

Necesita `<script src="assets/js/nav.js?v=1" defer></script>` en la cabecera.
El enlace de dentro es un respaldo por si el navegador no llegara a ejecutar
el archivo: así nunca se queda nadie sin manera de volver.

Acuérdate de dos cosas que se olvidan siempre:

1. **Enlazarla desde `index.html`**, o existirá pero no la encontrará nadie.
2. Ponerle `<meta name="robots" content="noindex">`.

La portada no lleva barra de navegación: es el punto de partida.

## Cómo está repartido el visor de horarios

- **`ghc.js`** lee los XML de Peñalara y los convierte en datos. Es la pieza
  más frágil del proyecto: si algún curso Peñalara cambia su formato de
  exportación y los horarios dejan de verse, **es el único archivo que hay
  que mirar**.
- **`render.js`** dibuja la cuadrícula de un horario. Se usa igual para el de
  la pantalla que para los de "Descargar todos".
- **`app.js`** guarda qué se está mirando, carga el manifest y atiende los
  botones.

Se cargan como módulos, así que `horarios.html` solo enlaza `app.js`; los
otros dos los pide él.

## Probar en tu ordenador antes de subir

Las páginas que van a buscar archivos (los horarios leen el manifest y los
XML) **no funcionan abriéndolas con doble clic**: los navegadores prohíben
que un archivo suelto lea otros archivos del disco. Para probar en local,
levanta un servidor en la carpeta del proyecto:

```bash
python3 -m http.server 8000
```

Y abre `http://localhost:8000`. Para terminar, Ctrl+C.

---

## Notas técnicas del visor

- Lee el encoding declarado en cada XML (Peñalara usa ISO-8859-1), así que
  las tildes y la ñ se ven bien sin tocar nada a mano.
- Muestra los recreos de los dos marcos horarios (A y B) y las reuniones
  dentro del horario de cada profesor.
- Color por materia estable: la misma asignatura mantiene su color, y un
  profesor que la da en varios cursos ve un color distinto en cada uno.
- Vistas por profesor y por curso, navegación ◀ ▶ e impresión.
- "Imprimir" saca el horario que hay en pantalla. "Descargar todos (PDF)"
  saca de una vez todos los horarios de la vista actual (los 28 profesores
  o los 16 cursos) de la propuesta que estés viendo, uno por página: abre el
  diálogo de impresión del navegador, ahí eliges "Guardar como PDF".
