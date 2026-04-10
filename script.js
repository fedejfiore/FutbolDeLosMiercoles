/**
 * ARQUITECTURA DE SOFTWARE - SISTEMA FÚTBOL MIÉRCOLES
 * Enfoque: Escalabilidad, Bajo Costo y Performance.
 */

// 1. CONFIGURACIÓN DE ORIGEN DE DATOS (Google Sheets)
const URL_GENERAL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=0&single=true&output=csv';
const URL_EQUIPOS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=284173081&single=true&output=csv';
const URL_MATRIZ  = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=790605336&single=true&output=csv';
const URL_CRONICAS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=2071318824&single=true&output=csv';

// 2. CONFIGURACIÓN DE APIs EXTERNAS
const WEATHER_API_KEY = 'f31bb7ce57b0669e92e9827acfe293ec';
const CANCHA_COORDS = { lat: -34.6291, lon: -58.5135 };

let dataGlobalJugadores = [];
let totalPozoGlobal = 0;

$(document).ready(function() {
    // Inicialización de módulos
    cargarTabla();
    cargarPartidosYCronicas();
    cargarMatriz();
    iniciarContador();
    actualizarClima();

    // Lógica de Secciones Colapsables
    $('.centered-title').on('click', function() {
        $(this).toggleClass('active');
        $(this).next('.collapsible-content').slideToggle();
    });

    // Control de Audio (Personalizado)
    const audio = document.getElementById('main-audio');
    const audioBtn = $('#audio-control');
    
    audioBtn.on('click', function() {
        if (audio.paused) {
            audio.play();
            audioBtn.addClass('playing');
            audioBtn.find('.icon').text('⏸️');
            audioBtn.find('.text').text('REPRODUCIENDO...');
        } else {
            audio.pause();
            audioBtn.removeClass('playing');
            audioBtn.find('.icon').text('▶️');
            audioBtn.find('.text').text('EL ASADO');
        }
    });

    audio.onended = () => {
        audioBtn.removeClass('playing');
        audioBtn.find('.icon').text('▶️');
        audioBtn.find('.text').text('EL ASADO');
    };

    // Gestión de Modales
    $('.close-modal').click(() => $('.modal').fadeOut());
});

/**
 * MÓDULO DE CLIMA
 * Filtra el pronóstico para el próximo miércoles a las 19:00hs.
 */
function actualizarClima() {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${CANCHA_COORDS.lat}&lon=${CANCHA_COORDS.lon}&appid=${WEATHER_API_KEY}&units=metric&lang=es`;
    
    fetch(url)
        .then(r => r.json())
        .then(data => {
            const hoy = new Date();
            const diasHastaMiercoles = (3 - hoy.getDay() + 7) % 7;
            const fechaMiercoles = new Date(hoy);
            fechaMiercoles.setDate(hoy.getDate() + (diasHastaMiercoles === 0 && hoy.getHours() >= 19 ? 7 : diasHastaMiercoles));
            const targetDate = fechaMiercoles.toISOString().split('T')[0];

            // Buscar bloque de las 18:00hs (el más cercano a las 19:00hs)
            const pronostico = data.list.find(i => i.dt_txt.includes(targetDate) && i.dt_txt.includes("18:00:00")) || data.list[0];
            
            const iconos = { 'Clear': '☀️', 'Clouds': '☁️', 'Rain': '🌧️', 'Thunderstorm': '⛈️', 'Drizzle': '🌦️' };
            const icon = iconos[pronostico.weather[0].main] || '🌥️';
            
            $('#clima-proximo').html(`
                <span class="clima-icon">${icon}</span>
                <span class="clima-text">Próximo Miércoles 19hs: ${Math.round(pronostico.main.temp)}°C - ${pronostico.weather[0].description.toUpperCase()}</span>
            `);
        })
        .catch(() => $('#clima-proximo').hide());
}

/**
 * MÓDULO DE DATOS: TABLA DE POSICIONES
 */
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
                        <td>${row.PJ || 0}</td>
                        <td>${row.PG || 0}</td>
                        <td>${row.PE || 0}</td>
                        <td>${row.PP || 0}</td>
                        <td><span class="puntos-tag">${row.Pts || 0}</span></td>
                        <td>${row.Promiedo || '0'}</td>
                    </tr>`;
                }
            });
            $('#body-general').html(html);
            $('#tabla-general').DataTable({
                "language": {"url": "//cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json"}, 
                "order": [[5, "desc"]], "destroy": true, "responsive": true
            });
        }
    });
}

