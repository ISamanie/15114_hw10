\# App Specification — Workout Tracker (`default@sdk-58`)



Create a local-first workout tracking mobile app built with React Native, TypeScript, and Expo (`SDK 58`, Expo Router).



\## Overview



A fast, distraction-free strength and workout tracker designed for gym-goers and lifters who want to log training sessions in real time, browse an expandable exercise library, and visualize strength progression over time. All workout data is stored locally on the device for instant offline access without requiring an account.



\## Core Features



\### 1. Exercise Library \& Custom Exercises

\- \*\*Pre-Seeded Catalog:\*\* Ships with a curated starter library of 20+ common exercises categorized by equipment type:

&#x20; - \*\*Free Weight\*\* (e.g., Barbell Bench Press, Dumbbell Curl, Barbell Squat, Deadlift)

&#x20; - \*\*Machine\*\* (e.g., Lat Pulldown, Leg Press, Cable Row, Chest Fly Machine)

&#x20; - \*\*Bodyweight\*\* (e.g., Pull-Ups, Push-Ups, Dips, Planks)

\- \*\*Exercise Metadata:\*\* Every exercise includes:

&#x20; - Name, equipment category (`free\_weight` | `machine` | `bodyweight`), primary muscle group, a concise 1–2 sentence form description, and a thumbnail illustration/icon.

\- \*\*Custom Exercises:\*\* Users can create custom exercises by specifying a name, equipment type, target muscle group, short description, and choosing either a built-in exercise icon or an image from their device gallery (`expo-image-picker`). User-created exercises appear alongside built-in exercises in all search and logging flows.



\### 2. Active Workout Tracking

\- \*\*Session Logging:\*\* Users start a live workout session and add one or more exercises from the library.

\- \*\*Set-by-Set Entry:\*\* Selecting an exercise renders an exercise card block containing a set table:

&#x20; - \*\*Free Weight \& Machine:\*\* Logs `Set #`, `Weight` (lbs/kg), and `Reps`.

&#x20; - \*\*Bodyweight:\*\* Logs `Set #`, `Reps`, and optional `+ Added Weight` (defaults to `0`).

&#x20; - Users can tap \*\*+ Add Set\*\* to append rows (pre-filling weight/reps from the previous set for speed), delete a set, or mark sets complete.

\- \*\*Sequential Exercise Addition:\*\* An inline \*\*+ Add Exercise\*\* search bar/picker sits directly below the active exercise blocks so users can queue their next movement without leaving the session screen.

\- \*\*Session Completion \& Calendar Visualization:\*\*

&#x20; - Saving a workout records the date, duration, exercises, sets, and \*\*Total Session Volume\*\* ($\\sum \\text{weight} \\times \\text{reps}$ across all sets).

&#x20; - A monthly \*\*Workout Calendar\*\* highlights completed workout days with visual badges and displays the session's total volume (and total reps for bodyweight-only sessions) when a date is selected.



\### 3. Exercise-Specific Analytics \& History

\- \*\*Key Metrics Summary:\*\* Each exercise tracks:

&#x20; - \*\*Personal Best (PR):\*\* Heaviest single-set weight lifted (with tie-breaker on highest reps), plus \*\*Max Reps\*\* in a single set (primary PR metric for unweighted bodyweight exercises).

&#x20; - \*\*All-Time Total Volume:\*\* Cumulative $\\text{weight} \\times \\text{reps}$ across all historical sessions.

\- \*\*Progress Graphs:\*\* Interactive time-series line charts allowing users to toggle between \*\*Personal Best Over Time\*\* and \*\*Session Volume Over Time\*\* across date ranges (`1M`, `3M`, `6M`, `All`).

\- \*\*Tabular History Log:\*\* A clean chronological table listing past performances for that exercise (`Date`, `Sets x Reps`, `Top Weight / PR`, and `Session Volume`).



\---



\## Screens \& Navigation



Use \*\*Expo Router\*\* stack navigation rooted at the Main Screen, with modal presentations for exercise creation and workout review.



| Screen / Route | Purpose | Navigation \& Key UI Elements |

|---|---|---|

| \*\*Main Screen\*\* (`index`) | Central dashboard showing training consistency and primary navigation entry points. | - \*\*Workout Calendar:\*\* Monthly grid highlighting workout dates; tapping a highlighted date reveals that day's completed workouts and total volume.<br>- \*\*Primary Navigation Cards:\*\* Two prominent Play Store-style feature cards: \*\*Start Workout\*\* (routes to `workout-tracker`) and \*\*Exercise Data\*\* (routes to `data`). |

| \*\*Data Screen\*\* (`data`) | Searchable directory of all built-in and custom exercises. | - \*\*Live Search Bar:\*\* Filters exercises instantaneously as the user types.<br>- \*\*Category Filter Chips:\*\* Horizontal scrollable pills (`All`, `Free Weight`, `Machine`, `Bodyweight`).<br>- \*\*Recent Searches / Viewed:\*\* Quick-access list displayed under the search bar before typing.<br>- \*\*Header Action:\*\* `+ New Exercise` button (opens `create-exercise` modal).<br>- Tapping any exercise row navigates to `exercise/\[id]`. |

