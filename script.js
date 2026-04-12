const URL_GENERAL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=0&single=true&output=csv';
const URL_EQUIPOS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=284173081&single=true&output=csv';
const URL_MATRIZ  = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=790605336&single=true&output=csv';
const URL_CRONICAS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=2071318824&single=true&output=csv';

const WEATHER_API_KEY = 'f31bb7ce57b0669e92e9827acfe293ec';

let tablaDataTable;

$(document).ready(function() {
    cargarTabla();
    cargarHistorial();
    iniciarContador();
    actualizarClima();

    $('#busqueda-matriz').on('keyup', function() {
        let val = $(this).val().toLowerCase();
        $(".matrix-table tr").filter(function(i) {
            if(i > 0) $(this).toggle($(this).text().toLowerCase().indexOf(val) > -1);
        });
    });

    const audio = document.getElementById('main-audio');
    $('#audio-control').click(function() {
        if (audio.paused) { audio.play(); $(this).find('.icon').text('⏸️'); } 
        else { audio.pause(); $(this).find('.icon').text('▶️'); }
    });
});

function abrirSeccion(id) {
    $(`#${id}`).fadeIn().css('display', 'flex');
    if (id === 'modal-posiciones-full' && tablaDataTable) {
        setTimeout(() => { tablaDataTable.columns.adjust().draw(); }, 200);
    }
}

function cerrarSeccion(id) { $(`#${id}`).fadeOut(); }