/**
 * MÓDULO DE DATOS: HISTORIAL Y CRÓNICAS
 */
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
                    const conteoPelota = {}, conteoPechera = {}, conteoPozo = {};
                    totalPozoGlobal = 0; 

                    const headers = data[0];
                    for (let j = 2; j < headers.length; j += 4) {
                        const fecha = headers[j];
                        if (!fecha) continue;

                        const valGanador = data[1][j + 1]; 
                        let s1 = "🤝 Empate", s2 = "🤝 Empate";
                        if (valGanador === "1") { s1 = "👑 Ganador"; s2 = "Perdedor"; }
                        else if (valGanador === "2") { s1 = "Perdedor"; s2 = "👑 Ganador"; }

                        let e1 = "", e2 = "", pozoPartido = 0, responsable = "";

                        for (let i = 3; i < data.length; i++) {
                            const n = data[i][1], pel = data[i][j], pech = data[i][j+1], pozoVal = data[i][j+2], eq = data[i][j+3];
                            if(n && eq == "1") e1 += `<li>${n} ${pel=='1'?'⚽':''} ${pech=='1'?'🎽':''}</li>`;
                            if(n && eq == "2") e2 += `<li>${n} ${pel=='1'?'⚽':''} ${pech=='1'?'🎽':''}</li>`;
                            if(pel=='1') conteoPelota[n] = (conteoPelota[n] || 0) + 1;
                            if(pech=='1') conteoPechera[n] = (conteoPechera[n] || 0) + 1;
                            
                            if(pozoVal && pozoVal.toString().trim() !== "") {
                                let monto = parseFloat(pozoVal.toString().replace(/[^0-9]/g, ''));
                                if(!isNaN(monto) && monto > 0) {
                                    pozoPartido += monto; responsable = n;
                                    conteoPozo[n] = (conteoPozo[n] || 0) + monto;
                                }
                            }
                        }
                        totalPozoGlobal += pozoPartido;
                        contenedor.append(`<div class="mini-fecha-card" onclick="abrirPartido('${fecha}', '${e1}', '${e2}', \`${dicCronicas[fecha.trim()] || ''}\`, '${s1}', '${s2}', '${pozoPartido}', '${responsable}')">${fecha}</div>`);
                    }
                    actualizarTop3(conteoPelota, '#top-pelota', '⚽');
                    actualizarTop3(conteoPechera, '#top-pechera', '🎽');
                    renderizarPozo(conteoPozo);
                }
            });
        }
    });
}

/**
 * MÓDULO DE DATOS: MAPA DE CALOR (MATRIZ)
 */
function cargarMatriz() {
    Papa.parse(URL_MATRIZ, { 
        download: true, header: false, 
        complete: function(res) { 
            let html = '<div class="table-responsive"><table class="matrix-table">'; 
            res.data.forEach((row, i) => { 
                html += '<tr>'; 
                row.forEach((cell, j) => { 
                    let colorStyle = ""; 
                    let val = parseInt(cell); 
                    if(i > 0 && j > 0 && !isNaN(val) && val > 0) { 
                        let intensity = Math.min(val / 5, 1); 
                        colorStyle = `style="background: rgba(39, 174, 96, ${intensity}); color: white;"`; 
                    } 
                    html += `<td ${colorStyle} class="${i === 0 || j === 0 ? 'sticky-header' : ''}">${cell || ''}</td>`; 
                }); 
                html += '</tr>'; 
            }); 
            $('#heatmap-container').html(html + '</table></div>'); 
        } 
    }); 
}

