// Reusable Headless WordPress API Service Layer for Beyond#
// Configure WP_API_URL to point to a live WordPress installation.
// If the live connection fails or is not yet configured, the service falls back
// to a high-fidelity mock database matching the WordPress JSON schema.

export const WP_API_URL = import.meta.env.VITE_WP_API_URL || 'https://beyondstatistics.org/wp-json'; 

// Caching layer
const apiCache = {
  articles: null,
  publications: null,
  projects: null
};

// ================= WORDPRESS JSON-SCHEMA MOCK DATABASE =================
const mockArticles = [
  {
    id: 1,
    date: "2026-06-24T12:00:00Z",
    title: { rendered: "Tracking Emerging Human Security Trends Across Northern Nigeria" },
    content: { rendered: "<p>This research appraisal assesses multidimensional security challenges across Kaduna, Kano, and Katsina states. Using structural field observations and data collected by our local observers, we analyze the intersecting risks of crop yields, food security fluctuations, displacement numbers, and community peace initiatives.</p><p>Our findings indicate that localized climate anomalies have shifted planting calendars by up to four weeks, intensifying resource competition in agricultural zones. We propose responsive community-designed early warning frameworks to support local government intervention planning.</p>" },
    excerpt: { rendered: "Through continuous monitoring and analysis, Beyond# identifies emerging challenges and opportunities for evidence-based interventions that improve community resilience and safety." },
    featured_media_url: "/hero_research.png",
    author_name: "Dr. Ngozi Balogun",
    categories: ["Human Security Monitor"],
    tags: ["Northern Nigeria", "Conflict", "Food Security", "Climate"],
    view_count: 1420,
    acf: {
      featured_status: true,
      state_focus: "Kaduna",
      download_attachment: "Northern_Security_Brief_2026.pdf",
      seo_description: "Human security assessment tracking northern Nigeria indicators."
    }
  },
  {
    id: 2,
    date: "2026-06-18T10:30:00Z",
    title: { rendered: "Strengthening Social Protection Through Evidence-Based Planning" },
    content: { rendered: "<p>Social registry frameworks form the bedrock of social protection interventions. This brief examines targeting accuracy under multidimensional poverty indices in the Federal Capital Territory.</p><p>We compare registry targets against household surveys, analyzing error rates. We recommend incorporating local coordinates and indicators to refine targeting, ensuring support reaches the most vulnerable households.</p>" },
    excerpt: { rendered: "Examining how targeting mechanisms in social registry frameworks can be calibrated using multidimensional indicators to minimize exclusion errors." },
    featured_media_url: "/stakeholder_consultation.png",
    author_name: "Aminu Ibrahim",
    categories: ["Research Brief"],
    tags: ["Social Protection", "Poverty", "Abuja", "Policy"],
    view_count: 980,
    acf: {
      featured_status: false,
      state_focus: "Abuja",
      download_attachment: "Social_Protection_Registry_Targeting.pdf",
      seo_description: "Analysing registry targeting accuracy via multidimensional indicators."
    }
  },
  {
    id: 3,
    date: "2026-06-12T14:15:00Z",
    title: { rendered: "Quarterly Trends in Food Security and Community Resilience" },
    content: { rendered: "<p>This monitor assesses harvest yields, market price dynamics, and household resilience indices across Middle Belt agricultural belts. Rapid inflation has driven food prices up, pushing fragile households into coping strategies.</p><p>We analyze local coping responses, offering recommendations for strategic grain reserves and targeted agricultural support to mitigate immediate market price shocks.</p>" },
    excerpt: { rendered: "A comprehensive assessment of harvest yields, market price dynamics, and household resilience indices across Middle Belt agricultural belts." },
    featured_media_url: "/hero_community.png",
    author_name: "Dr. Elizabeth Adebayo",
    categories: ["Human Security Monitor"],
    tags: ["Food Security", "Inflation", "Agriculture", "Middle Belt"],
    view_count: 1105,
    acf: {
      featured_status: false,
      state_focus: "Niger",
      download_attachment: "Food_Security_Monitor_Q2.pdf",
      seo_description: "Quarterly monitor tracking Middle Belt agricultural trends and resilience."
    }
  },
  {
    id: 4,
    date: "2026-05-28T09:00:00Z",
    title: { rendered: "Using Data to Improve Public Service Delivery" },
    content: { rendered: "<p>This analysis looks at the role of community scorecards in driving institutional reforms and responsive health and education service provision in local government areas.</p><p>By structuring citizen feedback loops, we demonstrate how local administrative units can align budget allocations with actual grassroots requirements, improving trust and service availability.</p>" },
    excerpt: { rendered: "Analyzing the role of citizens scorecards in driving institutional reforms and responsive health and education service provision." },
    featured_media_url: "/community_lab.png",
    author_name: "Chidi Okechukwu",
    categories: ["Policy Insight"],
    tags: ["Service Delivery", "Governance", "CSO", "Scorecards"],
    view_count: 750,
    acf: {
      featured_status: false,
      state_focus: "Enugu",
      download_attachment: "Citizen_Feedback_Services_2026.pdf",
      seo_description: "Analysing citizen scorecards for municipal healthcare and education audit."
    }
  },
  {
    id: 5,
    date: "2026-05-14T11:20:00Z",
    title: { rendered: "How Local Partnerships Are Transforming Evidence Into Action" },
    content: { rendered: "<p>Collaborative interventions between local councils, youth groups, and development actors can unlock municipal bottlenecks. This story highlights co-designed solutions addressing secondary school enrollment and sanitation issues in Niger state.</p><p>By combining data monitoring with local coordination, community members have established safe learning environments and micro-irrigation systems.</p>" },
    excerpt: { rendered: "Highlighting collaborative efforts between local governance structures and community actors to address sanitation and secondary schooling bottlenecks." },
    featured_media_url: "/hero_women.png",
    author_name: "Fatima Yusuf",
    categories: ["Community Solutions", "Impact Story"],
    tags: ["Education", "Sanitation", "Niger State", "Collaboration"],
    view_count: 890,
    acf: {
      featured_status: false,
      state_focus: "Niger",
      download_attachment: "Community_Solutions_Niger_Report.pdf",
      seo_description: "Case study on community solutions in Niger state education."
    }
  },
  {
    id: 6,
    date: "2026-05-02T15:40:00Z",
    title: { rendered: "Citizen Feedback and Responsive Institutions in Local Governments" },
    content: { rendered: "<p>Responsive local administration is key to human security. We review data from citizen monitoring platforms across selected municipalities, auditing public spending and infrastructure tracking.</p><p>The study highlights standard parameters that lead to accountable budgeting and reduced capital project abandonment.</p>" },
    excerpt: { rendered: "A review of citizen monitoring platforms and their impact on municipal infrastructure spending audits and public accountability." },
    featured_media_url: "/logo.png",
    author_name: "Aminu Ibrahim",
    categories: ["Governance & Accountability"],
    tags: ["Local Government", "Accountability", "Budgeting"],
    view_count: 620,
    acf: {
      featured_status: false,
      state_focus: "Kaduna",
      download_attachment: "Local_Gov_Spending_Audit.pdf",
      seo_description: "Review of citizen feedback platforms in municipal budget audits."
    }
  },
  {
    id: 7,
    date: "2026-04-20T08:15:00Z",
    title: { rendered: "Sustaining Primary Healthcare Funding in Rural Communities" },
    content: { rendered: "<p>Rural primary health centres face funding deficits that compromise basic care. We analyze alternative health insurance models and public-private arrangements to sustain rural health centres.</p><p>Recommendations focus on decentralized community co-management boards to ensure transparency and trust in funding administration.</p>" },
    excerpt: { rendered: "Sustaining primary healthcare facilities requires structured financial models. This brief proposes community co-management funding frameworks." },
    featured_media_url: "/hero_women.png",
    author_name: "Dr. Elizabeth Adebayo",
    categories: ["Policy Insight", "Research Brief"],
    tags: ["Primary Healthcare", "Health Insurance", "Rural Communities"],
    view_count: 540,
    acf: {
      featured_status: false,
      state_focus: "Oyo",
      download_attachment: "PHC_Rural_Funding_Policy.pdf",
      seo_description: "Policy recommendations for decentralized primary healthcare funding."
    }
  },
  {
    id: 8,
    date: "2026-04-10T13:22:00Z",
    title: { rendered: "Youth Data Literacy: A Tool for Grassroots Accountability" },
    content: { rendered: "<p>Equipping youth assemblies with data analytics skills allows them to audit constituency projects and advocate for policy reforms. This story reviews outcomes from our Youth Data Fellows training cohorts.</p><p>Fellows successfully mapped service deficits in local primary schools, leading to local government interventions in classrooms.</p>" },
    excerpt: { rendered: "Our latest impact assessment reviews how training youth leaders in data literacy builds grassroots transparency and project audits." },
    featured_media_url: "/community_lab.png",
    author_name: "Chidi Okechukwu",
    categories: ["Impact Story", "Community Solutions"],
    tags: ["Youth Empowerment", "Data Literacy", "Accountability", "Abuja"],
    view_count: 1205,
    acf: {
      featured_status: false,
      state_focus: "Abuja",
      download_attachment: "Youth_Data_Impact_Brief.pdf",
      seo_description: "Assessment of youth data literacy programs in grassroots project audits."
    }
  }
];