function actualizarClima() {
    fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=-34.6291&lon=-58.5135&appid=${WEATHER_API_KEY}&units=metric&lang=es`)
    .then(r => r.json()).then(data => {
        const hoy = new Date();
        const diasH = (3 - hoy.getDay() + 7) % 7;
        const fM = new Date(hoy); fM.setDate(hoy.getDate() + (diasH === 0 && hoy.getHours() >= 19 ? 7 : diasH));
        const pr = data.list.find(i => i.dt_txt.includes(fM.toISOString().split('T')[0])) || data.list[0];
        const label = fM.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' }).toUpperCase();
        const icon = pr.weather[0].main === 'Clear' ? '☀️' : '⛅';
        $('#clima-navbar').html(`<span>${icon}</span> <span>${label} — ${Math.round(pr.main.temp)}°C</span> <span style="font-size:0.7rem; opacity:0.8; margin-left:5px;">(${pr.weather[0].description.toUpperCase()})</span>`);
    });
}

function cargarTabla() {
    Papa.parse(URL_GENERAL, {
        download: true, header: true,
        complete: function(res) {
            let html = '';
            res.data.forEach(row => {
                if(row.Nombre) {
                    let p = parseFloat(row.Promiedo.replace(',', '.')) || 0;
                    html += `<tr><td><strong>${row.Nombre}</strong></td><td>${row.PJ}</td><td>${row.PG}</td><td>${row.PE}</td><td>${row.PP}</td><td><span style="background:var(--afa-azul-noche); color:white; padding:4px 8px; border-radius:4px;">${row.Pts}</span></td><td data-order="${p}">${row.Promiedo}</td></tr>`;
                }
            });
            $('#body-general').html(html);
            tablaDataTable = $('#tabla-general').DataTable({"destroy": true, "order": [[5, "desc"]]});
        }
    });
}

function cargarHistorial() {
    Papa.parse(URL_CRONICAS, { download: true, header: true, complete: function(cronRes) {
        const dicCron = {}; cronRes.data.forEach(c => { if(c.Fecha) dicCron[c.Fecha.trim()] = c.Cronica; });
        Papa.parse(URL_EQUIPOS, { download: true, complete: function(res) {
            const data = res.data; const cPel = {}, cPech = {}, cPozo = {}; let tPozo = 0;
            const contenedor = $('#contenedor-fechas').empty();

            for (let j = 2; j < data[0].length; j += 4) {
                const f = data[0][j]; if (!f) continue;
                let e1 = "", e2 = "", pzF = 0, r = "", g1 = data[1][j+1], g2 = data[2][j+1];
                let s1 = g1=="1"?"👑 Ganador":g1=="2"?"Perdedor":"🤝 Empate";
                let s2 = g2=="1"?"👑 Ganador":g2=="2"?"Perdedor":"🤝 Empate";
                
                for (let i = 3; i < data.length; i++) {
                    const n = data[i][1], pel = data[i][j], pech = data[i][j+1], pz = data[i][j+2], eq = data[i][j+3];
                    if(n && eq == "1") e1 += `<li>${n} ${pel=='1'?'⚽':''}</li>`;
                    if(n && eq == "2") e2 += `<li>${n} ${pel=='1'?'⚽':''}</li>`;
                    if(pel == '1') cPel[n] = (cPel[n]||0)+1;
                    if(pech == '1') cPech[n] = (cPech[n]||0)+1;
                    if(pz) { 
                        let m = parseFloat(pz.toString().replace(/[^0-9]/g, ''));
                        if(m){ tPozo += m; pzF += m; r = n; cPozo[n] = (cPozo[n]||0)+m; }
                    }
                }
                contenedor.append(`<div class="mini-fecha-card" onclick="abrirPartido('${f}', '${e1}', '${e2}', \`${dicCron[f.trim()] || ''}\`, '${s1}', '${s2}', '${pzF}', '${r}')">${f}</div>`);
            }
            actualizarTop3(cPel, '#top-pelota', '⚽'); actualizarTop3(cPech, '#top-pechera', '🎽'); renderizarPozo(cPozo, tPozo);
        }});
    }});
    cargarMatriz();
}

function abrirPartido(fecha, e1, e2, cron, s1_val, s2_val, pozo, responsable) {
    // Lógica robusta de etiquetas: 1=Ganador, 2=Perdedor, otro=Empate
    let label1 = s1_val == "1" ? "👑 Ganador" : (s1_val == "2" ? "Perdedor" : "🤝 Empate");
    let label2 = s2_val == "1" ? "👑 Ganador" : (s2_val == "2" ? "Perdedor" : "🤝 Empate");

    // Color de la etiqueta según resultado
    let color1 = s1_val == "1" ? "var(--gold)" : (s1_val == "2" ? "#999" : "var(--afa-celeste)");
    let color2 = s2_val == "1" ? "var(--gold)" : (s2_val == "2" ? "#999" : "var(--afa-celeste)");

    let pzH = pozo != "0" ? `<div style="margin:10px 0; color:var(--gold); font-weight:bold; font-family:Oswald; border-top: 1px solid #eee; padding-top:10px;">💰 POZO: $${pozo}</div>` : "";
    
    $('#detalle-partido-dinamico').html(`
        <div class="flip-card-inner" id="flip-card-match">
            <div class="card-front">
                <h3 style="font-family:'Oswald'; font-size:1.6rem; color:var(--afa-azul-noche); margin-bottom:5px;">📅 ${fecha}</h3>
                
                <div style="display:flex; justify-content:space-around; width:100%; gap:10px; margin-top:10px;">
                    <div style="flex:1;">
                        <span class="status-badge" style="color:${color1}">${label1}</span>
                        <ul class="lista-planilla">${e1}</ul>
                    </div>
                    <div style="flex:1;">
                        <span class="status-badge" style="color:${color2}">${label2}</span>
                        <ul class="lista-planilla">${e2}</ul>
                    </div>
                </div>

                ${pzH}

                <div onclick="girarCarta()" style="cursor:pointer; margin-top:auto; padding-top:15px; border-top: 1px solid #eee; width: 100%;">
                    <img src="peter.png" style="width:55px; height:55px; border-radius:50%; border:2px solid var(--gold); box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                    <p style="font-size:0.7rem; color:#666; margin-top:5px; font-family:'Oswald'; letter-spacing:1px;">VER CRÓNICA 🔄</p>
                </div>
            </div>

            <div class="card-back" onclick="girarCarta()">
                <div style="font-family:'Oswald'; color:var(--afa-azul-noche); margin-bottom:15px; font-size:1.3rem; border-bottom:2px solid var(--gold); width:100%; padding-bottom:5px;">CRÓNICA OFICIAL</div>
                <div class="text-format-mini" style="text-align:left; font-size:0.95rem;">${cron || "Sin comentarios disponibles para esta fecha..."}</div>
                <div style="margin-top:auto; font-size:0.7rem; color:var(--gold); font-family:Oswald;">VOLVER A LA FICHA 🔄</div>
            </div>
        </div>
    `);
    $('#modal-partido').fadeIn().css('display', 'flex');
}

function girarCarta() { $('#flip-card-match').toggleClass('flipped'); }

function cargarMatriz() {
    Papa.parse(URL_MATRIZ, { download: true, complete: function(res) {
        let h = '<table class="matrix-table">';
        res.data.forEach((row, i) => {
            h += '<tr>';
            row.forEach((cell, j) => {
                let s = ""; let v = parseInt(cell);
                if(i>0 && j>0 && !isNaN(v) && v>0) { s = `style="background:rgba(0,53,94,${Math.min(v/6, 0.9)}); color:white;"`; }
                h += `<td ${s}>${cell||''}</td>`;
            });
            h += '</tr>';
        });
        $('#heatmap-container').html(h + '</table>');
    }});
}

function actualizarTop3(dict, selector, icon) {
    const sorted = Object.entries(dict).sort((a,b)=>b[1]-a[1]).slice(0,3);
    const medals = ['🥇', '🥈', '🥉'];
    let html = '';
    sorted.forEach((item, i) => html += `<div class="top-item"><span>${medals[i]} ${item[0]}</span> <span>${item[1]} ${icon}</span></div>`);
    $(selector).html(html);
}

function renderizarPozo(cPozo, total) {
    let h = '';
    Object.entries(cPozo).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=> h += `<div class="top-item"><span>👤 ${k}</span> <span>$${v}</span></div>`);
    h += `<div class="top-item" style="border-top:2px solid #d4af37; margin-top:10px;"><strong>Total</strong> <strong>$${total}</strong></div>`;
    $('#top-pozo').html(h);
}

function iniciarContador() {
    const meta = new Date("June 11, 2026 16:00:00").getTime();
    setInterval(() => {
        const diff = meta - new Date().getTime();
        const d = Math.floor(diff / (1000*60*60*24));
        const h = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
        $('#countdown').html(`${d}<small>d</small> ${h}<small>h</small>`);
    }, 1000);
}