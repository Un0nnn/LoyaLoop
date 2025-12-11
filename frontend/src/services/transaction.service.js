import apiClient from "./api";

const transactionService = {
    async createTransaction(utorid, type, spent, amount, relatedId, remark, promotionIds) {
        return apiClient.post('/transactions', {
            utorid,
            type,
            spent,
            amount,
            relatedId,
            remark,
            promotionIds,
        });
    },

    async getTransactions(name, createdBy, suspicious, promotionId, type, relatedId, amount, operator, page = 1, limit = 10) {
        const params = {
            name,
            createdBy,
            suspicious,
            promotionId,
            type,
            relatedId,
            amount,
            operator,
            page,
            limit,
        };
        return apiClient.get('/transactions', { params });
    },

    async getTransaction(transactionId) {
        return apiClient.get(`/transactions/${transactionId}`);
    },

    async setTransactionSuspicious(transactionId, suspicious) {
        return apiClient.patch(`/transactions/${transactionId}/suspicious`, {
            suspicious,
        });
    },

    async createTransfer(userId, type, amount, remark) {
        return apiClient.post(`/users/${userId}/transactions`, {
            type,
            amount,
            remark,
        });
    },

    async createRedemption(type, amount, remark) {
        return apiClient.post('/users/me/transactions', {
            type,
            amount,
            remark,
        });
    },

    async getMyTransactions(type, relatedId, promotionId, amount, operator, page = 1, limit = 10) {
        const params = { type, relatedId, promotionId, amount, operator, page, limit };
        return apiClient.get('/users/me/transactions', { params });
    },

    async processRedemption(transactionId, processed) {
        return apiClient.patch(`/transactions/${transactionId}/processed`, {
            processed,
        });
    },
}

export default transactionService;