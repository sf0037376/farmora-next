'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from './i18n/LanguageContext';
import { AuthModal } from './components/AuthModal';
import { KYCManager } from './components/KYCManager';
import { LeaseDeedModal } from './components/LeaseDeedModal';
import styles from './page.module.css';

interface CropProfile {
  cropName: string;
  scientificName: string;
  suitabilityScore: number;
  financialMetrics: {
    totalStartupCapEx: number;
    annualOpEx: number;
    estimatedYieldTons: number;
    annualGrossRevenue: number;
    annualNetProfit: number;
    returnOnInvestmentPct: number;
  };
  costBreakdown: {
    seedsSaplings: number;
    landPreparation: number;
    organicInputs: number;
    dripIrrigation: number;
    laborSetup: number;
  };
  riskAssessment: {
    cropRiskScore: number;
    primaryThreat: string;
    mitigationStrategies: string[];
  };
  projections: {
    year: number;
    revenue: number;
    expenses: number;
    netProfit: number;
    cumulativeRoi: number;
  }[];
}

// Global dynamic multi-crop decision tree simulator
function generateMockReport(
  location: string,
  acres: number,
  budget: number,
  water: string,
  experience: string,
  ph: number = 6.5,
  nitrogen: number = 50,
  phosphorus: number = 40,
  potassium: number = 40,
  temp: number = 32,
  humidity: number = 60
) {
  const loc = location.toLowerCase();
  const wat = water.toLowerCase();
  const decisionTreeLog: string[] = [];
  const recommendedCrops = [];

  decisionTreeLog.push(`📡 Sensor Telemetry: Temperature: ${temp}°C, Humidity: ${humidity}%`);
  decisionTreeLog.push(`🧪 Soil Analysis: pH: ${ph}, Nitrogen(N): ${nitrogen} mg/kg, Phosphorus(P): ${phosphorus} mg/kg, Potash(K): ${potassium} mg/kg`);

  let moringaScore = loc.includes('guntur') ? 95 : 88;
  let dragonScore = loc.includes('anantapur') ? 95 : 75;
  let chilliScore = loc.includes('guntur') ? 95 : 82;
  let tomatoScore = 78;
  let groundnutScore = loc.includes('anantapur') ? 92 : 84;
  let spinachScore = 80;

  if (ph >= 7.2) {
    moringaScore += 8;
    dragonScore += 5;
    tomatoScore -= 15;
    spinachScore -= 10;
    decisionTreeLog.push(`⚖️ Decision: Alkaline soil pH (${ph}) detected -> Raising Moringa (+8%) and Dragon Fruit (+5%) suitability; reducing Tomatoes (-15%) and Spinach (-10%).`);
  } else if (ph < 6.0) {
    chilliScore -= 10;
    tomatoScore -= 8;
    spinachScore += 10;
    groundnutScore += 5;
    decisionTreeLog.push(`⚖️ Decision: Acidic soil pH (${ph}) detected -> Raising Spinach (+10%) and Groundnuts (+5%) suitability; reducing Chilli (-10%) and Tomatoes (-8%).`);
  } else {
    chilliScore += 10;
    tomatoScore += 12;
    spinachScore += 5;
    decisionTreeLog.push(`⚖️ Decision: Near-neutral soil pH (${ph}) detected -> Extremely favorable for Chilli (+10%) and Tomatoes (+12%).`);
  }

  if (nitrogen >= 70) {
    tomatoScore += 12;
    chilliScore += 8;
    spinachScore += 15;
    decisionTreeLog.push(`⚖️ Decision: Excellent Nitrogen content (${nitrogen} mg/kg) -> Raising Spinach suitability (+15%), Tomatoes (+12%) and Chilli (+8%).`);
  } else if (nitrogen < 35) {
    moringaScore += 5;
    tomatoScore -= 20;
    spinachScore -= 15;
    decisionTreeLog.push(`⚖️ Decision: Low Nitrogen content (${nitrogen} mg/kg) -> Moringa is highly resilient (+5%); Tomatoes (-20%) and Spinach (-15%) require heavy supplements.`);
  }

  if (temp >= 33) {
    dragonScore += 10;
    tomatoScore -= 12;
    spinachScore -= 20;
    decisionTreeLog.push(`⚖️ Decision: High temperature (${temp}°C) -> Perfect gestation profile for Dragon Fruit (+10%); causes blossom drop in Tomatoes (-12%) and bolting/wilting in Spinach (-20%).`);
  }

  const moringa: CropProfile = {
    cropName: 'Moringa (Drumstick) - PKM-1 Cultivar',
    scientificName: 'Moringa oleifera',
    suitabilityScore: Math.min(100, moringaScore),
    financialMetrics: {
      totalStartupCapEx: 45000 * acres,
      annualOpEx: 20000 * acres,
      estimatedYieldTons: parseFloat((8.5 * acres).toFixed(1)),
      annualGrossRevenue: 8.5 * acres * 35000,
      annualNetProfit: (8.5 * acres * 35000) - (20000 * acres),
      returnOnInvestmentPct: 42.5
    },
    costBreakdown: {
      seedsSaplings: Math.round(8000 * acres),
      landPreparation: Math.round(12000 * acres),
      organicInputs: Math.round(10000 * acres),
      dripIrrigation: Math.round(10000 * acres),
      laborSetup: Math.round(5000 * acres)
    },
    riskAssessment: {
      cropRiskScore: 20,
      primaryThreat: 'Susceptible to waterlogging during monsoon.',
      mitigationStrategies: [
        'Ensure raised bed plantation techniques are used.',
        'Maintain proper channel spacing for monsoon drainage.',
        'Sign buyback processing contracts via Farmora Collection Centers.'
      ]
    },
    projections: [
      { year: 1, revenue: Math.round(8.5 * acres * 35000 * 0.7), expenses: Math.round(20000 * acres), netProfit: Math.round((8.5 * acres * 35000 * 0.7) - (20000 * acres)), cumulativeRoi: Math.round((8.5 * acres * 35000 * 0.7) - (20000 * acres) - (45000 * acres)) },
      { year: 2, revenue: Math.round(8.5 * acres * 35000), expenses: Math.round(21000 * acres), netProfit: Math.round((8.5 * acres * 35000) - (21000 * acres)), cumulativeRoi: Math.round(((8.5 * acres * 35000 * 0.7) - (20000 * acres) - (45000 * acres)) + ((8.5 * acres * 35000) - (21000 * acres))) }
    ]
  };

  const groundnut: CropProfile = {
    cropName: 'High-Yield Groundnuts (Kadiri-6)',
    scientificName: 'Arachis hypogaea',
    suitabilityScore: Math.min(100, groundnutScore),
    financialMetrics: {
      totalStartupCapEx: 25000 * acres,
      annualOpEx: 15000 * acres,
      estimatedYieldTons: parseFloat((1.8 * acres).toFixed(1)),
      annualGrossRevenue: 1.8 * acres * 65000,
      annualNetProfit: (1.8 * acres * 65000) - (15000 * acres),
      returnOnInvestmentPct: 40.8
    },
    costBreakdown: {
      seedsSaplings: Math.round(6000 * acres),
      landPreparation: Math.round(8000 * acres),
      organicInputs: Math.round(5000 * acres),
      dripIrrigation: 0,
      laborSetup: Math.round(6000 * acres)
    },
    riskAssessment: {
      cropRiskScore: 25,
      primaryThreat: 'Vulnerable to white grub infestations and dry root rot.',
      mitigationStrategies: [
        'Implement early crop rotation cycles.',
        'Apply organic Trichoderma viride bio-pesticide during land preparation.',
        'Establish simple sprinkler setups to buffer dry spells.'
      ]
    },
    projections: [
      { year: 1, revenue: Math.round(1.8 * acres * 65000), expenses: Math.round(15000 * acres), netProfit: Math.round((1.8 * acres * 65000) - (15000 * acres)), cumulativeRoi: Math.round((1.8 * acres * 65000) - (15000 * acres) - (25000 * acres)) }
    ]
  };

  const spinach: CropProfile = {
    cropName: 'Organic Spinach (Leafy Greens)',
    scientificName: 'Spinacia oleracea',
    suitabilityScore: Math.min(100, spinachScore),
    financialMetrics: {
      totalStartupCapEx: 15000 * acres,
      annualOpEx: 12000 * acres,
      estimatedYieldTons: parseFloat((4.5 * acres).toFixed(1)),
      annualGrossRevenue: 4.5 * acres * 22000,
      annualNetProfit: (4.5 * acres * 22000) - (12000 * acres),
      returnOnInvestmentPct: 58.0
    },
    costBreakdown: {
      seedsSaplings: Math.round(3000 * acres),
      landPreparation: Math.round(5000 * acres),
      organicInputs: Math.round(4000 * acres),
      dripIrrigation: 0,
      laborSetup: Math.round(3000 * acres)
    },
    riskAssessment: {
      cropRiskScore: 15,
      primaryThreat: 'Highly perishable; delayed transport risks rapid wilting.',
      mitigationStrategies: [
        'Establish shaded sorting zones on field.',
        'Use organic compost mulching to lock in moisture.',
        'Coordinate direct delivery agreements with local procurement nodes.'
      ]
    },
    projections: [
      { year: 1, revenue: Math.round(4.5 * acres * 22000), expenses: Math.round(12000 * acres), netProfit: Math.round((4.5 * acres * 22000) - (12000 * acres)), cumulativeRoi: Math.round((4.5 * acres * 22000) - (12000 * acres) - (15000 * acres)) }
    ]
  };

  const chilli: CropProfile = {
    cropName: 'Guntur Sannam Red Chilli (Teja / S-334)',
    scientificName: 'Capsicum annuum',
    suitabilityScore: Math.min(100, chilliScore),
    financialMetrics: {
      totalStartupCapEx: 85000 * acres,
      annualOpEx: 60000 * acres,
      estimatedYieldTons: parseFloat((2.2 * acres).toFixed(1)),
      annualGrossRevenue: 2.2 * acres * 180000,
      annualNetProfit: (2.2 * acres * 180000) - (60000 * acres),
      returnOnInvestmentPct: 152.9
    },
    costBreakdown: {
      seedsSaplings: Math.round(15000 * acres),
      landPreparation: Math.round(15000 * acres),
      organicInputs: Math.round(25000 * acres),
      dripIrrigation: Math.round(15000 * acres),
      laborSetup: Math.round(15000 * acres)
    },
    riskAssessment: {
      cropRiskScore: 50,
      primaryThreat: 'Heavy pest pressure from Thrips and whiteflies.',
      mitigationStrategies: [
        'Install yellow/blue sticky cards and pheromone traps.',
        'Use neem oil sprays preventatively.',
        'Monitor local cold storage options to avoid distress selling.'
      ]
    },
    projections: [
      { year: 1, revenue: Math.round(2.2 * acres * 180000), expenses: Math.round(60000 * acres), netProfit: Math.round((2.2 * acres * 180000) - (60000 * acres)), cumulativeRoi: Math.round((2.2 * acres * 180000) - (60000 * acres) - (85000 * acres)) }
    ]
  };

  const dragon: CropProfile = {
    cropName: 'Premium Dragon Fruit (Red Meat)',
    scientificName: 'Selenicereus costaricensis',
    suitabilityScore: Math.min(100, dragonScore),
    financialMetrics: {
      totalStartupCapEx: 280000 * acres,
      annualOpEx: 40000 * acres,
      estimatedYieldTons: parseFloat((5.0 * acres).toFixed(1)),
      annualGrossRevenue: 5.0 * acres * 120000,
      annualNetProfit: (5.0 * acres * 120000) - (40000 * acres),
      returnOnInvestmentPct: 35.8
    },
    costBreakdown: {
      seedsSaplings: Math.round(90000 * acres),
      landPreparation: Math.round(30000 * acres),
      organicInputs: Math.round(40000 * acres),
      dripIrrigation: Math.round(40000 * acres),
      laborSetup: Math.round(80000 * acres)
    },
    riskAssessment: {
      cropRiskScore: 35,
      primaryThreat: 'High initial CapEx and longer gestation period.',
      mitigationStrategies: [
        'Utilize concrete trellis pillars.',
        'Adopt strict drip schedules.',
        'Intercrop with groundnuts during first 12 months.'
      ]
    },
    projections: [
      { year: 1, revenue: 0, expenses: Math.round(40000 * acres), netProfit: Math.round(-40000 * acres), cumulativeRoi: Math.round(-320000 * acres) },
      { year: 2, revenue: Math.round(5.0 * acres * 120000 * 0.5), expenses: Math.round(42000 * acres), netProfit: Math.round((5.0 * acres * 120000 * 0.5) - (42000 * acres)), cumulativeRoi: Math.round(-320000 * acres + ((5.0 * acres * 120000 * 0.5) - (42000 * acres))) }
    ]
  };

  const capPerAcre = budget / acres;

  if (capPerAcre >= 280000) {
    recommendedCrops.push(moringa, dragon, chilli, groundnut, spinach);
  } else if (capPerAcre >= 85000) {
    recommendedCrops.push(moringa, chilli, groundnut, spinach);
  } else if (capPerAcre >= 45000) {
    recommendedCrops.push(moringa, groundnut, spinach);
  } else {
    moringa.financialMetrics.totalStartupCapEx = 35000 * acres;
    recommendedCrops.push(spinach, groundnut, moringa);
  }

  if (wat === 'rainfall') {
    chilli.suitabilityScore -= 20;
    decisionTreeLog.push('💧 Decision: Rainfall dependency -> Penalizing Chilli suitability (-20%).');
  }

  recommendedCrops.sort((a, b) => b.suitabilityScore - a.suitabilityScore);

  return {
    evaluatedAt: new Date(),
    inputs: {
      location,
      landSizeAcres: acres,
      waterSource: water,
      budgetInr: budget,
      experienceLevel: experience,
      sensors: { soilPh: ph, npk: { n: nitrogen, p: phosphorus, k: potassium }, temp, humidity }
    },
    advisoryAlerts: ['Water Optimization Warning: Monitor moisture cycles regularly.'],
    decisionTreeLog,
    recommendations: recommendedCrops
  };
}

