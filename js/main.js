// =============================================
// FUNCIONES GLOBALES PARA TODA LA WEB
// =============================================
// Mostrar loader al cargar la página
window.addEventListener('load', function() {
    const loader = document.querySelector('.loader-container');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => loader.remove(), 500);
    }
});


document.addEventListener('DOMContentLoaded', function() {
    // ----------------------------
    // 1. MENÚ HAMBURGUESA RESPONSIVE
    // ----------------------------
    const menuToggle = document.querySelector('.menu-toggle');
    const navbar = document.querySelector('.navbar');
    
    if (menuToggle && navbar) {
        menuToggle.addEventListener('click', function() {
            navbar.classList.toggle('active');
            // Cambiar icono (☰ → ✕)
            menuToggle.innerHTML = navbar.classList.contains('active') 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
        });
    }

    // ----------------------------
    // 2. SCROLL SUAVE PARA NAVEGACIÓN
    // ----------------------------
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
                });
                
                // Cerrar menú móvil si está abierto
                if (navbar && navbar.classList.contains('active')) {
                    navbar.classList.remove('active');
                    menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
                }
            }
        });
    });


    document.querySelectorAll('.navbar a').forEach(link => {
        link.addEventListener('click', () => {
            if (navbar.classList.contains('active')) {
                navbar.classList.remove('active');
                menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
    });

    // ----------------------------
    // 3. HEADER CON SCROLL (Efecto de cambio)
    // ----------------------------
    const header = document.querySelector('.header');
    if (header) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // ----------------------------
    // 4. LIMPIAR RESERVAS PASADAS (Se ejecuta al cargar)
    // ----------------------------
    if (window.location.pathname.includes('reservas')) {
        const hoy = new Date().toLocaleDateString('es-ES');
        let reservas = JSON.parse(localStorage.getItem('reservas') || '[]');
        
        // Filtrar solo reservas futuras o de hoy
        reservas = reservas.filter(reserva => {
            return reserva.fecha >= hoy;
        });

        localStorage.setItem('reservas', JSON.stringify(reservas));
    }
});

// =============================================
// FUNCIÓN PARA FORMATEAR FECHAS (Usada en reservas.js)
// =============================================
function formatDate(date, includeWeekday = false) {
    const options = { 
        weekday: includeWeekday ? 'long' : undefined,
        day: 'numeric', 
        month: 'long' 
    };
    return date.toLocaleDateString('es-ES', options);
}





/**
 * Elimina todas las reservas de días anteriores al actual
 * @returns {Promise<void>}
 */
async function eliminarReservasAntiguas() {
    try {
        const response = await fetch('https://sheetdb.io/api/v1/0714lohubsgvq');
        if (!response.ok) throw new Error('Error al obtener reservas');
        
        const todasLasReservas = await response.json();
        if (!Array.isArray(todasLasReservas)) return;

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        const reservasAEliminar = todasLasReservas.filter(reserva => {
            try {
                const [dia, mes, año] = reserva.fecha.split(' de ');
                const meses = {
                    'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3,
                    'mayo': 4, 'junio': 5, 'julio': 6, 'agosto': 7,
                    'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
                };
                const fechaReserva = new Date(año, meses[mes.toLowerCase()], dia);
                
                return fechaReserva < hoy;
            } catch (error) {
                console.error('Error al procesar fecha:', reserva.fecha, error);
                return false;
            }
        });

        if (reservasAEliminar.length > 0) {
            const idsAEliminar = reservasAEliminar.map(r => r.id).join(',');
            
            const deleteResponse = await fetch(`https://sheetdb.io/api/v1/0714lohubsgvq?id=${idsAEliminar}`, {
                method: 'DELETE'
            });
            
            if (!deleteResponse.ok) {
                throw new Error('Error al eliminar reservas antiguas');
            }
            
            console.log(`Eliminadas ${reservasAEliminar.length} reservas antiguas`);
        } else {
            console.log('No hay reservas antiguas para eliminar');
        }
    } catch (error) {
        console.error('Error en eliminarReservasAntiguas:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    eliminarReservasAntiguas().catch(console.error);
});