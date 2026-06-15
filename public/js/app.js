/**
 * Orquestador Central y Controlador de Eventos de la Aplicación (App Kernel)
 * Corregido y Adaptado a las Reglas de Negocio de Space & Venue
 */
document.addEventListener("DOMContentLoaded", () => {
    
    // VARIABLES GLOBALES PARA LEAFLET
    let spaceMap;
    let spaceMarker;

    // FUNCIÓN PARA INICIALIZAR EL MAPA DE LEAFLET
    function initLeafletMap() {
        const mapContainer = document.getElementById('map');
        if (!mapContainer) return;

        // 1. Centramos el mapa inicialmente en Argentina (puedes cambiar las coordenadas a tu ciudad)
        spaceMap = L.map('map').setView([-34.6037, -58.3816], 13);

        // 2. Cargamos las imágenes (tiles) gratuitas de OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(spaceMap);

        // 3. Escuchamos los clics en el mapa para capturar las coordenadas
        spaceMap.on('click', function(e) {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;

            // Mover o crear el marcador visual (Pin)
            if (spaceMarker) {
                spaceMarker.setLatLng(e.latlng);
            } else {
                spaceMarker = L.marker(e.latlng).addTo(spaceMap);
            }

            // Inyectar los valores reales en los inputs ocultos
            document.getElementById("space-lat").value = lat;
            document.getElementById("space-lng").value = lng;

            UI.logConsole(`📍 Coordenadas seleccionadas: Lat ${lat.toFixed(6)} | Lng ${lng.toFixed(6)}`);
        });
    }

    // Inicializamos el mapa de forma inmediata
    initLeafletMap();

    // Cuando el usuario navega, Leaflet necesita un "invalidateSize" si el contenedor estaba oculto
    document.getElementById("main-nav").addEventListener("click", (e) => {
        if (e.target.hasAttribute("data-view")) {
            const targetView = e.target.getAttribute("data-view");
            
            if (targetView === "view-admin") {
                const token = localStorage.getItem("jwt_token");
                if (!token || !isAdminToken(token)) {
                    UI.logConsole(`⛔ Acceso bloqueado a la vista protegida: ${targetView}`);
                    alert("⛔ Acceso denegado: Esta sección es exclusiva para administradores.");
                    UI.switchView("view-spaces"); // Forzamos redirección segura
                    loadCatalog();
                    return; // Frenamos por completo la ejecución del clic
                }
            }

            UI.switchView(targetView);

            // REGLA CRUCIAL: Si entra a ver los salones del Owner, refrescamos el mapa para que renderice el tamaño correcto
            if (targetView === "view-owner-spaces" && spaceMap) {
                setTimeout(() => spaceMap.invalidateSize(), 200);
            }

            if (targetView === "view-spaces") loadCatalog();
            if (targetView === "view-reservations") loadReservations();
            if (targetView === "view-notifications") loadNotifications();
        }
    });

    document.getElementById("nav-logout").addEventListener("click", () => {
        localStorage.removeItem("jwt_token");
        UI.updateNavbar(null);

        // Ocultar dinámicamente el botón de notificaciones añadido
        const badge = document.getElementById("notif-badge");
        if (badge) {
            badge.innerText = "";
            badge.style.display = "none";
        }

        gestionarNavegacionPorRol();
        UI.logConsole("Sesión destruida y credenciales revocadas del almacenamiento local.");
        UI.switchView("view-auth");
    });

    // Restaurar sesión persistente al refrescar la pantalla (F5)
    const savedToken = localStorage.getItem("jwt_token");
    if (savedToken) {
        UI.updateNavbar(savedToken);
        gestionarNavegacionPorRol();
        UI.logConsole("Token JWT detectado de una sesión previa activa. Sincronizando estado...");
        
        // SOLUCIÓN: Si está logueado va al catálogo, NO a la pantalla de Auth/Login
        UI.switchView("view-spaces"); 
        loadCatalog();
        loadNotifications();
        loadUnreadNotificationsCount();
    } else {
        // Si no hay sesión, limpiamos todo y lo mandamos al login de forma limpia
        localStorage.clear();
        UI.updateNavbar(null);
        gestionarNavegacionPorRol();
        UI.switchView("view-auth");
    }

    // ====== FORMULARIOS & ACCIONES EVENT DRIVEN ======

    // 1. Autenticación: Login
    document.getElementById("form-login").addEventListener("submit", async (e) => {
        e.preventDefault();
        const user = document.getElementById("login-username").value.trim();
        const pass = document.getElementById("login-password").value;

        try {
            console.log("Enviando Login Nativo para:", user);
            
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user, password: pass })
            });

            const data = await response.text(); // Leemos la respuesta como texto plano ("Bearer ...")
            console.log("Respuesta del servidor:", data);

            if (response.ok && data.includes("Bearer")) {
                const token = data.replace("Bearer ", "").trim();
                localStorage.setItem("jwt_token", token);

                UI.updateNavbar(token);
                gestionarNavegacionPorRol();
                loadNotifications();
                loadUnreadNotificationsCount();

                alert("¡Login exitoso!");
                UI.switchView("view-spaces");
                loadCatalog();
            } else {
                alert("Error en login: " + data);
            }
        } catch (err) {
            console.error("Error de red o JS en Login:", err);
        }
    });

    // 2. Formulario de Registro(Adaptado a RegistroDTO Record)
    document.getElementById("form-register").addEventListener("submit", async (e) => {
        e.preventDefault();

        // 1. Capturamos los valores de la pantalla
        const firstname = document.getElementById("reg-firstname").value.trim();
        const lastname = document.getElementById("reg-lastname").value.trim();
        const email = document.getElementById("reg-email").value.trim();
        const phone = document.getElementById("reg-phone").value.trim();
        const username = document.getElementById("reg-username").value.trim();
        const password = document.getElementById("reg-password").value;

        // 2. Estructuramos el JSON PLANO que machea con los componentes del Record
        const registroPayload = {
            firstname: firstname,
            lastname: lastname,
            email: email,
            phone: phone,
            username: username,
            password: password
        };

        try {
            console.log("Enviando Registro con Record DTO para:", username);

            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registroPayload) // Se envía plano
            });

            const data = await response.text();
            console.log("Respuesta del servidor al registro:", data);

            if (response.ok) {
                alert("¡Usuario y perfil registrados con éxito!");
                document.getElementById("form-register").reset();
            } else {
                alert("Error del backend al registrar: " + data);
            }
        } catch (err) {
            console.error("Error de red o JS en Registro:", err);
        }
    });

    // 3. Catálogo de Espacios
    document.getElementById("btn-refresh-catalog").addEventListener("click", loadCatalog);
    
    async function loadCatalog() {
        try {
            const spaces = await ApiService.getSpaces();
            UI.logConsole("Catálogo obtenido desde el servidor backend", spaces);
            const container = document.getElementById("spaces-list");
            container.innerHTML = "";
            
            if(!spaces.length) {
                container.innerHTML = "<p class='placeholder-text'>No se registran salones activos.</p>";
                return;
            }

            spaces.forEach(s => {
                const card = document.createElement("div");
                card.className = "card";
                card.innerHTML = `
                    <h4>${s.nameSpace || s.title || 'Salón Comercial'}</h4>
                    <p style="color: var(--text-muted)">ID de Salón: ${s.idSpace || s.id}</p>
                    <p><strong>Precio Base:</strong> $${s.basePrice || s.price || '0.00'}</p>
                    <button class="btn btn-primary" style="width: 100%; margin-top: 10px;" onclick="selectForReservation(${s.idSpace || s.id})">Reservar Este Espacio</button>
                `;
                container.appendChild(card);
            });
        } catch (err) {
            UI.logConsole("Error al consultar catálogo: " + err.message);
        }
    }

    document.getElementById("btn-add-service").addEventListener("click", () => {
        const container = document.getElementById("services-container");
        
        const div = document.createElement("div");
        div.className = "row g-2 mb-2 service-row";
        div.innerHTML = `
            <div class="col-7">
                <input type="text" class="form-control service-desc" placeholder="Ej: Servicio de Catering, Proyector, etc." required>
            </div>
            <div class="col-4">
                <input type="number" class="form-control service-price" placeholder="Precio ($)" min="0" step="0.01" required>
            </div>
            <div class="col-1">
                <button type="button" class="btn btn-danger btn-sm w-100 btn-remove-service">X</button>
            </div>
        `;
        
        // Botón para eliminar la fila si el usuario se arrepiente
        div.querySelector(".btn-remove-service").addEventListener("click", () => div.remove());
        container.appendChild(div);
    });

    // Agregar dentro del DOMContentLoaded en app.js para el módulo de Oferentes
    document.getElementById("form-create-space").addEventListener("submit", async (e) => {
        e.preventDefault();

        // Capturamos las coordenadas de los inputs ocultos
        const latVal = document.getElementById("space-lat").value;
        const lngVal = document.getElementById("space-lng").value;

        const serviceRows = document.querySelectorAll(".service-row");
        const servicesList = [];

        serviceRows.forEach(row => {
            const desc = row.querySelector(".service-desc").value;
            const price = parseFloat(row.querySelector(".service-price").value);
            if (desc && !isNaN(price)) {
                servicesList.push({ description: desc, price: price });
            }
        });

        // Validación del lado del cliente para forzar el uso del mapa
        if (!latVal || !lngVal) {
            alert("❌ Por favor, selecciona una ubicación exacta haciendo clic en el mapa.");
            return;
        }

        // Construimos el DTO mapeando el objeto de localización estructurado esperado por Hibernate
        const dto = {
            idConsumerOwner: parseInt(localStorage.getItem("userId")) || 1,
            nameSpace: document.getElementById("space-title").value,
            description: document.getElementById("space-description").value,
            basePrice: parseFloat(document.getElementById("space-price").value),
            bufferTime: parseInt(document.getElementById("space-buffer").value),
            active: document.getElementById("space-active") ? document.getElementById("space-active").checked : true,
        
            cancellationPolicies: document.getElementById("space-cancellation").value, 
            
            location: {
                nameLocation: `Ubicación de ${document.getElementById("space-title").value}`,
                latitude: parseFloat(latVal),
                longitude: parseFloat(lngVal)
            },
            services: servicesList
        };

        try {
            UI.logConsole("Publicando nueva locación comercial con Coordenadas Reales... POST /api/spaces/ownedspace");
            const res = await ApiService.createSpace(dto);
            UI.logConsole("Propiedad dada de alta de forma exitosa en el servidor.", res);
            alert("¡Espacio publicado con éxito con su mapa enlazado!");
            
            // Resetear formulario y remover pin del mapa
            document.getElementById("form-create-space").reset();
            if(spaceMarker) {
                spaceMap.removeLayer(spaceMarker);
                spaceMarker = null;
            }
            
            if (typeof loadOwnedSpaces === "function") loadOwnedSpaces(); 
        } catch (err) {
            UI.logConsole("Error al dar de alta el espacio: " + err.message);
            alert("Error operacional: " + err.message);
        }
    });

    // ---------------------------------------------------------
    // VISTA OWNER: Refrescar Mis Locaciones
    // ---------------------------------------------------------
    const btnRefreshOwnerSpaces = document.getElementById("btn-refresh-owner-spaces");
    if (btnRefreshOwnerSpaces) {
        btnRefreshOwnerSpaces.addEventListener("click", loadOwnedSpaces);
    }

    //Para mostrar los OwnedSpaces en la pestaña de owner
    async function loadOwnedSpaces() {
        try {
            UI.logConsole("Buscando salones del propietario... GET /api/spaces/ownedspaces");

            const response = await fetch(`${API_BASE_URL}/api/spaces/ownedspaces`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem("jwt_token")}` }
            });

            if (!response.ok) {
                throw new Error("Error del servidor al obtener tus salones.");
            }

            const spaces = await response.json();
            const container = document.getElementById("owner-spaces-list");
            container.innerHTML = "";

            if (!spaces || spaces.length === 0) {
                container.innerHTML = "<p class='placeholder-text'>No tenés ningún salón registrado a tu nombre.</p>";
                return;
            }

            spaces.forEach(s => {
                const card = document.createElement("div");
                card.className = "card";

                // Extraemos el tipo de política de forma segura
                const politicaTexto = (s.cancellationPolicies && s.cancellationPolicies.type)
                    ? s.cancellationPolicies.type
                    : 'No definida';

                card.innerHTML = `
        <h4>${s.nameSpace || s.title || 'Salón Comercial'}</h4>
        <p style="color: var(--text-muted)">ID de Salón: ${s.idSpace || s.id}</p>
        <p><strong>Precio Base:</strong> $${s.basePrice || s.price || '0.00'}</p>
        <p><strong>Política:</strong> ${politicaTexto}</p>
        <p><strong>Estado:</strong> ${s.active !== false ? '<span style="color: green; font-weight: bold;">ACTIVO</span>' : '<span style="color: red; font-weight: bold;">INACTIVO</span>'}</p>`;
                container.appendChild(card);
            });
            UI.logConsole("Tus salones fueron listados exitosamente.");
        } catch (err) {
            UI.logConsole("Error al consultar salones propios: " + err.message);
            document.getElementById("owner-spaces-list").innerHTML = `<p class='text-danger'>Hubo un error al cargar tus salones: ${err.message}</p>`;
        }
    }

    let currentSpaceBasePrice = 0;

    window.selectForReservation = async (id) => {
        UI.switchView("view-reservations");
        document.getElementById("res-space-id").value = id;
        UI.logConsole(`Pre-cargando servicios opcionales para el espacio #${id}...`);

        const checkboxContainer = document.getElementById("available-services-checkboxes");
        checkboxContainer.innerHTML = "<p class='placeholder-text'>Cargando servicios del espacio...</p>";
        document.getElementById("total-price-display").innerText = "$0.00";

        try {
            // Buscamos el espacio específico utilizando tu ApiService o fetch nativo
            // Nota: Si tu ApiService no tiene implementado getSpaceById, usamos fetch directamente:
            const response = await fetch(`${API_BASE_URL}/api/spaces/${id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem("jwt_token")}` }
            });
            
            if (!response.ok) throw new Error("No se pudo obtener la información detallada del salón.");
            const space = await response.json();

            // Guardamos el precio base en la variable de control
            currentSpaceBasePrice = space.basePrice || 0;
            document.getElementById("total-price-display").innerText = `$${currentSpaceBasePrice.toFixed(2)}`;

            checkboxContainer.innerHTML = ""; // Limpiamos

            // Renderizamos los servicios asociados que estén activos
            if (space.services && space.services.length > 0) {
                space.services.forEach(serv => {
                    // 🌟 CORRECCIÓN DE SEGURIDAD: Validamos si viene como active o isActive, 
                    // o si directamente no está definido asumimos que está activo.
                    const isActive = serv.isActive !== false && serv.active !== false;

                    if (isActive) {
                        const div = document.createElement("div");
                        div.style.display = "flex";
                        div.style.alignItems = "center";
                        div.style.gap = "8px";
                        div.style.marginBottom = "6px";
                        
                        // 🌟 ADEMÁS: Verificá si tu backend devuelve 'idSpaceService' o 'id'. 
                        // Usamos un fallback por las dudas:
                        const serviceId = serv.id || serv.idSpaceService;

                        div.innerHTML = `
                            <input type="checkbox" class="chk-optional-service" value="${serviceId}" data-price="${serv.price}" id="chk-serv-${serviceId}">
                            <label for="chk-serv-${serviceId}" style="cursor:pointer; font-size:0.95rem;">
                                ${serv.description} (<strong>+$${serv.price}</strong>)
                            </label>
                        `;
                        checkboxContainer.appendChild(div);
                    }
                });

                // Escuchamos los clics en los nuevos checkboxes para recalcular el precio en vivo
                document.querySelectorAll(".chk-optional-service").forEach(chk => {
                    chk.addEventListener("change", reCalcularPrecioTotalUI);
                });

            } else {
                checkboxContainer.innerHTML = "<p class='text-muted' style='font-size: 0.9rem; margin:0;'>Este espacio no cuenta con servicios adicionales.</p>";
            }

            UI.logConsole(`Formulario listo para el espacio #${id}. Precio base: $${currentSpaceBasePrice}`);
        } catch (err) {
            UI.logConsole("Error al recuperar servicios del espacio: " + err.message);
            checkboxContainer.innerHTML = "<p class='text-danger' style='font-size: 0.9rem; margin:0;'>Error al cargar los servicios adicionales.</p>";
        }
    };

    // FUNCIÓN AUXILIAR PARA CALCULAR EL PRECIO TOTAL EN LA UI
    function reCalcularPrecioTotalUI() {
        let total = currentSpaceBasePrice;
        document.querySelectorAll(".chk-optional-service:checked").forEach(chk => {
            total += parseFloat(chk.getAttribute("data-price")) || 0;
        });
        document.getElementById("total-price-display").innerText = `$${total.toFixed(2)}`;
    }

    // 4. Crear Reserva Saliente
    document.getElementById("form-create-reservation").addEventListener("submit", async (e) => {
        e.preventDefault();

        // 1. Extraemos los IDs de los servicios adicionales que fueron tildados
        const checkedBoxes = document.querySelectorAll(".chk-optional-service:checked");
        const selectedServiceIds = Array.from(checkedBoxes).map(chk => parseInt(chk.value));

        // 2. Recuperamos el ID del Consumidor desde el JWT o localStorage
        // Tu JwtUtil descodifica el token, pero si guardás el userId en login usalo. 
        // Si no está, intentamos extraerlo del payload del token actual:
        let userId = parseInt(localStorage.getItem("userId"));
        if (!userId) {
            try {
                const token = localStorage.getItem("jwt_token");
                const payload = JSON.parse(atob(token.split('.')[1]));
                // Mapeamos según como guardes el ID en los Claims (id, userId, idConsumer)
                userId = payload.idConsumer || payload.id || 1; 
            } catch (e) {
                userId = 1; // Fallback de seguridad por si acaso
            }
        }

        // 3. Estructuramos el DTO idéntico a tu Record de Java
        const dto = {
            title: document.getElementById("res-title").value.trim(),
            description: document.getElementById("res-description").value.trim(),
            googleEventCode: null, // Lo genera el backend de forma remota, mandamos null
            fromDate: document.getElementById("res-from").value,   // Formato 'YYYY-MM-DDTHH:mm'
            untilDate: document.getElementById("res-to").value,    // Formato 'YYYY-MM-DDTHH:mm'
            status: "TENTATIVE",                                     // Estado por defecto inicial
            saveToMyCalendar: document.getElementById("res-save-calendar").checked,
            idConsumer: userId,
            idSpace: parseInt(document.getElementById("res-space-id").value),
            idServicesSelec: selectedServiceIds                     // Array de enteros [2, 5]
        };

        try {
            UI.logConsole("Iniciando registro de reserva con sincronización de Google Calendar... POST /api/reservations", dto);
            
            // Usamos tu ApiService o fetch directo con seguridad incorporada
            const response = await fetch(`${API_BASE_URL}/api/reservations`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem("jwt_token")}`
                },
                body: JSON.stringify(dto)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Error devuelto por el servidor.");
            }

            const res = await response.json();
            UI.logConsole("¡Reserva guardada y sincronizada en Google Calendar con éxito!", res);
            alert("¡Reserva registrada correctamente! Se envió la invitación a tu casilla de correo vía Google API.");
            
            document.getElementById("form-create-reservation").reset();
            document.getElementById("available-services-checkboxes").innerHTML = "<p class='text-muted' style='font-size: 0.9rem; margin:0;'>Selecciona un espacio del catálogo para auditar sus servicios.</p>";
            document.getElementById("total-price-display").innerText = "$0.00";
            
            loadReservations();
        } catch (err) {
            UI.logConsole("Error al solicitar reserva: " + err.message);
            alert("No se pudo agendar la reserva: " + err.message);
        }
    });

    document.getElementById("btn-refresh-reservations").addEventListener("click", loadReservations);

    async function loadReservations() {
        try {
            UI.logConsole("Solicitando historial transaccional de alquileres propios...");
            const data = await ApiService.get("/api/reservations/me");
            UI.logConsole("Historial de alquileres obtenido", data);
            
            const tbody = document.getElementById("reservations-tbody");
            if (!tbody) return; // Salvaguarda por si el elemento no existe en la vista actual
            tbody.innerHTML = "";

            if (!data || !data.length) {
                tbody.innerHTML = "<tr><td colspan='4' class='text-center'>No posees alquileres salientes cargados en tu cuenta.</td></tr>";
                return;
            }

            data.forEach(res => {
                const tr = document.createElement("tr");
                
                // Controlamos de forma segura que las propiedades existan antes de renderizar
                const idReserva = res.id || res.idReservation || 'N/A';
                const nombreEspacio = res.space?.nameSpace || `Salón #${res.idSpace || 'Asignado'}`;
                const precioFinal = res.finalPrice != null ? parseFloat(res.finalPrice).toFixed(2) : '0.00';
                const estado = res.status || 'TENTATIVE';

                tr.innerHTML = `
                    <td>#${idReserva}</td>
                    <td>${nombreEspacio}</td>
                    <td style="font-weight: bold; color: green;">$${precioFinal}</td>
                    <td><span class="status-badge ${estado}">${estado}</span></td>
                `;
                tbody.appendChild(tr);
            });
        } catch (err) {
            UI.logConsole("Error al listar alquileres: " + err.message);
            // En lugar de un alert molesto con código, lo informamos directamente en la tabla de la UI
            const tbody = document.getElementById("reservations-tbody");
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan='4' class='text-center text-danger'>Error de comunicación con el servidor (502 / StackOverflow). Verificá recursividad en el Back.</td></tr>`;
            }
        }
    }

    // 5. Módulo de Administración (CORRECCIÓN INCONSISTENCIA 4)
    document.getElementById("btn-admin-list-users").addEventListener("click", loadAdminUsers);

    async function loadAdminUsers() {
        try {
            UI.logConsole("Ejecutando auditoría de cuentas... Solicitando GET /api/usuarios");
            const users = await ApiService.adminListUsers();
            const list = document.getElementById("admin-users-list");
            list.innerHTML = "";
            
            if(!users || !users.length) {
                list.innerHTML = "<li>No hay cuentas devueltas por el servidor.</li>";
                return;
            }

            users.forEach(u => {
                const li = document.createElement("li");
                // Mapeo adaptado a las propiedades de tu entidad Consumer (idConsumer, username, etc.)
                li.innerHTML = `👤 ID: <strong>${u.idConsumer || u.id}</strong> | Username: <strong>${u.username}</strong> - Estado: <span style="color:${u.isActive ? 'green':'red'}">${u.isActive ? 'ACTIVO':'INACTIVO'}</span>`;
                list.appendChild(li);
            });
            UI.logConsole("Usuarios del sistema obtenidos con éxito mediante privilegios jerárquicos.", users);
        } catch (err) {
            UI.logConsole("Error de privilegios de administrador: " + err.message);
            alert("No se pudo obtener la lista: Verifique que posea el ROL_ADMIN y que el token sea válido.");
        }
    }

    // CORRECCIÓN INCONSISTENCIA 5: Carga del Historial de Alertas / Notificaciones
    async function loadNotifications() {
        try {
            UI.logConsole("Solicitando historial de alertas: GET /api/notifications");
            const notifications = await ApiService.get("/api/notifications");
            const container = document.getElementById("notifications-list");
            container.innerHTML = "";

            if (!notifications || !notifications.length) {
                container.innerHTML = "<p class='placeholder-text'>🎉 ¡Todo al día! No registras alertas en tu historial.</p>";
                return;
            }

            notifications.forEach(n => {
                const div = document.createElement("div");
                div.className = "card alert-card";
                div.style.borderLeft = "4px solid var(--primary-color)";
                div.style.marginBottom = "10px";
                div.style.padding = "15px";
                div.innerHTML = `
                    <p style="margin:0; font-size:1rem;">${n.message || n.mensaje || 'Nueva actualización sobre tu reserva'}</p>
                    <small style="color:var(--text-muted)">📅 Recibido: ${n.dateSend ? new Date(n.dateSend).toLocaleString() : 'Recientemente'}</small>
                `;
                container.appendChild(div);
            });
        } catch (err) {
            UI.logConsole("Error al mapear las notificaciones del usuario: " + err.message);
        }
    }

    // Función auxiliar para leer cuántas notificaciones no leídas tiene el usuario (Globo rojo del Navbar)
    async function loadUnreadNotificationsCount() {
        if (!localStorage.getItem("jwt_token")) {
            console.warn("⚠️ loadUnreadNotificationsCount: No se ejecuta porque no hay token en localStorage.");
            return;
        }

        try {
            console.log("🚀 Disparando conteo de alertas a: /api/notifications/unread-count");
            const data = await ApiService.get("/api/notifications/unread-count");       

            console.log("📦 Datos recibidos del Backend:", data);

            const badge = document.getElementById("notif-badge");
            if (!badge) {
                console.error("❌ No se encontró el elemento HTML con id 'notif-badge' en la barra de navegación.");
                return;
            }

            const btnNotif = document.getElementById("nav-notifications");

            // Validamos la estructura del JSON que devuelve tu Spring Boot
            if (data && (data.count > 0 || data.count === 0)) {
                if (data.count > 0) {
                    badge.innerText = data.count;
                    badge.style.display = "inline-block";

                    if (btnNotif) {
                        btnNotif.style.display = "inline-block";
                    }

                    console.log(`🔴 Globo de alertas activado con ${data.count} notificaciones.`);
                } else {
                    badge.innerText = "";
                    badge.style.display = "none";
                    console.log("⚪ El conteo de alertas dio 0. El globo permanece oculto.");
                }
            } else {
                console.error("❌ Estructura inesperada del Backend. Se esperaba un objeto con la propiedad 'count'. Recibido:", data);
            }
        } catch (e) {
            console.error("🚨 Fallo crítico en la petición de alertas al servidor backend:", e);
        }
    }

    // Oculta o muestra dinámicamente el botón de administración basándose en el rol del JWT
    function gestionarNavegacionPorRol() {
        const token = localStorage.getItem("jwt_token");
        // Buscamos en el menú el elemento de navegación que apunta a la vista de admin
        const btnAdmin = document.querySelector('#main-nav [data-view="view-admin"]');

        if (!btnAdmin) return;

        if (token && isAdminToken(token)) {
            btnAdmin.style.display = "inline-block"; // Se muestra si es administrador
        } else {
            btnAdmin.style.display = "none"; // Desaparece para clientes o anónimos
        }
    }

    // Corrección de la lectura de Roles en app.js
    function isAdminToken(token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            UI.logConsole("Inspeccionando Claims del JWT para validación de privilegios:", payload);
            
            // Buscamos la propiedad 'rol' que inyecta tu JwtUtil (puede venir como "ROLE_ADMIN" o "ADMIN")
            const userRol = payload.rol || payload.role || "";
            return userRol.includes("ADMIN");
        } catch (e) {
            return false;
        }
    }

    // ====== WEBHOOK SIMULATION ======
    document.getElementById("btn-trigger-webhook").addEventListener("click", async () => {
        const payId = document.getElementById("webhook-payment-id").value;
        const payload = {
            type: "payment",
            data: { id: payId.toString() }
        };

        try {
            UI.logConsole("Inyectando notificación asíncrona de pasarela...");
            const status = await ApiService.simulateWebhook(payload);
            UI.logConsole("Webhook respondido por el Backend Server. Status 200 OK. Estado mutado asíncronamente en BD.", status);
        } catch (err) {
            UI.logConsole("Fallo al propagar webhook: " + err.message);
        }
    });
});