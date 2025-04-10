const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  cropId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Crops',
      key: 'id'
    }
  },
  buyerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'in-transit', 'delivered', 'canceled', 'payment-released'),
    defaultValue: 'pending'
  },
  paymentId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  pickupDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  hooks: {
    beforeCreate: (order) => {
      order.createdAt = new Date();
      order.updatedAt = new Date();
    },
    beforeUpdate: (order) => {
      order.updatedAt = new Date();
    }
  }
});

// Instance methods
Order.prototype.isPending = function() {
  return this.status === 'pending';
};

Order.prototype.isDelivered = function() {
  return this.status === 'delivered';
};

// Class methods
Order.findByBuyerId = async function(buyerId) {
  return await this.findAll({ where: { buyerId } });
};

module.exports = Order;
