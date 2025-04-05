import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import CFonts from 'cfonts'
import path from 'path'
import express from 'express'

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const unhandledRejections = new Map()

process.on('unhandledRejection', (reason, promise) => {
	unhandledRejections.set(promise, reason)
	console.log('Unhandled Rejection at:', promise, 'reason:', reason)
})

process.on('rejectionHandled', (promise) => {
	unhandledRejections.delete(promise)
})

process.on('uncaughtException', (err) => {
    console.log('Caught exception: ', err)
})

const start = async() => {
    let args = [path.join(__dirname, './client.js'), ...process.argv.slice(2)];
    
    let p = spawn(process.argv[0], args, {
        stdio: ['inherit', 'inherit', 'inherit', 'ipc']
    })
    .on('message', data => {
        if (data === 'reset') {
            p.kill()
        }
    })
    .on('exit', () => {
        start()
    })
}

const siteCheck = async() => {
    const app = express()
    const port = 2525

    app.get('/', (req, res) => {
        res.status(200).json({ status: 'OK' })
    })

    app.use((req, res) => {
        res.status(404).json({ error: 'Not Found' })
    })

    app.listen(port, () => {
        CFonts.say('selfbot', {
            font: 'tiny',
            align: 'center',
            colors: ['system']
        }),
        CFonts.say('Github : https://github.com/zeyndvp/selfbot', {
            font: 'console',
            align: 'center',
            colors: ['system']
        })

        console.log('Server is running on port ' + port)
    })
}

start().catch(async() => {
    await delay(5000)
    start()
})
siteCheck().catch(async() => {
    await delay(5000)
    siteCheck()
})