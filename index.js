import express from 'express'
import cors from 'cors'

const PORT = process.env.PORT || 10000
const RAILWAY_URL = (process.env.RAILWAY_URL || 'https://storm-cyber-md-production.up.railway.app').replace(/\/$/, '')
const RAILWAY_API_KEY = process.env.RAILWAY_API_KEY || process.env.RENDER_API_KEY || 'CHANGE_THIS_SECRET'

const app = express()
app.use(cors())
app.use(express.json())

async function requestRailwayCode(number){
  if(!RAILWAY_URL || !RAILWAY_API_KEY) throw new Error("API config missing")
  const url = new URL("/api/request-code", RAILWAY_URL)
  url.searchParams.set("number", number)
  const res = await fetch(url, {
    method: "GET",
    headers: { "x-api-key": RAILWAY_API_KEY },
    signal: AbortSignal.timeout(25000)
  })
  const data = await res.json().catch(()=>({}))
  if(!res.ok) throw new Error(data.error || `Railway ${res.status}`)
  return data
}

app.get('/api/pair', async (req,res)=>{
  let number = (req.query.number||'').replace(/[^0-9]/g,'')
  if(!number || number.length<10) return res.status(400).json({success:false, error:'Invalid number'})
  try{
    console.log(`[RENDER] Requesting Railway for ${number}`)
    const data = await requestRailwayCode(number)
    return res.json({success:true, code: data.code || data.pairingCode, number, server:'railway'})
  }catch(e){
    console.log('Railway fail:', e.message)
    return res.status(503).json({success:false, error:'ALL SERVERS ARE CURRENTLY DOWN. WAIT TILL ONLINE. ('+e.message+')'})
  }
})

app.get('/api/stats', async (req,res)=>{
  try{
    const r = await fetch(`${RAILWAY_URL}/api/stats`, {headers:{"x-api-key":RAILWAY_API_KEY}, signal:AbortSignal.timeout(5000)})
    const data = await r.json()
    res.json({...data, renderOnline:true, railwayOnline:true})
  }catch{
    res.json({paired:0, connected:0, disconnected:0, renderOnline:true, railwayOnline:false})
  }
})

