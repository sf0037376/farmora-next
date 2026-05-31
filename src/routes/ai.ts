import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { db } from '../db';

const router = Router();

// Crop Database with agricultural parameters
interface CropProfile {
  name: string;
  scientificName: string;
  suitabilityScore: number;
  expectedYieldPerAcreTons: number;
  marketRatePerTon: number;
  setupCostPerAcre: number;
  annualOpExPerAcre: number;
  timeToHarvestMonths: number;
  waterRequirementIndex: 'LOW' | 'MEDIUM' | 'HIGH';
  riskScore: number;
  riskDescription: string;
  mitigationTips: string[];
  costBreakdown: {
    seedsSaplings: number;
    landPrep: number;
    fertilizersOrganic: number;
    dripSetup: number;
    labor: number;
  };
}

/**
 * Core Rule-Based Polam AI Evaluation Engine using Decision Tree logic on Soil & Climate Telemetry.
 */
function evaluatePolamAI(
  location: string,
  landSize: number,
  budget: number,
  water: string,
  experience: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
  soilPh: number = 6.5,
  npk: { n: number; p: number; k: number } = { n: 50, p: 40, k: 40 },
  temp: number = 32,
  humidity: number = 60
): { crops: CropProfile[]; keyAlerts: string[]; decisionTreeLog: string[] } {
  const loc = location.toLowerCase();
  const wat = water.toLowerCase();
  const crops: CropProfile[] = [];
  const keyAlerts: string[] = [];
  const decisionTreeLog: string[] = [];

  // Log inputs to decision tree log
  decisionTreeLog.push(`📡 Sensor Telemetry: Temperature: ${temp}°C, Humidity: ${humidity}%`);
  decisionTreeLog.push(`🧪 Soil Analysis: pH: ${soilPh}, Nitrogen(N): ${npk.n} mg/kg, Phosphorus(P): ${npk.p} mg/kg, Potash(K): ${npk.k} mg/kg`);

  // General site assessment alerts
  if (landSize < 1) {
    keyAlerts.push('Smallholding Farm: We recommend high-value vertical farming, hydroponics, or localized plant nursery setups for maximum space utilization.');
    decisionTreeLog.push('🌲 Decision: Landholding size is small (< 1 acre) -> Favoring dense hydroponic or nursery layouts.');
  }
  if (budget < 50000) {
    keyAlerts.push('Micro-Capital Alert: Focus on low-setup commercial crops like Spinach or Groundnuts to keep CapEx within constraints.');
    decisionTreeLog.push('💰 Decision: Setup budget is low (< ₹50,000) -> Prioritizing fast-turnaround and low-cost crops.');
  }
  if (wat === 'rainfall') {
    keyAlerts.push('Water Constraint Warning: Rainfall dependency increases crop risk. Implement mulching, organic humus addition, and rainwater harvesting ponds immediately.');
    decisionTreeLog.push('💧 Decision: Water resource is rainfall-only -> Reducing suitability of high water demand crops.');
  }

  // Define Crops Catalog

  // 1. Organic Spinach Profile
  const spinach: CropProfile = {
    name: 'Organic Spinach (Leafy Greens)',
    scientificName: 'Spinacia oleracea',
    suitabilityScore: 82,
    expectedYieldPerAcreTons: 4.5,
    marketRatePerTon: 22000,
    setupCostPerAcre: 15000,
    annualOpExPerAcre: 12000,
    timeToHarvestMonths: 2,
    waterRequirementIndex: 'MEDIUM',
    riskScore: 15,
    riskDescription: 'Highly perishable; delayed post-harvest transport risks rapid wilting.',
    mitigationTips: [
      'Establish shaded sorting zones on field.',
      'Use organic compost mulching to lock in soil moisture.',
      'Coordinate direct delivery agreements with local wholesale procurement nodes.'
    ],
    costBreakdown: {
      seedsSaplings: 3000,
      landPrep: 5000,
      fertilizersOrganic: 4000,
      dripSetup: 0,
      labor: 3000
    }
  };

  // 2. High-Yield Groundnut Profile
  const groundnut: CropProfile = {
    name: 'High-Yield Groundnuts (Kadiri-6)',
    scientificName: 'Arachis hypogaea',
    suitabilityScore: 88,
    expectedYieldPerAcreTons: 1.8,
    marketRatePerTon: 65000,
    setupCostPerAcre: 25000,
    annualOpExPerAcre: 15000,
    timeToHarvestMonths: 4,
    waterRequirementIndex: 'MEDIUM',
    riskScore: 25,
    riskDescription: 'Vulnerable to sudden white grub infestations and dry root rot under moisture stress.',
    mitigationTips: [
      'Implement early crop rotation cycles.',
      'Apply organic Trichoderma viride bio-pesticide during land preparation.',
      'Establish simple sprinkler setups to buffer dry spells.'
    ],
    costBreakdown: {
      seedsSaplings: 6000,
      landPrep: 8000,
      fertilizersOrganic: 5000,
      dripSetup: 0,
      labor: 6000
    }
  };

  // 3. Moringa Profile
  const moringa: CropProfile = {
    name: 'Moringa (Drumstick) - PKM-1 Cultivar',
    scientificName: 'Moringa oleifera',
    suitabilityScore: 90,
    expectedYieldPerAcreTons: 8.5,
    marketRatePerTon: 35000,
    setupCostPerAcre: 45000,
    annualOpExPerAcre: 20000,
    timeToHarvestMonths: 8,
    waterRequirementIndex: 'LOW',
    riskScore: 20,
    riskDescription: 'Susceptible to waterlogging and root rot during peak monsoon seasons.',
    mitigationTips: [
      'Ensure raised bed plantation techniques are used.',
      'Maintain proper channel spacing for monsoon drainage.',
      'Sign buyback processing contracts via Farmora Collection Centers.'
    ],
    costBreakdown: {
      seedsSaplings: 8000,
      landPrep: 12000,
      fertilizersOrganic: 10000,
      dripSetup: 10000,
      labor: 5000
    }
  };

  // 4. Guntur Red Chilli Profile
  const chilli: CropProfile = {
    name: 'Guntur Sannam Red Chilli (Teja / S-334)',
    scientificName: 'Capsicum annuum',
    suitabilityScore: 85,
    expectedYieldPerAcreTons: 2.2,
    marketRatePerTon: 180000,
    setupCostPerAcre: 85000,
    annualOpExPerAcre: 60000,
    timeToHarvestMonths: 6,
    waterRequirementIndex: 'MEDIUM',
    riskScore: 50,
    riskDescription: 'Heavy pest pressure from Thrips and whiteflies; sudden market price fluctuations.',
    mitigationTips: [
      'Install yellow/blue sticky cards and pheromone traps.',
      'Use neem oil sprays and organic botanical extracts preventatively.',
      'Monitor district-wide cold storage availability to avoid distress selling.'
    ],
    costBreakdown: {
      seedsSaplings: 15000,
      landPrep: 15000,
      fertilizersOrganic: 25000,
      dripSetup: 15000,
      labor: 15000
    }
  };

  // 5. Dragon Fruit Profile
  const dragon: CropProfile = {
    name: 'Premium Dragon Fruit (Hylocereus - Red Meat)',
    scientificName: 'Selenicereus costaricensis',
    suitabilityScore: 80,
    expectedYieldPerAcreTons: 5.0,
    marketRatePerTon: 120000,
    setupCostPerAcre: 280000,
    annualOpExPerAcre: 40000,
    timeToHarvestMonths: 18,
    waterRequirementIndex: 'LOW',
    riskScore: 35,
    riskDescription: 'High initial CapEx for concrete poles, trellis rings, and longer gestation period.',
    mitigationTips: [
      'Utilize square concrete trellis pillars for high stability.',
      'Adopt strict drip schedules to prevent sunburn and root pests.',
      'Intercrop with groundnuts or cowpeas during first 12 months to cover OpEx.'
    ],
    costBreakdown: {
      seedsSaplings: 90000,
      landPrep: 30000,
      fertilizersOrganic: 40000,
      dripSetup: 40000,
      labor: 80000
    }
  };

  // 6. Precision Greenhouse Tomatoes Profile
  const tomato: CropProfile = {
    name: 'Greenhouse Hybrid Tomatoes (Vertical Trellis)',
    scientificName: 'Solanum lycopersicum',
    suitabilityScore: 78,
    expectedYieldPerAcreTons: 28.0,
    marketRatePerTon: 25000,
    setupCostPerAcre: 450000,
    annualOpExPerAcre: 90000,
    timeToHarvestMonths: 4,
    waterRequirementIndex: 'HIGH',
    riskScore: 55,
    riskDescription: 'High structural damage risk from high winds; strict moisture/ventilation control required.',
    mitigationTips: [
      'Set up multi-span GI pipe structure with anti-insect net mesh.',
      'Use fertigation automation to deliver tailored liquid macro-nutrients.',
      'Deploy mulch sheets to conserve soil moisture and prevent weeds.'
    ],
    costBreakdown: {
      seedsSaplings: 30000,
      landPrep: 40000,
      fertilizersOrganic: 80000,
      dripSetup: 100000,
      labor: 200000
    }
  };

  // --- SOIL pH DECISION TREE CHECK ---
  if (soilPh >= 7.2) {
    moringa.suitabilityScore += 8;
    dragon.suitabilityScore += 5;
    tomato.suitabilityScore -= 15;
    spinach.suitabilityScore -= 10;
    decisionTreeLog.push(`⚖️ Decision: Alkaline soil pH (${soilPh}) detected -> Highly favorable for Moringa (+8%) and Dragon Fruit (+5%); hostile for Hybrid Tomatoes (-15%) and Spinach (-10%).`);
  } else if (soilPh < 6.0) {
    chilli.suitabilityScore -= 10;
    tomato.suitabilityScore -= 8;
    spinach.suitabilityScore += 10;
    groundnut.suitabilityScore += 5;
    decisionTreeLog.push(`⚖️ Decision: Acidic soil pH (${soilPh}) detected -> Highly favorable for Spinach (+10%) and Groundnuts (+5%); slightly sensitive for Chilli (-10%) and Tomatoes (-8%).`);
  } else {
    chilli.suitabilityScore += 10;
    tomato.suitabilityScore += 12;
    spinach.suitabilityScore += 5;
    decisionTreeLog.push(`⚖️ Decision: Near-neutral soil pH (${soilPh}) detected -> Extremely favorable for Guntur Chilli (+10%) and Greenhouse Tomatoes (+12%).`);
  }

  // --- NPK DECISION TREE CHECK ---
  if (npk.n >= 70) {
    tomato.suitabilityScore += 12;
    chilli.suitabilityScore += 8;
    spinach.suitabilityScore += 15;
    decisionTreeLog.push(`⚖️ Decision: High soil Nitrogen (${npk.n} mg/kg) -> Ideal vegetative feed. Raising Spinach suitability by +15%, Tomatoes by +12%, and Chilli by +8%.`);
  } else if (npk.n < 35) {
    moringa.suitabilityScore += 5;
    tomato.suitabilityScore -= 20;
    spinach.suitabilityScore -= 15;
    decisionTreeLog.push(`⚖️ Decision: Low soil Nitrogen (${npk.n} mg/kg) -> Moringa is highly resilient (+5%); Tomatoes (-20%) and Spinach (-15%) require heavy vegetative supplements.`);
  }

  if (npk.k >= 60) {
    dragon.suitabilityScore += 8;
    decisionTreeLog.push(`⚖️ Decision: High soil Potassium (${npk.k} mg/kg) -> Promotes excellent fruit size and sugars in Dragon Fruit (+8%).`);
  }

  // --- CLIMATE DECISION TREE CHECK ---
  if (temp >= 33) {
    dragon.suitabilityScore += 10;
    tomato.suitabilityScore -= 12;
    spinach.suitabilityScore -= 20; // Heat-sensitive greens
    decisionTreeLog.push(`⚖️ Decision: High ambient temperatures (${temp}°C) -> Perfect gestation climate for dry Dragon Fruit orchards (+10%); causes blossom drop in Tomatoes (-12%) and bolting/wilting in Spinach (-20%).`);
  }

  if (humidity >= 70) {
    chilli.suitabilityScore -= 15;
    decisionTreeLog.push(`⚖️ Decision: High relative humidity (${humidity}%) -> Elevates standard Chilli thrips and damping-off fungal risk index (-15%).`);
  }

  // Regional adjustments based on input locations
  if (loc.includes('guntur')) {
    chilli.suitabilityScore = Math.min(100, chilli.suitabilityScore + 10);
    decisionTreeLog.push('🗺️ District Match: Guntur location matched -> Heavy black clay chemistry adds +10% to Guntur Chilli.');
  } else if (loc.includes('anantapur')) {
    dragon.suitabilityScore = Math.min(100, dragon.suitabilityScore + 12);
    groundnut.suitabilityScore = Math.min(100, groundnut.suitabilityScore + 8);
    decisionTreeLog.push('🗺️ District Match: Anantapur location matched -> Semi-arid red sandy loam soil fits Dragon Fruit (+12%) and Groundnuts (+8%).');
  }

  // Populate crop catalog based on budget tiers and water criteria
  const capPerAcre = budget / landSize;

  if (capPerAcre >= 280000) {
    // High-CapEx portfolio: Dragon Fruit, Greenhouse Tomatoes, Chilli, Moringa, Groundnut, Spinach
    crops.push(moringa, dragon, chilli, tomato, groundnut, spinach);
  } else if (capPerAcre >= 85000) {
    // Mid-High portfolio: Chilli, Moringa, Groundnut, Spinach
    crops.push(moringa, chilli, groundnut, spinach);
  } else if (capPerAcre >= 45000) {
    // Medium-CapEx portfolio: Moringa, Groundnut, Spinach
    crops.push(moringa, groundnut, spinach);
  } else {
    // Low-CapEx portfolio: Spinach and Groundnut (Moringa drip removed)
    moringa.setupCostPerAcre = 35000;
    moringa.costBreakdown.dripSetup = 0;
    crops.push(spinach, groundnut, moringa);
  }

  // Ensure high-water crops are penalized or filtered if rainfall only
  if (wat === 'rainfall') {
    tomato.suitabilityScore -= 30;
    chilli.suitabilityScore -= 20;
    decisionTreeLog.push('💧 Decision: Rainfall dependency -> Constraining High water requirement crops (Tomatoes, Chilli).');
  }

  // Sort crops by suitability score descending
  crops.sort((a, b) => b.suitabilityScore - a.suitabilityScore);

  return { crops, keyAlerts, decisionTreeLog };
}

