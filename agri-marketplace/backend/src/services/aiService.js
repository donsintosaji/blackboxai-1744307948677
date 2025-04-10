/**
 * Mock AI Service for crop health assessment and price prediction
 * In a production environment, these would be replaced with real ML models
 */

// Mock crop health assessment based on image
const assessCropHealth = async (imageUrl) => {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Mock analysis based on random factors
  const healthScore = Math.random() * (5 - 3) + 3; // Random score between 3 and 5
  const confidence = Math.random() * (1 - 0.7) + 0.7; // Random confidence between 0.7 and 1

  const possibleIssues = [
    'Minor pest damage',
    'Slight discoloration',
    'Early signs of disease',
    'Nutrient deficiency',
    'Water stress'
  ];

  // Randomly select 0-2 issues
  const issues = [];
  if (healthScore < 4) {
    const numIssues = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < numIssues; i++) {
      const randomIssue = possibleIssues[Math.floor(Math.random() * possibleIssues.length)];
      if (!issues.includes(randomIssue)) {
        issues.push(randomIssue);
      }
    }
  }

  return {
    healthScore: parseFloat(healthScore.toFixed(2)),
    confidence: parseFloat(confidence.toFixed(2)),
    issues,
    recommendations: issues.length > 0 ? [
      'Consider organic pesticides',
      'Adjust irrigation schedule',
      'Apply appropriate fertilizers'
    ] : []
  };
};

// Mock price prediction based on crop data and market trends
const predictPrice = async (cropData) => {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 800));

  const basePrice = cropData.price || 100; // Use provided price or default
  const seasonalFactor = Math.random() * (1.2 - 0.8) + 0.8; // Random factor between 0.8 and 1.2
  const marketDemand = Math.random() * (1.3 - 0.9) + 0.9; // Random factor between 0.9 and 1.3

  // Calculate suggested price
  const suggestedPrice = basePrice * seasonalFactor * marketDemand;

  // Generate mock market insights
  const demandTrend = Math.random() > 0.5 ? 'increasing' : 'stable';
  const supplyTrend = Math.random() > 0.5 ? 'stable' : 'decreasing';

  return {
    suggestedPrice: parseFloat(suggestedPrice.toFixed(2)),
    confidence: parseFloat((Math.random() * (0.9 - 0.7) + 0.7).toFixed(2)),
    marketInsights: {
      demandTrend,
      supplyTrend,
      seasonalImpact: seasonalFactor > 1 ? 'positive' : 'negative',
      priceRange: {
        min: parseFloat((suggestedPrice * 0.9).toFixed(2)),
        max: parseFloat((suggestedPrice * 1.1).toFixed(2))
      }
    },
    forecast: {
      shortTerm: demandTrend === 'increasing' ? 'Price likely to rise' : 'Price expected to remain stable',
      longTerm: 'Market conditions favorable for this crop'
    }
  };
};

// Mock weather-based crop suggestions
const suggestCrops = async (location) => {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 600));

  const seasons = ['Kharif', 'Rabi', 'Zaid'];
  const currentSeason = seasons[Math.floor(Math.random() * seasons.length)];

  const cropSuggestions = {
    Kharif: ['Rice', 'Maize', 'Soybean', 'Cotton'],
    Rabi: ['Wheat', 'Mustard', 'Chickpea', 'Barley'],
    Zaid: ['Watermelon', 'Muskmelon', 'Cucumber', 'Vegetables']
  };

  return {
    season: currentSeason,
    suggestedCrops: cropSuggestions[currentSeason],
    weatherForecast: {
      rainfall: Math.random() > 0.5 ? 'adequate' : 'moderate',
      temperature: {
        min: Math.floor(Math.random() * (25 - 15) + 15),
        max: Math.floor(Math.random() * (35 - 25) + 25)
      },
      humidity: Math.floor(Math.random() * (80 - 40) + 40)
    },
    soilConditions: {
      moisture: 'optimal',
      ph: parseFloat((Math.random() * (7.5 - 6.0) + 6.0).toFixed(1))
    }
  };
};

module.exports = {
  assessCropHealth,
  predictPrice,
  suggestCrops
};