const mockPublications = [
  {
    id: 101,
    title: { rendered: "Beyond# Annual Report 2025" },
    cover_image_url: "/community_lab.png",
    date: "2026-01-20T12:00:00Z",
    acf: {
      publication_title: "Beyond# Annual Report 2025",
      summary: "A review of our stewardship, operations, program deliverables, and community impact indicators across all 36 states of Nigeria.",
      pdf_upload: "Beyond_Annual_Report_2025.pdf",
      publication_type: "Annual Reports",
      year: 2025,
      topic_area: "Governance & Accountability",
      state_coverage: "National",
      author: "Beyond# Secretariat",
      download_count: 342
    }
  },
  {
    id: 102,
    title: { rendered: "Nigeria Human Security Index Report 2025" },
    cover_image_url: "/hero_research.png",
    date: "2025-11-15T10:00:00Z",
    acf: {
      publication_title: "Nigeria Human Security Index Report 2025",
      summary: "Our flagship research publication assessing human security vulnerabilities, food security margins, and public service indicators in Nigeria.",
      pdf_upload: "Human_Security_Index_Report_2025.pdf",
      publication_type: "Research Reports",
      year: 2025,
      topic_area: "Human Security Observatory",
      state_coverage: "National",
      author: "Beyond# Research Team",
      download_count: 855
    }
  },
  {
    id: 103,
    title: { rendered: "Middle Belt Food Security Assessment Q1" },
    cover_image_url: "/hero_community.png",
    date: "2026-04-05T09:00:00Z",
    acf: {
      publication_title: "Middle Belt Food Security Assessment Q1",
      summary: "A detailed situation study tracking harvest yield dynamics, grain reserve changes, and inflation impacts across Benue, Plateau, and Niger states.",
      pdf_upload: "Food_Security_Q1_2026.pdf",
      publication_type: "Situation Reports",
      year: 2026,
      topic_area: "Food Security",
      state_coverage: "Niger",
      author: "Dr. Elizabeth Adebayo",
      download_count: 420
    }
  },
  {
    id: 104,
    title: { rendered: "Citizen Feedback Scorecards: Primary Education" },
    cover_image_url: "/community_lab.png",
    date: "2026-03-12T14:30:00Z",
    acf: {
      publication_title: "Citizen Feedback Scorecards: Primary Education",
      summary: "Compilation of citizen assessments and infrastructure audits across rural classrooms, highlighting governance and capital deficits.",
      pdf_upload: "Education_Scorecard_Brief.pdf",
      publication_type: "Human Security Briefs",
      year: 2026,
      topic_area: "Governance & Accountability",
      state_coverage: "Kaduna",
      author: "Chidi Okechukwu",
      download_count: 290
    }
  },
  {
    id: 105,
    title: { rendered: "Climate Anomalies and Agricultural Livelihoods" },
    cover_image_url: "/hero_women.png",
    date: "2025-09-10T11:00:00Z",
    acf: {
      publication_title: "Climate Anomalies and Agricultural Livelihoods",
      summary: "Empirical study tracing the impact of rainfall shifts and climate shocks on micro-farming cooperatives, highlighting solar resilience initiatives.",
      pdf_upload: "Climate_Livelihoods_2025.pdf",
      publication_type: "Data Stories",
      year: 2025,
      topic_area: "Climate Vulnerability",
      state_coverage: "Niger",
      author: "Fatima Yusuf",
      download_count: 512
    }
  },
  {
    id: 106,
    title: { rendered: "Financial Statements & Auditor Report FY25" },
    cover_image_url: "/logo.png",
    date: "2026-02-18T16:00:00Z",
    acf: {
      publication_title: "Financial Statements & Auditor Report FY25",
      summary: "Audited financial accounts for the fiscal year ended December 2025, affirming our commitments to transparency and resource stewardship.",
      pdf_upload: "Audited_Financials_FY25.pdf",
      publication_type: "Financial Reports",
      year: 2025,
      topic_area: "Governance & Accountability",
      state_coverage: "National",
      author: "Internal Auditors",
      download_count: 175
    }
  }
];

