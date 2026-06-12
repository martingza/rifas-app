// ==================== VERIFICAR AUTENTICACIÓN ====================
if (!protegerRuta()) {
    // La función ya redirige
}

// ==================== VARIABLES ====================
let rifaId = null;
let rifaData = null;
let boletosData = [];

// ==================== CARGAR RIFA ====================
document.addEventListener('DOMContentLoaded', async () => {
    // Obtener ID de la URL
    const pathParts = window.location.pathname.split('/');
    rifaId = pathParts[pathParts.length - 1];
    
    if (!rifaId) {
        window.location.href = '/dashboard';
        return;
    }
    
    await cargarRifa();
});

// ==================== CARGAR DATOS DE LA RIFA ====================
async function cargarRifa() {
    try {
        const response = await fetch(`${API_URL}/api/raffles/${rifaId}`, {
            headers: authHeaders()
        });
        
        const data = await response.json();
        
        if (data.exito) {
            rifaData = data.rifa;
            boletosData = data.boletos;
            mostrarInfoRifa();
            mostrarBoletos();
            mostrarCompradores();
        } else {
            mostrarToast('Error: ' + data.mensaje, 'error');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 2000);
        }
    } catch (error) {
        mostrarToast('Error de conexión', 'error');
    }
}

// ==================== MOSTRAR INFO DE LA RIFA ====================
function mostrarInfoRifa() {
    document.getElementById('rifaTitulo').textContent = rifaData.titulo;
    document.getElementById('premioRifa').textContent = '🏆 ' + rifaData.premio;
    document.getElementById('descripcionRifa').textContent = rifaData.descripcion || 'Sin descripción';
    document.getElementById('precioRifa').textContent = formatoMoneda(rifaData.precioBoleto) + '/boleto';
    
    // Estado
    const estadoEl = document.getElementById('estadoRifa');
    const estados = {
        'activa': { texto: 'Activa', clase: 'badge-disponible' },
        'sorteada': { texto: 'Sorteada', clase: 'badge-pagado' },
        'cancelada': { texto: 'Cancelada', clase: 'badge-reservado' }
    };
    const estado = estados[rifaData.estado] || estados.activa;
    estadoEl.textContent = estado.texto;
    estadoEl.className = 'badge ' + estado.clase;
    
    // Stats
    const disponibles = boletosData.filter(b => b.estado === 'disponible').length;
    const reservados = boletosData.filter(b => b.estado === 'reservado').length;
    const pagados = boletosData.filter(b => b.estado === 'pagado').length;
    
    document.getElementById('totalBoletosRifa').textContent = rifaData.cantidadBoletos;
    document.getElementById('disponiblesRifa').textContent = disponibles;
    document.getElementById('reservadosRifa').textContent = reservados;
    document.getElementById('pagadosRifa').textContent = pagados;
    
    // Link para compartir
    const linkRifa = `${window.location.origin}/rifa/${rifaId}`;
    document.getElementById('linkRifa').value = linkRifa;
}

// ==================== MOSTRAR BOLETOS ====================
function mostrarBoletos() {
    const grid = document.getElementById('boletosGrid');
    
    grid.innerHTML = boletosData.map(boleto => {
        const compradorInfo = boleto.comprador 
            ? ` (${boleto.comprador.nombre})` 
            : '';
        
        return `
            <div class="boleto ${boleto.estado}" 
                 title="Boleto #${boleto.numero}${compradorInfo}"
                 onclick="verBoleto('${boleto._id}')">
                ${boleto.numero}
            </div>
        `;
    }).join('');
}

// ==================== VER BOLETO ====================
function verBoleto(boletoId) {
    const boleto = boletosData.find(b => b._id === boletoId);
    if (!boleto) return;
    
    if (boleto.estado === 'disponible') {
        mostrarToast('Este boleto está disponible', 'info');
        return;
    }
    
    const comprador = boleto.comprador || { nombre: 'N/A', telefono: 'N/A' };
    
    mostrarToast(`Boleto #${boleto.numero} - ${comprador.nombre} (${comprador.telefono})`, 'info');
}

