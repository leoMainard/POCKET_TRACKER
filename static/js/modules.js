
/**
 * Fonction pour ouvrir un module spécifique
 * 
 * @param {string} modalId -id html du module à ouvrir
 */
function openModal(modalId, idModification=null) {
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
    }else if(modalId === 'operationModalModification'){
      document.getElementById('virement').disabled = true;
      document.getElementById('operation').disabled = true;
      document.getElementById('banque').disabled = true;
      if(idModification != null){
        loadOperationModification(idModification);
      }
      
    };
  
  }
  
  /**
 * Fonction pour fermer un module spécifique
 * 
 * @param {string} modalId -id html du module à fermer
 */
  function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    document.getElementById('operation').disabled = false;
    document.getElementById('banque').disabled = false;
    document.getElementById('virement').disabled = false;
  }
  