/* reality-writer — Cloudflare Worker
   Receives a journal entry from reality.html, appends one row to data/reality.csv
   in asadgo/power-the-cave-2026 as a git commit via the GitHub Contents API.

   Deploy (browser only, ~15 min):
   1. GitHub → Settings → Developer settings → Fine-grained tokens → Generate:
      Repository access = ONLY power-the-cave-2026 · Permissions: Contents = Read and write.
      Copy the token.
   2. cloudflare.com → sign up free → Workers & Pages → Create → Worker →
      name it reality-writer → Deploy → Edit code → replace everything with this file → Deploy.
   3. Worker → Settings → Variables & Secrets → Add → type Secret →
      name GITHUB_TOKEN, value = the token from step 1.
   4. Copy the worker URL (https://reality-writer.<you>.workers.dev) into
      WORKER_URL at the top of reality.html (GitHub pencil, one line) → commit.
*/
const OWNER='asadgo', REPO='power-the-cave-2026', PATH='data/reality.csv', BRANCH='main';
const ORIGINS=['https://asadgo.github.io']; /* add 'https://yourdomain.com' when the .com lands */
const FIELDS=['date','time','logged_by','gen1_hours','gen2_hours','gal_gen1','gal_gen2','gal_delivered','drum1_gal','drum2_gal','notes'];
const NUMS=['gen1_hours','gen2_hours','gal_gen1','gal_gen2','gal_delivered','drum1_gal','drum2_gal'];
const hits=new Map(); /* best-effort per-IP limiter (per isolate) */

function cors(req){
  const o=req.headers.get('Origin')||'';
  const ok=ORIGINS.includes(o)?o:ORIGINS[0];
  return {'Access-Control-Allow-Origin':ok,'Access-Control-Allow-Methods':'POST,OPTIONS',
    'Access-Control-Allow-Headers':'Content-Type','Vary':'Origin'};
}
const cell=v=>{v=String(v==null?'':v);return /[",\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;};
function bad(msg,req){return new Response(msg,{status:400,headers:cors(req)});}

export default {
  async fetch(req, env){
    if(req.method==='OPTIONS')return new Response(null,{headers:cors(req)});
    if(req.method!=='POST')return new Response('POST only',{status:405,headers:cors(req)});

    const ip=req.headers.get('CF-Connecting-IP')||'?';
    const now=Date.now(), win=(hits.get(ip)||[]).filter(t=>now-t<60000);
    if(win.length>=8)return new Response('Slow down — 8 entries/min max.',{status:429,headers:cors(req)});
    win.push(now);hits.set(ip,win);

    let b;try{b=await req.json();}catch(e){return bad('Body must be JSON.',req);}
    const r={};FIELDS.forEach(k=>r[k]=String(b[k]==null?'':b[k]).trim());
    if(!r.logged_by)return bad('Name is required.',req);
    if(r.logged_by.length>40)return bad('Name too long.',req);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(r.date))return bad('Date must be YYYY-MM-DD.',req);
    if(r.time&&!/^\d{1,2}:\d{2}$/.test(r.time))return bad('Time must be HH:MM.',req);
    const CAPS={gal_gen1:9,gal_gen2:9,gal_delivered:200,drum1_gal:50,drum2_gal:50,gen1_hours:20000,gen2_hours:20000};
    for(const k of NUMS){if(r[k]!==''&&(isNaN(+r[k])||+r[k]<0))return bad(k+' must be a number \u2265 0.',req);
      if(r[k]!==''&&+r[k]>CAPS[k])return bad(k+' too high (max '+CAPS[k]+').',req);}
    if(!NUMS.some(k=>r[k]!=='')&&!/^RETRACT#\d+:/.test(r.notes))return bad('Log at least one number.',req);
    if((r.drum1_gal!=='')!==(r.drum2_gal!==''))return bad('Log both drums \u2014 0 for an empty drum.',req);
    if(r.notes.length>200)return bad('Notes over 200 chars.',req);

    const line=FIELDS.map(k=>cell(r[k])).join(',');
    /* Backup mirror: append the same row to the Google Sheet (independent store). Never blocks or fails the commit. */
    const mirror=env.SHEET_URL?fetch(env.SHEET_URL,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify(r)}).catch(()=>null):Promise.resolve(null);
    const gh={'Authorization':'Bearer '+env.GITHUB_TOKEN,'User-Agent':'reality-writer',
      'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
    const url='https://api.github.com/repos/'+OWNER+'/'+REPO+'/contents/'+PATH;

    for(let attempt=0;attempt<3;attempt++){
      const g=await fetch(url+'?ref='+BRANCH,{headers:gh});
      if(!g.ok)return new Response('GitHub read failed: '+g.status,{status:502,headers:cors(req)});
      const j=await g.json();
      const cur=atob(j.content.replace(/\n/g,''));
      const next=(cur.endsWith('\n')||cur==='')?cur+line+'\n':cur+'\n'+line+'\n';
      const poured=(+r.gal_gen1||0)+(+r.gal_gen2||0);
      const summary=[poured&&('+'+poured+' gal to gens'),r.gal_delivered&&(r.gal_delivered+' gal delivered'),
        (r.drum1_gal!==''&&r.drum2_gal!=='')&&('drums '+((+r.drum1_gal)+(+r.drum2_gal))+' gal')].filter(Boolean).join(', ')||'meter reading';
      const p=await fetch(url,{method:'PUT',headers:gh,body:JSON.stringify({
        message:'reality: '+r.logged_by+' \u2014 '+summary,
        content:btoa(unescape(encodeURIComponent(next))),sha:j.sha,branch:BRANCH})});
      if(p.ok){try{await mirror;}catch(e){}return new Response('committed',{status:200,headers:cors(req)});}
      if(p.status!==409&&p.status!==422)return new Response('GitHub write failed: '+p.status,{status:502,headers:cors(req)});
      /* sha race with a simultaneous entry — re-read and retry */
    }
    return new Response('Busy — two entries collided three times. Try again.',{status:503,headers:cors(req)});
  }
}
