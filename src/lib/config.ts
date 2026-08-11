export const appConfig = {
  name: "MicroCD LabOps Beta",
  tagline: "Design, run, document, and trace scientific hardware development.",
  company: "MicroCD Labs, operated by Karigari Home LLC",
  demoMode: process.env.NEXT_PUBLIC_DEMO_MODE !== "false",
  supabaseConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
  aiConfigured: Boolean(process.env.OPENAI_API_KEY),
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
};
