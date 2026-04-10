const URL_GENERAL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=0&single=true&output=csv';
const URL_EQUIPOS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=284173081&single=true&output=csv';
const URL_MATRIZ  = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=790605336&single=true&output=csv';
const URL_CRONICAS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=2071318824&single=true&output=csv';

const WEATHER_API_KEY = 'f31bb7ce57b0669e92e9827acfe293ec';

$(document).ready(function() {
    cargarTabla();
    cargarHistorialCompleto();
    actualizarClima();
    iniciarContador();

    $('.centered-title').click(function() {
        $(this).toggleClass('active').next('.collapsible-content').slideToggle();
    });

    $('#audio-control').click(function() {
        const audio = document.getElementById('main-audio');
        if (audio.paused) { audio.play(); $(this).text('⏸️ EL ASADO'); } 
        else { audio.pause(); $(this).text('▶️ EL ASADO'); }
    });

    $('.close-modal').click(() => $('.modal').fadeOut());
    
    $('#busqueda-matriz').on('keyup', function() {
        let val = $(this).val().toLowerCase();
        $(".matrix-table tr").filter(function(i) {
            if(i>0) $(this).toggle($(this).text().toLowerCase().indexOf(val) > -1);
        });
    });
});

function cargarTabla() {
    Papa.parse(URL_GENERAL, {
        download: true, header: true,
        complete: function(res) {
            let html = '';
            res.data.forEach(row => {
                if(row.Nombre) {
                    let prom = parseFloat(row.Promiedo.replace(',', '.')) || 0;
                    html += `<tr><td>${row.Nombre}</td><td>${row.PJ}</td><td>${row.PG}</td><td>${row.PE}</td><td>${row.PP}</td><td>${row.Pts}</td><td data-order="${prom}">${row.Promiedo}</td></tr>`;
                }
            });
            $('#body-general').html(html);
            $('#tabla-general').DataTable({ "destroy": true, "order": [[6, "desc"]], "columnDefs": [{ "type": "num", "targets": 6 }] });
        }
    });
}

function cargarHistorialCompleto() {
    Papa.parse(URL_CRONICAS, { download: true, header: true, complete: function(cronRes) {
        const dicCronicas = {}; 
        cronRes.data.forEach(c => { if(c.Fecha) dicCronicas[c.Fecha.trim()] = c.Cronica; });

        Papa.parse(URL_EQUIPOS, { download: true, complete: function(res) {
            const data = res.data; 
            const cPel = {}, cPech = {}, cPozo = {}; 
            let tPozo = 0;
            const contenedor = $('#contenedor-fechas').empty();

            for (let j = 2; j < data[0].length; j += 4) {
                const f = data[0][j]; if(!f) continue;
                
                let e1 = [], e2 = [], s1 = 0, s2 = 0, resp = "";
                
                for (let i = 3; i < data.length; i++) {
                    const nom = data[i][1], ec = data[i][j-1], pel = data[i][j], pech = data[i][j+1], pz = data[i][j+2];
                    if(ec == '1') e1.push(nom);
                    if(ec == '2') e2.push(nom);
                    if(pel == '1') cPel[nom] = (cPel[nom]||0)+1;
                    if(pech == '1') cPech[nom] = (cPech[nom]||0)+1;
                    if(pz) { 
                        let m = parseFloat(pz.toString().replace(/[^0-9]/g, ''));
                        if(m){ tPozo += m; cPozo[nom] = (cPozo[nom]||0)+m; resp = nom; } 
                    }
                }
                
                s1 = data[1][j] || 0; s2 = data[2][j] || 0;
                const cron = dicCronicas[f.trim()] || "Peter no emitió comentarios.";

                contenedor.append(`
                    <div class="mini-fecha-card" onclick="abrirPartido('${f}', '${e1.join(', ')}', '${e2.join(', ')}', \`${cron}\`, ${s1}, ${s2}, '${resp}')">
                        ${f}
                    </div>
                `);
            }
            actualizarTops(cPel, cPech, cPozo, tPozo);
        }});
    }});
    cargarMatriz();
}

function abrirPartido(fecha, e1, e2, cron, s1, s2, resp) {
    const html = `
        <div class="flip-card-inner" id="flip-card-match">
            <div class="card-front">
                <div class="match-header">📅 ${fecha}</div>
                <div class="scoreboard">
                    <div class="team-col"><strong>EQUIPO 1</strong><div class="player-list">${e1}</div></div>
                    <div class="score-display">${s1} - ${s2}</div>
                    <div class="team-col"><strong>EQUIPO 2</strong><div class="player-list">${e2}</div></div>
                </div>
                <div class="match-footer">💰 Responsable: ${resp || 'N/A'}</div>
                <p class="hint">Toca a Peter para la crónica</p>
                <img src="peter.png" class="peter-btn" onclick="girarCarta(event)">
            </div>
            <div class="card-back" onclick="girarCarta(event)">
                <div class="cronica-header">✍️ CRÓNICA DE PETER</div>
                <div class="text-format-mini">${cron}</div>
                <p class="hint-back">🔄 Toca para volver</p>
            </div>
        </div>
    `;
    $('#detalle-partido-dinamico').html(html);
    $('#modal-partido').css('display', 'flex').hide().fadeIn();
}

function girarCarta(e) {
    if(e) e.stopPropagation();
    $('#flip-card-match').toggleClass('flipped');
}

function actualizarTops(cPel, cPech, cPozo, tPozo) {
    renderTop3(cPel, '#top-pelota', '⚽');
    renderTop3(cPech, '#top-pechera', '🎽');
    let hP = '';
    Object.entries(cPozo).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=> hP += `<div class="top-item"><span>👤 ${k}</span><span>$${v.toLocaleString()}</span></div>`);
    hP += `<div class="top-item total-pozo"><strong>TOTAL</strong><strong>$${tPozo.toLocaleString()}</strong></div>`;
    $('#top-pozo').html(hP);
}

function renderTop3(d, s, icon) {
    const sorted = Object.entries(d).sort((a,b)=>b[1]-a[1]).slice(0,3);
    let h = ''; sorted.forEach(x => h += `<div class="top-item"><span>${x[0]}</span> <span>${x[1]} ${icon}</span></div>`);
    $(s).html(h);
}

function cargarMatriz() {
    Papa.parse(URL_MATRIZ, { download: true, complete: function(res) {
        let h = '<table class="matrix-table">';
        res.data.forEach((r, i) => {
            h += '<tr>';
            r.forEach((c, j) => {
                let s = (i>0 && j>0 && parseInt(c)>0) ? `style="background:rgba(39,174,96,${Math.min(c/5,1)});color:white;"` : "";
                h += `<td ${s}>${c||''}</td>`;
            });
            h += '</tr>';
        });
        $('#heatmap-container').html(h + '</table>');
    }});
}

function iniciarContador() {
    const meta = new Date("June 11, 2026 16:00:00").getTime();
    setInterval(() => {
        const diff = meta - new Date().getTime();
        const d = Math.floor(diff / (1000*60*60*24));
        const h = Math.floor((diff % (1000*60*60*24)) / (1000*60*60));
        $('#countdown').html(`${d}d ${h}h`);
    }, 1000);
}

function actualizarClima() {
    fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=-34.6291&lon=-58.5135&appid=${WEATHER_API_KEY}&units=metric&lang=es`)
    .then(r => r.json()).then(data => {
        const d = data.list[0];
        $('#clima-fecha').text('PRÓXIMO MIÉRCOLES');
        $('.clima-text').text(`${Math.round(d.main.temp)}°C - ${d.weather[0].description.toUpperCase()}`);
    });
}