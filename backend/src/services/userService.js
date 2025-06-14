// backend/src/services/userService.js
const { 
    getAllUsersInternal, 
    updateUserStatusInternal, 
    createUserInternal,
    updateUserProfileInternal 
} = require('./authService'); // Reutiliza funções do authService que já lidam com DB

const getUsers = async () => {
  return getAllUsersInternal();
};

const updateUserProfile = async (compositeId, profileData) => {
    // A lógica de quais campos podem ser atualizados está em updateUserProfileInternal
    return updateUserProfileInternal(compositeId, profileData);
};

const updateUserStatus = async (compositeId, status) => {
  return updateUserStatusInternal(compositeId, status);
};

const createAdminOrAnalystUser = async (userData) => {
    return createUserInternal(userData); // createUserInternal já lida com role admin/analista
};


module.exports = {
  getUsers,
  updateUserProfile,
  updateUserStatus,
  createAdminOrAnalystUser,
};
