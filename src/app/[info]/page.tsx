import { notFound } from 'next/navigation';
import content from '@/components/sites/portfolio/content.json';

type Params = { params: Promise<{ info: string }> };

async function getPage(params: Params['params']) {
  const { info } = await params;
  if (!Object.hasOwn(content.info, info)) notFound();
  return content.info[info as keyof typeof content.info];
}

export function generateStaticParams() {
  return Object.keys(content.info).map((info) => ({ info }));
}

export async function generateMetadata({ params }: Params) {
  return { title: (await getPage(params)).title };
}

export default async function Page({ params }: Params) {
  const page = await getPage(params);
  return <>
    <link rel="stylesheet" href="/sites/portfolio/info.css" precedence="default" />
    <div dangerouslySetInnerHTML={{ __html: page.html }} />
  </>;
}
