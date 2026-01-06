/*****************************************************
 * Gender Scholar - content.js
 * Recolecta títulos y autores LIMPIOS por artículo
 *****************************************************/

let ARTICULOS_CACHE = [];

// ---------------- UTIL ----------------
function esperar(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ---------------- LIMPIEZA DE NOMBRES ----------------
function limpiarNombreAutor(texto) {
  if (!texto) return "";

  // Quitar viñetas
  texto = texto.replace(/^[-•\u2022]\s*/, "").trim();

  // Cortar en el primer punto, dos puntos o signo ¿
  texto = texto.split(/[.:¿]/)[0];

  // Quitar espacios múltiples
  texto = texto.replace(/\s+/g, " ").trim();

  // Debe tener al menos nombre y apellido
  if (texto.split(" ").length < 2) return "";

  return texto;
}

// ---------------- MLA ----------------
async function obtenerCitaMLAporID(cid) {
  const url = `https://scholar.google.com/scholar?q=info:${cid}:scholar.google.com/&output=cite`;
  const res = await fetch(url);
  const html = await res.text();

  const doc = new DOMParser().parseFromString(html, "text/html");
  const filas = doc.querySelectorAll("tr");

  for (const fila of filas) {
    if (fila.querySelector("th")?.innerText === "MLA") {
      return fila.querySelector("td")?.innerText;
    }
  }
  return null;
}

function extraerAutoresDesdeMLA(cita) {
  if (!cita) return [];

  const parteAutores = cita.split(". \"")[0];
  const bloques = parteAutores.split(" and ");
  let autores = [];

  // Primer autor: Apellido, Nombre
  if (bloques[0].includes(",")) {
    const [apellido, nombres] = bloques[0].split(",").map(x => x.trim());
    autores.push(`${nombres} ${apellido}`);
  }

  // Autores restantes: Nombre Apellido
  for (let i = 1; i < bloques.length; i++) {
    autores.push(bloques[i].replace(/\.$/, "").trim());
  }

  // LIMPIAR AUTORES
  autores = autores
    .map(a => limpiarNombreAutor(a))
    .filter(a => a !== "");

  return autores;
}

// ---------------- PROCESAR ARTÍCULOS ----------------
async function procesarArticulosVisibles() {
  const resultados = document.querySelectorAll(".gs_r.gs_or.gs_scl");
  const articulos = [];

  for (const r of resultados) {
    const cid = r.getAttribute("data-cid");
    const titulo = r.querySelector("h3")?.innerText || "Sin título";

    if (!cid) continue;

    const mla = await obtenerCitaMLAporID(cid);
    const autores = extraerAutoresDesdeMLA(mla);

    if (autores.length > 0) {
      articulos.push({
        titulo,
        autores
      });
    }

    await esperar(400);
  }

  ARTICULOS_CACHE = articulos;
}

// Ejecutar al cargar
procesarArticulosVisibles();

// ---------------- MENSAJES ----------------
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.type === "GET_ARTICULOS") {
    sendResponse({ articulos: ARTICULOS_CACHE });
  }
});
