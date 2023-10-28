const { SlashCommandBuilder } = require('@discordjs/builders');
const { Formatters } = require('discord.js');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('checkstats')
		.setDescription('See a users stats!')
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
		const tag = await Tags.findAll({where:{uid: uid}});
		
		if(tag.length != 0){
			//if puzzles are found
			let totalScore = 0;
			let totalGuesses = 0;
			let averageScore = 0;
			let averageGuesses = 0;
			let totalPuzzles = tag.length;

			for(let i=0;i<tag.length;i++){
				totalScore += tag[i].score
				totalGuesses += tag[i].guesses
			}
			averageScore = totalScore/totalPuzzles
			averageGuesses = totalGuesses/totalPuzzles

			averageScore = averageScore.toFixed(2);
			averageGuesses = averageGuesses.toFixed(2);

			return interaction.reply({content:Formatters.codeBlock(`Results for Connections Stats\nTotal Puzzles: ${totalPuzzles}\nTotal Score: ${totalScore}\nAverage Score: ${averageScore}\nAverage Guesses: ${averageGuesses}`),ephemeral:true});
		}
		return interaction.reply({content:`Could not find any Connections for that user!`,ephemeral:true});
	},
};