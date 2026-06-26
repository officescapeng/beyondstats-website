import { getCliClient } from 'sanity/cli'

const client = getCliClient()

const articles = [
  {
    _id: 'article-1',
    _type: 'article',
    title: 'Tracking Emerging Human Security Trends Across Northern Nigeria (Sanity)',
    excerpt: 'Through continuous monitoring and analysis, Beyond# identifies emerging challenges and opportunities for evidence-based interventions in Northern states.',
    date: '2026-06-24',
    author: 'Dr. Ngozi Balogun',
    category: 'Human Security Monitor',
    body: [
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: 'This article was loaded dynamically from Sanity CMS! You can edit this text, add a featured image, or modify other fields inside Sanity Studio at http://localhost:3333.'
          }
        ]
      }
    ]
  },
  {
    _id: 'article-2',
    _type: 'article',
    title: 'Strengthening Social Protection Through Evidence-Based Planning (Sanity)',
    excerpt: 'Examining how targeting mechanisms in social registry frameworks can be calibrated using multidimensional indicators to minimize exclusion errors.',
    date: '2026-06-18',
    author: 'Beyond# Research Team',
    category: 'Research Brief',
    body: [
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: 'This research brief explores the calibration of social registry frameworks. Feel free to edit this story inside Sanity Studio to see updates reflect on the homepage and insights portal.'
          }
        ]
      }
    ]
  },
  {
    _id: 'article-3',
    _type: 'article',
    title: 'Quarterly Trends in Food Security and Community Resilience (Sanity)',
    excerpt: 'A comprehensive assessment of harvest yields, market price dynamics, and household resilience indices across Middle Belt agricultural belts.',
    date: '2026-06-12',
    author: 'Dr. Elizabeth Adebayo',
    category: 'Human Security Monitor',
    body: [
      {
        _type: 'block',
        style: 'normal',
        children: [
          {
            _type: 'span',
            text: 'A localized study evaluating harvest yields, market access, price volatility, and community resilience mechanisms in agricultural areas.'
          }
        ]
      }
    ]
  }
]

const publications = [
  {
    _id: 'publication-1',
    _type: 'publication',
    title: 'Beyond# Annual Report 2025 (Sanity)',
    summary: 'A review of our stewardship, operations, program deliverables, and community impact indicators across all 36 states of Nigeria.',
    author: 'Beyond# Secretariat',
    publication_type: 'Annual Reports',
    year: 2025,
    topic_area: 'Governance & Accountability',
    state_coverage: 'National',
    download_count: 342
  },
  {
    _id: 'publication-2',
    _type: 'publication',
    title: 'Nigeria Human Security Index Report 2025 (Sanity)',
    summary: 'Our flagship research publication assessing human security vulnerabilities, food security margins, and public service indicators in Nigeria.',
    author: 'Beyond# Research Team',
    publication_type: 'Research Reports',
    year: 2025,
    topic_area: 'Human Security Observatory',
    state_coverage: 'National',
    download_count: 855
  },
  {
    _id: 'publication-3',
    _type: 'publication',
    title: 'Middle Belt Food Security Assessment Q1 (Sanity)',
    summary: 'A localized study evaluating harvest yields, market access, price volatility, and community resilience mechanisms in agricultural areas.',
    author: 'Dr. Elizabeth Adebayo',
    publication_type: 'Situation Reports',
    year: 2026,
    topic_area: 'Food Security',
    state_coverage: 'Middle Belt',
    download_count: 512
  },
  {
    _id: 'publication-4',
    _type: 'publication',
    title: 'Citizen Monitoring and Municipal Accountability (Sanity)',
    summary: 'Analyzing the role of citizen scorecards in driving institutional reforms and responsive health and education service provision in local government areas.',
    author: 'Beyond# Secretariat',
    publication_type: 'Human Security Briefs',
    year: 2026,
    topic_area: 'Governance & Accountability',
    state_coverage: 'Kaduna',
    download_count: 219
  }
]

async function seed() {
  console.log('Seeding initial data to Sanity...')
  try {
    for (const article of articles) {
      const result = await client.createOrReplace(article)
      console.log(`Successfully seeded article: ${result.title} (${result._id})`)
    }
    for (const publication of publications) {
      const result = await client.createOrReplace(publication)
      console.log(`Successfully seeded publication: ${result.title} (${result._id})`)
    }
    console.log('Sanity seeding completed successfully!')
  } catch (error) {
    console.error('Error seeding Sanity database:', error)
  }
}

seed()
