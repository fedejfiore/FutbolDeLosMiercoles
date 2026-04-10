$(document).ready(function() {
    cargarTabla();
    cargarHistorialCompleto();
    actualizarClima();
    iniciarContador();

    // Lógica de colapsables mejorada
    $('.centered-title').click(function() {
        $(this).toggleClass('active').next('.collapsible-content').slideToggle();
    });
});

function cargarTabla() {
    Papa.parse(URL_GENERAL, {
        download: true, header: true,
        complete: function(res) {
            let html = '';
            res.data.forEach(row => {
                if(row.Nombre) {
                    // Limpiamos el promedio para asegurar que sea numérico
                    let prom = parseFloat(row.Promiedo.replace(',', '.')) || 0;
                    html += `<tr>
                        <td><strong>${row.Nombre}</strong></td>
                        <td>${row.PJ}</td><td>${row.PG}</td><td>${row.PE}</td><td>${row.PP}</td>
                        <td><span class="puntos-tag">${row.Pts}</span></td>
                        <td data-order="${prom}">${row.Promiedo}</td>
                    </tr>`;
                }
            });
            $('#body-general').html(html);
            $('#tabla-general').DataTable({
                "destroy": true,
                "order": [[6, "desc"]], // Ordenar por promedio por defecto
                "columnDefs": [ { "type": "num", "targets": 6 } ], // Forzar tipo numérico en promedio
                "language": {"url": "//cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json"}
            });
        }
    });
}

function cargarHistorialCompleto() {
    // Restauramos la carga de CRONICAS y EQUIPOS
    Papa.parse(URL_CRONICAS, {
        download: true, header: true,
        complete: function(cronRes) {
            const dicCronicas = {};
            cronRes.data.forEach(c => { if(c.Fecha) dicCronicas[c.Fecha.trim()] = c.Cronica; });

            Papa.parse(URL_EQUIPOS, {
                download: true, header: false,
                complete: function(res) {
                    const data = res.data;
                    const contenedor = $('#contenedor-fechas').empty();
                    const cPelota = {}, cPechera = {}, cPozo = {};
                    let totalPozo = 0;

                    const headers = data[0];
                    for (let j = 2; j < headers.length; j += 4) {
                        const fecha = headers[j];
                        if (!fecha) continue;
                        
                        let pozoFecha = 0;
                        for (let i = 3; i < data.length; i++) {
                            const n = data[i][1], pel = data[i][j], pech = data[i][j+1], pozo = data[i][j+2];
                            if(pel == '1') cPelota[n] = (cPelota[n] || 0) + 1;
                            if(pech == '1') cPechera[n] = (cPechera[n] || 0) + 1;
                            if(pozo) { 
                                let m = parseFloat(pozo.replace(/[^0-9]/g, ''));
                                if(m) { pozoFecha += m; cPozo[n] = (cPozo[n] || 0) + m; }
                            }
                        }
                        totalPozo += pozoFecha;
                        contenedor.append(`<div class="mini-fecha-card" onclick="abrirPartido('${fecha}')">${fecha}</div>`);
                    }
                    // Actualizar Tops Horizontales
                    mostrarTop3(cPelota, '#top-pelota', '⚽');
                    mostrarTop3(cPechera, '#top-pechera', '🎽');
                    renderizarPozo(cPozo, totalPozo);
                }
            });
        }
    });
    cargarMatriz(); // Restaurar Mapa de Calor
}

function cargarMatriz() {
    Papa.parse(URL_MATRIZ, { 
        download: true, 
        complete: function(res) {
            let html = '<div class="table-responsive"><table class="matrix-table">';
            res.data.forEach((row, i) => {
                html += '<tr>';
                row.forEach((cell, j) => {
                    let color = (i>0 && j>0 && parseInt(cell)>0) ? `style="background:rgba(39,174,96,${Math.min(cell/5,1)});color:white;"` : "";
                    html += `<td ${color}>${cell || ''}</td>`;
                });
                html += '</tr>';
            });
            $('#heatmap-container').html(html + '</table></div>');
        }
    });
}