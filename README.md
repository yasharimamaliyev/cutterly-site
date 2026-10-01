# cutterlyai.com

Cutterly-nin saytı — statik HTML, build yoxdur. GitHub Pages `main` branch-dən
birbaşa yayımlayır; quraşdırıcılar saytın özündədir: `download/Cutterly.dmg`
(macOS) və `download/Cutterly-Setup.exe` (Windows) →
`https://cutterlyai.com/download/Cutterly.dmg` /
`https://cutterlyai.com/download/Cutterly-Setup.exe`. Müştəri heç yerdə
GitHub-a yönləndirilmir (montajçının qərarı, 2026-09-27).

## Harada nə dəyişir

| Nə | Fayl |
|---|---|
| Qiymət, saat, versiya, yükləmə linki, support e-poçtu | `assets/config.js` — **yeganə yer** |
| İngiliscə mətn | səhifənin öz HTML-i (`index.html`, `download/`, `contact/`) |
| Azərbaycanca və rusca mətn | `assets/i18n.js` (açar HTML-dəki `data-i18n` ilə eynidir) |
| Terms / Privacy / Refund | `terms/`, `privacy/`, `refund/` — yalnız ingiliscə |
| Görünüş | `assets/style.css`, şriftlər `assets/fonts/`, loqo `assets/brand/` |
| Söhbət vidceti (mətnləri 3 dildə faylın içindədir) | `assets/chat.js`, `assets/chat.css` |
| Söhbətin serveri, Telegram bot adı | `assets/config.js` → `chatEndpoint`, `telegramBot` |

Söhbətin cavabları `api.cutterlyai.com/site-chat`-dən gəlir (server
`site_chat.py`, bilik bazası `site_chat_guide.md` — məhsul dəyişəndə orada
yenilə). `telegramBot` boşdursa «İnsanla danış» e-poçt açır.

Hər dəyişiklikdən sonra:

```bash
node scripts/check.mjs
```

Tərcüməsi olmayan açar, səhifəyə sabit yazılmış qiymət, təchizatçı adı və ya
qırıq link olsa, düşür.

## Yeni versiya buraxmaq

```bash
cp ../multicam-public/dist/Cutterly-<versiya>.dmg download/Cutterly.dmg
cp ../multicam-public/dist/Cutterly-Setup.exe download/Cutterly-Setup.exe
```

Sonra `assets/config.js`-də `version`-u və bütün səhifələrdəki `?v=` rəqəmini
dəyiş (`node scripts/check.mjs` unudulanı göstərir),
commit və push. Linklər (`downloadUrl`, `windowsDownloadUrl`) dəyişmir. Köhnə
versiyalar saytda saxlanmır; lazım olsa `multicam-public/dist/`-dədir.

## Domen

`cutterlyai.com` DNS-i Hostinger-dədir: kök domen GitHub Pages-in dörd A
qeydinə (`185.199.108–111.153`), `www` isə `yasharimamaliyev.github.io`-ya
baxır. `api.cutterlyai.com` ayrıca serverdir — bu repo ona toxunmur.
