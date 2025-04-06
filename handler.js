import { msg } from "./lib/messageHandler.js"
import chalk from 'chalk'

export async function handler(client, m, plugins, store) {
    m = await msg(client, m)

    const prefixes = ["!", ".", "#", "/"]
    const hasPrefix = prefixes.some((p) => m.body.startsWith(p))
    
    const isCmd = global.env.prefix ? hasPrefix : true
    const prefix = hasPrefix ? prefixes.find((p) => m.body.startsWith(p)) || "" : ""

    const command = m.body
        .slice(prefix.length)
        .toLowerCase()
        .trim()
        .split(/\s+/)[0] || ""
        
    const args = m.body.trim().split(/\s+/).slice(1)
    const text = args.join(" ")

    if (global.env.autotyping) client.sendPresenceUpdate('composing', m.chat)
    if (!global.env.online) client.sendPresenceUpdate('unavailable', m.chat)
    if (global.env.online) client.sendPresenceUpdate('available', m.chat)
    if (global.env.readchat) client.readMessages([m.key])

    client.storyJid = client.storyJid || []
    client.story = client.story || []
    
    if (m.chat.endsWith('broadcast') && !client.storyJid.includes(m.sender) && m.sender !== client.decodeJid(client.user.id)) {
        client.storyJid.push(m.sender)
    }

    function getRandomEmoji() {
        const randomIndex = Math.floor(Math.random() * global.env.emoji.length)
        return global.env.emoji[randomIndex]
    }
    
    if (!(global.env.blacklist && global.env.blacklist.includes(m.sender.split('@')[0]))) {
        if (global.env.readsw && m.chat.endsWith('broadcast') && !/protocol/.test(m.type)) {
            await client.readMessages([m.key])
        }
    
        if (global.env.reactsw && m.chat.endsWith('broadcast') && [...new Set(client.storyJid)].includes(m.sender) && !/protocol/.test(m.type)) {
            await client.sendMessage('status@broadcast', {
                react: {
                    text: getRandomEmoji(),
                    key: m.key
                }
            }, {
                statusJidList: [m.key.participant]
            })
        }
    }    

    if (m.chat.endsWith('broadcast') && !/protocol/.test(m.type)) {
        client.story.push({
            jid: m.key.participant,
            msg: m,
            created_at: new Date() * 1
        })
    }    

    if (!m.chat.endsWith('newsletter') && !/protocol/.test(m.type)) {
        console.log(
            chalk.cyanBright(`\n┏━━━━━━━━━━━━━━━━━━[ MESSAGE LOG ]━━━━━━━━━━━━━━━━━━┓`) +
            `\n${chalk.cyanBright('┃')} ${chalk.bold.cyan('From     :')} ${chalk.white(m.pushName)} ${chalk.gray('<')} ${chalk.yellow(m.sender)} ${chalk.gray('>')}` +
            `\n${chalk.cyanBright('┃')} ${chalk.bold.cyan('Chat     :')} ${chalk.white(m.isGroup ? m.chat : 'Private Chat')}` +
            `\n${chalk.cyanBright('┃')} ${chalk.bold.cyan('Type     :')} ${chalk.cyanBright(m.type)}${m.isMedia ? chalk.gray(' (media)') : ''}` +
            `\n${chalk.cyanBright('┃')} ${chalk.bold.cyan('Command  :')} ${chalk.greenBright(m.body || 'No Body')}` +
            `\n${chalk.cyanBright('┃')} ${chalk.bold.cyan('Time     :')} ${chalk.redBright(new Date().toLocaleString())}` +
            `\n${chalk.cyanBright('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛')}\n`
        )
    }    

    if (global.env.self && !m.key.fromMe) return

    for (const name in plugins) {
        const cmd = plugins[name]
        const isCommand = cmd.command.includes(command)
    
        if ((cmd.noPrefix || isCmd) && isCommand) {
            if (cmd.owner && !m.key.fromMe) {
                m.reply('This feature only for owner!')
               continue
            }
            if (cmd.wait) await client.sendMessage(m.chat, { react: { text: '🕒', key: m.key }})
    
            cmd.run(m, {
                client,
                q: m.isQuoted ? m.quoted : m,
                plugins,
                command,
                env,
                store,
                text,
            })
        }
    }    
}