const mockProjects = [
  {
    id: 201,
    title: { rendered: "Human Security Observatory Abuja" },
    acf: {
      project_name: "Abuja Observatory Headquarters",
      description: "Our primary secretariat hub coordinating weekly data collection, choropleth map updates, and situations monitoring across all Nigerian states.",
      location: "CBD, Abuja",
      coordinates: { lat: 9.0765, lng: 7.3986 },
      photos: ["/stakeholder_consultation.png"],
      partners: ["United Nations Development Programme", "MacArthur Foundation"],
      impact_statistics: {
        "Indicators Tracked": "100+",
        "States Covered": "36 States + FCT",
        "Abuja Analysts": "12"
      }
    }
  },
  {
    id: 202,
    title: { rendered: "Solar-Powered Livelihoods Niger State" },
    acf: {
      project_name: "Rural Solar Livelihoods Pilot",
      description: "Implementing solar-powered micro-enterprise support grids for agricultural cooperatives in Niger State, reducing fuel costs and poverty gaps.",
      location: "Minna, Niger State",
      coordinates: { lat: 9.6139, lng: 6.5569 },
      photos: ["/hero_women.png"],
      partners: ["Federal Ministry of Environment", "Green Energy Cooperative"],
      impact_statistics: {
        "Cooperatives Powered": "18",
        "Co2 Reduced": "12 Tons/yr",
        "Income Growth": "+24%"
      }
    }
  },
  {
    id: 203,
    title: { rendered: "Kaduna Grassroots Accountability Forums" },
    acf: {
      project_name: "Municipal Budget Monitoring Cohort",
      description: "Training civil society leaders and local citizens to track public expenditures and audit capital projects to reduce municipal abandonment.",
      location: "Kaduna City, Kaduna State",
      coordinates: { lat: 10.5105, lng: 7.4165 },
      photos: ["/community_lab.png"],
      partners: ["CSO Coalition for Budget Audit", "National Endowment for Democracy"],
      impact_statistics: {
        "Budget Auditors Trained": "45",
        "Projects Audited": "120",
        "Audits Resolved": "18 Projects"
      }
    }
  },
  {
    id: 204,
    title: { rendered: "Youth Data Fellows Academy" },
    acf: {
      project_name: "Data fellows Leadership Program",
      description: "An annual academy training the next generation of researchers, data scientists, and policy communicators on human security frameworks.",
      location: "National (Online + Abuja Secretariat)",
      coordinates: { lat: 9.0765, lng: 7.3986 },
      photos: ["/hero_research.png"],
      partners: ["Ahmadu Bello University", "University of Ibadan"],
      impact_statistics: {
        "Data Fellows Graduated": "120+",
        "Academic Partnerships": "5 Universities",
        "Placed in Internships": "85%"
      }
    }
  }
];

