// CONFIGURACIÓN DE ORIGEN DE DATOS
const URL_GENERAL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=0&single=true&output=csv';
const URL_EQUIPOS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=284173081&single=true&output=csv';
const URL_MATRIZ  = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=790605336&single=true&output=csv';
const URL_CRONICAS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=2071318824&single=true&output=csv';

const WEATHER_API_KEY = 'f31bb7ce57b0669e92e9827acfe293ec';
const CANCHA_COORDS = { lat: -34.6291, lon: -58.5135 };

$(document).ready(function() {
    cargarTabla();
    cargarPartidosYCronicas();
    cargarMatriz();
    iniciarContador();
    actualizarClima();

    $('.centered-title').on('click', function() {
        $(this).toggleClass('active');
        $(this).next('.collapsible-content').slideToggle();
    });

    const audio = document.getElementById('main-audio');
    $('#audio-control').on('click', function() {
        if (audio.paused) { audio.play(); $(this).find('.icon').text('⏸️'); } 
        else { audio.pause(); $(this).find('.icon').text('▶️'); }
    });

    $('.close-modal').click(() => $('.modal').fadeOut());

    // Buscador de Matriz Restaurado
    $('#busqueda-matriz').on('keyup', function() {
        let val = $(this).val().toLowerCase();
        $(".matrix-table tr").filter(function(i) {
            if(i > 0) $(this).toggle($(this).text().toLowerCase().indexOf(val) > -1);
        });
    });
});

