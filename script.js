/**
 * ARQUITECTURA DE SOFTWARE - SISTEMA FÚTBOL MIÉRCOLES
 * Versión Final: Restauración de Jerarquía y Lógica de Negocio
 */

const URL_GENERAL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=0&single=true&output=csv';
const URL_EQUIPOS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=284173081&single=true&output=csv';
const URL_MATRIZ  = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=790605336&single=true&output=csv';
const URL_CRONICAS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=2071318824&single=true&output=csv';

const WEATHER_API_KEY = 'f31bb7ce57b0669e92e9827acfe293ec';
const CANCHA_COORDS = { lat: -34.6291, lon: -58.5135 };

let dataGlobalJugadores = [];

$(document).ready(function() {
    // Inicialización de módulos
    cargarTabla();
    cargarHistorialCompleto();
    actualizarClima();
    iniciarContador();

    // Lógica de Colapsables (Mejorada para no perder la card)
    $(document).on('click', '.centered-title', function() {
        $(this).toggleClass('active').next('.collapsible-content').slideToggle();
    });

    // Control de Audio
    const audio = document.getElementById('main-audio');
    $('#audio-control').on('click', function() {
        if (audio.paused) {
            audio.play();
            $(this).addClass('playing').text('⏸️ EL ASADO');
        } else {
            audio.pause();
            $(this).removeClass('playing').text('▶️ EL ASADO');
        }
    });

    // Cierre de Modales
    $('.close-modal').on('click', function() {
        $('.modal').fadeOut();
    });

    // Buscador de Matriz
    $('#busqueda-matriz').on('keyup', function() {
        let val = $(this).val().toLowerCase();
        $(".matrix-table tr").filter(function(i) {
            if(i > 0) $(this).toggle($(this).text().toLowerCase().indexOf(val) > -1);
        });
    });
});

/** --- MÓDULO DATA: TABLA DE POSICIONES --- **/
function cargarTabla() {
    Papa.parse(URL_GENERAL, {
        download: true, header: true,
        complete: function(res) {
            dataGlobalJugadores = res.data;
            let html = '';
            res.data.forEach(row => {
                if(row.Nombre) {
                    let p = parseFloat(row.Promiedo.replace(',', '.')) || 0;
                    html += `<tr onclick="verJugador('${row.Nombre}')">
                        <td><strong>${row.Nombre}</strong></td>
                        <td>${row.PJ || 0}</td><td>${row.PG || 0}</td><td>${row.PE || 0}</td><td>${row.PP || 0}</td>
                        <td><span class="puntos-tag">${row.Pts || 0}</span></td>
                        <td data-order="${p}">${row.Promiedo || '0'}</td>
                    </tr>`;
                }
            });
            $('#body-general').html(html);
            $('#tabla-general').DataTable({
                "destroy": true,
                "order": [[6, "desc"]],
                "columnDefs": [{ "type": "num", "targets": 6 }],
                "language": {"url": "//cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json"}
            });
        }
    });
}

/** --- MÓDULO DATA: HISTORIAL, EQUIPOS Y CRÓNICAS --- **/
function cargarHistorialCompleto() {
    Papa.parse(URL_CRONICAS, { download: true, header: true, complete: function(cronRes) {
        const dicCronicas = {}; 
        cronRes.data.forEach(c => { if(c.Fecha) dicCronicas[c.Fecha.trim()] = c.Cronica; });

        Papa.parse(URL_EQUIPOS, { download: true, header: false, complete: function(res) {
            const data = res.data; 
            const contenedor = $('#contenedor-fechas').empty();
            const cPel = {}, cPech = {}, cPozo = {}; 
            let tPozo = 0;

            const headers = data[0];
            // Saltamos de 4 en 4 columnas (J, J+1, J+2, J+3)
            for (let j = 2; j < headers.length; j += 4) {
                const fecha = headers[j]; 
                if(!fecha) continue;
                
                let e1 = "", e2 = "", pozoFecha = 0, resp = "";
                let s1 = data[1][j+1] == "1" ? "👑 Ganador" : (data[1][j+1] == "0" ? "🤝 Empate" : "Perdedor");
                let s2 = data[2][j+1] == "1" ? "👑 Ganador" : (data[2][j+1] == "0" ? "🤝 Empate" : "Perdedor");

                for (let i = 3; i < data.length; i++) {
                    const n = data[i][1], pel = data[i][j], pech = data[i][j+1], pz = data[i][j+2], eq = data[i][j+3];
                    if(n && eq == "1") e1 += `<li>${n}</li>`;
                    if(n && eq == "2") e2 += `<li>${n}</li>`;
                    if(pel == '1') cPel[n] = (cPel[n]||0)+1;
                    if(pech == '1') cPech[n] = (cPech[n]||0)+1;
                    if(pz) { 
                        let m = parseFloat(pz.toString().replace(/[^0-9]/g, ''));
                        if(m){ tPozo += m; cPozo[n] = (cPozo[n]||0)+m; resp = n; pozoFecha += m; } 
                    }
                }
                const cron = dicCronicas[fecha.trim()] || "Peter no emitió comentarios.";
                contenedor.append(`<div class="mini-fecha-card" onclick="abrirPartido('${fecha}', '${e1}', '${e2}', \`${cron}\`, '${s1}', '${s2}', '${pozoFecha}', '${resp}')">${fecha}</div>`);
            }
            renderTops(cPel, '#top-pelota', '⚽');
            renderTops(cPech, '#top-pechera', '🎽');
            renderPozo(cPozo, tPozo);
        }});
    }});
    cargarMatriz();
}

