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