app.get('/api/health', (req,res)=> res.json({online:true, server:'render', railway:RAILWAY_URL}))

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>STORM X TECH - MULTI DEVICE WHATSAPP BOT</title>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;800&family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
<style>
:root{--obsidian:#06070a;--crimson:#dc143c;--crimson2:#8b0000;--silver:#c0c0c0;--silver2:#e8e8e8;--green:#1eff8f;}
*{margin:0;padding:0;box-sizing:border-box;font-family:'Outfit',sans-serif}
body{background:#06070a;color:#fff;min-height:100vh;overflow-x:hidden;position:relative}
body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse at 20% 10%, rgba(220,20,60,0.18), transparent 50%),radial-gradient(ellipse at 80% 90%, rgba(192,192,192,0.08), transparent 50%),radial-gradient(ellipse at 50% 50%, rgba(139,0,0,0.12), transparent 70%);animation:bgMove 12s ease-in-out infinite alternate;z-index:-2}
body::after{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);background-size:40px 40px;z-index:-1;opacity:0.5}
@keyframes bgMove{0%{transform:scale(1)}100%{transform:scale(1.1) translateY(-10px)}}
.topbar{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;position:sticky;top:0;z-index:10;background:rgba(6,7,10,0.7);backdrop-filter:blur(12px);border-bottom:1px solid rgba(220,20,60,0.15)}
.menuBtn{width:42px;height:42px;border-radius:12px;background:rgba(255,255,255,0.06);border:1px solid rgba(192,192,192,0.15);display:flex;align-items:center;justify-content:center;cursor:pointer}
.logoTitle{font-weight:800;letter-spacing:1px;display:flex;align-items:center;gap:8px}
.logoTitle img{width:26px;height:26px;border-radius:8px}
.dot{width:8px;height:8px;background:var(--green);border-radius:50%;box-shadow:0 0 12px var(--green);animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
.container{max-width:420px;margin:0 auto;padding:18px}
.mainCard{background:linear-gradient(180deg, rgba(18,20,26,0.9), rgba(10,11,15,0.9));border:1px solid rgba(192,192,192,0.12);border-radius:24px;padding:22px;position:relative;overflow:hidden}
.mainCard::before{content:'';position:absolute;inset:-1px;border-radius:24px;padding:1px;background:linear-gradient(90deg, var(--crimson), var(--silver), var(--crimson), var(--silver));background-size:300% 300%;animation:borderMove 4s linear infinite;-webkit-mask:linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none}
@keyframes borderMove{0%{background-position:0% 50%}100%{background-position:300% 50%}}
.logoWrap{width:96px;height:96px;margin:10px auto 14px;position:relative;display:flex;align-items:center;justify-content:center;border-radius:26px;background:radial-gradient(circle, rgba(220,20,60,0.25), transparent);box-shadow:0 0 0 2px rgba(220,20,60,0.4), 0 0 30px rgba(220,20,60,0.5), inset 0 0 20px rgba(0,0,0,0.6);animation:logoGlow 3s ease-in-out infinite}
.logoWrap img{width:86px;height:86px;border-radius:22px;object-fit:cover}
@keyframes logoGlow{0%,100%{box-shadow:0 0 0 2px rgba(220,20,60,0.4),0 0 30px rgba(220,20,60,0.5)}50%{box-shadow:0 0 0 2px rgba(192,192,192,0.6),0 0 45px rgba(220,20,60,0.8)}}
.title{font-size:28px;font-weight:800;text-align:center;letter-spacing:1px;background:linear-gradient(90deg, #fff, var(--silver), var(--crimson), #fff);background-size:200%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:textShine 5s linear infinite}
@keyframes textShine{0%{background-position:0%}100%{background-position:200%}}
.sub{font-size:11px;letter-spacing:3px;text-align:center;color:rgba(255,255,255,0.5);margin-top:4px}
.badge{margin:14px auto;display:flex;justify-content:center}
.badge span{background:rgba(30,255,143,0.1);border:1px solid rgba(30,255,143,0.25);color:#7dffb8;padding:6px 14px;border-radius:20px;font-size:12px;display:flex;align-items:center;gap:6px}
.badge span i{width:8px;height:8px;background:#1eff8f;border-radius:50%;display:inline-block;animation:pulse 1.5s infinite}
.formBox{margin-top:20px}
.label{font-size:11px;letter-spacing:2px;color:rgba(255,255,255,0.45);margin:16px 0 8px}
.selectBox,.inputRow{display:flex;gap:10px}
.selectBox{position:relative;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:12px 14px;cursor:pointer;align-items:center;justify-content:space-between}
.countryFlag{width:22px}
.plusBox{width:56px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:14px;display:flex;align-items:center;justify-content:center;font-weight:700}
.numInput{flex:1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:12px 14px;color:#fff;outline:none;font-size:16px;letter-spacing:2px}
.connectBtn{width:100%;margin-top:16px;padding:14px;border-radius:14px;border:none;background:linear-gradient(90deg, #0f8a4a, #1446a3, #dc143c);background-size:200% 100%;color:#fff;font-weight:700;letter-spacing:1px;cursor:pointer;position:relative;overflow:hidden;animation:btnMove 3s linear infinite;transition:0.3s}
.connectBtn::after{content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);animation:shine 2.5s infinite}
@keyframes btnMove{0%{background-position:0%}100%{background-position:200%}}
@keyframes shine{0%{left:-100%}100%{left:100%}}
.connectBtn:disabled{opacity:0.5}
.codeBox{display:none;margin-top:18px;text-align:center;background:rgba(0,0,0,0.4);border:1px solid rgba(220,20,60,0.2);border-radius:18px;padding:18px}
.codeTxt{font-family:'JetBrains Mono',monospace;font-size:32px;font-weight:800;letter-spacing:4px;color:#7dffb8;text-shadow:0 0 18px rgba(125,255,184,0.6);margin:12px 0}
.copyBtn{width:100%;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.06);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px}
.cancelBtn{width:100%;margin-top:12px;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.04);color:#fff;cursor:pointer}
.warn{margin-top:10px;padding:10px;border-radius:10px;font-size:13px;display:none}
.warn.down{background:rgba(220,20,60,0.15);border:1px solid rgba(220,20,60,0.4);color:#ff9aa8}
.warn.trying{background:rgba(192,192,192,0.1);border:1px solid rgba(192,192,192,0.3);color:#e0e0e0;display:flex;align-items:center;gap:8px;justify-content:center}
.spinner{width:16px;height:16px;border:2px solid rgba(255,255,255,0.2);border-top:2px solid #fff;border-radius:50%;animation:spin 0.8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.sheet{position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(6px);z-index:50;display:none;align-items:flex-end}
.sheet.active{display:flex}
.sheetBox{width:100%;max-width:480px;margin:0 auto;background:#101116;border-top:1px solid rgba(220,20,60,0.2);border-radius:24px 24px 0 0;padding:18px;max-height:85vh;overflow:auto;animation:slideUp 0.35s ease}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
.sheetHead{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.xBtn{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.06);border:none;color:#fff;cursor:pointer;font-size:18px}
.countryItem{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:10px;cursor:pointer}
.countryItem:hover{background:rgba(255,255,255,0.06)}
.searchInp{width:100%;padding:12px;border-radius:12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);color:#fff;outline:none;margin-bottom:10px}
.menuItem{padding:14px 12px;border-radius:12px;background:rgba(255,255,255,0.04);margin-bottom:8px;cursor:pointer;display:flex;justify-content:space-between;align-items:center}
.menuItem:hover{background:rgba(220,20,60,0.12)}
.page{position:fixed;inset:0;background:#06070a;z-index:60;overflow:auto;display:none;padding:0}
.page.active{display:block}
.aboutWrap{max-width:760px;margin:0 auto;padding:18px}
.heroTitle{font-size:42px;font-weight:800;line-height:0.9;margin:12px 0}
.heroTitle span{background:linear-gradient(90deg, var(--crimson), var(--silver));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.card2{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:16px;margin:14px 0}
.tag{display:inline-block;padding:4px 10px;border-radius:20px;background:rgba(220,20,60,0.15);border:1px solid rgba(220,20,60,0.3);font-size:11px;margin:4px}
</style>
</head>
<body>
<div class="topbar">
  <div class="menuBtn" onclick="openMenu()">☰</div>
  <div class="logoTitle"><img src="https://files.catbox.moe/pznw3z.jpg"> STORM X TECH</div>
  <div style="width:42px"></div>
</div>
<div class="container">
  <div class="mainCard" id="mainCard">
    <div class="logoWrap"><img src="https://files.catbox.moe/pznw3z.jpg"></div>
    <div class="title">STORM X TECH</div>
    <div class="sub">MULTI DEVICE WHATSAPP BOT</div>
    <div class="badge"><span><i></i><b id="connCount">0</b>&nbsp;connected</span></div>
    <div id="formArea">
      <div class="label">COUNTRY</div>
      <div class="selectBox" onclick="openCountry()"><span id="selCountry">— Select country —</span><span>▼</span></div>
      <div class="label">WHATSAPP NUMBER</div>
      <div class="inputRow"><div class="plusBox" id="plusBox">+</div><input class="numInput" id="waNumber" placeholder="XXXX" type="tel"></div>
      <button class="connectBtn" id="connectBtn" onclick="connectWA()">Connect WhatsApp</button>
      <div class="warn trying" id="tryingBox" style="display:none"><div class="spinner"></div> TRYING RAILWAY SERVER</div>
      <div class="warn down" id="downBox"></div>
    </div>
    <div class="codeBox" id="codeBox">
      <div class="label">YOUR PAIRING CODE</div>
      <div class="codeTxt" id="codeTxt">---- ----</div>
      <button class="copyBtn" onclick="copyCode()">⎙ Copy Code</button>
      <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:10px">Open WhatsApp → Linked Devices → Link with phone number, then enter this code.</div>
      <button class="cancelBtn" onclick="showCancelConfirm()">Cancel</button>
      <div id="cancelConfirm" style="display:none;margin-top:12px">
        <div style="font-size:13px;color:rgba(255,255,255,0.6)">Cancel this pairing request?</div>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="copyBtn" style="background:#7dffb8;color:#000" onclick="yesCancel()">Yes, cancel</button>
          <button class="cancelBtn" style="margin:0" onclick="keepWaiting()">Keep waiting</button>
        </div>
      </div>
    </div>
  </div>
</div>
<div class="sheet" id="menuSheet" onclick="closeMenu(event)"><div class="sheetBox" onclick="event.stopPropagation()"><div class="sheetHead"><b>Menu</b><button class="xBtn" onclick="closeMenu()">✕</button></div><div class="menuItem" onclick="openMyPaired()">My Paired Numbers <span>›</span></div><div class="menuItem" onclick="openNumbers()">Numbers <span>›</span></div><div class="menuItem" onclick="openAbout()">About Owner <span>›</span></div><div class="menuItem" onclick="openAboutBot()">About Storm Bot <span>›</span></div><div class="menuItem" onclick="location.reload()">Back To Home <span>›</span></div></div></div>
<div class="sheet" id="countrySheet" onclick="closeCountry(event)"><div class="sheetBox" onclick="event.stopPropagation()"><div class="sheetHead"><b>Select country</b><button class="xBtn" onclick="closeCountry()">✕</button></div><input class="searchInp" id="countrySearch" placeholder="Search country..." oninput="filterCountries()"><div id="countryList" style="max-height:50vh;overflow:auto"></div></div></div>
<div class="sheet" id="numbersSheet" onclick="this.classList.remove('active')"><div class="sheetBox" onclick="event.stopPropagation()"><div class="sheetHead"><b>Numbers</b><button class="xBtn" onclick="document.getElementById('numbersSheet').classList.remove('active')">✕</button></div><div id="statsBox" class="card2">Loading...</div></div></div>
<div class="sheet" id="pairedSheet" onclick="this.classList.remove('active')"><div class="sheetBox" onclick="event.stopPropagation()"><div class="sheetHead"><b>My Paired Numbers</b><button class="xBtn" onclick="document.getElementById('pairedSheet').classList.remove('active')">✕</button></div><div id="myPairedList"></div></div></div>
<div class="page" id="aboutPage"><div class="topbar"><div class="menuBtn" onclick="closeAbout()">‹</div><div class="logoTitle">ABOUT OWNER</div><div style="width:42px"></div></div><div class="aboutWrap"><div style="display:flex;gap:12px;align-items:center;margin:12px 0"><img src="https://files.catbox.moe/pznw3z.jpg" style="width:56px;height:56px;border-radius:14px"><div><div style="display:flex;gap:8px"><span style="background:#15171c;padding:4px 10px;border-radius:20px;font-size:12px">🇺🇬 Uganda</span><span style="background:rgba(30,255,143,0.15);padding:4px 10px;border-radius:20px;font-size:12px;color:#7dffb8">● Available for new projects</span></div><div style="font-size:12px;color:rgba(255,255,255,0.5);margin-top:4px" id="aboutTime"></div></div></div><div class="heroTitle">STORM X<br><span>Febras</span></div><div style="height:4px;width:80px;background:linear-gradient(90deg, var(--crimson), var(--silver));border-radius:4px;margin:10px 0"></div><div style="color:rgba(255,255,255,0.6);font-size:14px;line-height:1.6">WhatsApp bot developer • Founder, CYBER NOCTURN SYSTEMS & TECHNOLOGIES</div><div class="card2" style="margin-top:18px"><p style="line-height:1.7;color:rgba(255,255,255,0.8)">My name is Febras, known as STORM X. From Uganda, born 2011, coding since mid-2026. Founder of CYBER NOCTURN.</p><p style="line-height:1.7;margin-top:12px;color:rgba(255,255,255,0.7)">Motto: <b>BEYOND THE VISIBLE, CHANGING THE WORLDS TECHNOLOGIES</b></p></div></div></div>
<div class="page" id="aboutBotPage"><div class="topbar"><div class="menuBtn" onclick="document.getElementById('aboutBotPage').classList.remove('active')">‹</div><div class="logoTitle">ABOUT STORM</div><div style="width:42px"></div></div><div class="aboutWrap"><div class="card2"><h2>STORM CYBER MD</h2><p style="margin-top:8px;color:rgba(255,255,255,0.7)">Created by STORM X. Fast, secure, stable & unstoppable. V3 Stable.</p></div></div></div>
<script>
const countries=[{code:"93",name:"Afghanistan",flag:"🇦🇫"},{code:"355",name:"Albania",flag:"🇦🇱"},{code:"213",name:"Algeria",flag:"🇩🇿"},{code:"376",name:"Andorra",flag:"🇦🇩"},{code:"244",name:"Angola",flag:"🇦🇴"},{code:"54",name:"Argentina",flag:"🇦🇷"},{code:"374",name:"Armenia",flag:"🇦🇲"},{code:"61",name:"Australia",flag:"🇦🇺"},{code:"43",name:"Austria",flag:"🇦🇹"},{code:"994",name:"Azerbaijan",flag:"🇦🇿"},{code:"973",name:"Bahrain",flag:"🇧🇭"},{code:"880",name:"Bangladesh",flag:"🇧🇩"},{code:"375",name:"Belarus",flag:"🇧🇾"},{code:"32",name:"Belgium",flag:"🇧🇪"},{code:"501",name:"Belize",flag:"🇧🇿"},{code:"229",name:"Benin",flag:"🇧🇯"},{code:"975",name:"Bhutan",flag:"🇧🇹"},{code:"591",name:"Bolivia",flag:"🇧🇴"},{code:"387",name:"Bosnia",flag:"🇧🇦"},{code:"267",name:"Botswana",flag:"🇧🇼"},{code:"55",name:"Brazil",flag:"🇧🇷"},{code:"673",name:"Brunei",flag:"🇧🇳"},{code:"359",name:"Bulgaria",flag:"🇧🇬"},{code:"226",name:"Burkina Faso",flag:"🇧🇫"},{code:"257",name:"Burundi",flag:"🇧🇮"},{code:"855",name:"Cambodia",flag:"🇰🇭"},{code:"237",name:"Cameroon",flag:"🇨🇲"},{code:"1",name:"Canada",flag:"🇨🇦"},{code:"238",name:"Cape Verde",flag:"🇨🇻"},{code:"236",name:"Central African Republic",flag:"🇨🇫"},{code:"235",name:"Chad",flag:"🇹🇩"},{code:"56",name:"Chile",flag:"🇨🇱"},{code:"86",name:"China",flag:"🇨🇳"},{code:"57",name:"Colombia",flag:"🇨🇴"},{code:"269",name:"Comoros",flag:"🇰🇲"},{code:"242",name:"Congo",flag:"🇨🇬"},{code:"506",name:"Costa Rica",flag:"🇨🇷"},{code:"385",name:"Croatia",flag:"🇭🇷"},{code:"53",name:"Cuba",flag:"🇨🇺"},{code:"357",name:"Cyprus",flag:"🇨🇾"},{code:"420",name:"Czech Republic",flag:"🇨🇿"},{code:"45",name:"Denmark",flag:"🇩🇰"},{code:"253",name:"Djibouti",flag:"🇩🇯"},{code:"593",name:"Ecuador",flag:"🇪🇨"},{code:"20",name:"Egypt",flag:"🇪🇬"},{code:"503",name:"El Salvador",flag:"🇸🇻"},{code:"240",name:"Equatorial Guinea",flag:"🇬🇶"},{code:"291",name:"Eritrea",flag:"🇪🇷"},{code:"372",name:"Estonia",flag:"🇪🇪"},{code:"251",name:"Ethiopia",flag:"🇪🇹"},{code:"679",name:"Fiji",flag:"🇫🇯"},{code:"358",name:"Finland",flag:"🇫🇮"},{code:"33",name:"France",flag:"🇫🇷"},{code:"241",name:"Gabon",flag:"🇬🇦"},{code:"220",name:"Gambia",flag:"🇬🇲"},{code:"995",name:"Georgia",flag:"🇬🇪"},{code:"49",name:"Germany",flag:"🇩🇪"},{code:"233",name:"Ghana",flag:"🇬🇭"},{code:"30",name:"Greece",flag:"🇬🇷"},{code:"502",name:"Guatemala",flag:"🇬🇹"},{code:"224",name:"Guinea",flag:"🇬🇳"},{code:"592",name:"Guyana",flag:"🇬🇾"},{code:"509",name:"Haiti",flag:"🇭🇹"},{code:"504",name:"Honduras",flag:"🇭🇳"},{code:"36",name:"Hungary",flag:"🇭🇺"},{code:"354",name:"Iceland",flag:"🇮🇸"},{code:"91",name:"India",flag:"🇮🇳"},{code:"62",name:"Indonesia",flag:"🇮🇩"},{code:"98",name:"Iran",flag:"🇮🇷"},{code:"964",name:"Iraq",flag:"🇮🇶"},{code:"353",name:"Ireland",flag:"🇮🇪"},{code:"972",name:"Israel",flag:"🇮🇱"},{code:"39",name:"Italy",flag:"🇮🇹"},{code:"81",name:"Japan",flag:"🇯🇵"},{code:"962",name:"Jordan",flag:"🇯🇴"},{code:"7",name:"Kazakhstan",flag:"🇰🇿"},{code:"254",name:"Kenya",flag:"🇰🇪"},{code:"82",name:"Korea South",flag:"🇰🇷"},{code:"965",name:"Kuwait",flag:"🇰🇼"},{code:"996",name:"Kyrgyzstan",flag:"🇰🇬"},{code:"856",name:"Laos",flag:"🇱🇦"},{code:"371",name:"Latvia",flag:"🇱🇻"},{code:"961",name:"Lebanon",flag:"🇱🇧"},{code:"266",name:"Lesotho",flag:"🇱🇸"},{code:"231",name:"Liberia",flag:"🇱🇷"},{code:"218",name:"Libya",flag:"🇱🇾"},{code:"370",name:"Lithuania",flag:"🇱🇹"},{code:"352",name:"Luxembourg",flag:"🇱🇺"},{code:"261",name:"Madagascar",flag:"🇲🇬"},{code:"265",name:"Malawi",flag:"🇲🇼"},{code:"60",name:"Malaysia",flag:"🇲🇾"},{code:"960",name:"Maldives",flag:"🇲🇻"},{code:"223",name:"Mali",flag:"🇲🇱"},{code:"356",name:"Malta",flag:"🇲🇹"},{code:"222",name:"Mauritania",flag:"🇲🇷"},{code:"230",name:"Mauritius",flag:"🇲🇺"},{code:"52",name:"Mexico",flag:"🇲🇽"},{code:"373",name:"Moldova",flag:"🇲🇩"},{code:"377",name:"Monaco",flag:"🇲🇨"},{code:"976",name:"Mongolia",flag:"🇲🇳"},{code:"382",name:"Montenegro",flag:"🇲🇪"},{code:"212",name:"Morocco",flag:"🇲🇦"},{code:"258",name:"Mozambique",flag:"🇲🇿"},{code:"95",name:"Myanmar",flag:"🇲🇲"},{code:"264",name:"Namibia",flag:"🇳🇦"},{code:"977",name:"Nepal",flag:"🇳🇵"},{code:"31",name:"Netherlands",flag:"🇳🇱"},{code:"64",name:"New Zealand",flag:"🇳🇿"},{code:"505",name:"Nicaragua",flag:"🇳🇮"},{code:"227",name:"Niger",flag:"🇳🇪"},{code:"234",name:"Nigeria",flag:"🇳🇬"},{code:"47",name:"Norway",flag:"🇳🇴"},{code:"968",name:"Oman",flag:"🇴🇲"},{code:"92",name:"Pakistan",flag:"🇵🇰"},{code:"970",name:"Palestine",flag:"🇵🇸"},{code:"507",name:"Panama",flag:"🇵🇦"},{code:"595",name:"Paraguay",flag:"🇵🇾"},{code:"51",name:"Peru",flag:"🇵🇪"},{code:"63",name:"Philippines",flag:"🇵🇭"},{code:"48",name:"Poland",flag:"🇵🇱"},{code:"351",name:"Portugal",flag:"🇵🇹"},{code:"974",name:"Qatar",flag:"🇶🇦"},{code:"40",name:"Romania",flag:"🇷🇴"},{code:"7",name:"Russia",flag:"🇷🇺"},{code:"250",name:"Rwanda",flag:"🇷🇼"},{code:"966",name:"Saudi Arabia",flag:"🇸🇦"},{code:"221",name:"Senegal",flag:"🇸🇳"},{code:"381",name:"Serbia",flag:"🇷🇸"},{code:"65",name:"Singapore",flag:"🇸🇬"},{code:"421",name:"Slovakia",flag:"🇸🇰"},{code:"386",name:"Slovenia",flag:"🇸🇮"},{code:"252",name:"Somalia",flag:"🇸🇴"},{code:"27",name:"South Africa",flag:"🇿🇦"},{code:"34",name:"Spain",flag:"🇪🇸"},{code:"94",name:"Sri Lanka",flag:"🇱🇰"},{code:"249",name:"Sudan",flag:"🇸🇩"},{code:"46",name:"Sweden",flag:"🇸🇪"},{code:"41",name:"Switzerland",flag:"🇨🇭"},{code:"963",name:"Syria",flag:"🇸🇾"},{code:"886",name:"Taiwan",flag:"🇹🇼"},{code:"255",name:"Tanzania",flag:"🇹🇿"},{code:"66",name:"Thailand",flag:"🇹🇭"},{code:"228",name:"Togo",flag:"🇹🇬"},{code:"216",name:"Tunisia",flag:"🇹🇳"},{code:"90",name:"Turkey",flag:"🇹🇷"},{code:"256",name:"Uganda",flag:"🇺🇬"},{code:"380",name:"Ukraine",flag:"🇺🇦"},{code:"971",name:"United Arab Emirates",flag:"🇦🇪"},{code:"44",name:"United Kingdom",flag:"🇬🇧"},{code:"1",name:"United States",flag:"🇺🇸"},{code:"598",name:"Uruguay",flag:"🇺🇾"},{code:"998",name:"Uzbekistan",flag:"🇺🇿"},{code:"58",name:"Venezuela",flag:"🇻🇪"},{code:"84",name:"Vietnam",flag:"🇻🇳"},{code:"967",name:"Yemen",flag:"🇾🇪"},{code:"260",name:"Zambia",flag:"🇿🇲"},{code:"263",name:"Zimbabwe",flag:"🇿🇼"}];
let selectedCode=null, selectedCountry=null;
let myNumbers=JSON.parse(localStorage.getItem('storm_my_numbers')||'[]');
function renderCountries(list){const c=document.getElementById('countryList');c.innerHTML=list.map(x=>'<div class="countryItem" onclick="chooseCountry(\\''+x.code+'\\',\\''+x.name+'\\')"><span>'+x.flag+' '+x.name+'</span><span style="color:var(--silver)">+'+x.code+'</span></div>').join('');}
function openCountry(){document.getElementById('countrySheet').classList.add('active');renderCountries(countries);setTimeout(()=>document.getElementById('countrySearch').focus(),100)}
function closeCountry(e){if(!e||e.target.id==='countrySheet')document.getElementById('countrySheet').classList.remove('active')}
function filterCountries(){const q=document.getElementById('countrySearch').value.toLowerCase();renderCountries(countries.filter(c=>c.name.toLowerCase().includes(q)||c.code.includes(q)))}
function chooseCountry(code,name){selectedCode=code;selectedCountry=name;document.getElementById('selCountry').innerText=countries.find(c=>c.code===code).flag+' '+name+' +'+code;document.getElementById('plusBox').innerText='+'+code;closeCountry({target:{id:'countrySheet'}});}
async function connectWA(){
  const num=document.getElementById('waNumber').value.replace(/[^0-9]/g,'');
  if(!selectedCode){alert('Select country first');return}
  if(!num||num.length<7){alert('Enter valid number');return}
  const full=selectedCode+num;
  const btn=document.getElementById('connectBtn');
  btn.disabled=true;btn.innerText='Checking server...';
  document.getElementById('downBox').style.display='none';
  document.getElementById('tryingBox').style.display='flex';
  document.getElementById('tryingBox').innerHTML='<div class="spinner"></div> TRYING RAILWAY SERVER...';
  try{
    const res=await fetch('/api/pair?number='+full);
    const data=await res.json();
    document.getElementById('tryingBox').style.display='none';
    if(!data.success){
      document.getElementById('downBox').innerText=data.error||'ALL SERVERS ARE CURRENTLY DOWN. WAIT TILL ONLINE.';
      document.getElementById('downBox').style.display='block';
      btn.disabled=false;btn.innerText='Connect WhatsApp';
      return;
    }
    showCode(data.code, full);
  }catch(e){
    document.getElementById('tryingBox').style.display='none';
    document.getElementById('downBox').innerText='ALL SERVERS ARE CURRENTLY DOWN. WAIT TILL ONLINE.';
    document.getElementById('downBox').style.display='block';
  }
  btn.disabled=false;btn.innerText='Connect WhatsApp';
}
function showCode(code, full){
  document.getElementById('formArea').style.display='none';
  document.getElementById('codeBox').style.display='block';
  document.getElementById('codeTxt').innerText=code;
  if(!myNumbers.includes(full)){myNumbers.push(full);localStorage.setItem('storm_my_numbers',JSON.stringify(myNumbers));}
}
function copyCode(){const t=document.getElementById('codeTxt').innerText;navigator.clipboard.writeText(t);alert('Copied: '+t)}
function showCancelConfirm(){document.getElementById('cancelConfirm').style.display='block'}
function yesCancel(){document.getElementById('codeBox').style.display='none';document.getElementById('formArea').style.display='block';document.getElementById('cancelConfirm').style.display='none'}
function keepWaiting(){document.getElementById('cancelConfirm').style.display='none'}
function openMenu(){document.getElementById('menuSheet').classList.add('active')}
function closeMenu(e){if(!e||e.target.id==='menuSheet')document.getElementById('menuSheet').classList.remove('active')}
function openNumbers(){
  closeMenu();document.getElementById('numbersSheet').classList.add('active');
  fetch('/api/stats').then(r=>r.json()).then(d=>{
    document.getElementById('statsBox').innerHTML='<div>PAIRED: '+(d.paired||0)+'</div><div>CONNECTED: '+(d.connected||0)+'</div><div>DISCONNECTED: '+(d.disconnected||0)+'</div><div style="margin-top:8px;color:rgba(255,255,255,0.5)">Railway Online: '+(d.railwayOnline?'Yes':'No')+'</div>';
  }).catch(()=>{document.getElementById('statsBox').innerText='Failed to load'});
}
function openMyPaired(){
  closeMenu();document.getElementById('pairedSheet').classList.add('active');
  const list=document.getElementById('myPairedList');
  if(myNumbers.length===0) list.innerHTML='<div style="color:rgba(255,255,255,0.5)">No paired numbers yet</div>';
  else list.innerHTML=myNumbers.map(n=>'<div class="menuItem"><span>+'+n+'</span><span>⏻</span></div>').join('');
}
function openAbout(){closeMenu();document.getElementById('aboutPage').classList.add('active')}
function closeAbout(){document.getElementById('aboutPage').classList.remove('active')}
function openAboutBot(){closeMenu();document.getElementById('aboutBotPage').classList.add('active')}
fetch('/api/stats').then(r=>r.json()).then(d=>{document.getElementById('connCount').innerText=d.connected||d.paired||0}).catch(()=>{});
</script>
</body>
</html>`

app.get('/', (req,res)=> res.send(HTML))
app.listen(PORT, ()=> console.log(`✅ STORM X TECH on ${PORT} -> ${RAILWAY_URL}`))
