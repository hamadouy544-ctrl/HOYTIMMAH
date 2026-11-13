// HOYTIMMAH - alert.js - UNIQUEMENT POUR LES ALERTES
// Ce fichier tourne dans le monde MAIN, il peut remplacer window.alert
// Il ne touche PAS à la traduction des pages. Il ne fait que les alertes.
// Il lit la langue depuis localStorage, pas depuis chrome.storage, pour ne pas planter.

(function(){
  // On ne remplace qu'une fois, pour ne pas boucler
  if(window.__hoytimmahAlertDejaInstalle) return;
  window.__hoytimmahAlertDejaInstalle = true;

  // Petit glossaire intégré pour les alertes, pour ne pas dépendre de fetch
  // Ce sont les 20 alertes les plus dangereuses. Le reste est dans content.js.
  const ALERTES = [
    { fr: "Solde insuffisant", ful: "Jawdi maada famdi", hau: "Kudin ka bai isa ba" },
    { fr: "Attention : Solde insuffisant", ful: "Hakkil : Jawdi maada famdi", hau: "Hankali : Kudin ka bai isa ba" },
    { fr: "Transfert impossible", ful: "Nelduugo wad-datahko", hau: "Turawa ba zai yiwu ba" },
    { fr: "Transfert reussi", ful: "Nelduugo waɗ-dahmah", hau: "Turawa ya yi" },
    { fr: "Erreur", ful: "ay-beh", hau: "Kuskure" },
    { fr: "Mot de passe incorrect", ful: "moh-de pass manne woh-daye", hau: "Kalmar sirri ba daidai ba" },
    { fr: "Code incorrect", ful: "Kood manne woh-daye", hau: "Lamba ba daidai ba" },
    { fr: "Compte bloque", ful: "Conteh maada bloquii", hau: "Asusun ka ya kulle" },
    { fr: "Transaction echouee", ful: "Gollal wadah-kah", hau: "Ma'amala ta gaza" },
    { fr: "Veuillez faire un depot", ful: "Naatnu jawdi", hau: "Yi ajiyewa" },
    { fr: "Veuillez reessayer", ful: "sey on fohdi-tah", hau: "Sake gwadawa" },
    { fr: "Voulez-vous confirmer ce transfert", ful: "A yiidi tabbintingo nelduugo naa", hau: "Kana so ka tabbatar da wannan turawa" },
    { fr: "Confirmer le transfert", ful: "Tabbintin nelduugo", hau: "Tabbatar da turawa" },
    { fr: "Veuillez entrer votre montant", ful: "Naatnu ndeen tcheh-deh", hau: "Shigar da adadin ka" },
    { fr: "Entrez votre code secret", ful: "Naatnu kohde asir-ri mahda", hau: "Shigar da kalmar sirri" },
    { fr: "Paiement reussi", ful: "Yoɓugo waɗi", hau: "Biya ta yi" },
    { fr: "Paiement echoue", ful: "Yoɓugo waday", hau: "Biya ta gaza" },
    { fr: "Retrait reussi", ful: "Ittugo jawdi waɗi", hau: "Cire kudi ya yi" },
    { fr: "Depot reussi", ful: "Naatnugo jawdi waɗi", hau: "Ajiyewa ta yi" },
    { fr: "Session expiree", ful: "Wakati timmii", hau: "Lokaci ya kare" },
    { fr: "Attention", ful: "Hakkilou", hau: "Hankali" },
    { fr: "Echec", ful: "Wad-day", hau: "Ya gaza" },
    { fr: "Reussi", ful: "Waɗi", hau: "Ya yi" }
  ];

  function getLangue(){
    // On lit dans localStorage, que content.js va synchroniser
    try{
      let l = localStorage.getItem("hoytimmah-langue");
      if(l) return l;
    }catch(e){}
    return "francais";
  }

  function traduireAlerte(texte){
    let langue = getLangue();
    if(langue === "francais") return texte;
    let res = String(texte);
    // On trie par longueur pour traduire les longues phrases d'abord
    let tries = [...ALERTES].sort((a,b)=> b.fr.length - a.fr.length);
    tries.forEach(a=>{
      let trad = langue === "fulfulde" ? a.ful : a.hau;
      // On cherche sans tenir compte des majuscules
      let regex = new RegExp(a.fr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      if(regex.test(res)) res = res.replace(regex, trad);
    });
    return res;
  }

  function afficherNotreAlerte(texteTraduit, texteOriginal){
    // On enlève l'ancienne si elle existe
    let anc = document.getElementById("hoytimmah-alerte");
    if(anc) anc.remove();

    let div = document.createElement("div");
    div.id = "hoytimmah-alerte";
    div.style.cssText = "position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;border:3px solid #D00000;border-radius:16px;padding:25px;z-index:2147483647;width:340px;max-width:92%;box-shadow:0 10px 30px rgba(0,0,0,0.4);font-family:Arial,sans-serif;text-align:center";
    div.innerHTML = `
      <div style="font-size:42px">⚠️</div>
      <div style="font-weight:bold;font-size:18px;color:#D00000;margin:10px 0">Attention - HOYTIMMAH</div>
      <div style="font-size:17px;line-height:1.5;color:#111;margin:10px 0">${texteTraduit}</div>
      <div style="font-size:11px;color:#888;margin:8px 0">Original : ${texteOriginal}</div>
      <div style="font-size:11px;color:#0A7A42">Traduit par HOYTIMMAH</div>
      <button id="hoytimmah-alerte-ok" style="background:#0A7A42;color:white;border:none;padding:13px 25px;border-radius:10px;font-size:16px;font-weight:bold;cursor:pointer;width:100%;margin-top:15px">OK - J'ai compris</button>
      <button id="hoytimmah-alerte-ecouter" style="background:#F2A900;color:#000;border:none;padding:11px;border-radius:10px;margin-top:10px;cursor:pointer;width:100%;font-weight:bold">🔊 ECOUTER CETTE ALERTE</button>
    `;
    document.body.appendChild(div);

    document.getElementById("hoytimmah-alerte-ecouter").onclick = () => {
      try{
        let v = new SpeechSynthesisUtterance(texteTraduit);
        v.lang = "fr-FR"; v.rate = 0.4;
        window.speechSynthesis.speak(v);
      }catch(e){}
    };
    document.getElementById("hoytimmah-alerte-ok").onclick = () => { div.remove(); };
  }

  // On sauvegarde les vraies alertes
  const vraiAlert = window.alert.bind(window);
  const vraiConfirm = window.confirm.bind(window);

  window.alert = function(msg){
    let langue = getLangue();
    let texte = String(msg);
    if(langue === "francais"){
      return vraiAlert(msg);
    }
    let traduit = traduireAlerte(texte);
    // Si on n'a pas réussi à traduire, on affiche quand même notre alerte, avec le texte original
    // pour que la maman voie au moins que c'est une alerte HOYTIMMAH
    if(document.body){
      afficherNotreAlerte(traduit, texte);
    } else {
      document.addEventListener("DOMContentLoaded", ()=> afficherNotreAlerte(traduit, texte));
    }
    return true;
  };

  window.confirm = function(msg){
    let langue = getLangue();
    if(langue === "francais"){
      return vraiConfirm(msg);
    }
    let traduit = traduireAlerte(String(msg));
    if(document.body) afficherNotreAlerte(traduit, String(msg));
    return true;
  };

  console.log("HOYTIMMAH alert.js - Prêt à intercepter les alertes");
})();