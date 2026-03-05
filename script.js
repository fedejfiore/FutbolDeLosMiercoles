const URL_GENERAL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=0&single=true&output=csv';
const URL_EQUIPOS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=284173081&single=true&output=csv';
const URL_MATRIZ  = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=790605336&single=true&output=csv';
const URL_CRONICAS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=2071318824&single=true&output=csv';

let dataGlobalJugadores = [];
let totalPozoGlobal = 0;

$(document).ready(function() {
    cargarTabla();
    cargarPartidosYCronicas();
    cargarMatriz();
    iniciarContador();
    $('.close-modal').click(() => $('#modal-partido, #modal-jugador').fadeOut());
});

function iniciarContador() {
    const metaMundial = new Date("June 11, 2026 16:00:00").getTime();
    function updateTimer() {
        const ahora = new Date().getTime();
        const diff = metaMundial - ahora;
        if (diff <= 0) { $('#countdown').html("¡EMPEZÓ EL MUNDIAL!"); return; }
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        $('#countdown').html(`${d}<small>d</small> ${h}<small>h</small>`);
    }
    updateTimer();
    setInterval(updateTimer, 60000);
}

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
                    const conteoPelota = {};
                    const conteoPechera = {};
                    const conteoPozo = {}; // Desglose por persona
                    totalPozoGlobal = 0; 

                    const headers = data[0];
                    for (let j = 2; j < headers.length; j += 4) {
                        const fecha = headers[j];
                        if (!fecha) continue;

                        const valGanador = data[1][j + 1]; 
                        let s1 = "🤝 Empate"; let s2 = "🤝 Empate";
                        if (valGanador === "1") { s1 = "👑 Ganador"; s2 = "Perdedor"; }
                        else if (valGanador === "2") { s1 = "Perdedor"; s2 = "👑 Ganador"; }

                        let e1 = ""; let e2 = "";
                        let pozoPartido = 0;
                        let responsable = "";

                        for (let i = 3; i < data.length; i++) {
                            const n = data[i][1]; 
                            const pel = data[i][j]; 
                            const pech = data[i][j+1]; 
                            const pozoVal = data[i][j+2]; 
                            const eq = data[i][j+3];

                            if(n && eq == "1") e1 += `<li>${n} ${pel=='1'?'⚽':''} ${pech=='1'?'🎽':''}</li>`;
                            if(n && eq == "2") e2 += `<li>${n} ${pel=='1'?'⚽':''} ${pech=='1'?'🎽':''}</li>`;
                            if(pel=='1') conteoPelota[n] = (conteoPelota[n] || 0) + 1;
                            if(pech=='1') conteoPechera[n] = (conteoPechera[n] || 0) + 1;
                            
                            if(pozoVal && pozoVal.toString().trim() !== "") {
                                let monto = parseFloat(pozoVal.toString().replace(/[^0-9]/g, ''));
                                if(!isNaN(monto) && monto > 0) {
                                    pozoPartido += monto;
                                    responsable = n;
                                    conteoPozo[n] = (conteoPozo[n] || 0) + monto;
                                }
                            }
                        }
                        
                        totalPozoGlobal += pozoPartido;
                        let miniCard = `<div class="mini-fecha-card" onclick="abrirPartido('${fecha}', '${e1}', '${e2}', \`${dicCronicas[fecha.trim()] || ''}\`, '${s1}', '${s2}', '${pozoPartido}', '${responsable}')">${fecha}</div>`;
                        contenedor.append(miniCard);
                    }

                    // Renderizar desglose
                    let htmlPozo = '';
                    for (const jugador in conteoPozo) {
                        htmlPozo += `<div class="top-item"><span>👤 ${jugador}</span> <span>$${conteoPozo[jugador]}</span></div>`;
                    }
                    htmlPozo += `<div class="top-item" style="border-top:1px solid #ddd; margin-top:5px;"><strong>Total</strong> <strong>$${totalPozoGlobal}</strong></div>`;
                    $('#top-pozo').html(htmlPozo);

                    mostrarTop3(conteoPelota, '#top-pelota', '⚽');
                    mostrarTop3(conteoPechera, '#top-pechera', '🎽');
                }
            });
        }
    });
}

function abrirPartido(fecha, e1, e2, cron, s1, s2, pozo, responsable) {
    let pozoHtml = (pozo && pozo != "0") ? `<div style="margin-top:15px; border-top:1px solid #eee; padding-top:10px; color:#d4af37;"><strong>💰 Pozo del partido:</strong> $${pozo} (${responsable})</div>` : "";
    let content = `
        <div class="flip-card-inner" id="flip-card-match">
            <div class="card-front">
                <h3 style="color:#1a3c1a; margin-bottom:10px; font-family:'Oswald'">📅 ${fecha}</h3>
                <div style="display:flex; justify-content:space-between; text-align:left;">
                    <div style="width:48%">
                        <strong style="font-size:0.75rem; color:#d4af37">${s1}</strong>
                        <ul class="lista-equipos-modal">${e1}</ul>
                    </div>
                    <div style="width:48%">
                        <strong style="font-size:0.75rem; color:#d4af37">${s2}</strong>
                        <ul class="lista-equipos-modal">${e2}</ul>
                    </div>
                </div>
                ${pozoHtml}
                <div class="footer-card-click" onclick="girarCarta()">
                    <img src="peter.png" class="img-autor-btn" onerror="this.src='https://via.placeholder.com/50'">
                    <p style="font-size:0.7rem; color:gray; margin-top:5px;">Clic en Peter para crónica 🔄</p>
                </div>
            </div>
            <div class="card-back" onclick="girarCarta()">
                <div class="header-cronica">
                    <img src="peter.png" class="img-autor-mini" onerror="this.src='https://via.placeholder.com/40'">
                    <strong>CRÓNICAS DE PETER</strong>
                </div>
                <div class="text-format-mini">${cron || "Peter no emitio comentarios al respecto.."}</div>
                <p class="hint-back">🔄 Toca para volver</p>
            </div>
        </div>
    `;
    $('#detalle-partido-dinamico').html(content);
    $('#modal-partido').fadeIn();
}

function girarCarta() { $('#flip-card-match').toggleClass('flipped'); }

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
                        colorStyle = `style="background: rgba(39, 174, 96, ${intensity}); color: white; font-weight: bold;"`;
                    }
                    html += `<td ${colorStyle} class="${i === 0 || j === 0 ? 'sticky-header' : ''}">${cell || ''}</td>`;
                });
                html += '</tr>';
            });
            $('#heatmap-container').html(html + '</table></div>');
        }
    });
}

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
                "language": {"url": "//cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json"}, 
                "order": [[2, "desc"]], 
                "destroy": true
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

function verJugador(nombre) {
    const j = dataGlobalJugadores.find(item => item.Nombre === nombre);
    if(!j) return;
    let html = `<h2 style="font-family:'Oswald'">${j.Nombre}</h2>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:15px;">
            <div style="background:#f4f4f4; padding:10px; border-radius:10px;"><strong>PJ</strong><br>${j.PJ}</div>
            <div style="background:#f4f4f4; padding:10px; border-radius:10px;"><strong>PTS</strong><br>${j.Pts}</div>
        </div>
        <p style="margin-top:20px; color:#2d5a27; font-weight:bold; font-size:1.3rem;">Promedio: ${j.Promiedo}</p>`;
    $('#detalle-jugador').html(html);
    $('#modal-jugador').fadeIn();
}