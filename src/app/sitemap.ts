import { MetadataRoute } from 'next';
import { INITIAL_COURSES } from '@/lib/coursesData';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://stutosed.vercel.app';

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];

  const portalPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/?view=beu-engineering`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/?view=gov-exams`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/?view=courses`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  const coursePages: MetadataRoute.Sitemap = INITIAL_COURSES.map((course) => ({
    url: `${baseUrl}/?course=${encodeURIComponent(course.id)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  return [...staticPages, ...portalPages, ...coursePages];
}