function actualizarClima() {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${CANCHA_COORDS.lat}&lon=${CANCHA_COORDS.lon}&appid=${WEATHER_API_KEY}&units=metric&lang=es`;
    fetch(url).then(r => r.json()).then(data => {
        const hoy = new Date();
        const diasHastaMiercoles = (3 - hoy.getDay() + 7) % 7;
        const fM = new Date(hoy); fM.setDate(hoy.getDate() + (diasHastaMiercoles === 0 && hoy.getHours() >= 19 ? 7 : diasHastaMiercoles));
        const targetDate = fM.toISOString().split('T')[0];
        const pr = data.list.find(i => i.dt_txt.includes(targetDate) && i.dt_txt.includes("18:00:00")) || data.list[0];
        const label = fM.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'numeric' }).toUpperCase();
        $('#clima-navbar').html(`<span style="margin-right:8px">⛅</span> ${label} — ${Math.round(pr.main.temp)}°C`);
    });
}

function cargarTabla() {
    Papa.parse(URL_GENERAL, {
        download: true, header: true,
        complete: function(res) {
            let html = '';
            res.data.forEach(row => {
                if(row.Nombre) {
                    html += `<tr><td><strong>${row.Nombre}</strong></td><td>${row.PJ}</td><td>${row.PG}</td><td>${row.PE}</td><td>${row.PP}</td><td><span class="puntos-tag">${row.Pts}</span></td><td>${row.Promiedo}</td></tr>`;
                }
            });
            $('#body-general').html(html);
            $('#tabla-general').DataTable({"order": [[5, "desc"]], "destroy": true});
        }
    });
}

function cargarPartidosYCronicas() {
    Papa.parse(URL_CRONICAS, { download: true, header: true, complete: function(cronRes) {
        const dicCronicas = {}; cronRes.data.forEach(c => { if(c.Fecha) dicCronicas[c.Fecha.trim()] = c.Cronica; });
        Papa.parse(URL_EQUIPOS, { download: true, header: false, complete: function(res) {
            const data = res.data; const contenedor = $('#contenedor-fechas').empty();
            const cPel = {}, cPech = {}, cPozo = {}; let totalPozo = 0;
            
            for (let j = 2; j < data[0].length; j += 4) {
                const f = data[0][j]; if (!f) continue;
                let e1 = "", e2 = "", pzF = 0, r = "", g1 = data[1][j+1], g2 = data[2][j+1];
                let s1 = g1=="1"?"👑 Ganador":g1=="2"?"Perdedor":"🤝 Empate";
                let s2 = g2=="1"?"👑 Ganador":g2=="2"?"Perdedor":"🤝 Empate";
                
                for (let i = 3; i < data.length; i++) {
                    const n = data[i][1], pel = data[i][j], pech = data[i][j+1], pz = data[i][j+2], eq = data[i][j+3];
                    if(n && eq == "1") e1 += `<li>${n} ${pel=='1'?'⚽':''} ${pech=='1'?'🎽':''}</li>`;
                    if(n && eq == "2") e2 += `<li>${n} ${pel=='1'?'⚽':''} ${pech=='1'?'🎽':''}</li>`;
                    if(pel=='1') cPel[n] = (cPel[n]||0)+1;
                    if(pech=='1') cPech[n] = (cPech[n]||0)+1;
                    if(pz) { 
                        let m = parseFloat(pz.toString().replace(/[^0-9]/g, ''));
                        if(m){ totalPozo += m; pzF += m; r = n; cPozo[n] = (cPozo[n]||0)+m; }
                    }
                }
                contenedor.append(`<div class="mini-fecha-card" onclick="abrirPartido('${f}', '${e1}', '${e2}', \`${dicCronicas[f.trim()] || ''}\`, '${s1}', '${s2}', '${pzF}', '${r}')">${f}</div>`);
            }
            actualizarTop3(cPel, '#top-pelota', '⚽'); actualizarTop3(cPech, '#top-pechera', '🎽'); renderizarPozo(cPozo, totalPozo);
        }});
    }});
}

function abrirPartido(fecha, e1, e2, cron, s1, s2, pozo, responsable) {
    let pzH = (pozo && pozo != "0") ? `<div style="margin:20px 0; color:#d4af37; font-weight:bold;">💰 Pozo: $${pozo} (${responsable})</div>` : "";
    $('#detalle-partido-dinamico').html(`
        <div class="flip-card-inner" id="flip-card-match">
            <div class="card-front">
                <h3 style="font-family:'Oswald'; font-size:1.8rem;">📅 ${fecha}</h3>
                <div style="display:flex; justify-content:space-around; width:100%; margin-top:20px;">
                    <div><strong style="color:#d4af37">${s1}</strong><ul class="lista-equipos-modal">${e1}</ul></div>
                    <div><strong style="color:#d4af37">${s2}</strong><ul class="lista-equipos-modal">${e2}</ul></div>
                </div>
                ${pzH}
                <div onclick="girarCarta()" style="cursor:pointer; margin-top:20px;">
                    <img src="peter.png" class="img-autor-btn">
                    <p style="font-size:0.8rem; color:#666;">Crónica de Peter 🔄</p>
                </div>
            </div>
            <div class="card-back" onclick="girarCarta()">
                <div style="font-family:'Oswald'; color:#00355E; margin-bottom:20px; border-bottom:2px solid #d4af37; padding-bottom:10px;">CRÓNICA OFICIAL</div>
                <div class="text-format-mini">${cron || "Sin comentarios..."}</div>
            </div>
        </div>`);
    $('#modal-partido').fadeIn().css('display', 'flex');
}

function girarCarta() { $('#flip-card-match').toggleClass('flipped'); }

function cargarMatriz() {
    Papa.parse(URL_MATRIZ, { download: true, complete: function(res) {
        let h = '<div class="table-responsive"><table class="matrix-table">';
        res.data.forEach((row, i) => {
            h += '<tr>';
            row.forEach((cell, j) => {
                let s = ""; let v = parseInt(cell);
                if(i>0 && j>0 && !isNaN(v) && v>0) { s = `style="background:rgba(0,53,94,${Math.min(v/6, 0.9)}); color:white;"`; }
                h += `<td ${s}>${cell||''}</td>`;
            });
            h += '</tr>';
        });
        $('#heatmap-container').html(h + '</table></div>');
    }});
}

function actualizarTop3(dict, selector, icon) {
    const sorted = Object.entries(dict).sort((a,b)=>b[1]-a[1]).slice(0,3);
    const medals = ['🥇', '🥈', '🥉'];
    let html = '';
    sorted.forEach((item, i) => html += `<div class="top-item"><span>${medals[i]} ${item[0]}</span> <span>${item[1]} ${icon}</span></div>`);
    $(selector).html(html);
}

function renderizarPozo(conteoPozo, total) {
    let h = '';
    Object.entries(conteoPozo).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=> h += `<div class="top-item"><span>👤 ${k}</span> <span>$${v}</span></div>`);
    h += `<div class="top-item" style="border-top:2px solid #d4af37; margin-top:10px;"><strong>Total</strong> <strong>$${total}</strong></div>`;
    $('#top-pozo').html(h);
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