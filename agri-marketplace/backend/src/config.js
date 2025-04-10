module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret',
  db: {
    host: 'localhost',
    user: 'your_db_user',
    password: 'your_db_password',
    database: 'agri_marketplace',
  },
};
