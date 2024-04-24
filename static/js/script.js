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
// ------------------------------------------------------------------------------------------------------------------ PopUp
// ------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------

function showAlert(message) {
  const alertPopup = document.getElementById('popupAlert');
  
  // Mise à jour du message
  alertPopup.innerHTML = message;
  
  // Afficher le pop-up
  alertPopup.style.display = 'block';
  alertPopup.className = 'show';
  
  // Masquer le pop-up après 3 secondes
  setTimeout(() => {
    alertPopup.className = 'hide';
    // Optionnel: masquer complètement après l'animation
    setTimeout(() => alertPopup.style.display = 'none', 500);
  }, 2500);
}

function showSuccess(message) {
  const alertPopup = document.getElementById('popupSuccess');
  
  // Mise à jour du message
  alertPopup.innerHTML = message;
  
  // Afficher le pop-up
  alertPopup.style.display = 'block';
  alertPopup.className = 'show';
  
  // Masquer le pop-up après 3 secondes
  setTimeout(() => {
    alertPopup.className = 'hide';
    // Optionnel: masquer complètement après l'animation
    setTimeout(() => alertPopup.style.display = 'none', 500);
  }, 2500);
}



// ------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------- Gestion de la base de données indexedDb
// ------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------
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
      const comptesStore = db.createObjectStore('comptes', { keyPath: ['banques_id', 'nom_compte'] });
      comptesStore.createIndex('banques_id', 'banques_id', { unique: false });
      comptesStore.createIndex('montant_compte', 'montant_compte', { unique: false });
    }

    if (!db.objectStoreNames.contains('operations')) {
      const operationsStore = db.createObjectStore('operations', { keyPath: 'operation_id', autoIncrement: true });
      
      // Créer des index pour rechercher des opérations par différents attributs
      operationsStore.createIndex('banques_id', 'banques_id', { unique: false });
      operationsStore.createIndex('category', 'category', { unique: false });
      operationsStore.createIndex('date', 'date', { unique: false });
      
      // Note : Pas besoin de créer des index pour 'detail' et 'montant' à moins que vous n'ayez besoin de recherches spécifiques sur ces champs
    }

    if (!db.objectStoreNames.contains('virements')) {
      const operationsStore = db.createObjectStore('virements', { keyPath: 'virement_id', autoIncrement: true });
      
      // Créer des index pour rechercher des virements par différents attributs
      operationsStore.createIndex('banques_id', 'banques_id', { unique: false });
      operationsStore.createIndex('compte_debit', 'compte_debit', { unique: false });
      operationsStore.createIndex('compte_credit', 'compte_credit', { unique: false });
      operationsStore.createIndex('date', 'date', { unique: false });
      // Note : Pas besoin de créer un index pour 'montant_virement'
    }

    if (!db.objectStoreNames.contains('budget')) {
      const operationsStore = db.createObjectStore('budget', { keyPath: 'budget_id', autoIncrement: true});

      operationsStore.createIndex('banques_id', 'banques_id', { unique: false });
      operationsStore.createIndex('date', 'date', { unique: false });
    }

  };

  request.onsuccess = function(event) {
    db = event.target.result;
    loadBanks(); // Charger les banques
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







// ------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------
// --------------- Banque
// ------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------

function addBankToDB(bankName) {
  const transaction = db.transaction(['banques'], 'readwrite');
  const objectStore = transaction.objectStore('banques');
  const request = objectStore.add({ bankName: bankName });

  request.onsuccess = function(event) {
    const newBankId = event.target.result; // L'ID de la nouvelle banque
    console.log('Banque ajoutée avec succès, ID:', newBankId);
    addCompteToDB('CC', newBankId); // Utiliser l'ID ici pour lier le compte à la banque
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

    loadContent();
  };

  request.onerror = function(event) {
    console.error('Erreur lors de la récupération des banques:', event);
  };
}


function updateBankList(banks) {
  var bankList = document.getElementById('bankList');
  var bank_operation = document.getElementById('bankList_operation');
  var bank_virement = document.getElementById('banqueList_virement');
  var bankBudget = document.getElementById('bankList_budget');
  var bankContent = document.getElementById('bankListContent');

  bankList.innerHTML = '<option value="">Sélectionnez une banque</option>'; // Nettoyer la liste existante
  bank_operation.innerHTML = '<option value="">Sélectionnez une banque</option>'; // Nettoyer la liste existante
  bank_virement.innerHTML = '<option value="">Sélectionnez une banque</option>'; // Nettoyer la liste existante
  bankContent.innerHTML = '<option value="">Sélectionnez une banque</option>'; // Nettoyer la liste existante
  bankBudget.innerHTML = '<option value="">Sélectionnez une banque</option>'; // Nettoyer la liste existante

  banks.forEach(function(bank) {
    ['bankList', 'bankList_operation', 'banqueList_virement','bankList_budget','bankListContent'].forEach(function(listId) {
      var option = document.createElement('option');
      option.value = bank.banques_id; // ou bank.bankName si vous voulez afficher le nom
      option.textContent = bank.bankName; // ou tout autre propriété de l'objet banque
      document.getElementById(listId).appendChild(option.cloneNode(true)); // Clone l'option pour chaque liste
    });
  });
}


function deleteBankFromDb(bankId) {
  const transaction = db.transaction(['banques'], 'readwrite');
  const objectStore = transaction.objectStore('banques');
  const request = objectStore.delete(bankId);

  deleteAssociatedAccounts(bankId);
  deleteOperation(bankId);
  deleteVirement(bankId);

  request.onsuccess = function(event) {
    showSuccess('<i class="fa-solid fa-check"></i> Banque supprimée avec succès.');
    loadBanks() // Mettre à jour l'interface utilisateur après la suppression

    updateComptesListBasedOnBank(bankId, 'modale1');

    loadContent();
  };

  request.onerror = function(event) {
    console.error('Erreur lors de la suppression de la banque', event);
  };
}

function deleteAssociatedAccounts(bankId) {
  const transaction = db.transaction(['comptes'], 'readwrite');
  const store = transaction.objectStore('comptes');

  // Créer une requête pour trouver tous les comptes avec le bankId spécifié
  const index = store.index('banques_id'); // Assurez-vous que cet index existe
  const request = index.openCursor(IDBKeyRange.only(bankId));

  request.onsuccess = function(event) {
    const cursor = event.target.result;
    if (cursor) {
      // Supprimer chaque compte trouvé
      store.delete(cursor.primaryKey);
      cursor.continue(); // Continuer à parcourir les comptes suivants
    } else {
      // Tous les comptes associés ont été traités
      console.log('Tous les comptes associés à la banque ont été supprimés');
    }
  };

  request.onerror = function(event) {
    console.error('Erreur lors de la suppression des comptes associés', event);
  };
}

function deleteOperation(bankId) {
  const transaction = db.transaction(['operations'], 'readwrite');
  const store = transaction.objectStore('operations');

  // Créer une requête pour trouver tous les comptes avec le bankId spécifié
  const index = store.index('banques_id'); // Assurez-vous que cet index existe
  const request = index.openCursor(IDBKeyRange.only(bankId));

  request.onsuccess = function(event) {
    const cursor = event.target.result;
    if (cursor) {
      // Supprimer chaque compte trouvé
      store.delete(cursor.primaryKey);
      cursor.continue(); // Continuer à parcourir les comptes suivants
    } else {
      // Tous les comptes associés ont été traités
      console.log('Toutes les opérations associées à la banque ont été supprimées');
    }
  };

  request.onerror = function(event) {
    console.error('Erreur lors de la suppression des opérations associées', event);
  };
}

function deleteVirement(bankId) {
  const transaction = db.transaction(['virements'], 'readwrite');
  const store = transaction.objectStore('virements');

  // Créer une requête pour trouver tous les comptes avec le bankId spécifié
  const index = store.index('banques_id'); // Assurez-vous que cet index existe
  const request = index.openCursor(IDBKeyRange.only(bankId));

  request.onsuccess = function(event) {
    const cursor = event.target.result;
    if (cursor) {
      // Supprimer chaque compte trouvé
      store.delete(cursor.primaryKey);
      cursor.continue(); // Continuer à parcourir les comptes suivants
    } else {
      // Tous les comptes associés ont été traités
      console.log('Tous les virements associées à la banque ont été supprimés');
    }
  };

  request.onerror = function(event) {
    console.error('Erreur lors de la suppression des virements associés', event);
  };
}








// ------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------
// --------------- Comptes
// ------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------

function addCompteToDB(nom_compte, banques_id) {
  nom_compte = nom_compte.toUpperCase();

  const transaction_compte = db.transaction(['comptes'], 'readwrite');
  const objectStore_compte = transaction_compte.objectStore('comptes');
  const compteData = {
    // La clé composée est un tableau de [banques_id, nom_compte]
    banques_id: banques_id, 
    nom_compte: nom_compte, 
    montant_compte: 0
  };
  const request_compte = objectStore_compte.add(compteData);

  request_compte.onsuccess = function() {
    showSuccess('<i class="fa-solid fa-check"></i> Compte ajoutée avec succès');
    updateComptesListBasedOnBank(parseInt(banques_id), 'modale1');

    loadContent();
  };

  request_compte.onerror = function() {
    console.error('Erreur lors de l\'ajout de la banque');
  };
}

function deleteCompteFromDb(nom_compte) {
  var bank_id = document.getElementById('bankList').value;

  const transaction = db.transaction(['comptes'], 'readwrite');
  const objectStore = transaction.objectStore('comptes');
  const requete_montant = objectStore.get([parseInt(bank_id), nom_compte]);

  requete_montant.onsuccess = function(event){
    const montant = requete_montant.result.montant_compte;

    var banque_name = document.getElementById('bankList').options[document.getElementById('bankList').selectedIndex].text;
    const date = new Date();
    var day = ('0' + date.getDate()).slice(-2);
    var month = ('0' + (date.getMonth() + 1)).slice(-2);
    var year = date.getFullYear();
    var dateString = `${day}/${month}/${year}`;

    // Création d'une opération de récupération de montant
    operationToCompte(parseInt(bank_id), parseFloat(parseFloat(montant).toFixed(2)));
    // operationToHistorique(parseInt(bank_id), banque_name, 'VIREMENTS', 'Suppression du compte ' + nom_compte, parseFloat(montant.toFixed(2)), dateString);

    const request = objectStore.delete([parseInt(bank_id), nom_compte]);

    request.onsuccess = function(event) {
      showSuccess('<i class="fa-solid fa-check"></i> Compte supprimée avec succès. ');
      updateComptesListBasedOnBank(parseInt(bank_id), 'modale1');

      loadContent();
    };
  
    request.onerror = function(event) {
      console.error('Erreur lors de la suppression de la banque', event);
    };
  }

  requete_montant.onerror = function(event) {
    console.error('Erreur lors de la suppression de la banque', event);
  };

  

  
}

function updateComptesList_banque(comptes) {

  var compteList = document.getElementById('compteList');

  compteList.innerHTML = '<option value="">Sélectionnez un compte</option>'; // Nettoyer la liste existante

  // Ajouter les options de compte filtrées
  comptes.forEach(function(compte) {
    var option = document.createElement('option');
    option.value = compte.nom_compte; // Assurez-vous que cela correspond à votre structure de données
    option.textContent = compte.nom_compte;

    compteList.appendChild(option);
  });
}

function updateComptesList_virement(comptes) {
  var compteList_virement_debit = document.getElementById('compteList_virement_debit');
  var compteList_virement_credit = document.getElementById('compteList_virement_credit');

  compteList_virement_debit.innerHTML = '<option value="">Compte débiteur</option>'; // Nettoyer la liste existante
  compteList_virement_credit.innerHTML = '<option value="">Compte créditeur</option>'; // Nettoyer la liste existante

  // Ajouter les options de compte filtrées
  comptes.forEach(function(compte) {
    var option = document.createElement('option');
    option.value = compte.nom_compte; // Assurez-vous que cela correspond à votre structure de données
    var montant = compte.montant_compte

    var signe = ' '
    if(parseFloat(parseFloat(montant).toFixed(2)) >= 0){
      signe = ' + '
    }
      
    option.textContent = compte.nom_compte + signe + compte.montant_compte.toLocaleString('fr-FR') + '€';
    [compteList_virement_debit, compteList_virement_credit].forEach(function(list) {
      list.appendChild(option.cloneNode(true));
    });
  });
}

function updateComptesListBasedOnBank(bankId, modaleId) {
  if(bankId === '' || isNaN(bankId)){
    clearComptesList(modaleId);
    return;
  }

  const transaction = db.transaction(['comptes'], 'readonly');
  const store = transaction.objectStore('comptes');
  const index = store.index('banques_id');
  const request = index.getAll(IDBKeyRange.only(bankId));

  request.onsuccess = function() {
    const comptes = request.result; // Les comptes filtrés par bankId
    if (modaleId === 'modale1') {
      updateComptesList_banque(comptes); // Mettre à jour la liste dans le modale 1
    } else if (modaleId === 'modale2') {
      updateComptesList_virement(comptes); // Mettre à jour la liste dans le modale 2
      // Assurez-vous d'avoir les ID corrects pour vos éléments de liste de comptes
    }
  };

  request.onerror = function() {
    console.error('Erreur lors de la récupération des comptes filtrés');
  };
}

function clearComptesList(modaleId) {
  
  if (modaleId === 'modale1'){
    const compteList = document.getElementById('compteList');
    compteList.innerHTML = '<option value="">Sélectionnez une banque</option>';
  }else if(modaleId === 'modale2'){
    const compteList_virement_debit = document.getElementById('compteList_virement_debit');
    const compteList_virement_credit = document.getElementById('compteList_virement_credit');
    compteList_virement_debit.innerHTML = '<option value="">Sélectionnez une banque</option>';
    compteList_virement_credit.innerHTML = '<option value="">Sélectionnez une banque</option>';
  };
}








// ------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------
// --------------- Operations
// ------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------

function addOperationToDB(banque_id, banque_name, category, detail, montant, date){
  operationToCompte(banque_id, montant);

  // Ajout de l'opération dans l'historique
  operationToHistorique(banque_id, banque_name, category, detail, montant, date);

  const transaction = db.transaction(['operations'], 'readonly');
  const store = transaction.objectStore('operations');
  const request = store.openCursor(null, 'prev');

  request.onsuccess = function(event) {
    let operation_id = 0;
    const cursor = event.target.result;
    if (cursor) {
      operation_id = parseInt(cursor.value.operation_id);
    }

    
    let colorClass = categoryColorMap[category] || "bg-divers"; // Utiliser une classe par défaut si la catégorie n'est pas trouvée

    // Création et configuration de la nouvelle div
    var newDiv = document.createElement('div');
    newDiv.className = 'operation_historique d-flex align-items-center justify-content-between mb-2 p-2 border rounded';
    newDiv.setAttribute('data-operation-id', operation_id);
    newDiv.innerHTML = `
      <p class="historique_date_operation mb-0">${date}</p>
      <p class="historique_banque_operation mb-0">${banque_name}</p>
      <p class="historique_detail_operation mb-0">${detail}</p>
      <p class="historique_category_operation badge ${colorClass[0]} text-white mb-0">${category} ${colorClass[1]}</p>
      <p class="historique_montant_operation mb-0">${montant}€</p>
      <button onclick="deleteOperationHistorique(this)" class="btn btn-danger"><i class="fas fa-trash"></i></button>
    `;

    // Ajouter la nouvelle div au conteneur
    var container = document.getElementById('historique_container_operation');
    container.prepend(newDiv);

    // Réinitialisation des champs après l'affichage des opérations
    document.getElementById('operation_detail').value = '';
    document.getElementById('operation_valeur').value = '';

    loadContent();
  }  
}

function operationToCompte(banque_id, montant, nom_compte='CC'){
  // Ajout ou soustraction du montant dans le compte CC de la banque
  const operation_compte = db.transaction(['comptes'], 'readwrite');
  const objectStore_compte = operation_compte.objectStore('comptes');

  const compteKey = [banque_id, nom_compte];
  const getRequest = objectStore_compte.get(compteKey);

  getRequest.onsuccess = function() {
    const compte = getRequest.result;
    if (compte) {
      compte.montant_compte += montant;

      // Sauvegarder l'enregistrement mis à jour
      const updateRequest = objectStore_compte.put(compte);

      updateRequest.onsuccess = function() {
        console.log('Le montant du compte a été mis à jour avec succès.');
      };

      updateRequest.onerror = function(event) {
        console.error('Erreur lors de la mise à jour du montant du compte', event);
      };
    } else {
      console.log('Compte non trouvé.');
    }
  };

  getRequest.onerror = function(event) {
    console.error('Erreur lors de la récupération du compte', event);
  };
}

function operationToHistorique(banque_id, banque_name, category, detail, montant, date){
  const transaction = db.transaction(['operations'], 'readwrite');
  const store = transaction.objectStore('operations');
  
  const operationData = {
    banques_id: banque_id,
    category: category,
    detail: detail,
    montant: montant,
    banque_name : banque_name,
    date: date
  };

  const request = store.add(operationData);

  request.onsuccess = function() {
      console.log('Opération ajoutée avec succès.');
    };
  request.onerror = function(event) {
    console.error("Erreur lors de l'ajout de l'opération", event);
  };
}

function updateOperationListHistorique(banques_id){
  document.getElementById('historique_container_operation').innerHTML = '';

  const date = new Date();
  var day = ('0' + date.getDate()).slice(-2);
  var month = ('0' + (date.getMonth() + 1)).slice(-2);
  var year = date.getFullYear();
  var dateString = `${day}/${month}/${year}`;

  const transaction = db.transaction(['operations'], 'readonly');
  const store = transaction.objectStore('operations');
  const dateIndex = store.index('date');
  const request = dateIndex.getAll(IDBKeyRange.only(dateString));

  request.onsuccess = function(event) {
    const operations = event.target.result.filter(op => op.banques_id === banques_id);    

    // Boucler sur chaque opération récupérée
    operations.forEach(operation => {
      // Récupération et traitement des informations de l'opération
      let operation_id = operation.operation_id;
      let category = operation.category; 
      let detail = operation.detail; 
      let montant = operation.montant; 
      let date = operation.date; 
      let banque_name = operation.banque_name;

      let colorClass = categoryColorMap[category] || "bg-divers"; // Utiliser une classe par défaut si la catégorie n'est pas trouvée

      // Création et configuration de la nouvelle div
      var newDiv = document.createElement('div');
      newDiv.className = 'operation_historique d-flex align-items-center justify-content-between mb-2 p-2 border rounded';
      newDiv.setAttribute('data-operation-id', operation_id);
      
      if(detail.trim().includes("Suppression du compte")){
        newDiv.innerHTML = `
        <p class="historique_date_operation mb-0">${date}</p>
        <p class="historique_banque_operation mb-0">${banque_name}</p>
        <p class="historique_detail_operation mb-0">${detail}</p>
        <p class="historique_category_operation badge ${colorClass[0]} text-white mb-0">${category} ${colorClass[1]}</p>
        <p class="historique_montant_operation mb-0">${montant}€</p>
        <button onclick="deleteOperationHistorique(this)" class="btn btn-danger" disabled><i class="fas fa-trash"></i></button>
      `;
      }else{
        newDiv.innerHTML = `
        <p class="historique_date_operation mb-0">${date}</p>
        <p class="historique_banque_operation mb-0">${banque_name}</p>
        <p class="historique_detail_operation mb-0">${detail}</p>
        <p class="historique_category_operation badge ${colorClass[0]} text-white mb-0">${category} ${colorClass[1]}</p>
        <p class="historique_montant_operation mb-0">${montant}€</p>
        <button onclick="deleteOperationHistorique(this)" class="btn btn-danger"><i class="fas fa-trash"></i></button>
      `;
      }
      

      // Ajouter la nouvelle div au conteneur
      var container = document.getElementById('historique_container_operation');
      container.prepend(newDiv);
    });

    // Réinitialisation des champs après l'affichage des opérations
    document.getElementById('operation_detail').value = '';
    document.getElementById('operation_valeur').value = '';
  };

  request.onerror = function(event) {
    console.error('Erreur lors de la récupération des opérations pour banques_id ' + banques_id, event);
  };
}

function suppressionOperationHistorique(operationId){
  const transaction = db.transaction(['operations'], 'readwrite');
  const objectStore = transaction.objectStore('operations');
  const request = objectStore.delete(operationId);

  request.onsuccess = function(event) { 
    console.log("Opération supprimée : operation_id", operationId, event);
  };

  request.onerror = function(event) {
    console.error("Erreur lors de la suppression de l'opération.", event);
  };
}

function deleteOperationHistorique(button){
  // Récupération de l'id de l'operation
  var operationDiv = button.closest('.operation_historique');
  var operationId = operationDiv.getAttribute('data-operation-id');

  // Récupérer le montant de l'opération
  var montantElement = operationDiv.querySelector('.historique_montant_operation');
  var montantText = montantElement.textContent || montantElement.innerText;
  var montant = parseFloat(parseFloat(montantText.replace('€', '').trim()).toFixed(2));

  var montant_inverse = montant * -1;

  var banques_id = document.getElementById('bankList_operation').value;

  console.log(montant_inverse);

  // operationToCompte mais dans le sens inverse
  operationToCompte(parseInt(banques_id), montant_inverse);

  // Suppression de l'historique
  suppressionOperationHistorique(parseInt(operationId));

  updateOperationListHistorique(parseInt(banques_id));

  loadContent();
}


// ------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------
// --------------- Virements
// ------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------
function virementToHistorique(banque_id, banque_name, compte_debit, compte_credit, montant, date){
  const transaction = db.transaction(['virements'], 'readwrite');
  const store = transaction.objectStore('virements');
  
  const operationData = {
    banques_id: banque_id,
    compte_debit: compte_debit,
    compte_credit: compte_credit,
    montant: montant,
    banque_name : banque_name,
    date: date
  };

  const request = store.add(operationData);

  request.onsuccess = function() {
      console.log('Virement ajoutée avec succès.');
    };
  request.onerror = function(event) {
    console.error("Erreur lors de l'ajout du Virement", event);
  };
}

function updateVirementListHistorique(banques_id){
  document.getElementById('historique_container_virement').innerHTML = '';

  const transaction = db.transaction(['comptes'], 'readwrite');
  const objectStore = transaction.objectStore('comptes');

  const index = objectStore.index('banques_id');
  const requete_compte = index.getAll(banques_id);

  requete_compte.onsuccess = function(event) {
    var comptes_existants = event.target.result;
    var noms_des_comptes = comptes_existants.map(compte => compte.nom_compte);

    const date = new Date();
    var day = ('0' + date.getDate()).slice(-2);
    var month = ('0' + (date.getMonth() + 1)).slice(-2);
    var year = date.getFullYear();
    var dateString = `${day}/${month}/${year}`;

    const transaction = db.transaction(['virements'], 'readonly');
    const store = transaction.objectStore('virements');
    const dateIndex = store.index('date');
    const request = dateIndex.getAll(IDBKeyRange.only(dateString));

    request.onsuccess = function(event) {
      const virements = event.target.result.filter(vi => vi.banques_id === banques_id);

      // Boucler sur chaque opération récupérée
      virements.forEach(virement => {
        // Récupération et traitement des informations de l'opération
        let virement_id = virement.virement_id;
        let compte_debiteur = virement.compte_debit; 
        let compte_crediteur = virement.compte_credit; 
        let montant = virement.montant; 
        let dateString = virement.date; 
        let banque_name = virement.banque_name;

        // Créer une nouvelle div avec les classes appropriées
        var newDiv = document.createElement('div');
        newDiv.className = 'virement_historique d-flex align-items-center justify-content-between mb-2 p-2 border rounded';
        newDiv.setAttribute('data-virement-id', virement_id);

        if (!(noms_des_comptes.includes(compte_debiteur) && noms_des_comptes.includes(compte_crediteur))) {
          // Ajouter le contenu HTML à la nouvelle div
          newDiv.innerHTML = `
          <p class="historique_date_virement mb-0">${dateString}</p>
          <p class="historique_banque_virement mb-0">${banque_name}</p>
          <p class="historique_debit_virement badge bg-debit  mb-0">Débit : ${compte_debiteur}</p>
          <p class="historique_credit_virement badge bg-credit  mb-0">Crédit : ${compte_crediteur}</p>
          <p class="historique_montant_virement mb-0">${montant}€</p>
          <button onclick="deleteVirementHistorique(this)" class="btn btn-danger" disabled><i class="fas fa-trash"></i></button>
          `;
        }else{
          // gère le cas où l'un des comptes n'existe plus. Le virement s'affichera toujours, mais ne pourra plus etre supprimé avec le bouton poubelle
          // Ajouter le contenu HTML à la nouvelle div
          newDiv.innerHTML = `
          <p class="historique_date_virement mb-0">${dateString}</p>
          <p class="historique_banque_virement mb-0">${banque_name}</p>
          <p class="historique_debit_virement badge bg-debit  mb-0">Débit : ${compte_debiteur}</p>
          <p class="historique_credit_virement badge bg-credit  mb-0">Crédit : ${compte_crediteur}</p>
          <p class="historique_montant_virement mb-0">${montant}€</p>
          <button onclick="deleteVirementHistorique(this)" class="btn btn-danger"><i class="fas fa-trash"></i></button>
          `;
        }
        
        // Ajouter la nouvelle div à un conteneur existant dans votre document
        var container = document.getElementById('historique_container_virement'); // Assurez-vous que cet ID existe dans votre HTML
        container.prepend(newDiv);

        // Reinitialisation des inputs
        document.getElementById('virement_valeur').value = '';

        updateComptesListBasedOnBank(banques_id, 'modale2');
      });
    };
    request.onerror = function(event) {
      console.error('Erreur lors de la récupération des virements pour banques_id ' + banques_id, event);
    };
  };
  requete_compte.onerror = function(event) {
    console.error('Erreur lors de la récupération des virements pour banques_id ' + banques_id, event);
  };
  
}

function addVirementToDB(banque_id, banque_name, nom_debit_compte, nom_credit_compte, montant, date){
  // Vérification du solde avant le virement
  const transaction = db.transaction(['comptes'], 'readonly');
  const objectStore_compte = transaction.objectStore('comptes');
  const compteKeyDebit = [banque_id, nom_debit_compte];
  const getRequestDebit = objectStore_compte.get(compteKeyDebit);

  getRequestDebit.onsuccess = function() {
    const compteDebit = getRequestDebit.result;
    if (compteDebit && parseFloat(parseFloat(compteDebit.montant_compte).toFixed(2)) >= montant) {
      operationToCompte(banque_id, -montant, nom_debit_compte); // Débiter
      operationToCompte(banque_id, montant, nom_credit_compte); // Créditer
      
      virementToHistorique(banque_id, banque_name, nom_debit_compte, nom_credit_compte, montant, date);

      // operationToHistorique(banque_id, banque_name, 'VIREMENTS', `Virement interne de ${nom_debit_compte} vers ${nom_credit_compte}`, -montant, date);

      showSuccess('<i class="fa-solid fa-check"></i> Virement effectué.');

      updateVirementListHistorique(banque_id); // Mettre à jour l'affichage, si nécessaire

      loadContent();
    } else {
      showAlert(`<i class="fa-solid fa-xmark"></i> Le solde du compte ${nom_debit_compte} est insuffisant pour le virement.`);
    }
  };

  getRequestDebit.onerror = function() {
    console.error("Erreur lors de la vérification du solde du compte débiteur.");
  };

  // Note: Cette fonction ne peut pas retourner virement_possible de manière synchrone
  // car la vérification du solde et le virement sont asynchrones
}

function suppressionVirementHistorique(virementID){
  const transaction = db.transaction(['virements'], 'readwrite');
  const objectStore = transaction.objectStore('virements');
  const request = objectStore.delete(virementID);

  request.onsuccess = function(event) { 
    console.log("Virement supprimée : virement_id", virementID, event);
  };

  request.onerror = function(event) {
    console.error("Erreur lors de la suppression d'un virement.", event);
  };
}

function deleteVirementHistorique(button){
  // Récupération de l'id de l'operation
  var virementDiv = button.closest('.virement_historique');
  var virementId = virementDiv.getAttribute('data-virement-id');

  // Récupérer le montant de l'opération
  var montantElement = virementDiv.querySelector('.historique_montant_virement');
  var montantText = montantElement.textContent || montantElement.innerText;
  var montant = parseFloat(parseFloat(montantText.replace('€', '').trim()).toFixed(2));

  var banques_id = document.getElementById('banqueList_virement').value;

  var nom_debit_compte = virementDiv.querySelector('.historique_debit_virement');
  var debit_texte = nom_debit_compte.textContent || nom_debit_compte.innerText;
  var debit = debit_texte.replace('Débit : ','').trim();

  var nom_credit_compte = virementDiv.querySelector('.historique_credit_virement');
  var credit_texte = nom_credit_compte.textContent || nom_credit_compte.innerText;
  var credit = credit_texte.replace('Crédit : ','').trim(); 

  // operationToCompte mais dans le sens inverse
  operationToCompte(parseInt(banques_id), montant, debit); // Débiter
  operationToCompte(parseInt(banques_id), -montant, credit); // Créditer

  // Suppression de l'historique
  suppressionVirementHistorique(parseInt(virementId));

  updateVirementListHistorique(parseInt(banques_id));

  updateComptesListBasedOnBank(parseInt(banques_id), 'modale2');

  loadContent();
}






// ------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------
// --------------- Budget
// ------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------

function budget(){
  var banque_id = parseInt(document.getElementById('bankList_budget').value); 

  var revenu = parseInt(document.getElementById('budget_revenu').value); 
  var courses = parseInt(document.getElementById('budget_courses').value); 
  var loisirs = parseInt(document.getElementById('budget_loisirs').value); 
  var charges = parseInt(document.getElementById('budget_charges').value); 
  var abonnements = parseInt(document.getElementById('budget_abonnements').value); 
  var virements = parseInt(document.getElementById('budget_virements').value); 
  var divers = parseInt(document.getElementById('budget_divers').value); 

  somme_budget = courses + loisirs + charges + abonnements + virements + divers;

  if (!(banque_id > 0)){
    showAlert('<i class="fa-solid fa-xmark"></i> Veuillez choisir une banque');
  }else if(!(revenu >= 0 && courses >= 0 && loisirs >= 0 && charges >= 0 && abonnements >= 0 && virements >= 0 && divers >= 0)){
    showAlert('<i class="fa-solid fa-xmark"></i> Remplissez tous les budgets');
  }else if(somme_budget > revenu){
    showAlert('<i class="fa-solid fa-xmark"></i> Attention, votre budget dépasse vos revenus');
  }else{
    addBudget(banque_id, revenu, courses, loisirs, charges, abonnements, virements, divers);
  }
}

function loadBudget(banque_id){
  //
  // Chargement du budget créé sur le mois
  //

  const date = new Date();
  const monthYear = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`; // Format MM/YYYY

  // Ouvrir une transaction sur la base de données
  const transaction = db.transaction(['budget'], 'readwrite');
  const store = transaction.objectStore('budget');

  // Utiliser un index pour rechercher tous les budgets pour ce mois
  const index = store.index('date');
  const request = index.openCursor(IDBKeyRange.only(monthYear));

  request.onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      console.log('ta gueule', banque_id);
      // Vérifier si ce budget correspond à la banque_id recherchée
      if (cursor.value.banque_id === banque_id) {
        // Un budget correspondant trouvé, mise à jour
        const updateData = cursor.value;
        document.getElementById('budget_revenu').value = updateData.budget_revenu;
        document.getElementById('budget_courses').value = updateData.budget_courses;
        document.getElementById('budget_loisirs').value = updateData.budget_loisirs;
        document.getElementById('budget_charges').value = updateData.budget_charges;
        document.getElementById('budget_abonnements').value = updateData.budget_abonnements;
        document.getElementById('budget_virements').value = updateData.budget_virements;
        document.getElementById('budget_divers').value = updateData.budget_divers;

      } else {
        cursor.continue(); // Continuer le parcours si ce n'est pas le bon enregistrement
      }
    }
  };

  request.onerror = (event) => {
    console.error('Erreur lors de la tentative de chargement du budget.', event);
  };
}

function addBudget(banque_id, budget_revenu, budget_courses, budget_loisirs, budget_charges, budget_abonnements, budget_virements, budget_divers) {
  //
  // Ajout ou modification du budget sur le mois en cours
  //

  const date = new Date();
  const monthYear = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`; // Format MM/YYYY
  let budgetFound = false;

  // Ouvrir une transaction sur la base de données
  const transaction = db.transaction(['budget'], 'readwrite');
  const store = transaction.objectStore('budget');

  // Utiliser un index pour rechercher tous les budgets pour ce mois
  const index = store.index('date');
  const request = index.openCursor(IDBKeyRange.only(monthYear));

  request.onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      // Vérifier si ce budget correspond à la banque_id recherchée
      if (cursor.value.banque_id === banque_id) {
        // Un budget correspondant trouvé, mise à jour
        const updateData = cursor.value;
        updateData.budget_revenu = budget_revenu;
        updateData.budget_courses = budget_courses;
        updateData.budget_loisirs = budget_loisirs;
        updateData.budget_charges = budget_charges;
        updateData.budget_abonnements = budget_abonnements;
        updateData.budget_virements = budget_virements;
        updateData.budget_divers = budget_divers;

        store.put(updateData);
        showSuccess('<i class="fa-solid fa-check"></i> Budget mis à jour avec succès.');
        budgetFound = true; // Marquer qu'un budget a été trouvé et mis à jour

        loadContent()
      } else {
        cursor.continue(); // Continuer le parcours si ce n'est pas le bon enregistrement
      }
    } else if (!budgetFound) {
      // Si aucun budget correspondant n'a été trouvé après le parcours, ajouter un nouvel enregistrement
      const newData = {
        banque_id: banque_id,
        date: monthYear,
        budget_revenu: budget_revenu,
        budget_courses: budget_courses,
        budget_loisirs: budget_loisirs,
        budget_charges: budget_charges,
        budget_abonnements: budget_abonnements,
        budget_virements: budget_virements,
        budget_divers: budget_divers,
      };
      store.add(newData);
      showSuccess('<i class="fa-solid fa-check"></i> Nouveau budget ajouté avec succès.');

      loadContent()
    }
  };

  request.onerror = (event) => {
    console.error('Erreur lors de la tentative d\'ajout/mise à jour du budget.', event);
  };
}







