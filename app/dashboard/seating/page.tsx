import {seatingReport} from "@/app/actions/seating";
import {SeatingDispatch} from "@/components/dashboard/SeatingDispatch";
export const dynamic="force-dynamic";
export default async function SeatingPage(){return <SeatingDispatch initial={await seatingReport()}/>;}
