// HOYTIMMAH - content.js - VERSION 1.0.0
let langueActuelle = "francais";
let glossaireCache = null;

async function traduirePage(){
  if(langueActuelle === "francais") return;
  if(!glossaireCache){
    try{
      let r = await fetch(chrome.runtime.getURL("data/glossaire.json"));
      glossaireCache = await r.json();
glossaireCache.mots = [...(glossaireCache.mots || []), ...(glossaireCache.phrases || [])];
console.log("HOYTIMMAH - Glossaire charge, nb mots:", glossaireCache.mots.length);
    }catch(e){
      console.log("HOYTIMMAH - ERREUR GLOSSAIRE:", e);
      return;
    }
  }
  let mots = [...glossaireCache.mots].sort((a,b)=>b.francais.length - a.francais.length);
  function appliquerCasse(traduction, original){
    if(!traduction || !original) return traduction;
    if(original === original.toUpperCase() && original !== original.toLowerCase()){
      return traduction.toUpperCase();
    }
    let motsOriginaux = original.split(" ");
    let tousMajusculeDebut = motsOriginaux.length > 1 && motsOriginaux.every(m => m.length > 0 && m[0] === m[0].toUpperCase() && m[0] !== m[0].toLowerCase());
    if(tousMajusculeDebut){
      return traduction.split(" ").map(w => w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w).join(" ");
    }
    if(original[0] === original[0].toUpperCase() && original[0] !== original[0].toLowerCase()){
      return traduction[0].toUpperCase() + traduction.slice(1);
    }
    return traduction;
  }
    function creerPatternSansAccent(mot){
    let mapAccents = {
      'a': '[aàâäAÀÂÄ]', 'A': '[aàâäAÀÂÄ]',
      'e': '[eéèêëEÉÈÊË]', 'E': '[eéèêëEÉÈÊË]',
      'i': '[iîïIÎÏ]', 'I': '[iîïIÎÏ]',
      'o': '[oôöOÔÖ]', 'O': '[oôöOÔÖ]',
      'u': '[uùûüUÙÛÜ]', 'U': '[uùûüUÙÛÜ]',
      'c': '[cçCÇ]', 'C': '[cçCÇ]',
      'n': '[nñNÑ]', 'N': '[nñNÑ]'
    };
    let pattern = "";
    for(let ch of mot){
      if(mapAccents[ch]){
        pattern += mapAccents[ch];
      } else if(/[.*+?^${}()|[\]\\]/.test(ch)){
        pattern += "\\" + ch;
      } else {
        pattern += ch;
      }
    }
    return pattern;
  }
      // REGLE : Possessif français AVANT -> Possessif Fulfulde APRES
      // Ex : Mon compte -> Conta am, Ton solde -> Jawdi maada
  function traduirePossessifs(t, langue){
    let suffixes = {
      // Francais -> { fulfulde, haoussa }
      "mon": { fulfulde: "am", haoussa: "na" },
      "ma": { fulfulde: "am", haoussa: "na" },
      "mes": { fulfulde: "am", haoussa: "na" },
      "ton": { fulfulde: "maada", haoussa: "ka" },
      "ta": { fulfulde: "maada", haoussa: "ka" },
      "tes": { fulfulde: "maada", haoussa: "ka" },
      "son": { fulfulde: "makko", haoussa: "sa" },
      "sa": { fulfulde: "makko", haoussa: "sa" },
      "ses": { fulfulde: "makko", haoussa: "sa" },
      "notre": { fulfulde: "men", haoussa: "mu" },
      "nos": { fulfulde: "men", haoussa: "mu" },
      "votre": { fulfulde: "maada", haoussa: "ka" },
      "vos": { fulfulde: "maada", haoussa: "ka" },
      "leur": { fulfulde: "maɓɓe", haoussa: "su" },
      "leurs": { fulfulde: "maɓɓe", haoussa: "su" }
    };

    let res = t;
    // On cherche : possessif + mot
    // Ex : "Mon compte", "votre solde", "Ton numero"
    for(let poss in suffixes){
      // Pattern qui ignore les accents et la casse
      let patternPoss = creerPatternSansAccent(poss);
      // \\b = limite de mot, pour ne pas prendre "mon" dans "monnaie"
      // ([A-Za-zÀ-ÿ']+) = le mot qui suit, ex : compte, solde
      let regex = new RegExp("\\b" + patternPoss + "\\s+([A-Za-zÀ-ÿ']+)", "gi");
      res = res.replace(regex, (match, motSuivant) => {
        // 1. On traduit le mot qui suit, avec le glossaire
        let motTraduit = traduireTexte(motSuivant);
        // 2. On prend le suffixe dans la bonne langue
        let suffixe = suffixes[poss.toLowerCase()][langue];
        // 3. On met : Mot traduit + suffixe
        // Ex : Compte -> Conta + am = Conta am
        return motTraduit + " " + suffixe;
      });
    }
    return res;
  }
    function traduireTexte(t){
    // D'abord, on applique la règle des possessifs
    // Sinon, "Mon compte" serait traduit mot à mot en "Am Conta"
      let res = traduirePossessifs(t, langueActuelle);
    mots.forEach(m=>{
      let trad = m[langueActuelle];
        if(!trad) return;
      let pattern = creerPatternSansAccent(m.francais);
      let regex = new RegExp(pattern, "gi");
      res = res.replace(regex, (match)=>{
        return appliquerCasse(trad, match);
      });
    });
      res = res.replace(/\s{2,}/g, " ").trim();
        return res;;
  }
  // On traduit aussi les placeholders, les titres, les attributs
  document.querySelectorAll("input, textarea").forEach(el=>{
    if(el.placeholder){
      let nouveau = traduireTexte(el.placeholder);
      if(nouveau !== el.placeholder) el.placeholder = nouveau;
    }
    if(el.title){
      let nouveau2 = traduireTexte(el.title);
      if(nouveau2 !== el.title) el.title = nouveau2;
    }
  });
  document.querySelectorAll("[aria-label]").forEach(el=>{
    let nouveau = traduireTexte(el.getAttribute("aria-label"));
    if(nouveau !== el.getAttribute("aria-label")) el.setAttribute("aria-label", nouveau);
  });
  let walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let nodes = [];
  let n;
  while(n = walker.nextNode()){
    nodes.push(n);
  }
  nodes.forEach(node=>{
    if(!node.nodeValue || node.nodeValue.trim().length < 2) return;
    if(node.parentElement && ["SCRIPT","STYLE"].includes(node.parentElement.tagName)) return;
    let nouveau = traduireTexte(node.nodeValue);
    if(nouveau !== node.nodeValue){
      node.nodeValue = nouveau;
    }
  });
  if(langueActuelle === "fulfulde") document.documentElement.lang = "ff-CM";
  else if(langueActuelle === "haoussa") document.documentElement.lang = "ha-CM";
  else document.documentElement.lang = "fr-FR";
  console.log("HOYTIMMAH - Page traduite en:", langueActuelle);
}

