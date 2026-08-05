# Motion Strike

![Motion Strike Logo](assets/images/logo.png)

Motion Strike is a browser-based motion gaming platform where players control games using real hand movements instead of a keyboard, mouse, or traditional controller. A webcam captures the player's hand movements, and MediaPipe Hands detects gestures and hand positions in real time. The detected gestures are converted into game actions.

**Pipeline:** Webcam captures video, MediaPipe performs hand detection, the gesture recognition system interprets the pose, and the result is translated into an in-game action.

---

## Games

### Catch the Eggs
Catch valuable falling eggs while avoiding dangerous bombs. Move your hand left and right to control the basket. Catch normal eggs for points, golden eggs for bonus points, and avoid bombs or you will lose a life.

### Flappy Bird
Control the bird through obstacles and survive as long as possible. Use an open palm to flap and keep the bird in the air. Avoid the pipes to increase your score.

---

## Getting Started

### Deployed Game
[Play](https://fatema-maitham.github.io/motion-strike/)

### Planning Board
[Planning File](./plan.md)

### How to Play
1. Open the game in your browser
2. Allow webcam access when prompted
3. Use hand gestures to control the games, or use keyboard controls if preferred
4. Press H at any time in a game to open the How to Play panel

---

## Gesture Controls

### Shared Menu Gestures (All Games)

| Gesture | Action |
|---|---|
| Thumbs Up | Start / Select |
| OK Sign | Confirm / Open How to Play |
| Wave Hand | Return to Menu |
| Peace Sign | Pause / Resume |
| Pinch | Mute / Unmute Audio |

### Catch the Eggs

| Gesture / Movement | Action |
|---|---|
| Move Hand Left | Move Basket Left |
| Move Hand Right | Move Basket Right |

### Flappy Bird

| Gesture | Action |
|---|---|
| Open Palm | Flap / Jump |
| Closed Fist | Reset |

### Game Selection Hub

| Gesture | Action |
|---|---|
| One Finger | Select Catch the Eggs |
| Peace Sign | Select Flappy Bird |
| Wave | Back to Landing |

---

## Keyboard Controls

### Catch the Eggs

| Key | Action |
|---|---|
| Enter / Space | Start / Restart |
| Arrow Left / A | Move Basket Left |
| Arrow Right / D | Move Basket Right |
| P | Pause / Resume |
| M | Mute / Unmute |
| H | Open How to Play |
| Escape | Back to Menu |

### Flappy Bird

| Key | Action |
|---|---|
| Space | Flap / Start / Restart |
| P | Pause / Resume |
| M | Mute / Unmute |
| H | Open How to Play |
| Escape | Back to Menu |

---

## File Structure

```
motion-strike
├── plan.md                          # Planning document
├── README.md                        # Project documentation
│
├── assets
│   ├── games
│   │   ├── catch-the-eggs.webp      # Game thumbnail
│   │   └── flappy-bird.webp         # Game thumbnail
│   └── images
│       ├── back.png                 # Back button image
│       ├── how-to-play.png          # How to play button image
│       ├── logo.png                 # Main logo
│       ├── logo1.png                # Alternate logo
│       └── play.png                 # Play button image
│
├── catch-the-eggs
│   ├── assets
│   │   ├── fonts
│   │   │   └── PinkLemonade-Regular.ttf   # Game font
│   │   ├── images
│   │   │   ├── background.png             # Game background
│   │   │   ├── bomb.png                   # Bomb object
│   │   │   ├── egg.png                    # Normal egg
│   │   │   ├── farmer-happy.png           # Player happy expression
│   │   │   ├── farmer-Idle.png            # Player idle expression
│   │   │   ├── farmer-sad.png             # Player sad expression
│   │   │   ├── golden-egg.png             # Golden egg, bonus
│   │   │   ├── heart.png                  # Full life heart
│   │   │   └── starparticleeffect.png     # Sparkle effect
│   │   └── sounds
│   │       ├── bgm.mp3                    # Background music
│   │       ├── bomb.wav                   # Bomb catch sound
│   │       └── catch.wav                  # Egg catch sound
│   ├── css
│   │   ├── game.css                       # Canvas styles
│   │   └── style.css                      # HUD and font styles
│   ├── js
│   │   ├── audio.js                       # Audio manager
│   │   ├── collision.js                   # Collision detection
│   │   ├── effects.js                     # Particle effects
│   │   ├── egg.js                         # Falling objects and spawn system
│   │   ├── game.js                        # Main game class and state machine
│   │   ├── levels.js                      # Difficulty progression
│   │   ├── main.js                        # Entry point, input, hand tracking
│   │   ├── player.js                      # Player, farmer, movement and drawing
│   │   └── utils.js                       # Utility functions
│   └── index.html                         # Game page
│
├── css
│   ├── hub.css                            # Game hub page styles
│   └── landing.css                        # Landing page and panel styles
│
├── flappy-bird
│   ├── assets
│   │   ├── images
│   │   │   ├── background.png             # Game background
│   │   │   ├── bottom-pipe.png            # Bottom pipe image
│   │   │   ├── flappy-bird.png            # Bird sprite
│   │   │   └── top-pipe.png               # Top pipe image
│   │   └── sounds
│   │       ├── bgm.mp3                    # Background music
│   │       ├── flap.mp3                   # Flap sound
│   │       ├── hit.mp3                    # Hit or death sound
│   │       └── score.mp3                  # Score point sound
│   ├── css
│   │   ├── game.css                       # Canvas styles
│   │   └── style.css                      # HUD and font styles
│   ├── js
│   │   ├── bird.js                        # Bird physics and drawing
│   │   ├── collision.js                   # Collision detection
│   │   ├── main.js                        # Entry point, game loop, input
│   │   ├── pipe.js                        # Pipe generation and drawing
│   │   └── utils.js                       # Re-exports from shared utils
│   └── index.html                         # Game page
│
├── js
│   ├── hub.js                             # Game hub logic and gesture control
│   └── landing.js                         # Landing page logic and gesture control
│
└── shared
    ├── css
    │   └── shared.css                     # Global styles, layout, camera panel
    ├── fonts
    │   ├── bit5x3.ttf                     # Pixel font for Flappy Bird
    │   └── PinkLemonade-Regular.ttf       # Fun font for Catch the Eggs
    ├── js
    │   ├── gestureSystem.js               # Gesture event system and cooldowns
    │   ├── handTracking.js                # MediaPipe hand tracking and detection
    │   └── utils.js                       # Shared utility functions
    ├── games.html                         # Game selection hub page
    └── index.html                         # Landing page
```

---

## Technologies Used

| Technology | Purpose |
|---|---|
| HTML5 | Page structure and canvas rendering |
| CSS3 | Styling, layout, Flexbox, animations |
| JavaScript ES6+ | Game logic, gesture handling, modules |
| Canvas API | Game rendering for both games |
| MediaPipe Hands | Real-time hand and gesture detection |
| MediaPipe Camera Utils | Webcam access and frame processing |
| Web Audio API | Sound effects and background music |

---

## Attributions
 
| Resource | Source |
|---|---|
| MediaPipe Hands | [mediapipe.dev](https://mediapipe.dev) |
| MediaPipe Camera Utils | [cdn.jsdelivr.net](https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/) |
| Press Start 2P Font | [Google Fonts](https://fonts.google.com/specimen/Press+Start+2P) |
| Pink Lemonade Font | [dafont.com](https://www.dafont.com/pink-lemonade.font?l[]=10&l[]=1) |
| Music | [Pixabay](https://pixabay.com) |
| Art | Baelfin, [baelfin.com](https://www.baelfin.com) |
| Sound Effects | [freesound.org](https://freesound.org) |
 
---

## Why Motion Strike

Traditional browser games rely on keyboards and mice. Motion Strike removes that barrier by letting players use their hands naturally. The webcam becomes the controller, making gaming more physical, accessible, and fun.

---

## Next Steps

- [ ] Add more games to the platform, such as Snake, Pong, and Space Invaders
- [ ] Add a high score leaderboard using local storage
- [ ] Add a difficulty selection screen before each game
- [ ] Add an animated onboarding tutorial for first-time players
- [ ] Improve gesture accuracy with custom trained models
- [ ] Add a sound settings panel with a volume slider
