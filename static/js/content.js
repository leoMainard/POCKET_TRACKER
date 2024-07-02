// Toutes les fonctions liés à la gestion du tableau de bord

 /**
 * Fonction qui charge tout le tableau de bord
 */
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
  
      // chargement des filtres mois année
      loadMonthYearList(banque_id);
  
    } else {
      // Cache les éléments si banque_id est 0 
      document.getElementById('containerContentHistoriques').style.display = 'none';
      document.getElementById('topRow').style.display = 'none';
      document.getElementById('graphiquesContainer').style.display = 'none';
    }
  }

 /**
 * Vérifie que les filtres Mois et Annee sélectionnées forment une date disponible dans la base
 * 
 * @param {string} mois -numero du mois
 * @param {string} annee - numero de l'annee
 * @param callback
 */
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
   /**
 * Met à jour les kpi et graphiques affectés par la sélection des filtres Mois et Annee
 */
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

 /**
 * Met à jour les graphiques affectés par la sélection des boutons radio Mois et Année
 */
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

 /**
 * Met à jour le montant du solde du compte courant, du total des avoirs, et des comptes
 * 
 * @param {number} banque_id -id de la banque
 */
function updateSolde(banque_id){
    const transaction = db.transaction(['comptes'], 'readonly');
    const objectStore_compte = transaction.objectStore('comptes');
    const index = objectStore_compte.index('banques_id');
    const getRequest = index.getAll(banque_id); // Récupérer tous les comptes pour ce banque_id
  
    getRequest.onsuccess = function() {
      const comptes = getRequest.result;
  
      let somme = 0;
      let montantCC = 0; // Initialiser le montant du compte 'CC'
  
      // Parcourir chaque compte et additionner les montants
      comptes.forEach(function(compte) {
        somme += parseFloat(parseFloat(compte.montant_compte).toFixed(2)); 
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
  
          var container = document.getElementById('montantDesComptes');
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
  
/**
 * Met à jour le montant de l'épargne en fonction des filtres sélectionnés (année et mois)
 * 
 * @param {number} banque_id -id de la banque
 * @param {string} mois - numéro du mois
 * @param {string} annee -numero de l'annee
 */
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
  
/**
 * Charge les filtres Mois et Annee en fonction de la banque sélectionnée
 * Récupère les mois et année des opérations crées
 * 
 * @param {number} banque_id -id de la banque
 */
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
    const currentMonth = currentDate.getMonth() + 1;
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
  
      // Efface la sélection
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
      
      // Trouve le mois et l'annee le plus proche si le mois et l'année actuels ne sont pas disponible
      let closestYear = [...uniqueYears].reduce((prev, curr) => Math.abs(curr - currentYear) < Math.abs(prev - currentYear) ? curr : prev);
      let closestMonth = [...uniqueMonths].reduce((prev, curr) => Math.abs(curr - currentMonth) < Math.abs(prev - currentMonth) ? curr : prev);
  
      if (parseInt(closestYear) !== currentYear) {
        closestMonth = '12'; 
      }
  
      monthSelect.value = closestMonth;
      yearSelect.value = closestYear;
      yearSelect.dispatchEvent(new Event('change')); // Déclencher l'événement change manuellement
    };
  
    request.onerror = function(event) {
      console.error('Unable to load dates for bank ID:', banque_id, event);
    };
  }
  
  /**
 * Vérifie que les filtres Mois et Annee sélectionnées forment une date disponible dans la base
 * 
 * @param {string} monthYear - date chiffrée mois/annee
 * @param {number} banque_id -id de la banque
 * @param callback
 */
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
  
/**
 * Charge les données pour la partie budget
 * 
 * @param {number} banque_id -id de la banque
 * @param {string} mois - Numéro du mois
 * @param {string} annee - Numéro de l'année
 */
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
              <p class="budgetDiffDepense">${Math.abs(categoryData.depense).toLocaleString()}</p>
              <p class="budgetDiffbudget"> / ${categoryData.budget.toLocaleString()}</p>
            </div>
            <div class="contentBudgetNbOperation">${operationsCount[category]} opération(s)</div>
          `;
  
          var container = document.getElementById(divId);
          container.append(newDiv);
  
        } else {
          console.error(`L'élément avec l'ID "${divId}" n'existe pas.`);
        }
      });
    });
  }
  
// ------------------------------------------------ GRAPHIQUES

/**
 * Charge les données du graphique Camembert - dépenses par catégories
 * 
 * @param {number} banque_id -id de la banque
 * @param {string} mois -Numero du mois
 * @param {string} annee -Numero de l'année
 */
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
  
