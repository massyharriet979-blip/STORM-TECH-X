import express from 'express';
import makeWASocket, { useMultiFileAuthState, delay, makeCacheableSignalKeyStore } from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';
import pino from 'pino';

const app = express();
const PORT = process.env.PORT || 10000;

let sessions = {};
let store = {};

if(!fs.existsSync('./sessions')) fs.mkdirSync('./sessions');
if(!fs.existsSync('./paired.json')) fs.writeFileSync('./paired.json','[]');

function getPaired(){ return JSON.parse(fs.readFileSync('./paired.json','utf-8')); }
function savePaired(d){ fs.writeFileSync('./paired.json', JSON.stringify(d,null,2)); }

app.get('/', (req,res)=>{
 res.send(`
<!DOCTYPE html><html><head><title>STORM CYBER MD</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:sans-serif}
body{background:#020617;color:#fff;min-height:100vh;position:relative;overflow-x:hidden}
.bg{position:fixed;inset:0;z-index:-1;background:linear-gradient(125deg,#00ffff,#ff00ff,#ffea00,#00ff88,#0080ff);background-size:400% 400%;animation:rgb 6s ease infinite;opacity:0.2}
@keyframes rgb{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
.top{display:flex;justify-content:space-between;padding:15px 20px;background:rgba(255,255,255,0.05);backdrop-filter:blur(10px)}
.hamburger{font-size:26px;cursor:pointer}
.hero{text-align:center;padding:20px}
.logo{width:125px;height:125px;margin:0 auto;border-radius:28px;padding:4px;background:linear-gradient(45deg,#00ffff,#ff00ff);animation:rgb 3s infinite;display:flex;align-items:center;justify-content:center;box-shadow:0 0 30px #00ffff80}
.logo img{width:100%;height:100%;border-radius:22px;object-fit:cover}
h1{margin-top:12px;font-size:28px;background:linear-gradient(90deg,#00ffff,#ff00ff,#ffea00);-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:rgb 3s infinite;background-size:200%}
.live{display:inline-block;margin-top:8px;background:rgba(0,255,136,0.15);border:1px solid #00ff88;padding:5px 15px;border-radius:20px;font-size:13px}
.card{margin:20px;background:rgba(255,255,255,0.07);backdrop-filter:blur(15px);border:1px solid rgba(255,255,255,0.12);border-radius:20px;padding:20px}
select,input{width:100%;padding:13px;margin:8px 0 14px;background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.15);border-radius:12px;color:#fff;outline:none}
.btn{width:100%;padding:14px;border:none;border-radius:12px;font-weight:800;background:linear-gradient(90deg,#00ffff,#008cff,#ff00ff);background-size:200%;animation:rgb 3s infinite;color:#fff;cursor:pointer}
.codeBox{margin-top:18px;display:none;background:#000;border:1px dashed #00ffff;padding:15px;border-radius:12px;text-align:center}
.code{font-size:28px;letter-spacing:4px;font-weight:900;color:#00ffff}
.copyBtn{margin-top:10px;padding:7px 14px;border-radius:8px;border:1px solid #00ffff;background:transparent;color:#00ffff;cursor:pointer;margin:5px}
.sidebar{position:fixed;top:0;left:-100%;width:80%;max-width:300px;height:100%;background:#0a1225;z-index:99;padding:20px;transition:0.4s}
.sidebar.active{left:0}
.sidebar a{display:block;padding:13px;margin:8px 0;background:rgba(255,255,255,0.06);border-radius:11px;color:#fff;text-decoration:none}
.modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:100;justify-content:center;align-items:center;padding:20px}
.box{background:#0f172a;border:1px solid #00ffff55;border-radius:15px;padding:20px;width:100%;max-width:420px;max-height:80vh;overflow:auto}
</style>
</head><body>
<div class="bg"></div>
<div class="top"><div class="hamburger" onclick="tog()">☰</div><div>STORM CYBER MD</div></div>

<div class="sidebar" id="side">
<div style="text-align:right;font-size:22px;cursor:pointer" onclick="tog()">✕</div><br>
<a onclick="viewPaired()">📞 My Paired Numbers</a>
<a onclick="showInfo('count')">📊 Numbers</a>
<a onclick="showInfo('fun')">😜 For Fun</a>
<a onclick="tog()">🏠 Back To Home</a>
<a onclick="showInfo('owner')">👤 About Owner</a>
<a onclick="showInfo('about')">ℹ️ About Storm Cyber MD</a>
</div>

<div class="hero">
<div class="logo"><img src="https://files.catbox.moe/0bb8x1.jpg"></div>
<h1>STORM CYBER MD</h1>
<p style="opacity:0.6;font-size:12px;letter-spacing:2px">MULTI DEVICE WHATSAPP BOT</p>
<div class="live">● <span id="cnt">0</span> connected</div>
</div>

<div class="card">
<label>PAIR YOUR WHATSAPP NUMBER</label><br><br>
<label>COUNTRY</label>
<select id="country">
<option value="">— Select country —</option>
<option value="256">🇺🇬 Uganda +256</option>
<option value="254">🇰🇪 Kenya +254</option>
<option value="255">🇹🇿 Tanzania +255</option>
<option value="250">🇷🇼 Rwanda +250</option>
<option value="91">🇮🇳 India +91</option>
<option value="234">🇳🇬 Nigeria +234</option>
<option value="27">🇿🇦 South Africa +27</option>
<option value="1">🇺🇸 USA +1</option>
<option value="44">🇬🇧 UK +44</option>
</select>
<label>WHATSAPP NUMBER</label>
<div style="display:flex;gap:8px"><input id="cc" style="max-width:90px" disabled placeholder="+"><input id="num" placeholder="7XXXXXXX"></div>
<button class="btn" onclick="pair()">Connect WhatsApp</button>

<div class="codeBox" id="cBox">
<p style="font-size:11px;opacity:0.6">YOUR PAIR CODE</p>
<div class="code" id="pCode">--------</div>
<button class="copyBtn" onclick="copy('pCode')">📋 Copy Code</button>
<p style="font-size:11px;margin-top:8px;opacity:0.5">WhatsApp > Linked Devices > Link with phone number</p>
<div id="sessArea" style="display:none;margin-top:15px;border-top:1px solid #ffffff22;padding-top:15px">
<p style="font-size:11px;opacity:0.6">SESSION SAVED - COPY SESSION ID</p>
<div class="code" id="sessId" style="font-size:12px;word-break:break-all;letter-spacing:1px">waiting...</div>
<button class="copyBtn" onclick="copy('sessId')">📋 Copy Session</button>
</div>
</div>
</div>

<div class="modal" id="modal" onclick="this.style.display='none'"><div class="box" id="mBox"></div></div>

<script>
let fullNum="";
function tog(){document.getElementById('side').classList.toggle('active')}
document.getElementById('country').addEventListener('change',e=>{
 document.getElementById('cc').value='+'+e.target.value;
});

async function pair(){
 let c=document.getElementById('country').value;
 let n=document.getElementById('num').value.replace(/[^0-9]/g,'');
 if(!c) return alert('Select country');
 if(!n) return alert('Enter number');
 fullNum=c+n;
 document.getElementById('cBox').style.display='block';
 document.getElementById('pCode').innerText='Generating...';
 let r=await fetch('/pair?number='+fullNum);
 let d=await r.json();
 if(d.code){ document.getElementById('pCode').innerText=d.code; checkSession(); }
 else document.getElementById('pCode').innerText=d.error;
}

function copy(id){
 let t=document.getElementById(id).innerText;
 navigator.clipboard.writeText(t);
 alert('Copied: '+t.substring(0,20)+'...');
}

async function checkSession(){
 let int=setInterval(async()=>{
  let r=await fetch('/session?number='+fullNum);
  let d=await r.json();
  if(d.session){
   document.getElementById('sessArea').style.display='block';
   document.getElementById('sessId').innerText=d.session;
   clearInterval(int);
   loadCount();
  }
 },3000);
}

async function viewPaired(){
 let r=await fetch('/paired'); let d=await r.json();
 let h='<h3>📞 Paired Numbers</h3><br>';
 if(d.length==0) h+='<p>No numbers</p>';
 else d.forEach(x=>{
  h+='<div style="background:rgba(255,255,255,0.06);padding:10px;border-radius:10px;margin:8px 0;display:flex;justify-content:space-between;align-items:center"><span>'+x.number+'<br><small style=opacity:0.5>'+new Date(x.date).toLocaleString()+'</small></span><button onclick="delNum(\\''+x.number+'\\')" style="background:#ff0040;border:none;padding:6px 10px;border-radius:8px;color:#fff">Disconnect</button></div>';
 });
 document.getElementById('mBox').innerHTML=h;
 document.getElementById('modal').style.display='flex';
}

async function delNum(num){
 if(!confirm('Disconnect '+num+'?')) return;
 await fetch('/disconnect?number='+num);
 viewPaired(); loadCount();
}

function showInfo(t){
 let b=document.getElementById('mBox');
 if(t=='owner') b.innerHTML='<h3>👤 About Owner</h3><br><b>STORM CYBER TECH</b><br><br>📞 256766233041<br>📞 256766233041<br><br><a href=https://wa.me/256766233041 style=color:#00ffff>Chat Owner</a><br><br>Lead Developer of STORM CYBER MD';
 else if(t=='about') b.innerHTML='<h3>ℹ️ About Storm</h3><br>⚡ STORM CYBER MD is a powerful multi-device WhatsApp bot with 300+ features.<br><br>✅ Fast pairing<br>✅ Session saver<br>✅ Auto view status<br>✅ Group control<br>✅ Owner: 256766233041<br><br><img src=https://files.catbox.moe/0bb8x1.jpg style=width:100%;border-radius:12px;margin-top:10px>';
 else if(t=='count'){ b.innerHTML='<h3>📊 Numbers</h3><br>Total paired: '+document.getElementById('cnt').innerText; }
 else if(t=='fun') b.innerHTML='<h3>😜 For Fun</h3><br>Pair now and enjoy Storm features!';
 document.getElementById('modal').style.display='flex';
}

async function loadCount(){ let r=await fetch('/paired'); let d=await r.json(); document.getElementById('cnt').innerText=d.length; }
loadCount();
</script>
</body></html>
 `);
});

