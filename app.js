// Lógica de la app: configuración, carga de garantías, historial y compartir.
(function () {
  const K_CONFIG = 'gar_config', K_HIST = 'gar_historial';
  const $ = (s) => document.querySelector(s);

  function leer(k, def) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; } }
  function guardar(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; }
    catch (e) { alert('No se pudo guardar en el teléfono (¿memoria llena?).'); return false; }
  }

  const DEFECTOS = [
    'Llanta con deformaciones / golpes',
    'Desgaste irregular por mala alineación',
    'Tren delantero con desperfectos',
    'Amortiguadores en mal estado',
    'Vibración / falta de balanceo',
    'Neumáticos no reemplazados con desgaste',
  ];
  let config = leer(K_CONFIG, null);
  const defectosConfig = () => (config && config.defectos) || DEFECTOS;
  let tipo = 'auto';
  let ultima = null; // última garantía generada, para compartir

  // ---------- Navegación ----------
  const vistas = ['config', 'nueva', 'ok', 'historial'];
  function mostrar(v) {
    vistas.forEach((n) => $('#v-' + n).classList.toggle('oculto', n !== v));
    document.querySelectorAll('nav button').forEach((b) => b.classList.toggle('on', b.dataset.v === v || (v === 'ok' && b.dataset.v === 'nueva')));
    $('#nav').classList.toggle('oculto', !config);
    $('#titulo').textContent = config ? config.nombre : 'Garantías';
    if (v === 'historial') pintarHistorial();
    if (v === 'config') cargarConfigEnForm();
    window.scrollTo(0, 0);
  }
  document.querySelectorAll('nav button').forEach((b) => b.addEventListener('click', () => mostrar(b.dataset.v)));

  // ---------- Configuración ----------
  let logoTmp = null;
  function cargarConfigEnForm() {
    const c = config || {};
    $('#bienvenida').classList.toggle('oculto', !!config);
    $('#c-nombre').value = c.nombre || '';
    $('#c-telefono').value = c.telefono || '';
    $('#c-direccion').value = c.direccion || '';
    $('#c-defectos').innerHTML = '';
    defectosConfig().forEach(agregarDefectoEditable);
    logoTmp = c.logo || null;
    pintarLogo();
  }
  function pintarLogo() {
    $('#c-logo-prev').classList.toggle('oculto', !logoTmp);
    $('#c-quitar-logo').classList.toggle('oculto', !logoTmp);
    if (logoTmp) $('#c-logo-prev').src = logoTmp;
    $('#c-logo').value = '';
  }
  // Achica el logo para que no ocupe mucho espacio guardado.
  $('#c-logo').addEventListener('change', (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const img = new Image();
    img.onload = () => {
      const max = 400, esc = Math.min(1, max / Math.max(img.width, img.height));
      const cv = document.createElement('canvas');
      cv.width = Math.round(img.width * esc); cv.height = Math.round(img.height * esc);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      logoTmp = cv.toDataURL('image/png');
      URL.revokeObjectURL(img.src);
      pintarLogo();
    };
    img.onerror = () => alert('No se pudo leer esa imagen.');
    img.src = URL.createObjectURL(f);
  });
  $('#c-quitar-logo').addEventListener('click', () => { logoTmp = null; pintarLogo(); });

  // Lista editable de defectos: cada renglón se puede editar o borrar con ✕.
  function agregarDefectoEditable(texto) {
    const fila = document.createElement('div');
    const i = document.createElement('input');
    i.value = texto || ''; i.placeholder = 'Nuevo defecto';
    const x = document.createElement('button');
    x.type = 'button'; x.textContent = '✕'; x.title = 'Eliminar';
    x.addEventListener('click', () => fila.remove());
    fila.append(i, x);
    $('#c-defectos').appendChild(fila);
    return i;
  }
  $('#c-agregar-defecto').addEventListener('click', () => agregarDefectoEditable('').focus());
  $('#c-guardar').addEventListener('click', () => {
    const nombre = $('#c-nombre').value.trim(), telefono = $('#c-telefono').value.trim();
    $('#c-nombre').classList.toggle('invalido', !nombre);
    $('#c-telefono').classList.toggle('invalido', !telefono);
    if (!nombre || !telefono) return;
    const defectos = [...document.querySelectorAll('#c-defectos input')].map((i) => i.value.trim()).filter(Boolean);
    const nuevo = { nombre, telefono, direccion: $('#c-direccion').value.trim(), logo: logoTmp, defectos };
    if (guardar(K_CONFIG, nuevo)) { config = nuevo; pintarDefectos(); mostrar('nueva'); }
  });

  // ---------- Formulario ----------
  const f = $('#f');
  function pintarDefectos() {
    const cont = $('#defectos');
    cont.innerHTML = '';
    defectosConfig().forEach((d) => {
      const l = document.createElement('label');
      const i = document.createElement('input');
      i.type = 'checkbox'; i.value = d;
      l.append(i, document.createTextNode(d));
      cont.appendChild(l);
    });
  }
  $('#tipo').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    tipo = b.dataset.v;
    document.querySelectorAll('#tipo button').forEach((x) => x.classList.toggle('on', x === b));
    $('#medida-auto').classList.toggle('oculto', tipo !== 'auto');
    $('#medida-moto').classList.toggle('oculto', tipo !== 'moto');
    previa();
  });

  function datosMedida() {
    if (tipo === 'moto') return { tipo, medida: f.mMedida.value.trim(), perfil: f.mPerfil.value.trim(), rodado: f.mRodado.value.trim() };
    return { tipo, ancho: f.ancho.value.trim(), perfil: f.perfil.value.trim(), rodado: f.rodado.value.trim() };
  }
  function previa() {
    const m = datosMedida();
    const completa = tipo === 'moto' ? m.medida && m.rodado : m.ancho && m.perfil && m.rodado;
    $('#previa').textContent = completa ? 'Medida: ' + GarantiaPdf.medida(m) : '';
  }
  f.addEventListener('input', (e) => { e.target.classList.remove('invalido'); previa(); });

  function codigo(existentes) {
    const L = 'ABCDEFGHJKLMNPQRSTUVWXYZ', D = '0123456789';
    const r = (s) => s[Math.floor(Math.random() * s.length)];
    let c;
    do { c = r(D) + r(D) + r(L) + r(D) + r(D) + r(D); } while (existentes.has(c));
    return c;
  }

  f.addEventListener('submit', (e) => {
    e.preventDefault();
    // Valida sólo los campos visibles
    let primero = null;
    f.querySelectorAll('input[required]').forEach((i) => {
      const visible = !i.closest('.oculto');
      const mal = visible && !i.value.trim();
      i.classList.toggle('invalido', mal);
      if (mal && !primero) primero = i;
    });
    if (primero) { primero.focus(); primero.scrollIntoView({ block: 'center' }); return; }

    const hist = leer(K_HIST, []);
    const ahora = new Date(), vence = new Date(ahora);
    vence.setMonth(vence.getMonth() + 12);
    const cap = (s) => s.trim().replace(/\s+/g, ' ');
    const g = Object.assign(datosMedida(), {
      id: Date.now(),
      codigo: codigo(new Set(hist.map((h) => h.codigo))),
      fecha: ahora.toISOString(),
      vence: vence.toISOString(),
      cantidad: f.cantidad.value.trim(),
      marcaCubierta: cap(f.marcaCubierta.value),
      apellido: cap(f.apellido.value).toUpperCase(),
      nombre: cap(f.nombre.value).toUpperCase(),
      dni: f.dni.value.replace(/\D/g, ''),
      telefono: f.telefono.value.trim(),
      marcaVehiculo: cap(f.marcaVehiculo.value),
      modelo: cap(f.modelo.value),
      anio: f.anio.value.trim(),
      dominio: f.dominio.value.replace(/\s/g, '').toUpperCase(),
      defectos: [...document.querySelectorAll('#defectos input:checked')].map((i) => i.value),
      observaciones: f.observaciones.value.trim(),
    });
    hist.unshift(g);
    if (!guardar(K_HIST, hist)) return;
    ultima = g;
    $('#ok-archivo').textContent = GarantiaPdf.nombreArchivo(g);
    mostrar('ok');
    compartir(g);
  });

  $('#ok-compartir').addEventListener('click', () => ultima && compartir(ultima));
  $('#ok-nueva').addEventListener('click', () => {
    f.reset(); previa(); mostrar('nueva');
  });

  // ---------- PDF y compartir ----------
  async function compartir(g) {
    const doc = GarantiaPdf.construirPdf(window.jspdf.jsPDF, config, g);
    const nombre = GarantiaPdf.nombreArchivo(g);
    const blob = doc.output('blob');
    const file = new File([blob], nombre, { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: nombre }); return; }
      catch (e) { if (e.name === 'AbortError') return; }
    }
    // Plan B: descargar el archivo
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = nombre;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }

  // ---------- Historial ----------
  function pintarHistorial() {
    const q = $('#buscar').value.trim().toUpperCase();
    const hist = leer(K_HIST, []).filter((g) => !q ||
      (g.apellido + ' ' + g.nombre + ' ' + g.dni + ' ' + g.dominio + ' ' + g.codigo).toUpperCase().includes(q));
    const lista = $('#lista');
    lista.innerHTML = '';
    if (!hist.length) { lista.innerHTML = '<div class="vacio">' + (q ? 'Sin resultados.' : 'Todavía no hay garantías.') + '</div>'; return; }
    hist.forEach((g) => {
      const d = document.createElement('div');
      d.className = 'item';
      d.innerHTML = '<div class="t"></div><div class="s"></div><div class="acciones">' +
        '<button class="btn acc chico" data-a="c">Compartir</button>' +
        '<button class="btn sec chico" data-a="b">Borrar</button></div>';
      d.querySelector('.t').textContent = g.apellido + ', ' + g.nombre + ' — ' + g.dominio;
      d.querySelector('.s').textContent = GarantiaPdf.fecha(g.fecha) + ' · N° ' + g.codigo + ' · ' + g.cantidad + '× ' +
        g.marcaCubierta + ' ' + GarantiaPdf.medida(g) + ' · DNI ' + g.dni;
      d.querySelector('[data-a=c]').addEventListener('click', () => compartir(g));
      d.querySelector('[data-a=b]').addEventListener('click', () => {
        if (!confirm('¿Borrar la garantía de ' + g.apellido + ', ' + g.nombre + '?')) return;
        guardar(K_HIST, leer(K_HIST, []).filter((h) => h.id !== g.id));
        pintarHistorial();
      });
      lista.appendChild(d);
    });
  }
  $('#buscar').addEventListener('input', pintarHistorial);

  // ---------- Inicio ----------
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js');
  pintarDefectos();
  mostrar(config ? 'nueva' : 'config');
})();
