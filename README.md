<h1 align="center">
Undercover word game
</h1>

<h4 align="center">The <a href="https://www.yanstarstudio.com/de/undercover-game" target="_blank">Undercover</a> word exposing game for the web!</h4>

<p align="center">
    <a href="https://undercover.localplayer.dev/">
        <img src="https://img.shields.io/badge/Play-now-blue.svg?style=shields"
            alt="Gitter">
  </a>
  <a href="https://github.com/antebrl/undercover-word-game/actions/workflows/deploy.yml">
    <img src="https://github.com/antebrl/undercover-word-game/actions/workflows/deploy.yml/badge.svg"
         alt="Gitter">
  </a>
</p>

<!-- Add a gif video here -->
<!-- ![screenshot](https://raw.githubusercontent.com/amitmerchant1990/electron-markdownify/master/app/img/markdownify.gif) -->


This is a web-version of the popular [Undercover App](https://play.google.com/store/apps/details?id=com.yanstarstudio.joss.undercover). I made this, so that you can play Undercover remotely with your friends. [Play the game yourself](https://undercover.localplayer.dev/) together with your friends or with seperate browser tabs.

Undercover is a social deduction word game similar to **Werewolf** or **Among Us**.

## Explanation 
A small group of Impostors has appeared in the game. They have a different word than the others and must hide. Civilians have to discover them.


### Roles and Goals
There are 3 groups in the game: Civilians, Undercover and Mr.White. The majority of the residents are the peace-loving Civilians. There are up to two groups of Impostors: Undercover and Mr.White.

<p align="center">
  <img src="./docs/ressources/civilians-explanation.png" width="300">
  <img src="./docs/ressources/undercover-explanation.png" width="300">
  <img src="./docs/ressources/mrwhite-explanation.png" width="300">
</p>

----
### Get your secret word
At the beginning of the game, everyone receives a secret word. Each game uses a pair of secret words. Remember to keep your secret word hidden from the others.

Civilians receive the same secret word. Undercovers receive a word slightly different from the Civilians'. Mr.Whites don't receive any word. At this moment, you don’t know if you are a Civilian or an Undercover.

----
### Gameplay
**Description Phase** <br>
As soon as everyone has received their secret word, a random player is assigned to start describing their word. One by one, everyone describes their word using a word or phrase. Mr.White needs to improvise, since he/she doesn't have a word.

Use this phase to disclose enough info to find your allies but hide the specifics from Mr.White.

**Discussion Phase** <br>
Once the round of description is complete, players discuss and debate about who they think are the Impostors or the Civilians.

Civilians and Undercovers should use this phase to gather more clues to discover their own identity, build alliances and identify enemies. Meanwhile, for Mr.White, it is the best time to dig deeper on the Civilians' secret word.

Remember the bottom line: don't expose yourself unnecessarily  too early! Use your charm to tilt the odds in your favour.

**Elimination Phase** <br>
When the discussion phase ends, all remaining players vote for one player they want to oust. Remember, players that were already ousted can't cast their votes anymore.

The player with the most votes will be ousted from the game! Unless the voted player turns out to be Mr.White! In this case, he/she still has 1 chance to guess the Civilian word. If he/she guesses the Civilian word correctly, Mr.White wins immediately!

If the victory condition of the game is not met after the elimination phase, repeat the above 3 phases until one of the groups (Civilian, Undercover or Mr.White) wins the game.

----
### Victory
1. **Civilians** win if they eliminate all Undercovers and Mr.Whites.
2. The **Impostors** (Undercovers and/or Mr.Whites) win if they survive until only 1 Civilian is left.
3. **Mr.White** also wins if they guess the Civilians’ word correctly.

## Self-Host

If you want to run the web-project yourself, you can follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone https://github.com/antebrl/undercover-word-game.git

# Step 2: Install the necessary dependencies.
npm i

# Step 3: Start the development server with auto-reloading and an instant preview.
npm run dev
```
Access at http://localhost:8081

This project works through peer-to-peer WebRTC communication with [peerJs](https://github.com/peers/peerjs).

## Contribute & Support
If you like the game and want to support it, please leave a ⭐.
Contributions such as adding new word-pairs and translation are always welcomed.