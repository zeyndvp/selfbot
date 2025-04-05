

import util from 'util'
import cp from 'child_process'

const { exec: _exec } = cp
const exec = util.promisify(_exec).bind(cp)

export default {
  command: ["=>", ">", "$"],
  run: async (m, { client, command, text }) => {
    if (!text) return

    if (command === "$") {
      let output
      try {
        output = await exec(text.trimEnd())
      } catch (error) {
        output = error
      } finally {
        const { stdout, stderr } = output
        if (stdout?.trim()) {
          return client.sendMessage(m.from, { text: stdout }, { quoted: m })
        }
        if (stderr?.trim()) {
          return client.sendMessage(m.from, { text: stderr }, { quoted: m })
        }
      }
    }

    const code = command === "=>"
      ? `(async () => { return ${text} })()`
      : `(async () => { ${text} })()`

    try {
      const result = await eval(code)

      if (Buffer.isBuffer(result)) {
        client.sendMessage(m.from, { image: result }, { quoted: m })
      } else if (typeof result === "string" && /^data:image\/[a-z]+base64,/.test(result)) {
        const base64Data = result.split(',')[1]
        const buffer = Buffer.from(base64Data, 'base64')
        client.sendMessage(m.from, { image: buffer }, { quoted: m })
      } else {
        client.sendMessage(m.from, { text: util.format(result) }, { quoted: m })
      }
    } catch (err) {
      client.sendMessage(m.from, { text: util.format(err) }, { quoted: m })
    }
  },
  noPrefix: true,
}