import baileys, { extractMessageContent } from 'baileys'

export function getContentType(a) {
    if (a) {
        const keys = Object.keys(a)
        const key = keys.find(k => (k === 'conversation' || k.endsWith('Message') || k.includes('V2') || k.includes('V3')) && k !== 'senderKeyDistributionMessage')
        return key ? key : keys[0]
    }
}

export function parseMessage(content) {
    content = extractMessageContent(content)

    if (content && content.viewOnceMessageV2Extension) {
        content = content.viewOnceMessageV2Extension.message
    }
    if (content && content.protocolMessage && content.protocolMessage.type == 14) {
        let type = getContentType(content.protocolMessage)
        content = content.protocolMessage[type]
    }
    if (content && content.message) {
        let type = getContentType(content.message)
        content = content.message[type]
    }

    return content
}

export async function msg(client, m) {
    m.id = m.key.id
    m.isBaileys = m.id.startsWith("BAE5")
    m.from = m.key.remoteJid
    m.isGroup = m.from.endsWith("@g.us")
    m.sender = m.key.fromMe ? client.decodeJid(client.user.id) : (m.key.participant || m.from)

    let admins = await client.getAdmins(m.from)
    m.isAdmin = admins.includes(m.sender)
    m.isBotAdmin = admins.includes(client.decodeJid(client.user.id))

    m.type = getContentType(m.message)
    m.msg = parseMessage(m.message[m.type])
    m.body = m.msg?.text || m.msg?.caption || m.message?.conversation || ""

    m.mentions = m.msg?.contextInfo?.mentionedJid || []
    m.expiration = m.msg?.contextInfo?.expiration || 0

    m.isMedia = !!m.msg?.mimetype || !!m.msg?.thumbnailDirectPath
    if (m.isMedia) {
        m.mime = m.msg?.mimetype
        m.size = m.msg?.fileLength
        m.height = m.msg?.height
        m.width = m.msg?.width
        if (/webp/i.test(m.mime)) {
            m.isAnimated = m.msg?.isAnimated
        }
    }

    m.isQuoted = !!m.msg?.contextInfo?.quotedMessage
    if (m.isQuoted) {
        let quoted = baileys.proto.WebMessageInfo.fromObject({
            key: {
                remoteJid: m.from,
                fromMe: (m.msg.contextInfo.participant === client.decodeJid(client.user.id)),
                id: m.msg.contextInfo.stanzaId,
                participant: m.isGroup ? m.msg.contextInfo.participant : undefined
            },
            message: m.msg.contextInfo.quotedMessage
        })
        m.quoted = await msg(client, quoted)
    }

    m.reply = async (text, options = {}) => {
        if (typeof text === "string") {
            return await client.sendMessage(m.from, { text, ...options }, { quoted: m, ephemeralExpiration: m.expiration, ...options })
        } else if (typeof text === "object") {
            return client.sendMessage(m.from, { ...text, ...options }, { quoted: m, ephemeralExpiration: m.expiration, ...options })
        }
    }    

    return m
}