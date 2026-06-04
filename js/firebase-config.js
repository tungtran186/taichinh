// firebase-config.js - Cấu hình Firebase cho Family Finance Planner

const firebaseConfig = {
    apiKey: "AIzaSyBGaEguv9Dz3kf0QCpJQy6b3jcnPY2HPzE",
    authDomain: "taichinh-3ace6.firebaseapp.com",
    projectId: "taichinh-3ace6",
    storageBucket: "taichinh-3ace6.firebasestorage.app",
    messagingSenderId: "832949742683",
    appId: "1:832949742683:web:f53560e5819c5875b6237e",
    measurementId: "G-HNNKE0EM9Q"
};

// Khởi tạo Firebase App
const firebaseApp = firebase.initializeApp(firebaseConfig);

// Khởi tạo Firestore
const db = firebase.firestore();

// Khởi tạo Analytics (bắt lỗi nếu không hỗ trợ môi trường file://)
let analytics = null;
try {
    analytics = firebase.analytics();
} catch(e) {
    console.warn('Analytics không khả dụng trong môi trường này:', e.message);
}

// Kiểm tra kết nối Firestore ngay khi load
db.collection('taichinh').doc('gia-dinh').get()
    .then(doc => {
        if (doc.exists) {
            console.log('☁️ Firestore kết nối OK - Đã có dữ liệu trên cloud');
            window._firestoreConnected = true;
        } else {
            console.log('☁️ Firestore kết nối OK - Chưa có dữ liệu, sẽ tạo mới');
            window._firestoreConnected = true;
        }
    })
    .catch(err => {
        window._firestoreConnected = false;
        console.error('❌ Firestore LỖI:', err.code, err.message);
        if (err.code === 'permission-denied') {
            console.error('🔒 Security Rules đang chặn! Vào Firebase Console → Firestore → Rules và cập nhật rules.');
        }
    });

console.log("✅ Firebase đã được khởi tạo thành công!");
