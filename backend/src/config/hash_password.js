// Crie um arquivo temporário, ex: hash_password.js
const bcrypt = require('bcryptjs');
const newPassword = 'admin123'; // Coloque a nova senha desejada
const saltRounds = 8;
const hash = bcrypt.hashSync(newPassword, saltRounds);
console.log(hash);