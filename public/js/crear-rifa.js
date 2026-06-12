// ==================== VERIFICAR AUTENTICACIÓN ====================
if (!protegerRuta()) {
    // La función ya redirige
}

// ==================== VARIABLES ====================
let fotosSeleccionadas = [];

// ==================== EVENTOS ====================
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('cantidadBoletos').addEventListener('input', calcularTotal);
    document.getElementById('precioBoleto').addEventListener('input', calcularTotal);
    document.getElementById('fotos').addEventListener('change', previewImagenes);
});

// ==================== CALCULAR TOTAL ====================
function calcularTotal() {
    const cantidad = parseInt(document.getElementById('cantidadBoletos').value) || 0;
    const precio = parseFloat(document.getElementById('precioBoleto').value) || 0;
    const total = cantidad * precio;
    
    document.getElementById('totalRecaudar').textContent = formatoMoneda(total);
}

// ==================== PREVIEW DE IMÁGENES ====================
function previewImagenes(event) {
    const files = event.target.files;
    const container = document.getElementById('previewContainer');
    
    if (files.length > 5) {
        mostrarAlerta('alertContainer', 'Máximo 5 imágenes permitidas', 'warning');
        event.target.value = '';
        return;
    }
    
    fotosSeleccionadas = [];
    container.innerHTML = '';
    container.style.display = 'none';
    
    Array.from(files).forEach((file, index) => {
        if (!file.type.startsWith('image/')) {
            mostrarAlerta('alertContainer', 'Solo se permiten imágenes', 'error');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            mostrarAlerta('alertContainer', `La imagen ${file.name} excede 5MB`, 'error');
            return;
        }
        
        fotosSeleccionadas.push(file);
        
        const reader = new FileReader();
        reader.onload = function(e) {
            container.style.display = 'grid';
            const div = document.createElement('div');
            div.className = 'galeria-item';
            div.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <button type="button" class="eliminar-foto" onclick="eliminarFoto(${index})">&times;</button>
            `;
            container.appendChild(div);
        };
        reader.readAsDataURL(file);
    });
}

// ==================== ELIMINAR FOTO ====================
function eliminarFoto(index) {
    fotosSeleccionadas.splice(index, 1);
    
    const dt = new DataTransfer();
    fotosSeleccionadas.forEach(foto => dt.items.add(foto));
    document.getElementById('fotos').files = dt.files;
    
    const container = document.getElementById('previewContainer');
    if (container.children[index]) {
        container.children[index].remove();
    }
    
    if (fotosSeleccionadas.length === 0) {
        container.style.display = 'none';
    }
}

// ==================== CREAR RIFA ====================
async function crearRifa(event) {
    event.preventDefault();
    
    const btn = document.getElementById('btnCrear');
    mostrarLoading(btn);
    
    try {
        const formData = new FormData();
        formData.append('titulo', document.getElementById('titulo').value);
        formData.append('descripcion', document.getElementById('descripcion').value);
        formData.append('premio', document.getElementById('premio').value);
        formData.append('cantidadBoletos', document.getElementById('cantidadBoletos').value);
        formData.append('precioBoleto', document.getElementById('precioBoleto').value);
        
        // Agregar fotos
        const fotosInput = document.getElementById('fotos');
        Array.from(fotosInput.files).forEach(foto => {
            formData.append('fotos', foto);
        });
        
        const response = await fetch(`${API_URL}/api/raffles/crear`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${obtenerToken()}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (data.exito) {
            mostrarToast('¡Rifa creada exitosamente!', 'success');
            setTimeout(() => {
                window.location.href = '/administrar/' + data.rifa._id;
            }, 1500);
        } else {
            mostrarAlerta('alertContainer', data.mensaje, 'error');
        }
    } catch (error) {
        mostrarAlerta('alertContainer', 'Error al crear la rifa: ' + error.message, 'error');
    } finally {
        ocultarLoading(btn);
    }
}
