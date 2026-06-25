import { INITIAL_PROJECTS } from '../data/impactMapData';

const LOCAL_STORAGE_KEY = 'beyond_impact_map_projects';

// Initialize localStorage with initial seed data if not present
export const initializeDB = () => {
  const existing = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!existing) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_PROJECTS));
  }
};

export const getProjects = () => {
  initializeDB();
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return JSON.parse(raw) || [];
  } catch (err) {
    console.error("Failed to parse projects database: ", err);
    return [];
  }
};

export const addProject = (projectData) => {
  initializeDB();
  const projects = getProjects();
  
  const newProject = {
    ...projectData,
    id: `proj-${Date.now()}`,
    year: Number(projectData.year) || new Date().getFullYear(),
    beneficiaries: Number(projectData.beneficiaries) || 0,
    lat: Number(projectData.lat),
    lng: Number(projectData.lng),
    partners: Array.isArray(projectData.partners) 
      ? projectData.partners 
      : typeof projectData.partners === 'string'
        ? projectData.partners.split(',').map(p => p.trim()).filter(Boolean)
        : [],
    findings: Array.isArray(projectData.findings)
      ? projectData.findings
      : typeof projectData.findings === 'string'
        ? projectData.findings.split('\n').map(f => f.trim()).filter(Boolean)
        : [],
    publications: Array.isArray(projectData.publications)
      ? projectData.publications
      : typeof projectData.publications === 'string'
        ? projectData.publications.split('\n').map(pub => {
            const parts = pub.split('|');
            return {
              title: parts[0]?.trim() || 'Research Publication',
              url: parts[1]?.trim() || '#'
            };
          }).filter(Boolean)
        : []
  };

  projects.push(newProject);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(projects));
  return newProject;
};

export const updateProject = (updatedProject) => {
  initializeDB();
  const projects = getProjects();
  const index = projects.findIndex(p => p.id === updatedProject.id);
  
  if (index !== -1) {
    projects[index] = {
      ...projects[index],
      ...updatedProject,
      year: Number(updatedProject.year) || projects[index].year,
      beneficiaries: Number(updatedProject.beneficiaries) || projects[index].beneficiaries,
      lat: Number(updatedProject.lat),
      lng: Number(updatedProject.lng)
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(projects));
    return projects[index];
  }
  
  throw new Error(`Project with ID ${updatedProject.id} not found.`);
};

export const deleteProject = (projectId) => {
  initializeDB();
  const projects = getProjects();
  const filtered = projects.filter(p => p.id !== projectId);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
  return true;
};

export const resetProjects = () => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_PROJECTS));
  return INITIAL_PROJECTS;
};
