import { AfterViewInit, Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { SwPush, SwUpdate } from '@angular/service-worker';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit ,AfterViewInit {
  title = 'wpa_tes';
  promptEvent: any;
  promptTriggered = false
  isInstalled = false;
  subscriptionText = ""
  constructor(private swUpdate:SwUpdate, private swPush: SwPush) {
    this.isInstalled = this.isPwaInstalled()
  }

  ngAfterViewInit(): void {
    this.showInstallationUp()
    this.checkServiceWorker()
  }

  ngOnInit(): void {

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.promptEvent = event;
      this.showInstallButton();
    
      this.showInstallationUp()
      this.checkServiceWorker()
    });
  }

  isPwaInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches;
  }

  getUniqueIdentifier() {
    // Check if identifier already exists in localStorage
    let identifier = localStorage.getItem('deviceId');
    if (!identifier) {
      identifier = 'device-' + Date.now(); 
      localStorage.setItem('deviceId', identifier);
    }
    return identifier;
  }

  checkNotificationSubscription() {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    navigator.serviceWorker.ready.then((registration) => {
      return registration.pushManager.getSubscription();
    })
      .then((subscription) => {
        if (subscription) {
          console.log('User is subscribed:', subscription);
        } else {
          console.log('User is not subscribed.');
        }
      })
      .catch((error) => {
        console.error('Error checking subscription:', error);
      });
  } else {
    console.warn('Push messaging is not supported in this browser.');
  }
}

  requestNotifications() {
    // Check if notifications are supported
    if (this.swPush.isEnabled) {
      // Request permission for notifications
      Notification.requestPermission().then(permission => {
        console.log('permission: ', permission);
        if (permission === 'granted') {
          this.subscribeToNotifications()
        } else {
          console.error('Notification permission denied');
        }
      });
    } else {
      alert("swPush is not enabled")
      console.warn('Notifications not supported in this browser');
    }
  }

   isIos(){
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
  }

  private subscribeToNotifications() {
    // You can use a server endpoint to send the VAPID public key
    const vapidPublicKey = 'BIw2abIB0mCa5LNkulZlMqgLk5fSdPxg6WUzryC9WIKB0IeNY1jxH3Os2fNOEivyd0ZXPsROfOjp3gOMMlGrNdk';

    this.swPush.requestSubscription({
      serverPublicKey: vapidPublicKey
    }).then((subscription: any) => {
      // Send subscription to your server
    
      this.subscriptionText = JSON.stringify(subscription, null, 2)
      console.log('Notification Subscription: ', subscription);
      // You can store this subscription in your backend to send notifications
    }).catch((err: any) => {
      alert(`subscription error ${err?.message}`)
      console.error('Could not subscribe to notifications', err);
    });
  }

  showInstallButton() {
    this.promptTriggered = true
  }

  checkServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then(registration => {
          console.log('Service Worker is ready:', registration);
          this.requestNotifications()
        })
        .catch(err => {
          console.error('Service Worker not ready:', err);
        });
    } else {
      alert("Service workers are not in navigator.")
    }
  }
  
  copyToClipboard() {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = this.subscriptionText;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
  }

  installApp() {
    if (this.promptEvent) {
      // Show the install prompt
      this.promptEvent.prompt();
      // Wait for the user to respond to the prompt
      this.promptEvent.userChoice.then((choiceResult: { outcome: string; }) => {
        console.log(choiceResult)
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the A2HS prompt');
        } else {
          console.log('User dismissed the A2HS prompt');
        }
        this.promptEvent = null; // Clear the stored prompt event
      });
    }
  }

  showInstallationUp() {
    const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator.standalone);
    const isAppInstalledOnIos = this.isIos() && isInStandaloneMode();
    const isChromeOnWindows = /chrome/i.test(navigator.userAgent) && /windows/i.test(navigator.userAgent);
   
    if (isAppInstalledOnIos) {
      console.log('App is installed on the home screen');
    } else {
      // if (!isChromeOnWindows) {
        
        if (window.AddToHomeScreenInstance) {
          window.AddToHomeScreenInstance.show();
        }
      // }
    }
  }
}
