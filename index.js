const Sequelize = require('sequelize');
const fs = require('node:fs');
const {Client, Collection, Intents} = require('discord.js');
const {token} = require('./config.json');

const client = new Client({intents:[Intents.FLAGS.GUILDS,Intents.FLAGS.GUILD_MESSAGES,Intents.FLAGS.GUILD_MESSAGE_REACTIONS,Intents.FLAGS.GUILD_MEMBERS]});

client.commands = new Collection();

//database information
const sequelize = new Sequelize({
	dialect: 'sqlite',
	logging: false,
	storage: './database.sqlite',
});
const Tags = sequelize.define('tags', {
	uid: Sequelize.STRING,
	pid: Sequelize.INTEGER,
	score: Sequelize.INTEGER,
	guesses: Sequelize.INTEGER,
	desc: Sequelize.TEXT
})

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
}

client.once('ready', () => {
	Tags.sync();
	console.log('Ready');
});

client.on('interactionCreate', async interaction => {
	if(!interaction.isCommand()) return;
	const command = client.commands.get(interaction.commandName);
	if(!command) return;
	try{
		await command.execute(interaction, Tags);
	} catch(error){
		console.error(error);
		await interaction.reply({content:'There was an error with this command!',ephemeral:true});
	}
});

client.on('messageCreate', async message => {
	const regex = new RegExp('Connections \\nPuzzle #\\d+\\n');
	if(message.author.id == message.guild.ownerId && message.content == '!connectionsUpdate'){
		//admin trigger for updating database
		console.log('fetching all messages');
		const messages = await fetchAllMessages(message.channel);
		for(let i=0;i<messages.length;i++){
			if(regex.test(messages[i])){
				//valid connections message
				console.log('found valid message');
				await insertData(messages[i].content, messages[i].author.id);
				messages[i].react('✅');
			}
			else{
				//message not valid
				console.log(`message not valid: ${messages[i]}`);
			}
		}
		console.log('finished updating channel');
	}
	else if(regex.test(message.content)){
		//process connections string into database
		insertData(message.content, message.author.id);
		message.react('✅');
	}
	else{
		//do nothing if either isnt true
	}
});

async function insertData(data, userId){
	const idRegex = new RegExp('\\d+');
	let searchResults = data.match(idRegex);
	const puzzleId = searchResults[0];
	
	const checktag = await Tags.findOne({where:{uid: userId, pid: puzzleId}});
	if(checktag){
		//tag already in system
		console.log(`puzzle ${puzzleId} for user ${userId} already recorded`);
	}
	else{
		//calculate score
		const lvl1Reg = new RegExp('🟨🟨🟨🟨');
		const lvl2Reg = new RegExp('🟩🟩🟩🟩');
		const lvl3Reg = new RegExp('🟦🟦🟦🟦');
		const lvl4Reg = new RegExp('🟪🟪🟪🟪');
		const totalGuess = /\n(🟨|🟦|🟪|🟩)/gm;
		let score = 0;
		let correctGuesses = 0;
		let guessCount = 0;

		if(lvl1Reg.test(data)){
			score += 2
			correctGuesses += 1;
		}
		if(lvl2Reg.test(data)){
			score += 2
			correctGuesses += 1;
		}
		if(lvl3Reg.test(data)){
			score += 4
			correctGuesses += 1;
		}
		if(lvl4Reg.test(data)){
			score += 6
			correctGuesses += 1;
		}
		if(totalGuess.test(data)){
			guessCount = data.match(totalGuess)
			score -= 1 * (guessCount.length - correctGuesses)
		}
		if(score < 0){
			score = 0;
		}
		if(score == 14){
			score = 15;
		}
		try{
			const tag = await Tags.create({
				uid: userId,
				pid: puzzleId,
				score: score,
				guesses: guessCount.length,
				desc: data
			});
			console.log(`puzzle ${puzzleId} added for user ${userId}`);
		} catch(error){
			console.error(error);
		}
	}
}

async function fetchAllMessages(channelId) {
	const channel = client.channels.cache.get(channelId.id);
	let messages = [];

	// Create message pointer
	let message = await channel.messages
		.fetch({ limit: 1 })
		.then(messagePage => (messagePage.size === 1 ? messagePage.at(0) : null));

	while (message) {
		await channel.messages
		.fetch({ limit: 100, before: message.id })
		.then(messagePage => {
			messagePage.forEach(msg => messages.push(msg));

			// Update our message pointer to be last message in page of messages
			message = 0 < messagePage.size ? messagePage.at(messagePage.size - 1) : null;
		});
	}
	return messages
}

client.login(token);

