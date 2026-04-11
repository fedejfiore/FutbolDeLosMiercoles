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

    // LÓGICA DE COLAPSABLES MEJORADA
    $('.centered-title').click(function() {
        $(this).toggleClass('active');
        $(this).next('.collapsible-content').slideToggle(400);
    });

    const audio = document.getElementById('main-audio');
    $('#audio-control').click(function() {
        if (audio.paused) { audio.play(); $(this).find('.icon').text('⏸️'); } 
        else { audio.pause(); $(this).find('.icon').text('▶️'); }
    });

    $('.close-modal').click(() => $('.modal').fadeOut());
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
}

function abrirPartido(f, e1, e2, cr, g1, g2, pz, r) {
    const s1 = g1=="1"?"👑 Ganador":g1=="0"?"🤝 Empate":"Perdedor";
    const s2 = g2=="1"?"👑 Ganador":g2=="0"?"🤝 Empate":"Perdedor";
    $('#detalle-partido-dinamico').html(`
        <div class="flip-card-inner" id="flip-card-match">
            <div class="card-front">
                <h2 style="font-family:'Oswald'; color:var(--afa-azul-noche); margin-top:0;">📅 ${f}</h2>
                <div style="display:flex; justify-content:space-between; text-align:left; gap:20px; margin:20px 0; border-top:1px solid #eee; padding-top:15px;">
                    <div style="width:50%"><strong style="color:var(--afa-celeste)">${s1}</strong><ul style="padding-left:15px; font-size:0.9rem;">${e1}</ul></div>
                    <div style="width:50%"><strong style="color:var(--afa-celeste)">${s2}</strong><ul style="padding-left:15px; font-size:0.9rem;">${e2}</ul></div>
                </div>
                <div style="background:#f0f7ff; padding:12px; border-radius:10px; border:1px solid var(--afa-celeste); margin-bottom:15px;">
                    <p style="margin:0; font-weight:bold; color:var(--afa-azul-noche)">💰 Pozo: $${pz} (${r})</p>
                </div>
                <img src="peter.png" style="width:65px; cursor:pointer; border-radius:50%; border:3px solid var(--gold);" onclick="$('#flip-card-match').toggleClass('flipped')">
                <p style="font-size:0.7rem; color:#666; margin-top:5px;">Click en Peter para Crónica</p>
            </div>
            <div class="card-back" onclick="$('#flip-card-match').toggleClass('flipped')">
                <div style="font-family:'Oswald'; color:var(--afa-azul-noche); border-bottom:2px solid var(--gold); padding-bottom:10px; margin-bottom:15px;">✍️ CRÓNICA OFICIAL</div>
                <div style="max-height:350px; overflow-y:auto; text-align:left; line-height:1.6; font-size:0.95rem;">${cr}</div>
            </div>
        </div>
    `);
    $('#modal-partido').css('display', 'flex').hide().fadeIn();
}

function actualizarTops(cPel, cPech, cPozo, tPozo) {
    const render = (d, s, i) => {
        const sorted = Object.entries(d).sort((a,b)=>b[1]-a[1]).slice(0,3);
        let h = ''; sorted.forEach((x, idx) => h += `<div class="top-item"><span>${['🥇','🥈','🥉'][idx]} ${x[0]}</span> <span>${x[1]} ${i}</span></div>`);
        $(s).html(h);
    };
    render(cPel, '#top-pelota', '⚽');
    render(cPech, '#top-pechera', '🎽');
    let h = ''; Object.entries(cPozo).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=> h += `<div class="top-item"><span>👤 ${k}</span><span>$${v}</span></div>`);
    h += `<div class="top-item" style="border-top:1px solid var(--gold);"><strong>TOTAL</strong><strong>$${tPozo}</strong></div>`;
    $('#top-pozo').html(h);
}

function actualizarClima() {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=-34.6291&lon=-58.5135&appid=${WEATHER_API_KEY}&units=metric&lang=es`;
    fetch(url).then(r => r.json()).then(data => {
        const hoy = new Date();
        const diasHastaMiercoles = (3 - hoy.getDay() + 7) % 7;
        const fM = new Date(hoy); fM.setDate(hoy.getDate() + (diasHastaMiercoles === 0 && hoy.getHours() >= 19 ? 7 : diasHastaMiercoles));
        const pronostico = data.list.find(i => i.dt_txt.includes(fM.toISOString().split('T')[0]) && i.dt_txt.includes("18:00:00")) || data.list[0];
        $('#clima-fecha').text(fM.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'numeric' }).toUpperCase());
        $('.clima-text').text(`${Math.round(pronostico.main.temp)}°C - ${pronostico.weather[0].description.toUpperCase()}`);
    });
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