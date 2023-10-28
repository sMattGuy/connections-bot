const { SlashCommandBuilder } = require('@discordjs/builders');
const { Formatters } = require('discord.js');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('removescore')
		.setDescription('ADMIN ONLY removes a users score for the day')
		.addUserOption(option =>
			option
				.setName('userid')
				.setDescription('The user to modify')
				.setRequired(true))
		.addStringOption(option =>
			option
				.setName('puzzleid')
				.setDescription('The ID of the puzzle to remove')
				.setRequired(true)),
	async execute(interaction, Tags) {
		if(interaction.user.id != interaction.guild.ownerId){
			return interaction.reply({content:`You do not have permission to use that command!`,ephemeral:true});
		}
		let uid = interaction.options.getUser('userid').id;
		let pid = interaction.options.getString('puzzleid');
		
		const rowcount = await Tags.destroy({where:{uid: uid, pid: pid}});
		
		if(!rowcount)
			return interaction.reply({content:`Could not find that puzzle for that user!`,ephemeral:true});
		return interaction.reply({content:`Deleted puzzle ${pid} (${rowcount} row removed)!`,ephemeral:true});
	},
};