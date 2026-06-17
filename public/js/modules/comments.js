/**
 * Módulo de comentarios y reseñas de espacios.
 */
const CommentsModule = {
    init() {
        document.getElementById('form-comentario')?.addEventListener('submit', (e) => this.handleSubmit(e));
    },

    openForm(spaceId) {
        document.getElementById('comentario-space-id').value = spaceId;
        document.getElementById('comentario-score').disabled = false;
        document.getElementById('comentario-desc').disabled = false;
        document.getElementById('btn-submit-comentario').disabled = false;

        document.getElementById('seccion-comentario')?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
        });
    },

    closeForm() {
        document.getElementById('form-comentario')?.reset();
        document.getElementById('comentario-score').disabled = true;
        document.getElementById('comentario-desc').disabled = true;
        document.getElementById('btn-submit-comentario').disabled = true;
    },

    async handleSubmit(event) {
        event.preventDefault();

        const dto = {
            idConsumer: Auth.getConsumerId() || 1,
            idSpace: parseInt(document.getElementById('comentario-space-id').value, 10),
            description: document.getElementById('comentario-desc').value.trim(),
            score: parseInt(document.getElementById('comentario-score').value, 10),
        };

        const submitBtn = document.getElementById('btn-submit-comentario');
        UI.setLoading(submitBtn, true, 'Publicando...');

        try {
            await ApiService.createComment(dto);
            UI.showSuccess('Reseña publicada correctamente.');
            this.closeForm();
        } catch (err) {
            UI.showError(err.message || 'No se pudo publicar la reseña.');
        } finally {
            UI.setLoading(submitBtn, false);
        }
    },

    async toggleReviews(spaceId) {
        const section = document.getElementById(`reviews-section-${spaceId}`);
        const list = document.getElementById(`reviews-list-${spaceId}`);
        if (!section || !list) return;

        if (!section.hidden) {
            section.hidden = true;
            return;
        }

        section.hidden = false;
        list.innerHTML = '<p class="placeholder-text">Cargando reseñas...</p>';

        try {
            const comments = await ApiService.getCommentsBySpace(spaceId);

            if (!comments?.length) {
                list.innerHTML = '<p class="placeholder-text">Sin reseñas por ahora.</p>';
                return;
            }

            list.innerHTML = '';
            comments.forEach((comment) => {
                list.appendChild(this.createReviewCard(comment));
            });
        } catch (err) {
            list.innerHTML = `<p class="error-text">${err.message}</p>`;
        }
    },

    createReviewCard(comment) {
        const card = document.createElement('article');
        card.className = 'review-card';

        const dateValue = comment.createdAt || comment.created_at || comment.date;

        card.innerHTML = `
            <div class="review-header">
                <span class="review-stars">${UI.renderStars(comment.score)}</span>
                <time class="review-date">${UI.formatDate(dateValue)}</time>
            </div>
            <p class="review-text">"${comment.description}"</p>
        `;

        return card;
    },
};