| \*\*Exercise Detail Screen\*\* (`exercise/\[id]`) | Deep-dive analytics and history for a single exercise. | - Header with exercise image, equipment badge, and short description.<br>- Stat summary cards (\*\*Personal Best\*\*, \*\*Total Volume\*\*, \*\*Total Sessions\*\*).<br>- Toggleable \*\*PR / Volume Over Time\*\* line chart.<br>- Scrollable \*\*History Table\*\* (`Date`, `Sets`, `Reps`, `Weight`, `Volume`). |

| \*\*Workout Tracker Screen\*\* (`workout-tracker`) | Live session logger for recording sets, reps, and weights. | - Top bar with live session timer, \*\*Cancel\*\*, and \*\*Finish Workout\*\* button.<br>- Stacked \*\*Exercise Blocks\*\* displaying set rows (`Set`, `Weight`, `Reps`, `Done`) and a `+ Add Set` button.<br>- \*\*Inline Exercise Search/Picker\*\* anchored directly below the active exercise blocks to search and append additional exercises.<br>- Saving persists the session and returns to the Main Screen. |

| \*\*Create Exercise Modal\*\* (`create-exercise`) | Form to add a custom exercise to the local library. | - Inputs for Name, Equipment Type selector, Muscle Group, Description, and Image/Icon picker.<br>- Saves and returns to the previous screen. |



\---



\## Data Model



Store data in a normalized relational schema (using `expo-sqlite` or persisted JSON store) so graphs, PRs, and calendar totals are dynamically derived and stay accurate if workouts are edited or deleted.



```typescript

export type EquipmentType = 'free\_weight' | 'machine' | 'bodyweight';



export interface Exercise {

&#x20; id: string;

&#x20; name: string;

&#x20; equipmentType: EquipmentType;

&#x20; muscleGroup: string;

&#x20; description: string;

&#x20; imageUri: string;          // Bundled asset key or local file URI

&#x20; isCustom: boolean;

&#x20; createdAt: string;         // ISO 8601 timestamp

}



export interface WorkoutSession {

&#x20; id: string;

&#x20; date: string;              // YYYY-MM-DD (indexed for calendar lookup)

&#x20; startedAt: string;         // ISO 8601 timestamp

&#x20; completedAt: string;       // ISO 8601 timestamp

&#x20; totalVolume: number;       // Computed sum of (weight \* reps) across all sets

&#x20; totalSets: number;

}



export interface WorkoutExercise {

&#x20; id: string;

&#x20; sessionId: string;         // FK -> WorkoutSession.id

&#x20; exerciseId: string;        // FK -> Exercise.id

&#x20; orderIndex: number;        // Display order within the session

}



export interface SetEntry {

&#x20; id: string;

&#x20; workoutExerciseId: string; // FK -> WorkoutExercise.id

&#x20; setNumber: number;

&#x20; reps: number;

&#x20; weight: number;            // 0 if unweighted bodyweight

&#x20; volume: number;            // weight \* reps

&#x20; isCompleted: boolean;

}

```



\### Derived Metrics Rules

\- \*\*Exercise Session Volume:\*\* $\\sum \\text{SetEntry.volume}$ for a given `exerciseId` within a single `WorkoutSession`.

\- \*\*Exercise All-Time Volume:\*\* $\\sum \\text{SetEntry.volume}$ across all completed sessions for that `exerciseId`.

\- \*\*Exercise Personal Best (PR):\*\*

&#x20; - If `max(weight) > 0`: Maximum `SetEntry.weight` achieved (ties broken by highest `reps` at that weight).

&#x20; - If `max(weight) === 0` (pure bodyweight): Maximum `SetEntry.reps` achieved in a single set.



\---



\## Design \& Branding



Modeled after the \*\*Google Play Store (Material Design 3)\*\* aesthetic:



\- \*\*Color Palette:\*\*

&#x20; - \*\*Background / Canvas:\*\* Crisp pure white (`#FFFFFF`) with subtle cool-gray secondary surfaces (`#F8F9FA`).

&#x20; - \*\*Primary Accent:\*\* Google Play Emerald Green (`#01875F`) for primary CTAs (`Finish Workout`, active filter pills, calendar active dots, and chart lines), with a soft mint tint (`#E6F4EA`) for selected states and badges.

&#x20; - \*\*Text \& Borders:\*\* High-contrast charcoal (`#202124`) for headings, muted slate (`#5F6368`) for secondary metadata, and `1dp` hairline dividers (`#DADCE0`).

\- \*\*Component \& Layout Patterns:\*\*

&#x20; - \*\*App-Row List Style:\*\* Exercise search results mimic Play Store app rows—a $48 \\times 48\\text{dp}$ rounded-square thumbnail (`borderRadius: 12`) on the left, bold exercise title + equipment/muscle subtitle in the middle, and a subtle chevron or quick-stat pill on the right.

