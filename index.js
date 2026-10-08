import express from 'express';
import makeWASocket, { useMultiFileAuthState, delay, makeCacheableSignalKeyStore } from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';
import pino from 'pino';

const app = express();
const PORT = process.env.PORT || 10000;
app.use(express.json());

if(!fs.existsSync('./sessions')) fs.mkdirSync('./sessions');
if(!fs.existsSync('./paired.json')) fs.writeFileSync('./paired.json','[]');
const getPaired=()=>JSON.parse(fs.readFileSync('./paired.json'));
const savePaired=(d)=>fs.writeFileSync('./paired.json',JSON.stringify(d,null,2));

let sessions={}, store={};

const countries = [
["AF","Afghanistan","93"],["AL","Albania","355"],["DZ","Algeria","213"],["US","USA","1"],["GB","UK","44"],
["UG","Uganda","256"],["KE","Kenya","254"],["TZ","Tanzania","255"],["RW","Rwanda","250"],["BI","Burundi","257"],
["CD","DR Congo","243"],["SS","South Sudan","211"],["ET","Ethiopia","251"],["SO","Somalia","252"],["NG","Nigeria","234"],
["ZA","South Africa","27"],["GH","Ghana","233"],["ZM","Zambia","260"],["ZW","Zimbabwe","263"],["IN","India","91"],
["PK","Pakistan","92"],["BD","Bangladesh","880"],["ID","Indonesia","62"],["MY","Malaysia","60"],["PH","Philippines","63"],
["TR","Turkey","90"],["SA","Saudi","966"],["AE","UAE","971"],["EG","Egypt","20"],["FR","France","33"],
["DE","Germany","49"],["IT","Italy","39"],["ES","Spain","34"],["RU","Russia","7"],["BR","Brazil","55"]
// full list will be auto-generated in UI below, this is fallback
];

