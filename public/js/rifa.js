// ==================== VARIABLES ====================
let rifaId = null;
let rifaData = null;
let boletosData = [];
let boletosSeleccionados = [];
let carruselIndex = 0;

// ==================== CARGAR RIFA ====================
document.addEventListener('DOMContentLoaded', async () => {
    const pathParts = window.location.pathname.split('/');
    rifaId = pathParts[pathParts.length - 1];
    
    if (!rifaId) {
        mostrarError();
        return;
    }
    
    await cargarRifaPublica();
});

// ==================== CARGAR DATOS ====================
async function cargarRifaPublica() {
    try {
        const response = await fetch(`${API_URL}/api/public/rifa/${rifaId}`);
        const data = await response.json();
        
        if (data.exito) {
            rifaData = data.rifa;
            boletosData = data.boletos;
            
            document.getElementById('loadingRifa').classList.add('hidden');
            document.getElementById('rifaContent').classList.remove('hidden');
            
            mostrarRifaPublica();
            
            if (data.ganador) {
                mostrarGanador(data.ganador);
            }
            
            if (rifaData.estado === 'sorteada') {
                document.getElementById('seleccionBoletos').classList.add('hidden');
            }
        } else {
            mostrarError();
        }
    } catch (error) {
        mostrarError();
    }
}

// ==================== MOSTRAR RIFA ====================
function mostrarRifaPublica() {
    document.title = `${rifaData.titulo} - RifasApp`;
    
    document.getElementById('rifaTituloPublico').textContent = rifaData.titulo;
    document.getElementById('rifaDescripcionPublico').textContent = rifaData.descripcion || '';
    document.getElementById('rifaPremioPublico').textContent = rifaData.premio;
    document.getElementById('rifaPrecioPublico').textContent = formatoMoneda(rifaData.precioBoleto);
    
    const disponibles = boletosData.filter(b => b.estado === 'disponible').length;
    document.getElementById('rifaDisponiblesPublico').textContent = disponibles;
    
    const vendidos = boletosData.filter(b => b.estado !== 'disponible').length;
    const porcentaje = Math.round((vendidos / rifaData.cantidadBoletos) * 100);
    document.getElementById('porcentajeVendido').textContent = porcentaje + '%';
    document.getElementById('progressVendidos').style.width = porcentaje + '%';
    
    // Carrusel
    if (rifaData.fotos && rifaData.fotos.length > 0) {
        inicializarCarrusel(rifaData.fotos);
    } else {
        document.getElementById('carruselContainer').style.display = 'none';
    }
    
    // Boletos
    mostrarBoletosPublicos();
}

// ==================== CARRUSEL ====================
function inicializarCarrusel(fotos) {
    const slides = document.getElementById('carruselSlides');
    const dots = document.getElementById('carruselDots');
    
    slides.innerHTML = fotos.map(foto => `
        <div class="carrusel-slide">
            <img src="${foto}" alt="Premio">
        </div>
    `).join('');
    
    dots.innerHTML = fotos.map((_, i) => `
        <button class="carrusel-dot ${i === 0 ? 'active' : ''}" onclick="irASlide(${i})"></button>
    `).join('');
    
    carruselIndex = 0;
}

function carruselSiguiente() {
    if (!rifaData.fotos) return;
    carruselIndex = (carruselIndex + 1) % rifaData.fotos.length;
    actualizarCarrusel();
}

function carruselAnterior() {
    if (!rifaData.fotos) return;
    carruselIndex = (carruselIndex - 1 + rifaData.fotos.length) % rifaData.fotos.length;
    actualizarCarrusel();
}

function irASlide(index) {
    carruselIndex = index;
    actualizarCarrusel();
}

function actualizarCarrusel() {
    const slides = document.getElementById('carruselSlides');
    slides.style.transform = `translateX(-${carruselIndex * 100}%)`;
    
    document.querySelectorAll('.carrusel-dot').forEach((dot, i) => {
        dot.className = `carrusel-dot ${i === carruselIndex ? 'active' : ''}`;
    });
}

// Auto-play carrusel
setInterval(() => {
    if (rifaData && rifaData.fotos && rifaData.fotos.length > 1) {
        carruselSiguiente();
    }
}, 5000);

// ==================== MOSTRAR BOLETOS ====================
function mostrarBoletosPublicos() {
    const grid = document.getElementById('boletosGridPublico');
    
    grid.innerHTML = boletosData.map(boleto => {
        const seleccionado = boletosSeleccionados.includes(boleto.numero);
        const claseAdicional = seleccionado ? 'seleccionado' : '';
        
        return `
            <div class="boleto ${boleto.estado} ${claseAdicional}" 
                 onclick="seleccionarBoleto(${boleto.numero}, '${boleto.estado}')"
                 title="Boleto #${boleto.numero}">
                ${boleto.numero}
            </div>
        `;
    }).join('');
}

// ==================== SELECCIONAR BOLETO ====================
function seleccionarBoleto(numero, estado) {
    if (estado !== 'disponible') {
        mostrarToast('Este boleto no está disponible', 'warning');
        return;
    }
    
    const index = boletosSeleccionados.indexOf(numero);
    
    if (index > -1) {
        boletosSeleccionados.splice(index, 1);
    } else {
        boletosSeleccionados.push(numero);
    }
    
    mostrarBoletosPublicos();
    actualizarResumen();
}

