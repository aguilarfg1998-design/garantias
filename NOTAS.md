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