app.get('/', (req,res)=>{
 res.send(`
<!DOCTYPE html><html><head><title>STORM CYBER MD</title><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:sans-serif}
body{background:#0a0a14;color:#fff;min-height:100vh}
.bg{position:fixed;inset:0;z-index:-1;background:linear-gradient(120deg,#00ffff,#ff00ff,#ffea00,#00ff88);background-size:400% 400%;animation:rgb 6s infinite;opacity:0.15}
@keyframes rgb{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
.top{display:flex;justify-content:space-between;padding:14px 20px;background:rgba(255,255,255,0.05);backdrop-filter:blur(10px)}
.hero{text-align:center;padding:18px}
.logo{width:130px;height:130px;margin:0 auto;border-radius:28px;padding:3px;background:linear-gradient(45deg,#00ffff,#ff00ff,#ffea00);animation:rgb 3s infinite;box-shadow:0 0 30px #00ffff80;display:flex;align-items:center;justify-content:center}
.logo img{width:100%;height:100%;border-radius:24px;object-fit:cover}
h1{margin-top:12px;font-size:27px;background:linear-gradient(90deg,#00ffff,#ff00ff,#ffea00);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-size:200%;animation:rgb 3s infinite}
.live{display:inline-block;margin-top:8px;background:rgba(0,255,136,0.15);border:1px solid #00ff88;padding:5px 16px;border-radius:20px;font-size:13px}
.card{margin:18px;background:rgba(255,255,255,0.07);backdrop-filter:blur(15px);border:1px solid rgba(255,255,255,0.12);border-radius:20px;padding:20px}
select,input{width:100%;padding:13px;margin:8px 0 14px;background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.15);border-radius:12px;color:#fff;outline:none}
.btn{width:100%;padding:14px;border:none;border-radius:12px;font-weight:800;background:linear-gradient(90deg,#00d4ff,#7a00ff);background-size:200%;animation:rgb 3s infinite;color:#fff;cursor:pointer}
.codeBox{margin-top:18px;display:none;background:#000;border:1px dashed #00ffff;padding:15px;border-radius:14px;text-align:center;box-shadow:0 0 20px #00ffff33}
.code{font-size:30px;letter-spacing:4px;font-weight:900;color:#00ffff;text-shadow:0 0 15px #00ffff}
.copyBtn{margin-top:10px;padding:8px 18px;border-radius:20px;border:1px solid #00ffff;background:rgba(0,255,255,0.1);color:#00ffff;cursor:pointer}
.sidebar{position:fixed;top:0;left:-100%;width:80%;max-width:300px;height:100%;background:#0a1225;z-index:99;padding:20px;transition:0.4s}
.sidebar.active{left:0}
.sidebar a{display:block;padding:13px;margin:8px 0;background:rgba(255,255,255,0.06);border-radius:11px;color:#fff;text-decoration:none}
.modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:100;justify-content:center;align-items:center;padding:20px}
.box{background:#0f172a;border:1px solid #00ffff55;border-radius:15px;padding:20px;width:100%;max-width:430px;max-height:80vh;overflow:auto}
</style>
</head><body>
<div class="bg"></div>
<div class="top"><div style="font-size:26px;cursor:pointer" onclick="tog()">☰</div><div>STORM CYBER MD</div></div>
<div class="sidebar" id="side"><div style="text-align:right;font-size:22px;cursor:pointer" onclick="tog()">✕</div><br>
<a onclick="viewPaired()">📞 My Paired Numbers</a><a onclick="showInfo('count')">📊 Numbers</a><a onclick="showInfo('owner')">👤 About Owner</a><a onclick="showInfo('about')">ℹ️ About Storm</a><a onclick="tog()">🏠 Home</a></div>
<div class="hero"><div class="logo"><img src="https://files.catbox.moe/0bb8x1.jpg"></div><h1>STORM CYBER MD</h1><p style="opacity:0.6;font-size:11px;letter-spacing:3px">MULTI DEVICE WHATSAPP BOT</p><div class="live">● <span id="cnt">0</span> connected</div></div>
<div class="card">
<label>PAIR YOUR WHATSAPP NUMBER</label><br><br>
<label>COUNTRY</label>
<select id="country"></select>
<label>WHATSAPP NUMBER</label>
<div style="display:flex;gap:8px"><input id="cc" style="max-width:90px" disabled><input id="num" type="number" placeholder="766233041 WITHOUT country code"></div>
<button class="btn" onclick="pair()">Connect WhatsApp</button>
<div class="codeBox" id="cBox">
<p style="font-size:11px;opacity:0.5">YOUR PAIRING CODE</p>
<div class="code" id="pCode">--------</div>
<button class="copyBtn" onclick="copy('pCode')">📋 Copy Code</button>
<p style="font-size:11px;margin-top:8px;opacity:0.5">Open WhatsApp → Linked Devices → Link with phone number, then enter this code.</p>
<button class="copyBtn" style="width:100%;margin-top:12px;background:#ff0040;border-color:#ff0040;color:#fff" onclick="cancelPair()">Cancel</button>
<div id="sessArea" style="display:none;margin-top:15px;border-top:1px solid #ffffff22;padding-top:12px">
<p style="font-size:11px;color:#00ff88">✓ SESSION SAVED - READY</p>
<div class="code" id="sessId" style="font-size:11px;word-break:break-all;letter-spacing:1px;color:#00ff88">waiting...</div>
<button class="copyBtn" onclick="copy('sessId')">📋 Copy Session</button>
</div>
</div>
</div>
<div class="modal" id="modal" onclick="this.style.display='none'"><div class="box" id="mBox"></div></div>
<script>
const allCountries = [
["Afghanistan","93"],["Albania","355"],["Algeria","213"],["Andorra","376"],["Angola","244"],["Argentina","54"],["Armenia","374"],["Australia","61"],["Austria","43"],["Azerbaijan","994"],
["Bahamas","1242"],["Bahrain","973"],["Bangladesh","880"],["Belarus","375"],["Belgium","32"],["Benin","229"],["Bhutan","975"],["Bolivia","591"],["Bosnia","387"],["Botswana","267"],["Brazil","55"],["Brunei","673"],["Bulgaria","359"],["Burkina Faso","226"],["Burundi","257"],
["Cambodia","855"],["Cameroon","237"],["Canada","1"],["Chad","235"],["Chile","56"],["China","86"],["Colombia","57"],["Comoros","269"],["Congo","242"],["DR Congo","243"],["Costa Rica","506"],["Croatia","385"],["Cuba","53"],["Cyprus","357"],["Czech","420"],
["Denmark","45"],["Djibouti","253"],["Dominica","1767"],["Dominican","1809"],
["Ecuador","593"],["Egypt","20"],["El Salvador","503"],["Equatorial Guinea","240"],["Eritrea","291"],["Estonia","372"],["Eswatini","268"],["Ethiopia","251"],
["Fiji","679"],["Finland","358"],["France","33"],
["Gabon","241"],["Gambia","220"],["Georgia","995"],["Germany","49"],["Ghana","233"],["Greece","30"],["Guatemala","502"],["Guinea","224"],["Guyana","592"],
["Haiti","509"],["Honduras","504"],["Hong Kong","852"],["Hungary","36"],
["Iceland","354"],["India","91"],["Indonesia","62"],["Iran","98"],["Iraq","964"],["Ireland","353"],["Israel","972"],["Italy","39"],
["Jamaica","1876"],["Japan","81"],["Jordan","962"],
["Kazakhstan","7"],["Kenya","254"],["Kuwait","965"],["Kyrgyzstan","996"],
["Laos","856"],["Latvia","371"],["Lebanon","961"],["Lesotho","266"],["Liberia","231"],["Libya","218"],["Lithuania","370"],["Luxembourg","352"],
["Madagascar","261"],["Malawi","265"],["Malaysia","60"],["Maldives","960"],["Mali","223"],["Malta","356"],["Mauritania","222"],["Mauritius","230"],["Mexico","52"],["Moldova","373"],["Monaco","377"],["Mongolia","976"],["Montenegro","382"],["Morocco","212"],["Mozambique","258"],["Myanmar","95"],
["Namibia","264"],["Nepal","977"],["Netherlands","31"],["New Zealand","64"],["Nicaragua","505"],["Niger","227"],["Nigeria","234"],["North Korea","850"],["Norway","47"],
["Oman","968"],
["Pakistan","92"],["Palestine","970"],["Panama","507"],["Papua New Guinea","675"],["Paraguay","595"],["Peru","51"],["Philippines","63"],["Poland","48"],["Portugal","351"],
["Qatar","974"],
["Romania","40"],["Russia","7"],["Rwanda","250"],
["Saudi Arabia","966"],["Senegal","221"],["Serbia","381"],["Seychelles","248"],["Sierra Leone","232"],["Singapore","65"],["Slovakia","421"],["Slovenia","386"],["Somalia","252"],["South Africa","27"],["South Korea","82"],["South Sudan","211"],["Spain","34"],["Sri Lanka","94"],["Sudan","249"],["Sweden","46"],["Switzerland","41"],["Syria","963"],
["Taiwan","886"],["Tajikistan","992"],["Tanzania","255"],["Thailand","66"],["Togo","228"],["Trinidad","1868"],["Tunisia","216"],["Turkey","90"],["Turkmenistan","993"],
["Uganda","256"],["Ukraine","380"],["UAE","971"],["UK","44"],["USA","1"],["Uruguay","598"],["Uzbekistan","998"],
["Venezuela","58"],["Vietnam","84"],
["Yemen","967"],
["Zambia","260"],["Zimbabwe","263"]
];
let sel=document.getElementById('country');
allCountries.forEach(c=>{
 let o=document.createElement('option');
 o.value=c[1]; o.textContent=c[0]+' +'+c[1];
 if(c[1]=='256') o.selected=true;
 sel.appendChild(o);
});
document.getElementById('cc').value='+256';
sel.addEventListener('change',e=>{ document.getElementById('cc').value='+'+e.target.value; });

let fullNum="";
function tog(){document.getElementById('side').classList.toggle('active')}
async function pair(){
 let c=sel.value;
 let n=document.getElementById('num').value.replace(/[^0-9]/g,'').replace(/^0+/,'');
 if(!n) return alert('Enter number WITHOUT country code. Example for Uganda: 766233041 not 256766233041');
 // prevent double country code if user pasted full number
 if(n.startsWith(c)){ n=n.slice(c.length); }
 fullNum=c+n;
 document.getElementById('cBox').style.display='block';
 document.getElementById('pCode').innerText='Generating...';
 try{
  let r=await fetch('/pair?number='+fullNum);
  let d=await r.json();
  if(d.code){ document.getElementById('pCode').innerText=d.code; checkSess(); }
  else document.getElementById('pCode').innerText=d.error||'Failed';
 }catch(e){ document.getElementById('pCode').innerText='Server error, redeploy'; }
}
function copy(id){ let t=document.getElementById(id).innerText; navigator.clipboard.writeText(t); alert('Copied!'); }
async function checkSess(){
 let int=setInterval(async()=>{
  let r=await fetch('/session?number='+fullNum); let d=await r.json();
  if(d.session){ document.getElementById('sessArea').style.display='block'; document.getElementById('sessId').innerText=d.session; clearInterval(int); loadCnt(); }
 },3000);
}
function cancelPair(){ document.getElementById('cBox').style.display='none'; if(fullNum) fetch('/disconnect?number='+fullNum); }
async function viewPaired(){ let r=await fetch('/paired'); let d=await r.json(); let h='<h3>📞 Paired Numbers</h3><br>'; if(d.length==0) h+='No numbers'; else d.forEach(x=>{ h+='<div style="background:rgba(255,255,255,0.06);padding:10px;border-radius:10px;margin:8px 0;display:flex;justify-content:space-between;align-items:center"><span>'+x.number+'<br><small style=opacity:0.5>'+new Date(x.date).toLocaleString()+'</small></span><button onclick="delNum(\\''+x.number+'\\')" style="background:#ff0040;border:none;padding:6px 10px;border-radius:8px;color:#fff">Disconnect</button></div>'; }); document.getElementById('mBox').innerHTML=h; document.getElementById('modal').style.display='flex'; }
async function delNum(num){ if(!confirm('Disconnect '+num+'?')) return; await fetch('/disconnect?number='+num); viewPaired(); loadCnt(); }
function showInfo(t){ let b=document.getElementById('mBox'); if(t=='owner') b.innerHTML='<h3>👤 About Owner</h3><br><b>STORM CYBER TECH</b><br><br>📞 256766233041<br>📞 256766233041<br><br><a href=https://wa.me/256766233041 style=color:#00ffff>Chat Owner</a>'; else if(t=='about') b.innerHTML='<h3>ℹ️ About Storm Cyber MD</h3><br>⚡ Multi device WhatsApp bot<br>✅ All country codes<br>✅ Session saver<br>✅ 300+ commands<br><br><img src=https://files.catbox.moe/0bb8x1.jpg style=width:100%;border-radius:12px>'; else if(t=='count') b.innerHTML='<h3>📊 Total</h3><br>'+document.getElementById('cnt').innerText+' connected'; document.getElementById('modal').style.display='flex'; }
async function loadCnt(){ let r=await fetch('/paired'); let d=await r.json(); document.getElementById('cnt').innerText=d.length; } loadCnt();
</script></body></html>
 `);
});

