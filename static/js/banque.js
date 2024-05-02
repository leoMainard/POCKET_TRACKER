// Toutes les fonctions liées à la gestion des banques 

 /**
 * Ajoute une nouvelle banque dans l'object Banque et créer un compte courant
 * 
 * @param {String} bankName - Nom de la banque à ajouter
 */
function addBankToDB(bankName) {
    const transaction = db.transaction(['banques'], 'readwrite');
    const objectStore = transaction.objectStore('banques');
    const request = objectStore.add({ bankName: bankName });
  
    request.onsuccess = function(event) {
      const newBankId = event.target.result; // L'ID de la nouvelle banque
      console.log('Banque ajoutée avec succès, ID:', newBankId);
      showSuccess('<i class="fa-solid fa-check"></i> Banque ajoutée !');
      addCompteToDB('CC', newBankId); // Création d'un compte courant
      loadBanks(); // Mettre à jour l'interface utilisateur
    };
  
    request.onerror = function() {
      console.error('Erreur lors de l\'ajout de la banque');
    };
  }
  
/**
 * Se connecte à l'object banque et appelle la fonction de chargement des listes de banques
 * Charge le contenu du dashboard
 */
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
  
 /**
 * Met à jour les listes déroulantes des banques avec les données fournies.
 * 
 * @param {Array} banks - Liste des banques à ajouter aux listes déroulantes.
 */
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
        option.value = bank.banques_id;
        option.textContent = bank.bankName;
        document.getElementById(listId).appendChild(option.cloneNode(true));
      });
    });
  }
  
/**
 * Supprime une banque de l'object Banque ainsi que tous les comptes, opérations, virements associés
 * 
 * @param {Number} bankId - Id de la banque à supprimer
 */
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
  
/**
 * Supprime tous les comptes associés à l'id d'une banque
 * 
 * @param {Number} bankId - id de la banque
 */
  function deleteAssociatedAccounts(bankId) {
    const transaction = db.transaction(['comptes'], 'readwrite');
    const store = transaction.objectStore('comptes');
  
    // Créer une requête pour trouver tous les comptes avec le bankId spécifié
    const index = store.index('banques_id');
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


/**
 * Vérifie que tous les éléments du module d'ajout de banque sont correctes avant d'ajouter la banque 
 * à l'object Banque
 */
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
        }
      };

      request.onerror = function() {
        console.error('Erreur lors de la vérification de l\'existence de la banque');
      };

      // Réinitialise le champ de texte
      document.getElementById('newBankName').value = '';
  } else {
    showAlert('<i class="fa-solid fa-xmark"></i> Veuillez entrer un nom de banque.');
  }
}

/**
 * Vérifie que tous les éléments du module de suppréssion d'une banque sont 
 * correct avant de supprimer la banque de l'object Banque
 */
function deleteBank() {
  var bankList = document.getElementById('bankList');
  var bankName = bankList.value;
  if (bankName) {
    var bankId = bankList.options[bankList.selectedIndex].value;
    
    deleteBankFromDb(parseInt(bankId));
  } else {
    showAlert('<i class="fa-solid fa-xmark"></i> Veuillez sélectionner une banque à supprimer.');
  }
}