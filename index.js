import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import makeWASocket, { useMultiFileAuthState, Browsers, makeCacheableSignalKeyStore, fetchLatestBaileysVersion } from '@whiskeysockets/baileys'
import pino from 'pino'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = process.env.PORT || 10000
const RAILWAY_URL = process.env.RAILWAY_URL || 'https://storm-cyber-md-production.up.railway.app'
const RENDER_API_KEY = process.env.RENDER_API_KEY || 'STORM_X_SECRET_2025'
const RAILWAY_API_KEY = process.env.RAILWAY_API_KEY || 'STORM_X_SECRET_2025'

const app = express()
app.use(cors())
app.use(express.json({limit: '50mb'}))
app.use(express.static(path.join(__dirname, 'public')))

const delay = (ms) => new Promise(r=>setTimeout(r,ms))

if(!fs.existsSync('./tmp')) fs.mkdirSync('./tmp',{recursive:true})

// GENERATE CODE ON RENDER (TEMP ONLY)
async function generateOnRender(number){
  const id = number.replace(/[^0-9]/g,'')
  const tmpPath = `./tmp/${id}`
  try{ fs.rmSync(tmpPath,{recursive:true,force:true}) }catch{}
  if(!fs.existsSync(tmpPath)) fs.mkdirSync(tmpPath,{recursive:true})

  const { state, saveCreds } = await useMultiFileAuthState(tmpPath)
  const { version } = await fetchLatestBaileysVersion()
  const sock = makeWASocket({
    version,
    logger: pino({level:'silent'}),
    auth:{ creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({level:'silent'})) },
    browser: Browsers.macOS('Safari'),
    printQRInTerminal:false
  })
  sock.ev.on('creds.update', saveCreds)
  await delay(2000)
  const code = await sock.requestPairingCode(id)
  await delay(1000)

  // read creds.json to upload to railway
  let credsData = {}
  try{
    const credsJson = JSON.parse(fs.readFileSync(`${tmpPath}/creds.json`))
    credsData = credsJson
  }catch(e){}

  // cleanup after 10 sec (temp only, real storage is railway)
  setTimeout(()=>{ try{ fs.rmSync(tmpPath,{recursive:true,force:true}) }catch{} }, 10000)

  return { code, creds: credsData, tmpPath }
}

// UPLOAD TO RAILWAY
async function uploadToRailway(number, creds){
  try{
    const res = await fetch(`${RAILWAY_URL}/api/upload-session`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        number,
        creds,
        key: RENDER_API_KEY
      })
    })
    const data = await res.json()
    return data.success
  }catch(e){
    console.log('Upload to railway failed:', e.message)
    return false
  }
}

// TRY RAILWAY GENERATE
async function generateViaRailway(number){
  try{
    const res = await fetch(`${RAILWAY_URL}/api/request-code?number=${number}&key=${RAILWAY_API_KEY}`, {
      signal: AbortSignal.timeout(20000)
    })
    const data = await res.json()
    if(data.success) return data.code
    throw new Error(data.error||'railway failed')
  }catch(e){
    throw e
  }
}

// MAIN API FOR WEBSITE + TELEGRAM
app.get('/api/pair', async (req,res)=>{
  let number = (req.query.number||'').replace(/[^0-9]/g,'')
  if(!number || number.length<10) return res.status(400).json({success:false, error:'Invalid number'})

  // 1. Try Render first
  try{
    console.log(`[RENDER] Trying to generate for ${number} on Render...`)
    const { code, creds } = await generateOnRender(number)
    console.log(`[RENDER] Code generated: ${code}`)

    // 2. Try upload to Railway
    const uploaded = await uploadToRailway(number, creds)

    if(!uploaded){
      // Railway is down but we have code
      return res.json({
        success: true,
        code,
        number,
        server: 'render',
        railwayDown: true,
        message: 'THIS CODE WONT WORK BECAUSE RAILWAY IS CURRENTLY DOWN'
      })
    }

    return res.json({
      success: true,
      code,
      number,
      server: 'render',
      railwayDown: false
    })

  }catch(err){
    console.log(`[RENDER] Render generate failed: ${err.message}`)
    // 3. Render failed, try Railway
    try{
      console.log(`[RAILWAY] Trying Railway for ${number}...`)
      const code = await generateViaRailway(number)
      return res.json({
        success: true,
        code,
        number,
        server: 'railway',
        railwayDown: false,
        fallback: true,
        message: 'TRYING RAILWAY SERVER'
      })
    }catch(e2){
      console.log(`[BOTH] Both servers down`)
      return res.status(503).json({
        success: false,
        error: 'ALL SERVERS ARE CURRENTLY DOWN. WAIT TILL ONLINE.',
        code: null
      })
    }
  }
})

// STATS - proxy from railway + render
app.get('/api/stats', async (req,res)=>{
  try{
    const r = await fetch(`${RAILWAY_URL}/api/stats`, {signal:AbortSignal.timeout(5000)})
    const data = await r.json()
    res.json({...data, renderOnline:true})
  }catch{
    res.json({paired:0, connected:0, disconnected:0, renderOnline:true, railwayOnline:false})
  }
})

app.get('/api/health', (req,res)=>{
  res.json({online:true, server:'render', railway: RAILWAY_URL})
})

app.get('/', (req,res)=>{
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

app.listen(PORT, ()=> console.log(`✅ STORM X TECH Pair Server running on ${PORT} | Railway: ${RAILWAY_URL}`))
