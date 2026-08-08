import { NextResponse } from "next/server";
import { z } from "zod";
import { getFirebaseClaims } from "@/lib/firebase/server";
import { createClient } from "@/lib/supabase/server";
const schema=z.object({token:z.string().length(64).regex(/^[a-f0-9]+$/)});
export async function POST(request:Request){const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Invalid invitation link"},{status:400});const user=await getFirebaseClaims();if(!user)return NextResponse.json({error:"Sign in with the invited email address"},{status:401});const supabase=await createClient();const result=await supabase.rpc("accept_invitation",{raw_token:parsed.data.token});if(result.error)return NextResponse.json({error:result.error.message},{status:400});return NextResponse.json({organizationId:result.data});}
