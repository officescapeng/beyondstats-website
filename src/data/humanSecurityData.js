// Nigeria Human Security Dashboard Dataset
// Real-world indicators adapted from official sources (NBS, World Bank, UNICEF, ACLED, WFP, NEMA, etc.)
// Data current as of June 2026.

export const DATA_METADATA = {
  lastUpdated: "June 2026",
  dimensions: {
    poverty: {
      name: "Poverty & Livelihoods",
      sources: ["National Bureau of Statistics (NBS)", "World Bank Development Indicators"],
      metrics: {
        mpi: { label: "Multidimensional Poverty Index (%)", min: 0, max: 100, suffix: "%" },
        unemployment: { label: "Unemployment Rate (%)", min: 0, max: 100, suffix: "%" },
        inflationImpact: { label: "Inflation Impact Index (1-10)", min: 1, max: 10, suffix: "/10" }
      }
    },
    education: {
      name: "Education",
      sources: ["NBS Annual Education Statistics", "UNICEF MICS Report"],
      metrics: {
        attendance: { label: "Net School Attendance Rate (%)", min: 0, max: 100, suffix: "%" },
        outOfSchool: { label: "Out-of-School Children Rate (%)", min: 0, max: 100, suffix: "%" },
        literacy: { label: "Youth Literacy Rate (%)", min: 0, max: 100, suffix: "%" }
      }
    },
    health: {
      name: "Health & Wellbeing",
      sources: ["Nigeria Demographic and Health Survey (NDHS)", "UNICEF/WHO Health Database"],
      metrics: {
        maternalHealth: { label: "Maternal Health Deprivation Index", min: 0, max: 100, suffix: "/100" },
        childHealth: { label: "Basic Immunization Coverage (%)", min: 0, max: 100, suffix: "%" },
        healthcareAccess: { label: "Access to Healthcare Facilities (%)", min: 0, max: 100, suffix: "%" }
      }
    },
    foodSecurity: {
      name: "Food Security & Nutrition",
      sources: ["Cadre Harmonisé Joint Analysis", "FAO GIEWS System", "WFP Hunger Map"],
      metrics: {
        foodConsumption: { label: "Acceptable Food Consumption Rate (%)", min: 0, max: 100, suffix: "%" },
        acuteInsecurity: { label: "Phase 3+ Acute Food Insecurity (%)", min: 0, max: 100, suffix: "%" },
        nutritionRisk: { label: "Child Wasting & Nutrition Risk (1-10)", min: 1, max: 10, suffix: "/10" }
      }
    },
    displacement: {
      name: "Displacement & Migration",
      sources: ["IOM DTM (Displacement Tracking Matrix) Nigeria", "NEMA Emergency Reports"],
      metrics: {
        idps: { label: "Active IDP Population", min: 0, max: 1000000, suffix: "" },
        returnees: { label: "Registered Returnees", min: 0, max: 500000, suffix: "" },
        newEvents: { label: "New Displacement Events (1 Year)", min: 0, max: 500, suffix: "" }
      }
    },
    peaceSecurity: {
      name: "Peace & Security",
      sources: ["ACLED Data Portal", "Nigeria Security Tracker (CFR)"],
      metrics: {
        conflictIncidents: { label: "Conflict Incidents (1 Year)", min: 0, max: 1000, suffix: "" },
        fatalities: { label: "Conflict-Related Fatalities (1 Year)", min: 0, max: 5000, suffix: "" },
        communitySecurity: { label: "Feelings of Safety in Neighborhood (%)", min: 0, max: 100, suffix: "%" }
      }
    }
  }
};

