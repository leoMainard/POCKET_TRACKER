/**
 * Affiche un message d'erreur dans un popup
 * @param {string} message -message à faire passer dans le popup
 */
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
  
  /**
 * Affiche un message de succes dans un popup
 * @param {string} message -message à faire passer dans le popup
 */
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