const sequelize = require('../db');
const User = require('./User');
const Crop = require('./Crop');
const Order = require('./Order');

// Define relationships
User.hasMany(Crop, {
  foreignKey: 'farmerId',
  as: 'crops'
});
Crop.belongsTo(User, {
  foreignKey: 'farmerId',
  as: 'farmer'
});

User.hasMany(Order, {
  foreignKey: 'buyerId',
  as: 'orders'
});
Order.belongsTo(User, {
  foreignKey: 'buyerId',
  as: 'buyer'
});

Crop.hasMany(Order, {
  foreignKey: 'cropId',
  as: 'orders'
});
Order.belongsTo(Crop, {
  foreignKey: 'cropId',
  as: 'crop'
});

// Sync all models with database
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true }); // In production, use { force: false }
    console.log('Database synced successfully');
  } catch (error) {
    console.error('Error syncing database:', error);
  }
};

module.exports = {
  sequelize,
  User,
  Crop,
  Order,
  syncDatabase
};