chrome.storage.local.get("langue", (data)=>{
  langueActuelle = data.langue || "francais";
  try{ localStorage.setItem("hoytimmah-langue", langueActuelle); }catch(e){}
  traduirePage();
});

chrome.storage.onChanged.addListener((changes)=>{
  if(changes.langue){
    langueActuelle = changes.langue.newValue;
    try{ localStorage.setItem("hoytimmah-langue", langueActuelle); }catch(e){}
    if(langueActuelle === "francais"){
      location.reload();
    } else {
      traduirePage();
    }
  }
});

let derniereUrl = location.href;
setInterval(()=>{
  if(location.href !== derniereUrl){
    derniereUrl = location.href;
    setTimeout(traduirePage, 500);
  }
}, 500);

let observer = new MutationObserver(()=>{
  clearTimeout(window._t);
  window._t = setTimeout(traduirePage, 300);
});
if(document.body){
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}

// LECTURE VOCALE
let lectureEnCours = false;
let phrasesALire = [];
let indexPhrase = 0;

function getVoixPourLangue(langue){
  let voix = window.speechSynthesis.getVoices();
  if(langue === "fulfulde"){
    let voixFF = voix.find(v => v.lang.toLowerCase().startsWith("ff") || v.lang.toLowerCase().startsWith("fub") || v.lang.toLowerCase().startsWith("ful"));
    if(voixFF) return voixFF;
    let voixFR = voix.find(v => v.lang === "fr-FR") || voix.find(v => v.lang.toLowerCase().startsWith("fr"));
    if(voixFR) return voixFR;
  }
  if(langue === "haoussa"){
    let voixHA = voix.find(v => v.lang.toLowerCase().startsWith("ha"));
    if(voixHA) return voixHA;
    let voixFR2 = voix.find(v => v.lang === "fr-FR") || voix.find(v => v.lang.toLowerCase().startsWith("fr"));
    if(voixFR2) return voixFR2;
  }
  return voix[0] || null;
}

