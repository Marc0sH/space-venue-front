/**
 * Orquestador Central y Controlador de Eventos de la Aplicación (App Kernel)
 * Corregido y Adaptado a las Reglas de Negocio de Space & Venue
 */
document.addEventListener("DOMContentLoaded", () => {
    
    // Inicializar listeners del navbar con Delegación de Eventos e Intercepción de Cargas de Red
    document.getElementById("main-nav").addEventListener("click", (e) => {
        if (e.target.hasAttribute("data-view")) {
            const targetView = e.target.getAttribute("data-view");
            const token = localStorage.getItem("jwt_token");

            // SEGURIDAD DEL FRONT: Validar accesos antes de cambiar la vista
            if ((targetView === "view-reservations" || targetView === "view-owner-spaces" || targetView === "view-notifications") && !token) {
                UI.logConsole("⚠️ Intento de acceso denegado: Debes iniciar sesión primero.");
                UI.switchView("view-auth");
                return;
            }

            if (targetView === "view-admin") {
                if (!token || !isAdminToken(token)) {
                    UI.logConsole("⛔ CRÍTICO: Acceso denegado al Panel de Administración. Privilegios insuficientes.");
                    alert("No tienes permisos de Administrador (ROLE_ADMIN) para acceder a este panel.");
                    return; // Bloquea el cambio de vista por completo
                }
                // Si es admin, cargamos las cuentas automáticamente al entrar
                loadAdminUsers();
            }

            // Cambiar de vista de forma segura
            UI.switchView(targetView);

            // Disparar las consultas de red de manera reactiva e inmediata al entrar a la vista
            if (targetView === "view-spaces") loadCatalog();
            if (targetView === "view-reservations") loadReservations();
            if (targetView === "view-notifications") loadNotifications();
        }
    });

    document.getElementById("nav-logout").addEventListener("click", () => {
        localStorage.removeItem("jwt_token");
        UI.updateNavbar(null);
        // Ocultar dinámicamente el botón de notificaciones añadido
        document.getElementById("nav-notifications").style.display = "none";
        UI.logConsole("Sesión destruida y credenciales revocadas del almacenamiento local.");
        UI.switchView("view-auth");
    });

    // Restaurar sesión persistente al refrescar la pantalla (F5)
    const savedToken = localStorage.getItem("jwt_token");
    if (savedToken) {
        UI.updateNavbar(savedToken);
        // Mostrar botón de notificaciones si hay sesión
        document.getElementById("nav-notifications").style.display = "inline-block";
        UI.logConsole("Token JWT detectado de una sesión previa activa. Sincronizando estado...");
        
        // Cargar globo de alertas si tu endpoint lo permite o inicializar llamadas en segundo plano
        loadUnreadNotificationsCount();
    }

    // ====== FORMULARIOS & ACCIONES EVENT DRIVEN ======

    // 1. Autenticación: Login
    document.getElementById("form-login").addEventListener("submit", async (e) => {
        e.preventDefault();
        const user = document.getElementById("login-username").value.trim();
        const pass = document.getElementById("login-password").value; // Texto plano que Spring encriptará para comparar

        try {
            UI.logConsole(`Intentando iniciar sesión para el usuario: ${user}...`);
            const result = await ApiService.login(user, pass);
            
            // Validamos si la respuesta es el token JWT (ya sea un string plano o un objeto con Bearer)
            if (typeof result === 'string' && result.includes("Bearer")) {
                const token = result.replace("Bearer ", "").trim();
                localStorage.setItem("jwt_token", token);
                
                UI.updateNavbar(token);
                if (document.getElementById("nav-notifications")) {
                    document.getElementById("nav-notifications").style.display = "inline-block";
                }
                
                UI.logConsole("Autenticación exitosa. Token guardado correctamente.");
                UI.switchView("view-spaces");
                loadCatalog();
            } else if (result && result.token) { 
                // Por si tu backend devuelve un JSON del tipo { token: "Bearer ..." } o { token: "eyJ..." }
                const rawToken = result.token.replace("Bearer ", "").trim();
                localStorage.setItem("jwt_token", rawToken);
                UI.updateNavbar(rawToken);
                UI.switchView("view-spaces");
                loadCatalog();
            } else {
                UI.logConsole("Respuesta inesperada del control de accesos: " + JSON.stringify(result));
            }
        } catch (err) {
            UI.logConsole("Fallo de autenticación: " + err.message);
            alert("Credenciales inválidas o error de emparejamiento con Spring Boot.");
        }
    });

    // 1. Corrección del Formulario de Registro en app.js
    document.getElementById("form-register").addEventListener("submit", async (e) => {
        e.preventDefault(); 
        
        const usernameInput = document.getElementById("reg-username").value;
        const passwordInput = document.getElementById("reg-password").value;

        // ALINEACIÓN CON EL BACKEND: Tu modelo espera 'passwordHash' en lugar de 'password'
        const registerPayload = {
            username: usernameInput,
            passwordHash: passwordInput // Viaja en texto plano, CredentialService lo hashea
        };

        try {
            UI.logConsole("Enviando solicitud de alta de cuenta... POST /api/usuarios");
            const userCreated = await ApiService.post("/api/usuarios", registerPayload);
            
            UI.logConsole("¡Cuenta registrada con éxito en la Base de Datos!", userCreated);
            
            // Manejo seguro por si el back devuelve un objeto JSON o texto plano
            const registeredName = (userCreated && userCreated.username) ? userCreated.username : usernameInput;
            alert(`¡Usuario '${registeredName}' registrado con éxito! Ya puedes iniciar sesión.`);
            
            document.getElementById("form-register").reset();
            document.getElementById("login-username").value = usernameInput;
            document.getElementById("login-password").value = "";
        } catch (err) {
            UI.logConsole("Fallo en el proceso de registro: " + err.message);
            alert("Error al registrar cuenta: " + err.message);
        }
    });

    // 2. Catálogo de Espacios
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

    // Agregar dentro del DOMContentLoaded en app.js para el módulo de Oferentes
    document.getElementById("form-create-space").addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const dto = {
            title: document.getElementById("space-title").value
            // Agrega aquí más campos si tu backend los requiere para el Espacio (ej: price, basePrice, etc.)
        };

        try {
            UI.logConsole("Publicando nueva locación comercial... POST /api/spaces/ownedspace");
            const res = await ApiService.createSpace(dto);
            UI.logConsole("Propiedad dada de alta de forma exitosa en el servidor.", res);
            alert("¡Espacio publicado con éxito!");
            document.getElementById("form-create-space").reset();
            
            // En lugar de redirigir, refrescamos la sub-vista de locaciones del dueño
            if (typeof loadOwnedSpaces === "function") loadOwnedSpaces(); 
        } catch (err) {
            UI.logConsole("Error al dar de alta el espacio: " + err.message);
            alert("Error operacional: " + err.message);
        }
    });

    window.selectForReservation = (id) => {
        UI.switchView("view-reservations");
        document.getElementById("res-space-id").value = id;
        UI.logConsole(`Formulario de reserva precargado con el espacio #${id}`);
    };

    // 3. Crear Reserva Saliente
    document.getElementById("form-create-reservation").addEventListener("submit", async (e) => {
        e.preventDefault();
        const dto = {
            idSpace: parseInt(document.getElementById("res-space-id").value),
            fromDate: document.getElementById("res-from").value,
            toDate: document.getElementById("res-to").value
        };

        try {
            const res = await ApiService.createReservation(dto);
            UI.logConsole("Reserva registrada con éxito en el servidor", res);
            document.getElementById("form-create-reservation").reset();
            loadReservations();
        } catch (err) {
            UI.logConsole("Error al solicitar reserva: " + err.message);
            alert("No se pudo agendar la reserva: " + err.message);
        }
    });

    // CORRECCIÓN INCONSISTENCIA 2: Carga automática de Reservas Salientes
    document.getElementById("btn-refresh-reservations").addEventListener("click", loadReservations);

    async function loadReservations() {
        try {
            UI.logConsole("Solicitando historial transaccional de alquileres propios...");
            const data = await ApiService.getReservations();
            UI.logConsole("Historial de alquileres obtenido", data);
            const tbody = document.getElementById("reservations-tbody");
            tbody.innerHTML = "";

            if(!data || !data.length) {
                tbody.innerHTML = "<tr><td colspan='4' class='text-center'>No posees alquileres salientes cargados en tu cuenta.</td></tr>";
                return;
            }

            data.forEach(res => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>#${res.idReservation || res.id}</td>
                    <td>Salón ID: ${res.space?.idSpace || res.idSpace || 'Asignado'}</td>
                    <td><span class="status-badge ${res.status}">${res.status}</span></td>
                    <td>
                        ${res.status === 'TENTATIVE' ? `<button class="btn btn-success" style="padding: 4px 8px; font-size: 0.8rem;" onclick="checkoutPayment(${res.idReservation || res.id})">Proceder Pago MP</button>` : ''}
                        ${res.status !== 'CANCELED' && res.status !== 'EN_CURSO' ? `<button class="btn btn-danger" style="padding: 4px 8px; font-size: 0.8rem; margin-left: 5px;" onclick="cancelRes(${res.idReservation || res.id})">Cancelar</button>` : '<span class="text-muted">Sin Acciones</span>'}
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } catch (err) {
            UI.logConsole("Error al listar alquileres: " + err.message);
            document.getElementById("reservations-tbody").innerHTML = `<tr><td colspan='4' class='text-center text-danger'>Error de sesión o autorización: ${err.message}</td></tr>`;
        }
    }

    // 4. Módulo de Administración (CORRECCIÓN INCONSISTENCIA 4)
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
            UI.logConsole("Solicitando historial de alertas: GET /api/usuarios/me/notificaciones");
            const notifications = await ApiService.get("/api/usuarios/me/notificaciones");
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
        try {
            // Requisitos especifican endpoint para contar alertas pendientes
            const data = await ApiService.get("/api/notificaciones/unread-count");
            const badge = document.getElementById("notif-badge");
            if (data && data.count > 0) {
                badge.innerText = data.count;
                badge.style.display = "inline-block";
            } else {
                badge.style.display = "none";
            }
        } catch (e) {
            // Fallback silencioso si el conteo no está completamente implementado en BD
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