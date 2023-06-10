// configurazioni OPENAI
const OPENAI = {
  API_BASE_URL: 'https://api.openai.com/v1',
  API_KEY: '', // inserisci la tua API_KEY
  GPT_MODEL: 'gpt-3.5-turbo',
  API_COMPLETIONS: '/chat/completions',
  API_IMAGE: '/images/generations'
};

const colors = document.querySelectorAll('.color');
const slots = document.querySelectorAll('.slot');
const creaBtn = document.querySelector('#btn');
const loading = document.querySelector('.loading');
const loadingMessage = document.querySelector('.loading-message');
const modal = document.querySelector('.modal');
const modalContent = document.querySelector('.modal-content');
const modalImage = document.querySelector('.modal-image');
const modalCloseBtn = document.querySelector('.modal-close');

let scelta = [];

creaBtn.addEventListener('click', creaOutfit);

modalCloseBtn.addEventListener('click', function () {
  modal.classList.add('hidden');
  // ricarica la pagina
  location.reload();
});

colors.forEach(function(el){
  el.addEventListener('click', function(){
    addColor(el.innerText)
  })
})

// funzione che inserisce i colori scelti nelle slots
function addColor(color){
  const maxSlots = slots.length;

  // se scelgo più di tre colori (maxSlots) viene rimosso il primo scelto...
  if(scelta.length === maxSlots){
    scelta.shift();
  }

  // quando scelgo un colore viene inserito nell'array scelta
  scelta.push(color);

  slots.forEach(function(el, i){
    let color = '?';

    if(scelta[i]){
      color = scelta[i];
    }

    // inserisce il colore scelto nella slot
    el.innerText = color;
  })

  // se ho scelto i 3 colori richiesti rimuovo la classe hidden dal bottone in modo da farlo comparire
  if(scelta.length === maxSlots){
    creaBtn.classList.remove('hidden')
  }
}

// funzione asincrona che crea l'outfit
async function creaOutfit(){
  // mostro il loading con messaggi randomici ogni 2 secondi
  loading.classList.remove('hidden');
  loadingMessage.innerText = getRandomLoadingMessage();
  const messageInterval = setInterval(() => {
    loadingMessage.innerText = getRandomLoadingMessage();
  }, 2000);

  // strutturo la richiesta a GPT facendogli un ### esempio ### di come voglio la risposta
  const prompt = `\
  Che outfit femminile mi suggerisci con questi colori: ${scelta.join(', ')}?
  l'outfit deve contenere tutti i colori richiesti, puoi aggiungere accessori.
  Deve avere un titolo creativo, divertente ed ironico.
  Le tue risposte sono solo in formato JSON come questo esempio:
  
  ###
  
  {
    "titolo": "Titolo outfit",
    "consigli": "se sei bassa alza il baricentro",
    "GPTdice": "Con questa camicetta li farai girare tutti"
  }
  
  ###`;

  // definisco i parametri richiesta dalla documentation
  const recipeResponse = await makeRequest(OPENAI.API_COMPLETIONS, {
    model: OPENAI.GPT_MODEL,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7
  });

  // prendo la risposta
  const content = JSON.parse(recipeResponse.choices[0].message.content);

  // la inserisco in questa struttura nel modal
  modalContent.innerHTML = `\
  <h2>${content.titolo}</h2>
  <p>${content.consigli}</p>
  <p>${content.GPTdice}</p>`;

  //mostro il modal
  modal.classList.remove('hidden');
  // nascondo il loading
  loading.classList.add('hidden');
  // rimuovo i messaggi di loading
  clearInterval(messageInterval)

  // strutturo la richiesta a GPT per l'immagine
  const imageResponse = await makeRequest(OPENAI.API_IMAGE, {
    prompt: `Crea una immagine a figura intera di un outfit con questi colori:${scelta.join(', ')} e con:${content.GPTdice}`,
    n: 1,
    size: '256x256',
  });

  //prendo l'immagine e la inserisco nel modal
  const imageUrl = imageResponse.data[0].url;
  modalImage.innerHTML = `<img src="${imageUrl}" alt="foto outfit" />`
  clearScelta();
}

// funzione che ripulisce le slots
function clearScelta() {
  scelta = [];

  slots.forEach(function (slot) {
    slot.innerText = '?';
  });
}

// funzione che genera messaggi random di loading
function getRandomLoadingMessage() {
  const messages = [
    `Apro l'armadio...`,
    'Scelgo le scarpe...',
    'Stiro la camicia...',
    'Preparo i pantaloni...',
    'Aggiungo la borsa...'
  ];

  const randIdx = Math.floor(Math.random() * messages.length);
  return messages[randIdx];
}

// funzione per generare la richiesta
async function makeRequest(endpoint, data) {
  const response = await fetch(OPENAI.API_BASE_URL + endpoint, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI.API_KEY}`,
    },
    method: 'POST',
    body: JSON.stringify(data)
  });

  const json = await response.json();
  return json;
}