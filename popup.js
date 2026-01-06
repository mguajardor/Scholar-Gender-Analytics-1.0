function crearGraficoPorcentaje(porcentaje) {
  const contenedor = document.getElementById("grafico-porcentaje");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  const barraBase = document.createElement("div");
  barraBase.style.width = "100%";
  barraBase.style.height = "18px";
  barraBase.style.background = "#e0e0e0";
  barraBase.style.borderRadius = "10px";
  barraBase.style.margin = "10px 0";

  const barra = document.createElement("div");
  barra.style.height = "100%";
  barra.style.width = porcentaje + "%";
  barra.style.background = "#7b4bb7"; // morado
  barra.style.borderRadius = "10px";
  barra.style.transition = "width 0.5s ease";

  barraBase.appendChild(barra);
  contenedor.appendChild(barraBase);
}

document.addEventListener("DOMContentLoaded", () => {

  // Dibujo inicial (0 %) para evitar parpadeos
  crearGraficoPorcentaje(0);

  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (!tabs || !tabs[0]) return;

    chrome.tabs.sendMessage(
      tabs[0].id,
      { type: "GET_ARTICULOS" },
      response => {

        if (chrome.runtime.lastError || !response || !response.articulos) {
          console.error("No se pudieron obtener los artículos");
          return;
        }

        const articulos = response.articulos;
        const select = document.getElementById("filtro-articulo");


        select.innerHTML = "";

        const optGlobal = document.createElement("option");
        optGlobal.value = "__global__";
        optGlobal.textContent = "Todos los artículos";
        select.appendChild(optGlobal);

        articulos.forEach((a, idx) => {
          const opt = document.createElement("option");
          opt.value = idx;
          opt.textContent = a.titulo;
          select.appendChild(opt);
        });

        function actualizarVista(autores) {

          fetch("http://127.0.0.1:8000/clasificar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ autores })
          })
          .then(res => res.json())
          .then(data => {

            // ---- TEXTO ----
            document.getElementById("total").innerText =
              data.total_autores_validos;

            document.getElementById("porcentaje").innerText =
              data.porcentaje_mujeres + "%";

            // ---- GRÁFICO ----
            crearGraficoPorcentaje(data.porcentaje_mujeres);

            // ---- TABLA ----
            const tbody = document.getElementById("tabla");
            tbody.innerHTML = "";

            data.detalle.forEach(d => {
              const tr = document.createElement("tr");
              tr.innerHTML = `
                <td>${d.nombre}</td>
                <td>${d.genero}</td>
                <td>${Math.round(d.confianza * 100)}%</td>
              `;
              tbody.appendChild(tr);
            });
          })
          .catch(err => {
            console.error("Error llamando al backend:", err);
          });
        }

        const autoresGlobales = articulos.flatMap(a => a.autores);
        actualizarVista(autoresGlobales);

      
        select.addEventListener("change", e => {
          const valor = e.target.value;

          if (valor === "__global__") {
            actualizarVista(autoresGlobales);
          } else {
            const articulo = articulos[parseInt(valor)];
            if (articulo && articulo.autores) {
              actualizarVista(articulo.autores);
            }
          }
        });

      }
    );
  });
});
