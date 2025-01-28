// Advanced text processing
function preprocessText(text) {
    return text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 0);
}

// Intent and entity detection
function detectIntent(query) {
    const queryLower = query.toLowerCase();
    
    // Enhanced intent patterns with more variations
    const intents = {
        what: {
            patterns: ['what is', 'what are', 'what does', 'what\'s', 'whats'],
            weight: 2
        },
        where: {
            patterns: ['where is', 'where can', 'where do', 'how to find', 'locate', 'find'],
            weight: 2
        },
        howTo: {
            patterns: ['how do', 'how to', 'how can', 'steps', 'guide', 'how do i'],
            weight: 2
        },
        enable: {
            patterns: ['enable', 'activate', 'turn on', 'start'],
            weight: 1.5
        },
        contact: {
            patterns: ['contact', 'reach', 'call', 'support'],
            weight: 1.5
        },
        view: {
            patterns: ['view', 'see', 'check', 'look at', 'display'],
            weight: 1.5
        }
    };

    // Enhanced banking-specific entities
    const entities = [
        'paynow', 'account balance', 'transaction limit', 'ocbc app', 
        'internet banking', 'security', 'authentication', 'password',
        'transfer', 'funds', 'mobile number', 'nric', 'onetoken',
        'hardware token', 'text-to-speech', 'magnifying', 'video call',
        'walkthrough', 'transaction history', 'activity', 'dashboard'
    ];

    // Find matching intent with improved pattern matching
    let detectedIntent = null;
    let maxScore = 0;

    for (const [intent, config] of Object.entries(intents)) {
        for (const pattern of config.patterns) {
            if (queryLower.includes(pattern)) {
                const score = config.weight;
                if (score > maxScore) {
                    maxScore = score;
                    detectedIntent = intent;
                }
            }
        }
    }

    // Find entities with improved matching
    const detectedEntities = entities.filter(entity => 
        queryLower.includes(entity.toLowerCase())
    );
    console.log('Detected intent:', detectedIntent);
    console.log('Detected entities:', detectedEntities);
    return { intent: detectedIntent, entities: detectedEntities };
}

// Improved sentence relevance scoring
function extractRelevantSentences(text, query, intentInfo) {
    // Split text into question-answer pairs
    console.log('Text:', text);
    const pairs = text.split(/\n/).filter(line => line.trim());
    console.log('Pairs:', pairs);
    const queryTerms = new Set(preprocessText(query));
    console.log('Query terms:', queryTerms);
    const scoredPairs = pairs.map(pair => {
        const [question, answer] = pair.split('?').map(part => part.trim());
        if (!answer) return { pair, score: 0 }; // Skip invalid pairs
        
        const pairTerms = new Set([
            ...preprocessText(question),
            ...preprocessText(answer)
        ]);
        console.log('Pair terms:', pairTerms);
        let score = 0;
        
        // Score based on query term matches in both question and answer
        queryTerms.forEach(term => {
            if (pairTerms.has(term)) score += 2;
        });
        
        // Boost score for question similarity
        const questionLower = question.toLowerCase();
        const queryLower = query.toLowerCase();
        if (questionLower.includes(queryLower) || queryLower.includes(questionLower)) {
            score += 5;
        }
        console.log(questionLower, queryLower, score);
        console.log((intentInfo.intent));
        // Score based on intent and entities
        if (intentInfo.intent) {
            const pairLower = pair.toLowerCase();
            switch(intentInfo.intent) {
                case 'what':
                    if (questionLower.startsWith('what')) score += 3;
                    break;
                case 'where':
                    if (questionLower.startsWith('where')) score += 3;
                    console.log(questionLower, score);
                    console.log('where', score);
                    break;
                case 'howTo':
                    if (questionLower.startsWith('how')) score += 3;
                    break;
                case 'enable':
                    if (pairLower.includes('enable') || pairLower.includes('activate')) score += 3;
                    break;
                case 'contact':
                    if (pairLower.includes('contact') || pairLower.includes('support')) score += 3;
                    break;
                case 'view':
                    if (pairLower.includes('view') || pairLower.includes('see')) score += 3;
                    break;
            }
        }
        
        // Score based on entities
        intentInfo.entities.forEach(entity => {
            if (pair.toLowerCase().includes(entity.toLowerCase())) {
                score += 3;
            }
        });
        
        return { pair, score };
    });
    console.log('Scored pairs:', scoredPairs);
    
    // Return top scoring pairs
    return scoredPairs
        .sort((a, b) => b.score - a.score)
        .slice(0, 1)
        .map(item => item.pair)
        .filter(pair => pair.includes('?'))
        .map(pair => pair.split('?')[1].trim());
}

// Enhanced answer generation
function generateAnswer(query, relevantSentences, intentInfo) {
    if (relevantSentences.length === 0) {
        return "I apologize, but I don't have enough information to answer that question. Please try asking about PayNow, account balance, transaction limits, app security, or other banking services.";
    }

    let answer = '';
    switch (intentInfo.intent) {
        case 'what':
            answer = relevantSentences.join(' ');
            break;
        case 'where':
            answer = relevantSentences.join(' ');
            break;
        case 'howTo':
            answer = relevantSentences.join(' ');
            break;
        case 'enable':
            answer = `To enable this feature: ${relevantSentences.join(' ')}`;
            break;
        case 'contact':
            answer = `Here's how to contact us: ${relevantSentences.join(' ')}`;
            break;
        case 'view':
            answer = `You can view this by: ${relevantSentences.join(' ')}`;
            break;
        default:
            answer = relevantSentences.join(' ');
    }

    return answer;
}

function cleanText(text) {
    return text.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, '');
}

let knowledgeBase = '';

// Initialize knowledge base from file with updated path
async function initializeKnowledgeBase() {
    try {
        console.log('Attempting to fetch knowledge base...');
        const response = await fetch('https://localhost:3000/api/knowledge');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        knowledgeBase = cleanText(data.knowledge);
        console.log('Knowledge base loaded successfully', knowledgeBase);
        return data.knowledge;
    } catch (error) {
        console.error('Error loading knowledge base:', error);
        throw error;
    }
}

async function sendMessage(message) {
    try {
        const response = await fetch('https://localhost:3000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('Error sending message:', error);
        return "Sorry, I'm having trouble processing your message.";
    }
}

// Process user query
function processQuery(query) {
    const intentInfo = detectIntent(query);
    console.log('Intent info:', intentInfo);
    const relevantSentences = extractRelevantSentences(knowledgeBase, query, intentInfo);
    console.log('Relevant sentences:', relevantSentences);
    return generateAnswer(query, relevantSentences, intentInfo);
}

// UI Functions
function addMessage(text, isUser) {
    const chatBox = document.getElementById('chatBox');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    messageDiv.innerText = text;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function addUserMessage(text) {
    addMessage(text, true);
}

function addBotMessage(text) {
    addMessage(text, false);
}

// Handle user input
window.sendMessage = function() {
    const input = document.getElementById('userInput');
    const query = input.value.trim();
    
    if (query) {
        addUserMessage(query);
        const response = processQuery(query);
        addBotMessage(response);
        input.value = '';
    }
}

window.handleKeyPress = function(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// Initialize the system
document.addEventListener('DOMContentLoaded', async () => {
    await initializeKnowledgeBase();
    addBotMessage("Hello! I'm here to help with your OCBC banking queries. How can I assist you today?");
});