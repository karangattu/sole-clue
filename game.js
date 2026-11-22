import { birds, habitats } from './birds.js';

const game = document.querySelector('#game');
const landing = document.querySelector('#landing');
const navPlay = document.querySelector('#nav-play');
const questionsPerGame = 4;
let rounds = [];
let guesses = [];
let roundIndex = 0;

function shuffle(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]];
  }
  return shuffled;
}

function icon(name) {
  return `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
}

function art(file, alt) {
  return `<img src="./assets/art/${file}.webp" alt="${alt}">`;
}

function focusHeading(heading, scrollToTop = true) {
  heading.focus({ preventScroll: true });
  if (scrollToTop) window.scrollTo(0, 0);
}

function startGame() {
  rounds = shuffle(birds).slice(0, questionsPerGame).map(bird => ({
    ...bird,
    choices: shuffle([bird.habitat, ...bird.distractors]),
  }));
  guesses = [];
  roundIndex = 0;
  showClue();
}

function showClue() {
  const round = rounds[roundIndex];
  const steps = rounds.map((_, index) => {
    const state = index === roundIndex ? 'current' : index < roundIndex ? 'complete' : '';
    return `<span class="step ${state}"></span>`;
  }).join('');

  game.innerHTML = `
    <div class="round-tracker">
      <span id="question-progress">Question ${roundIndex + 1} of ${rounds.length}</span>
      <div class="steps" aria-hidden="true">${steps}</div>
    </div>
    <div class="round-layout">
      <figure class="specimen">
        ${art('feet-' + round.id, round.feet)}
        <figcaption><span class="plate-rule"></span> Mystery feet <span class="plate-rule"></span></figcaption>
      </figure>
      <div class="round-panel">
        <h1 id="round-title" tabindex="-1" aria-describedby="question-progress">Which habitat fits?</h1>
        <p>Look at the feet. Choose the habitat where they’d be most useful.</p>
        <div class="choices" role="group" aria-labelledby="round-title">
          ${round.choices.map((id, index) => `
            <button type="button" class="choice" data-habitat="${id}">
              <span class="choice-letter" aria-hidden="true">${'ABCD'[index]}</span>
              ${habitats[id].name}
            </button>
          `).join('')}
        </div>
      </div>
    </div>`;

  game.querySelectorAll('.choice').forEach(choice => {
    choice.addEventListener('click', () => showReveal(choice.dataset.habitat));
  });
  const next = rounds[roundIndex + 1];
  for (const file of ['reveal-' + round.id, ...(next ? ['feet-' + next.id] : [])]) {
    new Image().src = './assets/art/' + file + '.webp';
  }
  focusHeading(game.querySelector('h1'));
}

function showReveal(guess) {
  const round = rounds[roundIndex];
  if (guesses.length > roundIndex) return;

  const correct = guess === round.habitat;
  const habitat = habitats[round.habitat];
  guesses.push(correct);
  game.querySelector('.specimen figcaption').innerHTML =
    `<span class="plate-rule"></span> ${round.name} <span class="plate-rule"></span>`;
  game.querySelector('.round-panel').innerHTML = `
    <p class="verdict ${correct ? 'correct' : 'incorrect'}" id="verdict">
      ${icon(correct ? 'check' : 'cross')}
      ${correct ? 'Correct!' : 'Incorrect · You picked ' + habitats[guess].name.toLowerCase()}
    </p>
    <h1 tabindex="-1" aria-describedby="verdict answer-habitat">${round.name}</h1>
    <p class="answer-habitat" id="answer-habitat">${habitat.name}</p>
    <p class="adaptation">${round.adaptation} <a href="${round.guide}" target="_blank" rel="noopener">Bird guide<span class="sr-only"> (opens in a new tab)</span></a></p>
    <figure class="habitat-picture">
      ${art('reveal-' + round.id, round.scene)}
      <figcaption>${icon('pin')} <a href="${habitat.url}" target="_blank" rel="noopener">${habitat.place}<span class="sr-only"> (opens in a new tab)</span></a></figcaption>
    </figure>
    <button type="button" class="button next">${roundIndex + 1 === rounds.length ? 'See my score' : 'Next question'}</button>`;

  game.querySelector('.next').addEventListener('click', () => {
    roundIndex++;
    if (roundIndex === rounds.length) showScore();
    else showClue();
  });

  const heading = game.querySelector('h1');
  heading.focus();
}

function showScore() {
  const score = guesses.filter(Boolean).length;
  game.innerHTML = `
    <div class="score-card">
      <p class="eyebrow">${icon('track')} All ${rounds.length} questions complete</p>
      <h1 tabindex="-1" aria-describedby="score-label">${score}<span> / ${rounds.length}</span></h1>
      <p id="score-label">Habitats matched</p>
      <ol class="score-list">
        ${rounds.map((round, index) => `
          <li>
            <span class="score-status ${guesses[index] ? 'correct' : 'incorrect'}">
              ${icon(guesses[index] ? 'check' : 'cross')}
              <span class="sr-only">${guesses[index] ? 'Correct' : 'Incorrect'}</span>
            </span>
            <span class="score-bird">${round.name}</span>
            <span class="score-habitat">${habitats[round.habitat].name}</span>
          </li>
        `).join('')}
      </ol>
      <div class="score-actions">
        <button type="button" class="button replay">Play again</button>
        <a class="text-link" href="#">Back to home</a>
      </div>
    </div>`;

  game.querySelector('.replay').addEventListener('click', startGame);
  focusHeading(game.querySelector('h1'));
}

function showPage() {
  const playing = location.hash === '#play';
  if (playing) {
    landing.hidden = true;
    game.hidden = false;
    navPlay.hidden = true;
    startGame();
    return;
  }

  const wasPlaying = !game.hidden;
  game.hidden = true;
  landing.hidden = false;
  navPlay.hidden = false;
  if (location.hash === '#how-to-play') {
    const heading = document.querySelector('#instructions-title');
    focusHeading(heading, false);
    heading.scrollIntoView({ block: 'start' });
  } else if (wasPlaying) {
    focusHeading(document.querySelector('#landing-title'));
  }
}

window.addEventListener('hashchange', showPage);
showPage();
