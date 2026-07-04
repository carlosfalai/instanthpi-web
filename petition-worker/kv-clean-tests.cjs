const fs = require('fs'); const path = require('path'); const os = require('os'); const crypto = require('crypto');
function loadEnv(p){const o={};try{for(const l of fs.readFileSync(p,'utf8').split('\n')){const m=l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);if(m)o[m[1]]=m[2].replace(/^["']|["']$/g,'');}}catch{}return o;}
const env={...loadEnv(path.join(os.homedir(),'.claude','.env')),...loadEnv(path.join(os.homedir(),'.claude','.env.from-laptop1'))};
const headers=env.CLOUDFLARE_API_TOKEN?{Authorization:`Bearer ${env.CLOUDFLARE_API_TOKEN}`}:{'X-Auth-Key':env.CLOUDFLARE_API_KEY,'X-Auth-Email':env.CLOUDFLARE_EMAIL||'cff@centremedicalfont.ca'};
const ACCT='70443374001b15666eeaa70ab5f0062b', NS='1ee7ea2b95fa40c98325e321477bfbf1';
const sha=(s)=>crypto.createHash('sha256').update(s).digest('hex');
const keys=['pay:smoke-test-1','tally:VC-999999','ro:careers:'+sha('smoke-careers@example.com'),'sig:'+sha('test-petition@example.com')];
(async()=>{
  for(const k of keys){
    const r=await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCT}/storage/kv/namespaces/${NS}/values/${encodeURIComponent(k)}`,{method:'DELETE',headers});
    const j=await r.json();
    console.log(k,'->',j.success?'deleted':JSON.stringify(j.errors).slice(0,80));
  }
})();
