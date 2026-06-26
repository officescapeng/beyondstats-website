export default {
  name: 'article',
  title: 'Article / Insight Story',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      description: 'A brief summary of the article shown in grid cards.',
      validation: Rule => Rule.required().max(200)
    },
    {
      name: 'body',
      title: 'Body Content',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'The rich text content of the article.'
    },
    {
      name: 'date',
      title: 'Publish Date',
      type: 'date',
      validation: Rule => Rule.required()
    },
    {
      name: 'author',
      title: 'Author',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      description: 'e.g. "Research Brief", "Human Security Monitor", "Policy Insight", "Community Solutions"',
      validation: Rule => Rule.required()
    },
    {
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      options: {
        hotspot: true
      }
    }
  ]
}
