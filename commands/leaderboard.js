const { SlashCommandBuilder } = require('@discordjs/builders');
const { Formatters } = require('discord.js');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('See the leaderboard!')
		.addStringOption(option => 
			option
				.setName('type')
				.setDescription('The type of leaderboard to see')
				.setRequired(true)
				.addChoice('Total Score', 'score')
				.addChoice('Average Score', 'averages')
				.addChoice('Average Guesses', 'averageg')
				.addChoice('Total Puzzles', 'puzzle'))
		.addStringOption(option =>
			option
				.setName('puzzleid')
				.setDescription('The puzzle ID')
				.setRequired(false)),
	async execute(interaction, Tags) {
		await interaction.reply({content:`Please Wait...`,ephemeral:true});
		const boardType = interaction.options.getString('type');
		const puzzleID = interaction.options.getString('puzzleid');
		
		let tag;
		if(puzzleID != null){
			tag = await Tags.findAll({attributes:['uid','score','guesses'], where:{pid:puzzleID}});
		}
		else{
			tag = await Tags.findAll({attributes:['uid','score','guesses']});
		}
		
		if(tag.length == 0){
			return interaction.editReply('There is no data for that puzzle!');
		}
		
		if(boardType == 'score')
			ScoreLeaderboard();
		else if(boardType == 'averages')
			AverageScoreLeaderboard();
		else if(boardType == 'averageg')
			AverageGuessLeaderboard();
		else if(boardType == 'puzzle')
			PuzzleLeaderboard();
		else
			interaction.editReply({content:'Something went wrong',ephemeral:true})
			
		
		async function ScoreLeaderboard(){
			const leaderboardMap = new Map();
			//if puzzles are found
			for(let i=0;i<tag.length;i++){
				let scoreValue = 0;
				scoreValue = tag[i].score;

				let newTotal = leaderboardMap.get(tag[i].uid) + scoreValue;
				if(isNaN(newTotal)){
					newTotal = scoreValue;
				}

				leaderboardMap.set(tag[i].uid,newTotal);
			}
			const sortedBoard = new Map([...leaderboardMap.entries()].sort((a,b)=>b[1]-a[1]));
			sendBoard(sortedBoard, "Total Score");
		}
		
		async function AverageScoreLeaderboard(){
			const leaderboardMap = new Map();
			const leaderboardCounter = new Map();
			//if puzzles are found
			for(let i=0;i<tag.length;i++){
				let scoreValue = 0;
				scoreValue = tag[i].score;
				
				let newTotal = leaderboardMap.get(tag[i].uid) + scoreValue;
				if(isNaN(newTotal)){
					newTotal = scoreValue;
				}
				leaderboardMap.set(tag[i].uid,newTotal);

				let avgCounter = leaderboardCounter.get(tag[i].uid) + 1;
				if(isNaN(avgCounter)){
					avgCounter = 1;
				}
				leaderboardCounter.set(tag[i].uid, avgCounter);
			}
			for(let [key, value] of leaderboardMap){
				let scoreCount = leaderboardCounter.get(key);
				let average = value / scoreCount
				average = average.toFixed(2);
				leaderboardMap.set(key,average);
			}
			const sortedBoard = new Map([...leaderboardMap.entries()].sort((a,b)=>a[1]-b[1]));
			sendBoard(sortedBoard, "Average");
		}

		async function AverageGuessLeaderboard(){
			const leaderboardMap = new Map();
			const leaderboardCounter = new Map();
			//if puzzles are found
			for(let i=0;i<tag.length;i++){
				let scoreValue = 0;
				scoreValue = tag[i].guesses;
				let newTotal = leaderboardMap.get(tag[i].uid) + scoreValue;
				if(isNaN(newTotal)){
					newTotal = scoreValue;
				}
				leaderboardMap.set(tag[i].uid,newTotal);

				let avgCounter = leaderboardCounter.get(tag[i].uid) + 1;
				if(isNaN(avgCounter)){
					avgCounter = 1;
				}
				leaderboardCounter.set(tag[i].uid, avgCounter);
			}
			for(let [key, value] of leaderboardMap){
				let scoreCount = leaderboardCounter.get(key);
				let average = value / scoreCount
				average = average.toFixed(2);
				leaderboardMap.set(key,average);
			}
			const sortedBoard = new Map([...leaderboardMap.entries()].sort((a,b)=>a[1]-b[1]));
			sendBoard(sortedBoard, "Average Guesses");
		}

		async function PuzzleLeaderboard(){
			const leaderboardMap = new Map();
			//if puzzles are found
			for(let i=0;i<tag.length;i++){
				let newTotal = leaderboardMap.get(tag[i].uid) + 1;
				if(isNaN(newTotal)){
					newTotal = 1;
				}
				leaderboardMap.set(tag[i].uid,newTotal);
			}
			const sortedBoard = new Map([...leaderboardMap.entries()].sort((a,b)=>b[1]-a[1]));
			sendBoard(sortedBoard, "Total Puzzles");
		}
		
		async function sendBoard(sortedBoard, boardName){
			let leaderboardMessage = '';
			let position = 1;
			for(let [key, value] of sortedBoard){
				try{
					const username = await interaction.guild.members.fetch(key).then(userf => {return userf.displayName});
					leaderboardMessage += `(${position}). ${username}: ${boardName}: ${value}\n`;
					position++;
				} catch(error){
					//user not in server
				}
				if(position > 10){
					//exit and send top 10 players
					break;
				}
			}
			interaction.editReply({content:Formatters.codeBlock(`${leaderboardMessage}`),ephemeral:true});
		}
	},
};

