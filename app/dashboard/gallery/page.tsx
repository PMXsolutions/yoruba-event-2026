import {requireAuth} from '@/lib/auth/rbac';
import {listMedia,links} from '@/lib/gallery/store';
import {GalleryManager} from '@/components/gallery/GalleryManager';
export const dynamic='force-dynamic';
export default async function Page(){const auth=await requireAuth('settings.write');if(!auth.ok)return <p>Gallery moderation requires administrator access.</p>;return <GalleryManager items={await listMedia(true)} links={await links()}/>;}
