importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyCFthhpOGRLq--sQ6w0mPl_a1FbVve9RVg',
  authDomain: 'quinielaexpertos26.firebaseapp.com',
  projectId: 'quinielaexpertos26',
  storageBucket: 'quinielaexpertos26.firebasestorage.app',
  messagingSenderId: '892273945490',
  appId: '1:892273945490:web:7e8487f2d42cd46b696f4b',
})

const messaging = firebase.messaging()

// Manejar notificaciones cuando la app está en segundo plano o cerrada
messaging.onBackgroundMessage(payload => {
  const { title = 'Quiniela Expertos', body = '' } = payload.notification ?? {}
  self.registration.showNotification(title, {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data,
  })
})
