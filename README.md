![Motion Strike Logo](./assets/images/logo.png)

# Motion Strike
**By Fatema Maitham**

Motion Strike is a browser-based motion gaming platform where players control games using hand movements instead of a keyboard or mouse. Using a webcam and MediaPipe Hands, the platform detects hand gestures and translates them into real-time game actions.

---

# General Plan

- The platform contains multiple browser games controlled using hand gestures.
- The webcam captures the player's hand movements.
- MediaPipe Hands detects hand landmarks and recognizes gestures in real time.
- A shared gesture system is used across the platform for navigation.
- Players navigate menus using gestures instead of a keyboard or mouse.
- The platform includes two games: **Catch the Eggs** and **Flappy Bird**.
- Catch the Eggs uses left and right hand movement to control the basket.
- Flappy Bird uses an open palm gesture to flap the bird and a closed fist gesture to reset the game.
- Players can pause, resume, mute audio, and return to the main menu using shared gestures.
- The platform displays scores, lives, and game over screens.
- The project runs entirely in the browser using HTML, CSS, JavaScript, Canvas, and MediaPipe Hands.

---

# User Stories

## Platform

- As a user, I want to see a landing page so I know I am in the Motion Strike platform.
- As a user, I want to choose between different games from the main menu.
- As a user, I want to control the platform using hand gestures instead of a keyboard or mouse.
- As a user, I want to pause and resume the game using a gesture.
- As a user, I want to mute or unmute the audio using a gesture.
- As a user, I want to return to the main menu using a gesture.
- As a user, I want real-time feedback when my hand is detected.

---

## Catch the Eggs

- As a player, I want to move the basket by moving my hand left and right.
- As a player, I want to catch normal eggs to increase my score.
- As a player, I want to catch golden eggs to earn bonus points.
- As a player, I want to avoid bombs because they reduce my lives.
- As a player, I want to see my score update instantly.
- As a player, I want to see my remaining lives.
- As a player, I want the game to get harder over time so I have 
  an increasing challenge.
- As a player, I want the game to end when I lose all my lives.
---

## Flappy Bird

- As a player, I want to flap the bird using an open palm gesture.
- As a player, I want gravity to pull the bird down when no flap gesture is detected.
- As a player, I want to avoid pipes to increase my score.
- As a player, I want the game to end when the bird hits an obstacle.
- As a player, I want to reset the game using a closed fist gesture.
- As a player, I want to see my score while playing.

---

# Pseudocode

## Platform

```text
START application

Initialize MediaPipe Hands

Initialize webcam

Load game assets

Display landing page

WAIT for webcam permission

IF hand is detected
    Enable gesture recognition
ELSE
    Continue searching for hand

WAIT for Thumbs Up gesture

Open game menu

WAIT for game selection

Load selected game
```

---

## Catch the Eggs

```text
Initialize score = 0

Initialize lives = 3

Create basket

Generate falling eggs

Generate falling bombs

WHILE game is running

    Read hand position

    Move basket left or right

    IF basket catches normal egg
        Increase score by 1

    ELSE IF basket catches golden egg
        Increase score by 3

    ELSE IF basket catches bomb
        Remove one life

    IF normal egg reaches bottom
        Remove one life

    IF golden egg reaches bottom
        Remove one life

    Increase falling speed over time

    Update score and lives

    IF lives == 0
        Display Game Over
        Stop game

END WHILE
```

---

## Flappy Bird

```text
Initialize bird

Generate pipes

Initialize score = 0

WHILE game is running

    Detect hand gesture

    IF Open Palm detected
        Bird flaps upward

    ELSE
        Apply gravity

    Move pipes

    Check collision

    IF bird passes a pipe
        Increase score

    IF bird hits pipe OR ground
        Display Game Over
        Stop game

    IF Closed Fist detected
        Reset game

END WHILE
```

---

## Shared Gesture System

```text
Capture webcam frame

Send frame to MediaPipe Hands

Detect hand landmarks

Recognize gesture

IF Thumbs Up
    Start or Select

ELSE IF OK Gesture
    Confirm

ELSE IF Wave
    Return to Main Menu

ELSE IF Peace Sign
    Pause or Resume

ELSE IF Pinch
    Toggle Audio

Repeat every frame
```

---

## Browser Game Flow

```text
START application

Initialize MediaPipe Hands

Initialize webcam

Load game assets

Display landing page

WAIT for webcam permission

IF hand is detected
    Enable gesture recognition

WAIT for Thumbs Up gesture

Open game menu

WAIT for game selection

Load selected game

WHILE game is running

    Capture webcam frame

    Detect hand landmarks

    Recognize gesture

    Update game state

    Render game

END WHILE

Display Game Over

WAIT for restart gesture

Reset game state

Start new game
```
