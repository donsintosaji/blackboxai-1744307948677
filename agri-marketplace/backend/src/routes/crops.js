const express = require('express');
const { Crop, User } = require('../models');
const { auth, isFarmer, isVerified } = require('../middleware/auth');
const aiService = require('../services/aiService');
const router = express.Router();

// Create new crop listing
router.post('/', [auth, isFarmer, isVerified], async (req, res) => {
  try {
    const {
      name,
      type,
      quantity,
      price,
      imageUrl,
      location,
      description,
      isAuctionable,
      minimumBid,
      harvestDate
    } = req.body;

    // Assess crop health using AI
    const healthAssessment = await aiService.assessCropHealth(imageUrl);

    // Get price prediction
    const pricePrediction = await aiService.predictPrice({
      type,
      quantity,
      price,
      harvestDate
    });

    const crop = await Crop.create({
      farmerId: req.user.id,
      name,
      type,
      quantity,
      price: pricePrediction.suggestedPrice || price,
      imageUrl,
      location,
      description,
      healthScore: healthAssessment.healthScore,
      isAuctionable,
      minimumBid,
      harvestDate
    });

    res.status(201).json({
      crop,
      healthAssessment,
      pricePrediction
    });
  } catch (error) {
    console.error('Create crop error:', error);
    res.status(400).json({ error: 'Failed to create crop listing' });
  }
});

// Get all crops with filters
router.get('/', async (req, res) => {
  try {
    const {
      type,
      minPrice,
      maxPrice,
      location,
      radius,
      sortBy = 'createdAt',
      order = 'DESC'
    } = req.query;

    const where = { status: 'available' };
    
    if (type) where.type = type;
    if (minPrice) where.price = { ...where.price, [Op.gte]: minPrice };
    if (maxPrice) where.price = { ...where.price, [Op.lte]: maxPrice };

    let crops;
    if (location && radius) {
      // Find crops within radius if location provided
      const point = JSON.parse(location); // Expect {coordinates: [lng, lat]}
      crops = await Crop.findNearby(point, parseFloat(radius), { where });
    } else {
      crops = await Crop.findAll({
        where,
        order: [[sortBy, order]],
        include: [{
          model: User,
          as: 'farmer',
          attributes: ['id', 'name', 'rating']
        }]
      });
    }

    res.json(crops);
  } catch (error) {
    console.error('Get crops error:', error);
    res.status(500).json({ error: 'Failed to fetch crops' });
  }
});

// Get single crop details
router.get('/:id', async (req, res) => {
  try {
    const crop = await Crop.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'farmer',
        attributes: ['id', 'name', 'rating']
      }]
    });

    if (!crop) {
      return res.status(404).json({ error: 'Crop not found' });
    }

    res.json(crop);
  } catch (error) {
    console.error('Get crop error:', error);
    res.status(500).json({ error: 'Failed to fetch crop details' });
  }
});

// Update crop listing
router.put('/:id', [auth, isFarmer], async (req, res) => {
  try {
    const crop = await Crop.findByPk(req.params.id);

    if (!crop) {
      return res.status(404).json({ error: 'Crop not found' });
    }

    if (crop.farmerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this crop' });
    }

    const {
      price,
      quantity,
      status,
      description,
      isAuctionable,
      minimumBid
    } = req.body;

    // Get new price prediction if price is being updated
    let pricePrediction;
    if (price) {
      pricePrediction = await aiService.predictPrice({
        type: crop.type,
        quantity: quantity || crop.quantity,
        price,
        harvestDate: crop.harvestDate
      });
    }

    await crop.update({
      price: pricePrediction?.suggestedPrice || price || crop.price,
      quantity: quantity || crop.quantity,
      status: status || crop.status,
      description: description || crop.description,
      isAuctionable: isAuctionable !== undefined ? isAuctionable : crop.isAuctionable,
      minimumBid: minimumBid || crop.minimumBid
    });

    res.json({
      crop,
      pricePrediction
    });
  } catch (error) {
    console.error('Update crop error:', error);
    res.status(400).json({ error: 'Failed to update crop listing' });
  }
});

// Delete crop listing
router.delete('/:id', [auth, isFarmer], async (req, res) => {
  try {
    const crop = await Crop.findByPk(req.params.id);

    if (!crop) {
      return res.status(404).json({ error: 'Crop not found' });
    }

    if (crop.farmerId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this crop' });
    }

    if (crop.status !== 'available') {
      return res.status(400).json({ error: 'Cannot delete crop with active orders' });
    }

    await crop.destroy();
    res.json({ message: 'Crop listing deleted successfully' });
  } catch (error) {
    console.error('Delete crop error:', error);
    res.status(500).json({ error: 'Failed to delete crop listing' });
  }
});

// Get AI suggestions for crops
router.get('/suggestions/ai', auth, async (req, res) => {
  try {
    const { location } = req.query;
    const suggestions = await aiService.suggestCrops(JSON.parse(location));
    res.json(suggestions);
  } catch (error) {
    console.error('Get crop suggestions error:', error);
    res.status(500).json({ error: 'Failed to get crop suggestions' });
  }
});

module.exports = router;
