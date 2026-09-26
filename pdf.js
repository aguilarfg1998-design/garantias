// Generación del PDF de garantía. Funciona en el navegador (window.jspdf) y en Node (para pruebas).
(function (root) {
  const CONDICIONES =
    'CONDICIONES DE GARANTÍA: La presente garantía cubre defectos de fabricación de los neumáticos detallados ' +
    'por el plazo de 12 (doce) meses contados desde la fecha de venta. No cubre: cortes, pinchaduras, impactos ' +
    'o deformaciones por golpes contra cordones, baches u objetos; desgaste irregular causado por desalineación, ' +
    'falta de balanceo, suspensión, dirección o frenos en mal estado; uso con presión de inflado incorrecta, ' +
    'sobrecarga o exceso de velocidad; reparaciones o intervenciones realizadas por terceros; uso en competición ' +
    'o distinto al previsto para el vehículo. Para hacer efectiva la garantía deberá presentarse este certificado ' +
    'junto con el neumático. El vendedor evaluará el neumático y, de corresponder, reconocerá su reposición o una ' +
    'bonificación proporcional al desgaste. Las observaciones consignadas al momento de la venta forman parte de ' +
    'este certificado y los defectos allí indicados quedan excluidos de la garantía.';

  function fecha(iso) {
    const d = new Date(iso);
    const p = (n) => String(n).padStart(2, '0');
    return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear();
  }

  function medida(g) {
    if (g.tipo === 'moto') {
      return g.perfil ? g.medida + '/' + g.perfil + '-' + g.rodado : g.medida + '-' + g.rodado;
    }
    return g.ancho + '/' + g.perfil + ' R' + g.rodado;
  }

  function nombreArchivo(g) {
    const limpio = (s) => String(s || '').trim().toUpperCase().replace(/[\\/:*?"<>|]/g, '');
    return 'GARANTIA ' + limpio(g.apellido) + ' ' + limpio(g.nombre) + '.pdf';
  }

  function construirPdf(JsPDF, config, g) {
    const doc = new JsPDF({ unit: 'mm', format: 'a4' });
    const M = 15, W = 210, ancho = W - 2 * M;
    let y = M;

    // Encabezado: logo + datos del vendedor
    let xDatos = M;
    if (config.logo) {
      try {
        const props = doc.getImageProperties(config.logo);
        const maxW = 40, maxH = 26;
        const esc = Math.min(maxW / props.width, maxH / props.height);
        const w = props.width * esc, h = props.height * esc;
        doc.addImage(config.logo, M, y, w, h);
        xDatos = M + maxW + 6;
      } catch (e) { /* logo inválido: se omite */ }
    }
    doc.setTextColor(20);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
    doc.text(config.nombre || '', xDatos, y + 7);
    let yd = y + 14.5;
    // Teléfono destacado: grande, en negrita y en verde
    if (config.telefono) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(21, 128, 61);
      doc.text('Tel.: ' + config.telefono, xDatos, yd); yd += 6;
      doc.setTextColor(20);
    }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    if (config.localidad) { doc.text(config.localidad, xDatos, yd); yd += 5; }
    if (config.direccion) { doc.text(doc.splitTextToSize(config.direccion, W - M - xDatos)[0], xDatos, yd); }
    y += 30;
    doc.setDrawColor(40); doc.setLineWidth(0.6); doc.line(M, y, W - M, y);

    // Título
    y += 11;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(18);
    doc.text('CERTIFICADO DE GARANTÍA', W / 2, y, { align: 'center' });
    y += 7;
    doc.setFontSize(11);
    doc.text('N° ' + g.codigo, W / 2, y, { align: 'center' });
    y += 6;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.text('Fecha de venta: ' + fecha(g.fecha) + '     Válida hasta: ' + fecha(g.vence), W / 2, y, { align: 'center' });
    y += 8;

    function seccion(titulo, filas) {
      const altoFila = 6.5;
      const h = 8 + filas.length * altoFila + 2;
      doc.setFillColor(235); doc.rect(M, y, ancho, 7, 'F');
      doc.setDrawColor(170); doc.setLineWidth(0.3); doc.rect(M, y, ancho, h);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
      doc.text(titulo, M + 3, y + 5);
      let yy = y + 7 + altoFila - 1;
      filas.forEach(([k, v]) => {
        doc.setFont('helvetica', 'bold'); doc.text(k + ':', M + 3, yy);
        doc.setFont('helvetica', 'normal'); doc.text(String(v), M + 45, yy);
        yy += altoFila;
      });
      y += h + 5;
    }

    seccion('NEUMÁTICOS', [
      ['Cantidad', g.cantidad],
      ['Marca', g.marcaCubierta],
      ['Medida', medida(g)],
      ['Tipo', g.tipo === 'moto' ? 'Moto' : 'Auto / Camioneta'],
    ]);
    seccion('CLIENTE', [
      ['Apellido y nombre', (g.apellido + ', ' + g.nombre)],
      ['DNI', g.dni],
      ['Teléfono', g.telefono],
    ]);
    const filasVeh = [['Marca', g.marcaVehiculo], ['Modelo', g.modelo]];
    if (g.anio) filasVeh.push(['Año', g.anio]);
    filasVeh.push(['Dominio', g.dominio]);
    seccion('VEHÍCULO', filasVeh);

    // Observaciones, destacadas
    doc.setFontSize(10);
    let lineas = [];
    (g.defectos || []).forEach((d) => { lineas = lineas.concat(doc.splitTextToSize('• ' + d, ancho - 6)); });
    const libre = (g.observaciones || '').trim();
    if (libre) lineas = lineas.concat(doc.splitTextToSize(libre, ancho - 6));
    if (!lineas.length) lineas = ['Sin observaciones.'];
    const hObs = 8 + lineas.length * 5 + 3;
    doc.setFillColor(255, 243, 205); doc.rect(M, y, ancho, hObs, 'F');
    doc.setDrawColor(200, 150, 0); doc.setLineWidth(0.5); doc.rect(M, y, ancho, hObs);
    doc.setFont('helvetica', 'bold'); doc.text('OBSERVACIONES (estado previo del vehículo / neumáticos)', M + 3, y + 5.5);
    doc.setFont('helvetica', 'normal'); doc.text(lineas, M + 3, y + 11);
    y += hObs + 8;

    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.text('Garantía por 12 meses desde la fecha de venta.', W / 2, y, { align: 'center' });

    // Condiciones en letra chica, al pie
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(80);
    const cond = doc.splitTextToSize(CONDICIONES, ancho);
    const yCond = 297 - M - cond.length * 3;
    doc.setDrawColor(200); doc.setLineWidth(0.2); doc.line(M, yCond - 4, W - M, yCond - 4);
    doc.text(cond, M, yCond);

    return doc;
  }

  const api = { construirPdf, nombreArchivo, medida, fecha };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.GarantiaPdf = api;
})(this);
