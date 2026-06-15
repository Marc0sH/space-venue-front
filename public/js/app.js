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

    // =========================================================
    // FILTROS: FUNCIONES GLOBALES
    // =========================================================
    let filterLatitude = null;
    let filterLongitude = null;

    // Exponemos las funciones al entorno global (window) para que los onclick del HTML funcionen
    window.activarGPS = function() {
        const btnGetGps = document.getElementById("btn-get-gps");
        const gpsStatus = document.getElementById("gps-status");
        const radiusInput = document.getElementById("filter-radius");

        if (!navigator.geolocation) {
            alert("Tu navegador no soporta geolocalización.");
            return;
        }

        gpsStatus.innerText = "Buscando satélites...";
        navigator.geolocation.getCurrentPosition(
            (position) => {
                filterLatitude = position.coords.latitude;
                filterLongitude = position.coords.longitude;
                gpsStatus.innerHTML = `✅ Ubicación fijada (${filterLatitude.toFixed(4)}, ${filterLongitude.toFixed(4)})`;
                btnGetGps.classList.replace("btn-outline-secondary", "btn-success");
                radiusInput.disabled = false;
            },
            (error) => {
                console.error("Error GPS:", error);
                gpsStatus.innerText = "❌ Permiso denegado o GPS falló.";
                filterLatitude = null;
                filterLongitude = null;
                radiusInput.disabled = true;
            }
        );
    };

    window.limpiarFiltros = function() {
        document.getElementById("filter-form").reset();
        filterLatitude = null;
        filterLongitude = null;
        document.getElementById("gps-status").innerText = "GPS desactivado";
        document.getElementById("btn-get-gps").classList.replace("btn-success", "btn-outline-secondary");

        const radiusInput = document.getElementById("filter-radius");
        radiusInput.disabled = true;
        radiusInput.value = "5.0";

        fetchFilteredSpaces({}); // Volver a traer todos
    };

    window.aplicarFiltros = async function(event) {
        event.preventDefault(); // CLAVE para que no recargue la página

        const radiusInput = document.getElementById("filter-radius");

        const filterDTO = {
            nameSpace: document.getElementById("filter-name").value.trim() || null,
            minPrice: parseFloat(document.getElementById("filter-min-price").value) || null,
            maxPrice: parseFloat(document.getElementById("filter-max-price").value) || null,
            idLocation: parseInt(document.getElementById("filter-location-id").value) || null,
            idConsumerOwner: null,
            lat: filterLatitude,
            lng: filterLongitude,
            radious: filterLatitude ? parseFloat(radiusInput.value) : null
        };

        UI.logConsole("Enviando filtros:", filterDTO);
        await fetchFilteredSpaces(filterDTO);
    };

    window.abrirModalComentario = function(idSpace) {
        console.log("¡Clic detectado! Desbloqueando formulario para el espacio:", idSpace);

        // 1. Asignamos el ID
        document.getElementById("comentario-space-id").value = idSpace;

        // 2. Desbloqueamos campos
        document.getElementById("comentario-score").disabled = false;
        document.getElementById("comentario-desc").disabled = false;
        document.getElementById("btn-submit-comentario").disabled = false;

        // 3. Scroll para que el usuario vea el formulario (con un pequeño delay para que funcione bien)
        setTimeout(() => {
            document.getElementById("seccion-comentario").scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    };

    window.enviarComentario = async function(event) {
        event.preventDefault();
        console.log("Intentando enviar comentario...");

        // Obtenemos los valores
        const dto = {
            // Asegurate de que esto coincida con cómo guardás el ID de tu usuario en el Front!
            idConsumer: parseInt(localStorage.getItem("userId")) || 1,
            idSpace: parseInt(document.getElementById("comentario-space-id").value),
            description: document.getElementById("comentario-desc").value.trim(),
            score: parseInt(document.getElementById("comentario-score").value)
        };

        try {
            // IMPORTANTE: Revisá que tu API_BASE_URL esté bien definida en config.js
            const response = await fetch(`http://localhost:8080/api/comments`, { // Cambiá esto si tu URL es otra
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem("jwt_token")}`
                },
                body: JSON.stringify(dto)
            });

            if (!response.ok) {
                const errorMsg = await response.text();
                throw new Error(errorMsg);
            }

            alert("¡Éxito! Tu reseña fue publicada.");

            // Limpiamos y bloqueamos de nuevo
            document.getElementById("form-comentario").reset();
            document.getElementById("comentario-score").disabled = true;
            document.getElementById("comentario-desc").disabled = true;
            document.getElementById("btn-submit-comentario").disabled = true;

        } catch (err) {
            console.error("Error al enviar el comentario:", err);
            alert("Error al publicar: " + err.message);
        }
    };

// 4 CONEXIÓN CON LA API
    async function fetchFilteredSpaces(dto) {
        const container = document.getElementById("spaces-list");
        container.innerHTML = "<p class='text-muted'>Filtrando espacios...</p>";

        try {
            const response = await fetch(`${API_BASE_URL}/api/spaces/byfields`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem("jwt_token")}`
                },
                body: JSON.stringify(dto)
            });

            if (!response.ok) {
                throw new Error(`Error en filtros (Status ${response.status})`);
            }

            const spaces = await response.json();
            container.innerHTML = "";

            if (!spaces || spaces.length === 0) {
                container.innerHTML = "<p class='placeholder-text'>Ningún salón coincide con los criterios de búsqueda.</p>";
                return;
            }

            // Renderizamos las tarjetas dinámicamente
            spaces.forEach(s => {
                const card = document.createElement("div");
                card.className = "card space-card m-2 p-3";

                const politicaTexto = (s.cancellationPolicies && s.cancellationPolicies.type)
                    ? s.cancellationPolicies.type
                    : 'No definida';

                card.innerHTML = `
                <h4>${s.nameSpace || 'Salón Comercial'}</h4>
                <p class="text-muted">${s.description || 'Sin descripción disponible.'}</p>
                <hr>
                <p><strong>Precio Base:</strong> $${s.basePrice || '0.00'}</p>
                <p><strong>Política:</strong> <span class="badge bg-info text-dark">${politicaTexto}</span></p>
                <button class="btn btn-sm btn-primary w-100 mt-2" onclick="initiateReservation(${s.idSpace})">
                    Reservar este espacio
                </button>
            `;
                container.appendChild(card);
            });

        } catch (err) {
            console.error(err);
            container.innerHTML = `<p class='text-danger'>Error al filtrar: ${err.message}</p>`;
        }
    }


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

        // 🌟 Buscamos el botón de submit de la reserva para poder manipularlo
        const submitReservationBtn = document.querySelector("#form-create-reservation button[type='submit']");

        // 🌟 Intentamos recuperar el ID del usuario logueado de forma segura
        let currentUserId = parseInt(localStorage.getItem("userId"));
        if (!currentUserId) {
            try {
                const token = localStorage.getItem("jwt_token");
                const payload = JSON.parse(atob(token.split('.')[1]));
                currentUserId = payload.idConsumer || payload.id;
            } catch (e) { 
                currentUserId = null; 
            }
        }

        try {
            // Buscamos el espacio específico utilizando tu ApiService o fetch nativo
            const response = await fetch(`${API_BASE_URL}/api/spaces/${id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem("jwt_token")}` }
            });
            
            if (!response.ok) throw new Error("No se pudo obtener la información detallada del salón.");
            const space = await response.json();

            // Guardamos el precio base en la variable de control
            currentSpaceBasePrice = space.basePrice || 0;
            document.getElementById("total-price-display").innerText = `$${currentSpaceBasePrice.toFixed(2)}`;

            checkboxContainer.innerHTML = ""; // Limpiamos

            // REGLA DE NEGOCIO: Si el dueño del espacio es el usuario actual, bloqueamos todo
            if (currentUserId && space.idConsumerOwner === currentUserId) {
                UI.logConsole(`⚠️ Auto-Reserva bloqueada: El usuario #${currentUserId} es dueño del espacio #${id}.`);
                
                // Inhabilitamos y cambiamos el aspecto estético del botón de confirmación
                if (submitReservationBtn) {
                    submitReservationBtn.disabled = true;
                    submitReservationBtn.innerText = "❌ No puedes reservar tu propio espacio";
                    submitReservationBtn.className = "btn btn-danger w-100";
                }
                
                // Renderizamos un mensaje de advertencia limpio en lugar de los servicios
                checkboxContainer.innerHTML = `
                    <div class="alert alert-warning" style="background-color: #fff3cd; color: #856404; padding: 12px; border-radius: 6px; font-size: 0.95rem; border: 1px solid #ffeeba;">
                        <strong>Aviso de Seguridad:</strong> Eres el propietario de esta locación comercial. El sistema impide que te auto-reserves espacios para resguardar la consistencia de las transacciones.
                    </div>`;
                return; // Cortamos el flujo acá para ignorar el armado de checkboxes
            } 

            // Si no es el dueño, nos aseguramos de que el botón de confirmación esté activo y normalizado
            if (submitReservationBtn) {
                submitReservationBtn.disabled = false;
                submitReservationBtn.innerText = "Confirmar y Solicitar Reserva";
                submitReservationBtn.className = "btn btn-success w-100";
            }

            if (space.services && space.services.length > 0) {
                space.services.forEach(serv => {
                    const isActive = serv.isActive !== false && serv.active !== false;

                    if (isActive) {
                        const div = document.createElement("div");
                        div.style.display = "flex";
                        div.style.alignItems = "center";
                        div.style.gap = "8px";
                        div.style.marginBottom = "6px";
                        
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

    // =========================================================
    // VISTA CLIENTE: CARGA DE RESERVAS Y COMENTARIOS
    // =========================================================
    async function loadReservations() {
        try {
            UI.logConsole("Cargando reservas...");
            const data = await ApiService.get("/api/reservations/me");

            const tbody = document.getElementById("reservations-tbody");
            if (!tbody) return;
            tbody.innerHTML = "";

            if (!data || !data.length) {
                tbody.innerHTML = "<tr><td colspan='5' class='text-center'>No posees alquileres.</td></tr>";
                return;
            }

            data.forEach(res => {
                const tr = document.createElement("tr");

                const idReserva = res.id || res.idReservation || 'N/A';
                const idEspacio = res.space?.idSpace || res.idSpace;
                const nombreEspacio = res.space?.nameSpace || `Salón #${idEspacio || 'Asignado'}`;
                const precioFinal = res.finalPrice != null ? parseFloat(res.finalPrice).toFixed(2) : '0.00';

                // ESTO ES CLAVE: Normalizamos a mayúsculas para comparar
                const estadoRaw = res.status || 'TENTATIVE';
                const estadoNormalizado = estadoRaw.toString().toUpperCase();

                console.log(`DEBUG: Reserva #${idReserva} tiene estado: ${estadoNormalizado}`);

                // Forzamos la lógica: Si es COMPLETED o CONFIRMED (incluso si viene en minúsculas)
                const puedeComentar = (estadoNormalizado === 'COMPLETED' || estadoNormalizado === 'CONFIRMED');

                // Si quieres ver el botón SIEMPRE para testear, descomenta la siguiente línea:
                // const puedeComentar = true;

                const btnComentar = puedeComentar
                    ? `<button class="btn btn-sm btn-outline-primary" onclick="abrirModalComentario(${idEspacio})">💬 Comentar</button>`
                    : `<small class="text-muted">No disponible</small>`;

                tr.innerHTML = `
                <td>#${idReserva}</td>
                <td>${nombreEspacio}</td>
                <td>$${precioFinal}</td>
                <td><span class="badge ${estadoNormalizado}">${estadoRaw}</span></td>
                <td>${btnComentar}</td> 
            `;
                tbody.appendChild(tr);
            });
        } catch (err) {
            console.error("Error en loadReservations:", err);
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
        
        // Le pedimos al administrador el ID de la reserva que quiere aprobar
        const resId = prompt("Ingrese el ID de la Reserva (TENTATIVE) que desea simular como PAGADA:");
        if (!resId) return;

        const payload = {
            type: "payment",
            isSimulation: true,      // FLAG CLAVE para que el Back sepa que no debe ir a MP
            reservationId: resId,    // Le pasamos qué reserva queremos impactar
            data: { id: payId.toString() }
        };

        try {
            UI.logConsole(`Inyectando notificación de pago aprobado para la Reserva #${resId}...`);
            
            // Ejecutamos el llamado al controlador de Webhooks
            const status = await ApiService.post("/api/v1/payments/webhook", payload);
            
            UI.logConsole("¡Simulación completada! Revisa el historial de alquileres, la reserva ahora debe figurar como CONFIRMED.", status);
            
            // Opcional: recargar las tablas si estás parado en ellas
            if (typeof loadReservations === "function") loadReservations();
        } catch (err) {
            UI.logConsole("Fallo al propagar el webhook simulado: " + err.message);
        }
    });
});