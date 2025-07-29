const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const { token, clientId, guildId } = require('./config');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
  } else {
    console.log(`[UYARI] ${filePath} dosyasında gerekli "data" veya "execute" özellikleri eksik.`);
  }
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`${commands.length} komut Discord API'sine yükleniyor...`);

    const data = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands },
    );

    console.log(`Başarıyla ${data.length} komut Discord API'sine yüklendi.`);
  } catch (error) {
    console.error(error);
  }
})(); 