// ==================== VERIFICAR AUTENTICACIÓN ====================
if (!protegerRuta()) {
    // La función ya redirige
}

// ==================== VARIABLES ====================
let rifasData = [];

// ==================== CARGAR DASHBOARD ====================
document.addEventListener('DOMContentLoaded', async () => {
    const user = obtenerUsuario();
    if (user) {
        document.getElementById('userName').textContent = `¡Hola, ${user.nombre}!`;
    }
    
    await cargarRifas();
});

// ==================== CARGAR RIFAS ====================
async function cargarRifas() {
    try {
        const response = await fetch(`${API_URL}/api/raffles/mis-rifas`, {
            headers: authHeaders()
        });
        
        const data = await response.json();
        
        if (data.exito) {
            rifasData = data.rifas;
            mostrarRifas(data.rifas);
            actualizarStats(data.rifas);
        } else {
            if (response.status === 401) {
                cerrarSesion();
            }
            mostrarToast('Error al cargar rifas', 'error');
        }
    } catch (error) {
        mostrarToast('Error de conexión', 'error');
    }
}

// ==================== MOSTRAR RIFAS ====================
function mostrarRifas(rifas) {
    const container = document.getElementById('rifasContainer');
    
    if (rifas.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">🎰</div>
                <h3>No tienes rifas aún</h3>
                <p>Crea tu primera rifa y empieza a vender boletos</p>
                <a href="/crear-rifa" class="btn btn-primary mt-2">+ Crear Rifa</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="grid-rifas">
            ${rifas.map(rifa => crearRifaCard(rifa)).join('')}
        </div>
    `;
}

// ==================== CREAR CARD DE RIFA ====================
function crearRifaCard(rifa) {
    const porcentaje = rifa.cantidadBoletos > 0 
        ? Math.round((rifa.boletosVendidos / rifa.cantidadBoletos) * 100) 
        : 0;
    
    const estadoBadge = {
        'activa': '<span class="badge badge-disponible">Activa</span>',
        'sorteada': '<span class="badge badge-pagado">Sorteada</span>',
        'cancelada': '<span class="badge badge-reservado">Cancelada</span>'
    };
    
    const fotoUrl = rifa.fotos && rifa.fotos.length > 0 
        ? rifa.fotos[0] 
        : 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" fill="%236C63FF"><rect width="400" height="200"/><text x="50%" y="50%" fill="white" font-size="50" text-anchor="middle" dy=".3em">🎰</text></svg>';
    
    return `
        <div class="card fade-in">
            <img src="${fotoUrl}" class="card-img" alt="${rifa.titulo}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22200%22 fill=%22%236C63FF%22><rect width=%22400%22 height=%22200%22/><text x=%2250%25%22 y=%2250%25%22 fill=%22white%22 font-size=%2250%22 text-anchor=%22middle%22 dy=%22.3em%22>🎰</text></svg>'">
            <div class="card-body">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                    <h3 class="card-title">${rifa.titulo}</h3>
                    ${estadoBadge[rifa.estado] || ''}
                </div>
                <p class="card-text">🏆 ${rifa.premio}</p>
                <p style="font-weight: 700; color: var(--primary); font-size: 1.1rem;">
                    ${formatoMoneda(rifa.precioBoleto)} / boleto
                </p>
                
                <!-- Progress -->
                <div style="margin-top: 0.75rem;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.25rem;">
                        <span>${rifa.boletosVendidos} / ${rifa.cantidadBoletos} vendidos</span>
                        <span>${porcentaje}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${porcentaje}%;"></div>
                    </div>
                </div>
                
                <div style="margin-top: 0.75rem; font-size: 0.85rem; color: var(--gray);">
                    💰 Recaudado: <strong style="color: var(--success);">${formatoMoneda(rifa.recaudado)}</strong>
                </div>
            </div>
            <div class="card-footer">
                <a href="/administrar/${rifa._id}" class="btn btn-primary btn-sm">⚙️ Administrar</a>
                <a href="/rifa/${rifa._id}" class="btn btn-outline btn-sm" target="_blank">👁️ Ver Página</a>
            </div>
        </div>
    `;
}

// ==================== ACTUALIZAR STATS ====================
function actualizarStats(rifas) {
    const totalRifas = rifas.length;
    const totalBoletos = rifas.reduce((sum, r) => sum + r.boletosVendidos, 0);
    const boletosPagados = rifas.reduce((sum, r) => sum + r.boletosPagados, 0);
    const totalRecaudado = rifas.reduce((sum, r) => sum + r.recaudado, 0);
    
    document.getElementById('totalRifas').textContent = totalRifas;
    document.getElementById('totalBoletos').textContent = totalBoletos;
    document.getElementById('boletosPagados').textContent = boletosPagados;
    document.getElementById('totalRecaudado').textContent = formatoMoneda(totalRecaudado);
}
