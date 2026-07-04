const fs = require('fs'); const path = require('path'); const os = require('os');
function loadEnv(p){const o={};try{for(const l of fs.readFileSync(p,'utf8').split('\n')){const m=l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);if(m)o[m[1]]=m[2].replace(/^["']|["']$/g,'');}}catch{}return o;}
const env={...loadEnv(path.join(os.homedir(),'.claude','.env')),...loadEnv(path.join(os.homedir(),'.claude','.env.from-laptop1'))};
const headers=env.CLOUDFLARE_API_TOKEN?{Authorization:`Bearer ${env.CLOUDFLARE_API_TOKEN}`}:{'X-Auth-Key':env.CLOUDFLARE_API_KEY,'X-Auth-Email':env.CLOUDFLARE_EMAIL||'cff@centremedicalfont.ca'};
const api=async(p,opts={})=>{const r=await fetch(`https://api.cloudflare.com/client/v4${p}`,{...opts,headers:{...headers,...(opts.headers||{})}});const j=await r.json();if(!j.success)throw new Error(`${p}: ${JSON.stringify(j.errors).slice(0,300)}`);return j.result;};
(async()=>{
  const acct='70443374001b15666eeaa70ab5f0062b';
  const zones=await api('/zones?name=instanthpi.ai');
  if(!zones.length)throw new Error('zone instanthpi.ai not on this account');
  const zone=zones[0]; console.log('zone:',zone.id,zone.name,'acct:',zone.account.id);
  const d=await api(`/accounts/${acct}/workers/domains`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({zone_id:zone.id,hostname:'petition.instanthpi.ai',service:'petition-familles',environment:'production'})});
  console.log('custom domain attached:',d.hostname);
})().catch(e=>{console.error('FAIL:',e.message);process.exit(1);});
