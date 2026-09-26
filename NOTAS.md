# Garantías de neumáticos — NOTAS

## 2026-09-26 11:40 — v1 publicada
**Qué es:** web app para el celular (Chrome Android) que registra la venta de cubiertas y genera un PDF de garantía de 12 meses para compartir por WhatsApp. $0, sin servidor. La van a usar 5 vendedores, cada uno en su celular y con sus propios datos.

**Acordado con el usuario:**
- Configuración la primera vez (editable en "Mis datos"): nombre de fantasía, teléfono, dirección (opc.), logo (galería). Sin CUIT.
- Carga: cantidad, marca de la cubierta, tipo (auto/camioneta: ancho/perfil R rodado → `205/55 R16`; moto: medida/perfil-rodado → `110/90-17`, sin perfil → `2.75-18`), comprador (apellido, nombre, DNI, tel.), vehículo (marca, modelo, año opc., dominio), observaciones (opc.).
- Automático: fecha de venta, vencimiento a +12 meses, código aleatorio tipo `00A345` (solo da seriedad; no es correlativo).
- Archivo: `GARANTIA APELLIDO NOMBRE.pdf`. Se comparte con el menú de Android (Web Share API); si no se puede, se descarga.
- Historial en el celular (localStorage), con búsqueda por apellido/DNI/dominio/código, volver a compartir y borrar.

**Pendiente / decisiones diferidas:**
- Condiciones de garantía: texto BORRADOR (pdf.js, CONDICIONES); el usuario tiene que revisarlo.
- Respaldo del historial (exportar/importar): diferido. Riesgo: si se pierde el celular o se borran los datos de Chrome, se pierde el historial.
- APK: "en un futuro cercano"; envolver esta misma web con Capacitor.

**Archivos:** index.html (UI), app.js (lógica), pdf.js (PDF, también probado en Node), sw.js (offline), vendor/jspdf 2.5.1.

## 2026-09-26 12:20 — Observaciones con defectos para tildar
- En la carga, las observaciones son una lista de defectos para tildar, más el texto libre "Detalles / otros". En el PDF salen solo los tildados (con viñeta) y el texto libre; si no hay nada, dice "Sin observaciones.".
- Cada vendedor edita la lista en "Mis datos" (agregar, editar, eliminar con ✕); se guarda en config.defectos. Lista inicial: llanta con deformaciones/golpes, desgaste irregular por mala alineación, tren delantero con desperfectos, amortiguadores en mal estado, vibración/falta de balanceo, neumáticos no reemplazados con desgaste.
- Sin selector de rueda (decisión del usuario): la posición va en el texto libre.
- Probado localmente con Chrome automatizado (editar/borrar/agregar, renglón vacío ignorado, persistencia, tildes limpios en la garantía siguiente) y el PDF generado en Node.
- Pendiente: texto de condiciones (el usuario lo pidió ver; decisiones abiertas: quién evalúa el reclamo, bonificación proporcional, mano de obra).

## 2026-09-26 12:45 — Localidad por defecto y teléfono destacado
- Nuevo campo "Localidad" en Mis datos, por defecto "San Miguel de Tucumán - Tucumán" (también para vendedores ya configurados; si la vacían a propósito, se respeta).
- Encabezado del PDF: nombre → Tel. (15 pt, negrita, verde) → localidad → dirección (1 renglón).

## 2026-09-26 13:00 — Condiciones: procedimiento de reclamo
- Agregado a la letra chica: el cliente deja el neumático en el local para una revisión más precisa; de ser necesario se envía a garantía a la sucursal Buenos Aires (plazo estimado de 3 a 5 días hábiles); bonificación proporcional al desgaste de la cubierta al momento del reclamo.
- (resuelto 13:10) Los 3-5 días hábiles son para la respuesta de la sucursal; la garantía NO cubre mano de obra (colocación, balanceo, alineación u otros servicios). Condiciones cerradas por ahora.