// ------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------- Gestion de la banque
// ------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------

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
          showAlert('<i class="fa-solid fa-xmark"></i> Cette banque existe déjà !');
        } else {
          addBankToDB(bankName); // ajout dans la base de données
          showSuccess('<i class="fa-solid fa-check"></i> Banque ajoutée !');
        }
      };

      request.onerror = function() {
        console.error('Erreur lors de la vérification de l\'existence de la banque');
      };

      // Réinitialisez le champ de texte
      document.getElementById('newBankName').value = '';
  } else {
    showAlert('<i class="fa-solid fa-xmark"></i> Veuillez entrer un nom de banque.');
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
    showAlert('<i class="fa-solid fa-xmark"></i> Veuillez sélectionner une banque à supprimer.');
  }
}








// ------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------- Gestion des comptes
// ------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------
function addCompte() {
  var nom_compte = document.getElementById('newCompteName').value;
  var banque_id = document.getElementById('bankList').value;

  if(nom_compte && banque_id !== '') {
    addCompteToDB(nom_compte, parseInt(banque_id));

    // Réinitialisez le champ de texte
    document.getElementById('newCompteName').value = '';
  } else {
    showAlert('<i class="fa-solid fa-xmark"></i> Veuillez entrer un nom de compte et choisir une banque.');
  }
}

