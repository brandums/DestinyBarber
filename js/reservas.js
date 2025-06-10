// Datos de los barberos
const barberos = [
    { id: 1, nombre: "Juan Pérez" },
    { id: 2, nombre: "Carlos Rojas" },
    { id: 3, nombre: "Abel Rosales" }
];

// Horarios disponibles
const horarios = [
    "9:00", "10:00", "11:00", "12:00", 
    "13:00", "14:00", "15:00", "16:00", "17:00"
];

// Fechas para los próximos 4 días (hoy + 3 días siguientes)
const today = new Date();
const dates = [
    new Date(today),
    new Date(today.setDate(today.getDate() + 1)),
    new Date(today.setDate(today.getDate() + 1)),
    new Date(today.setDate(today.getDate() + 1))
];

// Inicializar Swiper para días
const daysSwiper = new Swiper('.days-carousel', {
    slidesPerView: 1,
    spaceBetween: 20,
    pagination: {
        el: '.swiper-pagination',
        clickable: true,
    },
    navigation: {
        nextEl: '.days-navigation .swiper-button-next',
        prevEl: '.days-navigation .swiper-button-prev',
    },
    breakpoints: {
        768: {
            slidesPerView: 2,
        },
        1024: {
            slidesPerView: 1,
            spaceBetween: 0
        }
    }
});

// Formatear fechas
document.getElementById('today-date').textContent = formatDate(dates[0]);
document.getElementById('tomorrow-date').textContent = formatDate(dates[1]);
document.getElementById('day3-title').textContent = formatDate(dates[2], true);
document.getElementById('day4-title').textContent = formatDate(dates[3], true);

// Función para obtener reservas desde SheetDB
async function getReservasFromSheet() {
    try {
        const response = await fetch('https://sheetdb.io/api/v1/0714lohubsgvq');
        if (!response.ok) throw new Error('Error al obtener reservas');
        
        const data = await response.json();
        
        // Asegurarnos de que siempre trabajamos con un array
        if (Array.isArray(data)) {
            return data;
        } else if (data && typeof data === 'object') {
            return Object.values(data);
        } else {
            return [];
        }
    } catch (error) {
        console.error('Error obteniendo reservas:', error);
        return [];
    }
}

// Función para formatear fechas
function formatDate(date, includeWeekday = false) {
    const options = { 
        weekday: includeWeekday ? 'long' : undefined,
        day: 'numeric', 
        month: 'long' 
    };
    return date.toLocaleDateString('es-ES', options);
}

// Función para abrir WhatsApp
function openWhatsApp(number) {
    window.open(`https://wa.me/${number}`, '_blank');
}

