const URL_GENERAL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=0&single=true&output=csv';
const URL_EQUIPOS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=284173081&single=true&output=csv';
const URL_MATRIZ  = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=790605336&single=true&output=csv';
const URL_CRONICAS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=2071318824&single=true&output=csv';

const WEATHER_API_KEY = 'f31bb7ce57b0669e92e9827acfe293ec';

$(document).ready(function() {
    cargarTabla();
    cargarHistorial();
    actualizarClima();
    iniciarContador();

    $('.centered-title').click(function() {
        $(this).toggleClass('active').next('.collapsible-content').slideToggle();
    });

    const audio = document.getElementById('main-audio');
    $('#audio-control').click(function() {
        if (audio.paused) { audio.play(); $(this).text('⏸️ EL ASADO'); } 
        else { audio.pause(); $(this).text('▶️ EL ASADO'); }
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
                    html += `<tr><td>${row.Nombre}</td><td>${row.PJ}</td><td>${row.PG}</td><td>${row.PE}</td><td>${row.PP}</td><td>${row.Pts}</td><td data-order="${p}">${row.Promiedo}</td></tr>`;
                }
            });
            $('#body-general').html(html);
            $('#tabla-general').DataTable({ "destroy": true, "order": [[6, "desc"]], "columnDefs": [{ "type": "num", "targets": 6 }] });
        }
    });
}

function cargarHistorial() {
    Papa.parse(URL_CRONICAS, { download: true, header: true, complete: function(cronRes) {
        const dic = {}; cronRes.data.forEach(c => dic[c.Fecha] = c.Cronica);
        Papa.parse(URL_EQUIPOS, { download: true, complete: function(res) {
            const data = res.data; const cPel = {}, cPech = {}, cPozo = {}; let tPozo = 0;
            for (let j = 2; j < data[0].length; j += 4) {
                const f = data[0][j]; if(!f) continue;
                for (let i = 3; i < data.length; i++) {
                    const n = data[i][1], pel = data[i][j], pech = data[i][j+1], pz = data[i][j+2];
                    if(pel=='1') cPel[n] = (cPel[n]||0)+1;
                    if(pech=='1') cPech[n] = (cPech[n]||0)+1;
                    if(pz) { let m = parseFloat(pz.replace(/[^0-9]/g, '')); if(m){ tPozo += m; cPozo[n] = (cPozo[n]||0)+m; } }
                }
                $('#contenedor-fechas').append(`<div class="mini-fecha-card" style="background:#001220; color:white; padding:10px; border-radius:8px; cursor:pointer; border:1px solid #d4af37; text-align:center;">${f}</div>`);
            }
            renderTops(cPel, '#top-pelota', '⚽');
            renderTops(cPech, '#top-pechera', '🎽');
            $('#top-pozo').html(`TOTAL ACUMULADO: $${tPozo}`);
        }});
    }});
    cargarMatriz();
}

function cargarMatriz() {
    Papa.parse(URL_MATRIZ, { download: true, complete: function(res) {
        let h = '<table class="matrix-table" style="width:100%; border-collapse:collapse;">';
        res.data.forEach((r, i) => {
            h += '<tr>';
            r.forEach((c, j) => {
                let s = (i>0 && j>0 && parseInt(c)>0) ? `style="background:rgba(39,174,96,${Math.min(c/5,1)});color:white;"` : "";
                h += `<td ${s} style="border:1px solid #ddd; padding:8px;">${c||''}</td>`;
            });
            h += '</tr>';
        });
        $('#heatmap-container').html(h + '</table>');
    }});
}

function renderTops(d, s, i) {
    const sorted = Object.entries(d).sort((a,b)=>b[1]-a[1]).slice(0,3);
    let h = ''; sorted.forEach(x => h += `<div class="top-item"><span>${x[0]}</span> <span>${x[1]} ${i}</span></div>`);
    $(s).html(h);
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
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=-34.6291&lon=-58.5135&appid=${WEATHER_API_KEY}&units=metric&lang=es`)
    .then(r => r.json()).then(d => {
        $('#clima-fecha').text('PRÓXIMO PARTIDO');
        $('.clima-text').text(`${Math.round(d.main.temp)}°C - ${d.weather[0].description.toUpperCase()}`);
    });
}