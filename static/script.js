// ---------------------------------------------------------------------------------- Gestion de la base de données indexedDb
let db;

function initDb() {
  const request = indexedDB.open('MaBaseDeDonnees', 2);

  request.onupgradeneeded = function(event) {
    db = event.target.result;
    // Création de la base banques
    if (!db.objectStoreNames.contains('banques')) {
      const banquesStore = db.createObjectStore('banques', { keyPath: 'banques_id', autoIncrement: true });
      banquesStore.createIndex('bankName', 'bankName', { unique: true });
    }

    // Création de la base comptes
    if (!db.objectStoreNames.contains('comptes')) {
      const comptesStore = db.createObjectStore('comptes', { keyPath: 'comptes_id', autoIncrement: true });
      comptesStore.createIndex('banques_id', 'banques_id', { unique: false });
      comptesStore.createIndex('nom_compte', 'nom_compte', { unique: false });
      comptesStore.createIndex('montant_compte', 'montant_compte', { unique: false });
    }
  };

  request.onsuccess = function(event) {
    db = event.target.result;
    loadBanks(); // Appeler loadBanks ici
  };

  request.onerror = function(event) {
    console.error('Erreur lors de l\'ouverture de la base de données', event);
  };
}

function deleteDatabase() {
  var request = indexedDB.deleteDatabase('MaBaseDeDonnees');

  request.onsuccess = function(event) {
    console.log('La base de données a été supprimée avec succès.');
  };

  request.onerror = function(event) {
    console.log('Erreur lors de la suppression de la base de données:', event);
  };

  request.onblocked = function(event) {
    console.log('La suppression de la base de données est bloquée:', event);
  };
}



// --------------- 
// --------------- Banque
// --------------- 

function addBankToDB(bankName) {
  const transaction = db.transaction(['banques'], 'readwrite');
  const objectStore = transaction.objectStore('banques');
  const request = objectStore.add({ bankName: bankName });

  request.onsuccess = function(event) {
    const newBankId = event.target.result; // L'ID de la nouvelle banque
    console.log('Banque ajoutée avec succès, ID:', newBankId);
    addCompteToDB('CC', 0, newBankId); // Utiliser l'ID ici pour lier le compte à la banque
    loadBanks(); // Mettre à jour l'interface utilisateur ici...
  };

  request.onerror = function() {
    console.error('Erreur lors de l\'ajout de la banque');
  };
}

function loadBanks() {
  var transaction = db.transaction(['banques'], 'readonly');
  var objectStore = transaction.objectStore('banques');
  var request = objectStore.getAll();

  request.onsuccess = function(event) {
    var banks = event.target.result;
    updateBankList(banks);
  };

  request.onerror = function(event) {
    console.error('Erreur lors de la récupération des banques:', event);
  };
}


function updateBankList(banks) {
  var bankList = document.getElementById('bankList');
  var bank_operation = document.getElementById('bankList_operation');
  var bank_virement = document.getElementById('banqueList_virement');

  bankList.innerHTML = '<option value="">Sélectionnez une banque</option>'; // Nettoyer la liste existante
  bank_operation.innerHTML = '<option value="">Sélectionnez une banque</option>'; // Nettoyer la liste existante
  bank_virement.innerHTML = '<option value="">Sélectionnez une banque</option>'; // Nettoyer la liste existante

  banks.forEach(function(bank) {
    ['bankList', 'bankList_operation', 'banqueList_virement'].forEach(function(listId) {
      var option = document.createElement('option');
      option.value = bank.id; // ou bank.bankName si vous voulez afficher le nom
      option.textContent = bank.bankName; // ou tout autre propriété de l'objet banque
      document.getElementById(listId).appendChild(option.cloneNode(true)); // Clone l'option pour chaque liste
    });
  });
}


function deleteBankFromDb(bankId) {
  const transaction = db.transaction(['banques'], 'readwrite');
  const objectStore = transaction.objectStore('banques');
  const request = objectStore.delete(bankId);

  request.onsuccess = function(event) {
    alert('Banque supprimée avec succès.');
    loadBanks() // Mettre à jour l'interface utilisateur après la suppression
  };

  request.onerror = function(event) {
    console.error('Erreur lors de la suppression de la banque', event);
  };
}


// --------------- 
// --------------- Comptes
// --------------- 

function addCompteToDB(nom_compte, banque_id) {
  const transaction_compte = db.transaction(['comptes'], 'readwrite');
  const objectStore_compte = transaction_compte.objectStore('comptes');
  const compteData = { nom_compte, montant_compte : 0 , banque_id };
  const request_compte = objectStore_compte.add(compteData);

  request_compte.onsuccess = function() {
    console.log('Compte ajoutée avec succès');
    // loadComptes(); // Mettre à jour l'interface utilisateur ici...
  };

  request_compte.onerror = function() {
    console.error('Erreur lors de l\'ajout de la banque');
  };
}

// --------------- 
// --------------- Operations
// --------------- 


// --------------- 
// --------------- Virements
// --------------- 


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
      // Vérifier si la banque existe déjà
      const transaction = db.transaction(['banques'], 'readonly');
      const objectStore = transaction.objectStore('banques');
      const index = objectStore.index('bankName');
      const request = index.get(bankName);

      request.onsuccess = function() {
        if (request.result) {
          alert('Cette banque existe déjà !');
        } else {
          addBankToDB(bankName); // ajout dans la base de données
          alert('Banque ajoutée !');
        }
      };

      request.onerror = function() {
        console.error('Erreur lors de la vérification de l\'existence de la banque');
      };

      // Réinitialisez le champ de texte
      document.getElementById('newBankName').value = '';
  } else {
      alert('Veuillez entrer un nom de banque.');
  }
}

function deleteBank() {
  var bankList = document.getElementById('bankList');
  var bankName = bankList.value;
  if (bankName) {
    // Supposer que l'ID de la banque est stocké dans la valeur de l'option
    var bankId = bankList.options[bankList.selectedIndex].value;
    
    deleteBankFromDb(parseInt(bankId));
  } else {
    alert('Veuillez sélectionner une banque à supprimer.');
  }
}


// ---------------------------------------------------------------------------------- Gestion des comptes
function addCompte() {
  var nom_compte = document.getElementById('newCompteName').value;
  var banque_id = document.getElementById('bankList').value;

  if(nom_compte && banque_id !== '') {
    // Ajoutez ici la logique pour ajouter un nouveau compte
    var compteList = document.getElementById('compteList');
    var option = document.createElement('option');
    option.value = nom_compte;
    option.text = nom_compte;
    compteList.add(option)

    addCompteToDB(nom_compte, banque_id);

    // Réinitialisez le champ de texte
    document.getElementById('newCompteName').value = '';
  } else {
    alert('Veuillez entrer un nom de compte et choisir une banque.');
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











// ----------------------------------------------------------------------------------- Chargement de la page
// Appeler cette fonction au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
  initDb();
});