/**
 * UI: HELPERS Y MODALES
 */
function abrirPartido(fecha, e1, e2, cron, s1, s2, pozo, responsable) {
    let pozoHtml = (pozo && pozo != "0") ? `<div style="margin-top:15px; border-top:1px solid #eee; padding-top:10px; color:#d4af37;"><strong>💰 Pozo:</strong> $${pozo} (${responsable})</div>` : "";
    $('#detalle-partido-dinamico').html(`
        <div class="flip-card-inner" id="flip-card-match">
            <div class="card-front">
                <h3 style="font-family:'Oswald'">📅 ${fecha}</h3>
                <div style="display:flex; justify-content:space-between;">
                    <div style="width:48%"><strong style="color:#d4af37">${s1}</strong><ul class="lista-equipos-modal">${e1}</ul></div>
                    <div style="width:48%"><strong style="color:#d4af37">${s2}</strong><ul class="lista-equipos-modal">${e2}</ul></div>
                </div>
                ${pozoHtml}
                <div class="footer-card-click" onclick="girarCarta()">
                    <img src="peter.png" class="img-autor-btn" onerror="this.src='https://via.placeholder.com/50'">
                    <p style="font-size:0.7rem; color:gray;">Crónica de Peter 🔄</p>
                </div>
            </div>
            <div class="card-back" onclick="girarCarta()">
                <div class="header-cronica"><strong>CRÓNICAS DE PETER</strong></div>
                <div class="text-format-mini">${cron || "Peter no emitió comentarios..."}</div>
                <p class="hint-back">🔄 Toca para volver</p>
            </div>
        </div>`);
    $('#modal-partido').fadeIn().css('display', 'flex');
}

function verJugador(nombre) {
    const j = dataGlobalJugadores.find(item => item.Nombre === nombre);
    if(!j) return;
    $('#detalle-jugador').html(`
        <h2 style="font-family:'Oswald'">${j.Nombre}</h2>
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-top:15px;">
            <div class="stat-box"><strong>PJ</strong><br>${j.PJ || 0}</div>
            <div class="stat-box"><strong>PG</strong><br>${j.PG || 0}</div>
            <div class="stat-box"><strong>Pts</strong><br>${j.Pts || 0}</div>
        </div>
        <p style="margin-top:20px; color:#2d5a27; font-weight:bold; font-size:1.3rem;">Promedio: ${j.Promiedo || '0'}</p>`);
    $('#modal-jugador').fadeIn().css('display', 'flex');
}

function girarCarta() { $('#flip-card-match').toggleClass('flipped'); }

function actualizarTop3(dict, selector, icon) {
    const sorted = Object.entries(dict).sort((a,b) => b[1] - a[1]).slice(0, 3);
    const medals = ['🥇', '🥈', '🥉'];
    let html = '';
    sorted.forEach((item, i) => {
        html += `<div class="top-item"><span>${medals[i]} ${item[0]}</span> <span>${item[1]} ${icon}</span></div>`;
    });
    $(selector).html(html);
}

function renderizarPozo(conteoPozo) {
    let htmlPozo = '';
    for (const jugador in conteoPozo) {
        htmlPozo += `<div class="top-item"><span>👤 ${jugador}</span> <span>$${conteoPozo[jugador]}</span></div>`;
    }
    htmlPozo += `<div class="top-item" style="border-top:1px solid #ddd; margin-top:5px;"><strong>Total</strong> <strong>$${totalPozoGlobal}</strong></div>`;
    $('#top-pozo').html(htmlPozo);
}

function iniciarContador() {
    const metaMundial = new Date("June 11, 2026 16:00:00").getTime();
    function updateTimer() {
        const ahora = new Date().getTime();
        const diff = metaMundial - ahora;
        if (diff <= 0) { $('#countdown').html("¡MUNDIAL EN CURSO!"); return; }
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        $('#countdown').html(`${d}<small>d</small> ${h}<small>h</small>`);
    }
    updateTimer();
    setInterval(updateTimer, 60000);
}