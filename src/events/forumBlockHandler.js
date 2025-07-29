const { Events, ChannelType, EmbedBuilder } = require('discord.js');
const ForumBlock = require('../models/ForumBlock');

module.exports = {
  name: Events.MessageCreate,
  once: false,
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    if (!message.channel.isThread()) return;

    const thread = message.channel;
    
    const parentChannel = message.guild.channels.cache.get(thread.parentId);
    if (!parentChannel || parentChannel.type !== ChannelType.GuildForum) return;

    try {
      const isBlocked = await ForumBlock.findOne({
        forumId: thread.id,
        blockedUserId: message.author.id
      });

      if (isBlocked) {
        await message.delete();
        
        try {
          const blockEmbed = new EmbedBuilder()
            .setColor(0x2F3136) // Gri
            .setTitle('Erişim Reddedildi')
            .setDescription(`> <@${message.author.id}> Bu forum kanalında engelli olduğunuz için mesajınız silindi.`)
            .setThumbnail(message.author.displayAvatarURL())
            .addFields(
              // Üst satır (kod bloğu ile)
              { name: 'Kanal', value: `\`\`\`ini\n${thread.name}\n\`\`\``, inline: true },
              { name: 'Sebep', value: `\`\`\`ini\n${isBlocked.reason || 'Belirtilmedi'}\n\`\`\``, inline: true },

              // Alt satır (normal)
              { name: 'Engelleme Zamanı', value: `<t:${Math.floor(new Date(isBlocked.blockedAt).getTime() / 1000)}:R>`, inline: false },
              { name: 'Forum Sahibi', value: `<@${isBlocked.forumOwnerId}>`, inline: true }
            )
            .setTimestamp();
          
          await message.author.send({
            embeds: [blockEmbed]
          });
        } catch (error) {
          console.error(`${message.author.username} kullanıcısına DM gönderilemedi:`, error);
        }
      }
    } catch (error) {
      console.error('Forum engelleme hatası:', error);
    }
  },
}; 