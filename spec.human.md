# I ran the spec below through gemini to create one that is more succinct for actual use in my project.

default@sdk-58 

# App Specification
Create a workout tracking app on React Native using Expo.

## Overview

<!-- Brief description of the app, its purpose, and target audience. -->
The app will act as a workout tracking app, 
it should keep track of user workouts as well as workout specific details such as 
total volume, personal best, graph showing pr or volume over time, and other details. 

## Core Features

Exercises
    The app allows users to select exercises to add to their workout, this list should include free weight, machine and
    body weight versions of the exercises. Users should be allowed to add their own exercises to this list. Include a short description
    of each workout as well as an image.

Exercise Specific Tracking
    The app will keep track of personal bests, total volume, reps and sets across for each exercise. Users should be able to 
    graph their personal best and volume across time. They should be able to see a record of their reps and sets in a table like format.

Workout tracking 
    Allow users to log their workout, the user will be able to select an exercise from the previously mentioned list (included user added workouts)
    and enter reps, sets, and weight if appropriate. These should be logged under one session.
    Users should also be able to see a calendar like visualization of which days they worked out, including the total volume in that session.

## Screens & Navigation

<!-- Describe the main screens and how users navigate between them. -->

| Screen | Purpose | Navigation |
|--------|---------|------------|
| main screen               |  Allow users to navigate to other screens such as start a workout tracker screen or data screen. Should include the workout       
                                calendar described above, and two containers for moving to the other screens.
| data screen               |  Should include a search bar that allows for easy filtering of results, a results section under the search bar
                            that includes the most recent search, and actively filters as the user writes in the search bar. Once the user selects
                            an exercise open a new screen which displays the exercise specific data i've described above.
| workout tracker screen    |   Allows user to track a new session, must allow searching for exercises, once a user selects an exercise, ask for reps and weigth
                            (if applicable) and an option to add another set, this should appear as a block on the screen below that block the search option must 
                            be placed to allow for other exercises to be added on.

## Data Model

<!-- Define the key entities and their relationships. -->
Workouts -  User sessions, should be viewable in the calendar, workouts completed and total volume
Exercises - user defined or default, tracks volume, total volume across time. Personal best, and (reps and sets), each marked with the date of the workout. should also be graphable.

## Design & Branding

Model it after the android play store.

## Platform Targets

- [x] iOS
- [x] Android
- [ ] Web


Acceptance Criteria

1. The app should have at least 20 exercises available to the user, in 3 different catagories, free weight, machine and bodyweight.

2. The app should have a dedicated data screen with a case insensitive string matching that does not require the user to enter or 
submit to view results.

3. Data screen should allow filtering by exercise type.

4. An empty search should feature the most recently used exercises.

5. Allow users to create their own exercises, let them input their own equipment type, targeted muscle, description and icon.

7. The workout tracker screen should include a live timer as well as a exercise search bar.

8. Adding a workout to the workout tracker should create a scrollable block the the active session.

9. The main screen should display a calendar with markers on days in which the user has completed a workout.

10. Taping a day on the calendar should show details about the workout that day such as total volume and session length.

11. The user should be able to select an exercise on the data screen and be sent to a new screen with relavent data such as
a description, an icon, pr, total volume, and total sessions.

12. Users should be able to plot volume per session and pr across time on different time ranges, such as 1month to All time.

13. All user data should persists across app restarts.


I ran the spec above through gemini to create one that is more succinct for actual use in my project.


