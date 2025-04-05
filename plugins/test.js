export default {
	name: "Testing",
	command: ["test", "testing"],
	models: "%prefix%command",
	run: async(m, { client }) => {
		try {
			await m.reply(`Halo ${m.pushName} aya naon? :D`);
		} catch (err) {
			console.error("❌ Error di plugin test:", err);
		}
	}
}