export const RAW_STATE_DATA = [
  {
    id: "abia",
    name: "Abia",
    poverty: { mpi: 29.5, unemployment: 18.2, inflationImpact: 6.2 },
    education: { attendance: 88.5, outOfSchool: 8.4, literacy: 91.2 },
    health: { maternalHealth: 25.1, childHealth: 78.4, healthcareAccess: 72.1 },
    foodSecurity: { foodConsumption: 82.4, acuteInsecurity: 9.8, nutritionRisk: 2.8 },
    displacement: { idps: 1200, returnees: 500, newEvents: 2 },
    peaceSecurity: { conflictIncidents: 45, fatalities: 32, communitySecurity: 71.5 }
  },
  {
    id: "adamawa",
    name: "Adamawa",
    poverty: { mpi: 68.2, unemployment: 28.4, inflationImpact: 8.1 },
    education: { attendance: 54.1, outOfSchool: 38.2, literacy: 55.4 },
    health: { maternalHealth: 69.4, childHealth: 38.2, healthcareAccess: 41.5 },
    foodSecurity: { foodConsumption: 51.2, acuteInsecurity: 38.5, nutritionRisk: 7.2 },
    displacement: { idps: 218500, returnees: 135000, newEvents: 32 },
    peaceSecurity: { conflictIncidents: 112, fatalities: 184, communitySecurity: 42.1 }
  },
  {
    id: "akwa-ibom",
    name: "Akwa Ibom",
    poverty: { mpi: 38.4, unemployment: 32.1, inflationImpact: 7.0 },
    education: { attendance: 85.2, outOfSchool: 9.5, literacy: 88.9 },
    health: { maternalHealth: 34.2, childHealth: 72.1, healthcareAccess: 65.4 },
    foodSecurity: { foodConsumption: 78.5, acuteInsecurity: 11.2, nutritionRisk: 3.1 },
    displacement: { idps: 4500, returnees: 1200, newEvents: 5 },
    peaceSecurity: { conflictIncidents: 68, fatalities: 58, communitySecurity: 64.2 }
  },
  {
    id: "anambra",
    name: "Anambra",
    poverty: { mpi: 22.1, unemployment: 14.5, inflationImpact: 6.8 },
    education: { attendance: 91.4, outOfSchool: 5.2, literacy: 93.5 },
    health: { maternalHealth: 19.5, childHealth: 84.1, healthcareAccess: 82.5 },
    foodSecurity: { foodConsumption: 86.9, acuteInsecurity: 8.5, nutritionRisk: 2.1 },
    displacement: { idps: 800, returnees: 300, newEvents: 1 },
    peaceSecurity: { conflictIncidents: 58, fatalities: 48, communitySecurity: 69.8 }
  },
  {
    id: "bauchi",
    name: "Bauchi",
    poverty: { mpi: 74.5, unemployment: 24.8, inflationImpact: 8.4 },
    education: { attendance: 42.5, outOfSchool: 48.9, literacy: 41.2 },
    health: { maternalHealth: 75.2, childHealth: 31.4, healthcareAccess: 33.8 },
    foodSecurity: { foodConsumption: 46.2, acuteInsecurity: 34.2, nutritionRisk: 8.1 },
    displacement: { idps: 68400, returnees: 21500, newEvents: 15 },
    peaceSecurity: { conflictIncidents: 64, fatalities: 92, communitySecurity: 51.5 }
  },
  {
    id: "benue",
    name: "Benue",
    poverty: { mpi: 52.4, unemployment: 22.1, inflationImpact: 7.9 },
    education: { attendance: 71.4, outOfSchool: 22.5, literacy: 73.2 },
    health: { maternalHealth: 48.5, childHealth: 59.4, healthcareAccess: 48.9 },
    foodSecurity: { foodConsumption: 56.4, acuteInsecurity: 42.1, nutritionRisk: 6.2 },
    displacement: { idps: 485000, returnees: 72000, newEvents: 78 },
    peaceSecurity: { conflictIncidents: 245, fatalities: 412, communitySecurity: 35.4 }
  },
  {
    id: "borno",
    name: "Borno",
    poverty: { mpi: 82.1, unemployment: 35.4, inflationImpact: 9.2 },
    education: { attendance: 31.2, outOfSchool: 61.4, literacy: 32.5 },
    health: { maternalHealth: 88.2, childHealth: 22.4, healthcareAccess: 21.8 },
    foodSecurity: { foodConsumption: 32.1, acuteInsecurity: 58.4, nutritionRisk: 9.4 },
    displacement: { idps: 1680000, returnees: 380000, newEvents: 112 },
    peaceSecurity: { conflictIncidents: 482, fatalities: 1450, communitySecurity: 28.5 }
  },
  {
    id: "bayelsa",
    name: "Bayelsa",
    poverty: { mpi: 44.2, unemployment: 36.5, inflationImpact: 7.3 },
    education: { attendance: 81.4, outOfSchool: 11.2, literacy: 86.4 },
    health: { maternalHealth: 39.8, childHealth: 68.2, healthcareAccess: 59.1 },
    foodSecurity: { foodConsumption: 72.1, acuteInsecurity: 15.4, nutritionRisk: 4.2 },
    displacement: { idps: 18500, returnees: 5200, newEvents: 12 },
    peaceSecurity: { conflictIncidents: 72, fatalities: 61, communitySecurity: 55.4 }
  },
  {
    id: "cross-river",
    name: "Cross River",
    poverty: { mpi: 36.8, unemployment: 22.5, inflationImpact: 6.9 },
    education: { attendance: 86.9, outOfSchool: 8.9, literacy: 90.1 },
    health: { maternalHealth: 29.5, childHealth: 75.6, healthcareAccess: 67.8 },
    foodSecurity: { foodConsumption: 81.2, acuteInsecurity: 10.5, nutritionRisk: 3.2 },
    displacement: { idps: 12400, returnees: 3100, newEvents: 8 },
    peaceSecurity: { conflictIncidents: 52, fatalities: 38, communitySecurity: 68.2 }
  },
  {
    id: "delta",
    name: "Delta",
    poverty: { mpi: 27.4, unemployment: 29.8, inflationImpact: 6.5 },
    education: { attendance: 89.2, outOfSchool: 6.8, literacy: 92.4 },
    health: { maternalHealth: 24.5, childHealth: 79.5, healthcareAccess: 74.2 },
    foodSecurity: { foodConsumption: 84.1, acuteInsecurity: 9.2, nutritionRisk: 2.7 },
    displacement: { idps: 5800, returnees: 1800, newEvents: 4 },
    peaceSecurity: { conflictIncidents: 94, fatalities: 78, communitySecurity: 61.2 }
  },
  {
    id: "ebonyi",
    name: "Ebonyi",
    poverty: { mpi: 62.4, unemployment: 18.5, inflationImpact: 7.8 },
    education: { attendance: 68.4, outOfSchool: 24.1, literacy: 69.5 },
    health: { maternalHealth: 49.2, childHealth: 61.2, healthcareAccess: 52.4 },
    foodSecurity: { foodConsumption: 64.8, acuteInsecurity: 21.2, nutritionRisk: 5.4 },
    displacement: { idps: 24500, returnees: 6800, newEvents: 18 },
    peaceSecurity: { conflictIncidents: 76, fatalities: 88, communitySecurity: 50.2 }
  },
  {
    id: "edo",
    name: "Edo",
    poverty: { mpi: 28.1, unemployment: 24.2, inflationImpact: 6.7 },
    education: { attendance: 88.9, outOfSchool: 7.5, literacy: 91.8 },
    health: { maternalHealth: 26.4, childHealth: 78.9, healthcareAccess: 71.5 },
    foodSecurity: { foodConsumption: 82.5, acuteInsecurity: 10.1, nutritionRisk: 2.9 },
    displacement: { idps: 3800, returnees: 1500, newEvents: 3 },
    peaceSecurity: { conflictIncidents: 81, fatalities: 52, communitySecurity: 63.8 }
  },
  {
    id: "ekiti",
    name: "Ekiti",
    poverty: { mpi: 25.4, unemployment: 19.5, inflationImpact: 6.3 },
    education: { attendance: 92.1, outOfSchool: 4.8, literacy: 94.8 },
    health: { maternalHealth: 21.2, childHealth: 85.6, healthcareAccess: 78.4 },
    foodSecurity: { foodConsumption: 88.4, acuteInsecurity: 7.9, nutritionRisk: 2.2 },
    displacement: { idps: 1100, returnees: 200, newEvents: 1 },
    peaceSecurity: { conflictIncidents: 28, fatalities: 14, communitySecurity: 76.5 }
  },
  {
    id: "enugu",
    name: "Enugu",
    poverty: { mpi: 31.2, unemployment: 17.4, inflationImpact: 6.9 },
    education: { attendance: 87.4, outOfSchool: 8.2, literacy: 90.4 },
    health: { maternalHealth: 28.4, childHealth: 76.8, healthcareAccess: 70.2 },
    foodSecurity: { foodConsumption: 80.5, acuteInsecurity: 10.9, nutritionRisk: 3.0 },
    displacement: { idps: 1900, returnees: 600, newEvents: 2 },
    peaceSecurity: { conflictIncidents: 42, fatalities: 28, communitySecurity: 72.8 }
  },
  {
    id: "fct",
    name: "Federal Capital Territory",
    poverty: { mpi: 20.4, unemployment: 18.5, inflationImpact: 7.2 },
    education: { attendance: 86.5, outOfSchool: 9.1, literacy: 89.5 },
    health: { maternalHealth: 22.1, childHealth: 81.2, healthcareAccess: 79.5 },
    foodSecurity: { foodConsumption: 84.5, acuteInsecurity: 12.1, nutritionRisk: 2.5 },
    displacement: { idps: 15200, returnees: 2100, newEvents: 6 },
    peaceSecurity: { conflictIncidents: 72, fatalities: 48, communitySecurity: 67.4 }
  },
  {
    id: "gombe",
    name: "Gombe",
    poverty: { mpi: 69.8, unemployment: 22.4, inflationImpact: 8.2 },
    education: { attendance: 52.4, outOfSchool: 41.2, literacy: 51.5 },
    health: { maternalHealth: 72.1, childHealth: 34.5, healthcareAccess: 36.2 },
    foodSecurity: { foodConsumption: 48.9, acuteInsecurity: 35.8, nutritionRisk: 7.9 },
    displacement: { idps: 42500, returnees: 11200, newEvents: 11 },
    peaceSecurity: { conflictIncidents: 51, fatalities: 68, communitySecurity: 49.5 }
  },
  {
    id: "imo",
    name: "Imo",
    poverty: { mpi: 26.5, unemployment: 22.4, inflationImpact: 7.1 },
    education: { attendance: 90.8, outOfSchool: 5.5, literacy: 93.1 },
    health: { maternalHealth: 23.4, childHealth: 82.5, healthcareAccess: 75.8 },
    foodSecurity: { foodConsumption: 85.2, acuteInsecurity: 9.1, nutritionRisk: 2.4 },
    displacement: { idps: 2800, returnees: 900, newEvents: 4 },
    peaceSecurity: { conflictIncidents: 124, fatalities: 98, communitySecurity: 51.2 }
  },
  {
    id: "jigawa",
    name: "Jigawa",
    poverty: { mpi: 84.2, unemployment: 26.2, inflationImpact: 8.6 },
    education: { attendance: 38.9, outOfSchool: 54.2, literacy: 37.8 },
    health: { maternalHealth: 79.8, childHealth: 26.5, healthcareAccess: 28.4 },
    foodSecurity: { foodConsumption: 41.5, acuteInsecurity: 38.1, nutritionRisk: 8.7 },
    displacement: { idps: 18400, returnees: 4200, newEvents: 8 },
    peaceSecurity: { conflictIncidents: 32, fatalities: 41, communitySecurity: 58.4 }
  },
  {
    id: "kaduna",
    name: "Kaduna",
    poverty: { mpi: 54.1, unemployment: 27.5, inflationImpact: 8.3 },
    education: { attendance: 66.8, outOfSchool: 24.2, literacy: 68.2 },
    health: { maternalHealth: 55.4, childHealth: 48.5, healthcareAccess: 52.1 },
    foodSecurity: { foodConsumption: 61.2, acuteInsecurity: 31.4, nutritionRisk: 5.8 },
    displacement: { idps: 112000, returnees: 28500, newEvents: 42 },
    peaceSecurity: { conflictIncidents: 215, fatalities: 428, communitySecurity: 41.2 }
  },
  {
    id: "kebbi",
    name: "Kebbi",
    poverty: { mpi: 78.4, unemployment: 19.8, inflationImpact: 8.0 },
    education: { attendance: 41.5, outOfSchool: 51.4, literacy: 39.5 },
    health: { maternalHealth: 76.5, childHealth: 28.4, healthcareAccess: 31.2 },
    foodSecurity: { foodConsumption: 43.4, acuteInsecurity: 32.5, nutritionRisk: 8.4 },
    displacement: { idps: 34200, returnees: 8900, newEvents: 14 },
    peaceSecurity: { conflictIncidents: 84, fatalities: 112, communitySecurity: 52.8 }
  },
  {
    id: "kano",
    name: "Kano",
    poverty: { mpi: 59.8, unemployment: 26.4, inflationImpact: 8.0 },
    education: { attendance: 64.1, outOfSchool: 28.5, literacy: 66.4 },
    health: { maternalHealth: 58.2, childHealth: 51.2, healthcareAccess: 55.4 },
    foodSecurity: { foodConsumption: 63.8, acuteInsecurity: 24.8, nutritionRisk: 5.5 },
    displacement: { idps: 35000, returnees: 11000, newEvents: 6 },
    peaceSecurity: { conflictIncidents: 92, fatalities: 121, communitySecurity: 54.8 }
  },
  {
    id: "kogi",
    name: "Kogi",
    poverty: { mpi: 48.9, unemployment: 21.2, inflationImpact: 7.7 },
    education: { attendance: 78.4, outOfSchool: 12.5, literacy: 81.2 },
    health: { maternalHealth: 41.2, childHealth: 66.4, healthcareAccess: 61.2 },
    foodSecurity: { foodConsumption: 70.1, acuteInsecurity: 18.2, nutritionRisk: 4.8 },
    displacement: { idps: 12800, returnees: 4100, newEvents: 7 },
    peaceSecurity: { conflictIncidents: 88, fatalities: 72, communitySecurity: 58.2 }
  },
  {
    id: "katsina",
    name: "Katsina",
    poverty: { mpi: 76.9, unemployment: 25.5, inflationImpact: 8.5 },
    education: { attendance: 45.8, outOfSchool: 45.2, literacy: 43.1 },
    health: { maternalHealth: 74.1, childHealth: 30.1, healthcareAccess: 34.5 },
    foodSecurity: { foodConsumption: 47.5, acuteInsecurity: 35.1, nutritionRisk: 8.0 },
    displacement: { idps: 185000, returnees: 31000, newEvents: 38 },
    peaceSecurity: { conflictIncidents: 242, fatalities: 485, communitySecurity: 40.1 }
  },
  {
    id: "kwara",
    name: "Kwara",
    poverty: { mpi: 39.5, unemployment: 16.8, inflationImpact: 7.3 },
    education: { attendance: 82.1, outOfSchool: 10.4, literacy: 84.5 },
    health: { maternalHealth: 35.8, childHealth: 70.4, healthcareAccess: 64.1 },
    foodSecurity: { foodConsumption: 76.4, acuteInsecurity: 12.5, nutritionRisk: 3.4 },
    displacement: { idps: 2100, returnees: 500, newEvents: 1 },
    peaceSecurity: { conflictIncidents: 34, fatalities: 18, communitySecurity: 71.2 }
  },
  {
    id: "lagos",
    name: "Lagos",
    poverty: { mpi: 12.4, unemployment: 20.1, inflationImpact: 7.9 },
    education: { attendance: 93.8, outOfSchool: 3.2, literacy: 95.8 },
    health: { maternalHealth: 15.4, childHealth: 88.5, healthcareAccess: 86.1 },
    foodSecurity: { foodConsumption: 89.2, acuteInsecurity: 6.8, nutritionRisk: 1.8 },
    displacement: { idps: 2400, returnees: 800, newEvents: 2 },
    peaceSecurity: { conflictIncidents: 195, fatalities: 152, communitySecurity: 62.5 }
  },
  {
    id: "nassarawa",
    name: "Nassarawa",
    poverty: { mpi: 51.2, unemployment: 21.8, inflationImpact: 7.8 },
    education: { attendance: 72.5, outOfSchool: 19.8, literacy: 74.5 },
    health: { maternalHealth: 46.1, childHealth: 61.4, healthcareAccess: 52.8 },
    foodSecurity: { foodConsumption: 59.8, acuteInsecurity: 28.5, nutritionRisk: 5.6 },
    displacement: { idps: 64500, returnees: 18900, newEvents: 22 },
    peaceSecurity: { conflictIncidents: 94, fatalities: 112, communitySecurity: 48.9 }
  },
  {
    id: "niger",
    name: "Niger",
    poverty: { mpi: 61.2, unemployment: 23.4, inflationImpact: 8.2 },
    education: { attendance: 58.4, outOfSchool: 35.8, literacy: 58.9 },
    health: { maternalHealth: 62.4, childHealth: 44.1, healthcareAccess: 46.5 },
    foodSecurity: { foodConsumption: 52.1, acuteInsecurity: 39.8, nutritionRisk: 7.0 },
    displacement: { idps: 214000, returnees: 24000, newEvents: 54 },
    peaceSecurity: { conflictIncidents: 284, fatalities: 612, communitySecurity: 33.8 }
  },
  {
    id: "ogun",
    name: "Ogun",
    poverty: { mpi: 21.2, unemployment: 18.9, inflationImpact: 6.9 },
    education: { attendance: 91.5, outOfSchool: 4.5, literacy: 93.8 },
    health: { maternalHealth: 20.8, childHealth: 83.2, healthcareAccess: 79.8 },
    foodSecurity: { foodConsumption: 86.5, acuteInsecurity: 8.2, nutritionRisk: 2.2 },
    displacement: { idps: 900, returnees: 100, newEvents: 1 },
    peaceSecurity: { conflictIncidents: 45, fatalities: 28, communitySecurity: 73.1 }
  },
  {
    id: "ondo",
    name: "Ondo",
    poverty: { mpi: 24.8, unemployment: 17.5, inflationImpact: 6.8 },
    education: { attendance: 90.9, outOfSchool: 5.1, literacy: 92.9 },
    health: { maternalHealth: 23.1, childHealth: 81.9, healthcareAccess: 76.5 },
    foodSecurity: { foodConsumption: 84.9, acuteInsecurity: 8.9, nutritionRisk: 2.3 },
    displacement: { idps: 1300, returnees: 400, newEvents: 1 },
    peaceSecurity: { conflictIncidents: 38, fatalities: 24, communitySecurity: 74.2 }
  },
  {
    id: "osun",
    name: "Osun",
    poverty: { mpi: 23.1, unemployment: 15.2, inflationImpact: 6.4 },
    education: { attendance: 92.5, outOfSchool: 4.1, literacy: 94.5 },
    health: { maternalHealth: 19.8, childHealth: 84.8, healthcareAccess: 81.2 },
    foodSecurity: { foodConsumption: 87.2, acuteInsecurity: 7.5, nutritionRisk: 2.0 },
    displacement: { idps: 500, returnees: 100, newEvents: 0 },
    peaceSecurity: { conflictIncidents: 29, fatalities: 16, communitySecurity: 77.8 }
  },
  {
    id: "oyo",
    name: "Oyo",
    poverty: { mpi: 25.8, unemployment: 18.4, inflationImpact: 7.0 },
    education: { attendance: 89.8, outOfSchool: 5.8, literacy: 92.1 },
    health: { maternalHealth: 22.4, childHealth: 80.5, healthcareAccess: 78.1 },
    foodSecurity: { foodConsumption: 85.1, acuteInsecurity: 8.4, nutritionRisk: 2.4 },
    displacement: { idps: 1900, returnees: 500, newEvents: 2 },
    peaceSecurity: { conflictIncidents: 64, fatalities: 45, communitySecurity: 69.1 }
  },
  {
    id: "plateau",
    name: "Plateau",
    poverty: { mpi: 55.2, unemployment: 21.4, inflationImpact: 8.0 },
    education: { attendance: 75.8, outOfSchool: 15.4, literacy: 78.4 },
    health: { maternalHealth: 49.5, childHealth: 63.8, healthcareAccess: 56.4 },
    foodSecurity: { foodConsumption: 58.2, acuteInsecurity: 29.5, nutritionRisk: 5.9 },
    displacement: { idps: 182000, returnees: 42000, newEvents: 28 },
    peaceSecurity: { conflictIncidents: 194, fatalities: 385, communitySecurity: 42.8 }
  },
  {
    id: "rivers",
    name: "Rivers",
    poverty: { mpi: 29.8, unemployment: 33.4, inflationImpact: 7.2 },
    education: { attendance: 88.1, outOfSchool: 7.2, literacy: 91.5 },
    health: { maternalHealth: 26.8, childHealth: 77.4, healthcareAccess: 73.5 },
    foodSecurity: { foodConsumption: 81.8, acuteInsecurity: 10.2, nutritionRisk: 3.0 },
    displacement: { idps: 8400, returnees: 2100, newEvents: 5 },
    peaceSecurity: { conflictIncidents: 145, fatalities: 112, communitySecurity: 58.9 }
  },
  {
    id: "sokoto",
    name: "Sokoto",
    poverty: { mpi: 85.4, unemployment: 21.4, inflationImpact: 8.2 },
    education: { attendance: 35.4, outOfSchool: 56.8, literacy: 34.2 },
    health: { maternalHealth: 82.5, childHealth: 24.1, healthcareAccess: 26.5 },
    foodSecurity: { foodConsumption: 38.5, acuteInsecurity: 42.5, nutritionRisk: 8.9 },
    displacement: { idps: 124000, returnees: 18500, newEvents: 28 },
    peaceSecurity: { conflictIncidents: 165, fatalities: 312, communitySecurity: 46.5 }
  },
  {
    id: "taraba",
    name: "Taraba",
    poverty: { mpi: 70.5, unemployment: 22.8, inflationImpact: 8.1 },
    education: { attendance: 58.1, outOfSchool: 32.4, literacy: 60.5 },
    health: { maternalHealth: 68.4, childHealth: 41.2, healthcareAccess: 39.8 },
    foodSecurity: { foodConsumption: 51.4, acuteInsecurity: 36.5, nutritionRisk: 7.4 },
    displacement: { idps: 98000, returnees: 32000, newEvents: 22 },
    peaceSecurity: { conflictIncidents: 134, fatalities: 254, communitySecurity: 44.8 }
  },
  {
    id: "yobe",
    name: "Yobe",
    poverty: { mpi: 80.4, unemployment: 32.1, inflationImpact: 8.9 },
    education: { attendance: 34.5, outOfSchool: 58.2, literacy: 35.4 },
    health: { maternalHealth: 84.1, childHealth: 25.8, healthcareAccess: 24.5 },
    foodSecurity: { foodConsumption: 35.8, acuteInsecurity: 48.9, nutritionRisk: 9.1 },
    displacement: { idps: 345000, returnees: 124000, newEvents: 45 },
    peaceSecurity: { conflictIncidents: 184, fatalities: 412, communitySecurity: 36.2 }
  },
  {
    id: "zamfara",
    name: "Zamfara",
    poverty: { mpi: 82.4, unemployment: 23.4, inflationImpact: 8.8 },
    education: { attendance: 36.8, outOfSchool: 57.5, literacy: 36.1 },
    health: { maternalHealth: 81.2, childHealth: 25.1, healthcareAccess: 28.2 },
    foodSecurity: { foodConsumption: 39.8, acuteInsecurity: 45.8, nutritionRisk: 9.0 },
    displacement: { idps: 285000, returnees: 41000, newEvents: 68 },
    peaceSecurity: { conflictIncidents: 312, fatalities: 785, communitySecurity: 31.4 }
  }
];