&#x20; - \*\*Elevated \& Outlined Cards:\*\* `16dp` border radius on main navigation cards, workout exercise blocks, and chart containers.

&#x20; - \*\*Filter Chips:\*\* Horizontal scrollable pill chips (`borderRadius: 8`, `1dp` border when inactive, `#E6F4EA` fill with `#01875F` text when active).

&#x20; - \*\*Typography:\*\* Clean geometric sans-serif (`Roboto` on Android, system `SF Pro` on iOS) with bold section headers (`18–20sp`) and tabular numerals (`fontVariant: \['tabular-nums']`) for weights, reps, and volume tables.



\---



\## Acceptance Criteria



\### Exercise Library \& Custom Exercises

1\. On initial launch, the app seeds at least 20 default exercises spanning `free\_weight`, `machine`, and `bodyweight` categories, each populated with a name, muscle group, 1–2 sentence description, and thumbnail image.

2\. Typing in the Data Screen search bar filters the exercise list in real time (case-insensitive substring match) without requiring a submit button tap.

3\. Selecting a category filter chip (`All`, `Free Weight`, `Machine`, `Bodyweight`) filters the list to matching equipment types and combines cleanly with active search text.

4\. When the search input is empty, the Data Screen displays the user's most recently searched or viewed exercises directly beneath the search bar.

5\. Submitting the Create Exercise modal with a valid name, equipment type, muscle group, description, and selected icon or gallery image persists the exercise locally (`isCustom: true`) and makes it immediately searchable in both the Data Screen and Workout Tracker Screen.

6\. Attempting to save a custom exercise without a name is blocked with clear inline validation feedback.



\### Active Workout Tracking

7\. Opening the Workout Tracker Screen starts a live session timer and displays an exercise search/picker.

8\. Selecting an exercise appends an Exercise Block with an initial set row (`Set 1`) containing numeric inputs for `Weight` and `Reps` (`free\_weight` / `machine`) or `Reps` and optional `+ Added Weight` defaulting to `0` (`bodyweight`).

9\. Tapping \*\*+ Add Set\*\* inside an Exercise Block appends a numbered set row pre-filled with the previous set's `Weight` and `Reps`, and supports deleting or toggling completion on individual sets.

10\. The inline \*\*+ Add Exercise\*\* search picker remains positioned directly below all active Exercise Blocks so users can add multiple exercises sequentially within the same session.

11\. Tapping \*\*Finish Workout\*\* persists the session, calculates `totalVolume` as $\\sum (\\text{weight} \\times \\text{reps})$ across all completed sets, and returns to the Main Screen.

12\. Tapping \*\*Cancel\*\* during an active workout with logged sets prompts for confirmation before discarding unsaved data.



\### Main Screen \& Calendar

13\. The Main Screen displays a monthly calendar grid highlighting every date (`YYYY-MM-DD`) on which at least one workout session was completed.

14\. Tapping a highlighted calendar date displays the completed workout(s) for that date along with each session's total volume (and total reps if total volume is `0`).

15\. Tapping the \*\*Start Workout\*\* and \*\*Exercise Data\*\* navigation cards routes directly to `workout-tracker` and `data` respectively.



\### Exercise-Specific Analytics \& History

16\. Tapping any exercise in the Data Screen navigates to `exercise/\[id]` and displays its thumbnail, equipment badge, description, \*\*Personal Best\*\*, \*\*All-Time Total Volume\*\*, and \*\*Total Sessions\*\*.

17\. For exercises where `max(weight) > 0`, Personal Best displays the heaviest single-set weight lifted (ties broken by highest reps); for pure bodyweight exercises (`max(weight) === 0`), Personal Best displays the maximum reps achieved in a single set.

18\. The progress chart on `exercise/\[id]` plots historical data points chronologically and allows toggling between \*\*Personal Best Over Time\*\* and \*\*Session Volume Over Time\*\* across `1M`, `3M`, `6M`, and `All` date ranges.

19\. The history table on `exercise/\[id]` renders every logged appearance of that exercise in reverse chronological order with columns for `Date`, `Sets x Reps`, `Top Weight / PR`, and `Session Volume`.



\### Persistence, Design \& Platform Targets

20\. All exercises, workout sessions, and set entries persist locally across app restarts and work completely offline.

21\. Visual styling adheres to the Google Play Store Material 3 tokens specified above (`#FFFFFF` canvas, `#F8F9FA` secondary surfaces, `#01875F` primary emerald accents, `#DADCE0` `1dp` dividers, $48 \\times 48\\text{dp}$ rounded-square list thumbnails, and tabular numerals).

22\. The application builds and runs without runtime errors on both iOS and Android under Expo `SDK 58`.



\---



\## Platform Targets



\- \[x] iOS

\- \[x] Android

\- \[ ] Web

