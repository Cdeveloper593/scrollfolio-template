import { notFound } from 'next/navigation';
import content from '@/components/sites/portfolio/content.json';
import { Project } from '@/components/sites/portfolio/project';

type Params = { params: Promise<{ slug: string }> };

async function getIndex(params: Params['params']) {
  const { slug } = await params;
  const index = content.projects.findIndex((project) => project.slug === slug);
  if (index === -1) notFound();
  return index;
}

export function generateStaticParams() {
  return content.projects.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Params) {
  const project = content.projects[await getIndex(params)];
  return { title: `${project.seoTitle ?? project.title} | Alex Carter`, description: project.seoDescription };
}

export default async function Page({ params }: Params) {
  return <Project index={await getIndex(params)} />;
}
