const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const Crop = sequelize.define('Crop', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  farmerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('vegetables', 'fruits', 'grains', 'pulses', 'others'),
    allowNull: false
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  unit: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'kg'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  location: {
    type: DataTypes.GEOMETRY('POINT'),
    allowNull: false
  },
  healthScore: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0,
    validate: {
      min: 0,
      max: 5
    }
  },
  status: {
    type: DataTypes.ENUM('available', 'pending', 'sold', 'cancelled'),
    defaultValue: 'available'
  },
  harvestDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isAuctionable: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  auctionEndTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  minimumBid: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  }
}, {
  indexes: [
    {
      fields: ['location'],
      using: 'GIST'
    },
    {
      fields: ['status']
    },
    {
      fields: ['type']
    }
  ]
});

// Instance methods
Crop.prototype.isAvailable = function() {
  return this.status === 'available';
};

Crop.prototype.canBid = function() {
  return this.isAuctionable && 
         this.status === 'available' && 
         this.auctionEndTime > new Date();
};

// Class methods
Crop.findNearby = async function(point, radius, options = {}) {
  const query = {
    where: {
      status: 'available',
      ...options.where
    },
    order: [
      [sequelize.literal(`ST_Distance(location, ST_SetSRID(ST_MakePoint(${point.coordinates[0]}, ${point.coordinates[1]}), 4326))`)]
    ]
  };
  
  if (radius) {
    query.where = {
      ...query.where,
      location: {
        [sequelize.Op.and]: [
          sequelize.where(
            sequelize.fn(
              'ST_DWithin',
              sequelize.col('location'),
              sequelize.fn('ST_SetSRID', sequelize.fn('ST_MakePoint', point.coordinates[0], point.coordinates[1]), 4326),
              radius * 1000 // Convert km to meters
            ),
            true
          )
        ]
      }
    };
  }
  
  return await this.findAll(query);
};

module.exports = Crop;