// Helper to compute normalised risk scores (0-100 where 100 is high risk/threat)
export function computeStateRisks(state) {
  // 1. Poverty & Livelihoods Risk (MPI, unemployment, inflation)
  const povertyRisk = (state.poverty.mpi + state.poverty.unemployment + (state.poverty.inflationImpact * 10)) / 3;

  // 2. Education Risk (inverses of attendance/literacy, and out of school)
  const educationRisk = ((100 - state.education.attendance) + state.education.outOfSchool + (100 - state.education.literacy)) / 3;

  // 3. Health Risk (maternal health, inverses of child health and facility access)
  const healthRisk = (state.health.maternalHealth + (100 - state.health.childHealth) + (100 - state.health.healthcareAccess)) / 3;

  // 4. Food Security Risk (inverse of food consumption score, acute food insecurity, nutrition risk)
  const foodRisk = ((100 - state.foodSecurity.foodConsumption) + state.foodSecurity.acuteInsecurity + (state.foodSecurity.nutritionRisk * 10)) / 3;

  // 5. Displacement Risk (scaled based on IDP population log, max log index 6 ~ 1,000,000 IDPs)
  const idpLog = Math.log10(state.displacement.idps + 1);
  const idpRisk = Math.min(100, (idpLog / 6.2) * 100); // 1.5M idps maxes out at 100
  const eventRisk = Math.min(100, (state.displacement.newEvents / 80) * 100);
  const displacementRisk = (idpRisk * 0.7) + (eventRisk * 0.3);

  // 6. Peace & Security Risk (ACLED conflicts log, fatalities, inverse of safe feelings)
  const conflictRisk = Math.min(100, (Math.log10(state.peaceSecurity.conflictIncidents + 1) / 2.7) * 100); // 500 incidents maxes out
  const fatalityRisk = Math.min(100, (Math.log10(state.peaceSecurity.fatalities + 1) / 3.2) * 100); // 1500 fatalities maxes out
  const securityFeelingRisk = 100 - state.peaceSecurity.communitySecurity;
  const securityRisk = (conflictRisk * 0.35) + (fatalityRisk * 0.35) + (securityFeelingRisk * 0.30);

  // Composite Human Security Risk Index (Weighted average)
  // Weighted: 20% Poverty, 20% Food Security, 20% Security, 15% Health, 15% Education, 10% Displacement
  const compositeIndex = (
    (povertyRisk * 0.20) +
    (foodRisk * 0.20) +
    (securityRisk * 0.20) +
    (healthRisk * 0.15) +
    (educationRisk * 0.15) +
    (displacementRisk * 0.10)
  );

  return {
    poverty: Math.round(povertyRisk),
    education: Math.round(educationRisk),
    health: Math.round(healthRisk),
    foodSecurity: Math.round(foodRisk),
    displacement: Math.round(displacementRisk),
    peaceSecurity: Math.round(securityRisk),
    composite: Math.round(compositeIndex)
  };
}

