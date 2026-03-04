const URL_GENERAL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=0&single=true&output=csv';
const URL_EQUIPOS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=284173081&single=true&output=csv';
const URL_MATRIZ  = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=790605336&single=true&output=csv';
const URL_CRONICAS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=2071318824&single=true&output=csv';

let dataGlobalJugadores = [];

$(document).ready(function() {
    cargarTabla();
    cargarPartidosYCronicas();
    cargarMatriz(); 
    iniciarContador(); 
    
    $('.close-modal').click(() => $('#modal-partido, #modal-jugador').fadeOut());
});

// 1. CONTADOR MUNDIALISTA (Corregido)
function iniciarContador() {
    const metaMundial = new Date("June 11, 2026 16:00:00").getTime();
    
    function updateTimer() {
        const ahora = new Date().getTime();
        const diff = metaMundial - ahora;

        if (diff <= 0) {
            $('#countdown').html("¡EMPEZÓ EL MUNDIAL!");
            return;
        }

        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        $('#countdown').html(`${d}d ${h}h`);
    }

    updateTimer();
    setInterval(updateTimer, 60000); 
}

// 2. MAPA DE CALOR (Fix: PapaParse sin cabecera)
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
                    let val = parseInt(cell);
                    if(i > 0 && j > 0 && !isNaN(val) && val > 0) {
                        let intensity = Math.min(val / 5, 1); 
                        colorStyle = `style="background: rgba(39, 174, 96, ${intensity}); color: ${intensity > 0.5 ? 'white' : 'black'}"`;
                    }
                    html += `<td ${colorStyle} class="${i === 0 || j === 0 ? 'm-header' : ''}">${cell || ''}</td>`;
                });
                html += '</tr>';
            });
            $('#heatmap-container').html(html + '</table></div>');
        }
    });
}

// 3. LOGÍSTICA Y PARTIDOS
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
                    const conteoPelota = {};
                    const conteoPechera = {};

                    const headers = data[0];
                    for (let j = 2; j < headers.length; j += 3) {
                        const fecha = headers[j];
                        if (!fecha || fecha.trim() === "") continue;

                        let listaE1 = ""; let listaE2 = "";
                        for (let i = 2; i < data.length; i++) {
                            const n = data[i][1]; 
                            const pel = data[i][j]; 
                            const pech = data[i][j+1]; 
                            const eq = data[i][j+2];
                            
                            if(n && eq) {
                                let icons = `${pel=='1'?'⚽':''} ${pech=='1'?'🎽':''}`;
                                if(eq == "1") listaE1 += `<li>${n} ${icons}</li>`;
                                if(eq == "2") listaE2 += `<li>${n} ${icons}</li>`;
                                if(pel=='1') conteoPelota[n] = (conteoPelota[n] || 0) + 1;
                                if(pech=='1') conteoPechera[n] = (conteoPechera[n] || 0) + 1;
                            }
                        }

                        let miniCard = `<div class="mini-fecha-card" onclick="abrirPartido('${fecha}', '${listaE1}', '${listaE2}', \`${dicCronicas[fecha.trim()] || ''}\`)">
                            ${fecha}
                        </div>`;
                        contenedor.append(miniCard);
                    }
                    mostrarTop3(conteoPelota, '#top-pelota', '⚽');
                    mostrarTop3(conteoPechera, '#top-pechera', '🎽');
                }
            });
        }
    });
}

function mostrarTop3(dict, selector, icon) {
    const sorted = Object.entries(dict).sort((a,b) => b[1] - a[1]).slice(0, 3);
    const medals = ['🥇', '🥈', '🥉'];
    let html = '';
    sorted.forEach((item, i) => {
        html += `<div class="top-item"><span>${medals[i]} ${item[0]}</span> <span>${item[1]} ${icon}</span></div>`;
    });
    $(selector).html(html);
}

function abrirPartido(fecha, e1, e2, cron) {
    let content = `
        <div class="flip-card-inner" onclick="this.classList.toggle('flipped')">
            <div class="card-front">
                <h3 style="color:#1a3c1a; margin-bottom:15px;">📅 ${fecha}</h3>
                <div style="display:flex; justify-content:space-between; text-align:left;">
                    <div style="width:48%"><strong>E1</strong><ul style="padding:0; list-style:none; font-size:0.8rem;">${e1}</ul></div>
                    <div style="width:48%"><strong>E2</strong><ul style="padding:0; list-style:none; font-size:0.8rem;">${e2}</ul></div>
                </div>
                <p style="margin-top:15px; font-size:0.7rem; color:gray;">🔄 Toca para Crónica</p>
            </div>
            <div class="card-back">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px; border-bottom:1px solid #ddd; padding-bottom:5px;">
                    <img src="peter.png" style="width:40px; height:40px; border-radius:50%; border:2px solid #d4af37;" onerror="this.src='https://via.placeholder.com/40'">
                    <strong style="font-size:0.9rem">Crónicas de Peter</strong>
                </div>
                <div class="text-format-mini" style="font-size:0.8rem; text-align:left; max-height:280px; overflow-y:auto;">${cron || "Peter no emitio opinion al respecto.."}</div>
            </div>
        </div>
    `;
    $('#detalle-partido-dinamico').html(content);
    $('#modal-partido').fadeIn();
}

function cargarTabla() {
    Papa.parse(URL_GENERAL, {
        download: true, header: true,
        complete: function(res) {
            dataGlobalJugadores = res.data;
            let html = '';
            res.data.forEach(row => {
                if(row.Nombre) {
                    html += `<tr onclick="verJugador('${row.Nombre}')">
                        <td><strong>${row.Nombre}</strong></td>
                        <td>${row.PJ}</td>
                        <td><span class="puntos-tag">${row.Pts}</span></td>
                        <td>${row.Promiedo || '0'}</td>
                    </tr>`;
                }
            });
            $('#body-general').html(html);
            $('#tabla-general').DataTable({"language": {"url": "//cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json"}, "order": [[2, "desc"]], "destroy": true});
        }
    });
}

function verJugador(nombre) {
    const j = dataGlobalJugadores.find(item => item.Nombre === nombre);
    if(!j) return;
    let html = `<h2 style="font-family:'Oswald'">${j.Nombre}</h2>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:15px;">
            <div style="background:#f4f4f4; padding:10px; border-radius:10px;"><strong>PJ</strong><br>${j.PJ}</div>
            <div style="background:#f4f4f4; padding:10px; border-radius:10px;"><strong>PTS</strong><br>${j.Pts}</div>
        </div>
        <p style="margin-top:20px; color:#2d5a27; font-weight:bold; font-size:1.3rem;">Promedio: ${j.Promiedo}</p>`;
    $('#detalle-jugador').html(html);
    $('#modal-jugador').fadeIn();
}

function cerrarModalPartidos() { $('#modal-partido').fadeOut(); }
function cerrarModalJugador() { $('#modal-jugador').fadeOut(); }