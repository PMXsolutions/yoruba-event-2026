import {thankYouReport,thankYouPreview} from '@/app/actions/thank-you';
import {ThankYouDispatch} from '@/components/dashboard/ThankYouDispatch';
export const dynamic='force-dynamic';
export default async function Page(){return <ThankYouDispatch initial={await thankYouReport()} preview={await thankYouPreview()}/>;}
