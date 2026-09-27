# cutterlyai.com

Cutterly-nin saytı — statik HTML, build yoxdur. GitHub Pages `main` branch-dən
birbaşa yayımlayır; quraşdırıcı (`Cutterly.dmg`) bu repo-nun Releases-indədir.

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
cp Cutterly-1.0.7.dmg Cutterly.dmg
gh release create v1.0.7 Cutterly.dmg Cutterly-1.0.7.dmg \
  --repo yasharimamaliyev/cutterly-site --title "Cutterly 1.0.7" --notes "…"
```

Sonra `assets/config.js`-də `version`-u dəyiş. Yükləmə linki
(`…/releases/latest/download/Cutterly.dmg`) həmişə ən son buraxılışı verir —
onu dəyişmək lazım deyil.

## Domen

`cutterlyai.com` DNS-i Hostinger-dədir: kök domen GitHub Pages-in dörd A
qeydinə (`185.199.108–111.153`), `www` isə `yasharimamaliyev.github.io`-ya
baxır. `api.cutterlyai.com` ayrıca serverdir — bu repo ona toxunmur.
