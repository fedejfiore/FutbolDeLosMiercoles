// URLs de tus Google Sheets publicadas como CSV
const URL_GENERAL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=0&single=true&output=csv';
const URL_EQUIPOS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=284173081&single=true&output=csv';
const URL_MATRIZ  = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=790605336&single=true&output=csv';

$(document).ready(function() {
    cargarTabla();
    cargarEquipos();
    cargarMatriz();
    contador();
});

// 1. PROCESAR TABLA GENERAL
function cargarTabla() {
    Papa.parse(URL_GENERAL, {
        download: true,
        header: true,
        complete: function(res) {
            let html = '';
            res.data.forEach(row => {
                if(row.Nombre) {
                    html += `<tr>
                        <td><strong>${row.Nombre}</strong></td>
                        <td>${row.PJ}</td>
                        <td><span class="puntos-tag">${row.Pts}</span></td>
                        <td>${row.Promiedo || row.Promedio || '-'}</td>
                    </tr>`;
                }
            });
            $('#body-general').html(html);
            $('#tabla-general').DataTable({
                "language": { "url": "//cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json" },
                "order": [[2, "desc"]],
                "pageLength": 10,
                "destroy": true
            });
        }
    });
}

// 2. PROCESAR EQUIPOS POR FECHA (TARJETAS)
function cargarEquipos() {
    Papa.parse(URL_EQUIPOS, {
        download: true,
        header: false,
        complete: function(res) {
            const data = res.data;
            const contenedor = $('#contenedor-fechas');
            contenedor.empty();

            // En tu sheet, las fechas están en la fila 0, columnas 2, 5, 8, etc.
            const headers = data[0];
            for (let j = 2; j < headers.length; j += 3) {
                const fecha = headers[j];
                if (!fecha || fecha.trim() === "") continue;

                let card = `
                    <div class="fecha-card">
                        <div class="fecha-header">📅 Miércoles ${fecha}</div>
                        <div class="equipos-flex">
                            <div class="equipo-col"><h5>Equipo 1</h5><ul id="e1-${j}"></ul></div>
                            <div class="equipo-col"><h5>Equipo 2</h5><ul id="e2-${j}"></ul></div>
                        </div>
                    </div>`;
                contenedor.append(card);

                for (let i = 2; i < data.length; i++) {
                    const nombre = data[i][1];
                    const pel = data[i][j] === "1" ? "⚽" : "";
                    const pech = data[i][j + 1] === "1" ? "🎽" : "";
                    const equipo = data[i][j + 2];

                    if (nombre && equipo) {
                        $(`#e${equipo}-${j}`).append(`<li>${nombre} ${pel}${pech}</li>`);
                    }
                }
            }
        }
    });
}

// 3. PROCESAR MATRIZ DE CALOR
function cargarMatriz() {
    Papa.parse(URL_MATRIZ, {
        download: true,
        header: false,
        complete: function(res) {
            let html = '<div class="table-responsive"><table class="matrix-table">';
            res.data.forEach((row, i) => {
                html += '<tr>';
                row.forEach((cell, j) => {
                    let colorStyle = "";
                    // Si es un número y no es cabecera, aplicamos intensidad de verde
                    if(i > 0 && j > 0 && !isNaN(cell) && cell !== "") {
                        let intensidad = Math.min(cell / 5, 1); 
                        colorStyle = `style="background: rgba(0, 208, 132, ${intensidad}); color: ${intensidad > 0.5 ? 'white' : 'black'}"`;
                    }
                    html += `<td ${colorStyle} class="${i === 0 || j === 0 ? 'm-header' : ''}">${cell || ''}</td>`;
                });
                html += '</tr>';
            });
            $('#heatmap-container').html(html + '</table></div>');
        }
    });
}

// 4. CONTADOR MUNDIALISTA
function contador() {
    const meta = new Date("June 11, 2026 16:00:00").getTime();
    setInterval(() => {
        const ahora = new Date().getTime();
        const diff = meta - ahora;
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        $('#countdown').html(`${d}d ${h}h`);
    }, 1000);
}