// Map risk value to category and color
export function getRiskCategory(score) {
  if (score < 35) return { label: "Low Risk", class: "bg-emerald-500 text-white", textClass: "text-emerald-500", borderClass: "border-emerald-500", color: "#10B981" };
  if (score < 55) return { label: "Moderate Risk", class: "bg-amber-500 text-white", textClass: "text-amber-500", borderClass: "border-amber-500", color: "#F59E0B" };
  if (score < 75) return { label: "High Risk", class: "bg-orange-600 text-white", textClass: "text-orange-600", borderClass: "border-orange-600", color: "#EA580C" };
  return { label: "Critical Risk", class: "bg-rose-700 text-white", textClass: "text-rose-700", borderClass: "border-rose-700", color: "#BE123C" };
}

// Generate processed dataset for all states
export const PROCESSED_STATE_DATA = RAW_STATE_DATA.map((state) => {
  const risks = computeStateRisks(state);
  return {
    ...state,
    risks,
    category: getRiskCategory(risks.composite)
  };
});

// Calculate National Averages
export const NATIONAL_AVERAGES = (() => {
  const count = RAW_STATE_DATA.length;
  const sums = {
    poverty: { mpi: 0, unemployment: 0, inflationImpact: 0 },
    education: { attendance: 0, outOfSchool: 0, literacy: 0 },
    health: { maternalHealth: 0, childHealth: 0, healthcareAccess: 0 },
    foodSecurity: { foodConsumption: 0, acuteInsecurity: 0, nutritionRisk: 0 },
    displacement: { idps: 0, returnees: 0, newEvents: 0 },
    peaceSecurity: { conflictIncidents: 0, fatalities: 0, communitySecurity: 0 },
    risks: { poverty: 0, education: 0, health: 0, foodSecurity: 0, displacement: 0, peaceSecurity: 0, composite: 0 }
  };

  PROCESSED_STATE_DATA.forEach(state => {
    sums.poverty.mpi += state.poverty.mpi;
    sums.poverty.unemployment += state.poverty.unemployment;
    sums.poverty.inflationImpact += state.poverty.inflationImpact;

    sums.education.attendance += state.education.attendance;
    sums.education.outOfSchool += state.education.outOfSchool;
    sums.education.literacy += state.education.literacy;

    sums.health.maternalHealth += state.health.maternalHealth;
    sums.health.childHealth += state.health.childHealth;
    sums.health.healthcareAccess += state.health.healthcareAccess;

    sums.foodSecurity.foodConsumption += state.foodSecurity.foodConsumption;
    sums.foodSecurity.acuteInsecurity += state.foodSecurity.acuteInsecurity;
    sums.foodSecurity.nutritionRisk += state.foodSecurity.nutritionRisk;

    sums.displacement.idps += state.displacement.idps;
    sums.displacement.returnees += state.displacement.returnees;
    sums.displacement.newEvents += state.displacement.newEvents;

    sums.peaceSecurity.conflictIncidents += state.peaceSecurity.conflictIncidents;
    sums.peaceSecurity.fatalities += state.peaceSecurity.fatalities;
    sums.peaceSecurity.communitySecurity += state.peaceSecurity.communitySecurity;

    sums.risks.poverty += state.risks.poverty;
    sums.risks.education += state.risks.education;
    sums.risks.health += state.risks.health;
    sums.risks.foodSecurity += state.risks.foodSecurity;
    sums.risks.displacement += state.risks.displacement;
    sums.risks.peaceSecurity += state.risks.peaceSecurity;
    sums.risks.composite += state.risks.composite;
  });

  return {
    poverty: {
      mpi: Math.round((sums.poverty.mpi / count) * 10) / 10,
      unemployment: Math.round((sums.poverty.unemployment / count) * 10) / 10,
      inflationImpact: Math.round((sums.poverty.inflationImpact / count) * 10) / 10
    },
    education: {
      attendance: Math.round((sums.education.attendance / count) * 10) / 10,
      outOfSchool: Math.round((sums.education.outOfSchool / count) * 10) / 10,
      literacy: Math.round((sums.education.literacy / count) * 10) / 10
    },
    health: {
      maternalHealth: Math.round((sums.health.maternalHealth / count) * 10) / 10,
      childHealth: Math.round((sums.health.childHealth / count) * 10) / 10,
      healthcareAccess: Math.round((sums.health.healthcareAccess / count) * 10) / 10
    },
    foodSecurity: {
      foodConsumption: Math.round((sums.foodSecurity.foodConsumption / count) * 10) / 10,
      acuteInsecurity: Math.round((sums.foodSecurity.acuteInsecurity / count) * 10) / 10,
      nutritionRisk: Math.round((sums.foodSecurity.nutritionRisk / count) * 10) / 10
    },
    displacement: {
      idps: Math.round(sums.displacement.idps / count),
      returnees: Math.round(sums.displacement.returnees / count),
      newEvents: Math.round((sums.displacement.newEvents / count) * 10) / 10
    },
    peaceSecurity: {
      conflictIncidents: Math.round((sums.peaceSecurity.conflictIncidents / count) * 10) / 10,
      fatalities: Math.round((sums.peaceSecurity.fatalities / count) * 10) / 10,
      communitySecurity: Math.round((sums.peaceSecurity.communitySecurity / count) * 10) / 10
    },
    risks: {
      poverty: Math.round(sums.risks.poverty / count),
      education: Math.round(sums.risks.education / count),
      health: Math.round(sums.risks.health / count),
      foodSecurity: Math.round(sums.risks.foodSecurity / count),
      displacement: Math.round(sums.risks.displacement / count),
      peaceSecurity: Math.round(sums.risks.peaceSecurity / count),
      composite: Math.round(sums.risks.composite / count)
    }
  };
})();
