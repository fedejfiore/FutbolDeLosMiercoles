// URLs de tus Google Sheets publicadas como CSV
const URL_GENERAL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=0&single=true&output=csv';
const URL_EQUIPOS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=284173081&single=true&output=csv';
const URL_MATRIZ  = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=790605336&single=true&output=csv';
const URL_CRONICAS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=2071318824&single=true&output=csv';

$(document).ready(function() {
    cargarTabla();
    cargarPartidosYCronicas();
    cargarMatriz();
    iniciarContador();

    $('.close-modal').click(() => $('#modal-cronica').fadeOut());
});

// 1. CARGAR PARTIDOS, CRÓNICAS Y CALCULAR TOP 3
function cargarPartidosYCronicas() {
    Papa.parse(URL_CRONICAS, {
        download: true, header: true,
        complete: function(cronRes) {
            const dicCronicas = {};
            cronRes.data.forEach(c => { if(c.Fecha) dicCronicas[c.Fecha.trim()] = c.Cronica; });

            Papa.parse(URL_EQUIPOS, {
                download: true, header: false,
                complete: function(res) {
                    const data = res.data;
                    const contenedor = $('#contenedor-fechas');
                    contenedor.empty();

                    // Diccionarios para el Top 3
                    const conteoPelota = {};
                    const conteoPechera = {};

                    const headers = data[0];
                    // Las fechas están en las columnas 2, 5, 8...
                    for (let j = 2; j < headers.length; j += 3) {
                        const fecha = headers[j];
                        if (!fecha || fecha.trim() === "") continue;

                        const textoCronica = dicCronicas[fecha.trim()] || "Parece que Peter no escribió nada hoy... o se olvidó el cuaderno.";

                        // Generamos la Flip Card (reversible)
                        let card = `
                            <div class="fecha-card" onclick="this.classList.toggle('flipped')">
                                <div class="card-inner">
                                    <div class="card-front">
                                        <div class="fecha-header">📅 ${fecha}</div>
                                        <div class="equipos-flex">
                                            <div class="equipo-col"><h5>Equipo 1</h5><ul id="e1-${j}"></ul></div>
                                            <div class="equipo-col"><h5>Equipo 2</h5><ul id="e2-${j}"></ul></div>
                                        </div>
                                        <div class="hint-flip">🔄 Toca para ver Crónica</div>
                                    </div>
                                    <div class="card-back">
                                        <div class="autor-box">
                                            <img src="peter.jpg" alt="Peter" class="foto-peter-mini">
                                            <div>
                                                <strong>Las Crónicas de Peter</strong>
                                                <small style="display:block">${fecha}</small>
                                            </div>
                                        </div>
                                        <div class="cronica-body text-format-mini">
                                            ${textoCronica}
                                        </div>
                                        <div class="hint-flip">🔄 Toca para volver</div>
                                    </div>
                                </div>
                            </div>`;
                        contenedor.append(card);

                        // Llenamos los equipos y sumamos estadísticas para el Top 3
                        for (let i = 2; i < data.length; i++) {
                            const nombre = data[i][1];
                            const pel = data[i][j];      // 1 si llevó pelota
                            const pech = data[i][j + 1];  // 1 si llevó pechera
                            const equipo = data[i][j + 2]; // Nro de equipo

                            if (nombre && equipo) {
                                let icons = "";
                                if (pel === "1") {
                                    icons += " ⚽";
                                    conteoPelota[nombre] = (conteoPelota[nombre] || 0) + 1;
                                }
                                if (pech === "1") {
                                    icons += " 🎽";
                                    conteoPechera[nombre] = (conteoPechera[nombre] || 0) + 1;
                                }
                                
                                $(`#e${equipo}-${j}`).append(`<li>${nombre}${icons}</li>`);
                            }
                        }
                    }
                    // Renderizamos los Top 3 al terminar el bucle
                    mostrarTop3(conteoPelota, '#top-pelota', '⚽');
                    mostrarTop3(conteoPechera, '#top-pechera', '🎽');
                }
            });
        }
    });
}

function mostrarTop3(dict, selector, icon) {
    const sorted = Object.entries(dict)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
    
    let html = '';
    const medals = ['🥇', '🥈', '🥉'];
    
    sorted.forEach((item, i) => {
        html += `<div class="top-item">
                    <span class="medal">${medals[i]}</span> 
                    <strong>${item[0]}</strong> 
                    <span class="count">${item[1]} ${icon}</span>
                 </div>`;
    });
    $(selector).html(html || '<p>Aún no hay datos</p>');
}

// 2. CARGAR TABLA GENERAL CON FIX DE ORDENAMIENTO
function cargarTabla() {
    Papa.parse(URL_GENERAL, {
        download: true, header: true,
        complete: function(res) {
            let html = '';
            res.data.forEach(row => {
                if(row.Nombre) {
                    html += `<tr>
                        <td><strong>${row.Nombre}</strong></td>
                        <td>${row.PJ}</td>
                        <td><span class="puntos-tag">${row.Pts}</span></td>
                        <td>${row.Promiedo || row.Promedio || '0'}</td>
                    </tr>`;
                }
            });
            $('#body-general').html(html);

            // DataTable con detección de números decimales (coma/punto)
            $('#tabla-general').DataTable({
                "language": { "url": "//cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json" },
                "order": [[2, "desc"]],
                "columnDefs": [{
                    "targets": 3,
                    "type": "num",
                    "render": function (data, type, row) {
                        if (type === 'sort' || type === 'type') {
                            return parseFloat(data.toString().replace(',', '.').replace('"', '')) || 0;
                        }
                        return data;
                    }
                }]
            });
        }
    });
}

// 3. MATRIZ DE CALOR (HEATMAP)
function cargarMatriz() {
    Papa.parse(URL_MATRIZ, {
        download: true, header: false,
        complete: function(res) {
            let html = '<div class="table-responsive"><table class="matrix-table">';
            res.data.forEach((row, i) => {
                html += '<tr>';
                row.forEach((cell, j) => {
                    let color = "";
                    if(i > 0 && j > 0 && !isNaN(cell) && cell > 0) {
                        let alpha = Math.min(cell / 5, 1); 
                        color = `style="background: rgba(39, 174, 96, ${alpha}); color: ${alpha > 0.5 ? 'white' : 'black'}"`;
                    }
                    html += `<td ${color} class="${i === 0 || j === 0 ? 'm-header' : ''}">${cell || ''}</td>`;
                });
                html += '</tr>';
            });
            $('#heatmap-container').html(html + '</table></div>');
        }
    });
}

// 4. CONTADOR MUNDIALISTA ARGENTINA
function iniciarContador() {
    const meta = new Date("June 11, 2026 16:00:00").getTime();
    setInterval(() => {
        const ahora = new Date().getTime();
        const diff = meta - ahora;
        
        if (diff < 0) {
            $('#countdown').text("¡EL MUNDIAL HA COMENZADO!");
            return;
        }

        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        $('#countdown').html(`${d}<small>d</small> ${h}<small>h</small>`);
    }, 1000);
}