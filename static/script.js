


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
      
      // Créer des index pour rechercher des opérations par différents attributs
      operationsStore.createIndex('banques_id', 'banques_id', { unique: false });
      operationsStore.createIndex('compte_debit', 'compte_debit', { unique: false });
      operationsStore.createIndex('compte_credit', 'compte_credit', { unique: false });
      operationsStore.createIndex('date', 'date', { unique: false });
      // Note : Pas besoin de créer un index pour 'montant_virement'
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
    alert('Banque supprimée avec succès.');
    loadBanks() // Mettre à jour l'interface utilisateur après la suppression

    updateComptesListBasedOnBank(bankId, 'modale1');
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
    console.log('Compte ajoutée avec succès');
    updateComptesListBasedOnBank(parseInt(banques_id), 'modale1');
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
    operationToCompte(parseInt(bank_id), parseInt(montant));
    operationToHistorique(parseInt(bank_id), banque_name, 'VIREMENTS', 'Suppression du compte ' + nom_compte, parseInt(montant), dateString);

    const request = objectStore.delete([parseInt(bank_id), nom_compte]);

    request.onsuccess = function(event) {
      alert('Compte supprimée avec succès.');
      updateComptesListBasedOnBank(parseInt(bank_id), 'modale1');
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
    if(parseInt(montant) >= 0){
      signe = ' +'
    }
      
    option.textContent = compte.nom_compte + signe + compte.montant_compte;
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

    
    // Mise à jour de l'affichage historique du jour
    let liste_category = ["COURSES","SALAIRE","AIDE","LOISIRS","CHARGES", "ABONNEMENTS", "VIREMENTS", "DIVERS"]
    let liste_category_color = ["secondary","success","info","warning","danger", "warning", "primary", "info"]

    // Trouver l'index de la catégorie pour déterminer la couleur
    let index = liste_category.indexOf(category);
    let color = liste_category_color[index];

    // Création et configuration de la nouvelle div
    var newDiv = document.createElement('div');
    newDiv.className = 'operation_historique d-flex align-items-center justify-content-between mb-2 p-2 border rounded';
    newDiv.setAttribute('data-operation-id', operation_id);
    newDiv.innerHTML = `
      <p class="historique_date_operation mb-0">${date}</p>
      <p class="historique_banque_operation mb-0">${banque_name}</p>
      <p class="historique_detail_operation mb-0">${detail}</p>
      <p class="historique_category_operation badge bg-${color} text-white mb-0">${category}</p>
      <p class="historique_montant_operation mb-0">${montant}€</p>
      <button onclick="deleteOperationHistorique(this)" class="btn btn-danger"><i class="fas fa-trash"></i></button>
    `;

    // Ajouter la nouvelle div au conteneur
    var container = document.getElementById('historique_container_operation');
    container.prepend(newDiv);

    // Réinitialisation des champs après l'affichage des opérations
    document.getElementById('operation_detail').value = '';
    document.getElementById('operation_valeur').value = '';
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

    let liste_category = ["COURSES","SALAIRE","AIDE","LOISIRS","CHARGES", "ABONNEMENTS", "VIREMENTS", "DIVERS"]
    let liste_category_color = ["secondary","success","info","warning","danger", "warning", "primary", "info"]

    // Boucler sur chaque opération récupérée
    operations.forEach(operation => {
      // Récupération et traitement des informations de l'opération
      let operation_id = operation.operation_id;
      let category = operation.category; 
      let detail = operation.detail; 
      let montant = operation.montant; 
      let date = operation.date; 
      let banque_name = operation.banque_name;

      // Trouver l'index de la catégorie pour déterminer la couleur
      let index = liste_category.indexOf(category);
      let color = liste_category_color[index];

      // Création et configuration de la nouvelle div
      var newDiv = document.createElement('div');
      newDiv.className = 'operation_historique d-flex align-items-center justify-content-between mb-2 p-2 border rounded';
      newDiv.setAttribute('data-operation-id', operation_id);
      
      if(detail.trim().includes("Suppression du compte")){
        newDiv.innerHTML = `
        <p class="historique_date_operation mb-0">${date}</p>
        <p class="historique_banque_operation mb-0">${banque_name}</p>
        <p class="historique_detail_operation mb-0">${detail}</p>
        <p class="historique_category_operation badge bg-${color} text-white mb-0">${category}</p>
        <p class="historique_montant_operation mb-0">${montant}€</p>
        <button onclick="deleteOperationHistorique(this)" class="btn btn-danger" disabled><i class="fas fa-trash"></i></button>
      `;
      }else{
        newDiv.innerHTML = `
        <p class="historique_date_operation mb-0">${date}</p>
        <p class="historique_banque_operation mb-0">${banque_name}</p>
        <p class="historique_detail_operation mb-0">${detail}</p>
        <p class="historique_category_operation badge bg-${color} text-white mb-0">${category}</p>
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
  var montant = parseFloat(montantText.replace('€', '').trim());

  var montant_inverse = montant * -1;

  var banques_id = document.getElementById('bankList_operation').value;

  console.log(montant_inverse);

  // operationToCompte mais dans le sens inverse
  operationToCompte(parseInt(banques_id), montant_inverse);

  // Suppression de l'historique
  suppressionOperationHistorique(parseInt(operationId));

  updateOperationListHistorique(parseInt(banques_id));
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

  // Supposons que vous avez un index nommé 'banque_id' dans votre objectStore 'comptes'
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
          <p class="historique_debit_virement mb-0">Débit : ${compte_debiteur}</p>
          <p class="historique_credit_virement mb-0">Crédit : ${compte_crediteur}</p>
          <p class="historique_montant_virement mb-0">${montant}€</p>
          <button onclick="deleteVirementHistorique(this)" class="btn btn-danger" disabled><i class="fas fa-trash"></i></button>
          `;
        }else{
          // Ajouter le contenu HTML à la nouvelle div
          newDiv.innerHTML = `
          <p class="historique_date_virement mb-0">${dateString}</p>
          <p class="historique_banque_virement mb-0">${banque_name}</p>
          <p class="historique_debit_virement mb-0">Débit : ${compte_debiteur}</p>
          <p class="historique_credit_virement mb-0">Crédit : ${compte_crediteur}</p>
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
    if (compteDebit && parseInt(compteDebit.montant_compte) >= montant) {
      // Si le solde est suffisant, procéder au virement sans attendre la fin de l'opération
      // Note: Les modifications réelles dans la DB ne sont pas attendues ici
      operationToCompte(banque_id, -montant, nom_debit_compte); // Débiter
      operationToCompte(banque_id, montant, nom_credit_compte); // Créditer
      
      // Ici, les appels à operationToCompte sont asynchrones mais non attendus
      virementToHistorique(banque_id, banque_name, nom_debit_compte, nom_credit_compte, montant, date);
      
      // Supposons une mise à jour de l'interface utilisateur ou d'autres actions ne dépendant pas du résultat de la DB
      updateVirementListHistorique(banque_id); // Mettre à jour l'affichage, si nécessaire

    } else {
      alert(`Le solde du compte ${nom_debit_compte} est insuffisant pour le virement.`);
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
  var montant = parseFloat(montantText.replace('€', '').trim());

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
    alert('Veuillez entrer un nom de compte et choisir une banque.');
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
      alert('Vous ne pouvez pas supprimer le CC de votre banque.');
    }
      
  } else {
      alert('Veuillez sélectionner un compte à supprimer.');
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
    if (moins){
      montant = '-' + montant;
    }

    montant = parseInt(montant);

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
  else if(credit != debit){
    addVirementToDB(parseInt(banque_id), banque_name, debit, credit, parseInt(montant), dateString);
  }else{
    alert('Le compte débiteur et le compte créditeur doivent être différents')
  }
}













// ------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------- Chargement de la page
// ------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------
// Appeler cette fonction au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
  initDb();
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
    updateComptesListBasedOnBank(NaN, 'modale1');
  }else if(modalId === 'virementModal'){
    document.getElementById('historique_container_virement').innerHTML = '';
    updateComptesListBasedOnBank(NaN, 'modale2');
  }else if(modalId === 'operationModal'){
    document.getElementById('historique_container_operation').innerHTML = '';
  };

}

// Fonction pour fermer la modale spécifique
function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

// Lors des changements de banque, les comptes s'adaptent

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