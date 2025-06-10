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