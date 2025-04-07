export default {
    name: ['anticall', 'prefix', 'readsw', 'reactsw', 'readchat', 'autotyping', 'self', 'online'],
    command: ['anticall', 'prefix', 'readsw', 'reactsw', 'readchat', 'autotyping', 'self', 'online'],
    use: 'on/off',
    run: async(m, {
        client,
        env,
        command,
        text
    }) => {
        let state = Object.keys(env).filter(key => typeof env[key] === 'boolean')
        if (!text) {
            state.map(key => `- ${key} = ${env[key] ? '✅ ON' : '❌ OFF'}`).join('\n')
            return client.reply(m.chat, `🎛️ *Status Pengaturan Saat Ini*\n\nBerikut adalah daftar pengaturan kamu saat ini:\n\n${state}\n\nIngin mengubah salah satunya? Cukup kirim perintah seperti:\n\`prefix on\` atau \`autoread on\``, m)
        }

        if (!['on', 'off'].includes(text.toLowerCase())) return client.reply(m.chat, 'just input text on or off!', m)
        if(state[command] == (text.includes('on') ? true : false)) return client.reply(m.chat, state[command] + ' has been ' + state[command] == text.includes('on' ? true : false) ? 'activated previously.' : 'inactivated previously.', m)

        env[command] = text.includes('on') ? true : false
    }
}