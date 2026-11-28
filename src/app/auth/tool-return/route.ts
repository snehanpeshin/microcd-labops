const paths: Record<string,string> = {modeler:"/modeler/",analyzer:"/analyzer/",crp:"/analyzer/crp/"};
export function GET(request: Request) {
  const tool = new URL(request.url).searchParams.get("tool") || "";
  const path = Object.hasOwn(paths,tool) ? paths[tool] : "/tools.html";
  return new Response(null,{status:303,headers:{Location:"https://www.microcdlabs.com"+path,"Cache-Control":"private, no-store"}});
}
