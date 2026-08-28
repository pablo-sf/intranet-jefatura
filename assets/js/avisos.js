/* -----------------------------------------------------------------
   Calculadora del viernes.
   Regla del sistema: se coge el LUNES de la semana en la que cae el
   evento y se le restan 3 días. Ese es el viernes del boletín en el
   que aparece el aviso.
   ----------------------------------------------------------------- */
(function(){
  var campo  = document.getElementById('fechaEvento');
  var salida = document.getElementById('resultado');
  if(!campo || !salida) return;

  var DIAS  = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
  var MESES = ['enero','febrero','marzo','abril','mayo','junio','julio',
               'agosto','septiembre','octubre','noviembre','diciembre'];

  // "martes 20 de octubre de 2026"
  function enLetra(f){
    return DIAS[f.getDay()] + ' ' + f.getDate() + ' de ' +
           MESES[f.getMonth()] + ' de ' + f.getFullYear();
  }

  function viernesDelBoletin(f){
    var d = f.getDay();                       // 0 domingo … 6 sábado
    var haciaElLunes = (d === 0) ? -6 : 1 - d;
    var lunes = new Date(f);
    lunes.setDate(f.getDate() + haciaElLunes);
    var viernes = new Date(lunes);
    viernes.setDate(lunes.getDate() - 3);     // la regla del sistema
    return viernes;
  }

  function calcular(){
    if(!campo.value){
      salida.className = 'vacio';
      salida.textContent = 'Elige una fecha para ver en qué boletín sale.';
      return;
    }
    // Se fija el mediodía para que ningún cambio de hora mueva el día.
    var evento  = new Date(campo.value + 'T12:00:00');
    var viernes = viernesDelBoletin(evento);
    salida.className = '';
    salida.innerHTML =
      '<span class="flecha">' + enLetra(evento) + ' →</span>' +
      'Sale en el boletín del <b>' + enLetra(viernes) + '</b>';
  }

  campo.addEventListener('change', calcular);
  campo.addEventListener('input', calcular);
  calcular();
})();