function decoupageEnPhrases(texte){
  let phrases = texte.match(/[^.!?]+[.!?]+/g) || [texte];
  let resultat = [];
  phrases.forEach(p=>{
    if(p.length > 120){
      let morceaux = p.match(/.{1,120}(?:\s|$)/g) || [p];
      resultat.push(...morceaux);
    } else {
      resultat.push(p);
    }
  });
  return resultat.filter(p=>p.trim().length > 2);
}

function lirePhraseSuivante(){
  if(!lectureEnCours) return;
  if(indexPhrase >= phrasesALire.length){
    lectureEnCours = false;
    mettreAJourBoutonLecture(false);
    return;
  }
  let textePhrase = phrasesALire[indexPhrase].trim();
  if(!textePhrase){
    indexPhrase++;
    lirePhraseSuivante();
    return;
  }
  let utterance = new SpeechSynthesisUtterance(textePhrase);
  if(langueActuelle === "fulfulde") utterance.lang = "ff-CM";
  else if(langueActuelle === "haoussa") utterance.lang = "ha-CM";
  else utterance.lang = "fr-FR";
  let voix = getVoixPourLangue(langueActuelle);
  if(voix) utterance.voice = voix;
  utterance.rate = 0.65;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  utterance.onend = ()=>{
    indexPhrase++;
    setTimeout(lirePhraseSuivante, 300);
  };
  utterance.onerror = ()=>{
    indexPhrase++;
    setTimeout(lirePhraseSuivante, 300);
  };
  window.speechSynthesis.speak(utterance);
}

function mettreAJourBoutonLecture(enCours){
  let btn = document.getElementById("hoytimmah-btn-lecture");
  if(!btn) return;
  if(enCours){
    btn.innerHTML = " ⏹️ ARRETER LA LECTURE";
    btn.style.background = "#D00000";
  } else {
    btn.innerHTML = " 🔊 ECOUTER CETTE PAGE - LENTEMENT EN FULFULDE";
    btn.style.background = "#0A7A42";
  }
}

function lirePageEnFulfulde(){
  if(lectureEnCours){
    lectureEnCours = false;
    window.speechSynthesis.cancel();
    mettreAJourBoutonLecture(false);
    return;
  }
  let textePage = "";
  document.querySelectorAll("h1, h2, h3, p, label, button").forEach(el=>{
    if(el.offsetParent !== null && el.innerText && el.innerText.trim().length > 2){
      textePage += el.innerText.trim() + ". ";
    }
  });
  if(textePage.trim().length < 10){
    textePage = document.body.innerText || "";
  }
  textePage = textePage.substring(0, 2000);
  if(!textePage.trim()){
    return;
  }
  phrasesALire = decoupageEnPhrases(textePage);
  indexPhrase = 0;
  lectureEnCours = true;
  mettreAJourBoutonLecture(true);
  if(window.speechSynthesis.getVoices().length === 0){
    window.speechSynthesis.onvoiceschanged = ()=>{
      lirePhraseSuivante();
    };
    setTimeout(()=>{
      if(lectureEnCours && indexPhrase === 0) lirePhraseSuivante();
    }, 1000);
  } else {
    lirePhraseSuivante();
  }
}

function creerBoutonLecture(){
  if(document.getElementById("hoytimmah-btn-lecture")) return;
  if(!document.body) return;
  let btn = document.createElement("button");
  btn.id = "hoytimmah-btn-lecture";
  btn.innerHTML = "ECOUTER CETTE PAGE";
  btn.style.cssText = "position:fixed;top:60px;right:12px;z-index:2147483647;background:#0A7A42;color:white;border:none;padding:13px 16px;border-radius:30px;font-size:13px;font-weight:bold;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.3);max-width:260px";
  btn.onclick = (e)=>{
    e.preventDefault();
    e.stopPropagation();
    window.speechSynthesis.resume();
    lirePageEnFulfulde();
  };
  document.body.appendChild(btn);
}

setTimeout(creerBoutonLecture, 1000);
setTimeout(creerBoutonLecture, 3000);
if(window.speechSynthesis){
  window.speechSynthesis.getVoices();
}