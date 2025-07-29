const { EmbedBuilder } = require('discord.js');
const { logChannelId } = require('../config');

/**
 * İşlem loglarını belirtilen log kanalına gönderir
 * @param {Client} client - Discord.js client nesnesi
 * @param {Object} options - Log seçenekleri
 */
async function sendLog(client, options) {
  try {
    const {
      title,
      description,
      color,
      fields = [],
      footer,
      thumbnailUrl,
      imageUrl
    } = options;

    // Log kanalını bul
    const logChannel = await client.channels.fetch(logChannelId).catch(() => null);
    if (!logChannel) {
      console.error('Log kanalı bulunamadı. Config dosyasındaki logChannelId kontrol edilmeli.');
      return;
    }

    // Log embed'i oluştur
    const logEmbed = new EmbedBuilder()
      .setColor(color || 0x2F3136)
      .setTitle(title)
      .setDescription(description ? `> ${description}` : null)
      .setTimestamp();

    // Thumbnail varsa ekle
    if (thumbnailUrl) {
      logEmbed.setThumbnail(thumbnailUrl);
    }

    // Resim varsa ekle
    if (imageUrl) {
      logEmbed.setImage(imageUrl);
    }

    // Alanlar varsa ekle
    if (fields && fields.length > 0) {
      logEmbed.addFields(fields);
    }

    // Footer varsa ekle
    if (footer) {
      logEmbed.setFooter({ text: footer });
    }

    // Log kanalına gönder
    await logChannel.send({ embeds: [logEmbed] });
  } catch (error) {
    console.error('Log gönderilemedi:', error);
  }
}

/**
 * Engelleme işlemini loglar
 * @param {Client} client - Discord.js client nesnesi
 * @param {Object} data - Engelleme verileri
 */
async function logBlock(client, data) {
  const {
    targetUser,
    reason,
    executor,
    guild,
    channel,
    imageUrl
  } = data;

  await sendLog(client, {
    title: 'Kullanıcı Engellendi',
    description: `<@${targetUser.id}> kullanıcısına forum engeli uygulandı.`,
    color: 0x2F3136, // Gri
    thumbnailUrl: targetUser.displayAvatarURL(),
    imageUrl: imageUrl, // Kanıt fotoğrafı
    fields: [
      // Üst satır (kod bloğu ile)
      { name: 'Kullanıcı', value: `\`\`\`ini\n${targetUser.username}\n\`\`\``, inline: true },
      { name: 'Sebep', value: `\`\`\`ini\n${reason || 'Belirtilmedi'}\n\`\`\``, inline: true },
      { name: 'Forum', value: `\`\`\`ini\n${channel.name}\n\`\`\``, inline: true },
      
      // Alt satır (normal)
      { name: 'Engeli Koyan', value: `<@${executor.id}>`, inline: true },
      { name: 'Tarih', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
    ],
    footer: `Forum ID: ${channel.id}`
  });
}

/**
 * Engel kaldırma işlemini loglar
 * @param {Client} client - Discord.js client nesnesi
 * @param {Object} data - Engel kaldırma verileri
 */
async function logUnblock(client, data) {
  const {
    targetUser,
    reason,
    executor,
    guild,
    channel
  } = data;

  await sendLog(client, {
    title: 'Engel Kaldırıldı',
    description: `<@${targetUser.id}> kullanıcısının forum engeli kaldırıldı.`,
    color: 0x2F3136, // Gri
    thumbnailUrl: targetUser.displayAvatarURL(),
    fields: [
      // Üst satır (kod bloğu ile)
      { name: 'Kullanıcı', value: `\`\`\`ini\n${targetUser.username}\n\`\`\``, inline: true },
      { name: 'Sebep', value: `\`\`\`ini\n${reason || 'Belirtilmedi'}\n\`\`\``, inline: true },
      { name: 'Forum', value: `\`\`\`ini\n${channel.name}\n\`\`\``, inline: true },
      
      // Alt satır (normal)
      { name: 'Engeli Kaldıran', value: `<@${executor.id}>`, inline: true },
      { name: 'Tarih', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
    ],
    footer: `Forum ID: ${channel.id}`
  });
}

module.exports = {
  sendLog,
  logBlock,
  logUnblock
}; 