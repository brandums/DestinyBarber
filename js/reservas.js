// URL base de tu Google Apps Script
const API_URL = 'https://script.google.com/macros/s/AKfycbyoJkCw2y_5y8KpWrxO9cID2qy4VLy82ttlefHaApLX_JbMXKlZqu91eOjlyaGJIeOl/exec';

// Variables globales para almacenar los datos
let globalReservas = [];
let globalBarberos = [];
let isDataLoaded = false;

// Horarios disponibles
const horarios = [
    "09:00", "10:00", "11:00", "12:00", 
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"
];

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

// Función para cargar todos los datos al iniciar
async function loadAllData() {
    try {
        const response = await fetch(`${API_URL}?action=getAllData`);
        if (!response.ok) throw new Error('Error al obtener datos');
        
        const data = await response.json();
        globalReservas = Array.isArray(data.reservas) ? data.reservas : [];
        globalBarberos = Array.isArray(data.barberos) ? data.barberos : [];
        isDataLoaded = true;
        
        // Inicializar la UI una vez que los datos están cargados
        generateDaysRow();
    } catch (error) {
        console.error('Error cargando datos:', error);
        // Mostrar algún mensaje de error al usuario
    }
}

// Función para generar los días en la fila
function generateDaysRow() {
    const daysRow = document.querySelector('.days-row');
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    daysRow.innerHTML = '';
    
    // Generar 6 días (hoy + 5 siguientes)
    for (let i = 0; i < 6; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        
        const dayCard = document.createElement('div');
        dayCard.className = 'day-card';
        if (i === 0) dayCard.classList.add('active');
        
        dayCard.innerHTML = `
            <div class="day-name">${i === 0 ? 'Hoy' : dayNames[date.getDay()]}</div>
            <div class="day-number">${date.getDate()}</div>
        `;
        
        dayCard.addEventListener('click', () => {
            document.querySelectorAll('.day-card').forEach(card => card.classList.remove('active'));
            dayCard.classList.add('active');
            updateDayContent(date, i);
        });
        
        daysRow.appendChild(dayCard);
    }
    
    // Mostrar contenido del primer día (hoy) por defecto
    updateDayContent(new Date(), 0);
}

// Función para actualizar el contenido del día seleccionado
function updateDayContent(date, dayIndex) {
    if (!isDataLoaded) return;
    
    const dayContentContainer = document.querySelector('.day-content-container');
    const formattedDate = formatDate(date);
    
    dayContentContainer.innerHTML = `
        <h3 class="day-content-title">${dayIndex === 0 ? 'Hoy' : dayIndex === 1 ? 'Mañana' : ''}, ${formattedDate}</h3>
        <div class="day-slots-container" id="day-${dayIndex}-slots"></div>
    `;
    
    generateTimeSlotsForDay(date, dayIndex);
}

