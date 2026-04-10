/**
 * ARQUITECTURA DE SOFTWARE - SISTEMA FÚTBOL MIÉRCOLES
 * Versión: 3.0 (Full Integration)
 */

const URL_GENERAL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=0&single=true&output=csv';
const URL_EQUIPOS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=284173081&single=true&output=csv';
const URL_MATRIZ  = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=790605336&single=true&output=csv';
const URL_CRONICAS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=2071318824&single=true&output=csv';

const WEATHER_API_KEY = 'f31bb7ce57b0669e92e9827acfe293ec';
const CANCHA_COORDS = { lat: -34.6291, lon: -58.5135 };

let dataGlobalJugadores = [];
let totalPozoGlobal = 0;
let inscriptos = JSON.parse(localStorage.getItem('inscriptos_temp')) || []; // Persistencia local hasta Supabase

$(document).ready(function() {
    // 1. Inicialización de datos e interfaz
    cargarDatosHistorial(); 
    actualizarClima();
    iniciarContador();
    renderizarInscriptos();

    // 2. Lógica de Colapsables
    $('.centered-title').on('click', function() {
        $(this).toggleClass('active').next('.collapsible-content').slideToggle();
    });

    // 3. Sistema de Inscripción y Autocomplete
    $('#input-nombre').on('input', function() {
        const val = $(this).val().toLowerCase();
        const res = $('#autocomplete-results').empty();
        if (val.length < 2) return;

        const sugerencias = dataGlobalJugadores.filter(j => 
            j.Nombre && j.Nombre.toLowerCase().includes(val)
        );

        sugerencias.forEach(j => {
            res.append(`<div class="suggestion" onclick="seleccionarJugador('${j.Nombre}')">${j.Nombre}</div>`);
        });
    });

    $('#btn-confirmar').click(function() {
        const nombre = $('#input-nombre').val().trim();
        if (!nombre) return;

        if (inscriptos.includes(nombre)) {
            alert("Ya estás en la lista. Si no vienes, quítate de la lista.");
        } else {
            inscriptos.push(nombre);
            guardarInscriptos();
            $('#input-nombre').val('');
            $('#autocomplete-results').empty();
        }
    });

    // 4. Controles de UI (Modales y Audio)
    $('.close-modal').click(() => $('.modal').fadeOut());
    
    const audio = document.getElementById('main-audio');
    const audioBtn = $('#audio-control');
    audioBtn.click(() => {
        if (audio.paused) { audio.play(); audioBtn.addClass('playing').find('.icon').text('⏸️'); } 
        else { audio.pause(); audioBtn.removeClass('playing').find('.icon').text('▶️'); }
    });
});

/** --- FUNCIONES DE INSCRIPCIÓN --- **/
function seleccionarJugador(nombre) {
    $('#input-nombre').val(nombre);
    $('#autocomplete-results').empty();
}

function renderizarInscriptos() {
    const lista = $('#lista-anotados').empty();
    $('#count-anotados').text(inscriptos.length);
    inscriptos.forEach((n, i) => {
        lista.append(`<li><span>${n}</span> <button class="btn-remove" onclick="removerJugador(${i})">X</button></li>`);
    });
}

function removerJugador(index) {
    inscriptos.splice(index, 1);
    guardarInscriptos();
}

function guardarInscriptos() {
    localStorage.setItem('inscriptos_temp', JSON.stringify(inscriptos));
    renderizarInscriptos();
}

