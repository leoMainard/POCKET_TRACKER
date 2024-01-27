// ---------------------------------------------------------------------------------- Introduction vers contenu
document.getElementById('startButton').addEventListener('click', function() {
    document.getElementById('appContent').scrollIntoView({behavior: 'smooth'});
});

// ---------------------------------------------------------------------------------- Fonction pour ouvrir une modale spécifique
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
  }
  
  // Fonction pour fermer la modale spécifique
  function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
  }

// ---------------------------------------------------------------------------------- Gestion de la banque

function addBank() {
  var bankName = document.getElementById('newBankName').value;
  if(bankName) {
      // Ajoutez ici la logique pour ajouter une nouvelle banque
      var bankList = document.getElementById('bankList');
      var option = document.createElement('option');
      option.value = bankName;
      option.text = bankName;
      bankList.add(option);

      var compteList = document.getElementById('compteList');
      var option_compte = document.createElement('option');
      option_compte.value = 'CC';
      option_compte.text = 'CC';
      compteList.add(option_compte);

      // Réinitialisez le champ de texte
      document.getElementById('newBankName').value = '';
  } else {
      alert('Veuillez entrer un nom de banque.');
  }
}

function deleteBank() {
  var bankList = document.getElementById('bankList');
  var bankName = bankList.value;
  if(bankName) {
      // Ajoutez ici la logique pour supprimer la banque sélectionnée
      bankList.remove(bankList.selectedIndex);
  } else {
      alert('Veuillez sélectionner une banque à supprimer.');
  }
}

// ---------------------------------------------------------------------------------- Gestion des comptes
function addCompte() {
  var compteName = document.getElementById('newCompteName').value;
  if(compteName) {
      // Ajoutez ici la logique pour ajouter un nouveau compte
      var compteList = document.getElementById('compteList');
      var option = document.createElement('option');
      option.value = compteName;
      option.text = compteName;
      compteList.add(option)

      // Réinitialisez le champ de texte
      document.getElementById('newCompteName').value = '';
  } else {
      alert('Veuillez entrer un nom de compte.');
  }
}


function deleteCompte() {
  var compteList = document.getElementById('compteList');
  var compteName = compteList.value;
  if(compteName) {
      // Ajoutez ici la logique pour supprimer la banque sélectionnée
      compteList.remove(compteList.selectedIndex);
  } else {
      alert('Veuillez sélectionner un compte à supprimer.');
  }
}




// ---------------------------------------------------------------------------------- Gestion des opérations

// Bouton checked (+ / -)
function toggleCheckbox(current, otherId) {
  if (current.checked) {
    document.getElementById(otherId).checked = false;
  }
}

function operation() {
  // Captation des éléments de l'operation
  var banque = document.getElementById('bankList_operation').value;
  var category = document.getElementById('category').value;
  var detail = document.getElementById('operation_detail').value;
  var montant = document.getElementById('operation_valeur').value;

  var moins = document.getElementById('btn-check-minus').checked;
  var plus = document.getElementById('btn-check-plus').checked;

  let liste_category = ["COURSES","SALAIRE","AIDE","LOISIRS","CHARGES"]
  let liste_category_color = ["secondary","success","info","warning","danger"]

  var date = new Date();
  var day = ('0' + date.getDate()).slice(-2);
  var month = ('0' + (date.getMonth() + 1)).slice(-2);
  var year = date.getFullYear();
  var dateString = `${day}/${month}/${year}`;

  if (!banque){
    alert('Veuillez choisir une banque.');
  }
  else if (!category){
    alert('Veuillez choisir une catégorie.');
  }
  else if (!montant){
    alert('Veuillez inscrire un montant.');
  }
  else if (!moins && !plus){
    alert("Veuillez indiquer s'il s'agit d'une opération + ou - .");
  }
  else{
    // signe de l'operation
    let signe = '+';
    if (moins){
      signe = '-';
    }

    // couleur de la categorie
    let index = liste_category.indexOf(category.toUpperCase());
    let color = liste_category_color[index];

    // Créer une nouvelle div avec les classes appropriées
    var newDiv = document.createElement('div');
    newDiv.className = 'operation_historique d-flex align-items-center justify-content-between mb-2 p-2 border rounded';
    
    // Ajouter le contenu HTML à la nouvelle div
    newDiv.innerHTML = `
      <p class="historique_date_operation mb-0">${dateString}</p>
      <p class="historique_banque_operation mb-0">${banque}</p>
      <p class="historique_detail_operation mb-0">${detail}</p>
      <p class="historique_category_operation badge bg-${color} text-dark mb-0">${category}</p>
      <p class="historique_montant_operation mb-0">${signe}${montant}€</p>
      <button onclick="delete_historique_operation(this)" class="btn btn-danger"><i class="fas fa-trash"></i></button>
    `;
    
    // Ajouter la nouvelle div à un conteneur existant dans votre document
    var container = document.getElementById('historique_container_operation'); // Assurez-vous que cet ID existe dans votre HTML
    container.prepend(newDiv);

    // Reinitialisation des inputs
    document.getElementById('operation_detail').value = '';
    document.getElementById('operation_valeur').value = '';
  }

  
}


function delete_historique_operation(element) {
  // Supprime la div operation_historique du DOM
  element.parentElement.remove();
}




// ---------------------------------------------------------------------------------- Gestion des virements

function virement() {
  // Captation des éléments de l'operation
  var debit = document.getElementById('compteList_virement_debit').value;
  var credit = document.getElementById('compteList_virement_credit').value;
  var banque = document.getElementById('banqueList_virement').value;
  var montant = document.getElementById('virement_valeur').value;


  var date = new Date();
  var day = ('0' + date.getDate()).slice(-2);
  var month = ('0' + (date.getMonth() + 1)).slice(-2);
  var year = date.getFullYear();
  var dateString = `${day}/${month}/${year}`;

  if (!banque){
    alert('Veuillez choisir une banque.');
  }
  else if (!debit){
    alert('Veuillez choisir un compte débiteur.');
  }
  else if (!montant){
    alert('Veuillez inscrire un montant.');
  }
  else if (!credit){
    alert("Veuillez choisir un compte créditeur");
  }
  else{
    // Créer une nouvelle div avec les classes appropriées
    var newDiv = document.createElement('div');
    newDiv.className = 'virement_historique d-flex align-items-center justify-content-between mb-2 p-2 border rounded';
    
    // Ajouter le contenu HTML à la nouvelle div
    newDiv.innerHTML = `
      <p class="historique_date_virement mb-0">${dateString}</p>
      <p class="historique_banque_virement mb-0">${banque}</p>
      <p class="historique_debit_virement mb-0">Débit : ${debit}</p>
      <p class="historique_credit_virement mb-0">Crédit : ${credit}</p>
      <p class="historique_montant_virement mb-0">${montant}€</p>
      <button onclick="delete_historique_virement(this)" class="btn btn-danger"><i class="fas fa-trash"></i></button>
    `;
    
    // Ajouter la nouvelle div à un conteneur existant dans votre document
    var container = document.getElementById('historique_container_virement'); // Assurez-vous que cet ID existe dans votre HTML
    container.prepend(newDiv);

    // Reinitialisation des inputs
    document.getElementById('virement_valeur').value = '';
  }
}

function delete_historique_virement(element) {
  // Supprime la div virement_historique du DOM
  element.parentElement.remove();
}