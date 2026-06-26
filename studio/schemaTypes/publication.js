export default {
  name: 'publication',
  title: 'Publication / Report',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'summary',
      title: 'Summary',
      type: 'text',
      description: 'A brief description of the report contents.',
      validation: Rule => Rule.required()
    },
    {
      name: 'author',
      title: 'Author',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'fileAttachment',
      title: 'PDF File Attachment',
      type: 'file',
      description: 'Upload the PDF document here.',
      options: {
        accept: '.pdf'
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'publication_type',
      title: 'Publication Type',
      type: 'string',
      options: {
        list: [
          { title: 'Annual Reports', value: 'Annual Reports' },
          { title: 'Research Reports', value: 'Research Reports' },
          { title: 'Situation Reports', value: 'Situation Reports' },
          { title: 'Human Security Briefs', value: 'Human Security Briefs' }
        ]
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'year',
      title: 'Publication Year',
      type: 'number',
      validation: Rule => Rule.required().min(2000).max(2100)
    },
    {
      name: 'topic_area',
      title: 'Topic Area',
      type: 'string',
      description: 'e.g. "Governance & Accountability", "Human Security Observatory", "Food Security"',
      validation: Rule => Rule.required()
    },
    {
      name: 'state_coverage',
      title: 'State Coverage',
      type: 'string',
      description: 'e.g. "National", "Middle Belt", "Kaduna", "Kano"',
      validation: Rule => Rule.required()
    },
    {
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: {
        hotspot: true
      }
    },
    {
      name: 'download_count',
      title: 'Initial Download Count',
      type: 'number',
      description: 'Optional initial counter for downloads.'
    }
  ]
}