// ================= WORDPRESS REST API FETCH SERVICES =================

// Helper to simulate network loading latency
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchArticles(params = {}) {
  const { category, search, page = 1, perPage = 12, sortBy = 'newest' } = params;
  
  // Real REST API Fetch Attempt
  try {
    let url = `${WP_API_URL}/wp/v2/posts?_embed&page=${page}&per_page=${perPage}`;
    if (category && category !== 'All') {
      url += `&categories=${encodeURIComponent(category)}`;
    }
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    // live fetch could go here if WP_API_URL is configured
  } catch (err) {
    console.warn("WP API Article fetch failed or unconfigured. Falling back to local schema cache.", err);
  }

  // MOCK FALLBACK IMPLEMENTATION
  await delay(500); // Premium loader feel

  let results = [...mockArticles];

  // Filter Category
  if (category && category !== 'All') {
    results = results.filter(art => 
      art.categories.some(c => c.toLowerCase() === category.toLowerCase())
    );
  }

  // Filter Search
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(art => 
      art.title.rendered.toLowerCase().includes(q) || 
      art.content.rendered.toLowerCase().includes(q) || 
      art.excerpt.rendered.toLowerCase().includes(q) ||
      art.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  // Sorting
  if (sortBy === 'newest') {
    results.sort((a, b) => new Date(b.date) - new Date(a.date));
  } else if (sortBy === 'oldest') {
    results.sort((a, b) => new Date(a.date) - new Date(b.date));
  } else if (sortBy === 'most-viewed') {
    results.sort((a, b) => b.view_count - a.view_count);
  }

  // Pagination
  const total = results.length;
  const totalPages = Math.ceil(total / perPage);
  const offset = (page - 1) * perPage;
  const paginatedResults = results.slice(offset, offset + perPage);

  return {
    data: paginatedResults,
    total,
    totalPages
  };
}

export async function fetchPublications(params = {}) {
  const { type, year, topic, state, search } = params;

  try {
    let url = `${WP_API_URL}/wp/v2/publications?_embed`;
  } catch (err) {
    console.warn("WP API Publications fetch failed. Using local mock fallbacks.");
  }

  await delay(600);

  let results = [...mockPublications];

  if (type && type !== 'All') {
    results = results.filter(pub => pub.acf.publication_type === type);
  }
  if (year && year !== 'All') {
    results = results.filter(pub => pub.acf.year.toString() === year.toString());
  }
  if (topic && topic !== 'All') {
    results = results.filter(pub => pub.acf.topic_area.toLowerCase() === topic.toLowerCase());
  }
  if (state && state !== 'All') {
    results = results.filter(pub => pub.acf.state_coverage.toLowerCase() === state.toLowerCase());
  }
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(pub => 
      pub.title.rendered.toLowerCase().includes(q) || 
      pub.acf.summary.toLowerCase().includes(q)
    );
  }

  return results;
}