function deleteCompte() {
  var compteList = document.getElementById('compteList');
  var compteName = compteList.value;
  if(compteName) {
    var CC_test = compteList.options[compteList.selectedIndex].text;
    if(CC_test != 'CC'){
      // Supposer que l'ID de la banque est stocké dans la valeur de l'option
      // var compte_name = compteList.options[compteList.selectedIndex].value;
      deleteCompteFromDb(compteName);

    }else{
      showAlert('<i class="fa-solid fa-xmark"></i> Vous ne pouvez pas supprimer le CC de votre banque.');
    }
      
  } else {
    showAlert('<i class="fa-solid fa-xmark"></i> Veuillez sélectionner un compte à supprimer.');
  }
}








// ------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------- Gestion des opérations
// ------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------
// Bouton checked (+ / -)
function toggleCheckbox(current, otherId) {
  if (current.checked) {
    document.getElementById(otherId).checked = false;
  }
}

function operation() {
  // Captation des éléments de l'operation
  var banque_id = document.getElementById('bankList_operation').value;
  var banque_name = document.getElementById('bankList_operation').options[document.getElementById('bankList_operation').selectedIndex].text;

  var category = document.getElementById('category').value;
  var detail = document.getElementById('operation_detail').value;
  var montant = document.getElementById('operation_valeur').value;

  var moins = document.getElementById('btn-check-minus').checked;
  var plus = document.getElementById('btn-check-plus').checked;

  const date = new Date();
  var day = ('0' + date.getDate()).slice(-2);
  var month = ('0' + (date.getMonth() + 1)).slice(-2);
  var year = date.getFullYear();
  var dateString = `${day}/${month}/${year}`;

  if (!banque_id){
    showAlert('<i class="fa-solid fa-xmark"></i> Veuillez choisir une banque.');
  }
  else if (!category){
    showAlert('<i class="fa-solid fa-xmark"></i> Veuillez choisir une catégorie.');
  }
  else if (!montant){
    showAlert('<i class="fa-solid fa-xmark"></i> Veuillez inscrire un montant.');
  }
  else if (!moins && !plus){
    showAlert("<i class='fa-solid fa-xmark'></i> Veuillez indiquer s'il s'agit d'une opération + ou - .");
  }
  else{

    
    // signe de l'operation
    if (moins){
      montant = '-' + montant;
    }

    montant = parseFloat(parseFloat(montant).toFixed(2));

    console.log(banque_name);

    addOperationToDB(parseInt(banque_id), banque_name, category, detail, montant, dateString);
  }

  
}







