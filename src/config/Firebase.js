import firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";
import "firebase/storage";

const Firebase = firebase.initializeApp({
    apiKey: "AIzaSyBQHoE58n61w6TAQa2mMq5qmWsC9KcXsCY",
    authDomain: "react-app-ngobrol.firebaseapp.com",
    databaseURL: "https://react-app-ngobrol.firebaseio.com",
    projectId: "react-app-ngobrol",
    storageBucket: "react-app-ngobrol.appspot.com",
    messagingSenderId: "1916676925",
    appId: "1:1916676925:web:b6e46046ce42737452b354",
});

export default Firebase;
