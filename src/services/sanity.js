import { createClient } from '@sanity/client'

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID
const dataset = import.meta.env.VITE_SANITY_DATASET || 'production'

// Client is instantiated if projectId is provided, otherwise returns null for safe fallback
export const sanityClient = projectId
  ? createClient({
      projectId,
      dataset,
      useCdn: false,
      apiVersion: '2023-05-03'
    })
  : null

/**
 * Resolves a Sanity image object or reference into a direct CDN URL.
 * Falls back to returning the source if it is already a string URL.
 */
export const getSanityImageUrl = (source) => {
  if (!source) return null
  if (typeof source === 'string') return source
  
  const assetRef = source.asset?._ref || source._ref
  if (!assetRef || !projectId) return null
  
  // Ref format: image-5f6067b0eb4f6c449c25143a57e3f2ffb53e8d2e-1200x800-jpg
  const parts = assetRef.split('-')
  if (parts.length < 4) return null
  
  const id = parts[1]
  const dimensions = parts[2]
  const extension = parts[3]
  
  return `https://cdn.sanity.io/images/${projectId}/${dataset}/${id}-${dimensions}.${extension}`
}

/**
 * Resolves a Sanity file reference into a direct CDN download URL.
 */
export const getSanityFileUrl = (source) => {
  if (!source) return null
  if (typeof source === 'string') return source
  
  const assetRef = source.asset?._ref || source._ref
  if (!assetRef || !projectId) return null
  
  // Ref format: file-5f6067b0eb4f6c449c25143a57e3f2ffb53e8d2e-pdf
  const parts = assetRef.split('-')
  if (parts.length < 3) return null
  
  const id = parts[1]
  const extension = parts[2]
  
  return `https://cdn.sanity.io/files/${projectId}/${dataset}/${id}.${extension}`
}

/**
 * Fetches all article documents from Sanity.
 */
export async function fetchArticles() {
  if (!sanityClient) return []
  try {
    const query = `*[_type == "article"] | order(date desc) {
      "id": _id,
      title,
      excerpt,
      body,
      date,
      author,
      category,
      "featured_media_url": featuredImage.asset->url
    }`
    const results = await sanityClient.fetch(query)
    // Resolve cover image URLs if standard asset URL didn't populate directly
    return results.map(item => ({
      ...item,
      featured_media_url: item.featured_media_url || getSanityImageUrl(item.featuredImage) || '/hero_research.png'
    }))
  } catch (err) {
    console.error("Sanity fetchArticles failed, utilizing local fallback:", err)
    return []
  }
}

/**
 * Fetches all publication documents from Sanity.
 */
export async function fetchPublications() {
  if (!sanityClient) return []
  try {
    const query = `*[_type == "publication"] | order(year desc, title asc) {
      "id": _id,
      title,
      summary,
      author,
      "pdf_upload": fileAttachment.asset->url,
      publication_type,
      year,
      topic_area,
      state_coverage,
      "cover_image_url": coverImage.asset->url,
      download_count
    }`
    const results = await sanityClient.fetch(query)
    return results.map(item => ({
      ...item,
      cover_image_url: item.cover_image_url || getSanityImageUrl(item.coverImage) || '/community_lab.png',
      pdf_upload: item.pdf_upload || getSanityFileUrl(item.fileAttachment) || '#'
    }))
  } catch (err) {
    console.error("Sanity fetchPublications failed, utilizing local fallback:", err)
    return []
  }
}