// ------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------- Gestion des virements
// ------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------
function virement() {
  // Captation des éléments de l'operation
  var debit = document.getElementById('compteList_virement_debit').value;
  var credit = document.getElementById('compteList_virement_credit').value;
  var banque_id = document.getElementById('banqueList_virement').value;
  var banque_name = document.getElementById('banqueList_virement').options[document.getElementById('banqueList_virement').selectedIndex].text;
  var montant = document.getElementById('virement_valeur').value;


  var date = new Date();
  var day = ('0' + date.getDate()).slice(-2);
  var month = ('0' + (date.getMonth() + 1)).slice(-2);
  var year = date.getFullYear();
  var dateString = `${day}/${month}/${year}`;

  if (!banque_id){
    showAlert('<i class="fa-solid fa-xmark"></i> Veuillez choisir une banque.');
  }
  else if (!debit){
    showAlert('<i class="fa-solid fa-xmark"></i> Veuillez choisir un compte débiteur.');
  }
  else if (!montant){
    showAlert('<i class="fa-solid fa-xmark"></i> Veuillez inscrire un montant.');
  }
  else if (!credit){
    showAlert('<i class="fa-solid fa-xmark"></i> Veuillez choisir un compte créditeur');
  }
  else if(credit != debit){
    addVirementToDB(parseInt(banque_id), banque_name, debit, credit, parseFloat(parseFloat(montant).toFixed(2)), dateString);
  }else{
    showAlert('<i class="fa-solid fa-xmark"></i> Le compte débiteur et le compte créditeur doivent être différents')
  }
}













