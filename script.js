document.addEventListener("DOMContentLoaded", () => {
    // Inicialização
    initSessionId();
    setupRadioButtons();
    setupWhatsAppMask();
    setupAutoSave();
    
    // Auto focus na etapa 1
    setTimeout(() => {
        const firstInput = document.getElementById('nome');
        if(firstInput) firstInput.focus();
    }, 100);
});

let currentSessionId = null;

function initSessionId() {
    if (!currentSessionId) {
        currentSessionId = 'lead_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

function getSessionId() {
    return currentSessionId;
}

// Configurar rádio botões visuais
function setupRadioButtons() {
    const radioOptions = document.querySelectorAll('.radio-option');
    radioOptions.forEach(option => {
        const input = option.querySelector('input[type="radio"]');
        input.addEventListener('change', () => {
            // Remove 'selected' class from siblings
            const siblings = option.closest('.radio-group').querySelectorAll('.radio-option');
            siblings.forEach(sib => sib.classList.remove('selected'));
            
            // Add 'selected' to current
            if (input.checked) {
                option.classList.add('selected');
            }
            saveData(false); // Auto-save when radio changes
            
            // Avanço automático após 250ms de clicar na opção
            setTimeout(() => {
                const step = option.closest('.step');
                if (step.id === 'step-3') {
                    nextStep(3);
                } else if (step.id === 'step-4') {
                    submitForm();
                }
            }, 250);
        });
    });
}

// Máscara e validação do WhatsApp
function setupWhatsAppMask() {
    const waInput = document.getElementById('whatsapp');
    if(waInput) {
        waInput.addEventListener('input', function(e) {
            let x = e.target.value.replace(/\D/g, '').substring(0, 11).match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
            e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
            saveData(false); // Auto-save on digit change
        });
    }
    
    const nomeInput = document.getElementById('nome');
    if (nomeInput) {
        nomeInput.addEventListener('input', () => saveData(false));
    }
}

function validateStep(stepIndex) {
    let isValid = true;
    
    if (stepIndex === 1) {
        const nome = document.getElementById('nome').value.trim();
        const errorNome = document.getElementById('error-nome');
        if (!nome) {
            errorNome.style.display = 'block';
            isValid = false;
        } else {
            errorNome.style.display = 'none';
        }
    } 
    else if (stepIndex === 2) {
        const wa = document.getElementById('whatsapp').value.replace(/\D/g, '');
        const errorWa = document.getElementById('error-whatsapp');
        // OBRIGATORIAMENTE 11 dígitos (2 do DDD + 9 do número)
        if (wa.length !== 11) {
            errorWa.style.display = 'block';
            errorWa.innerText = 'Por favor, insira o DDD e o número com 9 dígitos (total 11 dígitos).';
            isValid = false;
        } else {
            errorWa.style.display = 'none';
        }
    }
    else if (stepIndex === 3) {
        const perfil = document.querySelector('input[name="perfil"]:checked');
        const errorPerfil = document.getElementById('error-perfil');
        if (!perfil) {
            errorPerfil.style.display = 'block';
            isValid = false;
        } else {
            errorPerfil.style.display = 'none';
        }
    }
    else if (stepIndex === 4) {
        const assunto = document.querySelector('input[name="assunto"]:checked');
        const errorAssunto = document.getElementById('error-assunto');
        if (!assunto) {
            errorAssunto.style.display = 'block';
            isValid = false;
        } else {
            errorAssunto.style.display = 'none';
        }
    }

    return isValid;
}

function nextStep(currentStepIndex) {
    if (validateStep(currentStepIndex)) {
        // Salvar dados no localStorage
        saveData(false);
        
        // Hide current step
        document.getElementById(`step-${currentStepIndex}`).classList.remove('active');
        
        // Show next step
        const nextStepIndex = currentStepIndex + 1;
        document.getElementById(`step-${nextStepIndex}`).classList.add('active');
        
        // Update Progress
        const percent = (nextStepIndex / 4) * 100;
        document.getElementById('progress-bar').style.width = `${percent}%`;
        document.getElementById('progress-text').innerText = `Etapa ${nextStepIndex} de 4`;
        
        // Focus the first input of the new step
        setTimeout(() => {
            if (nextStepIndex === 2) {
                document.getElementById('whatsapp').focus();
            }
        }, 100);
    }
}

function submitForm() {
    if (validateStep(4)) {
        // Mantém como "Não finalizado" por enquanto
        saveData(false);
        
        // Esconder formulário todo e o texto inicial
        document.getElementById('survey-flow').style.display = 'none';
        
        // Mostrar tela de sucesso
        document.getElementById('final-screen').style.display = 'block';
    }
}

function finalizeLead() {
    // Altera o status para "Finalizado" pois efetivamente clicou no download
    saveData(true);
}

function setupAutoSave() {
    // Os eventos de input e change já chamam saveData(false)
}

function saveData(isFinal) {
    const sessionId = getSessionId();
    const nome = document.getElementById('nome') ? document.getElementById('nome').value.trim() : '';
    const whatsapp = document.getElementById('whatsapp') ? document.getElementById('whatsapp').value : '';
    const perfilEl = document.querySelector('input[name="perfil"]:checked');
    const assuntoEl = document.querySelector('input[name="assunto"]:checked');
    
    const data = {
        id: sessionId,
        nome: nome,
        whatsapp: whatsapp,
        perfil: perfilEl ? perfilEl.value : '',
        assunto: assuntoEl ? assuntoEl.value : '',
        status: isFinal ? 'Finalizado' : 'Não finalizado',
        dataUpdate: new Date().toLocaleString('pt-BR')
    };

    // Lê os leads do LocalStorage
    let leads = JSON.parse(localStorage.getItem('saved_leads')) || [];
    
    // Procura se esse lead já existe
    const existingIndex = leads.findIndex(l => l.id === sessionId);
    
    // Só salva se houver pelo menos nome ou zap preenchido
    if (data.nome !== '' || data.whatsapp !== '') {
        if (existingIndex >= 0) {
            leads[existingIndex] = data; // atualiza
        } else {
            leads.push(data); // insere novo
        }
        
        localStorage.setItem('saved_leads', JSON.stringify(leads));
    }
}