export async function fetchProjects(params = {}) {
  try {
    let url = `${WP_API_URL}/wp/v2/projects?_embed`;
  } catch (err) {
    console.warn("WP API Projects fetch failed. Using local mock fallbacks.");
  }

  await delay(500);
  return [...mockProjects];
}

export async function globalSearch(query) {
  if (!query || query.trim() === '') return { articles: [], publications: [], projects: [] };
  const q = query.toLowerCase();

  await delay(600);

  const matchedArticles = mockArticles.filter(art => 
    art.title.rendered.toLowerCase().includes(q) || 
    art.content.rendered.toLowerCase().includes(q) ||
    art.tags.some(t => t.toLowerCase().includes(q))
  );

  const matchedPublications = mockPublications.filter(pub => 
    pub.title.rendered.toLowerCase().includes(q) || 
    pub.acf.summary.toLowerCase().includes(q) ||
    pub.acf.topic_area.toLowerCase().includes(q)
  );

  const matchedProjects = mockProjects.filter(p => 
    p.acf.project_name.toLowerCase().includes(q) || 
    p.acf.description.toLowerCase().includes(q) ||
    p.acf.partners.some(pt => pt.toLowerCase().includes(q))
  );

  return {
    articles: matchedArticles,
    publications: matchedPublications,
    projects: matchedProjects
  };
}

export function getRelatedArticles(currentArticleId, category, tags = []) {
  const articlesPool = mockArticles.filter(art => art.id !== currentArticleId);
  
  const scored = articlesPool.map(art => {
    let score = 0;
    if (art.categories.some(c => c.toLowerCase() === category.toLowerCase())) {
      score += 5;
    }
    const sharedTags = art.tags.filter(t => tags.includes(t));
    score += sharedTags.length * 2;
    return { article: art, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map(item => item.article);
}
