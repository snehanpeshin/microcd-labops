export type DlpSeverity = "high" | "medium" | "low";
export interface DlpFinding { category:string; label:string; severity:DlpSeverity; count:number; }
export interface DlpResult { safeText:string; findings:DlpFinding[]; blocked:boolean; redacted:boolean; }

const rules:{category:string;label:string;severity:DlpSeverity;pattern:RegExp;replacement:string}[]=[
  {category:"private_key",label:"Private cryptographic key",severity:"high",pattern:/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/gi,replacement:"[REDACTED PRIVATE KEY]"},
  {category:"api_secret",label:"API or access secret",severity:"high",pattern:/\b(?:sk-(?:proj-)?[A-Za-z0-9_-]{20,}|gh[opurs]_[A-Za-z0-9_]{20,}|AKIA[0-9A-Z]{16})\b/g,replacement:"[REDACTED SECRET]"},
  {category:"credential",label:"Credential assignment",severity:"high",pattern:/\b(?:password|passwd|secret|service[_ -]?role[_ -]?key|bearer)\s*[:=]\s*[^\s,;]{8,}/gi,replacement:"[REDACTED CREDENTIAL]"},
  {category:"ssn",label:"US Social Security number",severity:"medium",pattern:/\b(?!000|666|9\d\d)\d{3}[- ]?(?!00)\d{2}[- ]?(?!0000)\d{4}\b/g,replacement:"[REDACTED SSN]"},
  {category:"email",label:"Email address",severity:"medium",pattern:/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,replacement:"[REDACTED EMAIL]"},
  {category:"phone",label:"Phone number",severity:"medium",pattern:/(?<!\w)(?:\+?1[-. ]?)?\(?\d{3}\)?[-. ]\d{3}[-. ]\d{4}(?!\w)/g,replacement:"[REDACTED PHONE]"},
  {category:"medical_identifier",label:"Patient or medical record identifier",severity:"medium",pattern:/\b(?:patient|subject|mrn|medical record)\s*(?:id|number|#)?\s*[:=]\s*[A-Za-z0-9-]{3,}/gi,replacement:"[REDACTED MEDICAL IDENTIFIER]"},
];

export function scanAndSanitize(input:string):DlpResult{
  let safeText=input;const findings:DlpFinding[]=[];
  for(const rule of rules){let count=0;safeText=safeText.replace(rule.pattern,()=>{count++;return rule.replacement;});if(count)findings.push({category:rule.category,label:rule.label,severity:rule.severity,count});}
  return {safeText,findings,blocked:findings.some((item)=>item.severity==="high"),redacted:safeText!==input};
}

export function dlpSummary(result:DlpResult){return {blocked:result.blocked,redacted:result.redacted,findings:result.findings.map(({category,severity,count})=>({category,severity,count}))};}
