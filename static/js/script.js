let categoryColorMap = {
  "COURSES": ["bg-courses", '<i class="fa-solid fa-utensils"></i>', "var(--bg-courses)"],
  "SALAIRE": ["bg-salaire",'<i class="fa-solid fa-euro-sign"></i>', "var(--bg-salaire)"],
  "AIDE": ["bg-aide",'<i class="fa-solid fa-handshake-angle"></i>', "var(--bg-aide)"],
  "LOISIRS": ["bg-loisirs",'<i class="fa-solid fa-cart-shopping"></i>', "var(--bg-loisirs)"],
  "CHARGES": ["bg-charges",'<i class="fa-solid fa-file-invoice-dollar"></i>', "var(--bg-charges)"],
  "ABONNEMENTS": ["bg-abonnements",'<i class="fa-regular fa-credit-card"></i>', "var(--bg-abonnements)"],
  "VIREMENTS": ["bg-virements",'<i class="fa-solid fa-cash-register"></i>', "var(--bg-virements)"],
  "DIVERS": ["bg-divers",'<i class="fa-solid fa-otter"></i>', "var(--bg-divers)"]
};







// ------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------- Gestion de la base de données indexedDb
// ------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------
let db; // instanciation de la base de données






// ------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------- Chargement de la page
// ------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------

// au chargement de la page :
document.addEventListener('DOMContentLoaded', function() {
  initDb(); // Création de la base de données
  guideOrNot(); // Affichage du guide lors de la première utilisation
});



// ------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------- Autre
// ------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------

// ---------------------------------------------------------------------------------- Introduction vers contenu
document.getElementById('startButton').addEventListener('click', function() {
  document.getElementById('appContent').scrollIntoView({behavior: 'smooth'});
});



// Lors des changements de banque, les comptes s'adaptent


document.getElementById('bankList_budget').addEventListener('change', function() {
  document.getElementById('budget_revenu').value = '';
  document.getElementById('budget_courses').value = '';
  document.getElementById('budget_loisirs').value = '';
  document.getElementById('budget_charges').value = '';
  document.getElementById('budget_abonnements').value = '';
  document.getElementById('budget_virements').value = '';
  document.getElementById('budget_divers').value = '';

  document.getElementById('budget_revenu').placeholder = 'Déterminez vos revenus';
  document.getElementById('budget_courses').placeholder = 'Déterminez votre budget courses';
  document.getElementById('budget_loisirs').placeholder = 'Déterminez votre budget loisirs';
  document.getElementById('budget_charges').placeholder = 'Déterminez votre budget charges';
  document.getElementById('budget_abonnements').placeholder = 'Déterminez votre budget abonnements';
  document.getElementById('budget_virements').placeholder = 'Déterminez votre budget virements';
  document.getElementById('budget_divers').placeholder = 'Déterminez votre budget divers';
  loadBudget(parseInt(this.value));
});

document.getElementById('bankList').addEventListener('change', function() {
  updateComptesListBasedOnBank(parseInt(this.value), 'modale1');
});

document.getElementById('banqueList_virement').addEventListener('change', function() {
  updateComptesListBasedOnBank(parseInt(this.value), 'modale2');
});

document.getElementById('bankList_operation').addEventListener('change', function() {
  document.getElementById('historique_container_operation').innerHTML = '';
  var banques_id = document.getElementById('bankList_operation').value;
  if(parseInt(banques_id) >= 0){
    updateOperationListHistorique(parseInt(banques_id));
  }
});

document.getElementById('banqueList_virement').addEventListener('change', function() {
  document.getElementById('historique_container_virement').innerHTML = '';
  var banques_id = document.getElementById('banqueList_virement').value;
  if(parseInt(banques_id) >= 0){
    updateVirementListHistorique(parseInt(banques_id));
  }
});




// Pour le responsive des deux graphiques
function adjustDisplayForScreenSize() {
  var banque_id = document.getElementById('bankListContent').value;
  banque_id = parseInt(banque_id);

  const mediaQuery = window.matchMedia("(max-width: 1200px)");
  const mediaQuerySecondo = window.matchMedia("(max-width: 1400px)");

  if(banque_id > 0){
    if(mediaQuery.matches){
      document.getElementById('graphiquesContainer').style.display = 'block';
      var element = document.getElementById('infoComptes');
      element.style.flex = '';
      element.style.width = '100%';

      document.getElementById('infoComptes').style.display = 'block';
    }else if(mediaQuerySecondo.matches){
      document.getElementById('graphiquesContainer').style.display = 'block';
      document.getElementById('infoComptes').style.flex = '0 0 20%';
    }else{
      document.getElementById('graphiquesContainer').style.display = 'flex';
      document.getElementById('infoComptes').style.flex = '0 0 20%';
    }
  } else {
    // Si la largeur de l'écran est supérieure à 1000px
    document.getElementById('graphiquesContainer').style.display = 'none';
    document.getElementById('infoComptes').style.flex = '0 0 20%';
  }
}

// Ecouteur d'événements pour gérer les changements de taille de la fenêtre
window.addEventListener('resize', adjustDisplayForScreenSize);

// Au changement de banque sélectionnée, on affiche ou non les éléments
document.getElementById('bankListContent').addEventListener('change', function() {
  loadContent();
});

// Au changement de filtre date sélectionné, on affiche ou non les éléments
document.getElementById('dateMonthList').addEventListener('change', function() {
  updateDataBasedOnSelection();
});

document.getElementById('dateYearList').addEventListener('change', function() {  
  updateDataBasedOnSelection();
});



// Au changement de bouton radio Mois ou Annee, on change le graphique linéaire
document.getElementById('optionMoisCam').addEventListener('change', function() {
  var banque_id = parseInt(document.getElementById('bankListContent').value);
  var mois = document.getElementById('dateMonthList').value;
  var annee = document.getElementById('dateYearList').value;

  loadPieChart(banque_id, mois, annee);
});

document.getElementById('optionAnneeCam').addEventListener('change', function() {
  var banque_id = parseInt(document.getElementById('bankListContent').value);
  var annee = document.getElementById('dateYearList').value;
  loadPieChart(banque_id, '', annee);
});


// Au changement de bouton radio Mois ou Annee, on change le graphique linéaire
document.getElementById('optionMoisLin').addEventListener('change', function() {
  updateDataBasedOnOption();
});

document.getElementById('optionAnneeLin').addEventListener('change', function() {
  updateDataBasedOnOption();
});







