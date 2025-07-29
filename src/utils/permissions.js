const { PermissionFlagsBits, ChannelType } = require('discord.js');

/**
 * Kullanıcının forum sahibi veya admin yetkisine sahip olup olmadığını kontrol eder
 * @param {Object} interaction - Discord.js interaction nesnesi
 * @param {Object} channel - Forum kanalı
 * @returns {Boolean} - Yetkili mi
 */
function isForumOwnerOrAdmin(interaction, channel) {
  if (
    interaction.member.id === interaction.guild.ownerId ||
    interaction.member.permissions.has(PermissionFlagsBits.Administrator)
  ) {
    return true;
  }

  if (channel.isThread() && channel.ownerId === interaction.user.id) {
    return true;
  }

  return false;
}

/**
 * Kullanıcının geçerli bir forumda komut çalıştırıp çalıştırmadığını kontrol eder
 * @param {Object} interaction - Discord.js interaction nesnesi
 * @returns {Object} - Sonuç nesnesi {success, message, channel}
 */
function validateForumChannel(interaction) {
  const channel = interaction.channel;

  if (!channel.isThread()) {
    return {
      success: false,
      message: 'Bu komut sadece forum gönderilerinde kullanılabilir.'
    };
  }

  const parentChannel = interaction.guild.channels.cache.get(channel.parentId);
  if (!parentChannel || parentChannel.type !== ChannelType.GuildForum) {
    return {
      success: false,
      message: 'Bu komut sadece forum gönderilerinde kullanılabilir.'
    };
  }

  return {
    success: true,
    message: '',
    channel
  };
}

module.exports = {
  isForumOwnerOrAdmin,
  validateForumChannel
}; 