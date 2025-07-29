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
    const photo = interaction.options.getAttachment('gorsel');

    if (photo && !photo.contentType.startsWith('image/')) {
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ Hata')
        .setDescription('```yaml\nLütfen bir resim dosyası yükleyin.\n```')
        .setTimestamp();
      
      return interaction.editReply({ embeds: [errorEmbed] });
    }

    if (targetUser.id === interaction.user.id) {
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ Hata')
        .setDescription('```yaml\nKendinizi engelleyemezsiniz.\n```')
        .setTimestamp();
      
      return interaction.editReply({ embeds: [errorEmbed] });
    }

    if (targetUser.bot) {
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ Hata')
        .setDescription('```yaml\nBotları engelleyemezsiniz.\n```')
        .setTimestamp();
      
      return interaction.editReply({ embeds: [errorEmbed] });
    }

    try {
      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      
      if (!targetMember) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('❌ Kullanıcı Bulunamadı')
          .setDescription('```yaml\nKullanıcı sunucuda bulunamadı.\n```')
          .setTimestamp();
        
        return interaction.editReply({ embeds: [errorEmbed] });
      }
      
      const hasWhitelistedRole = targetMember.roles.cache.some(role => whitelistroller.includes(role.id));
      if (hasWhitelistedRole) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('❌ Korumalı Kullanıcı')
          .setDescription('```yaml\nBu kullanıcı korumalı bir role sahip olduğu için engellenemez.\n```')
          .setTimestamp();
        
        return interaction.editReply({ embeds: [errorEmbed] });
      }

      const existingBlock = await ForumBlock.findOne({
        forumId: channel.id,
        blockedUserId: targetUser.id
      });

      if (existingBlock) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('❌ Zaten Engellenmiş')
          .setDescription(`\`\`\`yaml\n${targetUser.username} kullanıcısı zaten bu forumda engellenmiş.\n\`\`\``)
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
        .setColor(0x00FF00)
        .setTitle('✅ Kullanıcı Engellendi')
        .setDescription(`\`\`\`yaml\nKullanıcı: ${targetUser.username}\nSebep: ${reason}\n\nBaşarıyla forum engeli uygulandı.\n\`\`\``)
        .setThumbnail(targetUser.displayAvatarURL())
        .addFields(
          { name: 'Forum', value: `\`\`\`yaml\n${channel.name}\n\`\`\``, inline: true },
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
        .setColor(0xFF0000)
        .setTitle('❌ Sistem Hatası')
        .setDescription('```yaml\nKullanıcı engellenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.\n```')
        .setTimestamp();
      
      return interaction.editReply({ embeds: [errorEmbed] });
    }
  },
}; 