// ------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------- Chargement de la page
// ------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------
function guideOrNot(){
  var dbRequest = indexedDB.open("MaBaseDeDonnees");

  dbRequest.onsuccess = function(event) {
    const db = event.target.result;
    const transaction = db.transaction(['banques'], 'readonly'); 
    const store = transaction.objectStore('banques');
    const countRequest = store.count();
  
    countRequest.onsuccess = function() {
      const numberOfBanks = countRequest.result;
      if (numberOfBanks > 0) {
        document.getElementById('guideContainer').style.display = 'none';
        document.getElementById('selectionBanqueContent').style.display = 'block';
      } else {
        document.getElementById('guideContainer').style.display = 'flex';
        document.getElementById('selectionBanqueContent').style.display = 'none';
      }
    };
  
    countRequest.onerror = function(event) {
      console.error("Erreur lors de la récupération du nombre de banques:", event.target.error);
    };
  };
  
  dbRequest.onerror = function(event) {
    console.error("Erreur lors de l'ouverture de la base de données:", event.target.error);
  };
  
}

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


// ---------------------------------------------------------------------------------- Fonction pour ouvrir une modale spécifique
function openModal(modalId) {
  document.getElementById(modalId).style.display = 'block';

  // Identifier et réinitialiser les listes déroulantes dans le modale
  const defaultOptionValue = ''; // La valeur de l'option par défaut
  const selectElements = document.querySelectorAll(`#${modalId} select`); // Sélectionner tous les éléments <select> dans le modale

  selectElements.forEach(function(select) {
    select.value = defaultOptionValue; // Réinitialiser la valeur à celle de l'option par défaut
  });

  if (modalId === 'bankModal'){
    document.getElementById('virement').disabled = true;
    document.getElementById('operation').disabled = true;

    updateComptesListBasedOnBank(NaN, 'modale1');
  }else if(modalId === 'virementModal'){
    document.getElementById('banque').disabled = true;
    document.getElementById('operation').disabled = true;
    document.getElementById('historique_container_virement').innerHTML = '';
    updateComptesListBasedOnBank(NaN, 'modale2');
  }else if(modalId === 'operationModal'){
    document.getElementById('virement').disabled = true;
    document.getElementById('banque').disabled = true;
    document.getElementById('historique_container_operation').innerHTML = '';
  };

}

// Fonction pour fermer la modale spécifique
function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
  document.getElementById('operation').disabled = false;
  document.getElementById('banque').disabled = false;
  document.getElementById('virement').disabled = false;
}

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























// ------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------- CONTENT
// ------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------

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



function loadContent(){
  guideOrNot();

  var banque_id = document.getElementById('bankListContent').value;
  banque_id = parseInt(banque_id);

  if (banque_id > 0) {
  // Affiche les éléments si banque_id n'est pas 0 et met à jour les affichages
    document.getElementById('containerContentHistoriques').style.display = 'block';
    document.getElementById('topRow').style.display = 'flex';
    
    // fonction pour déterminer l'affichage des graphiques
    adjustDisplayForScreenSize();

    //Remise à zéro des éléments
    document.getElementById('montantDesComptes').innerHTML = '';

    // Mise à jour de l'historique des opérations
    var checkbox = document.getElementById('operations-checkbox');
    checkbox.checked = true; // Cocher le checkbox
    checkbox.dispatchEvent(new Event('change')); // Déclencher l'événement change manuellement

    // mise à jour des montants des comptes
    updateSolde(banque_id);

    loadMonthYearList(banque_id);

  } else {
    // Cache les éléments si banque_id est 0 
    document.getElementById('containerContentHistoriques').style.display = 'none';
    document.getElementById('topRow').style.display = 'none';
    document.getElementById('graphiquesContainer').style.display = 'none';
  }
}

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

function verify_selected_filters(mois, annee, callback) {
  const dbRequest = indexedDB.open("MaBaseDeDonnees");

  dbRequest.onsuccess = function(event) {
    const db = event.target.result;
    const transaction = db.transaction(['operations'], 'readonly');
    const store = transaction.objectStore('operations');
    const request = store.getAll();

    request.onsuccess = function() {
      const operations = request.result;
      let dates = new Set();  // Utilisation d'un Set pour éviter les doublons

      // Parcourir toutes les opérations pour extraire les combinaisons mois/année
      operations.forEach(operation => {
        const [day, month, year] = operation.date.split('/');
        if (month && year) {  // S'assurer que le mois et l'année sont disponibles
          dates.add(`${month}/${year}`);
        }
      });


      // Vérifier si la combinaison mois/année sélectionnée est présente dans les données extraites
      const selectedMonthYear = `${mois.toString().padStart(2, '0')}/${annee}`;

      const isAvailable = dates.has(selectedMonthYear);

      callback(null, isAvailable);  // Appeler le callback avec le résultat
    };

    request.onerror = function(event) {
      console.error('Erreur lors de la récupération des opérations:', event.target.error);
      callback(event.target.error, null);
    };
  };

  dbRequest.onerror = function(event) {
    console.error("Erreur lors de l'ouverture de la base de données:", event.target.error);
    callback(event.target.error, null);
  };
}

function updateDataBasedOnSelection() {
  var banque_id = parseInt(document.getElementById('bankListContent').value);
  var mois = document.getElementById('dateMonthList').value;
  var annee = document.getElementById('dateYearList').value;

  var optionAnneeCamCheck = document.getElementById('optionAnneeCam').checked;

  verify_selected_filters(mois, annee, function(error, isAvailable) {
    if (error) {
      console.log('Erreur lors de la vérification des filtres:', error);
    } else if(banque_id && isAvailable){
      loadBudgetData(banque_id, mois, annee);

      if (optionAnneeCamCheck){
        loadPieChart(banque_id, '', annee);
      }else{
        loadPieChart(banque_id, mois, annee);
      }
      
      updateEpargne(banque_id, mois, annee);
      updateDataBasedOnOption();
    }else{
      showAlert(`<i class="fa-solid fa-xmark"></i> La sélection des filtres est incorrecte. Mois : ${mois}, Année : ${annee}`);
      console.log("Toutes les sélections nécessaires ne sont pas faites.");
    }
  });  
}

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


function updateDataBasedOnOption() {
  var banque_id = parseInt(document.getElementById('bankListContent').value);
  var mois = document.getElementById('dateMonthList').value;
  var annee = document.getElementById('dateYearList').value;

  var optionAnneeLinCheck = document.getElementById('optionAnneeLin').checked;


  verify_selected_filters(mois, annee, function(error, isAvailable) {
    if (error) {
      console.log('Erreur lors de la vérification des filtres:', error);
    } else if(banque_id && isAvailable){
      loadLinearChart(banque_id, optionAnneeLinCheck, mois, annee);
    }else{
      showAlert(`<i class="fa-solid fa-xmark"></i> La sélection des filtres est incorrecte. Mois : ${mois}, Année : ${annee}`);
      console.log("Toutes les sélections nécessaires ne sont pas faites.");
    }
  }); 
}



// ------------------------------------------------ SOLDE + BUDGET

