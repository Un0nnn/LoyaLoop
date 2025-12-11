import apiClient from "./api";

const eventService = {
    async createEvent(name, description, location, startTime, endTime, capacity, points) {
        const response = await apiClient.post('/events', {
            name,
            description,
            location,
            startTime,
            endTime,
            capacity,
            points
        });
        return response;
    },
    async getEvents(name, location, started, ended, showFull, published, page = 1, limit = 10,) {
        const params = {};
        if (name !== undefined) params.name = name;
        if (location !== undefined) params.location = location;
        if (started !== undefined) params.started = started;
        if (ended !== undefined) params.ended = ended;
        if (showFull !== undefined) params.showFull = showFull;
        if (published !== undefined) params.published = published;
        params.page = page;
        params.limit = limit;

        const response = await apiClient.get('/events', { params });
        return response;
    },
    async getEventById(eventId) {
        const response = await apiClient.get(`/events/${eventId}`)
        return response;
    },
    async updateEvent(eventId, name,
                      description,
                      location,
                      startTime,
                      endTime,
                      capacity,
                      points,
                      published,) {
        const response = await apiClient.patch(`/events/${eventId}`, {
            name,
            description,
            location,
            startTime,
            endTime,
            capacity,
            points,
            published,
        });
        return response;
    },
    async deleteEvent(eventId) {
        const response = await apiClient.delete(`/events/${eventId}`)
        return response;
    },
    async addEventOrganizer(eventId, utorid) {
        const response = await apiClient.post(`/events/${eventId}/organizers`, {
            utorid,
        });
        return response;
    },
    async removeEventOrganizer(eventId, userId) {
        const response = await apiClient.delete(`/events/${eventId}/organizers/${userId}`)
        return response;
    },
    async addEventGuest(eventId, utorid) {
        const response = await apiClient.post(`/events/${eventId}/guests`, {
           utorid,
        });
        return response;
    },
    async removeEventGuest(eventId, utorid, userId) {
        const response = await apiClient.delete(`/events/${eventId}/guests/${userId}`);
        return response;
    },
    async addSelfAsGuest(eventId) {
        const response = await apiClient.post(`/events/${eventId}/guests/me`)
        return response;
    },
    async removeSelfAsGuest(eventId) {
        const response = await apiClient.delete(`/events/${eventId}/guests/me`)
        return response;
    },
    async createEventTransaction(eventId, type, utorid, amount, remark) {
        const response = await apiClient.post(`/events/${eventId}/transactions`, {
            type, utorid, amount, remark
        });
        return response;
    },

}

export default eventService;