// ==================== ACTUALIZAR RESUMEN ====================
function actualizarResumen() {
    const resumen = document.getElementById('resumenSeleccion');
    
    if (boletosSeleccionados.length > 0) {
        resumen.classList.remove('hidden');
        document.getElementById('cantidadSeleccionada').textContent = boletosSeleccionados.length;
        
        const total = boletosSeleccionados.length * rifaData.precioBoleto;
        document.getElementById('totalPagar').textContent = formatoMoneda(total);
    } else {
        resumen.classList.add('hidden');
    }
}

// ==================== MAQUINITA DE LA SUERTE ====================
async function maquinitaSuerte(cantidad) {
    try {
        const response = await fetch(`${API_URL}/api/public/suerte/${rifaId}/${cantidad}`);
        const data = await response.json();
        
        if (data.exito) {
            const resultado = document.getElementById('maquinitaResultado');
            resultado.classList.remove('hidden');
            
            // Animación de números apareciendo
            resultado.innerHTML = '';
            data.boletos.forEach((num, i) => {
                setTimeout(() => {
                    const span = document.createElement('span');
                    span.className = 'maquinita-numero';
                    span.textContent = num;
                    resultado.appendChild(span);
                }, i * 200);
            });
            
            // Seleccionar los boletos automáticamente
            setTimeout(() => {
                boletosSeleccionados = [...data.boletos];
                mostrarBoletosPublicos();
                actualizarResumen();
                mostrarToast(`¡${cantidad} boletos seleccionados por la suerte!`, 'success');
            }, data.boletos.length * 200 + 500);
            
        } else {
            mostrarToast(data.mensaje, 'warning');
        }
    } catch (error) {
        mostrarToast('Error en la maquinita de la suerte', 'error');
    }
}

// ==================== COMPRAR BOLETOS ====================
async function comprarBoletos(event) {
    event.preventDefault();
    
    if (boletosSeleccionados.length === 0) {
        mostrarAlerta('alertContainer', 'Selecciona al menos un boleto', 'warning');
        return;
    }
    
    const btn = document.getElementById('btnComprar');
    mostrarLoading(btn);
    
    try {
        const formData = new FormData();
        formData.append('rifaId', rifaId);
        formData.append('nombre', document.getElementById('compradorNombre').value);
        formData.append('telefono', document.getElementById('compradorTelefono').value);
        formData.append('boletos', JSON.stringify(boletosSeleccionados));
        
        const comprobante = document.getElementById('comprobantePago').files[0];
        if (comprobante) {
            formData.append('comprobante', comprobante);
        }
        
        const response = await fetch(`${API_URL}/api/public/comprar`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.exito) {
            mostrarToast('¡Boletos reservados exitosamente!', 'success');
            
            // Mostrar confirmación
            document.getElementById('seleccionBoletos').innerHTML = `
                <div class="card" style="padding: 2rem; text-align: center;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">🎉</div>
                    <h2>¡Boletos Reservados!</h2>
                    <p style="color: var(--gray); margin: 1rem 0;">
                        Tus boletos han sido reservados. El organizador validará tu pago pronto.
                    </p>
                    <div style="background: var(--light); padding: 1rem; border-radius: 8px; margin: 1rem 0;">
                        <p><strong>Boletos reservados:</strong> ${data.boletos.join(', ')}</p>
                        <p><strong>Total:</strong> ${formatoMoneda(boletosSeleccionados.length * rifaData.precioBoleto)}</p>
                    </div>
                    <p style="font-size: 0.9rem; color: var(--gray);">
                        Recibirás confirmación cuando tu pago sea validado.
                    </p>
                </div>
            `;
        } else {
            if (data.boletosOcupados) {
                mostrarAlerta('alertContainer', 
                    `Los boletos ${data.boletosOcupados.join(', ')} ya no están disponibles. Selecciona otros.`, 
                    'error'
                );
                // Recargar boletos
                await cargarRifaPublica();
                boletosSeleccionados = [];
            } else {
                mostrarAlerta('alertContainer', data.mensaje, 'error');
            }
        }
    } catch (error) {
        mostrarAlerta('alertContainer', 'Error al procesar la compra', 'error');
    } finally {
        ocultarLoading(btn);
    }
}

// ==================== MOSTRAR GANADOR ====================
function mostrarGanador(ganador) {
    document.getElementById('ganadorContainer').classList.remove('hidden');
    document.getElementById('numeroLoteriaGanador').textContent = rifaData.numeroLoteria;
    document.getElementById('ganadorNombre').textContent = ganador.nombre;
    document.getElementById('ganadorTelefono').textContent = ganador.telefono;
    document.getElementById('ganadorBoleto').textContent = '#' + ganador.numeroBoleto.numero;
}

// ==================== MOSTRAR ERROR ====================
function mostrarError() {
    document.getElementById('loadingRifa').classList.add('hidden');
    document.getElementById('rifaContent').classList.add('hidden');
    document.getElementById('errorRifa').classList.remove('hidden');
}