function updateSolde(banque_id){
  const transaction = db.transaction(['comptes'], 'readonly');
  const objectStore_compte = transaction.objectStore('comptes');
  const index = objectStore_compte.index('banques_id'); // Utiliser l'index 'banques_id'
  const getRequest = index.getAll(banque_id); // Récupérer tous les comptes pour ce banque_id

  getRequest.onsuccess = function() {
    const comptes = getRequest.result;

    let somme = 0;
    let montantCC = 0; // Initialiser le montant du compte 'CC'

    // Parcourir chaque compte et additionner les montants
    comptes.forEach(function(compte) {
      somme += parseFloat(parseFloat(compte.montant_compte).toFixed(2)); // Assurez-vous que montant_compte est un nombre
      if (compte.nom_compte === 'CC') {
        montantCC = parseFloat(parseFloat(compte.montant_compte).toFixed(2)); // Mémoriser le montant du compte 'CC'
      }else{
        var newDiv = document.createElement('div');
        newDiv.className = 'contentCompteEtMontant';
        var signeMontantCompte = compte.montant_compte >= 0 ? '+' : '';
        newDiv.innerHTML = `
        <div class="conteneurNomCompte">
          <i class="fa-solid fa-piggy-bank" style="color: #fdb572;"></i>
          <p class="contentNomCompte mb-0">${compte.nom_compte}</p>
        </div>
        <p class="contentMontantCompte mb-0">${signeMontantCompte} ${compte.montant_compte.toLocaleString('fr-FR')}€</p>
        `;

        var container = document.getElementById('montantDesComptes'); // Assurez-vous que cet ID existe dans votre HTML
        container.append(newDiv);
      }
    });
    var signe = somme >= 0 ? '+' : '';
    var signeCC = montantCC >= 0 ? '+' : '';

    document.getElementById('montantTotalAvoirs').innerHTML = signe + ' ' + somme.toLocaleString('fr-FR') + '€';
    document.getElementById('soldeCC').innerHTML = signeCC + ' ' + montantCC.toLocaleString('fr-FR') + '€';
  };

  getRequest.onerror = function(event) {
    console.error('Update solde : erreur', event);
  };
}

function updateEpargne(banque_id, mois, annee){
  const transaction = db.transaction(['operations'], 'readonly');
  const objectStore_operation = transaction.objectStore('operations');

  const monthYear = `${mois}/${annee}`;

  var epargne = 0;


  objectStore_operation.index('date').openCursor().onsuccess = function(event) {
    const cursor = event.target.result;
    if (cursor) {
      if (parseInt(cursor.value.banques_id) === banque_id && cursor.value.date.includes(monthYear)) {
        let op = cursor.value;
        epargne += op.montant;
      }
      cursor.continue();
    }else{
      var signeEpargne = epargne >= 0 ? '+' : '';
      var couleurEpargne = epargne > 0 ? '#6a994e' : '#ef233c';

      document.getElementById('montantEpargne').innerHTML = signeEpargne + ' ' + epargne.toLocaleString('fr-FR') + '€';
      document.getElementById('montantEpargne').style.color = couleurEpargne;
    }
  };
}

function loadMonthYearList(banque_id) {
  const transaction = db.transaction(['operations'], 'readonly');
  const store = transaction.objectStore('operations');
  const index = store.index('banques_id');
  const request = index.getAll(banque_id);

  const monthMap = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  let uniqueMonths = new Set();
  let uniqueYears = new Set();

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-based
  const currentYear = currentDate.getFullYear();

  request.onsuccess = function(event) {
    const operations = event.target.result;

    operations.forEach(op => {
      const dateParts = op.date.split('/');
      const month = dateParts[1]; // MM
      const year = dateParts[2]; // YYYY

      uniqueMonths.add(month);
      uniqueYears.add(year);
    });

    const monthSelect = document.getElementById('dateMonthList');
    const yearSelect = document.getElementById('dateYearList');

    // Clear the current options
    monthSelect.innerHTML = '<option value="">Mois</option>';
    yearSelect.innerHTML = '<option value="">Année</option>';

    uniqueMonths.forEach(month => {
      const monthOption = document.createElement('option');
      monthOption.value = month;
      monthOption.textContent = monthMap[parseInt(month, 10) - 1];
      monthSelect.appendChild(monthOption);
    });

    uniqueYears.forEach(year => {
      const yearOption = document.createElement('option');
      yearOption.value = year;
      yearOption.textContent = year;
      yearSelect.appendChild(yearOption);
    });

    // Find closest year and month if current is not available
    let closestYear = [...uniqueYears].reduce((prev, curr) => Math.abs(curr - currentYear) < Math.abs(prev - currentYear) ? curr : prev);
    let closestMonth = [...uniqueMonths].reduce((prev, curr) => Math.abs(curr - currentMonth) < Math.abs(prev - currentMonth) ? curr : prev);

    // Adjust closestMonth if year was not the current year
    if (parseInt(closestYear) !== currentYear) {
      closestMonth = '12'; // Default to December if not current year
    }

    monthSelect.value = closestMonth;
    yearSelect.value = closestYear;
    yearSelect.dispatchEvent(new Event('change')); // Déclencher l'événement change manuellement
  };

  request.onerror = function(event) {
    console.error('Unable to load dates for bank ID:', banque_id, event);
  };
}

function content_budget(monthYear, banque_id, callback) {

  const dbRequest = indexedDB.open("MaBaseDeDonnees");
  
  dbRequest.onsuccess = function(event) {
    const db = event.target.result;
    const transaction = db.transaction(['operations', 'budget'], 'readonly');
    const operationsStore = transaction.objectStore('operations');
    const budgetStore = transaction.objectStore('budget');
    
    // Préparation des données de sortie
    let budgetResult = {
      "COURSES": { depense: 0, budget: 0, reste: 0 },
      "LOISIRS": { depense: 0, budget: 0,  reste: 0 },
      "CHARGES": { depense: 0, budget: 0, reste: 0 },
      "ABONNEMENTS": { depense: 0, budget: 0, reste: 0 },
      "VIREMENTS": { depense: 0, budget: 0, reste: 0 },
      "DIVERS": { depense: 0, budget: 0, reste: 0 }
    };
    let operationsCount = {
      "COURSES": 0,
      "LOISIRS": 0,
      "CHARGES": 0,
      "ABONNEMENTS": 0,
      "VIREMENTS": 0,
      "DIVERS":0
    };

    // Filtrer les opérations par mois/année et banque_id
    operationsStore.index('date').openCursor().onsuccess = function(event) {
      const cursor = event.target.result;
      if (cursor) {
        if (parseInt(cursor.value.banques_id) === banque_id && cursor.value.date.includes(monthYear)) {
          let op = cursor.value;
          if (budgetResult[op.category]) {
            operationsCount[op.category]++;
            budgetResult[op.category].depense += op.montant;
          }
        }
        cursor.continue(); // Poursuivre avec le prochain élément
      } else {
        // Une fois toutes les opérations traitées, traiter les données de budget
        budgetStore.index('date').openCursor(IDBKeyRange.only(monthYear)).onsuccess = function(event) {
          const cursorBudgetData = event.target.result;
          if (cursorBudgetData) {
            if (parseInt(cursorBudgetData.value.banque_id) === banque_id) {
              const budgetData = cursorBudgetData.value;
              Object.keys(budgetResult).forEach(category => {
                if (budgetData['budget_' + category.toLowerCase()]) {
                  budgetResult[category].budget = budgetData['budget_' + category.toLowerCase()];
                  budgetResult[category].reste = Math.round(budgetResult[category].budget + budgetResult[category].depense);
                }
              });
              cursorBudgetData.continue(); // Continuer à parcourir
            } else {
              cursorBudgetData.continue(); // Ne correspond pas, continuer
            }
          } else {
            // Aucun autre élément à traiter, appeler le callback
            callback(budgetResult, operationsCount);
          }
        };
      }
    };
    
    dbRequest.onerror = function(event) {
      console.error('Erreur lors de la récupération des opérations:', event.target.error);
    };    
  };
  
  dbRequest.onerror = function(event) {
    console.error('Database error: ', event.target.errorCode);
  };
}

function loadBudgetData(banque_id, mois, annee) {
  document.getElementById('row_1').innerHTML = '';
  document.getElementById('row_2').innerHTML = '';

  const categories = {
    "COURSES": ["row_1","bg-courses","fa-solid fa-utensils"],
    "LOISIRS": ["row_1","bg-loisirs","fa-solid fa-cart-shopping"],
    "CHARGES": ["row_1","bg-charges","fa-solid fa-file-invoice-dollar"],
    "ABONNEMENTS": ["row_2","bg-abonnements","fa-regular fa-credit-card"],
    "VIREMENTS": ["row_2","bg-virements","fa-solid fa-cash-register"],
    "DIVERS": ["row_2","bg-divers","fa-solid fa-otter"]
  };


  const monthYear = `${mois}/${annee}`;

  // Appeler la fonction budget qui récupère et traite les données
  content_budget(monthYear, banque_id, function(budgetResult, operationsCount) {
    // Boucle pour mettre à jour l'interface pour chaque catégorie
    Object.entries(categories).forEach(([category, content]) => {
      var divId = content[0];
      var couleurPremier = content[1];
      var iconBudget = content[2];

      const categoryDiv = document.getElementById(divId);

      if (categoryDiv) {
        const categoryData = budgetResult[category];
        const evolutionIcon = categoryData.reste > 0 ? "fa-arrow-trend-up" : "fa-arrow-trend-down";

        const evolutionBgColor = categoryData.reste > 0 ? "evolutionGreen": "evolutionRed";

        var newDiv = document.createElement('div');
        newDiv.className = `content_budget mb-2 rounded`;
        newDiv.innerHTML = `
          <div class="contentBudgetTop">
            <i class="iconBudgetCategorie ${iconBudget} ${couleurPremier}" ></i> <!-- Vous devrez adapter l'icône en fonction de la catégorie -->
            <p class="categorieBudgetTitre">${category}</p>
            <div class="contentBudgetEvolution ${evolutionBgColor}">
              <i class="fa-solid ${evolutionIcon}"></i>
              <p>${categoryData.reste}€</p>
            </div>
          </div>
          <div class="contentBudgetDiff">
            <p class="budgetDiffDepense">${categoryData.depense.toLocaleString()}</p>
            <p class="budgetDiffbudget"> / ${categoryData.budget.toLocaleString()}</p>
          </div>
          <div class="contentBudgetNbOperation">${operationsCount[category]} opération(s)</div>
        `;

        var container = document.getElementById(divId); // Assurez-vous que cet ID existe dans votre HTML
        container.append(newDiv);

      } else {
        console.error(`L'élément avec l'ID "${divId}" n'existe pas.`);
      }
    });
  });
}




