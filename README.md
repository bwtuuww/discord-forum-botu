# Discord Forum Yönetim Botu

Discord sunucularında forum kanallarının yönetimini kolaylaştıran bir bottur. Forum sahibi veya yöneticiler, belirli kullanıcıları forumdan engelleyebilir, engeli kaldırabilir ve engellenen kullanıcıları listeleyebilir.

## Özellikler

- **Kullanıcı Engelleme**: `/engel @kişi sebep görsel` komutu ile bir kullanıcının forum içinde mesaj göndermesini engelleyebilirsiniz.
- **Engel Kaldırma**: `/engel-kaldir @kişi sebep` komutu ile bir kullanıcının engelini kaldırabilirsiniz.
- **Engellenen Kullanıcıları Listeleme**: `/engellenenler` komutu ile o forumda engellenen tüm kullanıcıları ve sebeplerini görüntüleyebilirsiniz.
- **Whitelist Roller**: Belirli rollere sahip kullanıcıların engellenemeyeceği koruma sistemi.
- **Log Sistemi**: Engelleme ve engel kaldırma işlemleri belirlenen log kanalına detaylı bir şekilde kaydedilir.

## Kurulum

1. Projeyi klonlayın
```bash
git clone https://github.com/kullanici/discord-forum-bot.git
cd discord-forum-bot
```

2. Bağımlılıkları yükleyin
```bash
npm install
```

3. `src/config.js` dosyasını düzenleyin ve gerekli bilgileri girin
```javascript
// Bot token, client ID, vb. bilgileri doğrudan burada tanımlayın
// Whitelist rollerini ve log kanalı ID'sini burada ayarlayın
```

4. Slash komutlarını kaydedin
```bash
node src/deploy-commands.js
```

5. Botu başlatın
```bash
npm start
```

## Bilgi

- Bot sadece forum kanallarındaki thread'lerde çalışır.
- Forum sahibi veya admin yetkisine sahip kullanıcılar bu komutları kullanabilir.
- Kullanıcı sadece sahibi olduğu forumlarda bu komutu kullanabilir.
- Engellenen kullanıcılar forumda mesaj gönderdiğinde, mesajları otomatik olarak silinir ve DM üzerinden bilgilendirilir.
- Whitelist rollerine sahip kullanıcılar forum sisteminden engellenemez.
- Tüm engelleme ve engel kaldırma işlemleri belirlenen log kanalına detaylı bilgilerle kaydedilir. 