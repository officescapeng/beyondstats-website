# Checklist - Headless WordPress Integration

- [x] Create `src/services/wordpress.js` API Service layer:
  - [x] Define API Base URL configuration and endpoints
  - [x] Write rich fallback mock databases for Posts, Publications, and Projects mirroring WP schema
  - [x] Implement fetchArticles API with query filtering, category matching, sorting, and pagination
  - [x] Implement fetchPublications API with topic, type, year, and state filtering
  - [x] Implement fetchProjects API for observatory coordinates and statistics
  - [x] Implement globalSearch API searching across all content types
  - [x] Implement getRelatedArticles algorithm based on tag/category matching
  - [x] Build in memory caching and loading delay simulation
- [x] Integrate into `src/App.jsx`:
  - [x] Add Global Search toggle button to Header and overlay modal layout
  - [x] Integrate WordPress fetch inside Homepage carousel (latest 5 posts)
  - [x] Integrate WordPress fetch inside Featured Insight section (acf.featured_status logic)
  - [x] Refactor `ImpactPage` (Insights & Impact) to use API fetches, pagination, search, sort, and filters
  - [x] Create Article Reader Modal showing full post content and Related Articles block
  - [x] Refactor `ResearchPage` to embed the new dynamic Publications Library (type, year, state filtering, download counters)
- [x] Run Vite production build `npm run build` to verify compilation
- [x] Update Walkthrough report with the completed details