// Función principal para generar los horarios
async function fetchAndGenerateTimeSlots() {
    try {
        const reservas = await getReservasFromSheet();
        
        if (!Array.isArray(reservas)) {
            console.error('Las reservas no son un array:', reservas);
            return;
        }

        const days = ['today', 'tomorrow', 'day3', 'day4'];
        
        days.forEach((day, index) => {
            const container = document.getElementById(`${day}-slots`);
            if (!container) return;
            
            container.innerHTML = '';
            
            const currentDate = formatDate(dates[index]);
            const reservasDelDia = reservas.filter(r => r.fecha === currentDate);
            // Crear contenedor de slots para este día
            const slotsContainer = document.createElement('div');
            slotsContainer.className = 'day-slots-container';
            container.appendChild(slotsContainer);

            horarios.forEach(time => {
                // Obtener reservas para este horario
                const reservasEnEsteHorario = reservasDelDia.filter(r => r.hora === time);
                const barberosOcupados = reservasEnEsteHorario.map(r => r.barbero);
                
                // Crear contenedor del horario
                const slot = document.createElement('div');
                slot.className = 'time-slot';
                
                // Contenedor superior (hora y contador)
                const topContainer = document.createElement('div');
                topContainer.className = 'time-slot-top';
                
                // Mostrar hora
                const timeElement = document.createElement('div');
                timeElement.className = 'time';
                timeElement.textContent = time;
                topContainer.appendChild(timeElement);
                
                // Mostrar contador de reservas si hay
                if (reservasEnEsteHorario.length > 0) {
                    const counter = document.createElement('div');
                    counter.className = 'reservations-counter';
                    counter.textContent = `${reservasEnEsteHorario.length}/${barberos.length}`;
                    topContainer.appendChild(counter);
                }
                
                slot.appendChild(topContainer);
                
                // Contenedor para el carrusel de reservas
                const reservationsContainer = document.createElement('div');
                reservationsContainer.className = 'reservations-carousel swiper';
                
                const swiperWrapper = document.createElement('div');
                swiperWrapper.className = 'swiper-wrapper';
                
                // Mostrar reservas existentes en carrusel
                if (reservasEnEsteHorario.length > 0) {
                    reservasEnEsteHorario.forEach(reserva => {
                        const slide = document.createElement('div');
                        slide.className = 'reservation-slide swiper-slide';
                        
                        slide.innerHTML = `
                            <div class="booked-info">
                            <span class="barber-name">${reserva.barbero}</span>
                            <span class="client-name">${reserva.nombre}</span>
                            <button class="whatsapp-btn" onclick="openWhatsApp('${reserva.telefono}')">
                                <i class="fab fa-whatsapp"></i> Contactar
                            </button>
                        </div>
                        `;
                        swiperWrapper.appendChild(slide);
                    });
                } else {
                    // Mostrar mensaje si no hay reservas
                    const slide = document.createElement('div');
                    slide.className = 'reservation-slide swiper-slide';
                    slide.innerHTML = '<div class="no-reservations">No hay reservas</div>';
                    swiperWrapper.appendChild(slide);
                }
                
                reservationsContainer.appendChild(swiperWrapper);
                
                // Añadir navegación si hay más de 1 reserva
                if (reservasEnEsteHorario.length > 1) {
                    const navigation = document.createElement('div');
                    navigation.className = 'reservations-navigation';
                    navigation.innerHTML = `
                        <div class="swiper-button-prev"></div>
                        <div class="swiper-pagination"></div>
                        <div class="swiper-button-next"></div>
                    `;
                    reservationsContainer.appendChild(navigation);
                }
                
                slot.appendChild(reservationsContainer);
                
                // Botón de reserva (si hay barberos disponibles)
                const barberosDisponibles = barberos.filter(b => !barberosOcupados.includes(b.nombre));
                if (barberosDisponibles.length > 0) {
                    const reserveBtn = document.createElement('button');
                    reserveBtn.className = 'btn btn-outline';
                    reserveBtn.textContent = 'Reservar';
                    reserveBtn.onclick = () => openReservaModal(time, currentDate, barberosOcupados);
                    slot.appendChild(reserveBtn);
                    slot.classList.add('available');
                } else {
                    slot.classList.add('booked');
                }
                
                slotsContainer.appendChild(slot);
                
                // Inicializar carrusel de reservas
                if (reservasEnEsteHorario.length > 0) {
                    new Swiper(reservationsContainer, {
                        slidesPerView: 1,
                        spaceBetween: 5,
                        pagination: {
                            el: reservationsContainer.querySelector('.swiper-pagination'),
                            clickable: true,
                        },
                        navigation: {
                            nextEl: reservationsContainer.querySelector('.swiper-button-next'),
                            prevEl: reservationsContainer.querySelector('.swiper-button-prev'),
                        },
                        autoHeight: true,
                    });
                }
            });
        });
    } catch (error) {
        console.error('Error en fetchAndGenerateTimeSlots:', error);
    }
}

// Función para abrir modal de reserva
async function openReservaModal(time, date, barberosOcupados = []) {
    // Si no se proporcionan barberos ocupados, los obtenemos
    if (barberosOcupados.length === 0) {
        const reservasDelDia = await getReservasDelDia(date);
        const reservasEnEsteHorario = reservasDelDia.filter(r => r.hora === time);
        barberosOcupados = reservasEnEsteHorario.map(r => r.barbero);
    }
    
    document.getElementById('selected-time').value = time;
    document.getElementById('selected-date').value = date;
    
    // Llenar select solo con barberos disponibles
    const select = document.getElementById('barber-select');
    select.innerHTML = '';
    
    barberos.forEach(barbero => {
        if (!barberosOcupados.includes(barbero.nombre)) {
            const option = document.createElement('option');
            option.value = barbero.id;
            option.textContent = barbero.nombre;
            select.appendChild(option);
        }
    });
    
    // Mostrar mensaje si no hay barberos disponibles
    if (select.options.length === 0) {
        select.innerHTML = '<option value="">No hay barberos disponibles</option>';
        select.disabled = true;
    } else {
        select.disabled = false;
    }
    
    document.getElementById('reserva-modal').style.display = 'flex';
}

// Función para obtener reservas de un día específico
async function getReservasDelDia(fecha) {
    const reservas = await getReservasFromSheet();
    return reservas.filter(r => r.fecha === fecha);
}

// Guardar reserva en SheetDB
document.getElementById('reserva-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const reserva = {
        fecha: document.getElementById('selected-date').value,
        hora: document.getElementById('selected-time').value,
        nombre: document.getElementById('client-name').value,
        telefono: document.getElementById('client-phone').value,
        barbero_id: document.getElementById('barber-select').value,
        barbero: barberos.find(b => b.id == document.getElementById('barber-select').value).nombre,
        estado: "confirmado"
    };
    
    try {
        const response = await fetch('https://sheetdb.io/api/v1/0714lohubsgvq', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data: [reserva] })
        });
        
        if (response.ok) {
            alert('¡Reserva confirmada!');
            document.getElementById('reserva-modal').style.display = 'none';
            await fetchAndGenerateTimeSlots();
        } else {
            throw new Error('Error al guardar');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Hubo un error al guardar la reserva. Por favor intenta nuevamente.');
    }
});

// Cerrar modal
document.querySelector('.close-modal').addEventListener('click', () => {
    document.getElementById('reserva-modal').style.display = 'none';
});

// Inicializar
document.addEventListener('DOMContentLoaded', async () => {
    await fetchAndGenerateTimeSlots();
});