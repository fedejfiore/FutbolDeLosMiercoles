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

    const audio = document.getElementById('main-audio');
    $('#audio-control').click(function() {
        if (audio.paused) { audio.play(); $(this).find('.icon').text('⏸️'); } 
        else { audio.pause(); $(this).find('.icon').text('▶️'); }
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
                    let p = parseFloat(row.Promiedo.replace(',', '.')) || 0;
                    html += `<tr><td><strong>${row.Nombre}</strong></td><td>${row.PJ}</td><td>${row.PG}</td><td>${row.PE}</td><td>${row.PP}</td><td>${row.Pts}</td><td data-order="${p}">${row.Promiedo}</td></tr>`;
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

        Papa.parse(URL_EQUIPOS, { download: true, header: false, complete: function(res) {
            const data = res.data; 
            const contenedor = $('#contenedor-fechas').empty();
            const cPel = {}, cPech = {}, cPozo = {}; let tPozo = 0;

            for (let j = 2; j < data[0].length; j += 4) {
                const f = data[0][j]; if (!f) continue;
                let e1 = "", e2 = "", pzF = 0, r = "", g1 = data[1][j+1], g2 = data[2][j+1];

                for (let i = 3; i < data.length; i++) {
                    const n = data[i][1], pel = data[i][j], pech = data[i][j+1], pz = data[i][j+2], eq = data[i][j+3];
                    if(n && eq == "1") e1 += `<li>${n}</li>`;
                    if(n && eq == "2") e2 += `<li>${n}</li>`;
                    if(pel == '1') cPel[n] = (cPel[n]||0)+1;
                    if(pech == '1') cPech[n] = (cPech[n]||0)+1;
                    if(pz) { let m = parseFloat(pz.toString().replace(/[^0-9]/g, '')); if(m){ tPozo += m; cPozo[n] = (cPozo[n]||0)+m; r = n; pzF += m; } }
                }
                const cr = dicCronicas[f.trim()] || "Sin comentarios oficiales.";
                contenedor.append(`<div class="mini-fecha-card" onclick="abrirPartido('${f}', '${e1}', '${e2}', \`${cr}\`, '${g1}', '${g2}', '${pzF}', '${r}')">${f}</div>`);
            }
            actualizarTops(cPel, cPech, cPozo, tPozo);
        }});
    }});
    cargarMatriz();
}

function abrirPartido(f, e1, e2, cr, g1, g2, pz, r) {
    const s1 = g1=="1"?"👑 Ganador":g1=="0"?"🤝 Empate":"Perdedor";
    const s2 = g2=="1"?"👑 Ganador":g2=="0"?"🤝 Empate":"Perdedor";
    $('#detalle-partido-dinamico').html(`
        <div class="flip-card-inner" id="flip-card-match">
            <div class="card-front">
                <h3>📅 ${f}</h3>
                <div style="display:flex; justify-content:space-between; text-align:left; font-size:0.8rem; margin:15px 0;">
                    <div style="width:48%"><strong style="color:var(--afa-azul-noche)">${s1}</strong><ul>${e1}</ul></div>
                    <div style="width:48%"><strong style="color:var(--afa-azul-noche)">${s2}</strong><ul>${e2}</ul></div>
                </div>
                <p style="font-size:0.7rem; color:var(--afa-azul-noche)">💰 Pozo: $${pz} (${r})</p>
                <img src="peter.png" style="width:55px; cursor:pointer; border-radius:50%; border:2px solid var(--gold);" onclick="$('#flip-card-match').toggleClass('flipped')">
            </div>
            <div class="card-back" onclick="$('#flip-card-match').toggleClass('flipped')">
                <div style="font-family:'Oswald'; color:var(--afa-azul-noche);">✍️ CRÓNICA OFICIAL</div>
                <div style="font-size:0.85rem; text-align:left; padding:10px;">${cr}</div>
            </div>
        </div>
    `);
    $('#modal-partido').css('display', 'flex').hide().fadeIn();
}

function actualizarTops(cPel, cPech, cPozo, tPozo) {
    renderTops(cPel, '#top-pelota', '⚽');
    renderTops(cPech, '#top-pechera', '🎽');
    let h = '';
    Object.entries(cPozo).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=> h += `<div class="top-item"><span>👤 ${k}</span><span>$${v}</span></div>`);
    h += `<div class="top-item" style="border-top:1px solid var(--gold);"><strong>TOTAL</strong><strong>$${tPozo}</strong></div>`;
    $('#top-pozo').html(h);
}

function renderTops(d, s, i) {
    const sorted = Object.entries(d).sort((a,b)=>b[1]-a[1]).slice(0,3);
    const medals = ['🥇', '🥈', '🥉'];
    let h = ''; sorted.forEach((x, idx) => h += `<div class="top-item"><span>${medals[idx]} ${x[0]}</span> <span>${x[1]} ${i}</span></div>`);
    $(s).html(h);
}

function cargarMatriz() {
    Papa.parse(URL_MATRIZ, { download: true, complete: function(res) {
        let h = '<table class="matrix-table">';
        res.data.forEach((r, i) => {
            h += '<tr>';
            r.forEach((c, j) => {
                let s = (i>0 && j>0 && parseInt(c)>0) ? `style="background:rgba(116, 172, 223, ${Math.min(c/5,1)});color:white;"` : "";
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
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=-34.6291&lon=-58.5135&appid=${WEATHER_API_KEY}&units=metric&lang=es`;
    fetch(url).then(r => r.json()).then(data => {
        const hoy = new Date();
        const diasHastaMiercoles = (3 - hoy.getDay() + 7) % 7;
        const fM = new Date(hoy); fM.setDate(hoy.getDate() + (diasHastaMiercoles === 0 && hoy.getHours() >= 19 ? 7 : diasHastaMiercoles));
        const tD = fM.toISOString().split('T')[0];
        const pronostico = data.list.find(i => i.dt_txt.includes(tD) && i.dt_txt.includes("18:00:00")) || data.list[0];
        $('#clima-fecha').text(fM.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'numeric' }).toUpperCase());
        $('.clima-text').text(`${Math.round(pronostico.main.temp)}°C - ${pronostico.weather[0].description.toUpperCase()}`);
    });
}