# Patwari Progress & Revenue Dashboard - Netlify & GitHub Deployment Guide

यह प्रोजेक्ट **Netlify (.netlify.app)** और **GitHub** पर सीधे डिप्लॉय करने के लिए 100% तैयार (Pre-configured) है।

---

## 🚀 1. Netlify पर डिप्लॉय करने की त्वरित विधि (Recommended Flow)

### चरण 1: GitHub पर रिपॉजिटरी बनाएं
1. [github.com/new](https://github.com/new) पर जाएं।
2. रिपॉजिटरी का नाम रखें: `patwari-revenue-dashboard` (या अपनी पसंद का नाम)।
3. इसे **Public** रखें और "Create repository" पर क्लिक करें।

### चरण 2: इस प्रोजेक्ट को अपने GitHub पर पुश करें
टर्मिनल में नीचे दी गई कमांड्स चलाएं (अपने GitHub यूज़रनेम के साथ):

```bash
# 1. अपने रिमोट GitHub रिपॉजिटरी को जोड़ें
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/patwari-revenue-dashboard.git

# 2. कोड को main ब्रांच पर पुश करें
git push -u origin main
```

*(नोट: स्थानीय Git रिपॉजिटरी `git init` और पहला कमिट पहले ही पूरा कर दिया गया है।)*

---

### चरण 3: Netlify पर साइट इम्पोर्ट करें
1. [app.netlify.com](https://app.netlify.com) पर जाएं और अपने GitHub खाते से लॉगिन करें।
2. **"Add new site"** बटन दबाएं और **"Import an existing project"** चुनें।
3. **GitHub** का चयन करें और अपनी रिपॉजिटरी `patwari-revenue-dashboard` चुनें।
4. Netlify स्वचालित रूप से `netlify.toml` को पढ़ लेगा:
   * **Build command**: `npm run build`
   * **Publish directory**: `dist`
   * **Functions directory**: `netlify/functions`
5. **"Deploy patwari-revenue-dashboard"** पर क्लिक करें।

---

### चरण 4: Environment Variables (वैकल्पिक - AI रेवेन्यू ऑडिट हेतु)
1. Netlify डैशबोर्ड में **Site configuration** $\rightarrow$ **Environment variables** पर जाएं।
2. **Add a variable** चुनें:
   * Key: `GEMINI_API_KEY`
   * Value: अपना Gemini API Key दर्ज करें।

---

## 📁 इस प्रोजेक्ट में Netlify के लिए क्या तैयार है?

1. **`netlify.toml`**: बिल्ड सेटिंग्स, पब्लिश डायरेक्टरी `dist`, Node 20 रनटाइम, और SPA रीडायरेक्ट्स कॉन्फ़िगर हैं।
2. **`public/_redirects`**: Vite React SPA के लिए क्लाइंट-साइड राउटिंग (`/* /index.html 200`)।
3. **`netlify/functions/sync-sheet.ts`**: Google Sheets लाइव डेटा सिंक के लिए सर्वरलेस फंक्शन।
4. **`netlify/functions/gemini-analyze.ts`**: AI रेवेन्यू ऑडिट के लिए सर्वरलेस फंक्शन।
5. **Git Repository**: `main` ब्रांच पर स्वच्छ कमिट तैयार है।