// ------------------------------------------------ GRAPHIQUES

function loadPieChart(banque_id, mois, annee) {
  const monthYear = `${mois}/${annee}`;
  const container = document.querySelector(".camembertGraph");
  container.innerHTML = '';

  const dbRequest = indexedDB.open("MaBaseDeDonnees");

  dbRequest.onsuccess = function(event) {
    const db = event.target.result;
    const transaction = db.transaction(['operations'], 'readonly');
    const store = transaction.objectStore('operations');
    const index = store.index('date');
    const request = index.getAll();

    request.onsuccess = function(event) {
      const operations = event.target.result;
      const filteredOperations = operations.filter(operation => 
        operation.date.includes(monthYear) && 
        operation.banques_id === banque_id &&
        operation.montant < 0
      );

      if(filteredOperations.length > 0){
        let categorySpending = {};
        let totalSpending = 0;

        filteredOperations.forEach(op => {
          if (categorySpending[op.category]) {
            categorySpending[op.category] += Math.abs(op.montant);
          } else {
            categorySpending[op.category] = Math.abs(op.montant);
          }
          totalSpending += Math.abs(op.montant);
        });

        const chartData = {
          series: Object.values(categorySpending),
          labels: Object.keys(categorySpending)
        };

        const categoryColors = {
          "DIVERS": '#a5a58d',
          "SALAIRE": '#6a994e',
          "AIDE": '#f72585',
          "LOISIRS": '#ffb703',
          "CHARGES": '#ef233c',
          "ABONNEMENTS": '#00b4d8',
          "VIREMENTS": '#b5179e',
          "COURSES": '#f17105'
        };
        
        const chartColors = chartData.labels.map(label => categoryColors[label.toUpperCase()]);

        var options = {
          series: chartData.series,
          chart: {
            type: 'donut',
            height: 350
          },
          labels: chartData.labels,
          colors: chartColors,
          tooltip: {
            y: {
              formatter: (value) => `${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })}€`
            }
          },
          dataLabels: {
            enabled: true // on affiche ou non les données sur le graphique
          },
          plotOptions: {
            pie: {
              customScale: 0.9,
              donut: {
                labels: {
                  show: true,
                  total: {
                    show: true,
                    label: 'Total dépenses',
                    fontWeight : 'bold',
                    fontSize: '1.5em',
                    formatter: function (w) {
                      // Calculer le total
                      const total = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                      // Utiliser toLocaleString pour formater le total
                      return total.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + '€';
                    }
                  }
                }
              }
            }
          }
        };

        // Attente de 50ms avant d'afficher le graphique, pour qu'il ait le temps de charger
        setTimeout(function() {
          var chart = new ApexCharts(container, options);
          chart.render();
        }, 100);
      }else{
        container.innerHTML = `Sélection invalide. Mois : ${mois}, Année : ${annee}`;
      }
    };

    request.onerror = function(event) {
      console.error('Erreur lors de la récupération des données pour le graphique', event);
    };
  };

  dbRequest.onerror = function(event) {
    console.error("Erreur lors de l'ouverture de la base de données:", event);
  };
}

function get_evolution_solde(banque_id, callback) {
  const dbRequest = indexedDB.open("MaBaseDeDonnees");
  let soldeEvolution = {};

  dbRequest.onsuccess = function(event) {
    const db = event.target.result;
    const transaction = db.transaction(['operations'], 'readonly');
    const operationsStore = transaction.objectStore('operations');
    const index = operationsStore.index('banques_id');
    const request = index.getAll(banque_id);

    request.onsuccess = function(event) {
      const operations = event.target.result;
      let currentBalance = 0; // Debut avec une balance de 0

      // First, sort the operations by date
      operations.sort((a, b) => new Date(a.date) - new Date(b.date));

      operations.forEach(op => {
        const opDate = op.date;
        if (!soldeEvolution[opDate]) {
          soldeEvolution[opDate] = currentBalance;
        }
        // Add or subtract the operation amount from the current balance
        currentBalance += op.montant;
        // Update the balance for the operation date
        soldeEvolution[opDate] = currentBalance;
      });

      callback(null, soldeEvolution); // Return the balance evolution
    };

    request.onerror = function(event) {
      console.error('Erreur lors de la récupération des opérations:', event.target.error);
      callback(event.target.error, null);
    };
  };

  dbRequest.onerror = function(event) {
    console.error("Erreur lors de l'ouverture de la base de données:", event.target.error);
    callback(event.target.error, null);
  };
}

