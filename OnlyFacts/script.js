const factContainer = document.getElementById('fact-container');
const categoryButtons = document.querySelectorAll('.category-button');
let filterCategory = null; // Initialize with no filter
let isLoadingFacts = false;

const facts = [];
let currentFactIndex = 0;
const factsPerPage = 10; // Number of facts to load at once

let abortController = new AbortController();

async function fetchRandomFact(category, retryCount = 3) {
    try {
        // Cancel any ongoing fetch when the category changes
        if (abortController.signal.aborted) {
            return { extract: '', image: null };
        }

        let apiUrl;
        if (category === 'Art') {
            apiUrl = 'https://collectionapi.metmuseum.org/public/collection/v1/objects';
        } else {
            apiUrl = 'https://en.wikipedia.org/api/rest_v1/page/random/summary';
        }

        const response = await fetch(apiUrl, { signal: abortController.signal });

        if (!response.ok) {
            if (response.status === 404) {
                console.log('404 error encountered. Skipping to the next fact.');
                return await fetchRandomFact(category);
            } else if (response.status === 429) {
                if (retryCount > 0) {
                    const retryDelay = Math.pow(2, 4 - retryCount) * 1000;
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                    return await fetchRandomFact(category, retryCount - 1);
                } else {
                    throw new Error('Rate limit exceeded, and maximum retry count reached.');
                }
            } else {
                throw new Error(`API request failed with status: ${response.status}`);
            }
        }

        const data = await response.json();

        if (category === 'Art' && data && data.objectIDs) {
            const randomObjectID = data.objectIDs[Math.floor(Math.random() * data.objectIDs.length)];
            const objectDetailResponse = await fetch(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${randomObjectID}`);
            const objectDetailData = await objectDetailResponse.json();

            if (objectDetailData && objectDetailData.primaryImageSmall) {
                const title = objectDetailData.title || '';
                const name = objectDetailData.artistDisplayName || '';
                const date = objectDetailData.objectDate || '';
                const medium = objectDetailData.medium || '';
                const description = objectDetailData.objectName || '';
                const culture = objectDetailData.culture || '';
            
                let extract = '';
            
                if (title) {
                    extract += `Title: ${title} , \n`;
                }
            
                if (name) {
                    extract += `Name: ${name}\n`;
                }
            
                if (date) {
                    extract += `Date: ${date}\n`;
                }
            
                if (medium) {
                    extract += `Medium: ${medium}\n`;
                }
            
                if (description) {
                    extract += `Description: ${description}\n`;
                }
            
                if (culture) {
                    extract += `Culture: ${culture}\n`;
                }
            
                console.log(`Included: ${title} (Art)`);
                return {
                    extract,
                    image: objectDetailData.primaryImageSmall
                };
            }
            

            console.log('Invalid data received from the API: Missing image');
            return await fetchRandomFact(category, retryCount - 1);
        } else if (category !== 'Art' && data && data.extract) {
            if (category && !containsInterestingKeyword(data.extract, category)) {
                console.log(`Excluded: ${data.title} (${category})`);
                return await fetchRandomFact(category, retryCount - 1);
            } else {
                console.log(`Included: ${data.title} (${category})`);
                return {
                    extract: data.extract,
                    image: data.thumbnail ? data.thumbnail.source : null
                };
            }
        } else {
            console.log('Fact skipped because it has no data.');
            return await fetchRandomFact(category, retryCount - 1);
        }
    } catch (error) {
        if (!abortController.signal.aborted) {
            console.error('Error fetching data:', error);
        }
        return { extract: '', image: null };
    }
}





function containsInterestingKeyword(fact, category) {
    // Modify this function to check if the fact contains keywords related to the selected category.
    const lowercasedFact = fact.toLowerCase();

    // Keywords related to the new categories: Culture, Science, History, and Geography
    const categoryKeywords = {
        'Culture': [
            'painter', 'masterpiece','illustrator', 'sculpture', 'architect', 'architectural style', 'architectural history', 'architectural marvels', 'architectural innovation', 
            'architectural traditions', 'novelist', 'film', 'pop culture','popular culture','literature','aesthetics', 'musician', 'singer', 'composer',
             'music genre', 'organic abstract', 'concert', 'album', 'magazine', 'film director', 'movie industry', 'craftsmanship',
            'cinematic history', 'classic movie','igloo', 'film festival', 'cinematography', 'Renaissance art', 'fashion trend',
            'Baroque art', 'Rococo art', 'Neoclassical art', 'fashion designer', 'fairytale architecture', 'Romantic art', 'Impressionism', 'Expressionism', 
            'Cubism', 'Surrealism', 'Storybook architecture', 'Abstract Expressionism', 'Pop Art', 'Minimalism', 'Conceptual Art', 'Bauhaus', 'Postmodernism', 'Islamic architecture', 
            'Chinese architecture', 'Indian architecture', 'Mayan architectural', 'traditional garment','traditional japanese garment','Greek architecture', 'Roman architectural', 'Gothic architectural', 
            'Byzantine architecture', 'Japanese architecture', 'African architecture', 'architecture of Africa','Architecture of India',
            'Indigenous architecture', 'Modernist architecture', 'Art Deco architecture', 'jewels', 'art deco','artisan', 'clothing',
            , 'Mid-century modern', 'Contemporary architecture', 'classical music','dish','meal','cuisine','food',
             'Architectural theory', 'Architectural criticism', 'fashion collections', 'fashion textile', 'Architectural preservation', 'vernacular architecture',
              'vernacular style', 'vernacular materials', 'vernacular design','carnaval', 'carnival' ],
        'Science': [
            'science','virus','fungi','organism', 'technology', 'engineering', 'mathematics',
            'biology','mathematician', 'chemistry', 'physics', 'astronomy','astronomer','gene','protein','cells','biological rhythms','chronobiology','chromosomes',
            'species','algebra','geometry', 'archaic humans','plant', 'abiotic', 'biotic', 'decomposer', 'ecosystem', 'food web', 'nutrient cycling', 'Biodiversity', 'biomimicry', 'bio-inspired',
            'biophilia', 'biomimetics', 'bioengineering', 'bionics', 'bio-utilization', 'Convergent evolution', 'Cross-pollination', 'experiment', 'Biotechnology', 'Taxonomy', 'Hydroponics', 'Embryology', 'Enzyme', 'Equilibrium', 'extinction', 'Homeostasis', 'Mitosis', 'DNA', 'isotope',
            'computer science', 'information technology', 'innovation','circadian','nuclei','physiology','pathophysiology',
            'invention','dinosaurs', 'space mission', 'astronaut', 'NASA', 'clock','space agency', 'planet exploration', 'celestial body', 'technological innovation', 'inventor', 'visionary', 'technology breakthrough', 'scientific breakthrough', 'Nobel laureate', 'physics discovery', 'chemistry breakthrough', 'medical discovery',
            'Geology', 'Meteorology', 'Environmental Science', 'Neuroscience', 'Genetics', 'Botany', 'Zoology', 'Paleontology', 'Chemical Engineering', 'Quantum Physics', 'Astrobiology', 'Oceanography', 'Nanotechnology', 'Renewable Energy', 'Biomedical Engineering', 'Materials Science', 'Ecology', 'Climate Science', 'Cryptography', 'Particle Physics','physics theories','biology theories', 'chemistry theories', 'scientific','scientific concept','scientific theory',
            'Cell Biology', 'Genomic Sequencing', 'Quantum Mechanics', 'Organic Chemistry', 'Theoretical Physics', 'Neuroplasticity', 'Molecular Biology', 'Atomic Structure', "Einstein's Theory of Relativity", 'Genetic Engineering',
            'Quantum Computing', 'Evolutionary Biology', 'Chemical Reactions', 'Biomechanics', 'Particle Accelerators', 
            'Microbiology', 'Quantum Field Theory','astrobiology','space exploration','cosmonaut','constellation','orbit',
            'apollo 11','international space station','space shuttle','extraterrestrial','satellite',
            'black hole', 'galaxy','celestial','cosmos','astronaut','astronomy','astronomy','spacecraft','rocket',
            'aerospace','incandescence','diffraction','fluorescence','scattering','prism','graphene',
            'biomaterials','photon','frequency','wavelength','dispersion','polarisation','refraction',
            'Schrödinger',"Heisenberg's Uncertainty",'Special Relativity','General Relativity',"Maxwell's Equations",
            'equations',"Gauss's Law for Electricity","Faraday's Law ", "Ohm's Law","Coulomb's Law",
            'Theromodynamics','law of energy','law of energy conservation','chemical reaction','biology experiment',
            'covalent bond', 'ionic bonding','electrons','molecules','periodic table','polymers',
            'Law of Conservation','gravity','law of universal gravitation','law of motion', 'chemical compound', 'compound' ],
        'Geography': [
            'geography', 'places', 'earth', 'province','bodies of water',
            'cities', 'continents', 'country', 'deserts',
            'lakes', 'landforms', 'mountains', 'navigation',
            'oceans', 'populated places', 'village', 'protected areas',
            'regions', 'rivers', 'subterranea', 'Coastline', 'territories',
            'towns', 'villages', 'famous landmarks', 'historical sites',
            'architectural marvels', 'UNESCO World Heritage', 'cultural heritage',
            'natural landscapes', 'geological formations', 'ecosystems', 'ecoregions', 'breathtaking views',
            'natural phenomena','regional park', 'tourist attractions', 'local cuisine', 'cultural heritage', 'travel destinations', 'must-visit places', 'Amazon', 'region', 'landscapes', 'cultural treasures', 'waterfalls',
             'beaches', 'territories', 'peninsulas', 'mountains', 'plains', 'landforms', 'hills', 'gorges', 'drainage basins', 'plates', 'valleys', 
             'floodplains', 'glaciers', 'isthmuses', 'fjords', 'volcanoes', 'deserts', 'deltas',
            'physical geography', 'piers', 'wetlands', 'continents', 'bays', 'archipelagos', 
            'earthquakes', 'volcanic eruptions', 'tropical storms', 'tectonic plates', 'nutrient cycling',
             'ecotourism', 'soil erosion', 'desertification', 'permafrost', 'tundra', 'caves', 'gabions', 'levees', 
             'interlocking spurs', 'hydrographs', 'precipitation'],
        'History': [    
            'made history','constitution','historian','Historical Event', 'Timeline', 'Ancient Civilizations', 'World Wars', 'Historical Figures', 'Historical Documents', 'Revolutions',
            'Dynasties', 'Historical Artifacts', 'Archaeology', 'Historical Landmarks', 'History of Science', 'History of Medicine', 'Industrial Revolution', 'Renaissance',
            'Pharaohs', 'Pyramids', 'Nile River', 'Hieroglyphics', 'Papyrus', 'Ancient Egyptian Art','agricultural revolution',
            'Greek City-States', 'Athens', 'Sparta', 'Alexander the Great', 'Greek Mythology', 'Acropolis',
            'Julius Caesar', 'Colosseum', 'Roman Republic', 'Roman Architecture', 'Roman Law','golden age','britannia',
            'Knights', 'Crusades', 'Feudalism', 'Gothic Cathedrals', 'Viking Age','historical records','triumph',
            'Qin Dynasty', 'Han Dynasty', 'Great Wall of China', 'Confucianism', 'Chinese Inventions',
            'Mali Empire', 'empire','Great Zimbabwe', 'Axum', 'Songhai Empire', 'Mansa Musa','cultural dynamism','economic growth',
            'Mayan Calendar', 'Tikal', 'Chichen Itza', 'Mayan Hieroglyphs','tudor','roaring twenties','social revolution',
            'Tenochtitlan', 'Aztec Religion', 'Hernan Cortes', 'Machu Picchu', 'Inca Road System', 'Quipu', 'Andean Civilization',
            'Indus Valley Civilization', 'Maurya Empire', 'Gupta Empire', 'Buddhism', 'Hinduism','economic union',
            'Hagia Sophia', 'Justinian I', 'Byzantine Art','economic history','french revolution','alliances'
            ,'Genghis Khan', 'Silk Road', 'Yurts', 'Khanates','protest', 'economic boom','economic crisis','cult of personality',
            'Samurai', 'Shogun', 'Bushido', 'Feudal Japan','historical event', 'battle of','tribes','president of','Gold Coast',
            'Ethiopian Orthodox Tewahedo Church', 'Lalibela', 'Rock-Hewn Churches','great depression',
            'The Crusades', 'The Reformation', 'The Enlightenment', 'Religious Wars', 'European Colonial Empires', 'Exploration', 'Impact on Indigenous Peoples',
            'World War I', 'World War II', 'Holocaust', 'Treaty of Versailles','dot-com bubble','peace prize','pan-african',
            'The Cold War', 'Cuban Missile Crisis', 'Berlin Wall', 'Proxy Wars','archaeologist',
            'Royal', 'dynasty of kings','Empire', 'Colonization', 'War', 'Treaty', 'indigenous', 'Colonies', 
            'Archaeology', 'Architectural History', 'Artifact', 'BC', 'BCE', 'Rich History', 'fashion history','fashion movement',
            'revolution','fashion collection','historical interpreation','historical preservation','historical city',
            'the enlightenment','american revolution','Industrialization of Japan','atlantic slave trade',
            ' Russian Revolution',' Civil Rights Movement ', 'space race','cold war', 'holocaust','acient',
            'sub-saharan','transatlantic slave trade','traditional medicine','middle passage','triangular trade',
            'pharaohs','Kandake','queen of sheba', 'empress','ancient kemet', 'nefertiti',
            'yaa asantewa','akhenaten','emperor','menelik I','Oba Oduduwa','Ife Empire','Information Age',
            'Berlin wall','arab spring','green revolution','internet revolution','digital revolution',
            'Carthage','kingdom of kush','aksumite empire','ghana empire','zulu kingdom','songhai empire',
            'sokoto caliphate','oyo empire','axum','aksum','benin bronze','benin empire', 'ethiopian empire',
            'kanem-bornu empire', 'kongo kingdom','myth','mythology','sacred text','technology artifacts',
            'artifacts','antiquities','stone age','bronze age','iron age','ice age','copper age','mesozoic era',
            'cenozoic era','holocene epoch','pleistocene epoch', 'jurassic period','devonian period',
            'cambrian period','neolithic age', 'Indus Valley Civilization', 'Mesopotamia, Ancient China', 'Maurya and Gupta Empire'
            ,'roman empire','inca','mayan','medieval era','tudors','Mesoamerican','andean civilization',
            'mongol empire','feudal japan','ottoman Empire', 'Mughal Empire', 'Ming Dynasties', 'Qing Dynasties', 'Tokugawa Japan',
            'european colonisation','anti-slavery','scramble for africa','decolinsation',
            'british raj','meiji restoration','chinese revolution','independence movements',
            'post-colonial','rise of china','technological advancement','political change', 'economic change','world history','african history','key figure',
            'excavations','discovery',



        ]
    };

    const keywords = categoryKeywords[category];

    if (!keywords) {
        // If the selected category is not found, return true to allow all facts.
        return true;
    }

    for (const keyword of keywords) {
        if (lowercasedFact.includes(keyword)) {
            return true;
        }
    }

    return false;
}

function createFactCard(factData, isLoading = false) {
    const factElement = document.createElement('div');
    factElement.classList.add('fact-card');

    if (isLoading) {
        const loadingSpinner = document.createElement('div');
        loadingSpinner.classList.add('loading-spinner');
    
        // Create a container for the messages
        const messageContainer = document.createElement('div');
        messageContainer.classList.add('message-container'); // Add the new class
    
        // Add the "Patience, young grasshopper" message
        const patienceMessage = document.createElement('div');
        patienceMessage.textContent = 'Patience, young grasshopper';
    
        // Add the "Good things come to those who wait " quote
        const quote = document.createElement('div');
        quote.textContent = 'Good things come to those who wait 🧠';
    
        // Append the messages to the container
        messageContainer.appendChild(patienceMessage);
        messageContainer.appendChild(quote);
    
        // Append the loading spinner and message container to the factElement
        factElement.appendChild(loadingSpinner);
        factElement.appendChild(messageContainer);    
    } else {
        // Create a div for the text content
// Inside your createFactCard function where you create the textContentDiv:
const textContentDiv = document.createElement('div');
textContentDiv.textContent = factData.extract; // Set the textContent property

// Apply CSS to make sure line breaks are displayed
textContentDiv.style.whiteSpace = 'pre-line';

textContentDiv.classList.add('fact-text'); // Add a class for styling if needed

if (filterCategory === 'Art') {
    textContentDiv.style.textAlign = 'left'; // Apply text-align: justify for the "Art" section
}
// Append the text content div to the fact card
factElement.appendChild(textContentDiv);


        // Append the text content div to the fact card
        factElement.appendChild(textContentDiv);

        // Create a div for the image
        if (factData.image) {
            const imageElement = document.createElement('img');
            imageElement.src = factData.image;
            imageElement.classList.add('fact-image', 'max-image-size');
            
            // Append the image to the fact card after the text
            factElement.appendChild(imageElement);
        }
    }

    return factElement;
}

const homeButton = document.getElementById('home-button');

homeButton.addEventListener('click', () => {
    // Reset the filterCategory to null
    filterCategory = null;

    // Clear the factContainer
    clearFactContainer();

    // Cancel the previous API request if it's still active
    abortController.abort();

    // Create a new abort controller for the current request
    abortController = new AbortController();

    // Load initial facts (without a filter)
    loadNextFacts();

    // Debugging statement
    console.log('Navigated to Home');
});




async function loadNextFacts() {
    // Check if a request is already in progress
    if (isLoadingFacts) {
        return;
    }

    isLoadingFacts = true;

    // Display loading messages for the next facts to be fetched
    const loadingPromises = [];

    while (facts.length < currentFactIndex + factsPerPage) {
        try {
            console.log(`Fetching fact ${facts.length + 1}...`);
            // Create a loading message while fetching
            const loadingFactCard = createFactCard({}, true);
            factContainer.appendChild(loadingFactCard);

            const factData = await fetchRandomFact(filterCategory);

            // Ensure that the loadingFactCard is still in the factContainer before removing it
            if (factContainer.contains(loadingFactCard)) {
                // Remove the loading message
                factContainer.removeChild(loadingFactCard);

                if (factData && factData.extract) {
                    // Create a fact card for the fetched fact and add it to the factContainer
                    const factCard = createFactCard(factData);
                    factContainer.appendChild(factCard);
                    facts.push(factData);
                    console.log(`Fact ${facts.length} fetched successfully.`);
                } else {
                    console.log(`Fact ${facts.length + 1} skipped because it has no data.`);
                }
            }
        } catch (error) {
            // Handle errors, e.g., if fetching the fact fails
            console.error('Error loading fact:', error);
            console.log(`Fact ${facts.length + 1} fetched successfully.`);
        }
    }

    // Update the currentFactIndex to keep track of the facts loaded so far
    currentFactIndex += factsPerPage;

    isLoadingFacts = false;
}

factContainer.addEventListener('scroll', () => {
    const scrollPosition = factContainer.scrollTop;
    const containerHeight = factContainer.clientHeight;
    const contentHeight = factContainer.scrollHeight;

    // Calculate the scroll percentage (how far down the user has scrolled)
    const scrollPercentage = (scrollPosition / (contentHeight - containerHeight)) * 100;

    if (scrollPercentage >= 90) {
        loadNextFacts(); // Load more facts when scrolled to 90% or more
    }
});

factContainer.addEventListener('scroll', () => {
    const scrollPosition = factContainer.scrollTop;
    const containerHeight = factContainer.clientHeight;
    const contentHeight = factContainer.scrollHeight;

    // Calculate the scroll percentage (how far down the user has scrolled)
    const scrollPercentage = (scrollPosition / (contentHeight - containerHeight)) * 100;

    if (scrollPercentage >= 90) {
        loadNextFacts();
    }
});

function clearFactContainer() {
    while (factContainer.firstChild) {
        factContainer.removeChild(factContainer.firstChild);
    }
}

let debounceTimer; // Add a debounce timer

categoryButtons.forEach(button => {
    button.addEventListener('click', async () => {
        const newCategory = button.getAttribute('data-category');

        if (newCategory !== filterCategory) {
            // If a new category is selected, reset the filterCategory
            filterCategory = newCategory;
            console.log('Selected category:', filterCategory); // Debugging statement

            // Reset the currentFactIndex to 0
            currentFactIndex = 0;

            // Clear the facts array and the factContainer
            facts.length = 0;
            clearFactContainer();

            // Cancel the previous API request if it's still active after a short delay
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                abortController.abort();

                // Create a new abort controller for the current request
                abortController = new AbortController();

                // Load new facts for the selected category
                loadNextFacts();
            }, 300); // Adjust the delay as needed
        }
    });
});

// Initial load
loadNextFacts();
