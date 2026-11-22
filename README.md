README.md: Located at the repository root. Include:
What your app does and why you chose this idea (1-2 sentences). Don't use AI to write this.

My app is a workout tracker app, I chose this idea because I've used apps like these in the past 
but most useful features are locked behind paywalls or the app is riddled with pop-up ads. The
app allows you to log your workout and track your progress in individual exercises, it also has
options for data visulization that help users see how they are progressing.

A description of each screen and what the user can do on it. Don't use AI to write this.

Homescreen - Main naviation screen, features blocks to other pages as well as a calendar view of past workouts. Other pages linked include the add workout page, and the view exxercise data page.

View Exercise Data - Allows users to add new exercises to their catalogue and filter exercises
for viewing. Once a user selects an exercises a new page opens with logged data such as the users personal best, their total volume across time, the total number of sessions they've done this workout. Personal best and session volume can also be plotted on a graph with adjustable time bounds for easy viewing.

How to set up and run the app, including which Expo SDK version and which device or simulator you used. You may use AI to write this piece but you are responsible for its accuracy.

   Workout Tracker uses **Expo SDK 58**. I ran it on an **Android phone using Expo Go**.

   1. Install Node.js 26 LTS on your computer and Expo Go from Google Play on your phone. Sign in to Expo Go with a free Expo account.
   2. Clone this repository and open a terminal in the directory containing `package.json`. Run the commands below and use the same Expo account when you sign in from the terminal.

      ```bash
      npm install
      npx expo login
      npx expo start
      ```

   3. Connect your phone and computer to the same Wi-Fi network. In Expo Go, scan the QR code printed in the terminal to open Workout Tracker.

   If the local Wi-Fi connection fails, restart the server with `npx expo start --tunnel` and scan the new QR code.


One thing you learned about mobile development that surprised you. Don't use AI for this.

I find it interest how similar native apps are to html. It seems like they share alot of the same structures, ie functions written in java, style specified in css and then the markup in tsx or html. Even alot of the functions share the same purpose with slightly different names for example input vs TextInput, button vs pressable, div vs view, onclick or onpress.
