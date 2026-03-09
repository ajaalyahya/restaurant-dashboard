# Menu OS — لوحة تحكم إدارة القائمة

نظام إدارة قائمة احترافي مبني بـ React و Firebase.

---

## 🚀 خطوات التشغيل

### 1. تثبيت المتطلبات
```bash
npm install
```

### 2. إعداد Firebase

افتح الملف `src/firebase/config.js` واستبدل القيم بإعدادات مشروعك:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

تجد هذه القيم في:
**Firebase Console → Project Settings → Your Apps → SDK setup and configuration**

### 3. إعداد Firebase Authentication

في **Firebase Console → Authentication → Sign-in method**:
- فعّل **Email/Password**

ثم أنشئ مستخدماً من **Users tab**.

### 4. إعداد Firestore

في **Firebase Console → Firestore Database**:
- أنشئ قاعدة البيانات
- ابدأ بوضع **test mode** للتطوير

### 5. تشغيل المشروع
```bash
npm start
```

---

## 📁 هيكل المشروع

```
src/
├── firebase/
│   └── config.js          # إعدادات Firebase
├── context/
│   └── AuthContext.js     # حالة المصادقة
├── components/
│   ├── PrivateRoute.js    # حماية الصفحات
│   ├── Sidebar.js         # الشريط الجانبي
│   └── Modal.js           # نافذة النموذج
├── pages/
│   ├── Login.js           # تسجيل الدخول
│   ├── DashboardLayout.js # هيكل لوحة التحكم
│   ├── Home.js            # الصفحة الرئيسية
│   ├── Categories.js      # إدارة الأصناف
│   └── Products.js        # إدارة المنتجات
├── styles.css             # التصميم الكامل
├── App.js                 # التوجيه الرئيسي
└── index.js               # نقطة البداية
```

---

## 🗄️ هيكل Firestore

### Collection: `categories`
| الحقل | النوع | الوصف |
|-------|-------|-------|
| name | string | اسم الصنف |
| imageUrl | string | رابط صورة الصنف |

### Collection: `products`
| الحقل | النوع | الوصف |
|-------|-------|-------|
| name | string | اسم المنتج |
| desc | string | وصف المنتج |
| price | number | السعر |
| cal | number | السعرات الحرارية |
| img | string | رابط الصورة |
| category | string | اسم الصنف |

---

## ✨ المميزات

- ✅ تسجيل دخول آمن بـ Firebase Auth
- ✅ Protected Routes
- ✅ CRUD كامل للأصناف والمنتجات
- ✅ تحديث فوري بدون refresh
- ✅ تصميم داكن احترافي
- ✅ دعم اللغة العربية RTL
- ✅ متجاوب مع الجوال
