import apiClient from "./api";

const promotionService = {
    async createPromotion(name, description, type, startTime, endTime, minSpending, rate, points) {
        const response = await apiClient.post('/promotions', {
            name,
            description,
            type,
            startTime,
            endTime,
            minSpending,
            rate,
            points
        });
        return response;
    },

    async getPromotions(name, type, started, ended, page = 1, limit = 10) {
        const response = await apiClient.get('/promotions', {
            name,
            type,
            started,
            ended,
            page,
            limit,
        });
        return response;
    },

    async getPromotionById(promotionId) {
        const response = await apiClient.get(`/promotions/${promotionId}`);
        return response;
    },

    async updatePromotion(promotionId, name, description, type, startTime, endTime, minSpending, rate, points) {
        const response = await apiClient.patch(`/promotions/${promotionId}`, {
            name,
            description,
            type,
            startTime,
            endTime,
            minSpending,
            rate,
            points,
        });
        return response;
    },

    async deletePromotion(promotionId) {
        const response = await apiClient.delete(`/promotions/${promotionId}`);
        return response;
    },
}

export default promotionService;