// Función para generar los slots de tiempo para un día específico
function generateTimeSlotsForDay(date, dayIndex) {
    if (!isDataLoaded) return;
    
    const container = document.getElementById(`day-${dayIndex}-slots`);
    if (!container) return;
    
    const currentDate = formatDate(date);
    const reservasDelDia = globalReservas.filter(r => r.fecha === currentDate);
    
    container.innerHTML = '';
    
    horarios.forEach(time => {
        const reservasEnEsteHorario = reservasDelDia.filter(r => r.hora === time);
        const barberosOcupados = reservasEnEsteHorario.map(r => r.barbero);
        
        const slot = document.createElement('div');
        slot.className = 'time-slot';
        
        const topContainer = document.createElement('div');
        topContainer.className = 'time-slot-top';
        
        const timeElement = document.createElement('div');
        timeElement.className = 'time';
        timeElement.textContent = time;
        topContainer.appendChild(timeElement);
        
        if (reservasEnEsteHorario.length > 0) {
            const counter = document.createElement('div');
            counter.className = 'reservations-counter';
            counter.textContent = `${reservasEnEsteHorario.length}/${globalBarberos.length}`;
            topContainer.appendChild(counter);
        }
        
        slot.appendChild(topContainer);
        
        const reservationsContainer = document.createElement('div');
        reservationsContainer.className = 'reservations-carousel swiper';
        
        const swiperWrapper = document.createElement('div');
        swiperWrapper.className = 'swiper-wrapper';
        
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
            const slide = document.createElement('div');
            slide.className = 'reservation-slide swiper-slide';
            slide.innerHTML = '<div class="no-reservations">No hay reservas</div>';
            swiperWrapper.appendChild(slide);
        }
        
        reservationsContainer.appendChild(swiperWrapper);
        
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
        
        const barberosDisponibles = globalBarberos.filter(b => !barberosOcupados.includes(b.nombre));
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
        
        container.appendChild(slot);
        
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
}

// Función para abrir modal de reserva
function openReservaModal(time, date, barberosOcupados = []) {
    document.getElementById('selected-time').value = time;
    document.getElementById('selected-date').value = date;
    
    // Llenar select solo con barberos disponibles
    const select = document.getElementById('barber-select');
    select.innerHTML = '';
    
    globalBarberos.forEach(barbero => {
        if (!barberosOcupados.includes(barbero.nombre)) {
            const option = document.createElement('option');
            option.value = barbero.id || barbero.nombre; // Usar ID o nombre si no hay ID
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

// Función para obtener reservas de un día específico (ahora usa los datos globales)
function getReservasDelDia(fecha) {
    return globalReservas.filter(r => r.fecha === fecha);
}

// Guardar reserva en Google Sheets
document.getElementById('reserva-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const barberoSelect = document.getElementById('barber-select');
    const barberoNombre = barberoSelect.options[barberoSelect.selectedIndex].text;
    
    const reserva = {
        fecha: document.getElementById('selected-date').value,
        hora: document.getElementById('selected-time').value,
        nombre: document.getElementById('client-name').value,
        telefono: document.getElementById('client-phone').value,
        barbero: barberoNombre
    };
    
    // Verificar solo reservas futuras o de hoy
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Normalizar a inicio del día
    
    const tieneReservaActiva = globalReservas.some(r => {
        if (r.telefono === reserva.telefono) {
            // Convertir fecha de reserva a objeto Date
            const partesFecha = r.fecha.split(' de ');
            const meses = {
                'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
                'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
            };
            
            const dia = parseInt(partesFecha[0]);
            const mes = meses[partesFecha[1].toLowerCase()];
            const año = hoy.getFullYear(); // Asumimos año actual
            
            const fechaReserva = new Date(año, mes, dia);
            
            // Comparar con la fecha actual (solo día, sin hora)
            return fechaReserva >= hoy;
        }
        return false;
    });

    if(tieneReservaActiva) {
        alert('¡Ya tienes una reserva activa para hoy o días futuros!');
        document.getElementById('reserva-modal').style.display = 'none';
        return;
    }
    
    try {
        const formData = new URLSearchParams();
        formData.append("nombre", reserva.nombre);
        formData.append("telefono", reserva.telefono);
        formData.append("barbero", reserva.barbero);
        formData.append("fecha", reserva.fecha);
        formData.append("hora", reserva.hora);

        await fetch(API_URL, {
        method: 'POST',
        body: formData
        });

        
        const result = await response.json();

        if (result.ok) {
            alert('¡Reserva confirmada!');
            document.getElementById('reserva-modal').style.display = 'none';

            await loadAllData(); // Actualiza los datos

            const activeDay = document.querySelector('.day-card.active');
            const dayIndex = Array.from(document.querySelectorAll('.day-card')).indexOf(activeDay);
            const date = new Date();
            date.setDate(date.getDate() + dayIndex);
            updateDayContent(date, dayIndex);
        } else {
            alert('Error al guardar la reserva: ' + (result.error || 'Inténtalo nuevamente.'));
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
document.addEventListener('DOMContentLoaded', () => {
    loadAllData(); // Cargar todos los datos al iniciar
});