# Intranet Jefatura Torrealba — módulo de horarios

Visor de propuestas de horarios (Peñalara/GHC) integrado en la intranet.
Estático: se despliega solo con cada push a GitHub → Vercel. Sin login, sin base de datos.

## Estructura del repositorio

```
/
├── index.html            ← portada (colores corporativos)
├── horarios.html         ← visor del curso en curso (26-27)
└── data/
    ├── manifest.json     ← índice de iteraciones
    └── AAAAMMDD/         ← una carpeta por iteración (p. ej. 20260720)
        ├── AAAAMMDD-propuesta-1.xml
        ├── AAAAMMDD-propuesta-2.xml
        └── AAAAMMDD-propuesta-3.xml
```

## Cómo publicar una nueva iteración de propuestas

1. Exporta de Peñalara los XML (1, 2 o 3 propuestas).
2. Crea una carpeta con la fecha en formato AAAAMMDD: `data/20260901/`.
3. Copia dentro los XML, p. ej. `20260901-propuesta-1.xml`, etc.
4. Añade la iteración al principio de `iteraciones` en `manifest.json`:

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
- Puedes poner 1, 2 o 3 propuestas por iteración. El campo `nota` es opcional.

## Cuando aprobéis una propuesta

Añade el campo `aprobada` a esa iteración con el nombre del XML elegido:

```json
{
  "fecha": "20260901",
  "nota": "Ajustes tras reunión de septiembre",
  "propuestas": [
    "20260901-propuesta-1.xml",
    "20260901-propuesta-2.xml",
    "20260901-propuesta-3.xml"
  ],
  "aprobada": "20260901-propuesta-2.xml"
}
```

Al hacer push, la página muestra arriba un banner "Horario definitivo"
y marca esa propuesta con ★. Las propuestas siguen visibles como archivo.

## Ocultar propuestas o iteraciones sin borrarlas

El formato JSON **no admite comentarios** (`//` o `/* */` romperían el archivo).
Para tener los XML subidos pero mostrar solo los que interesen, se usan dos
campos. Los archivos siguen en el repositorio; simplemente no se muestran.

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

## Notas técnicas

- El visor lee el encoding declarado en cada XML (Peñalara usa ISO-8859-1),
  así que las tildes y la ñ se ven bien sin tocar nada a mano.
- Muestra los recreos de los dos marcos horarios (A y B) y las reuniones
  dentro del horario de cada profesor.
- Color por materia estable (mismo color para la misma asignatura).
- Vistas por profesor y por curso, navegación ◀ ▶ e impresión.
- "Imprimir" saca el horario que hay en pantalla. "Descargar todos (PDF)"
  saca de una vez todos los horarios de la vista actual (los 28 profesores
  o los 16 cursos) de la propuesta que estés viendo, uno por página: abre el
  diálogo de impresión del navegador, ahí eliges "Guardar como PDF".

## Navegación entre páginas (patrón reutilizable)

Cada página *interior* (que no sea la portada) lleva arriba una barra con
un botón "Volver a la intranet" y unas migas de pan. Si añades una página
nueva, pega este bloque justo después de `<main>` y ajusta el texto:

```html
<nav class="navSuperior">
  <a href="index.html" class="btnVolver">← Volver a la intranet</a>
  <span class="migas">
    <a href="index.html">Intranet</a>
    <span class="sep">›</span>
    <span class="actual">NOMBRE DE ESTA PÁGINA</span>
  </span>
</nav>
```

El CSS de `.navSuperior`, `.btnVolver` y `.migas` está en el `<style>` de
`horarios.html`; cópialo al de la página nueva. La portada (`index.html`)
no lleva esta barra: es el punto de partida.