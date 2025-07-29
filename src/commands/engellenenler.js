const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType } = require('discord.js');
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
        .setColor(0x2F3136)
        .setTitle('Uyarı')
        .setDescription(`\`\`\`ini\n${forumValidation.message}\n\`\`\``)
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

    try {
      const blockedUsers = await ForumBlock.find({
        forumId: channel.id
      });

      if (blockedUsers.length === 0) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0x2F3136)
          .setTitle('Sonuç Bulunamadı')
          .setDescription('> Bu forumda engellenmiş kullanıcı bulunmamaktadır.')
          .setTimestamp();
        
        return interaction.editReply({ embeds: [errorEmbed] });
      }

      // Ana Embed oluştur
      const mainEmbed = new EmbedBuilder()
        .setColor(0x2F3136)
        .setTitle('Engellenen Kullanıcılar')
        .setDescription(`> (**${channel.name}**) kanalında engellenen üyelerin listesi`)
        .addFields(
          { name: 'Forum', value: `\`\`\`ini\n${channel.name}\n\`\`\``, inline: true },
          { name: 'Toplam Engellenen', value: `\`\`\`ini\n${blockedUsers.length.toString()}\n\`\`\``, inline: true }
        )
        .setFooter({ text: `${interaction.guild.name} - Forum Yönetimi` })
        .setTimestamp();

      // Dropdown için seçenekleri oluştur
      const selectOptions = [];
      const userDetails = {};

      for (const block of blockedUsers) {
        try {
          const user = await interaction.client.users.fetch(block.blockedUserId);
          const blockedBy = await interaction.client.users.fetch(block.blockedBy);
          
          // Dropdown için seçenek ekle
          selectOptions.push({
            label: user.username,
            description: `${new Date(block.blockedAt).toLocaleDateString('tr-TR')} tarihinde engellendi`,
            value: user.id,
          });

          // Kullanıcı detaylarını sakla
          userDetails[user.id] = {
            username: user.username,
            id: user.id,
            avatarURL: user.displayAvatarURL(),
            reason: block.reason,
            blockedBy: {
              username: blockedBy.username,
              id: blockedBy.id
            },
            blockedAt: block.blockedAt,
            imageUrl: block.imageUrl
          };
        } catch (err) {
          // Kullanıcı bulunamadıysa
          selectOptions.push({
            label: `Bilinmeyen Kullanıcı (${block.blockedUserId})`,
            description: `${new Date(block.blockedAt).toLocaleDateString('tr-TR')} tarihinde engellendi`,
            value: block.blockedUserId,
          });

          // Bilinmeyen kullanıcı için detay
          userDetails[block.blockedUserId] = {
            username: 'Bilinmeyen Kullanıcı',
            id: block.blockedUserId,
            reason: block.reason,
            blockedAt: block.blockedAt,
            imageUrl: block.imageUrl
          };
        }
      }

      // Dropdown menüsünü oluştur
      const selectMenu = new ActionRowBuilder()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('engellenen_kullanici_sec')
            .setPlaceholder('Engellenen kullanıcıyı seç')
            .addOptions(selectOptions)
        );

      // İlk mesajı gönder
      const reply = await interaction.editReply({
        embeds: [mainEmbed],
        components: [selectMenu],
      });

      // Seçim yapıldığında çalışacak koleksiyonu oluştur
      const collector = reply.createMessageComponentCollector({ 
        componentType: ComponentType.StringSelect,
        time: 300000 // 5 dakika
      });

      collector.on('collect', async (selectInteraction) => {
        // Seçilen kullanıcının ID'si
        const selectedUserId = selectInteraction.values[0];
        const userInfo = userDetails[selectedUserId];
        
        // Kullanıcı detay embed'i oluştur
        const detailEmbed = new EmbedBuilder()
          .setColor(0x2F3136)
          .setTitle(`Kullanıcı Detayı`)
          .setDescription(`\`\`\`ini\nKullanıcı: ${userInfo.username} (${userInfo.id})\nSebep: ${userInfo.reason}\n\`\`\``)
          .setThumbnail(userInfo.avatarURL || null);
        
        // Engeli koyan bilgisi varsa ekle
        if (userInfo.blockedBy) {
          detailEmbed.addFields(
            { name: 'Engeli Koyan', value: `<@${userInfo.blockedBy.id}>`, inline: true },
            { name: 'Engelleme Tarihi', value: `<t:${Math.floor(new Date(userInfo.blockedAt).getTime() / 1000)}:F>`, inline: true }
          );
        } else {
          detailEmbed.addFields(
            { name: 'Engelleme Tarihi', value: `<t:${Math.floor(new Date(userInfo.blockedAt).getTime() / 1000)}:F>`, inline: true }
          );
        }

        // Kanıt fotoğrafı varsa ekle
        if (userInfo.imageUrl) {
          detailEmbed.setImage(userInfo.imageUrl);
        }

        // Yanıtı güncelle
        await selectInteraction.update({
          embeds: [detailEmbed],
          components: [selectMenu],
        });
      });

      // Koleksiyon süresi dolduğunda
      collector.on('end', async (collected) => {
        if (collected.size === 0) {
          // Hiç etkileşim olmadıysa komponenti devre dışı bırak
          const disabledMenu = new ActionRowBuilder()
            .addComponents(
              StringSelectMenuBuilder.from(selectMenu.components[0]).setDisabled(true)
            );
          
          await interaction.editReply({
            components: [disabledMenu],
          }).catch(() => {});
        }
      });

    } catch (error) {
      console.error('Engellenen kullanıcı listesi hatası:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor(0x2F3136)
        .setTitle('Uyarı')
        .setDescription('> Engellenen kullanıcılar listelenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.')
        .setTimestamp();
      
      return interaction.editReply({ embeds: [errorEmbed] });
    }
  },
}; 