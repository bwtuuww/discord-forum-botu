const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isForumOwnerOrAdmin, validateForumChannel } = require('../utils/permissions');
const ForumBlock = require('../models/ForumBlock');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('engellenenler')
    .setDescription('Bu forumda engellenen kullanıcıları listeler'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const forumValidation = validateForumChannel(interaction);
    if (!forumValidation.success) {
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ Hata')
        .setDescription(`\`\`\`yaml\n${forumValidation.message}\n\`\`\``)
        .setTimestamp();
      
      return interaction.editReply({ embeds: [errorEmbed] });
    }

    const channel = forumValidation.channel;

    if (!isForumOwnerOrAdmin(interaction, channel)) {
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ Yetersiz Yetki')
        .setDescription('```yaml\nBu komutu kullanmak için forum sahibi veya yönetici olmalısınız.\n```')
        .setTimestamp();
      
      return interaction.editReply({ embeds: [errorEmbed] });
    }

    try {
      const blockedUsers = await ForumBlock.find({
        forumId: channel.id
      });

      if (blockedUsers.length === 0) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('❌ Engellenen Kullanıcı Yok')
          .setDescription('```yaml\nBu forumda engellenmiş kullanıcı bulunmamaktadır.\n```')
          .setTimestamp();
        
        return interaction.editReply({ embeds: [errorEmbed] });
      }

      let description = 'Engellenmiş Kullanıcılar:\n\n';

      for (const block of blockedUsers) {
        try {
          const user = await interaction.client.users.fetch(block.blockedUserId);
          const blockedBy = await interaction.client.users.fetch(block.blockedBy);
          
          description += `Kullanıcı: ${user.username}\n`;
          description += `Sebep: ${block.reason}\n`;
          description += `Engeli Koyan: ${blockedBy.username}\n`;
          description += `Tarih: ${new Date(block.blockedAt).toLocaleDateString('tr-TR')}\n\n`;
        } catch (err) {
          description += `Kullanıcı ID: ${block.blockedUserId}\n`;
          description += `Sebep: ${block.reason}\n`;
          description += `Tarih: ${new Date(block.blockedAt).toLocaleDateString('tr-TR')}\n\n`;
        }
      }

      const listEmbed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('📋 Engellenen Kullanıcılar')
        .setDescription(`\`\`\`yaml\n${description}\n\`\`\``)
        .addFields(
          { name: 'Forum', value: channel.name, inline: true },
          { name: 'Toplam Engellenen', value: blockedUsers.length.toString(), inline: true }
        )
        .setFooter({ text: `${interaction.guild.name} - Forum Yönetimi` })
        .setTimestamp();

      return interaction.editReply({ embeds: [listEmbed] });

    } catch (error) {
      console.error('Engellenen kullanıcı listesi hatası:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ Sistem Hatası')
        .setDescription('```yaml\nEngellenen kullanıcılar listelenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.\n```')
        .setTimestamp();
      
      return interaction.editReply({ embeds: [errorEmbed] });
    }
  },
}; 