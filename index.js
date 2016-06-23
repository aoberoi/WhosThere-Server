const http = require('http');
const express = require('express');
const firebase = require('firebase');
const FCM = require('fcm-push');
const OpenTok = require('opentok');
const set = require('lodash.set');
const unset = require('lodash.unset');
const cloneDeep = require('lodash.clonedeep');

/**
 * Application initialization
 */
const app = express();

app.get('/', (req, res) => {
  res.send('Hello world!');
});

/**
 * OpenTok initialization
 */

const opentokKey = process.env.OPENTOK_KEY;
const opentok = new OpenTok(opentokKey, process.env.OPENTOK_SECRET);

function createOpenTokSession() {
  return new Promise((resolve, reject) => {
    opentok.createSession((error, session) => {
      if (error) {
        reject(new Error('could not create opentok session'));
      } else {
        console.log('opentok session created', session.sessionId);
        resolve(session);
      }
    })
  });
}


/**
 * Firebase initialization
 */
firebase.initializeApp({
  databaseURL: process.env.FIREBASE_URL,
  // TODO: figure out how this can be done without hitting the filesystem (for deployment targets like Heroku)
  serviceAccount: 'serviceAccount.json'
});
const fcm = new FCM(process.env.FIREBASE_SERVER_KEY);

const db = firebase.database();
const callRequests = db.ref('/callRequests');
const users = db.ref('/users');
const calls = db.ref('/calls');

function deviceTokenFromUserId(userId) {
  return new Promise((resolve, reject) => {
    users.child(userId).once('value', userSnapshot => {
      const deviceToken = userSnapshot.val();
      if (!deviceToken) {
        reject(new Error('user not found'));
      } else {
        console.log('device token retrieved', userId, deviceToken);
        resolve(deviceToken);
      }
    });
  });
}

function sendDataMessage(device, data) {
  console.log('sending data message', device, data);
  return new Promise((resolve, reject) => {
    fcm.send({
      to: device,
      priority: 'high',
      data,
      // time_to_live: 0,
    }, (error, response) => {
      if (error) {
        reject(error);
      } else {
        resolve(response);
      }
    });
  });
}

function cpAndSet(obj, path, value) {
  const objCopy = cloneDeep(obj);
  set(objCopy, path, value)
  return objCopy;
}

function addIdentityToCallMessage(callMessage, key, userId, opentokSession) {
  return cpAndSet(
    cpAndSet(callMessage, `${key}.id`, userId),
    `${key}.opentokToken`,
    opentokSession.generateToken({
      data: JSON.stringify({ userId: userId })
    })
  );
}

callRequests.on('child_added', newRequestSnapshot => {
  const newCallRequest = newRequestSnapshot.val();
  const newCallRequestId = newRequestSnapshot.key;
  console.log('new call request', newCallRequest);

  // As soon as this call request is acknowledged by this server, it is removed from the collection
  // TODO: handle errors
  newRequestSnapshot.ref.remove().then(() => {

    // Look up device token values needed to address the FCM messages
    const recipientDeviceTokenPromise = deviceTokenFromUserId(newCallRequest.to);
    const senderDeviceTokenPromise = deviceTokenFromUserId(newCallRequest.from);

    // Create an OpenTok session for this call
    const opentokSessionPromise = createOpenTokSession();

    // TODO: handle errors
    Promise.all([recipientDeviceTokenPromise, senderDeviceTokenPromise, opentokSessionPromise]).then(([recipientDeviceToken, senderDeviceToken, opentokSession]) => {
      const call = {
        to: newCallRequest.to,
        from: newCallRequest.from,
        opentokSession: opentokSession.sessionId,
        opentokKey,
        initiatedAt: newCallRequest.timestamp,
        requestId: newCallRequestId,
      };

      // Save the call back to the database
      const newCallRef = calls.push(call);
      newCallRef.then((arg) => {
        console.log('call created');
        // Send both parties an FCM message about the call
        const callMessage = set({}, newCallRef.key, call);
        Promise.all([
          sendDataMessage(recipientDeviceToken, addIdentityToCallMessage(callMessage, newCallRef.key, call.to, opentokSession)),
          sendDataMessage(senderDeviceToken, addIdentityToCallMessage(callMessage, newCallRef.key, call.from, opentokSession))
        ]).catch(error => {
          // TODO: handle this more definitively (GC NotRegistered?)
          console.error(error);
        })
      });
    });
  });
});

/**
 * Server initialization
 */
const server = http.createServer(app);
const port = parseInt(process.env.PORT || '3000', 10);

server.listen(port);
server.on('error', err => {
  switch (err.code) {
    case 'EACCES':
      console.error(`${port} requires elevated privileges`);
      break;
    case 'EADDRINUSE':
      console.error(`${port} is already in use`);
      break;
  }
  process.exit(1);
});
server.on('listening', () => {
  console.log(`Listening on ${port}`)
})