export default function Home() {
  const { t, language, setLanguage } = useTranslation();

  // Authentication & Session States
  const [profile, setProfile] = useState<any>(null);
  const [token, setToken] = useState<string>('');
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Farmer Accessibility Easy-Read UI State
  const [farmerMode, setFarmerMode] = useState(false);

  // Real-Time Soil & Climate Telemetry Sliders
  const [soilPh, setSoilPh] = useState(6.5);
  const [nitrogen, setNitrogen] = useState(50);
  const [phosphorus, setPhosphorus] = useState(40);
  const [potassium, setPotassium] = useState(40);
  const [climateTemp, setClimateTemp] = useState(32);
  const [climateHumidity, setClimateHumidity] = useState(60);

  // Polam AI Advisor States
  const [location, setLocation] = useState('');
  const [landSize, setLandSize] = useState('');
  const [water, setWater] = useState('drip');
  const [budget, setBudget] = useState('');
  const [experience, setExperience] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('BEGINNER');
  const [aiReport, setAiReport] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeAiTab, setActiveAiTab] = useState<'CROPS' | 'COSTS' | 'ROI' | 'RISK'>('CROPS');

  // Learning Stats & Streak
  const [learningXp, setLearningXp] = useState(150);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);
  const [quizResult, setQuizResult] = useState<string | null>(null);

  // Marketplace States
  const [activeMarketTab, setActiveMarketTab] = useState<'LAND' | 'OPPORTUNITIES' | 'JOBS'>('LAND');
  const [landListings, setLandListings] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedLandForLease, setSelectedLandForLease] = useState<any>(null);
  const [isLeaseDeedOpen, setIsLeaseDeedOpen] = useState(false);

  // Listing creation forms
  const [newLandTitle, setNewLandTitle] = useState('');
  const [newLandLocation, setNewLandLocation] = useState('');
  const [newLandSize, setNewLandSize] = useState('');
  const [newLandPrice, setNewLandPrice] = useState('');
  const [newLandWater, setNewLandWater] = useState('');
  const [newLandAgent, setNewLandAgent] = useState('');

  const [newOppTitle, setNewOppTitle] = useState('');
  const [newOppCap, setNewOppCap] = useState('');
  const [newOppRoi, setNewOppRoi] = useState('');
  const [newOppTime, setNewOppTime] = useState('');
  const [newOppDesc, setNewOppDesc] = useState('');

  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobDesc, setNewJobDesc] = useState('');
  const [newJobWage, setNewJobWage] = useState('');
  const [newJobLandId, setNewJobLandId] = useState('');

  // Admin audit records
  const [auditPendingUsers, setAuditPendingUsers] = useState<any[]>([]);
  const [auditPendingLands, setAuditPendingLands] = useState<any[]>([]);

  // Local storage session restorer
  useEffect(() => {
    const savedProfile = localStorage.getItem('farmora_profile');
    const savedToken = localStorage.getItem('farmora_token');
    if (savedProfile && savedToken) {
      try {
        setProfile(JSON.parse(savedProfile));
        setToken(savedToken);
      } catch (e) {
        // Clear broken profile
      }
    }
  }, []);

  // Fetch lists based on authentication status and roles
  const fetchMarketplaceData = async () => {
    // We construct robust mock backups if backend services compile offline
    try {
      const landRes = await fetch('http://localhost:5000/api/marketplace/land');
      if (landRes.ok) {
        const data = await landRes.json();
        setLandListings(data.listings || []);
      } else {
        throw new Error();
      }
    } catch (e) {
      setLandListings([
        { id: 1, title: 'Black Cotton Soil Farmland', location: 'Guntur District', size_acres: 5.0, lease_price_yearly: 45000, water_availability: 'Canal irrigation link', status: 'APPROVED', owner_name: 'Satish Kumar', agent_phone: '9885544321' },
        { id: 2, title: 'Red Sandy Loam Plot for Horticulture', location: 'Anantapur District', size_acres: 12.0, lease_price_yearly: 30000, water_availability: 'Borewell pump active', status: 'APPROVED', owner_name: 'Ramanadha Reddy', agent_phone: '9440011223' },
        { id: 3, title: 'Fertile Valley Clay Land', location: 'Chittoor District', size_acres: 8.0, lease_price_yearly: 35000, water_availability: 'Natural spring connection', status: 'PENDING_APPROVAL', owner_name: 'Venkatesh Rao', agent_phone: '9988776655' }
      ]);
    }

    try {
      const oppRes = await fetch('http://localhost:5000/api/marketplace/opportunities');
      if (oppRes.ok) {
        const data = await oppRes.json();
        setOpportunities(data.listings || []);
      } else {
        throw new Error();
      }
    } catch (e) {
      setOpportunities([
        { id: 101, title: 'Organic Value Chain Spice Extraction', category: 'NURSERY', capital_required: 150000, risk_score: 25, expected_roi: 18.5, time_horizon_months: 12, description: 'Scaling spice extraction for Guntur peppers and processing cold pressed groundnut oils.', status: 'ACTIVE' },
        { id: 102, title: 'High-Density Dragon Fruit Plantation', category: 'DRAGON_FRUIT', capital_required: 450000, risk_score: 35, expected_roi: 24.0, time_horizon_months: 24, description: 'Trellised orchard with automated sub-soil drip lines and organic bio-stimulants.', status: 'ACTIVE' }
      ]);
    }

    try {
      const jobsRes = await fetch('http://localhost:5000/api/marketplace/jobs');
      if (jobsRes.ok) {
        const data = await jobsRes.json();
        setJobs(data.listings || []);
      } else {
        throw new Error();
      }
    } catch (e) {
      setJobs([
        { id: 201, title: 'Raised Bed Monsoon Spacing & Channeling', description: 'Prepare channels and raised bed layout across 5 acres. Requires experience operating organic mulches.', daily_wage: 650, status: 'OPEN', employer_name: 'Satish Kumar', land_title: 'Black Cotton Soil Farmland' },
        { id: 202, title: 'Concrete Trellis Pillar Erection', description: 'Install trellis frames and ring supports for Horticulture orchards. Heavy labor.', daily_wage: 800, status: 'OPEN', employer_name: 'Ramanadha Reddy', land_title: 'Red Sandy Loam Plot' }
      ]);
    }
  };

  const fetchStaffAuditData = async () => {
    if (!token) return;
    try {
      const userRes = await fetch('http://localhost:5000/api/kyc/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (userRes.ok) {
        const data = await userRes.json();
        setAuditPendingUsers(data.listings || []);
      }
      const landRes = await fetch('http://localhost:5000/api/marketplace/land', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (landRes.ok) {
        const data = await landRes.json();
        setAuditPendingLands((data.listings || []).filter((l: any) => l.status === 'PENDING_APPROVAL'));
      }
    } catch (e) {
      // Stub offline values
      setAuditPendingUsers([
        { id: 4, name: 'Srinivas Murthy', role: 'LAND_OWNER', kyc_status: 'SUBMITTED', document_type: 'LAND_DEED', document_number: 'DEED-RTC-KA-0012' }
      ]);
      setAuditPendingLands([
        { id: 3, title: 'Fertile Valley Clay Land', location: 'Chittoor District', size_acres: 8.0, lease_price_yearly: 35000, owner_name: 'Venkatesh Rao' }
      ]);
    }
  };

  useEffect(() => {
    fetchMarketplaceData();
  }, [profile]);

  useEffect(() => {
    if (profile?.role === 'STAFF' || profile?.role === 'ADMIN') {
      fetchStaffAuditData();
    }
  }, [profile, token]);

  const handleAuthSuccess = (newProfile: any, newToken: string) => {
    setProfile(newProfile);
    setToken(newToken);
    localStorage.setItem('farmora_profile', JSON.stringify(newProfile));
    localStorage.setItem('farmora_token', newToken);
  };

  const handleLogout = () => {
    setProfile(null);
    setToken('');
    localStorage.removeItem('farmora_profile');
    localStorage.removeItem('farmora_token');
  };

  const handleKycUpdated = (newStatus: string) => {
    if (profile) {
      const updated = { ...profile, kyc_status: newStatus };
      setProfile(updated);
      localStorage.setItem('farmora_profile', JSON.stringify(updated));
    }
  };

  const handleConsultAI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location || !landSize || !budget) return;
    setAiLoading(true);

    setTimeout(() => {
      const report = generateMockReport(
        location,
        parseFloat(landSize),
        parseFloat(budget),
        water,
        experience,
        soilPh,
        nitrogen,
        phosphorus,
        potassium,
        climateTemp,
        climateHumidity
      );
      setAiReport(report);
      setAiLoading(false);
    }, 1200);
  };

  // Gamified learning quiz handler
  const handleQuizSubmit = (opt: string) => {
    setQuizAnswer(opt);
    if (opt === 'COMPOST') {
      setQuizResult('CORRECT');
      setLearningXp(prev => prev + 50);
    } else {
      setQuizResult('WRONG');
    }
  };

  // Land listing registration handler
  const handleCreateLand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || profile.kyc_status !== 'APPROVED') {
      alert(t('lockedAlert'));
      return;
    }
    const newLand = {
      title: newLandTitle,
      location: newLandLocation,
      size_acres: parseFloat(newLandSize),
      lease_price_yearly: parseFloat(newLandPrice),
      water_availability: newLandWater,
      agent_id: newLandAgent ? parseInt(newLandAgent) : null
    };

    try {
      const res = await fetch('http://localhost:5000/api/marketplace/land', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newLand)
      });
      if (res.ok) {
        alert('Farmland registered successfully! Awaiting Staff document audit.');
        fetchMarketplaceData();
      } else {
        throw new Error();
      }
    } catch (e) {
      // Offline simulation fallback addition
      const simulated = {
        id: landListings.length + 1,
        title: newLandTitle,
        location: newLandLocation,
        size_acres: parseFloat(newLandSize),
        lease_price_yearly: parseFloat(newLandPrice),
        water_availability: newLandWater,
        status: 'PENDING_APPROVAL',
        owner_name: profile.name,
        agent_phone: '9000112233'
      };
      setLandListings(prev => [...prev, simulated]);
      alert('Offline Sandbox: Farmland logged under pending audit!');
    }
    setNewLandTitle('');
    setNewLandLocation('');
    setNewLandSize('');
    setNewLandPrice('');
    setNewLandWater('');
    setNewLandAgent('');
  };

  // Venture capital creation handler
  const handleCreateOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    const newOpp = {
      title: newOppTitle,
      category: 'NURSERY',
      capital_required: parseFloat(newOppCap),
      risk_score: 20,
      expected_roi: parseFloat(newOppRoi),
      time_horizon_months: parseInt(newOppTime),
      description: newOppDesc
    };

    try {
      const res = await fetch('http://localhost:5000/api/marketplace/opportunities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newOpp)
      });
      if (res.ok) {
        alert('Investment opportunity launched successfully!');
        fetchMarketplaceData();
      } else {
        throw new Error();
      }
    } catch (e) {
      const simulated = {
        id: opportunities.length + 101,
        title: newOppTitle,
        category: 'NURSERY',
        capital_required: parseFloat(newOppCap),
        risk_score: 20,
        expected_roi: parseFloat(newOppRoi),
        time_horizon_months: parseInt(newOppTime),
        description: newOppDesc,
        status: 'ACTIVE'
      };
      setOpportunities(prev => [...prev, simulated]);
      alert('Offline Sandbox: Capital venture logged!');
    }
    setNewOppTitle('');
    setNewOppCap('');
    setNewOppRoi('');
    setNewOppTime('');
    setNewOppDesc('');
  };

  // Job creation posting handler
  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    const newJob = {
      land_listing_id: parseInt(newJobLandId),
      title: newJobTitle,
      description: newJobDesc,
      daily_wage: parseFloat(newJobWage)
    };

    try {
      const res = await fetch('http://localhost:5000/api/marketplace/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newJob)
      });
      if (res.ok) {
        alert('Farming support job published!');
        fetchMarketplaceData();
      } else {
        throw new Error();
      }
    } catch (e) {
      const matchingLand = landListings.find(l => l.id === parseInt(newJobLandId));
      const simulated = {
        id: jobs.length + 201,
        title: newJobTitle,
        description: newJobDesc,
        daily_wage: parseFloat(newJobWage),
        status: 'OPEN',
        employer_name: profile.name,
        land_title: matchingLand ? matchingLand.title : 'My Field'
      };
      setJobs(prev => [...prev, simulated]);
      alert('Offline Sandbox: Farming support job logged!');
    }
    setNewJobTitle('');
    setNewJobDesc('');
    setNewJobWage('');
    setNewJobLandId('');
  };

  // Auditing handlers
  const handleAuditKyc = async (userId: number, approve: boolean) => {
    try {
      const res = await fetch('http://localhost:5000/api/kyc/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          target_user_id: userId,
          approved: approve,
          remarks: approve ? 'Verified title records successfully' : 'Title deed matches outdated owner index'
        })
      });
      if (res.ok) {
        alert('eKYC Document Audit logged!');
        fetchStaffAuditData();
      }
    } catch (e) {
      setAuditPendingUsers(prev => prev.filter(u => u.id !== userId));
      alert('Offline Sandbox Audit complete!');
    }
  };

  const handleAuditLand = async (landId: number, approve: boolean) => {
    try {
      const res = await fetch('http://localhost:5000/api/marketplace/audit-land', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          land_listing_id: landId,
          approved: approve
        })
      });
      if (res.ok) {
        alert('Farmland Listing Audit logged!');
        fetchStaffAuditData();
        fetchMarketplaceData();
      }
    } catch (e) {
      setAuditPendingLands(prev => prev.filter(l => l.id !== landId));
      if (approve) {
        setLandListings(prev => prev.map(l => l.id === landId ? { ...l, status: 'APPROVED' } : l));
      } else {
        setLandListings(prev => prev.filter(l => l.id !== landId));
      }
      alert('Offline Sandbox Audit complete!');
    }
  };

  // Claim actions
  const handleClaimJob = async (jobId: number) => {
    if (!profile) {
      setIsAuthOpen(true);
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/api/marketplace/jobs/${jobId}/claim`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert(t('claimedAlert'));
        fetchMarketplaceData();
      }
    } catch (e) {
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'ASSIGNED', farmer_name: profile.name } : j));
      alert(t('claimedAlert'));
    }
  };

  const handleTriggerLease = (listing: any) => {
    if (!profile) {
      setIsAuthOpen(true);
      return;
    }
    if (profile.kyc_status !== 'APPROVED') {
      alert(t('lockedAlert'));
      return;
    }
    setSelectedLandForLease(listing);
    setIsLeaseDeedOpen(true);
  };

  const handleConfirmLeaseMatch = async () => {
    if (!selectedLandForLease) return;
    try {
      const res = await fetch('http://localhost:5000/api/marketplace/lease-inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ land_listing_id: selectedLandForLease.id })
      });
      if (res.ok) {
        alert('Legal Lease Deed generated and matched successfully! Local agent is verifying boundaries.');
        setIsLeaseDeedOpen(false);
        fetchMarketplaceData();
      }
    } catch (e) {
      setLandListings(prev => prev.map(l => l.id === selectedLandForLease.id ? { ...l, status: 'LEASED' } : l));
      alert('Legal Lease Deed generated and matched successfully (Offline Mock)! Local agent is verifying boundaries.');
      setIsLeaseDeedOpen(false);
    }
  };

  return (
    <main className={`${styles.mainLayout} ${farmerMode ? styles.farmerMode : ''}`}>
      {/* 1. Header Section */}
      <header className={styles.header}>
        <div className={styles.brandGroup}>
          <span style={{ fontSize: '2rem' }}>🌿</span>
          <h1 className={styles.brandLogo}>{t('brandName')}</h1>
        </div>

        <div className={styles.navControls}>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            className={styles.langSelector}
          >
            <option value="en">English (EN)</option>
            <option value="te">తెలుగు (TE)</option>
            <option value="hi">हिन्दी (HI)</option>
            <option value="ta">தமிழ் (TA)</option>
            <option value="kn">ಕನ್ನಡ (KN)</option>
          </select>

          <button
            onClick={() => setFarmerMode(prev => !prev)}
            className={styles.accentToggle}
          >
            {farmerMode ? 'Standard Theme' : t('farmerModeToggle')}
          </button>

          {profile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--primary-light)' }}>
                👤 {profile.name} ({profile.role})
              </span>
              <button onClick={handleLogout} className={styles.logoutBtn}>
                {t('logout')}
              </button>
            </div>
          ) : (
            <button onClick={() => setIsAuthOpen(true)} className={styles.loginBtn}>
              {t('login')}
            </button>
          )}
        </div>
      </header>

      {/* 2. Hero Waitlist Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>{t('brandSlogan')}</h1>
          <p className={styles.heroSub}>{t('brandSub')}</p>

          <div className={styles.ctaGroup}>
            <button
              onClick={() => {
                const el = document.getElementById('ai-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className={styles.primaryCta}
            >
              🚀 {t('aiTitle')}
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('marketplace-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className={styles.secondaryCta}
            >
              💼 {t('marketTitle')}
            </button>
          </div>
        </div>
      </section>

      {/* 3. Soil and Climate Sensor Sliders (IoT Telemetry Console) */}
      <section className={styles.dashboardSection} style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '3rem' }}>
        <div className={styles.sensorTelemetryWidget}>
          <div className={styles.dashboardHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📡</span>
              <h2>{t('telemetryTitle')}</h2>
            </div>
            <span className={styles.statusBadge} style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary-light)' }}>
              🟢 {t('activeSensors')}
            </span>
          </div>

          <div className={styles.npkGrid}>
            <div className={styles.sensorDialCard}>
              <span className={styles.sensorDialLabel}>🧪 {t('phLabel')}</span>
              <span className={styles.sensorDialValue} style={{ color: 'var(--accent-gold)' }}>{soilPh}</span>
              <input
                type="range"
                min="4.5"
                max="9.0"
                step="0.1"
                value={soilPh}
                onChange={(e) => setSoilPh(parseFloat(e.target.value))}
                className={styles.rangeSliderInput}
              />
            </div>

            <div className={styles.sensorDialCard}>
              <span className={styles.sensorDialLabel}>N-Nitrogen</span>
              <span className={styles.sensorDialValue} style={{ color: '#60a5fa' }}>{nitrogen} mg/kg</span>
              <input
                type="range"
                min="10"
                max="120"
                step="1"
                value={nitrogen}
                onChange={(e) => setNitrogen(parseInt(e.target.value))}
                className={styles.rangeSliderInput}
              />
            </div>

            <div className={styles.sensorDialCard}>
              <span className={styles.sensorDialLabel}>P-Phosphorus</span>
              <span className={styles.sensorDialValue} style={{ color: '#a78bfa' }}>{phosphorus} mg/kg</span>
              <input
                type="range"
                min="10"
                max="100"
                step="1"
                value={phosphorus}
                onChange={(e) => setPhosphorus(parseInt(e.target.value))}
                className={styles.rangeSliderInput}
              />
            </div>

            <div className={styles.sensorDialCard}>
              <span className={styles.sensorDialLabel}>K-Potash</span>
              <span className={styles.sensorDialValue} style={{ color: '#f472b6' }}>{potassium} mg/kg</span>
              <input
                type="range"
                min="10"
                max="100"
                step="1"
                value={potassium}
                onChange={(e) => setPotassium(parseInt(e.target.value))}
                className={styles.rangeSliderInput}
              />
            </div>

            <div className={styles.sensorDialCard}>
              <span className={styles.sensorDialLabel}>🌡️ {t('tempLabel')}</span>
              <span className={styles.sensorDialValue} style={{ color: '#f59e0b' }}>{climateTemp}°C</span>
              <input
                type="range"
                min="15"
                max="45"
                step="1"
                value={climateTemp}
                onChange={(e) => setClimateTemp(parseInt(e.target.value))}
                className={styles.rangeSliderInput}
              />
            </div>

            <div className={styles.sensorDialCard}>
              <span className={styles.sensorDialLabel}>💧 {t('humidityLabel')}</span>
              <span className={styles.sensorDialValue} style={{ color: '#10b981' }}>{climateHumidity}%</span>
              <input
                type="range"
                min="20"
                max="95"
                step="1"
                value={climateHumidity}
                onChange={(e) => setClimateHumidity(parseInt(e.target.value))}
                className={styles.rangeSliderInput}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. Polam AI Advisor Widget */}
      <section id="ai-section" className={styles.dashboardSection}>
        <div className={styles.aiPanel} style={{ background: 'rgba(18, 30, 20, 0.45)', border: '1px solid var(--border-glass)', padding: '2.5rem', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>🧠 {t('aiTitle')}</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>{t('aiSub')}</p>

          <form onSubmit={handleConsultAI} className={styles.aiForm}>
            <div className={styles.formGrid}>
              <div className={styles.inputGroup}>
                <label>{t('fieldLocation')}</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t('fieldLocationPlaceholder')}
                  required
                  className={styles.textInput}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>{t('fieldSize')}</label>
                <input
                  type="number"
                  value={landSize}
                  onChange={(e) => setLandSize(e.target.value)}
                  placeholder={t('fieldSizePlaceholder')}
                  required
                  className={styles.textInput}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>{t('fieldWater')}</label>
                <select
                  value={water}
                  onChange={(e) => setWater(e.target.value)}
                  className={styles.selectInput}
                >
                  <option value="drip">{t('waterDrip')}</option>
                  <option value="borewell">{t('waterBorewell')}</option>
                  <option value="canal">{t('waterCanal')}</option>
                  <option value="rainfall">{t('waterRain')}</option>
                  <option value="openwell">{t('waterOpenwell')}</option>
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label>{t('fieldBudget')}</label>
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder={t('fieldBudgetPlaceholder')}
                  required
                  className={styles.textInput}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>{t('fieldExperience')}</label>
                <select
                  value={experience}
                  onChange={(e: any) => setExperience(e.target.value)}
                  className={styles.selectInput}
                >
                  <option value="BEGINNER">{t('expBeginner')}</option>
                  <option value="INTERMEDIATE">{t('expIntermediate')}</option>
                  <option value="ADVANCED">{t('expAdvanced')}</option>
                </select>
              </div>
            </div>

            <button type="submit" className={styles.primaryCta} style={{ width: '100%', marginTop: '2rem' }} disabled={aiLoading}>
              {aiLoading ? t('aiLoading') : t('aiBtn')}
            </button>
          </form>

          {/* AI results display panel */}
          {aiReport && (
            <div className={styles.aiResults} style={{ marginTop: '3rem', borderTop: '1px solid var(--border-glass)', paddingTop: '2.5rem' }}>
              <div className={styles.aiResultsHeader}>
                <h3>📊 {t('aiResultsTitle')}</h3>
              </div>

              <div className={styles.resultTabs} style={{ display: 'flex', gap: '0.8rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem', marginBottom: '2rem' }}>
                {(['CROPS', 'COSTS', 'ROI', 'RISK'] as const).map(tab => (
                  <button
                    key={tab}
                    type="button"
                    className={`${styles.tabBtn} ${activeAiTab === tab ? styles.activeTabBtn : ''}`}
                    onClick={() => setActiveAiTab(tab)}
                  >
                    {tab === 'CROPS' ? t('tabCrops') : tab === 'COSTS' ? t('tabCosts') : tab === 'ROI' ? t('tabRoi') : t('tabRisk')}
                  </button>
                ))}
              </div>

              {activeAiTab === 'CROPS' && (
                <div className={styles.cropCatalogGrid}>
                  {aiReport.recommendations.map((crop: any, i: number) => (
                    <div key={i} className={styles.cropCard}>
                      <div className={styles.cropHeader}>
                        <div>
                          <strong className={styles.cropTitle}>{crop.cropName}</strong>
                          <span style={{ fontStyle: 'italic', fontSize: '0.8rem', display: 'block', color: 'var(--text-secondary)' }}>
                            {crop.scientificName}
                          </span>
                        </div>
                        <span className={styles.suitabilityBadge} style={{ background: crop.suitabilityScore >= 85 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)' }}>
                          {t('suitability')}: {crop.suitabilityScore}%
                        </span>
                      </div>

                      <div className={styles.cropMetaGrid}>
                        <div className={styles.metaItem}>
                          <span>{t('startupCost')}</span>
                          <strong>₹{crop.financialMetrics.totalStartupCapEx.toLocaleString()}</strong>
                        </div>
                        <div className={styles.metaItem}>
                          <span>{t('annualOpEx')}</span>
                          <strong>₹{crop.financialMetrics.annualOpEx.toLocaleString()}</strong>
                        </div>
                        <div className={styles.metaItem}>
                          <span>{t('annualRevenue')}</span>
                          <strong>₹{crop.financialMetrics.annualGrossRevenue.toLocaleString()}</strong>
                        </div>
                        <div className={styles.metaItem}>
                          <span>{t('annualProfit')}</span>
                          <strong style={{ color: 'var(--primary-light)' }}>₹{crop.financialMetrics.annualNetProfit.toLocaleString()}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeAiTab === 'COSTS' && (
                <div className={styles.cropCatalogGrid}>
                  {aiReport.recommendations.map((crop: any, i: number) => (
                    <div key={i} className={styles.cropCard}>
                      <strong className={styles.cropTitle} style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'block' }}>
                        🛠️ {crop.cropName} Breakdown
                      </strong>
                      <div className={styles.cropMetaGrid} style={{ gridTemplateColumns: '1fr 1fr' }}>
                        <div className={styles.metaItem}>
                          <span>Seeds/Saplings</span>
                          <strong>₹{crop.costBreakdown.seedsSaplings.toLocaleString()}</strong>
                        </div>
                        <div className={styles.metaItem}>
                          <span>Land Preparation</span>
                          <strong>₹{crop.costBreakdown.landPreparation.toLocaleString()}</strong>
                        </div>
                        <div className={styles.metaItem}>
                          <span>Organic Compost/Inputs</span>
                          <strong>₹{crop.costBreakdown.organicInputs.toLocaleString()}</strong>
                        </div>
                        <div className={styles.metaItem}>
                          <span>Drip Irrigation Setup</span>
                          <strong>₹{crop.costBreakdown.dripIrrigation.toLocaleString()}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeAiTab === 'ROI' && (
                <div className={styles.roiTableContainer}>
                  <table className={styles.roiTable}>
                    <thead>
                      <tr>
                        <th>Crop Title</th>
                        <th>Startup CapEx</th>
                        <th>Year 1 Net Profit</th>
                        <th>Year 2 Net Profit</th>
                        <th>Estimated 2-Year Yield</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aiReport.recommendations.map((crop: any, i: number) => (
                        <tr key={i}>
                          <td><strong>{crop.cropName}</strong></td>
                          <td>₹{crop.financialMetrics.totalStartupCapEx.toLocaleString()}</td>
                          <td>₹{crop.projections[0]?.netProfit.toLocaleString() || 'N/A'}</td>
                          <td>{crop.projections[1] ? `₹${crop.projections[1].netProfit.toLocaleString()}` : 'N/A'}</td>
                          <td>{crop.financialMetrics.estimatedYieldTons} Tons</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeAiTab === 'RISK' && (
                <div className={styles.cropCatalogGrid}>
                  {aiReport.recommendations.map((crop: any, i: number) => (
                    <div key={i} className={styles.cropCard} style={{ borderLeft: '4px solid #ef4444' }}>
                      <strong className={styles.cropTitle} style={{ color: '#f87171' }}>⚠️ {crop.cropName}</strong>
                      <div style={{ marginTop: '0.8rem', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem' }}>
                          <strong>{t('riskThreat')}:</strong> {crop.riskAssessment.primaryThreat}
                        </span>
                        <div style={{ marginTop: '0.6rem' }}>
                          <strong>{t('preventionStrategy')}:</strong>
                          <ul style={{ paddingLeft: '1.2rem', marginTop: '0.3rem', color: 'var(--text-secondary)' }}>
                            {crop.riskAssessment.mitigationStrategies.map((st: string, idx: number) => (
                              <li key={idx}>{st}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Internal Decision Tree Trace Logger */}
              <div className={styles.decisionTreeConsole} style={{ marginTop: '2.5rem' }}>
                <span className={styles.sensorDialLabel} style={{ fontSize: '0.85rem', color: 'var(--accent-gold)' }}>🛡️ {t('decisionTreeTitle')}</span>
                <div className={styles.terminalBlock} style={{ background: '#090d0a', border: '1px solid var(--border-glass)', padding: '1.2rem', borderRadius: '8px', marginTop: '0.5rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#10b981', lineHeight: '1.6' }}>
                  {aiReport.decisionTreeLog.map((log: string, idx: number) => (
                    <div key={idx} className={styles.terminalLine}>👉 {log}</div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 5. eKYC Verification Banner */}
      {profile && (
        <section className={styles.dashboardSection}>
          <KYCManager
            token={token}
            userProfile={profile}
            onKycUpdated={handleKycUpdated}
          />
        </section>
      )}

      {/* 6. Dynamic Workspaces / Dashboards based on User Roles */}
      {profile && (
        <section className={styles.dashboardSection} style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '4rem' }}>
          <div className={styles.roleConsole}>
            <div className={styles.dashboardHeader}>
              <h2 style={{ fontSize: '1.6rem' }}>
                🛠️ {profile.role === 'FARMER' ? t('dashFarmer') :
                    profile.role === 'LAND_OWNER' ? t('dashLandowner') :
                    profile.role === 'INVESTOR' ? t('dashInvestor') :
                    profile.role === 'AGENT' ? t('dashAgent') :
                    profile.role === 'STAFF' ? t('dashStaff') : t('dashAdmin')}
              </h2>
            </div>

            {/* FARMER DASHBOARD */}
            {profile.role === 'FARMER' && (
              <div className={styles.dashboardGrid}>
                <div className={styles.cropCard}>
                  <h3>Streak & Rewards</h3>
                  <div className={styles.cropMetaGrid}>
                    <div className={styles.metaItem}>
                      <span>Streaks</span>
                      <strong>🔥 5 Days</strong>
                    </div>
                    <div className={styles.metaItem}>
                      <span>Studied Lessons</span>
                      <strong>📖 1/5 Modules</strong>
                    </div>
                  </div>
                </div>

                <div className={styles.cropCard}>
                  <h3>Assigned/Claimed Jobs</h3>
                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {jobs.filter(j => j.farmer_name === profile.name).map((job, idx) => (
                      <div key={idx} style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '0.8rem', borderRadius: '6px' }}>
                        <strong>{job.title}</strong>
                        <span style={{ fontSize: '0.8rem', display: 'block', color: 'var(--text-secondary)' }}>
                          📍 Land: {job.land_title} | 💰 Daily Wage: ₹{job.daily_wage}
                        </span>
                      </div>
                    ))}
                    {jobs.filter(j => j.farmer_name === profile.name).length === 0 && (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No claimed farming support jobs. Browse jobs tab below to claim.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* LANDOWNER DASHBOARD */}
            {profile.role === 'LAND_OWNER' && (
              <div className={styles.dashboardGrid}>
                {/* Form to list new land */}
                <div className={styles.cropCard} style={{ gridColumn: 'span 2' }}>
                  <h3>{t('listLandBtn')}</h3>
                  <form onSubmit={handleCreateLand} className={styles.aiForm} style={{ marginTop: '1rem' }}>
                    <div className={styles.formGrid}>
                      <div className={styles.inputGroup}>
                        <label>{t('landTitleField')}</label>
                        <input
                          type="text"
                          value={newLandTitle}
                          onChange={(e) => setNewLandTitle(e.target.value)}
                          placeholder="e.g. Fertile Red Loam land near Chittoor"
                          required
                          className={styles.textInput}
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label>{t('fieldLocation')}</label>
                        <input
                          type="text"
                          value={newLandLocation}
                          onChange={(e) => setNewLandLocation(e.target.value)}
                          placeholder="e.g. Chittoor District"
                          required
                          className={styles.textInput}
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label>{t('fieldSize')}</label>
                        <input
                          type="number"
                          value={newLandSize}
                          onChange={(e) => setNewLandSize(e.target.value)}
                          placeholder="Acres"
                          required
                          className={styles.textInput}
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label>{t('priceField')}</label>
                        <input
                          type="number"
                          value={newLandPrice}
                          onChange={(e) => setNewLandPrice(e.target.value)}
                          placeholder="INR / year"
                          required
                          className={styles.textInput}
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label>{t('waterField')}</label>
                        <input
                          type="text"
                          value={newLandWater}
                          onChange={(e) => setNewLandWater(e.target.value)}
                          placeholder="e.g. Borewell active / Drip installed"
                          required
                          className={styles.textInput}
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label>{t('agentLink')}</label>
                        <input
                          type="text"
                          value={newLandAgent}
                          onChange={(e) => setNewLandAgent(e.target.value)}
                          placeholder="Agent Mobile number"
                          className={styles.textInput}
                        />
                      </div>
                    </div>
                    <button type="submit" className={styles.primaryCta} style={{ marginTop: '1rem', width: '100%' }}>
                      {t('createLandBtn')}
                    </button>
                  </form>
                </div>

                {/* Form to hire cultivators (Farming support jobs) */}
                <div className={styles.cropCard}>
                  <h3>{t('publishJobBtn')}</h3>
                  <form onSubmit={handlePostJob} className={styles.aiForm} style={{ marginTop: '1rem' }}>
                    <div className={styles.inputGroup} style={{ marginBottom: '1rem' }}>
                      <label>Select Farmland Asset</label>
                      <select
                        value={newJobLandId}
                        onChange={(e) => setNewJobLandId(e.target.value)}
                        required
                        className={styles.selectInput}
                      >
                        <option value="">-- Choose Field --</option>
                        {landListings.map(l => (
                          <option key={l.id} value={l.id}>{l.title}</option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.inputGroup} style={{ marginBottom: '1rem' }}>
                      <label>Job Title / Headline</label>
                      <input
                        type="text"
                        value={newJobTitle}
                        onChange={(e) => setNewJobTitle(e.target.value)}
                        placeholder="e.g. Raised bed channeling preparation"
                        required
                        className={styles.textInput}
                      />
                    </div>

                    <div className={styles.inputGroup} style={{ marginBottom: '1rem' }}>
                      <label>{t('jobDescField')}</label>
                      <textarea
                        value={newJobDesc}
                        onChange={(e) => setNewJobDesc(e.target.value)}
                        placeholder="Specify organic inputs/materials needed."
                        required
                        className={styles.textInput}
                        rows={3}
                      />
                    </div>

                    <div className={styles.inputGroup} style={{ marginBottom: '1rem' }}>
                      <label>{t('dailyWageLabel')}</label>
                      <input
                        type="number"
                        value={newJobWage}
                        onChange={(e) => setNewJobWage(e.target.value)}
                        placeholder="INR / Day"
                        required
                        className={styles.textInput}
                      />
                    </div>

                    <button type="submit" className={styles.primaryCta} style={{ width: '100%' }}>
                      {t('postJobSubmitBtn')}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* INVESTOR DASHBOARD */}
            {profile.role === 'INVESTOR' && (
              <div className={styles.dashboardGrid}>
                <div className={styles.cropCard}>
                  <h3>My Farm Capital Portfolio</h3>
                  <div className={styles.cropMetaGrid}>
                    <div className={styles.metaItem}>
                      <span>Committed Capital</span>
                      <strong>₹2,50,000</strong>
                    </div>
                    <div className={styles.metaItem}>
                      <span>Expected Net Yield</span>
                      <strong>₹38,500/year</strong>
                    </div>
                  </div>
                </div>

                <div className={styles.cropCard}>
                  <h3>{t('listOppBtn')}</h3>
                  <form onSubmit={handleCreateOpportunity} className={styles.aiForm} style={{ marginTop: '1rem' }}>
                    <div className={styles.inputGroup} style={{ marginBottom: '0.8rem' }}>
                      <label>Venture Title</label>
                      <input
                        type="text"
                        value={newOppTitle}
                        onChange={(e) => setNewOppTitle(e.target.value)}
                        placeholder="e.g. High-Density Mango Plantation"
                        required
                        className={styles.textInput}
                      />
                    </div>
                    <div className={styles.inputGroup} style={{ marginBottom: '0.8rem' }}>
                      <label>Capital Required (INR)</label>
                      <input
                        type="number"
                        value={newOppCap}
                        onChange={(e) => setNewOppCap(e.target.value)}
                        placeholder="INR"
                        required
                        className={styles.textInput}
                      />
                    </div>
                    <div className={styles.inputGroup} style={{ marginBottom: '0.8rem' }}>
                      <label>Projected ROI (%)</label>
                      <input
                        type="number"
                        value={newOppRoi}
                        onChange={(e) => setNewOppRoi(e.target.value)}
                        placeholder="e.g. 18.5"
                        required
                        className={styles.textInput}
                      />
                    </div>
                    <div className={styles.inputGroup} style={{ marginBottom: '0.8rem' }}>
                      <label>Time Horizon (Months)</label>
                      <input
                        type="number"
                        value={newOppTime}
                        onChange={(e) => setNewOppTime(e.target.value)}
                        placeholder="Months"
                        required
                        className={styles.textInput}
                      />
                    </div>
                    <button type="submit" className={styles.primaryCta} style={{ width: '100%' }}>
                      {t('createOppBtn')}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* AGENT DASHBOARD */}
            {profile.role === 'AGENT' && (
              <div className={styles.dashboardGrid}>
                <div className={styles.cropCard}>
                  <h3>{t('agentProcureLand')}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Match verified landowners with farming opportunities.</p>
                </div>
                <div className={styles.cropCard}>
                  <h3>{t('agentInquiries')}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>View active investor and land leasing leads assigned in your operational district.</p>
                </div>
              </div>
            )}

            {/* STAFF AUDITING CONSOLE */}
            {(profile.role === 'STAFF' || profile.role === 'ADMIN') && (
              <div className={styles.auditorConsole}>
                <div className={styles.cropCard}>
                  <h3>🧑‍⚖️ {t('staffPendingKyc')}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem' }}>
                    {auditPendingUsers.map((user) => (
                      <div key={user.id} className={styles.auditItemRow} style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.8rem' }}>
                        <div>
                          <strong>{user.name} ({user.role})</strong>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>
                            Document: {user.document_type} | ID: {user.document_number}
                          </span>
                        </div>
                        <div className={styles.auditActions} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <button onClick={() => handleAuditKyc(user.id, true)} className={styles.approveAuditBtn} style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '0.3rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Approve</button>
                          <button onClick={() => handleAuditKyc(user.id, false)} className={styles.rejectAuditBtn} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.3rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Reject</button>
                        </div>
                      </div>
                    ))}
                    {auditPendingUsers.length === 0 && (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Zero pending KYC document audits logs.</p>
                    )}
                  </div>
                </div>

                <div className={styles.cropCard}>
                  <h3>🚜 {t('staffPendingLand')}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem' }}>
                    {auditPendingLands.map((land) => (
                      <div key={land.id} className={styles.auditItemRow} style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.8rem' }}>
                        <div>
                          <strong>{land.title}</strong>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>
                            📍 Location: {land.location} | Owner: {land.owner_name}
                          </span>
                        </div>
                        <div className={styles.auditActions} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <button onClick={() => handleAuditLand(land.id, true)} className={styles.approveAuditBtn} style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '0.3rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Approve Field</button>
                          <button onClick={() => handleAuditLand(land.id, false)} className={styles.rejectAuditBtn} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.3rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Reject Field</button>
                        </div>
                      </div>
                    ))}
                    {auditPendingLands.length === 0 && (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Zero pending land listings audits logs.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 7. Integrated Marketplaces Tab Widget */}
      <section id="marketplace-section" className={styles.marketplaceSection} style={{ padding: '4rem 2rem', background: 'rgba(9, 13, 10, 0.25)', borderTop: '1px solid var(--border-glass)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div className={styles.dashboardHeader}>
            <h2>💼 {t('marketTitle')}</h2>
          </div>

          <div className={styles.marketTabs}>
            {(['LAND', 'OPPORTUNITIES', 'JOBS'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                className={`${styles.marketTabBtn} ${activeMarketTab === tab ? styles.activeMarketTab : ''}`}
                onClick={() => setActiveMarketTab(tab)}
              >
                <span className={styles.tabIcon}>{tab === 'LAND' ? '🌾' : tab === 'OPPORTUNITIES' ? '💸' : '🧑‍🌾'}</span>
                <span className={styles.tabText}>{tab === 'LAND' ? t('landTab') : tab === 'OPPORTUNITIES' ? t('oppTab') : t('jobsTab')}</span>
              </button>
            ))}
          </div>

          {/* LAND TAB VIEW */}
          {activeMarketTab === 'LAND' && (
            <div className={styles.gridList}>
              {landListings.map((land) => (
                <div key={land.id} className={`${styles.itemCard} glass-container`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <strong style={{ fontSize: '1.15rem' }}>{land.title}</strong>
                    <span className={styles.statusBadge} style={{ background: land.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.1)' : land.status === 'LEASED' ? 'rgba(96, 165, 250, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: land.status === 'APPROVED' ? 'var(--primary-light)' : land.status === 'LEASED' ? '#60a5fa' : 'var(--accent-gold)' }}>
                      {land.status}
                    </span>
                  </div>
                  <div className={styles.itemMeta}>
                    <div className={styles.metaRow}>📍 Location: {land.location}</div>
                    <div className={styles.metaRow}>📐 Size: {land.size_acres} Acres | {t('waterlabel')} {land.water_availability}</div>
                    <div className={styles.metaRow}>💰 Lease Price: <strong style={{ color: 'var(--accent-gold)' }}>₹{parseFloat(land.lease_price_yearly).toLocaleString()}/year</strong></div>
                  </div>
                  {land.status === 'APPROVED' && (
                    <button onClick={() => handleTriggerLease(land)} className={styles.actionBtn} style={{ marginTop: '1rem', width: '100%' }}>
                      📄 {t('claimBtn')}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* CAPITAL OPPORTUNITIES TAB VIEW */}
          {activeMarketTab === 'OPPORTUNITIES' && (
            <div className={styles.gridList}>
              {opportunities.map((opp) => (
                <div key={opp.id} className={`${styles.itemCard} glass-container`}>
                  <strong style={{ fontSize: '1.15rem' }}>{opp.title}</strong>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.6rem 0' }}>{opp.description}</p>
                  <div className={styles.itemMeta}>
                    <div className={styles.metaRow}>💰 {t('oppCap')} <strong style={{ color: '#60a5fa' }}>₹{opp.capital_required.toLocaleString()}</strong></div>
                    <div className={styles.metaRow}>📈 Expected ROI: <strong style={{ color: 'var(--primary-light)' }}>{opp.expected_roi}%</strong></div>
                    <div className={styles.metaRow}>⌛ {t('oppTime')} {opp.time_horizon_months} Months</div>
                  </div>
                  <button onClick={() => alert('Interest submitted successfully! Farmora Agent will link mutual legal development documents.')} className={styles.actionBtn} style={{ marginTop: '1rem', width: '100%' }}>
                    🤝 {t('investBtn')}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* FARMING SUPPORT JOBS TAB VIEW */}
          {activeMarketTab === 'JOBS' && (
            <div className={styles.gridList}>
              {jobs.map((job) => (
                <div key={job.id} className={`${styles.itemCard} glass-container`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <strong style={{ fontSize: '1.15rem' }}>{job.title}</strong>
                    <span className={styles.statusBadge} style={{ background: job.status === 'OPEN' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: job.status === 'OPEN' ? 'var(--primary-light)' : '#f87171' }}>
                      {job.status}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.6rem 0' }}>{job.description}</p>
                  <div className={styles.itemMeta}>
                    <div className={styles.metaRow}>📍 Field: {job.land_title}</div>
                    <div className={styles.metaRow}>🌾 Landowner: {job.employer_name}</div>
                    <div className={styles.metaRow}>💰 {t('wagePill')} <strong style={{ color: 'var(--accent-gold)' }}>₹{job.daily_wage}/Day</strong></div>
                  </div>
                  {job.status === 'OPEN' && (
                    <button onClick={() => handleClaimJob(job.id)} className={styles.actionBtn} style={{ marginTop: '1rem', width: '100%' }}>
                      🚜 {t('claimJobBtn')}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 8. Duolingo for Farming Gamified Learning Subsystem */}
      <section className={styles.learningSection} style={{ padding: '4rem 2rem', maxWidth: '1280px', margin: '0 auto' }}>
        <div className={`${styles.quizCard} glass-container`} style={{ padding: '2.5rem', borderRadius: '16px' }}>
          <div className={styles.learningHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h2 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>🦉 {t('learnTitle')}</h2>
              <p style={{ color: 'var(--text-secondary)' }}>{t('learnSub')}</p>
            </div>
            <div className={styles.learnStats}>
              <span className={styles.statPill} style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-gold)', fontWeight: 'bold', padding: '0.6rem 1.2rem', borderRadius: '8px' }}>
                ⭐ {learningXp} XP
              </span>
            </div>
          </div>

          <div className={styles.studyTree} style={{ background: 'rgba(16, 185, 129, 0.03)', border: '1px solid var(--border-glass)', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
            <h4 style={{ color: 'var(--primary-light)', marginBottom: '0.8rem' }}>Course: {t('courseSoil')}</h4>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <span className={styles.badgePill} style={{ background: 'var(--primary)', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem' }}>✔️ {t('lessonSoil1')}</span>
              <span className={styles.badgePill} style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--text-primary)', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem' }}>🔒 L2: Maintaining Macro NPK Telemetry</span>
            </div>
          </div>

          {!quizStarted ? (
            <button onClick={() => setQuizStarted(true)} className={styles.primaryCta} style={{ width: '100%' }}>
              📖 {t('startLesson')}
            </button>
          ) : (
            <div className={styles.quizQuestion}>
              <h4 style={{ marginBottom: '1.2rem', fontSize: '1.1rem' }}>❓ {t('quizSoilQuestion')}</h4>
              <div className={styles.quizOptions} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <button
                  type="button"
                  onClick={() => handleQuizSubmit('BURN')}
                  className={`${styles.quizOptBtn} ${quizAnswer === 'BURN' ? styles.selectedQuizOpt : ''}`}
                  style={{ textAlign: 'left', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'transparent', color: '#fff', cursor: 'pointer' }}
                >
                  {t('optSoil1')}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuizSubmit('COMPOST')}
                  className={`${styles.quizOptBtn} ${quizAnswer === 'COMPOST' ? styles.selectedQuizOpt : ''}`}
                  style={{ textAlign: 'left', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'transparent', color: '#fff', cursor: 'pointer' }}
                >
                  {t('optSoil2')}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuizSubmit('UREA')}
                  className={`${styles.quizOptBtn} ${quizAnswer === 'UREA' ? styles.selectedQuizOpt : ''}`}
                  style={{ textAlign: 'left', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-glass)', background: 'transparent', color: '#fff', cursor: 'pointer' }}
                >
                  {t('optSoil3')}
                </button>
              </div>

              {quizResult && (
                <div style={{ marginTop: '1.5rem', background: quizResult === 'CORRECT' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px', border: quizResult === 'CORRECT' ? '1px solid var(--primary)' : '1px solid #ef4444' }}>
                  <strong>{quizResult === 'CORRECT' ? t('correctAnswer') : t('wrongAnswer')}</strong>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>{t('tipSoil')}</p>
                  {quizResult === 'CORRECT' && (
                    <button onClick={() => { setQuizStarted(false); setQuizAnswer(null); setQuizResult(null); }} className={styles.secondaryCta} style={{ marginTop: '1rem', width: '100%', padding: '0.5rem 1rem' }}>
                      Close & Earn Badges
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 9. Value Chain Showcase Cards & Footer */}
      <section className={styles.showcaseSection} style={{ padding: '4rem 2rem', background: 'rgba(9, 13, 10, 0.4)', borderTop: '1px solid var(--border-glass)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div className={styles.showcaseGrid}>
            <div className={`${styles.showcaseCard} glass-container`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🌱</span>
                <h3>{t('moringaHeadline')}</h3>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                {t('moringaDesc')}
              </p>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <strong>Products:</strong> <span style={{ color: 'var(--primary-light)' }}>{t('showcaseProducts')}</span>
              </div>
            </div>

            <div className={`${styles.showcaseCard} glass-container`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🏡</span>
                <h3>{t('nurseryTitle')}</h3>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                {t('nurseryDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Footer Section */}
      <footer className={styles.footer} style={{ borderTop: '1px solid var(--border-glass)', padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        <p>© {new Date().getFullYear()} Farmora AgriTech LLP. All rights reserved.</p>
        <p style={{ fontStyle: 'italic', marginTop: '0.4rem', color: 'var(--primary-light)' }}>
          "Designed for Agriculture"
        </p>
      </footer>

      {/* Overlays / Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      <LeaseDeedModal
        isOpen={isLeaseDeedOpen}
        landListing={selectedLandForLease}
        onClose={() => { setIsLeaseDeedOpen(false); setSelectedLandForLease(null); }}
        onConfirm={handleConfirmLeaseMatch}
      />
    </main>
  );
}
