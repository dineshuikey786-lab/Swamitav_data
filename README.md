# पटवारी प्रगति एवं राजस्व निगरानी डैशबोर्ड (Patwari Progress & Revenue Dashboard)

**वृत्त: तामिया • तहसील: तामिया • जिला: छिंदवाड़ा (म.प्र.)**  
स्वामित्व योजना (SVAMITVA Scheme) एवं आबादी भूमि अधिकार अभिलेख निगरानी प्रणाली।

---

## 🌐 सार्वजनिक लाइव लिंक (Public Live Link)
यह डैशबोर्ड पहले से ही इंटरनेट पर 24/7 लाइव है:
👉 **[सार्वजनिक लाइव डैशबोर्ड लिंक](https://ais-pre-dkicofizgvrhuzhfvnka7t-119625251578.asia-southeast1.run.app)**

- **लॉगिन की आवश्यकता नहीं**: कोई भी नागरिक या प्रशासनिक अधिकारी सीधे देख सकते हैं।
- **सभी फीचर्स चालू**: आधुनिक ग्लासमोर्फिक चार्ट्स (Bar, Pie, Trend Line, Donut), शासकीय PDF रिपोर्ट प्रतिवेदन, एवं 4-शीट एक्सेल (.xlsx) एक्सपोर्ट।

---

## 🚀 Vercel पर डिप्लॉयमेंट गाइड (Deploy to Vercel with your Gmail)

इस रिपॉजिटरी में `vercel.json` और `api/index.ts` पहले से पूरी तरह कॉन्फ़िगर किए जा चुके हैं।

### चरण 1: Vercel पर लॉगिन करें
1. [vercel.com/login](https://vercel.com/login) पर जाएं।
2. **"Continue with Google"** चुनें और अपने जीमेल खाते **`dineshuikey786@gmail.com`** से लॉगिन करें।

### चरण 2: प्रोजेक्ट इंपोर्ट करें (Import Project)
1. Vercel डैशबोर्ड में **"Add New..."** पर क्लिक करें और **"Project"** चुनें।
2. अपने GitHub रिपॉजिटरी को कनेक्ट करके इस प्रोजेक्ट को चुनें।
3. **Framework Preset**: `Vite` (स्वतः डिटेक्ट हो जाएगा)।
4. **Build Command**: `vite build`
5. **Output Directory**: `dist`

### चरण 3: एनवायरनमेंट वेरिएबल्स (Environment Variables)
- `GEMINI_API_KEY`: (AI रेवेन्यू ऑडिट फीचर के लिए अपना जेमिनी एपीआई की जोड़ें)।

### चरण 4: Deploy पर क्लिक करें
- 1 मिनट के भीतर Vercel आपको कस्टम सार्वजनिक URL प्रदान कर देगा (उदा: `https://patwari-dashboard-tamia.vercel.app`)।

---

## 🛠️ मुख्य विशेषताएं
- **आधुनिक ग्लासमोर्फिक चार्ट्स**: Rounded Bar Chart, Revenue Distribution Pie Chart, Multi-Series Smooth Trend Lines, एवं Futuristic Donut Chart।
- **शासकीय प्रशासनिक PDF प्रतिवेदन**: मध्य प्रदेश शासन प्रारूप, हल्का पटवारी रैंकिंग, बॉटलनेक विश्लेषण एवं आधिकारिक हस्ताक्षर ब्लॉक।
- **विस्तृत 4-शीट एक्सेल (.xlsx) एक्सपोर्ट**: सारांश, पटवारी रैंकिंग, दिनांकवार मैट्रिक्स, एवं ग्रामवार मास्टर रजिस्टर।
- **लाइव Google Sheet सिंक**: तामिया वृत्त के आधिकारिक Google Sheet लिंक से ऑटो-सिंक।
