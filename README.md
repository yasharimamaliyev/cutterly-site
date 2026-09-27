# cutterlyai.com

Cutterly-nin saytı — statik HTML, build yoxdur. GitHub Pages `main` branch-dən
birbaşa yayımlayır; quraşdırıcı saytın özündədir: `download/Cutterly.dmg`
→ `https://cutterlyai.com/download/Cutterly.dmg`. Müştəri heç yerdə GitHub-a
yönləndirilmir (montajçının qərarı, 2026-09-27).

## Harada nə dəyişir

| Nə | Fayl |
|---|---|
| Qiymət, saat, versiya, yükləmə linki, support e-poçtu | `assets/config.js` — **yeganə yer** |
| İngiliscə mətn | səhifənin öz HTML-i (`index.html`, `download/`, `contact/`) |
| Azərbaycanca və rusca mətn | `assets/i18n.js` (açar HTML-dəki `data-i18n` ilə eynidir) |
| Terms / Privacy / Refund | `terms/`, `privacy/`, `refund/` — yalnız ingiliscə |
| Görünüş | `assets/style.css`, şriftlər `assets/fonts/`, loqo `assets/brand/` |

Hər dəyişiklikdən sonra:

```bash
node scripts/check.mjs
```

Tərcüməsi olmayan açar, səhifəyə sabit yazılmış qiymət, təchizatçı adı və ya
qırıq link olsa, düşür.

## Yeni versiya buraxmaq

```bash
cp ../multicam-public/dist/Cutterly-1.0.8.dmg download/Cutterly.dmg
```

Sonra `assets/config.js`-də `version`-u və bütün səhifələrdəki `?v=` rəqəmini
dəyiş (`node scripts/check.mjs` unudulanı göstərir),
commit və push. Link (`downloadUrl`) dəyişmir. Köhnə versiyalar saytda
saxlanmır; lazım olsa `multicam-public/dist/`-dədir.

## Domen

`cutterlyai.com` DNS-i Hostinger-dədir: kök domen GitHub Pages-in dörd A
qeydinə (`185.199.108–111.153`), `www` isə `yasharimamaliyev.github.io`-ya
baxır. `api.cutterlyai.com` ayrıca serverdir — bu repo ona toxunmur.
