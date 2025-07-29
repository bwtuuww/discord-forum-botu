const { EmbedBuilder } = require('discord.js');

/**
 * ini formatında bir embed mesajı oluşturur
 * @param {Object} options - Embed seçenekleri
 * @returns {EmbedBuilder} - Oluşturulan embed
 */
function createEmbed(options) {
  const {
    title,
    description,
    color = 0x0099FF,
    fields = [],
    footer,
    timestamp = true
  } = options;

  const embed = new EmbedBuilder();

  if (title) embed.setTitle(title);
  
  if (description) {
    embed.setDescription(`\`\`\`ini\n${description}\n\`\`\``);
  }
  
  embed.setColor(color);
  
  if (fields && fields.length > 0) {
    embed.addFields(fields);
  }
  
  if (footer) {
    embed.setFooter({ text: footer });
  }
  
  if (timestamp) {
    embed.setTimestamp();
  }
  
  return embed;
}

/**
 * Başarı mesajı embed'i oluşturur
 */
function createSuccessEmbed(message) {
  return createEmbed({
    title: 'Başarılı',
    description: message,
    color: 0x00FF00, // Yeşil
  });
}

/**
 * Hata mesajı embed'i oluşturur
 */
function createErrorEmbed(message) {
  return createEmbed({
    title: 'Hata',
    description: message,
    color: 0xFF0000, // Kırmızı
  });
}

/**
 * Bilgi mesajı embed'i oluşturur
 */
function createInfoEmbed(message) {
  return createEmbed({
    title: 'ℹBilgi',
    description: message,
    color: 0x0099FF, // Mavi
  });
}

module.exports = {
  createEmbed,
  createSuccessEmbed,
  createErrorEmbed,
  createInfoEmbed
}; 