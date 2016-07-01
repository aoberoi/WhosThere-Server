# Who's There

Who's There is a sample video calling service built using the OpenTok communications platform
from [TokBox](https://tokbox.com).

**TODO**: application icon, screenshots

Key features:
*  One-to-one video calling.
*  [Android App](https://github.com/aoberoi/WhosThere-Android)
  -  Live video preview for incoming calls (inspired by [Knock Knock in Duo](https://www.youtube.com/watch?v=CIeMysX76pM)).
  -  Respond to an incoming call even when the device is locked.
  -  Keep calls active while the application is in the background.
  -  Compatible on devices with Android Kit Kat (v4.4) or greater.
*  Automatic user and device registration.

Who's There is built from several components and cloud services working together:
*  [OpenTok](https://tokbox.com/) (for voice and video communications)
*  [Firebase](https://firebase.google.com/) (for storage, authentication, and push messaging)
*  [Server application](#whos-there-server) (for call management and orchestration)
*  Client application (for user interaction) -- [Android](https://github.com/aoberoi/WhosThere-Android)

## Setup

In order to set up the service, you first need to configure the cloud services. Then you will set up
the server application, and finally the client application.

### OpenTok

1.  If you have not already, [sign up](https://tokbox.com/account/user/signup) for a TokBox Account.
2.  Once signed in, create a new Project by clicking the "Add Project" button.

### Firebase

1.  If you have not already, [sign up](https://firebase.google.com/console/) for a Firebase Account.
2.  Visit the [console](https://console.firebase.google.com/) and create a new Project.
3.  Click on the Auth section, and then select the Sign-in Method tab. Enable the Anonymous sign-in
    provider.
4.  Click the Database section, and then select the Rules tab. Replace the contents in the editor
    the contents of the `support/firebase-database-rules.json` file in this repository.

### Server application

Follow the instructions in the [Server Setup](#setup-1) section.

### Client application

Follow the instructions in the [Android Setup](https://github.com/aoberoi/WhosThere-Android#setup)
section.

---

# Who's There (Server)

A component of the Who's There sample video calling service.

Responsibilities of this component:
*  Transform Call Requests into Calls.
*  Implement the OpenTok Server SDK to create a session for each Call and generate a token for each
   participant in the call.
*  Deliver push notifications to each participant in a Call using Firebase Cloud Messaging.
*  Access and manipulate data in the Firebase Realtime Database (using Administrative Privileges).

Additional features:
*  Prepared for easy deployment on [Heroku](https://heroku.com).
*  Built using ES 2015 style JavaScript on [Node.js](https://nodejs.org) v6 LTS.

**TODO**: block diagram

## Setup

### Configuration

This application reads its configuration from environment variables. A template for the environment
variables used can be found in the `.env.sample` file in this repository. It is recommended to make
a copy of this file named `.env`, and then fill in the missing values within your copy.

1.  Login to your TokBox Account, open the Project. Store the **API Key** and **API Secret** in the
    `OPENTOK_KEY` and `OPENTOK_SECRET` environment variables respectively.
2.  Login to your Firebase Console, open the Project. Click on the Database section. In the Data
    tab, copy the database URL and store it in the `FIREBASE_URL` environment variable.
3.  From within the Firebase Console, click on Settings (gear icon) and then Project Settings.
    Select the Cloud Messaging tab. Store the value under **Server Key** in the
    `FIREBASE_SERVER_KEY` environment variable.
4.  Follow the instructions to [Add Firebase to your Server app](https://firebase.google.com/docs/server/setup#add_firebase_to_your_app).
    After downloading the JSON file, store the contents of it in the `FIREBASE_SERVICE_ACCOUNT`
    environment variable. A [helper script](#appendix-a-service-account-json-helper) is available
    below.

### Deployment

For your convenience, this component can be deployed to Heroku with one click:

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

Fill in the Config Variables with the values obtained from the [instructions above](#configuration).

**Note**: Deploying to Heroku requires [signing up for a Heroku Account](https://signup.heroku.com).
This is great for trying out Who's There because its free for low usage.

You can also deploy to any other infrastructure you choose. The main runtime requirement is Node v6.

### Development

1.  Clone this repository to your local machine. Open a terminal and navigate to the project
    directory.
2.  Follow the [configuration instructions](#configuration) above to complete a `.env` file, or
    set the appropriate environment variables.
3.  (Optional) If using [nvm](https://github.com/creationix/nvm) to select the appropriate node
    version (recommended), switch by using the command line: `nvm use`.
4.  Install the dependencies by using the command line: `npm install`.
5.  Start the server process by using the command line: `npm start`.

## Appendix A: Service Account JSON Helper

Taking the downloaded service account JSON file and turning it into a string that can be set to
an environment variable can be less than straight forward. This project includes a helper script
that can make this simpler. Start by placing the downloaded JSON file in the project directory with
the name `serviceAccount.json`.

*  To add the environment variable to a `.env` file, run the following command line:
   ``echo FIREBASE_SERVICE_ACCOUNT=`./bin/sa` >> .env``.
*  To set a Heroku config var, run the following command line:
   ``heroku config:set FIREBASE_SERVICE_ACCOUNT=`./bin/sa```
*  To set an environment in your shell, run the following command line:
   ``export FIREBASE_SERVICE_ACCOUNT=`./bin/sa```
