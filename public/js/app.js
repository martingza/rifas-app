// ==================== CONFIGURACIÓN ====================
const API_URL = window.location.origin;

// ==================== UTILIDADES ====================

function obtenerToken() {
    return localStorage.getItem('rifas_token');
}

function guardarToken(token) {
    localStorage.setItem('rifas_token', token);
}

function eliminarToken() {
    localStorage.removeItem('rifas_token');
    localStorage.removeItem('rifas_user');
}

function guardarUsuario(usuario) {
    localStorage.setItem('rifas_user', JSON.stringify(usuario));
}

function obtenerUsuario() {
    const user = localStorage.getItem('rifas_user');
    return user ? JSON.parse(user) : null;
}

function authHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${obtenerToken()}`
    };
}

// ==================== TOAST NOTIFICATIONS ====================

function mostrarToast(mensaje, tipo = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    
    const iconos = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `
        <span>${iconos[tipo] || 'ℹ️'}</span>
        <span>${mensaje}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

// ==================== ALERTAS ====================

function mostrarAlerta(containerId, mensaje, tipo = 'info') {
    const alertContainer = document.getElementById(containerId) || document.getElementById('alertContainer');
    if (!alertContainer) return;
    
    const iconos = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    alertContainer.innerHTML = `
        <div class="alert alert-${tipo}">
            <span>${iconos[tipo]}</span>
            <span>${mensaje}</span>
        </div>
    `;
    
    setTimeout(() => {
        alertContainer.innerHTML = '';
    }, 5000);
}

// ==================== LOADING ====================

function mostrarLoading(boton) {
    if (boton) {
        boton.disabled = true;
        boton.dataset.originalText = boton.innerHTML;
        boton.innerHTML = '<span class="spinner"></span> Procesando...';
    }
}

function ocultarLoading(boton) {
    if (boton) {
        boton.disabled = false;
        boton.innerHTML = boton.dataset.originalText || boton.innerHTML;
    }
}

// ==================== AUTENTICACIÓN ====================

async function iniciarSesion(event) {
    event.preventDefault();
    
    const btn = document.getElementById('btnLogin');
    mostrarLoading(btn);
    
    try {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.exito) {
            guardarToken(data.token);
            guardarUsuario(data.usuario);
            mostrarToast('¡Inicio de sesión exitoso!', 'success');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);
        } else {
            mostrarAlerta('alertContainer', data.mensaje, 'error');
        }
    } catch (error) {
        mostrarAlerta('alertContainer', 'Error al conectar con el servidor', 'error');
    } finally {
        ocultarLoading(btn);
    }
}

async function registrarse(event) {
    event.preventDefault();
    
    const btn = document.getElementById('btnRegister');
    mostrarLoading(btn);
    
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;
    
    if (password !== passwordConfirm) {
        mostrarAlerta('alertContainer', 'Las contraseñas no coinciden', 'error');
        ocultarLoading(btn);
        return;
    }
    
    try {
        const nombre = document.getElementById('nombre').value;
        const telefono = document.getElementById('telefono').value;
        const email = document.getElementById('email').value;
        
        const response = await fetch(`${API_URL}/api/auth/registro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, telefono, email, password })
        });
        
        const data = await response.json();
        
        if (data.exito) {
            guardarToken(data.token);
            guardarUsuario(data.usuario);
            mostrarToast('¡Cuenta creada exitosamente!', 'success');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);
        } else {
            mostrarAlerta('alertContainer', data.mensaje, 'error');
        }
    } catch (error) {
        mostrarAlerta('alertContainer', 'Error al conectar con el servidor', 'error');
    } finally {
        ocultarLoading(btn);
    }
}

function cerrarSesion() {
    eliminarToken();
    mostrarToast('Sesión cerrada', 'info');
    setTimeout(() => {
        window.location.href = '/';
    }, 500);
}

// ==================== VERIFICAR SESIÓN ====================

function verificarSesion() {
    const token = obtenerToken();
    const user = obtenerUsuario();
    
    const navLogin = document.getElementById('navLogin');
    const navRegister = document.getElementById('navRegister');
    const navDashboard = document.getElementById('navDashboard');
    const navLogout = document.getElementById('navLogout');
    
    if (token && user) {
        if (navLogin) navLogin.classList.add('hidden');
        if (navRegister) navRegister.classList.add('hidden');
        if (navDashboard) navDashboard.classList.remove('hidden');
        if (navLogout) navLogout.classList.remove('hidden');
    } else {
        if (navLogin) navLogin.classList.remove('hidden');
        if (navRegister) navRegister.classList.remove('hidden');
        if (navDashboard) navDashboard.classList.add('hidden');
        if (navLogout) navLogout.classList.add('hidden');
    }
}

// ==================== MENÚ MÓVIL ====================

function toggleMenu() {
    const menu = document.getElementById('navMenu');
    menu.classList.toggle('active');
}

// ==================== FORMATO DE MONEDA ====================

function formatoMoneda(cantidad) {
    return '$' + Number(cantidad).toLocaleString('es-MX', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

// ==================== COPIAR AL PORTAPAPELES ====================

function copiarAlPortapapeles(texto) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(texto);
        mostrarToast('Copiado al portapapeles', 'success');
    } else {
        // Fallback para navegadores antiguos
        const textarea = document.createElement('textarea');
        textarea.value = texto;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        mostrarToast('Copiado al portapapeles', 'success');
    }
}

// ==================== FORMATEAR FECHA ====================

function formatearFecha(fecha) {
    const opciones = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(fecha).toLocaleDateString('es-MX', opciones);
}

// ==================== PROTEGER RUTA ====================

function protegerRuta() {
    if (!obtenerToken()) {
        window.location.href = '/login';
        return false;
    }
    return true;
}
