import { Component, OnInit } from '@angular/core';
import { SwPush, SwUpdate } from '@angular/service-worker';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'wpa_tes';
  promptEvent: any;
  promptTriggered = false

  constructor(private swUpdate: SwUpdate, private swPush: SwPush) {
    this.swUpdate.checkForUpdate().then((r) => {
      console.log("root rout")
      if (r) {
        console.log("new version avilable")
        window.location.reload();
      }
    })

  }

  ngOnInit(): void {
    window.addEventListener('beforeinstallprompt', (event) => {
      console.log(event)
      // Prevent the mini-info bar from appearing on mobile
      event.preventDefault();
      // Stash the event so it can be triggered later
      this.promptEvent = event;
      // Show your custom install button
      this.showInstallButton();
    });
  }


  requestNotifications() {
    // Check if notifications are supported
    console.log(this.swPush.isEnabled)
    if (this.swPush.isEnabled) {
      // Request permission for notifications
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.subscribeToNotifications();
        } else {
          console.error('Notification permission denied');
        }
      });
    } else {
      console.warn('Notifications not supported in this browser');
    }
  }

  private subscribeToNotifications() {
    // You can use a server endpoint to send the VAPID public key
    const vapidPublicKey = 'BIw2abIB0mCa5LNkulZlMqgLk5fSdPxg6WUzryC9WIKB0IeNY1jxH3Os2fNOEivyd0ZXPsROfOjp3gOMMlGrNdk';

    this.swPush.requestSubscription({
      serverPublicKey: vapidPublicKey
    }).then((subscription: any) => {
      // Send subscription to your server
      navigator.clipboard.writeText(JSON.stringify(subscription)).then(() => {
        alert("your subscription copied to clipboard")
        console.log('Text copied to clipboard');
      }).catch(err => {
        alert(err?.message ?? "something went wrong in clipboard")
        console.error('Could not copy text: ', err);
      });
      console.log('Notification Subscription: ', subscription);
      // You can store this subscription in your backend to send notifications
    }).catch((err: any) => {
      console.error('Could not subscribe to notifications', err);
    });
  }

  showInstallButton() {
    this.promptTriggered = true
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
}
