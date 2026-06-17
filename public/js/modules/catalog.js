/**
 * Módulo de catálogo público: listado y filtros de espacios.
 */
const CatalogModule = {
    filterLatitude: null,
    filterLongitude: null,

    init() {
        document.getElementById('btn-refresh-catalog')?.addEventListener('click', () => this.clearFilters());
        document.getElementById('filter-form')?.addEventListener('submit', (e) => this.applyFilters(e));
        document.getElementById('btn-get-gps')?.addEventListener('click', () => this.activateGps());
    },

    async load() {
        const container = document.getElementById('spaces-list');
        if (!container) return;

        container.innerHTML = '<p class="placeholder-text">Cargando espacios...</p>';

        try {
            const spaces = await ApiService.getSpaces();
            UI.logConsole('Catálogo cargado', { total: spaces.length });
            this.renderSpaces(spaces, container);
        } catch (err) {
            container.innerHTML = `<p class="error-text">No se pudo cargar el catálogo: ${err.message}</p>`;
            UI.logConsole(`Error en catálogo: ${err.message}`);
        }
    },

    renderSpaces(spaces, container) {
        container.innerHTML = '';

        if (!spaces?.length) {
            container.innerHTML = '<p class="placeholder-text">No hay espacios disponibles en este momento.</p>';
            return;
        }

        spaces.forEach((space) => {
            container.appendChild(this.createSpaceCard(space));
        });
    },

    createSpaceCard(space) {
        const id = space.idSpace || space.id;
        const card = document.createElement('article');
        card.className = 'card space-card';

        card.innerHTML = `
            <header class="card-header">
                <h4>${space.nameSpace || 'Espacio sin nombre'}</h4>
                <span class="badge badge-neutral">#${id}</span>
            </header>
            <p class="card-description">${space.description || 'Sin descripción.'}</p>
            <div class="card-meta">
                <span><strong>Precio base:</strong> ${UI.formatCurrency(space.basePrice)}</span>
                <span><strong>Política:</strong> ${UI.getCancellationPolicy(space)}</span>
            </div>
            <div class="card-actions">
                <button class="btn btn-primary btn-block" data-action="reserve" data-space-id="${id}">
                    Reservar
                </button>
                <button class="btn btn-secondary btn-block" data-action="reviews" data-space-id="${id}">
                    Ver reseñas
                </button>
            </div>
            <div id="reviews-section-${id}" class="reviews-panel" hidden>
                <h6>Reseñas de usuarios</h6>
                <div id="reviews-list-${id}" class="reviews-list">
                    <p class="placeholder-text">Cargando reseñas...</p>
                </div>
            </div>
        `;

        card.querySelector('[data-action="reserve"]')?.addEventListener('click', () => {
            ReservationsModule.selectSpace(id);
        });

        card.querySelector('[data-action="reviews"]')?.addEventListener('click', () => {
            CommentsModule.toggleReviews(id);
        });

        return card;
    },

    activateGps() {
        const btn = document.getElementById('btn-get-gps');
        const status = document.getElementById('gps-status');
        const radiusInput = document.getElementById('filter-radius');

        if (!navigator.geolocation) {
            UI.showError('Tu navegador no soporta geolocalización.');
            return;
        }

        status.textContent = 'Obteniendo ubicación...';
        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.filterLatitude = position.coords.latitude;
                this.filterLongitude = position.coords.longitude;
                status.textContent = `Ubicación activa (${this.filterLatitude.toFixed(4)}, ${this.filterLongitude.toFixed(4)})`;
                btn?.classList.add('btn-success');
                radiusInput.disabled = false;
            },
            () => {
                status.textContent = 'No se pudo obtener la ubicación.';
                this.filterLatitude = null;
                this.filterLongitude = null;
                radiusInput.disabled = true;
                UI.showError('Permiso de ubicación denegado o no disponible.');
            }
        );
    },

    clearFilters() {
        document.getElementById('filter-form')?.reset();
        this.filterLatitude = null;
        this.filterLongitude = null;

        const status = document.getElementById('gps-status');
        const btn = document.getElementById('btn-get-gps');
        const radiusInput = document.getElementById('filter-radius');

        if (status) status.textContent = 'GPS desactivado';
        btn?.classList.remove('btn-success');
        if (radiusInput) {
            radiusInput.disabled = true;
            radiusInput.value = '5.0';
        }

        this.load();
    },

    async applyFilters(event) {
        event.preventDefault();

        const filterDto = {
            nameSpace: document.getElementById('filter-name').value.trim() || null,
            minPrice: parseFloat(document.getElementById('filter-min-price').value) || null,
            maxPrice: parseFloat(document.getElementById('filter-max-price').value) || null,
            idLocation: parseInt(document.getElementById('filter-location-id').value, 10) || null,
            idConsumerOwner: null,
            lat: this.filterLatitude,
            lng: this.filterLongitude,
            radious: this.filterLatitude
                ? parseFloat(document.getElementById('filter-radius').value)
                : null,
        };

        const container = document.getElementById('spaces-list');
        container.innerHTML = '<p class="placeholder-text">Aplicando filtros...</p>';

        try {
            UI.logConsole('Filtros enviados', filterDto);
            const spaces = await ApiService.filterSpaces(filterDto);
            this.renderSpaces(spaces, container);
        } catch (err) {
            container.innerHTML = `<p class="error-text">Error al filtrar: ${err.message}</p>`;
        }
    },
};
