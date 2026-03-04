const URL_GENERAL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=0&single=true&output=csv';
const URL_EQUIPOS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=284173081&single=true&output=csv';
const URL_MATRIZ  = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=790605336&single=true&output=csv';
const URL_CRONICAS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSlbHnHRA0KSEj-UaHgd4ZbVWJ6fCDbK2UtrzwGRts83XTdbOUaG-MgyVSJmqN7y-j1XvNb6WN6PaAr/pub?gid=2071318824&single=true&output=csv';

$(document).ready(function() {
    cargarTabla();
    cargarPartidosMini();
    cargarMatriz(); // Aseguramos que se ejecute
    iniciarContador();
});

function iniciarContador() {
    const meta = new Date("June 11, 2026 16:00:00").getTime();
    setInterval(() => {
        const ahora = new Date().getTime();
        const diff = meta - ahora;
        if (diff < 0) {
            $('#countdown').text("¡EL MUNDIAL EMPEZÓ!");
            return;
        }
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        $('#countdown').html(`${d}<small>d</small> ${h}<small>h</small>`);
    }, 1000);
}

function cargarMatriz() {
    Papa.parse(URL_MATRIZ, {
        download: true,
        header: false,
        complete: function(res) {
            let html = '<div class="table-responsive"><table class="matrix-table">';
            res.data.forEach((row, i) => {
                html += '<tr>';
                row.forEach((cell, j) => {
                    let color = "";
                    if(i > 0 && j > 0 && !isNaN(cell) && cell > 0) {
                        let intensity = Math.min(cell / 5, 1); 
                        color = `style="background: rgba(39, 174, 96, ${intensity}); color: ${intensity > 0.5 ? 'white' : 'black'}"`;
                    }
                    html += `<td ${color} class="${i === 0 || j === 0 ? 'm-header' : ''}">${cell || ''}</td>`;
                });
                html += '</tr>';
            });
            $('#heatmap-container').html(html + '</table></div>');
        }
    });
}

// Las funciones cargarTabla y cargarPartidosMini se mantienen igual para no tocar lo que ya está perfecto.