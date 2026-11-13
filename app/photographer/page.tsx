import Link from "next/link";
import {PhotographerUpload} from '@/components/gallery/PhotographerUpload';
export const metadata={title:'Photographer studio | Yoruba Day',robots:{index:false,follow:false},referrer:'no-referrer' as const};
export default function Page(){return <main className="min-h-screen bg-espresso px-5 py-16 text-cream"><div className="mx-auto max-w-2xl"><Link href="/" className="text-gold">YORUBA DAY · CANBERRA</Link><p className="mt-16 text-sm uppercase tracking-[.3em] text-gold">The private studio</p><h1 className="my-5 font-serif text-5xl">Through your lens.</h1><PhotographerUpload/></div></main>;}
