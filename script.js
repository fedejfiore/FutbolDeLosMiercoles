const URL_GENERAL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=0&single=true&output=csv';
const URL_EQUIPOS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=284173081&single=true&output=csv';
const URL_MATRIZ  = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=790605336&single=true&output=csv';
const URL_CRONICAS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=2071318824&single=true&output=csv';

let dataGlobalJugadores = [];

$(document).ready(function() {
    cargarTabla();
    cargarPartidosMini();
    cargarMatriz();
    iniciarContador();
});

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
            $('#tabla-general').DataTable({
                "language": { "url": "//cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json" },
                "order": [[2, "desc"]],
                "columnDefs": [{
                    "targets": 3,
                    "type": "num",
                    "render": function (data, type) {
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

function cargarPartidosMini() {
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
                        if (!fecha) continue;

                        let e1 = ""; let e2 = "";
                        for (let i = 2; i < data.length; i++) {
                            const n = data[i][1]; const pel = data[i][j]; const pech = data[i][j+1]; const eq = data[i][j+2];
                            if(n && eq == "1") {
                                e1 += `<li>${n} ${pel=='1'?'⚽':''} ${pech=='1'?'🎽':''}</li>`;
                            }
                            if(n && eq == "2") {
                                e2 += `<li>${n} ${pel=='1'?'⚽':''} ${pech=='1'?'🎽':''}</li>`;
                            }
                            if(pel=='1') conteoPelota[n] = (conteoPelota[n] || 0) + 1;
                            if(pech=='1') conteoPechera[n] = (conteoPechera[n] || 0) + 1;
                        }

                        let miniCard = `<div class="mini-fecha-card" onclick="abrirPartido('${fecha}', '${e1}', '${e2}', \`${dicCronicas[fecha.trim()] || ''}\`)">
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
        <div class="flip-card-inner" id="flip-inner" onclick="this.classList.toggle('flipped')">
            <div class="card-front">
                <h3 style="color:var(--grass-pitch); margin-bottom:20px;">📅 ${fecha}</h3>
                <div style="display:flex; justify-content:space-between; text-align:left;">
                    <div style="width:45%"><strong>Equipo 1</strong><ul style="padding:0; list-style:none; font-size:0.8rem;">${e1}</ul></div>
                    <div style="width:45%"><strong>Equipo 2</strong><ul style="padding:0; list-style:none; font-size:0.8rem;">${e2}</ul></div>
                </div>
                <p style="margin-top:30px; font-size:0.7rem; color:gray;">🔄 Toca para ver Crónica</p>
            </div>
            <div class="card-back">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px;">
                    <img src="peter.jpg" style="width:40px; height:40px; border-radius:50%; border:2px solid var(--gold);">
                    <strong style="color:var(--grass-pitch)">Crónicas de Peter</strong>
                </div>
                <div class="text-format-mini" style="font-size:0.85rem;">${cron || "Sin crónica disponible."}</div>
                <p style="margin-top:20px; font-size:0.7rem; color:gray;">🔄 Toca para volver</p>
            </div>
        </div>
    `;
    $('#detalle-partido-dinamico').html(content);
    $('#modal-partido').fadeIn();
}

function verJugador(nombre) {
    const j = dataGlobalJugadores.find(item => item.Nombre === nombre);
    if(!j) return;
    let html = `<h2 style="font-family:'Oswald'; color:var(--dark-bg);">${j.Nombre}</h2>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:20px;">
            <div class="stat-box"><strong>PJ</strong><br>${j.PJ}</div>
            <div class="stat-box"><strong>PTS</strong><br>${j.Pts}</div>
            <div class="stat-box"><strong>G</strong><br>${j.PG || 0}</div>
            <div class="stat-box"><strong>P</strong><br>${j.PP || 0}</div>
        </div>
        <p style="margin-top:20px; color:var(--grass-pitch); font-weight:bold; font-size:1.2rem;">Promedio: ${j.Promiedo}</p>`;
    $('#detalle-jugador').html(html);
    $('#modal-jugador').fadeIn();
}

function cerrarModalPartidos() { $('#modal-partido').fadeOut(); }
function cerrarModalJugador() { $('#modal-jugador').fadeOut(); }

function iniciarContador() {
    const meta = new Date("June 11, 2026 16:00:00").getTime();
    setInterval(() => {
        const ahora = new Date().getTime();
        const diff = meta - ahora;
        if(diff < 0) { $('#countdown').text("¡EL MUNDIAL EMPEZÓ!"); return; }
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        $('#countdown').html(`${d}<small>d</small> ${h}<small>h</small>`);
    }, 1000);
}