const { Events } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`✅ Bot başarıyla giriş yaptı: ${client.user.tag}`);
    console.log(`✅ ${client.guilds.cache.size} sunucuya bağlı`);
    
    client.user.setActivity('pepemuo', { type: 'WATCHING' });
  },
}; 