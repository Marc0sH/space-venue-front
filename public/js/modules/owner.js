/**
 * Módulo del propietario: mapa, alta de espacios y listado propio.
 */
const OwnerModule = {
    map: null,
    marker: null,

    init() {
        this.initMap();
        document.getElementById('btn-add-service')?.addEventListener('click', () => this.addServiceRow());
        document.getElementById('form-create-space')?.addEventListener('submit', (e) => this.handleCreateSpace(e));
        document.getElementById('btn-refresh-owner-spaces')?.addEventListener('click', () => this.loadOwnedSpaces());
    },

    initMap() {
        const mapContainer = document.getElementById('map');
        if (!mapContainer || typeof L === 'undefined') return;

        const { defaultCenter, defaultZoom, tileUrl, tileAttribution } = APP_CONFIG.map;

        this.map = L.map('map').setView(defaultCenter, defaultZoom);
        L.tileLayer(tileUrl, { attribution: tileAttribution }).addTo(this.map);

        this.map.on('click', (e) => {
            const { lat, lng } = e.latlng;

            if (this.marker) {
                this.marker.setLatLng(e.latlng);
            } else {
                this.marker = L.marker(e.latlng).addTo(this.map);
            }

            document.getElementById('space-lat').value = lat;
            document.getElementById('space-lng').value = lng;
            UI.logConsole(`Coordenadas seleccionadas: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        });
    },

    invalidateMapSize() {
        if (this.map) {
            setTimeout(() => this.map.invalidateSize(), 200);
        }
    },

    addServiceRow() {
        const container = document.getElementById('services-container');
        const row = document.createElement('div');
        row.className = 'service-row';

        row.innerHTML = `
            <input type="text" class="service-desc" placeholder="Descripción del servicio" required>
            <input type="number" class="service-price" placeholder="Precio" min="0" step="0.01" required>
            <button type="button" class="btn btn-danger btn-sm btn-remove-service" aria-label="Eliminar servicio">×</button>
        `;

        row.querySelector('.btn-remove-service').addEventListener('click', () => row.remove());
        container.appendChild(row);
    },

    collectServices() {
        const services = [];
        document.querySelectorAll('.service-row').forEach((row) => {
            const description = row.querySelector('.service-desc').value.trim();
            const price = parseFloat(row.querySelector('.service-price').value);
            if (description && !isNaN(price)) {
                services.push({ description, price });
            }
        });
        return services;
    },

    async handleCreateSpace(event) {
        event.preventDefault();

        const lat = document.getElementById('space-lat').value;
        const lng = document.getElementById('space-lng').value;

        if (!lat || !lng) {
            UI.showError('Seleccioná una ubicación en el mapa antes de publicar.');
            return;
        }

        const submitBtn = event.target.querySelector('button[type="submit"]');
        UI.setLoading(submitBtn, true, 'Publicando...');

        const dto = {
            idConsumerOwner: Auth.getConsumerId() || 1,
            nameSpace: document.getElementById('space-title').value.trim(),
            description: document.getElementById('space-description').value.trim(),
            basePrice: parseFloat(document.getElementById('space-price').value),
            bufferTime: parseInt(document.getElementById('space-buffer').value, 10),
            active: true,
            cancellationPolicies: document.getElementById('space-cancellation').value,
            location: {
                latitude: parseFloat(lat),
                longitude: parseFloat(lng),
            },
            services: this.collectServices(),
        };

        try {
            await ApiService.createSpace(dto);
            UI.showSuccess('Espacio publicado correctamente.');
            UI.logConsole('Espacio creado', dto);

            event.target.reset();
            document.getElementById('services-container').innerHTML = '';
            this.resetMapMarker();
            this.loadOwnedSpaces();
        } catch (err) {
            UI.showError(err.message || 'No se pudo publicar el espacio.');
        } finally {
            UI.setLoading(submitBtn, false);
        }
    },

    resetMapMarker() {
        if (this.marker && this.map) {
            this.map.removeLayer(this.marker);
            this.marker = null;
        }
        document.getElementById('space-lat').value = '';
        document.getElementById('space-lng').value = '';
    },

    async loadOwnedSpaces() {
        const container = document.getElementById('owner-spaces-list');
        if (!container) return;

        container.innerHTML = '<p class="placeholder-text">Cargando tus espacios...</p>';

        try {
            const spaces = await ApiService.getOwnedSpaces();
            container.innerHTML = '';

            if (!spaces?.length) {
                container.innerHTML = '<p class="placeholder-text">Aún no tenés espacios publicados.</p>';
                return;
            }

            spaces.forEach((space) => {
                Auth.resolveConsumerIdFromEntity(space);
                container.appendChild(this.createOwnedCard(space));
            });

            UI.logConsole('Espacios propios cargados', { total: spaces.length });
        } catch (err) {
            container.innerHTML = `<p class="error-text">${err.message}</p>`;
        }
    },

    createOwnedCard(space) {
        const id = space.idSpace || space.id;
        const isActive = space.active !== false && space.isActive !== false;
        const card = document.createElement('article');
        card.className = 'card';

        card.innerHTML = `
            <h4>${space.nameSpace || 'Espacio'}</h4>
            <p class="text-muted">ID #${id}</p>
            <p><strong>Precio base:</strong> ${UI.formatCurrency(space.basePrice)}</p>
            <p><strong>Política:</strong> ${UI.getCancellationPolicy(space)}</p>
            <p><strong>Estado:</strong>
                <span class="badge ${isActive ? 'badge-success' : 'badge-danger'}">
                    ${isActive ? 'Activo' : 'Inactivo'}
                </span>
            </p>
        `;

        return card;
    },
};
