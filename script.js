const SHEET_ID = '1-GEuBRojH8GvcLf1FALQjRi0SVhtop2lZXoY29Ma7u0';
const GID_GENERAL = '1792945781'; 
const GID_EQUIPOS = '1517859332'; 
const GID_MATRIZ  = '1060938361'; 

const URL_GENERAL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/pub?gid=${GID_GENERAL}&output=csv`;
const URL_EQUIPOS = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/pub?gid=${GID_EQUIPOS}&output=csv`;
const URL_MATRIZ  = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/pub?gid=${GID_MATRIZ}&output=csv`;

$(document).ready(function() {
    cargarTabla();
    cargarEquipos();
    cargarMatriz();
    contador();
});

function cargarTabla() {
    Papa.parse(URL_GENERAL, {
        download: true, header: true,
        complete: function(res) {
            let html = '';
            res.data.forEach(row => {
                if(row.Nombre) {
                    html += `<tr><td>${row.Nombre}</td><td>${row.PJ}</td><td><span class="puntos-tag">${row.Pts}</span></td><td>${row.Promiedo || '-'}</td></tr>`;
                }
            });
            $('#body-general').html(html);
            $('#tabla-general').DataTable({ "order": [[2, "desc"]], "pageLength": 5 });
        }
    });
}

function cargarEquipos() {
    Papa.parse(URL_EQUIPOS, {
        download: true, header: false,
        complete: function(res) {
            const data = res.data;
            const contenedor = $('#contenedor-fechas');
            // Columnas de fechas en tu Sheet: 2, 5, 8, 11...
            for (let j = 2; j < data[0].length; j += 3) {
                const fecha = data[0][j];
                if(!fecha) continue;

                let card = `<div class="fecha-card">
                    <div style="text-align:center; font-weight:bold; color:#003366; margin-bottom:10px;">${fecha}</div>
                    <div class="equipos-flex">
                        <div><strong>E1</strong><ul id="e1-${j}" style="list-style:none; padding:0; font-size:0.85rem;"></ul></div>
                        <div><strong>E2</strong><ul id="e2-${j}" style="list-style:none; padding:0; font-size:0.85rem;"></ul></div>
                    </div>
                </div>`;
                contenedor.append(card);

                for (let i = 2; i < data.length; i++) {
                    const nombre = data[i][1];
                    const equipo = data[i][j+2];
                    const pel = data[i][j] == "1" ? "⚽" : "";
                    const pech = data[i][j+1] == "1" ? "🎽" : "";
                    if(nombre && equipo) {
                        $(`#e${equipo}-${j}`).append(`<li>${nombre} ${pel}${pech}</li>`);
                    }
                }
            }
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
                    if(i>0 && j>0 && cell > 0) color = `style="background: rgba(0,208,132,${cell/5})"`;
                    html += `<td ${color} class="${i==0||j==0?'m-header':''}">${cell||''}</td>`;
                });
                html += '</tr>';
            });
            $('#heatmap-container').html(html + '</table></div>');
        }
    });
}

function contador() {
    const meta = new Date("June 11, 2026").getTime();
    setInterval(() => {
        const diff = meta - new Date().getTime();
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        $('#countdown').html(`${d}d ${h}h`);
    }, 1000);
}