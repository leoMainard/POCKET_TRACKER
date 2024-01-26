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
  var banque = document.getElementById('bankList').value;
  var category = document.getElementById('category').value;
  var detail = document.getElementById('operation_detail').value;
  var montant = document.getElementById('operation_valeur').value;

  var moins = document.getElementById('btn-check-minus').checked;
  var plus = document.getElementById('btn-check-plus').checked;

  var date = new Date();
  var day = ('0' + date.getDate()).slice(-2);
  var month = ('0' + (date.getMonth() + 1)).slice(-2);
  var year = date.getFullYear();
  var dateString = `${day}/${month}/${year}`;

  if (!banque || !category || montant){
    alert('Veuillez sélectionner une banque.');
  }

  // Créer une nouvelle div avec les classes appropriées
  var newDiv = document.createElement('div');
  newDiv.className = 'operation_historique d-flex align-items-center justify-content-between mb-2 p-2 border rounded';
  
  // Ajouter le contenu HTML à la nouvelle div
  newDiv.innerHTML = `
    <p class="historique_date mb-0">${dateString}</p>
    <p class="historique_banque mb-0">${banque}</p>
    <p class="historique_detail_operation mb-0">${detail}</p>
    <p class="historique_category_operation badge bg-warning text-dark mb-0">${category}</p>
    <p class="historique_montant_operation mb-0">${montant}</p>
    <button onclick="delete_historique(this)" class="btn btn-danger"><i class="fas fa-trash"></i></button>
  `;
  
  // Ajouter la nouvelle div à un conteneur existant dans votre document
  var container = document.getElementById('historique_container'); // Assurez-vous que cet ID existe dans votre HTML
  container.appendChild(newDiv);
}


function delete_historique(element) {
  // Supprime la div operation_historique du DOM
  element.parentElement.remove();
}