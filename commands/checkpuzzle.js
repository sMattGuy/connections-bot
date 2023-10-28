const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('checkpuzzle')
		.setDescription('See a users puzzle results!')
		.addStringOption(option => 
			option
				.setName('puzzleid')
				.setDescription('The ID of the Connections Puzzle')
				.setRequired(true))
		.addUserOption(option =>
			option
				.setName('userid')
				.setDescription('The user to check (leave blank for yourself)')
				.setRequired(false)),
	async execute(interaction, Tags) {
		let uid = interaction.options.getUser('userid');
		if(uid == null){
			uid = interaction.user.id
		}
		else{
			uid = uid.id;
		}
		const pid = interaction.options.getString('puzzleid');
		
		const tag = await Tags.findOne({where:{uid: uid, pid: pid}});
		
		if(tag){
			//if puzzle is found
			return interaction.reply({content:`Results for Connections ${pid}\n${tag.desc}`,ephemeral:true});
		}
		return interaction.reply({content:`Could not find Connections ${pid} for that user!`,ephemeral:true});
	},
};