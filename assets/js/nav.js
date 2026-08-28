/* ==========================================================================
   <barra-nav pagina="Nombre de la página">

   La barra de "Volver a la intranet" con sus migas de pan. Antes había que
   copiar y pegar su HTML en cada página nueva; ahora basta con escribir:

       <barra-nav pagina="Horarios 2026-27"></barra-nav>

   El estilo está en base.css. Conviene dejar dentro un enlace de respaldo,
   por si el navegador no ejecutase este archivo:

       <barra-nav pagina="Horarios 2026-27">
         <a href="index.html" class="btnVolver">← Volver a la intranet</a>
       </barra-nav>
   ========================================================================== */

class BarraNav extends HTMLElement {
  connectedCallback(){
    const pagina = this.getAttribute("pagina") || document.title;
    this.innerHTML = `
      <nav class="navSuperior">
        <a href="index.html" class="btnVolver">← Volver a la intranet</a>
        <span class="migas">
          <a href="index.html">Intranet</a>
          <span class="sep">›</span>
          <span class="actual">${pagina}</span>
        </span>
      </nav>`;
  }
}

customElements.define("barra-nav", BarraNav);
