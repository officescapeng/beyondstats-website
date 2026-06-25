export const INITIAL_PROJECTS = [
  {
    id: "proj-1",
    title: "North-East Food Security & Displacement Assessment",
    description: "Multi-sectoral survey tracking nutrition indices, crop yields, and internal displacement dynamics across Borno State.",
    story: "Following prolonged agricultural disruptions in the Chad Basin, Beyond# launched a comprehensive field survey across 14 LGAs in Borno State. The team traveled to hard-to-reach resettlement camps to record firsthand accounts of food insecurity, livelihood loss, and coping strategies among displaced families. The resulting database provides humanitarian actors with real-time geographic data on food shortages.",
    lessons: "Humanitarian access is highly seasonal; surveys must align with dry weather road access. Engaging camp management committees early ensures higher response rates and trust among displaced communities.",
    category: "Human Security Monitoring",
    type: "Survey",
    state: "Borno",
    lga: "Maiduguri",
    community: "Muna Garage IDP Camp",
    lat: 11.8500,
    lng: 13.2000,
    year: 2025,
    partners: ["World Food Programme (WFP)", "State Emergency Management Agency (SEMA)"],
    beneficiaries: 12500,
    findings: [
      "78% of households report severe food consumption gaps during the lean season.",
      "Livelihood recovery is heavily constrained by limited security access to arable land beyond a 5km camp radius.",
      "Acute malnutrition rates among children under five exceeded the 15% emergency threshold in three sampled camps."
    ],
    publications: [
      { title: "Borno Food Security Report 2025", url: "#" },
      { title: "IDP Coping Strategies & Livelihood Barriers", url: "#" }
    ],
    imageUrl: "/hero_community.png"
  },
  {
    id: "proj-2",
    title: "Youth Agri-Tech Livelihoods Initiative",
    description: "Practical capacity building program teaching youth modern greenhouse farming and digital supply chain tracking.",
    story: "In response to high youth unemployment in Kano, this project established three solar-powered greenhouse hubs. Thirty youth fellows from local communities were trained in hydroponics, micro-irrigation, and mobile application tracking to connect harvests directly to urban markets. The pilot demonstrated that urban-fringe agricultural tech can provide sustainable employment.",
    lessons: "Initial capital cost of solar irrigation remains a barrier for independent youth groups. Establishing micro-credit partnerships is vital for post-training sustainability.",
    category: "Community Solutions",
    type: "Intervention",
    state: "Kano",
    lga: "Ungogo",
    community: "Ungogo Agribusiness Hub",
    lat: 12.0800,
    lng: 8.5100,
    year: 2026,
    partners: ["Kano State Agricultural Development Authority", "AgroTech Hub Africa"],
    beneficiaries: 450,
    findings: [
      "Greenhouse cultivation reduced water consumption by 60% compared to traditional open-field farming.",
      "Participating youth increased their monthly average income by 140% within six months of crop cycle completion.",
      "Digital inventory management reduced post-harvest losses from 35% to less than 8%."
    ],
    publications: [
      { title: "Agri-Tech Solutions for Youth Employment", url: "#" },
      { title: "Solar Greenhouse Feasibility Study in Northern Nigeria", url: "#" }
    ],
    imageUrl: "/hero_women.png"
  },
  {
    id: "proj-3",
    title: "State-Level Multidimensional Poverty Mapping Study",
    description: "Rigorous academic study analyzing deprivation indexes across health, education, and living standards.",
    story: "Understanding that poverty is more than just income, Beyond# researchers designed a standardized index tracking clean water access, electricity, school completion, and nutrition in Oyo State. By overlaying census data with satellite imagery, the project mapped pockets of severe deprivation down to the ward level, offering planners a visual resource allocation map.",
    lessons: "State administrative data often has gaps in sanitation and energy indicators. Field-level sample verification is required to validate satellite-derived models.",
    category: "Research & Evidence Generation",
    type: "Study",
    state: "Oyo",
    lga: "Ibadan Southwest",
    community: "Foko Ward",
    lat: 7.3775,
    lng: 3.8970,
    year: 2024,
    partners: ["University of Ibadan - Department of Economics", "Oxford Poverty and Human Development Initiative"],
    beneficiaries: 8200,
    findings: [
      "Sanitation and clean cooking fuel represent the largest deprivation indicators in urban-fringe settlements.",
      "Ward-level poverty variations exceed 50% within the same local government area, highlighting the need for targeted allocation.",
      "A strong correlation was found between maternal education levels and child nutrition outcomes."
    ],
    publications: [
      { title: "Oyo State Multidimensional Poverty Index Map", url: "#" },
      { title: "Deprivation Disparities in South-Western Nigeria", url: "#" }
    ],
    imageUrl: "/hero_research.png"
  },
  {
    id: "proj-4",
    title: "Legislative Roundtable on Human Security Policy",
    description: "High-level advocacy dialogue convening policymakers, civil society, and researchers to review national security laws.",
    story: "To translate empirical data into legislation, Beyond# convened security chiefs, senators, and civil society organizers at a roundtable in Abuja. The discussion focused on shifting the national security framework from military-centric actions to people-centered security, emphasizing early warning networks, community policing, and agricultural protection.",
    lessons: "Bipartisan policy change requires ongoing engagement; single roundtables are insufficient. Providing concise, non-technical policy briefs is essential for legislative assistants.",
    category: "Policy Engagement",
    type: "Dialogue",
    state: "FCT",
    lga: "Abuja Municipal",
    community: "National Assembly Complex",
    lat: 9.0765,
    lng: 7.4986,
    year: 2026,
    partners: ["National Human Security Council", "Civil Society Accountability Network"],
    beneficiaries: 120,
    findings: [
      "Drafted 5 policy amendments incorporating community-led early warning mechanisms into national budget recommendations.",
      "Established a joint steering committee between researchers and legislators for regular quarterly reviews.",
      "Identified critical gaps in local government funding for rural security cooperatives."
    ],
    publications: [
      { title: "Policy Brief: Transitioning to People-Centered Security", url: "#" },
      { title: "Legislative Guide for Human Security Budgeting", url: "#" }
    ],
    imageUrl: "/hero_community.png"
  },
  {
    id: "proj-5",
    title: "Community Solar-Powered Water & Sanitation Pilot",
    description: "Engineering and community intervention deploying solar boreholes and sanitation kiosks in rural Niger State.",
    story: "Water-borne illnesses frequently disrupted education and farming in Chanchaga LGA. Beyond# co-designed a solar-pumped water treatment station managed entirely by a local women-led committee. Users pay a small fee per container to fund security, battery replacements, and plumbing maintenance. The facility now provides clean water to 3,000 residents daily.",
    lessons: "Water user associations must be trained in financial ledger keeping and basic pump maintenance to prevent pump breakdown and ensure long-term sustainability.",
    category: "Community Solutions",
    type: "Intervention",
    state: "Niger",
    lga: "Chanchaga",
    community: "Gidan Mangoro Community",
    lat: 9.6139,
    lng: 6.5569,
    year: 2025,
    partners: ["Niger State Ministry of Water Resources", "Solar Power Builders NGO"],
    beneficiaries: 3000,
    findings: [
      "Incidences of water-borne diseases in the village decreased by 85% within three months of commissioning.",
      "School attendance for girls increased by 45% because they no longer needed to walk 4km daily to fetch river water.",
      "The women's management cooperative accumulated 400,000 NGN in maintenance reserves, ensuring operations for the next year."
    ],
    publications: [
      { title: "Solar Micro-Utilities for Clean Water Delivery", url: "#" },
      { title: "Community Governance Models for Rural Infrastructure", url: "#" }
    ],
    imageUrl: "/hero_women.png"
  },
  {
    id: "proj-6",
    title: "Advocacy Training for Local Accountability Partners",
    description: "Capacity building workshops for grassroots civil society organizers in budgeting and public expenditure tracking.",
    story: "In Port Harcourt, local organizers often lacked technical tools to track oil revenue allocations to communities. Beyond# hosted a 5-day training program teaching 45 NGO leaders how to read state budgets, file Freedom of Information (FOI) requests, and use digital visualization tools to share municipal spending data with community members.",
    lessons: "Follow-up mentorship is crucial; skills learned in a 5-day workshop dry up without practical, project-based reinforcement over the subsequent 3 months.",
    category: "Capacity Development",
    type: "Training",
    state: "Rivers",
    lga: "Port Harcourt",
    community: "Diobu Community Hall",
    lat: 4.8156,
    lng: 7.0498,
    year: 2025,
    partners: ["Niger Delta Budget Watch", "Rivers State Civil Society Coalition"],
    beneficiaries: 180,
    findings: [
      "45 civil society leaders trained in expenditure tracking methodologies.",
      "Participants successfully filed 12 FOI requests regarding local municipal school renovation budgets.",
      "Identified a 30% gap between approved capital allocations and actual spending in 3 community health clinics."
    ],
    publications: [
      { title: "Grassroots Budget Tracking Manual", url: "#" },
      { title: "FOI Accountability Guide for Niger Delta Communities", url: "#" }
    ],
    imageUrl: "/hero_research.png"
  },
  {
    id: "proj-7",
    title: "Conflict Early Warning & Response System (CEWRS) Pilot",
    description: "Technological and community-based alert system tracking security situations and land conflicts in Kaduna State.",
    story: "Tensions between farmers and herders in southern Kaduna often escalate due to misinformation and delayed security responses. Beyond# developed an SMS-based alert gateway. Trusted local monitors send encrypted codes reporting cattle rustling, crop damage, or suspicious movement. Reports are verified and immediately shared with local peace committees and security agencies.",
    lessons: "Neutrality is paramount. Alert monitors must represent all ethnic and occupational groups in the community to maintain local trust and credibility.",
    category: "Human Security Monitoring",
    type: "Survey",
    state: "Kaduna",
    lga: "Zangon Kataf",
    community: "Samaru Kataf Ward",
    lat: 10.1500,
    lng: 7.8200,
    year: 2026,
    partners: ["Kaduna Peace Commission", "Kroc Institute for International Peace Studies"],
    beneficiaries: 15000,
    findings: [
      "SMS system verified and logged 143 early security incidents with an average response time of 18 minutes.",
      "Local peace committees successfully mediated 28 minor crop-grazing disputes before security forces were required.",
      "Pre-emptive alerts reduced communal violence casualties in the target LGAs by 42% over 12 months."
    ],
    publications: [
      { title: "SMS Early Warning Protocols & Local Mediation", url: "#" },
      { title: "Kaduna Southern Peace Indicators Report", url: "#" }
    ],
    imageUrl: "/hero_community.png"
  },
  {
    id: "proj-8",
    title: "Youth Data Fellowship Program",
    description: "Comprehensive data science and social impact training program for graduates in development research.",
    story: "Recognizing a gap in statistical expertise in the local NGO sector, Beyond# established the Youth Data Fellowship. Over 6 months, 20 fellows are trained in advanced survey design, R/Python programming, and geographic information systems (GIS). Fellows are placed with partner agencies to help modernize their data pipelines and impact reporting.",
    lessons: "Hands-on projects with raw, messy NGO data are more educational than clean academic datasets. Incorporating data visualization storytelling is vital.",
    category: "Capacity Development",
    type: "Training",
    state: "Lagos",
    lga: "Ikeja",
    community: "Beyond# Innovation Hub",
    lat: 6.6018,
    lng: 3.3515,
    year: 2026,
    partners: ["Lagos State University - Faculty of Science", "Data Science Nigeria"],
    beneficiaries: 320,
    findings: [
      "20 fellows completed intensive certifications in spatial analysis and development indexing.",
      "Fellows designed and launched 6 community surveys mapping plastic waste hotspots in Lagos markets.",
      "90% of graduates secured full-time data analyst positions in local and international NGOs within 3 months."
    ],
    publications: [
      { title: "Youth Data Fellowship Curriculum Guide", url: "#" },
      { title: "Lagos Spatial Waste Mapping Project Findings", url: "#" }
    ],
    imageUrl: "/hero_women.png"
  },
  {
    id: "proj-9",
    title: "Maternal Health Clinic Accessibility Study",
    description: "Spatial analysis study tracking transit times and road conditions to rural clinics in Enugu State.",
    story: "In Enugu, rural pregnancy complications are exacerbated by long transit times. Beyond# researchers geolocated every primary health center (PHC) across 5 LGAs and mapped local road networks. The study measured travel times during the rainy season, demonstrating that 40% of pregnant women live more than 2 hours away from emergency obstetric care.",
    lessons: "GIS routing maps must incorporate local transport availability (e.g. availability of commercial motorcycles vs. vehicles) to reflect realistic transit times.",
    category: "Research & Evidence Generation",
    type: "Study",
    state: "Enugu",
    lga: "Udi",
    community: "Ameke Community Health Center",
    lat: 6.4500,
    lng: 7.3300,
    year: 2025,
    partners: ["Enugu State Ministry of Health", "UNICEF Nigeria"],
    beneficiaries: 6400,
    findings: [
      "40% of rural communities lack access to a functional maternal facility within the critical 60-minute window.",
      "Rainy season washouts increase average travel time to secondary hospitals by 130%.",
      "Drafted priority road and ambulance deployment maps accepted by the State Ministry of Health for the 2026 budget."
    ],
    publications: [
      { title: "Spatial Access to Emergency Obstetric Care in Enugu", url: "#" },
      { title: "Maternal Health Transport Barriers & Policy Solutions", url: "#" }
    ],
    imageUrl: "/hero_research.png"
  },
  {
    id: "proj-10",
    title: "Middle Belt Agro-Security Advocacy Campaign",
    description: "Advocacy and policy campaign supporting safety networks and security provisions for rural farming cooperative networks.",
    story: "To secure food production in Benue State, Beyond# launched an advocacy campaign showing the direct impact of rural security on national food prices. By coordinating with farmers' unions and the media, the team presented data to government agencies to secure patrol routes for farmers during planting and harvesting seasons.",
    lessons: "Aligning agricultural security campaigns with national economic interests (like inflation control) builds broader political support than focusing solely on regional issues.",
    category: "Policy Engagement",
    type: "Dialogue",
    state: "Benue",
    lga: "Makurdi",
    community: "Wurukum Farmers Market",
    lat: 7.7337,
    lng: 8.5214,
    year: 2024,
    partners: ["Benue State Farmers Association", "National Agricultural Extension and Research Liaison Services"],
    beneficiaries: 11000,
    findings: [
      "Patrol routes secured 45 farming villages during harvest season, preventing crop burning incidents.",
      "Cooperative farmers increased crop yield outputs by 33% due to longer hours spent in outer fields.",
      "Policy recommendations integrated into the National Agricultural Security Policy framework draft."
    ],
    publications: [
      { title: "Benue Agricultural Security & Food Price Indices Study", url: "#" },
      { title: "Advocacy Guide for Farm Protection Cooperatives", url: "#" }
    ],
    imageUrl: "/hero_community.png"
  }
];
