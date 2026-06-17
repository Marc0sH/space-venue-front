/**
 * Módulo de reservas: creación y listado del usuario.
 */
const ReservationsModule = {
    currentSpaceBasePrice: 0,

    init() {
        document.getElementById('form-create-reservation')?.addEventListener('submit', (e) => this.handleCreate(e));
        document.getElementById('btn-refresh-reservations')?.addEventListener('click', () => this.load());
    },

    async selectSpace(id) {
        App.navigateTo('view-reservations');
        document.getElementById('res-space-id').value = id;

        const checkboxContainer = document.getElementById('available-services-checkboxes');
        const submitBtn = document.querySelector('#form-create-reservation button[type="submit"]');

        checkboxContainer.innerHTML = '<p class="placeholder-text">Cargando servicios...</p>';
        document.getElementById('total-price-display').textContent = '$0.00';

        try {
            const space = await ApiService.getSpaceById(id);
            Auth.resolveConsumerIdFromEntity(space);

            this.currentSpaceBasePrice = parseFloat(space.basePrice) || 0;
            document.getElementById('total-price-display').textContent =
                UI.formatCurrency(this.currentSpaceBasePrice);

            const currentUserId = Auth.getConsumerId();
            const ownerId = UI.getOwnerId(space);

            if (currentUserId && ownerId && currentUserId === ownerId) {
                this.blockSelfReservation(submitBtn, checkboxContainer);
                return;
            }

            this.enableReservationForm(submitBtn);
            this.renderServiceCheckboxes(space, checkboxContainer);
            UI.logConsole(`Formulario de reserva preparado para espacio #${id}`);
        } catch (err) {
            checkboxContainer.innerHTML = `<p class="error-text">${err.message}</p>`;
            UI.showError('No se pudo cargar la información del espacio.');
        }
    },

    blockSelfReservation(submitBtn, container) {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'No podés reservar tu propio espacio';
            submitBtn.className = 'btn btn-danger btn-block';
        }

        container.innerHTML = `
            <div class="alert alert-warning">
                Sos el propietario de este espacio. El sistema impide auto-reservas.
            </div>
        `;
    },

    enableReservationForm(submitBtn) {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Confirmar reserva';
            submitBtn.className = 'btn btn-success btn-block';
        }
    },

    renderServiceCheckboxes(space, container) {
        container.innerHTML = '';
        const services = space.services || [];

        const activeServices = services.filter(
            (s) => s.isActive !== false && s.active !== false
        );

        if (!activeServices.length) {
            container.innerHTML = '<p class="text-muted">Este espacio no ofrece servicios adicionales.</p>';
            return;
        }

        activeServices.forEach((service) => {
            const serviceId = service.id || service.idSpaceService;
            const row = document.createElement('label');
            row.className = 'checkbox-row';

            row.innerHTML = `
                <input type="checkbox" class="chk-optional-service"
                       value="${serviceId}" data-price="${service.price}">
                <span>${service.description} (+${UI.formatCurrency(service.price)})</span>
            `;

            row.querySelector('input').addEventListener('change', () => this.recalculateTotal());
            container.appendChild(row);
        });
    },

    recalculateTotal() {
        let total = this.currentSpaceBasePrice;
        document.querySelectorAll('.chk-optional-service:checked').forEach((chk) => {
            total += parseFloat(chk.dataset.price) || 0;
        });
        document.getElementById('total-price-display').textContent = UI.formatCurrency(total);
    },

    async handleCreate(event) {
        event.preventDefault();

        const selectedServiceIds = Array.from(
            document.querySelectorAll('.chk-optional-service:checked')
        ).map((chk) => parseInt(chk.value, 10));

        const dto = {
            title: document.getElementById('res-title').value.trim(),
            description: document.getElementById('res-description').value.trim(),
            googleEventCode: null,
            fromDate: document.getElementById('res-from').value,
            untilDate: document.getElementById('res-to').value,
            status: 'TENTATIVE',
            saveToMyCalendar: document.getElementById('res-save-calendar').checked,
            idConsumer: Auth.getConsumerId() || 1,
            idSpace: parseInt(document.getElementById('res-space-id').value, 10),
            idServicesSelec: selectedServiceIds,
        };

        const submitBtn = event.target.querySelector('button[type="submit"]');
        UI.setLoading(submitBtn, true, 'Procesando...');

        try {
            const reservation = await ApiService.createReservation(dto);
            Auth.resolveConsumerIdFromEntity(reservation?.consumer);

            UI.showSuccess('Reserva registrada correctamente.');
            UI.logConsole('Reserva creada', reservation);

            event.target.reset();
            document.getElementById('available-services-checkboxes').innerHTML =
                '<p class="text-muted">Seleccioná un espacio del catálogo para ver sus servicios.</p>';
            document.getElementById('total-price-display').textContent = '$0.00';
            this.currentSpaceBasePrice = 0;

            this.load();
        } catch (err) {
            UI.showError(err.message || 'No se pudo crear la reserva.');
        } finally {
            UI.setLoading(submitBtn, false);
        }
    },

    async load() {
        const tbody = document.getElementById('reservations-tbody');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Cargando...</td></tr>';

        try {
            const reservations = await ApiService.getMyReservations();
            tbody.innerHTML = '';

            if (!reservations?.length) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center">No tenés reservas registradas.</td></tr>';
                return;
            }

            reservations.forEach((res) => {
                Auth.resolveConsumerIdFromEntity(res.consumer);
                tbody.appendChild(this.createRow(res));
            });
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center error-text">${err.message}</td></tr>`;
        }
    },

    createRow(reservation) {
        const tr = document.createElement('tr');
        const id = reservation.id || reservation.idReservation;
        const spaceId = reservation.space?.idSpace || reservation.idSpace;
        const spaceName = reservation.space?.nameSpace || `Espacio #${spaceId}`;
        const status = (reservation.status || 'TENTATIVE').toString().toUpperCase();
        const canComment = status === 'COMPLETED' || status === 'CONFIRMED';

        tr.innerHTML = `
            <td>#${id}</td>
            <td>${spaceName}</td>
            <td>${UI.formatCurrency(reservation.finalPrice)}</td>
            <td><span class="badge badge-status badge-${status.toLowerCase()}">${reservation.status}</span></td>
            <td>
                ${
                    canComment
                        ? `<button class="btn btn-sm btn-secondary" data-comment-space="${spaceId}">Comentar</button>`
                        : '<span class="text-muted">—</span>'
                }
            </td>
        `;

        tr.querySelector('[data-comment-space]')?.addEventListener('click', () => {
            CommentsModule.openForm(spaceId);
        });

        return tr;
    },
};