/**
 * Récupère les données pour le graphique de l'évolution du total des avoirs
 * 
 * @param {number} banque_id -id de la banque
 * @param callback
 */
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
        let dates = [];
  
        // On tri les opérations par date
        operations.sort((a, b) => new Date(a.date.split('/').reverse().join('-')) - new Date(b.date.split('/').reverse().join('-')));
  
        operations.forEach(op => {
          const opDate = op.date;
          if (!soldeEvolution[opDate]) {
            soldeEvolution[opDate] = currentBalance;
          }
          currentBalance += op.montant;
          soldeEvolution[opDate] = currentBalance;
        });

        // Organiser les soldes selon les dates
        let sortedDates = Object.keys(soldeEvolution).sort((a, b) => new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-')));
        let sortedSoldeEvolution = {};
        sortedDates.forEach(date => {
          sortedSoldeEvolution[date] = soldeEvolution[date];
        });
  
        callback(null, sortedSoldeEvolution);
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
  
/**
 * On charge les données du graphique linéaire de l'évolution des avoirs
 * 
 * @param {number} banque_id - id de la banque
 * @param {boolean} selectionAnnee -bouton radio de sélection Annee ou Mois, par défaut True
 * @param {string} mois -Numero du mois
 * @param {string} annee -Numero de l'année
 */
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
          .sort((a, b) => new Date(a[0].split('/').reverse().join('-')) - new Date(b[0].split('/').reverse().join('-')))
          .forEach(([date, montant]) => {
            const [d, m, y] = date.split('/').map(Number);
            const formattedDate = `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
            if (selectionAnnee && y === parseInt(annee)) {
              if (!categories.includes(formattedDate)) {
                categories.push(formattedDate);
                seriesData.push(parseFloat(montant.toFixed(2)));
              }
            } else if (!selectionAnnee && y === parseInt(annee) && m === parseInt(mois)) {
              categories.push(formattedDate);
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
/**
 * Affiche un bouton + toutes les 20 opérations affichées dans l'historique
 */
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
      loadMoreButton.appendChild(icon); 
      loadMoreButtonWrapper.appendChild(loadMoreButton);
      container.appendChild(loadMoreButtonWrapper);
    } else {
      loadMoreButton.style.display = 'block'; // Rendre le bouton à nouveau visible si nécessaire
    }
  
    // Lorsque le bouton est cliqué, charge plus d'opérations et cachez ce bouton
    loadMoreButton.onclick = function() {
      loadMoreButtonWrapper.remove();  // Supprime le bouton après le clic
      loadHistoriqueOperations(true);
    };
  }
  
  /**
 * Affiche un bouton + tous les 20 virements affichés dans l'historique
 */
  function addLoadMoreButtonVirement() {
    let container = document.getElementById('contentHistoriques');
    let loadMoreButtonWrapper = document.createElement('div'); // Créer un nouveau conteneur pour le bouton
    loadMoreButtonWrapper.style.textAlign = 'center'; // Centrer le contenu du conteneur
  
    let loadMoreButton = document.getElementById('loadMoreOperations');
    if (!loadMoreButton) {
      loadMoreButton = document.createElement('button');
      loadMoreButton.id = 'loadMoreOperations';
      loadMoreButton.className = 'btn-load-more';
  
      // Créer l'élément <i> pour l'icône
      let icon = document.createElement('i');
      icon.className = 'fa-solid fa-plus';
      loadMoreButton.appendChild(icon);
  
      loadMoreButtonWrapper.appendChild(loadMoreButton);
      container.appendChild(loadMoreButtonWrapper); // Ajouter le wrapper au container principal
    } else {
      loadMoreButton.style.display = 'block';
    }
  
    // Lorsque le bouton est cliqué, charge plus d'opérations et cachez ce bouton
    loadMoreButton.onclick = function() {
      loadMoreButtonWrapper.remove();  // Supprimer le bouton après le clic
      loadHistoriqueVirements(true);
    };
  }
  
/**
 * Ajoute des boutons de filtre pour les catégories des opérations
 */
  function addCategoryIcon(){
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
  
 /**
 * Charge l'historique des virements
 * 
 * @param {boolean} loadMore - defaut False : différencie le premier chargement et les chargements supplémentaires
 */
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
  
/**
 * Affiche les informations d'un virement
 * 
 * @param {Array} virements - 
 */
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
  
/**
 * Charge l'historique des opérations
 * 
 * @param {bool} loadMore - defaut False : différencie le premier chargement et les chargements supplémentaires
 */
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
  
        var container = document.getElementById('contentHistoriques');
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
  
        var container = document.getElementById('contentHistoriques');
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


  
  /**
 * Permet de changer entre l'historique des opérations ou des virements
 * et de charger le bon historique en conséquence
 * 
 * @param {array} current - élément bouton radio opération / virement dans l'historique
 * @param {string} otherId - id de l'élément bouton radio non sélectionné
 */
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