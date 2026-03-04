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

                    const headers = data[0];
                    for (let j = 2; j < headers.length; j += 3) {
                        const fecha = headers[j];
                        if (!fecha) continue;

                        const textoCronica = dicCronicas[fecha.trim()];
                        const botonCronica = textoCronica ? 
                            `<button class="btn-cronica" onclick="verCronica('${fecha}', \`${textoCronica}\`)">📖 Crónica de Peter</button>` : '';

                        let card = `
                            <div class="fecha-card">
                                <div style="text-align:center; font-family:'Oswald'; color:var(--grass); margin-bottom:15px;">📅 ${fecha}</div>
                                <div class="equipos-flex">
                                    <div class="equipo-col"><h5>Equipo 1</h5><ul id="e1-${j}"></ul></div>
                                    <div class="equipo-col"><h5>Equipo 2</h5><ul id="e2-${j}"></ul></div>
                                </div>
                                ${botonCronica}
                            </div>`;
                        contenedor.append(card);

                        for (let i = 2; i < data.length; i++) {
                            const nombre = data[i][1];
                            const pel = data[i][j] === "1" ? "⚽" : "";
                            const pech = data[i][j + 1] === "1" ? "🎽" : "";
                            const equipo = data[i][j + 2];
                            if (nombre && equipo) {
                                $(`#e${equipo}-${j}`).append(`<li style="list-style:none; font-size:0.9rem; margin-bottom:5px;">${nombre} ${pel}${pech}</li>`);
                            }
                        }
                    }
                }
            });
        }
    });
}

function verCronica(fecha, texto) {
    $('#fecha-cronica').text('Partido del ' + fecha);
    $('#texto-cronica-full').text(texto);
    $('#modal-cronica').fadeIn();
}

function cargarTabla() {
    Papa.parse(URL_GENERAL, {
        download: true, header: true,
        complete: function(res) {
            let html = '';
            res.data.forEach(row => {
                if(row.Nombre) {
                    // Nota: 'Promiedo' es como figura en tu CSV actual
                    const valorPromedio = row.Promiedo || row.Promedio || '0';
                    html += `<tr>
                                <td><strong>${row.Nombre}</strong></td>
                                <td>${row.PJ}</td>
                                <td><span style="background:var(--gold); color:white; padding:3px 8px; border-radius:5px; font-weight:bold;">${row.Pts}</span></td>
                                <td>${valorPromedio}</td>
                             </tr>`;
                }
            });
            $('#body-general').html(html);

            // FIX: Ordenamiento numérico para la columna de promedio
            $('#tabla-general').DataTable({
                "language": { "url": "//cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json" },
                "order": [[2, "desc"]],
                "columnDefs": [
                    {
                        "targets": 3, // Columna de Promedio
                        "type": "num",
                        "render": function (data, type, row) {
                            if (type === 'sort' || type === 'type') {
                                // Limpia el string y cambia coma por punto para que JS lo entienda como número
                                return parseFloat(data.toString().replace(',', '.').replace('"', '')) || 0;
                            }
                            return data;
                        }
                    }
                ]
            });
        }
    });
}

function cargarMatriz() {
    Papa.parse(URL_MATRIZ, {
        download: true, header: false,
        complete: function(res) {
            let html = '<div class="table-responsive"><table class="matrix-table">';
            res.data.forEach((row, i) => {
                html += '<tr>';
                row.forEach((cell, j) => {
                    let color = "";
                    if(i>0 && j>0 && cell > 0) color = `style="background: rgba(39, 174, 96, ${cell/5}); color: ${cell/5 > 0.5 ? 'white' : 'black'}"`;
                    html += `<td ${color} class="${i==0||j==0?'m-header':''}">${cell||''}</td>`;
                });
                html += '</tr>';
            });
            $('#heatmap-container').html(html + '</table></div>');
        }
    });
}

function iniciarContador() {
    const meta = new Date("June 11, 2026 16:00:00").getTime();
    setInterval(() => {
        const ahora = new Date().getTime();
        const diff = meta - ahora;
        
        if (diff < 0) {
            $('#countdown').html("¡EN MARCHA!");
            return;
        }

        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        $('#countdown').html(`${d}d ${h}h`);
    }, 1000);
}