router.post('/generate', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const {
    location,
    land_size,
    water_source,
    budget,
    experience_level,
    soil_ph,
    nitrogen_content,
    phosphorus_content,
    potassium_content,
    climate_temp,
    climate_humidity
  } = req.body;
  const user = req.user!;

  if (!location || !land_size || !water_source || !budget || !experience_level) {
    return res.status(400).json({ error: 'All primary parameters (location, land size, water source, budget, experience) are required.' });
  }

  const acres = parseFloat(land_size);
  const capital = parseFloat(budget);

  if (isNaN(acres) || acres <= 0) {
    return res.status(400).json({ error: 'Please enter a valid numeric land size in acres.' });
  }
  if (isNaN(capital) || capital <= 0) {
    return res.status(400).json({ error: 'Please enter a valid agricultural startup budget in INR.' });
  }

  // Fallbacks for optional sensor variables
  const ph = soil_ph ? parseFloat(soil_ph) : 6.5;
  const n = nitrogen_content ? parseInt(nitrogen_content) : 50;
  const p = phosphorus_content ? parseInt(phosphorus_content) : 40;
  const k = potassium_content ? parseInt(potassium_content) : 40;
  const t = climate_temp ? parseInt(climate_temp) : 32;
  const h = climate_humidity ? parseInt(climate_humidity) : 60;

  try {
    // 1. Run Polam AI Advisory Algorithm
    const analysis = evaluatePolamAI(location, acres, capital, water_source, experience_level, ph, { n, p, k }, t, h);

    // 2. Generate comprehensive reports for each crop
    const detailedCrops = analysis.crops.map((crop) => {
      const scaleSetupCost = crop.setupCostPerAcre * acres;
      const scaleAnnualOpEx = crop.annualOpExPerAcre * acres;
      const totalYieldTons = crop.expectedYieldPerAcreTons * acres;
      const grossRevenueYearly = totalYieldTons * crop.marketRatePerTon;
      const netProfitYearly = grossRevenueYearly - scaleAnnualOpEx;
      const returnOnInvestmentPct = (netProfitYearly / scaleSetupCost) * 100;

      // Project 5-year financials
      const financials5Years = [];
      let cumulativeNetProfit = -scaleSetupCost;

      for (let year = 1; year <= 5; year++) {
        let yearYieldFactor = 1.0;
        if (crop.name.includes('Dragon Fruit')) {
          yearYieldFactor = year === 1 ? 0.0 : year === 2 ? 0.5 : year === 3 ? 0.8 : 1.0;
        } else if (crop.name.includes('Moringa')) {
          yearYieldFactor = year === 1 ? 0.7 : 1.0;
        }

        const yearRevenue = grossRevenueYearly * yearYieldFactor;
        const yearOpEx = scaleAnnualOpEx * Math.pow(1.05, year - 1);
        const yearNet = yearRevenue - yearOpEx;
        cumulativeNetProfit += yearNet;

        financials5Years.push({
          year,
          revenue: Math.round(yearRevenue),
          expenses: Math.round(yearOpEx),
          netProfit: Math.round(yearNet),
          cumulativeRoi: Math.round(cumulativeNetProfit)
        });
      }

      return {
        cropName: crop.name,
        scientificName: crop.scientificName,
        suitabilityScore: Math.min(100, Math.max(0, crop.suitabilityScore)),
        financialMetrics: {
          totalStartupCapEx: Math.round(scaleSetupCost),
          annualOpEx: Math.round(scaleAnnualOpEx),
          estimatedYieldTons: parseFloat(totalYieldTons.toFixed(1)),
          annualGrossRevenue: Math.round(grossRevenueYearly),
          annualNetProfit: Math.round(netProfitYearly),
          returnOnInvestmentPct: parseFloat(returnOnInvestmentPct.toFixed(1))
        },
        costBreakdown: {
          seedsSaplings: Math.round(crop.costBreakdown.seedsSaplings * acres),
          landPreparation: Math.round(crop.costBreakdown.landPrep * acres),
          organicInputs: Math.round(crop.costBreakdown.fertilizersOrganic * acres),
          dripIrrigation: Math.round(crop.costBreakdown.dripSetup * acres),
          laborSetup: Math.round(crop.costBreakdown.labor * acres)
        },
        riskAssessment: {
          cropRiskScore: crop.riskScore,
          primaryThreat: crop.riskDescription,
          mitigationStrategies: crop.mitigationTips
        },
        projections: financials5Years
      };
    });

    const recommendationPayload = {
      evaluatedAt: new Date(),
      inputs: {
        location,
        landSizeAcres: acres,
        waterSource: water_source,
        budgetInr: capital,
        experienceLevel: experience_level,
        sensors: {
          soilPh: ph,
          npk: { n, p, k },
          temp: t,
          humidity: h
        }
      },
      advisoryAlerts: analysis.keyAlerts,
      decisionTreeLog: analysis.decisionTreeLog,
      recommendations: detailedCrops
    };

    // 3. Save recommendation log to database
    await db.query(
      'INSERT INTO ai_consultations (user_id, location, land_size, water_source, budget, experience_level, recommendations) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [user.id, location, acres, water_source, capital, experience_level, JSON.stringify(recommendationPayload)]
    );

    console.log(`🤖 [Polam AI Decision Engine] Generated full crop plan for ${user.name} at location: ${location}`);

    return res.status(200).json({
      success: true,
      report: recommendationPayload
    });
  } catch (err: any) {
    console.error('Error generating Polam AI crop report:', err);
    return res.status(500).json({ error: 'Server error processing AI consultation algorithms.' });
  }
});

/**
 * GET /api/advisor/history
 * Returns the logged consultation history for the active user.
 */
router.get('/history', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  try {
    const [history] = await db.query(
      'SELECT id, location, land_size, water_source, budget, experience_level, recommendations, created_at FROM ai_consultations WHERE user_id = ? ORDER BY created_at DESC',
      [user.id]
    );

    const formattedHistory = history.map((h: any) => ({
      id: h.id,
      location: h.location,
      land_size: h.land_size,
      water_source: h.water_source,
      budget: h.budget,
      experience_level: h.experience_level,
      report: typeof h.recommendations === 'string' ? JSON.parse(h.recommendations) : h.recommendations,
      created_at: h.created_at
    }));

    return res.status(200).json({
      success: true,
      history: formattedHistory
    });
  } catch (err: any) {
    console.error('Error fetching consultation logs:', err);
    return res.status(500).json({ error: 'Server error retrieving advisory histories.' });
  }
});

export { router as aiRouter };
export default router;
