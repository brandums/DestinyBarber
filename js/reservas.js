// Datos de ejemplo
const barberos = [
    { id: 1, nombre: "Juan Pérez" },
    { id: 2, nombre: "Carlos Rojas" },
    { id: 3, nombre: "Abel Rosales" }
];

const horarios = [
    "09:00", "10:00", "11:00", "12:00", 
    "13:00", "14:00", "15:00", "16:00", "17:00"
];

// Inicializar Swiper
const swiper = new Swiper('.days-carousel', {
    slidesPerView: 1,
    spaceBetween: 20,
    pagination: {
        el: '.swiper-pagination',
        clickable: true,
    },
    breakpoints: {
        768: {
            slidesPerView: 2,
        },
        1024: {
            slidesPerView: 3,
        }
    }
});

// Fechas
const today = new Date();
const dates = [
    today,
    new Date(today.setDate(today.getDate() + 1)),
    new Date(today.setDate(today.getDate() + 1)),
    new Date(today.setDate(today.getDate() + 1))
];

// Formatear fechas
document.getElementById('today-date').textContent = formatDate(dates[0]);
document.getElementById('tomorrow-date').textContent = formatDate(dates[1]);
document.getElementById('day3-title').textContent = formatDate(dates[2], true);
document.getElementById('day4-title').textContent = formatDate(dates[3], true);

// Generar slots de tiempo
function generateTimeSlots() {
    const days = ['today', 'tomorrow', 'day3', 'day4'];
    
    days.forEach((day, index) => {
        const container = document.getElementById(`${day}-slots`);
        container.innerHTML = '';
        
        horarios.forEach(time => {
            const reservasDelDia = getReservasDelDia(formatDate(dates[index]));
            const reservaEnEsteHorario = reservasDelDia.find(r => r.time === time);
            
            const slot = document.createElement('div');
            slot.className = `time-slot ${reservaEnEsteHorario ? 'booked' : 'available'}`;
            
            if (reservaEnEsteHorario) {
                slot.innerHTML = `
                    <div class="time">${time}</div>
                    <div class="booked-info">
                        ${reservaEnEsteHorario.barbero}
                    </div>
                    <div class="booked-info">
                        ${reservaEnEsteHorario.nombre}
                    </div>
                    <button class="whatsapp-btn" onclick="openWhatsApp('${reservaEnEsteHorario.celular}')">
                        <i class="fab fa-whatsapp"></i> Contactar
                    </button>
                `;
            } else {
                slot.innerHTML = `
                    <div class="time">${time}</div>
                    <button class="btn btn-outline" onclick="openReservaModal('${time}', '${formatDate(dates[index])}')">
                        Reservar
                    </button>
                `;
            }
            
            container.appendChild(slot);
        });
    });
}

// Funciones auxiliares
function formatDate(date, includeWeekday = false) {
    const options = { 
        weekday: includeWeekday ? 'long' : undefined,
        day: 'numeric', 
        month: 'long' 
    };
    return date.toLocaleDateString('es-ES', options);
}

function openReservaModal(time, date) {
    document.getElementById('selected-time').value = time;
    document.getElementById('selected-date').value = date;
    
    // Llenar select de barberos disponibles
    const select = document.getElementById('barber-select');
    select.innerHTML = '';
    
    const reservasDelDia = getReservasDelDia(date);
    const barberosOcupados = reservasDelDia
        .filter(r => r.time === time)
        .map(r => r.barberoId);
    
    barberos.forEach(barbero => {
        if (!barberosOcupados.includes(barbero.id)) {
            const option = document.createElement('option');
            option.value = barbero.id;
            option.textContent = barbero.nombre;
            select.appendChild(option);
        }
    });
    
    document.getElementById('reserva-modal').style.display = 'flex';
}

function openWhatsApp(number) {
    window.open(`https://wa.me/${number}`, '_blank');
}

// Guardar reserva (simulación con localStorage)
document.getElementById('reserva-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const reserva = {
        fecha: document.getElementById('selected-date').value,
        time: document.getElementById('selected-time').value,
        nombre: document.getElementById('client-name').value,
        apellido: document.getElementById('client-lastname').value,
        celular: document.getElementById('client-phone').value,
        barberoId: document.getElementById('barber-select').value,
        barbero: barberos.find(b => b.id == document.getElementById('barber-select').value).nombre
    };
    
    // Guardar en localStorage
    const reservas = JSON.parse(localStorage.getItem('reservas') || []);
    reservas.push(reserva);
    localStorage.setItem('reservas', JSON.stringify(reservas));
    
    // Recargar slots
    generateTimeSlots();
    document.getElementById('reserva-modal').style.display = 'none';
    alert('¡Reserva confirmada!');
});

// Cerrar modal
document.querySelector('.close-modal').addEventListener('click', () => {
    document.getElementById('reserva-modal').style.display = 'none';
});

// Obtener reservas del día
function getReservasDelDia(date) {
    const reservas = JSON.parse(localStorage.getItem('reservas') || []);
    return reservas.filter(r => r.fecha === date);
}

// Inicializar
generateTimeSlots();