function loadLinearChart(banque_id, selectionAnnee = true, mois, annee) {
  get_evolution_solde(banque_id, function(error, soldeEvolution) {
    const container = document.querySelector(".linearGraph");
    container.innerHTML = '';

    if (error) {
      console.error('Erreur lors de la récupération de l\'évolution du solde:', error);
    } else {
      let categories = [];
      let seriesData = [];

      // Convertir l'objet soldeEvolution en tableau et trier par date
      Object.entries(soldeEvolution)
        .sort((a, b) => new Date(a[0]) - new Date(b[0]))
        .forEach(([date, montant]) => {
          const [d, m, y] = date.split('/').map(Number);
          if (selectionAnnee && y === parseInt(annee)) {
            let formattedMonth = `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
            if (!categories.includes(formattedMonth)) {
              categories.push(formattedMonth);
              seriesData.push(parseFloat(montant.toFixed(2)));
            }
          } else if (!selectionAnnee && y === parseInt(annee) && m === parseInt(mois)) {
            categories.push(`${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`);
            seriesData.push(parseFloat(montant.toFixed(2)));
          }
        });

      // Configuration du graphique ApexCharts
      var options = {
        series: [{
          name: 'Total des avoirs',
          data: seriesData
        }],
        chart: {
          type: 'area',
          height: 350,
          toolbar: {
            show: true
          },
          zoom: {
            enabled: false
          }
        },
        dataLabels: {
          enabled: false
        },
        stroke: {
          curve: 'smooth'
        },
        markers: { // Configuration des marqueurs
          size: 5, // Taille des marqueurs
          colors: undefined, // Couleur des marqueurs, undefined prend la couleur de la série
          strokeColors: '#fff', // Couleur de contour des marqueurs
          strokeWidth: 2, // Épaisseur du contour des marqueurs
          strokeOpacity: 0.9, // Opacité du contour
          fillOpacity: 1, // Opacité de remplissage des marqueurs
          discrete: [], // Vous pouvez définir des marqueurs discrets avec des styles spéciaux
          shape: "circle", // Forme des marqueurs (circle, square, rect)
          radius: 2, // Rayon pour arrondir les coins si la forme est square ou rect
          offsetX: 0, // Décalage horizontal des marqueurs
          offsetY: 0 // Décalage vertical des marqueurs
        },
        xaxis: {
          categories: categories,
          type: 'datetime',
          labels: {
            rotate: -15,
            rotateAlways: true
          }
        },
        tooltip: {
          x: {
            format: 'dd/MM/yy'
          }
        },
        fill: {
          type: 'gradient',
          gradient: {
            shadeIntensity: 1,
            inverseColors: false,
            opacityFrom: 0.5,
            opacityTo: 0,
            stops: [0, 90, 100]
          }
        }
      };

      // Sélection de la div pour le graphique
      var chart = new ApexCharts(container, options);
      chart.render();
    }
  });
}









// ------------------------------------------------ HISTORIQUE

function addLoadMoreButtonOperation() {
  let container = document.getElementById('contentHistoriques');
  let loadMoreButtonWrapper = document.createElement('div'); // Créer un nouveau conteneur pour le bouton
  loadMoreButtonWrapper.style.textAlign = 'center'; // Centrer le contenu du conteneur

  let loadMoreButton = document.getElementById('loadMoreOperations');
  if (!loadMoreButton) {
    loadMoreButton = document.createElement('button');
    loadMoreButton.id = 'loadMoreOperations';
    loadMoreButton.className = 'btn-load-more'; // Ajoutez des classes pour le style si nécessaire

    // Créer l'élément <i> pour l'icône
    let icon = document.createElement('i');
    icon.className = 'fa-solid fa-plus';
    loadMoreButton.appendChild(icon); // Ajouter l'icône au bouton

    // Ajouter du texte au bouton
    // loadMoreButton.appendChild(document.createTextNode(' Charger plus'));

    loadMoreButtonWrapper.appendChild(loadMoreButton);
    container.appendChild(loadMoreButtonWrapper); // Ajouter le wrapper au container principal
  } else {
    loadMoreButton.style.display = 'block'; // Rendre le bouton à nouveau visible si nécessaire
  }

  // Lorsque le bouton est cliqué, chargez plus d'opérations et cachez ce bouton
  loadMoreButton.onclick = function() {
    loadMoreButtonWrapper.remove();  // Supprimer le bouton après le clic
    loadHistoriqueOperations(true);
  };
}

function addLoadMoreButtonVirement() {
  let container = document.getElementById('contentHistoriques');
  let loadMoreButtonWrapper = document.createElement('div'); // Créer un nouveau conteneur pour le bouton
  loadMoreButtonWrapper.style.textAlign = 'center'; // Centrer le contenu du conteneur

  let loadMoreButton = document.getElementById('loadMoreOperations');
  if (!loadMoreButton) {
    loadMoreButton = document.createElement('button');
    loadMoreButton.id = 'loadMoreOperations';
    loadMoreButton.className = 'btn-load-more'; // Ajoutez des classes pour le style si nécessaire

    // Créer l'élément <i> pour l'icône
    let icon = document.createElement('i');
    icon.className = 'fa-solid fa-plus';
    loadMoreButton.appendChild(icon); // Ajouter l'icône au bouton

    // Ajouter du texte au bouton
    // loadMoreButton.appendChild(document.createTextNode(' Charger plus'));

    loadMoreButtonWrapper.appendChild(loadMoreButton);
    container.appendChild(loadMoreButtonWrapper); // Ajouter le wrapper au container principal
  } else {
    loadMoreButton.style.display = 'block'; // Rendre le bouton à nouveau visible si nécessaire
  }

  // Lorsque le bouton est cliqué, chargez plus d'opérations et cachez ce bouton
  loadMoreButton.onclick = function() {
    loadMoreButtonWrapper.remove();  // Supprimer le bouton après le clic
    loadHistoriqueVirements(true);
  };
}

function addCategoryIcon(){
  // Point de départ : conteneur pour les checkboxes
  let container = document.getElementById('categoryCheckboxes');

  Object.entries(categoryColorMap).forEach(([category, [_, iconHtml, colorVariable]], index) => {
    // Créer un input de type checkbox
    let checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'btn-check';
    checkbox.id = `btn-check-${category}`;
    checkbox.autocomplete = 'off';

    checkbox.setAttribute('onchange', `loadHistoriqueOperations(false)`);

    // Créer un label associé
    let label = document.createElement('label');
    label.className = `btn btn-category`; // Applique la classe pour la couleur de fond
    label.setAttribute('style', `background-color: ${colorVariable};`); // Appliquer la couleur de fond
    label.htmlFor = checkbox.id;
    label.innerHTML = `${iconHtml}`; // Icône suivi du nom de la catégorie

    // Ajouter les éléments au conteneur
    container.appendChild(checkbox);
    container.appendChild(label);
  });
}

let currentIndex = 0; // Commence à 0, puis mise à jour avec le nombre d'opérations déjà chargées

function loadHistoriqueVirements(loadMore = false){
  var banque_id = document.getElementById('bankListContent').value; 
  banque_id = parseInt(banque_id);

  if (!loadMore) {
    document.getElementById('contentHistoriques').innerHTML = ''; // Réinitialiser uniquement si chargement initial
    currentIndex = 0; // Réinitialiser l'indice si chargement initial
  }

  const transaction = db.transaction(['virements'], 'readonly');
  const store = transaction.objectStore('virements');
  const index = store.index('date');
  const request = index.getAll();

  request.onsuccess = function(event) {
    let allVirements = event.target.result.filter(virement => virement.banques_id === parseInt(banque_id));

    // Tri des virements par date de manière décroissante
    allVirements.sort((a, b) => {
      // Convertir les dates du format DD/MM/YYYY au format YYYYMMDD pour le tri
      let reformattedDateA = a.date.split('/').reverse().join('');
      let reformattedDateB = b.date.split('/').reverse().join('');
      return reformattedDateB.localeCompare(reformattedDateA);
    });

    const virementsToLoad = allVirements.slice(currentIndex, currentIndex + 20); // Charger 20 virements à la fois
    currentIndex += virementsToLoad.length; // Mettre à jour l'indice pour le prochain chargement

    if(virementsToLoad.length === 0 && !loadMore){
      var newDiv = document.createElement('div');
      newDiv.className = 'contentHistoriquesValues d-flex align-items-center justify-content-between mb-2 p-2 border rounded';
      newDiv.innerHTML = `<p class="pas_historique mb-0">Aucun historique de virement à afficher.</p>`;
      document.getElementById('contentHistoriques').appendChild(newDiv);
    } else {
      virementsToLoad.forEach(displayVirement);
    }

    if (currentIndex < allVirements.length) {
      addLoadMoreButtonVirement();
    }
  };

  request.onerror = function(event) {
    console.error('Erreur lors de la récupération des virements', event);
  };
}

function displayVirement(virement){
  let { compte_debit, compte_credit, montant, date, banque_name } = virement;
  var newDiv = document.createElement('div');
  newDiv.className = 'contentHistoriquesValues d-flex align-items-center justify-content-between mb-2 p-2 border rounded';
  newDiv.innerHTML = `
  <p class="historique_date_virement mb-0">${date}</p>
  <p class="historique_banque_virement mb-0">${banque_name}</p>
  <p class="historique_debit_virement badge bg-debit text-white mb-0">Débit : ${compte_debit}</p>
  <p class="historique_credit_virement badge bg-credit text-white mb-0">Crédit : ${compte_credit}</p>
  <p class="historique_montant_virement mb-0">${montant.toLocaleString('fr-FR')}€</p>
  `;
  document.getElementById('contentHistoriques').appendChild(newDiv);
}

function loadHistoriqueOperations(loadMore = false){
  var banque_id = document.getElementById('bankListContent').value; 
  banque_id = parseInt(banque_id);

  if (!loadMore) {
    document.getElementById('contentHistoriques').innerHTML = ''; // Réinitialiser uniquement si chargement initial
    currentIndex = 0; // Réinitialiser l'indice si chargement initial
  }

  // Récupérer les catégories sélectionnées
  let selectedCategories = [];
  document.querySelectorAll('.btn-check').forEach(checkbox => {
    if (checkbox.checked) {
      let label = checkbox.id;
      let category = label.replace('btn-check-', '').trim();
      if(category in categoryColorMap){
        selectedCategories.push(category);
      }
    }
  });

  const transaction = db.transaction(['operations'], 'readonly');
  const store = transaction.objectStore('operations');
  const index = store.index('date');
  const request = index.getAll();

  request.onsuccess = function(event) {
    let allOperations = event.target.result.filter(op => op.banques_id === parseInt(banque_id));

    // Si des catégories sont sélectionnées, filtrer les opérations en conséquence
    if (selectedCategories.length > 0) {
      allOperations = allOperations.filter(op => selectedCategories.includes(op.category));
    }

    // Tri des opérations par date de manière décroissante
    allOperations.sort((a, b) => {
      // Convertir les dates du format DD/MM/YYYY au format YYYYMMDD
      let reformattedDateA = a.date.split('/').reverse().join('');
      let reformattedDateB = b.date.split('/').reverse().join('');
    
      // Comparer les chaînes de caractères reformattées pour le tri
      return reformattedDateB.localeCompare(reformattedDateA);
    });

    const operationsToLoad = allOperations.slice(currentIndex, currentIndex + 20); // Charger 20 opérations à la fois

    // Si aucune opération à afficher : message
    if(operationsToLoad.length === 0){
      var newDiv = document.createElement('div');
      newDiv.className = 'contentHistoriquesValues d-flex align-items-center justify-content-between mb-2 p-2 border rounded';
      // Ajouter le contenu HTML à la nouvelle div
      newDiv.innerHTML = `
      <p class="pas_historique mb-0">Aucun historique à afficher.</p>
      `;

      var container = document.getElementById('contentHistoriques'); // Assurez-vous que cet ID existe dans votre HTML
      container.append(newDiv);
    }

    currentIndex += operationsToLoad.length; // Mettre à jour l'indice pour le prochain chargement

    operationsToLoad.forEach(operation => {
      // Récupération et traitement des informations de l'opération
      let category = operation.category; 
      let montant = operation.montant; 
      let dateString = operation.date; 
      let banque_name = operation.banque_name;
      let detail = operation.detail;

      let colorClass = categoryColorMap[category] || "bg-divers"; // Utiliser une classe par défaut si la catégorie n'est pas trouvée

      var signe = '';
      var couleurMontant = 'black';
      let textBoldClass = '';

      if(parseFloat(parseFloat(montant).toFixed(2)) >= 0){
        signe = '+';
        couleurMontant = 'text-success'; // Classe Bootstrap pour le texte en vert
        textBoldClass = 'fw-bold'; // Ajouter la classe pour le texte en gras
      }

      var newDiv = document.createElement('div');
      newDiv.className = 'contentHistoriquesValues d-flex align-items-center justify-content-between mb-2 p-2 border rounded';
      // Ajouter le contenu HTML à la nouvelle div
      newDiv.innerHTML = `
      <p class="historique_date_operation mb-0">${dateString}</p>
      <p class="historique_banque_operation mb-0">${banque_name}</p>
      <p class="historique_detail_operation mb-0">${detail}</p>
      <p class="historique_category_operation badge ${colorClass[0]} text-white mb-0">${category} ${colorClass[1]}</p>
      <p class="historique_montant_operation_content mb-0 ${couleurMontant} ${textBoldClass}">${signe}${montant.toLocaleString('fr-FR')}€</p>
      `;

      var container = document.getElementById('contentHistoriques'); // Assurez-vous que cet ID existe dans votre HTML
      container.append(newDiv);
    });
    if (currentIndex < allOperations.length) {
      addLoadMoreButtonOperation();
    }
  };

  request.onerror = function(event) {
    console.error('Erreur lors de la récupération des opérations', event);
  };
}

function changeHistorique(current, otherId) {
  // Changement de bouton check
  if (current.checked) {
    document.getElementById(otherId).checked = false;
  }

  if(otherId === 'operations-checkbox'){
    // Suppression des icons de catégories
    document.getElementById('categoryCheckboxes').innerHTML = '';
    // Affichage de l'historique des 20 derniers virements
    loadHistoriqueVirements();
  }else{
    document.getElementById('categoryCheckboxes').innerHTML = '';
    // ajout des icons de catégories
    addCategoryIcon();
    // Affichage de l'historique des 20 dernières opérations
    loadHistoriqueOperations(false);
  }
}