/** --- CARGA DE DATOS DESDE GOOGLE SHEETS --- **/
function cargarDatosHistorial() {
    // Carga Tabla General
    Papa.parse(URL_GENERAL, {
        download: true, header: true,
        complete: function(res) {
            dataGlobalJugadores = res.data;
            let html = '';
            res.data.forEach(row => {
                if(row.Nombre) {
                    html += `<tr onclick="verJugador('${row.Nombre}')">
                        <td><strong>${row.Nombre}</strong></td>
                        <td>${row.PJ || 0}</td><td>${row.PG || 0}</td><td>${row.PE || 0}</td><td>${row.PP || 0}</td>
                        <td><span class="puntos-tag">${row.Pts || 0}</span></td>
                        <td>${row.Promiedo || '0'}</td>
                    </tr>`;
                }
            });
            $('#body-general').html(html);
            $('#tabla-general').DataTable({ "language": {"url": "//cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json"}, "order": [[5, "desc"]], "destroy": true, "responsive": true });
        }
    });

    // Carga Partidos, Crónicas y Tops
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
                            if(pozoVal) {
                                let monto = parseFloat(pozoVal.toString().replace(/[^0-9]/g, ''));
                                if(!isNaN(monto)) { pozoPartido += monto; responsable = n; conteoPozo[n] = (conteoPozo[n] || 0) + monto; }
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

    cargarMatriz();
}

/** --- FUNCIONES DE CLIMA Y UI --- **/
function actualizarClima() {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${CANCHA_COORDS.lat}&lon=${CANCHA_COORDS.lon}&appid=${WEATHER_API_KEY}&units=metric&lang=es`;
    fetch(url).then(r => r.json()).then(data => {
        const hoy = new Date();
        const diasHastaMiercoles = (3 - hoy.getDay() + 7) % 7;
        const fechaMiercoles = new Date(hoy);
        fechaMiercoles.setDate(hoy.getDate() + (diasHastaMiercoles === 0 && hoy.getHours() >= 19 ? 7 : diasHastaMiercoles));
        
        const targetDate = fechaMiercoles.toISOString().split('T')[0];
        const pronostico = data.list.find(i => i.dt_txt.includes(targetDate) && i.dt_txt.includes("18:00:00")) || data.list[0];
        
        $('#clima-fecha').text(fechaMiercoles.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'numeric' }).toUpperCase());
        $('#clima-proximo .clima-text').text(`${Math.round(pronostico.main.temp)}°C - ${pronostico.weather[0].description.toUpperCase()}`);
        $('#clima-proximo .clima-icon').text(pronostico.weather[0].main === 'Clear' ? '☀️' : '☁️');
    });
}

function iniciarContador() {
    const meta = new Date("June 11, 2026 16:00:00").getTime();
    function update() {
        const diff = meta - new Date().getTime();
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        $('#countdown').html(`${d}<small>d</small> ${h}<small>h</small>`);
    }
    update(); setInterval(update, 60000);
}

function cargarMatriz() {
    Papa.parse(URL_MATRIZ, { download: true, complete: function(res) {
        let html = '<div class="table-responsive"><table class="matrix-table">';
        res.data.forEach((row, i) => {
            html += '<tr>';
            row.forEach((cell, j) => {
                let color = (i>0 && j>0 && parseInt(cell)>0) ? `style="background:rgba(39,174,96,${Math.min(cell/5,1)});color:white;"` : "";
                html += `<td ${color} class="${i===0||j===0?'sticky-header':''}">${cell||''}</td>`;
            });
            html += '</tr>';
        });
        $('#heatmap-container').html(html + '</table></div>');
    }});
}

function abrirPartido(fecha, e1, e2, cron, s1, s2, pozo, responsable) {
    let pozoHtml = pozo > 0 ? `<div style="margin-top:10px; color:var(--gold);">💰 Pozo: $${pozo} (${responsable})</div>` : "";
    $('#detalle-partido-dinamico').html(`
        <div class="flip-card-inner" id="flip-card-match">
            <div class="card-front">
                <h3 style="font-family:'Oswald'">📅 ${fecha}</h3>
                <div style="display:flex; justify-content:space-between; font-size:0.8rem;">
                    <div style="width:48%"><strong style="color:var(--gold)">${s1}</strong><ul class="lista-equipos-modal">${e1}</ul></div>
                    <div style="width:48%"><strong style="color:var(--gold)">${s2}</strong><ul class="lista-equipos-modal">${e2}</ul></div>
                </div>
                ${pozoHtml}
                <div onclick="$('#flip-card-match').toggleClass('flipped')" style="cursor:pointer; margin-top:15px; border-top:1px solid #eee; padding-top:10px;">
                    <img src="peter.png" style="width:40px; border-radius:50%; border:2px solid var(--gold);">
                    <p style="font-size:0.6rem; color:gray;">VER CRÓNICA 🔄</p>
                </div>
            </div>
            <div class="card-back" onclick="$('#flip-card-match').toggleClass('flipped')">
                <div style="font-weight:bold; color:var(--grass-pitch); margin-bottom:10px;">CRÓNICA DE PETER</div>
                <div class="text-format-mini">${cron || "Sin comentarios..."}</div>
            </div>
        </div>`);
    $('#modal-partido').fadeIn().css('display', 'flex');
}

function actualizarTop3(dict, selector, icon) {
    const sorted = Object.entries(dict).sort((a,b) => b[1] - a[1]).slice(0, 3);
    const medals = ['🥇', '🥈', '🥉'];
    let html = '';
    sorted.forEach((item, i) => { html += `<div class="top-item"><span>${medals[i]} ${item[0]}</span> <span>${item[1]} ${icon}</span></div>`; });
    $(selector).html(html);
}

function renderizarPozo(conteoPozo) {
    let html = '';
    Object.entries(conteoPozo).forEach(([j, m]) => { html += `<div class="top-item"><span>👤 ${j}</span> <span>$${m}</span></div>`; });
    html += `<div class="top-item" style="border-top:1px solid #ddd; margin-top:5px;"><strong>TOTAL</strong> <strong>$${totalPozoGlobal}</strong></div>`;
    $('#top-pozo').html(html);
}

function verJugador(nombre) {
    const j = dataGlobalJugadores.find(item => item.Nombre === nombre);
    if(!j) return;
    $('#detalle-jugador').html(`
        <h2 style="font-family:'Oswald'">${j.Nombre}</h2>
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-top:15px;">
            <div class="stat-box-pitch" style="padding:10px;"><strong>PJ</strong><br>${j.PJ || 0}</div>
            <div class="stat-box-pitch" style="padding:10px;"><strong>PG</strong><br>${j.PG || 0}</div>
            <div class="stat-box-pitch" style="padding:10px;"><strong>PTS</strong><br>${j.Pts || 0}</div>
        </div>
        <p style="margin-top:20px; color:var(--grass-light); font-weight:bold; font-size:1.3rem;">Promedio: ${j.Promiedo || '0'}</p>`);
    $('#modal-jugador').fadeIn().css('display', 'flex');
}