// ==================== MOSTRAR COMPRADORES ====================
function mostrarCompradores() {
    const tbody = document.getElementById('tablaCompradores');
    
    const boletosOcupados = boletosData.filter(b => b.estado !== 'disponible');
    
    if (boletosOcupados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; color: var(--gray);">
                    No hay boletos vendidos aún
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = boletosOcupados.map(boleto => {
        const comprador = boleto.comprador || { nombre: 'N/A', telefono: 'N/A' };
        
        const estadoBadge = {
            'reservado': '<span class="badge badge-reservado">Reservado</span>',
            'pagado': '<span class="badge badge-pagado">Pagado</span>'
        };
        
        const comprobanteBtn = boleto.comprobantePago 
            ? `<button class="btn btn-sm btn-outline" onclick="verComprobante('${boleto.comprobantePago}')">📄 Ver</button>`
            : 'Sin comprobante';
        
        const accionesBtn = boleto.estado === 'reservado' 
            ? `
                <button class="btn btn-sm btn-success" onclick="validarPago('${boleto._id}', 'pagado')">✅ Validar</button>
                <button class="btn btn-sm btn-danger" onclick="validarPago('${boleto._id}', 'disponible')">❌ Rechazar</button>
            `
            : '<span style="color: var(--success);">✓ Verificado</span>';
        
        return `
            <tr>
                <td><strong>#${boleto.numero}</strong></td>
                <td>${comprador.nombre}</td>
                <td>${comprador.telefono}</td>
                <td>${estadoBadge[boleto.estado]}</td>
                <td>${comprobanteBtn}</td>
                <td>${accionesBtn}</td>
            </tr>
        `;
    }).join('');
}

// ==================== VALIDAR PAGO ====================
async function validarPago(boletoId, estado) {
    try {
        const response = await fetch(`${API_URL}/api/raffles/validar-pago/${boletoId}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ estado })
        });
        
        const data = await response.json();
        
        if (data.exito) {
            mostrarToast(data.mensaje, 'success');
            await cargarRifa(); // Recargar datos
        } else {
            mostrarToast(data.mensaje, 'error');
        }
    } catch (error) {
        mostrarToast('Error al validar pago', 'error');
    }
}

// ==================== VER COMPROBANTE ====================
function verComprobante(url) {
    document.getElementById('imgComprobante').src = url;
    document.getElementById('modalComprobante').classList.remove('hidden');
}

function cerrarModalComprobante() {
    document.getElementById('modalComprobante').classList.add('hidden');
}

// ==================== COPIAR LINK ====================
function copiarLink() {
    const link = document.getElementById('linkRifa').value;
    copiarAlPortapapeles(link);
}

// ==================== TABS ====================
function mostrarTab(tab) {
    // Ocultar todos
    document.getElementById('seccionBoletos').classList.add('hidden');
    document.getElementById('seccionCompradores').classList.add('hidden');
    document.getElementById('seccionSorteo').classList.add('hidden');
    
    // Resetear botones
    document.getElementById('tabBoletos').className = 'btn btn-outline';
    document.getElementById('tabCompradores').className = 'btn btn-outline';
    document.getElementById('tabSorteo').className = 'btn btn-outline';
    
    // Mostrar seleccionado
    document.getElementById(`seccion${tab.charAt(0).toUpperCase() + tab.slice(1)}`).classList.remove('hidden');
    document.getElementById(`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`).className = 'btn btn-primary';
}

// ==================== REALIZAR SORTEO ====================
async function realizarSorteo() {
    const numeroLoteria = document.getElementById('numeroLoteria').value;
    
    if (!numeroLoteria) {
        mostrarToast('Ingresa el número de la lotería', 'warning');
        return;
    }
    
    if (!confirm('¿Estás seguro de realizar el sorteo? Esta acción no se puede deshacer.')) {
        return;
    }
    
    const btn = document.getElementById('btnSortear');
    mostrarLoading(btn);
    
    try {
        const response = await fetch(`${API_URL}/api/raffles/sortear/${rifaId}`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ numeroLoteria })
        });
        
        const data = await response.json();
        
        if (data.exito) {
            const resultadoDiv = document.getElementById('resultadoSorteo');
            resultadoDiv.classList.remove('hidden');
            
            if (data.ganador) {
                resultadoDiv.innerHTML = `
                    <div class="ganador-card">
                        <div class="trofeo">🏆</div>
                        <h2>¡Tenemos Ganador!</h2>
                        <p style="opacity: 0.9; margin-bottom: 1rem;">
                            Número de la Lotería: <strong>${numeroLoteria}</strong>
                        </p>
                        <div class="nombre">${data.ganador.nombre}</div>
                        <div class="telefono">${data.ganador.telefono}</div>
                        <div style="margin-top: 1rem; font-size: 0.9rem; opacity: 0.8;">
                            Boleto ganador: <strong>#${data.ganador.numeroBoleto}</strong>
                        </div>
                    </div>
                `;
                mostrarToast('¡Sorteo realizado con éxito!', 'success');
            } else {
                resultadoDiv.innerHTML = `
                    <div class="alert alert-warning">
                        <span>⚠️</span>
                        <span>El número ${numeroLoteria} no tiene comprador. No hay ganador para este número.</span>
                    </div>
                `;
                mostrarToast('El número no tiene comprador', 'warning');
            }
            
            // Recargar datos
            await cargarRifa();
        } else {
            mostrarToast(data.mensaje, 'error');
        }
    } catch (error) {
        mostrarToast('Error al realizar sorteo', 'error');
    } finally {
        ocultarLoading(btn);
    }
}
