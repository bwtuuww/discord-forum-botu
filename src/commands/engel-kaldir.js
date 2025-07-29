const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isForumOwnerOrAdmin, validateForumChannel } = require('../utils/permissions');
const ForumBlock = require('../models/ForumBlock');
const { logUnblock } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('engel-kaldir')
    .setDescription('Bir kullanıcının forum engelini kaldırır')
    .addUserOption(option =>
      option.setName('kullanici')
        .setDescription('Engeli kaldırılacak kullanıcı')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('sebep')
        .setDescription('Engel kaldırma sebebi')
        .setRequired(true)),

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

    const targetUser = interaction.options.getUser('kullanici');
    const reason = interaction.options.getString('sebep');

    try {
      const existingBlock = await ForumBlock.findOne({
        forumId: channel.id,
        blockedUserId: targetUser.id
      });

      if (!existingBlock) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('❌ Engel Bulunamadı')
          .setDescription(`\`\`\`yaml\n${targetUser.username} kullanıcısı bu forumda engellenmiş değil.\n\`\`\``)
          .setTimestamp();
        
        return interaction.editReply({ embeds: [errorEmbed] });
      }

      await ForumBlock.deleteOne({
        forumId: channel.id,
        blockedUserId: targetUser.id
      });

      const successEmbed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('✅ Engel Kaldırıldı')
        .setDescription(`\`\`\`yaml\nKullanıcı: ${targetUser.username}\nSebep: ${reason}\n\nForum engeli başarıyla kaldırıldı.\n\`\`\``)
        .setThumbnail(targetUser.displayAvatarURL())
        .addFields(
          { name: 'Forum', value: channel.name, inline: true },
          { name: 'Engeli Kaldıran', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Tarih', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
        )
        .setTimestamp();

      await logUnblock(interaction.client, {
        targetUser: targetUser,
        reason: reason,
        executor: interaction.user,
        guild: interaction.guild,
        channel: channel
      });
      
      return interaction.editReply({ embeds: [successEmbed] });

    } catch (error) {
      console.error('Engel kaldırma hatası:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ Sistem Hatası')
        .setDescription('```yaml\nKullanıcının engeli kaldırılırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.\n```')
        .setTimestamp();
      
      return interaction.editReply({ embeds: [errorEmbed] });
    }
  },
}; 