app.get('/pair', async(req,res)=>{
 let num=req.query.number?.replace(/[^0-9]/g,'');
 if(!num) return res.json({error:'No number'});
 num=num.replace(/^0+/,'');
 let dir='./sessions/'+num;
 if(fs.existsSync(dir)) fs.rmSync(dir,{recursive:true,force:true});
 fs.mkdirSync(dir,{recursive:true});
 let { state, saveCreds } = await useMultiFileAuthState(dir);
 let sock = makeWASocket({ logger:pino({level:'silent'}), auth:{ creds:state.creds, keys:makeCacheableSignalKeyStore(state.keys, {}) }, printQRInTerminal:false, browser:["STORM CYBER MD","Chrome","1.0"] });
 sessions[num]=sock;
 sock.ev.on('creds.update', saveCreds);
 if(!sock.authState.creds.registered){
  await delay(2000);
  try{
   let code=await sock.requestPairingCode(num);
   // auto format like G1TK-CPRJ or 8 chars
   let formatted = code.includes('-')? code : code.match(/.{1,4}/g)?.join('-') || code;
   res.json({code:formatted});
   sock.ev.on('connection.update', async(u)=>{
    if(u.connection==='open'){
     await delay(2500);
     try{
      let creds=fs.readFileSync(path.join(dir,'creds.json'));
      let sess=Buffer.from(creds).toString('base64');
      store[num]=sess;
      let paired=getPaired();
      if(!paired.find(p=>p.number===num)) paired.push({number:num,date:new Date(),session:sess});
      else paired=paired.map(p=>p.number===num?{...p,session:sess}:p);
      savePaired(paired);
     }catch{}
    }
   });
  }catch(e){ res.json({error:'Failed to generate code. Retry in 10sec. '+e.message}); }
 } else res.json({error:'Already paired'});
});

app.get('/session',(req,res)=>{
 let num=req.query.number?.replace(/[^0-9]/g,'').replace(/^0+/,'');
 if(store[num]) return res.json({session:store[num]});
 let f=getPaired().find(p=>p.number===num);
 res.json({session:f?.session||null});
});
app.get('/paired',(req,res)=>res.json(getPaired()));
app.get('/disconnect', async(req,res)=>{
 let num=req.query.number?.replace(/[^0-9]/g,'').replace(/^0+/,'');
 if(sessions[num]){ try{ await sessions[num].logout(); }catch{} delete sessions[num]; }
 delete store[num];
 savePaired(getPaired().filter(p=>p.number!==num));
 let dir='./sessions/'+num; if(fs.existsSync(dir)) fs.rmSync(dir,{recursive:true,force:true});
 res.json({ok:true});
});
app.listen(PORT,()=>console.log('STORM running '+PORT));
