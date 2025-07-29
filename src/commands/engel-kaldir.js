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
        .setColor(0x2F3136)
        .setTitle('Uyarı')
        .setDescription(`> ${forumValidation.message}`)
        .setTimestamp();
      
      return interaction.editReply({ embeds: [errorEmbed] });
    }

    const channel = forumValidation.channel;

    if (!isForumOwnerOrAdmin(interaction, channel)) {
      const errorEmbed = new EmbedBuilder()
        .setColor(0x2F3136)
        .setTitle('İşlem Geçersiz')
        .setDescription('> Bu komutu kullanmak için forum sahibi veya yönetici olmalısınız.')
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
          .setColor(0x2F3136)
          .setTitle('İşlem Geçersiz')
          .setDescription(`> ${targetUser.username} kullanıcısı bu forumda engellenmiş değil.`)
          .setTimestamp();
        
        return interaction.editReply({ embeds: [errorEmbed] });
      }

      await ForumBlock.deleteOne({
        forumId: channel.id,
        blockedUserId: targetUser.id
      });

      const successEmbed = new EmbedBuilder()
      .setColor(0x2F3136)
      .setTitle('Engel Kaldırıldı ')
      .setDescription(`> <@${targetUser.id}> kullanıcısının forum engeli başarıyla kaldırıldı.`)
      .setThumbnail(targetUser.displayAvatarURL())
      .addFields(
        // Üst satır (ini bloklu)
        { name: 'Kullanıcı', value: `\`\`\`ini\n${targetUser.username} \n\`\`\``, inline: true },
        { name: 'Sebep', value: `\`\`\`ini\n${reason || 'Belirtilmedi'}\n\`\`\``, inline: true },
        { name: 'Forum', value: `\`\`\`ini\n${channel.name}\n\`\`\``, inline: true },
    
        // Alt satır (normal)
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
        .setColor(0x2F3136)
        .setTitle('Uyarı')
        .setDescription('> Kullanıcının engeli kaldırılırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.')
        .setTimestamp();
      
      return interaction.editReply({ embeds: [errorEmbed] });
    }
  },
}; 