/** --- UI: MODAL Y FLIP CARD --- **/
function abrirPartido(fecha, e1, e2, cron, s1, s2, pozo, resp) {
    $('#detalle-partido-dinamico').html(`
        <div class="flip-card-inner" id="flip-card-match">
            <div class="card-front">
                <h3>📅 ${fecha}</h3>
                <div class="scoreboard-container">
                    <div class="team-col"><strong>EQUIPO 1</strong><ul class="players-modal">${e1}</ul><small>${s1}</small></div>
                    <div class="team-col"><strong>EQUIPO 2</strong><ul class="players-modal">${e2}</ul><small>${s2}</small></div>
                </div>
                ${pozo > 0 ? `<div class="pozo-resp">💰 Pozo: $${pozo} (${resp})</div>` : ''}
                <div class="peter-trigger" onclick="girarCarta()">
                    <img src="peter.png" class="peter-img-btn">
                    <p>Ver Crónica 🔄</p>
                </div>
            </div>
            <div class="card-back" onclick="girarCarta()">
                <div class="cronica-header">✍️ CRÓNICA DE PETER</div>
                <div class="text-format-mini">${cron}</div>
                <p class="hint-back">🔄 Toca para volver</p>
            </div>
        </div>
    `);
    $('#modal-partido').css('display', 'flex').hide().fadeIn();
}

function girarCarta() { $('#flip-card-match').toggleClass('flipped'); }

/** --- MÓDULO: MAPA DE CALOR --- **/
function cargarMatriz() {
    Papa.parse(URL_MATRIZ, { download: true, complete: function(res) {
        let html = '<div class="matrix-scroll-wrapper"><table class="matrix-table">';
        res.data.forEach((row, i) => {
            html += '<tr>';
            row.forEach((cell, j) => {
                let s = (i>0 && j>0 && parseInt(cell)>0) ? `style="background:rgba(39,174,96,${Math.min(cell/5,1)});color:white;"` : "";
                html += `<td ${s} class="${i===0||j===0?'sticky-header':''}">${cell||''}</td>`;
            });
            html += '</tr>';
        });
        $('#heatmap-container').html(html + '</table></div>');
    }});
}

/** --- UTILIDADES: TOPS, POZO, CLIMA Y CONTADOR --- **/
function renderTops(dict, selector, icon) {
    const sorted = Object.entries(dict).sort((a,b)=>b[1]-a[1]).slice(0,3);
    const medals = ['🥇', '🥈', '🥉'];
    let html = '';
    sorted.forEach((item, i) => {
        html += `<div class="top-item"><span>${medals[i]} ${item[0]}</span> <span>${item[1]} ${icon}</span></div>`;
    });
    $(selector).html(html);
}

function renderPozo(cPozo, tPozo) {
    let h = '';
    Object.entries(cPozo).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=> h += `<div class="top-item"><span>👤 ${k}</span><span>$${v.toLocaleString()}</span></div>`);
    h += `<div class="top-item total-pozo"><strong>TOTAL</strong><strong>$${tPozo.toLocaleString()}</strong></div>`;
    $('#top-pozo').html(h);
}

function actualizarClima() {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${CANCHA_COORDS.lat}&lon=${CANCHA_COORDS.lon}&appid=${WEATHER_API_KEY}&units=metric&lang=es`;
    fetch(url).then(r => r.json()).then(data => {
        const hoy = new Date();
        const diasHastaMiercoles = (3 - hoy.getDay() + 7) % 7;
        const fechaMiercoles = new Date(hoy);
        fechaMiercoles.setDate(hoy.getDate() + (diasHastaMiercoles === 0 && hoy.getHours() >= 19 ? 7 : diasHastaMiercoles));
        
        const f = fechaMiercoles.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'numeric' }).toUpperCase();
        const pronostico = data.list.find(i => i.dt_txt.includes(fechaMiercoles.toISOString().split('T')[0]) && i.dt_txt.includes("18:00:00")) || data.list[0];
        
        $('#clima-fecha').text(f);
        $('.clima-text').text(`${Math.round(pronostico.main.temp)}°C - ${pronostico.weather[0].description.toUpperCase()}`);
        $('.clima-icon').text(pronostico.weather[0].main === 'Clear' ? '☀️' : '☁️');
    });
}

function iniciarContador() {
    const meta = new Date("June 11, 2026 16:00:00").getTime();
    function update() {
        const diff = meta - new Date().getTime();
        const d = Math.floor(diff / (1000*60*60*24));
        const h = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
        $('#countdown').html(`${d}<small>d</small> ${h}<small>h</small>`);
    }
    update(); setInterval(update, 60000);
}

function verJugador(nombre) {
    const j = dataGlobalJugadores.find(item => item.Nombre === nombre);
    if(!j) return;
    $('#detalle-jugador').html(`
        <h2 style="font-family:'Oswald'">${j.Nombre}</h2>
        <div class="stat-box-grid">
            <div class="mini-stat"><strong>PJ</strong><br>${j.PJ}</div>
            <div class="mini-stat"><strong>PG</strong><br>${j.PG}</div>
            <div class="mini-stat"><strong>PTS</strong><br>${j.Pts}</div>
        </div>
        <p class="promedio-destacado">Promedio: ${j.Promiedo}</p>
    `);
    $('#modal-jugador').css('display', 'flex').hide().fadeIn();
}