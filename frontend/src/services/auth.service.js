import apiClient from "./api";

const authService = {
    async login(utorid, password) {
        // apiClient.post returns parsed data or throws
        const response = await apiClient.post('/auth/tokens', {utorid, password});
        // normalize common response shapes
        // If backend returns { data: { token, user } } or { token, user }, keep both
        return response;
    },

    async resetWithToken(resetToken, utorid, password) {
        return apiClient.post(`/auth/resets/${resetToken}`, { utorid, password });
    }
}

export default authService;