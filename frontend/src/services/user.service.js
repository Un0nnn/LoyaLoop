import apiClient from "./api";

const userService = {
    async login(utorid, password) {
        return apiClient.post('/auth/tokens', { utorid, password });
    },

    async createUser(utorid, name, email) {
        return apiClient.post('/users', {
            utorid,
            name,
            email
        });
    },

    async getUsers(role, verified, activated, name, page = 1, limit = 10) {
        // Use axios `params` to send query string parameters to the backend
        const params = {
            page,
            limit,
        };
        if (role !== undefined) params.role = role;
        if (verified !== undefined) params.verified = verified;
        if (activated !== undefined) params.activated = activated;
        if (name !== undefined) params.name = name;

        return apiClient.get('/users', { params });
    },

    async getUser(userId) {
        return apiClient.get(`/users/${userId}`);
    },

    async updateUser(userId, email, verified, suspicious, role) {
        return apiClient.patch(`/users/${userId}`, {
            email,
            verified,
            suspicious,
            role,
        });
    },

    async getCurrentUser() {
        return apiClient.get('/users/me');
    },

    async updateMe(name, email, birthday, avatar) {
        const formData = new FormData();

        if (name !== undefined) formData.append('name', name);
        if (email !== undefined) formData.append('email', email);
        if (birthday !== undefined) formData.append('birthday', birthday);
        if (avatar) formData.append('avatar', avatar);

        return apiClient.patch('/users/me', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    async updateMePassword(old, newPassword) {
        return apiClient.patch('/users/me/password', {
            old,
            new: newPassword,
        });
    },

    async deleteUser(userId) {
        return apiClient.delete(`/users/${userId}`);
    },
}

export default userService;