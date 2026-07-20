// ============================================================
//  CONFIGURATION FIREBASE - TRANSPORT DRAA LASFAR & KOUDIAT AICHA
//  Remplacez les valeurs ci-dessous par celles de VOTRE projet
//  Firebase (console.firebase.google.com) si vous voulez des
//  donnees separees de l'application SAMIR.
// ============================================================

const firebaseConfig = {
  apiKey:            "AIzaSyC2UCtTND6K9Q1ZgKxYkl44xu_cz0TknSI",
  authDomain:        "gestion-maintenance-d1dd2.firebaseapp.com",
  projectId:         "gestion-maintenance-d1dd2",
  storageBucket:     "gestion-maintenance-d1dd2.firebasestorage.app",
  messagingSenderId: "905630701263",
  appId:             "1:905630701263:web:06544f767232ebeb2809ba",
  measurementId:     "G-CYW4V9QJ1S"
};

// Initialisation Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Nom de la collection Firestore (isolee de l'app SAMIR)
const COLLECTION = "transport_personnel";

// Active la persistance hors-ligne (cache local automatique)
db.enablePersistence({ synchronizeTabs: true }).catch(function (err) {
  if (err.code === "failed-precondition") {
    console.warn("Persistance hors-ligne: plusieurs onglets ouverts.");
  } else if (err.code === "unimplemented") {
    console.warn("Persistance hors-ligne non supportee par ce navigateur.");
  }
});
