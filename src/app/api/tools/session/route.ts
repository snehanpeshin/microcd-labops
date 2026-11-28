import {createClient} from "@/lib/supabase/server";

const origins = new Set(["https://www.microcdlabs.com", "https://microcdlabs.com"]);

async function session(request: Request, logout: boolean) {
  const origin = request.headers.get("origin") || "";
  const headers = new Headers({"Cache-Control":"private, no-store", Vary:"Origin"});
  if (!origins.has(origin)) return new Response(null,{status:403,headers});
  headers.set("Access-Control-Allow-Origin",origin);
  headers.set("Access-Control-Allow-Credentials","true");
  try {
    const client = await createClient();
    if (logout) {
      const {error} = await client.auth.signOut({scope:"local"});
      return new Response(null,{status:error ? 503 : 204, headers});
    }
    const {data,error} = await client.auth.getUser();
    if (error && error.name !== "AuthSessionMissingError" && Number(error.status) >= 500)
      return new Response(null,{status:503,headers});
    const user = data.user;
    return Response.json({user:user ? {id:user.id,email:user.email} : null},{headers});
  } catch {return new Response(null,{status:503,headers});}
}
export function GET(request: Request) {return session(request,false);}
export function POST(request: Request) {return session(request,true);}
