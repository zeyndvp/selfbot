import chokidar from 'chokidar'
import pino from 'pino'
import path from 'path'
import fs from 'node:fs'
import chalk from 'chalk'
import { fileURLToPath, pathToFileURL } from 'url'
import NodeCache from 'node-cache'
import baileys from 'baileys'
import { handler } from './handler.js'
import { WAConnection } from './lib/baileys.js'

const logger = pino({ level: 'silent' }).child({ level: 'silent' })
const store = baileys.makeInMemoryStore({ logger })
const msgRetryCounterCache = new NodeCache()
const dirStories = './session/stories.json'
const dirContacts = './session/contacts.json'

global.__filename = fileURLToPath(import.meta.url)
global.__dirname = path.dirname(__filename)
global.env = JSON.parse(fs.readFileSync('./config.json', 'utf8'))

let plugins = {}
const loadPlugins = async() => {
    let stack = [path.join(__dirname, 'plugins')]
    while (stack.length) {
        let dir = stack.pop()
        for (let file of fs.readdirSync(dir)) {
            let fullPath = path.join(dir, file)
            fs.statSync(fullPath).isDirectory()
            ? stack.push(fullPath)
            : fullPath.endsWith('.js') && (plugins[fullPath] = (await import(pathToFileURL(fullPath).href + '?t=' + Date.now())).default)
        }
    }
}

const connect = async() => {
    const { state, saveCreds } = await baileys.useMultiFileAuthState('session')
    let client = await WAConnection({
        printQRInTerminal: env.pairing.state == 'true' ? 'true' : false,
        logger,
        auth: {
            creds: state.creds,
            keys: baileys.makeCacheableSignalKeyStore(state.keys, logger)
        },
        getMessage: async(key) => {
            if (store) {
                let msg = await store.loadMessage(key.remoteJid, key.id)
                return msg?.message || 'yeah'
            }
            return baileys.proto.Message.fromObject({})
        },
        generateHighQualityLinkPreview: true,
        version: [2, 3000, 1019430034],
        browser: ['Ubuntu', 'Firefox', '20.0.00'],
        msgRetryCounterCache,
        syncFullHistory: true,
        retryRequestDelayMs: 10,
        transactionOpts: {
            maxCommitRetries: 10,
            delayBetweenTriesMs: 10
        },
        maxMsgRetryCount: 15,
        appStateMacVerification: {
            patch: true,
            snapshot: true
        },
    })

    // Checking connection if use pairing
    if (env.pairing && env.pairing.state && !client.authState.creds.registered) {
        var phoneNumber = env.pairing.number
        setTimeout(async () => {
            try {
                let code = await client.requestPairingCode(phoneNumber)
                code = code.match(/.{1,4}/g)?.join("-") || code
                console.log(chalk.black(chalk.bgGreen(` Your Pairing Code `)), ' : ' + chalk.black(chalk.white(code)))
            } catch {}
        }, 3000)
    }

    client.ev.on('creds.update', saveCreds)
    client.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
        if (connection == 'close') {
            if (lastDisconnect?.error?.output?.statusCode !== 401) {
                connect()
            } else {
                console.log('Delete last session...')
                fs.rmSync('session', { recursive: true })
                connect()
            }
        } else if (connection == 'open') {
            await loadPlugins()
            console.log(chalk.green('[INFO] Success connect!'))
        }
    })

    // Load contact from file
    if (fs.existsSync(dirContacts)) {
        store.contacts = JSON.parse(fs.readFileSync(dirContacts, 'utf-8'))
    } else {
        fs.writeFileSync(dirContacts, JSON.stringify({}))
    }

    // Load story from file
    if (fs.existsSync(dirStories)) {
        client.story = JSON.parse(fs.readFileSync(dirStories, 'utf-8'))
    } else {
        client.story = []
        fs.writeFileSync(dirStories, JSON.stringify(client.story))
    }

    client.ev.on('contacts.update', update => {
        for (let contact of update) {
            let id = baileys.jidNormalizedUser(contact.id)
            if (store && store.contacts) {
                store.contacts[id] = { ...(store.contacts?.[id] || {}), ...(contact || {}) }
            }
        }
    })    

    client.ev.on('contacts.upsert', update => {
        for (let contact of update) {
            let id = baileys.jidNormalizedUser(contact.id)
            if (store && store.contacts) {
                store.contacts[id] = { ...(contact || {}), isContact: true }
            }
        }
    })

    client.ev.on('messages.upsert', async ({ type, messages }) => {
        if (type !== "notify") return
        for (let m of messages) {
            if (!m.message) continue
            m.message = m.message?.ephemeralMessage?.message || m.message
            if (store.groupMetadata && !Object.keys(store.groupMetadata).length) {
                store.groupMetadata = await client.groupFetchAllParticipating()
            }
            await handler(client, m, plugins, store)
        }
    })

    client.ev.on('call', async (calling) => {
        if (!env.anticall) return
        for (const call of calling) {
            await client.sendMessage(call.from, {
                text: "Mohon maaf saya saat ini sedang tidak bisa menjawab panggilan anda.",
                mentions: [call.from],
            })         
        }
    })

    // Send information crud in folders plugins
    chokidar.watch(path.join(__dirname, 'plugins')).on('change', async (file) => {
        console.info(chalk.green('[Info] File edited: ' + file))
        await loadPlugins()
    })

    // Auto delete story 
    setInterval(() => {
        const currentTime = Date.now()
        client.story = client.story.filter(v => (currentTime - v.created_at) <= 86400000)
    }, 10000)    

    // Save contact or status to files
    setInterval(async () => {
        if (store.contacts) fs.writeFileSync(dirContacts, JSON.stringify(store.contacts))
        if (client.story) fs.writeFileSync(dirStories, JSON.stringify(client.story))
    }, 10 * 1000)

    return client
}

connect()