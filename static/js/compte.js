// Toutes les fonctions liées à la gestion des comptes


 /**
 * Ajoute un comtpe à l'object Compte
 * Met à jour les listes des comptes
 * Met à jour le contenu du dashboard
 * 
 * @param {string} nom_compte - Nom du compte
 * @param {number} banques_id - id de la banque liée au compte
 */
function addCompteToDB(nom_compte, banques_id) {
    nom_compte = nom_compte.toUpperCase();
  
    const transaction_compte = db.transaction(['comptes'], 'readwrite');
    const objectStore_compte = transaction_compte.objectStore('comptes');
    const compteData = {
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
/**
 * Ajoute un comtpe à l'object Compte
 * Met à jour les listes des comptes
 * Met à jour le contenu du dashboard
 * 
 * @param {string} nom_compte - Nom du compte
 */
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
  
  /**
 * Met à jour la liste de comptes du module de banque
 * 
 * @param {array} comptes - liste des comptes
 */
  function updateComptesList_banque(comptes) {
  
    var compteList = document.getElementById('compteList');
  
    compteList.innerHTML = '<option value="">Sélectionnez un compte</option>'; // Nettoyer la liste existante
  
    // Ajouter les options de compte filtrées
    comptes.forEach(function(compte) {
      var option = document.createElement('option');
      option.value = compte.nom_compte;
      option.textContent = compte.nom_compte;
  
      compteList.appendChild(option);
    });
  }
  
/**
 * Met à jour la liste de comptes du module virement
 * 
 * @param {array} comptes - liste des comptes
 */
  function updateComptesList_virement(comptes) {
    var compteList_virement_debit = document.getElementById('compteList_virement_debit');
    var compteList_virement_credit = document.getElementById('compteList_virement_credit');
  
    compteList_virement_debit.innerHTML = '<option value="">Compte débiteur</option>'; // Nettoyer la liste existante
    compteList_virement_credit.innerHTML = '<option value="">Compte créditeur</option>'; // Nettoyer la liste existante
  
    // Ajouter les options de compte filtrées
    comptes.forEach(function(compte) {
      var option = document.createElement('option');
      option.value = compte.nom_compte; 
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
  
 /**
 * Met à jour la liste de comptes en fonction de la banque et du module
 * Appel updateComptesList_banque ou updateComptesList_virement
 * 
 * @param {number} bankId -id de la banque
 * @param {string} modaleId - id htmldu module
 */
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
      }
    };
  
    request.onerror = function() {
      console.error('Erreur lors de la récupération des comptes filtrés');
    };
  }
  
 /**
 * Supprime les comptes des listes de sélection
 * 
 * @param {string} modaleId - id htmldu module
 */
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

 /**
 * Vérifie que tous les éléments dumodule de compte sont correctes avant ajout d'un compte
 */
function addCompte() {
  var nom_compte = document.getElementById('newCompteName').value;
  var banque_id = document.getElementById('bankList').value;

  if(nom_compte && banque_id !== '') {
    addCompteToDB(nom_compte, parseInt(banque_id));

    document.getElementById('newCompteName').value = '';
  } else {
    showAlert('<i class="fa-solid fa-xmark"></i> Veuillez entrer un nom de compte et choisir une banque.');
  }
}

 /**
 * Vérifie que tous les éléments du module de compte sont correctes avant suppression
 * du compte
 */
function deleteCompte() {
  var compteList = document.getElementById('compteList');
  var compteName = compteList.value;
  if(compteName) {
    var CC_test = compteList.options[compteList.selectedIndex].text;
    if(CC_test != 'CC'){
      deleteCompteFromDb(compteName);

    }else{
      showAlert('<i class="fa-solid fa-xmark"></i> Vous ne pouvez pas supprimer le CC de votre banque.');
    }
      
  } else {
    showAlert('<i class="fa-solid fa-xmark"></i> Veuillez sélectionner un compte à supprimer.');
  }
}