app.get('/pair', async(req,res)=>{
 let num = req.query.number?.replace(/[^0-9]/g,'');
 if(!num) return res.json({error:'No number'});
 let dir = './sessions/'+num;
 if(fs.existsSync(dir)) fs.rmSync(dir,{recursive:true,force:true});
 fs.mkdirSync(dir,{recursive:true});
 let { state, saveCreds } = await useMultiFileAuthState(dir);
 let sock = makeWASocket({
  logger: pino({level:'silent'}),
  auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, {}) },
  printQRInTerminal:false,
  browser:["STORM CYBER MD","Chrome","1.0"]
 });
 sessions[num]=sock;
 sock.ev.on('creds.update', saveCreds);

 if(!sock.authState.creds.registered){
  await delay(2000);
  try{
   let code = await sock.requestPairingCode(num);
   res.json({code});
   // when connected, generate session
   sock.ev.on('connection.update', async(u)=>{
    if(u.connection==='open'){
     await delay(3000);
     // create session id base64
     let creds = fs.readFileSync(path.join(dir,'creds.json'));
     let sess = Buffer.from(creds).toString('base64');
     store[num]=sess;
     let paired = getPaired();
     if(!paired.find(p=>p.number===num)){
      paired.push({number:num, date:new Date(), session:sess});
      savePaired(paired);
     }
    }
   });
  }catch(e){ res.json({error:'Failed: '+e.message}); }
 } else res.json({error:'Already paired'});
});

app.get('/session', (req,res)=>{
 let num=req.query.number?.replace(/[^0-9]/g,'');
 if(store[num]) return res.json({session:store[num]});
 let paired=getPaired().find(p=>p.number===num);
 if(paired?.session) return res.json({session:paired.session});
 res.json({session:null});
});

app.get('/paired', (req,res)=> res.json(getPaired()));

app.get('/disconnect', async(req,res)=>{
 let num=req.query.number?.replace(/[^0-9]/g,'');
 if(sessions[num]){ try{ await sessions[num].logout(); }catch{} delete sessions[num]; }
 delete store[num];
 savePaired(getPaired().filter(p=>p.number!==num));
 let dir='./sessions/'+num;
 if(fs.existsSync(dir)) fs.rmSync(dir,{recursive:true,force:true});
 res.json({ok:true});
});

app.listen(PORT, ()=> console.log('STORM running on '+PORT));
