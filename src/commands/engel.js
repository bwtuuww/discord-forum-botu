const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isForumOwnerOrAdmin, validateForumChannel } = require('../utils/permissions');
const ForumBlock = require('../models/ForumBlock');
const { whitelistroller } = require('../config');
const { logBlock } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('engel')
    .setDescription('Bir kullanıcıyı bu forumdan engeller')
    .addUserOption(option =>
      option.setName('kullanici')
        .setDescription('Engellenecek kullanıcı')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('sebep')
        .setDescription('Engelleme sebebi')
        .setRequired(true))
    .addAttachmentOption(option =>
      option.setName('gorsel')
        .setDescription('Kanıt fotoğrafı')
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
    const photo = interaction.options.getAttachment('gorsel');

    if (photo && !photo.contentType.startsWith('image/')) {
      const errorEmbed = new EmbedBuilder()
        .setColor(0x2F3136)
        .setTitle('Uyarı')
        .setDescription('> Lütfen bir resim dosyası yükleyin.')
        .setTimestamp();
      
      return interaction.editReply({ embeds: [errorEmbed] });
    }

    if (targetUser.id === interaction.user.id) {
      const errorEmbed = new EmbedBuilder()
        .setColor(0x2F3136)
        .setTitle('İşlem Geçersiz')
        .setDescription('> Kendinizi engelleyemezsiniz.')
        .setTimestamp();
      
      return interaction.editReply({ embeds: [errorEmbed] });
    }

    if (targetUser.bot) {
      const errorEmbed = new EmbedBuilder()
        .setColor(0x2F3136)
        .setTitle('İşlem Geçersiz')
        .setDescription('> Botları engelleyemezsiniz.')
        .setTimestamp();
      
      return interaction.editReply({ embeds: [errorEmbed] });
    }

    try {
      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      
      if (!targetMember) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0x2F3136)
          .setTitle('Sonuç Bulunamadı')
          .setDescription('> Kullanıcı sunucuda bulunamadı.')
          .setTimestamp();
        
        return interaction.editReply({ embeds: [errorEmbed] });
      }
      
      const hasWhitelistedRole = targetMember.roles.cache.some(role => whitelistroller.includes(role.id));
      if (hasWhitelistedRole) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0x2F3136)
          .setTitle('İşlem Geçersiz')
          .setDescription('> Bu kullanıcı korumalı bir role sahip olduğu için engellenemez.')
          .setTimestamp();
        
        return interaction.editReply({ embeds: [errorEmbed] });
      }

      const existingBlock = await ForumBlock.findOne({
        forumId: channel.id,
        blockedUserId: targetUser.id
      });

      if (existingBlock) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0x2F3136)
          .setTitle('İşlem Geçersiz')
          .setDescription(`> ${targetUser.username} kullanıcısı zaten bu forumda engellenmiş.`)
          .setTimestamp();
        
        return interaction.editReply({ embeds: [errorEmbed] });
      }

      const photoUrl = photo ? photo.url : null;

      await ForumBlock.create({
        forumId: channel.id,
        forumOwnerId: channel.ownerId,
        blockedUserId: targetUser.id,
        reason: reason,
        blockedBy: interaction.user.id,
        imageUrl: photoUrl
      });

      const successEmbed = new EmbedBuilder()
        .setColor(0x2F3136)
        .setTitle('Kullanıcı Engellendi')
        .setDescription(`> <@${targetUser.id}> kullanıcısına başarıyla forum engeli uygulandı.`)
        .setThumbnail(targetUser.displayAvatarURL())
        .addFields(
          // Üst satır (kod bloğu ile)
          { name: 'Kullanıcı', value: `\`\`\`ini\n${targetUser.username}\n\`\`\``, inline: true },
          { name: 'Sebep', value: `\`\`\`ini\n${reason || 'Belirtilmedi'}\n\`\`\``, inline: true },
          { name: 'Forum', value: `\`\`\`ini\n${channel.name}\n\`\`\``, inline: true },
      
          // Alt satır (normal)
          { name: 'Engelleme Zamanı', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
          { name: 'Engeli Koyan', value: `<@${interaction.user.id}>`, inline: true }
        )
        .setTimestamp();
      
      

      if (photoUrl) {
        successEmbed.setImage(photoUrl);
      }

      await logBlock(interaction.client, {
        targetUser: targetUser,
        reason: reason,
        executor: interaction.user,
        guild: interaction.guild,
        channel: channel,
        imageUrl: photoUrl
      });
      
      return interaction.editReply({ embeds: [successEmbed] });

    } catch (error) {
      console.error('Engelleme hatası:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor(0x2F3136)
        .setTitle('Uyarı')
        .setDescription('> Kullanıcı engellenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.')
        .setTimestamp();
      
      return interaction.editReply({ embeds: [errorEmbed] });
    }
  },
}; 