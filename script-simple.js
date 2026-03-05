const form = document.getElementById('annotationForm');
const list = document.getElementById('annotationsList');
const modal = document.getElementById('modal');
const modalClose = document.querySelector('.modal-close');
const submitBtn = document.getElementById('submitBtn');

let editMode = false;
let allAnnotations = [];

document.getElementById('date').valueAsDate = new Date();

async function loadAnnotations() {
    try {
        const res = await fetch('/api/annotations');
        if (!res.ok) throw new Error('Network response was not ok');
        allAnnotations = await res.json();
        renderAnnotations();
    } catch (err) {
        console.error('Errore caricamento:', err);
        allAnnotations = [];
        renderAnnotations();
    }
}

function renderAnnotations() {
    annotations.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    list.innerHTML = annotations.map(a => `
        <div class="annotation ${a.priority}">
            <div class="annotation-info" onclick="showModal('${a.date}', '${a.priority}', '${a.description.replace(/'/g, "\\'")}')">
                <div class="annotation-date">${a.date}</div>
                <div class="annotation-desc">${a.description}</div>
            </div>
            <div class="annotation-actions">
                <button class="annotation-edit" onclick="editAnnotation(${a.id}, '${a.date}', '${a.priority}', '${a.description.replace(/'/g, "\\'")}')">✎</button>
                <button class="annotation-delete" onclick="deleteAnnotation(${a.id})">×</button>
            </div>
        </div>
    `).join('');
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const date = document.getElementById('date').value;
    const priority = document.getElementById('priority').value;
    const description = document.getElementById('description').value;
    
    try {
        if (editMode) {
            const editId = document.getElementById('editId').value;
            await fetch(`/api/annotations/${editId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date, priority, description })
            });
            cancelEdit();
        } else {
            await fetch('/api/annotations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date, priority, description })
            });
        }
        
        document.getElementById('date').valueAsDate = new Date();
        loadAnnotations();
    } catch (err) {
        console.error('Errore:', err);
        alert('Errore nel salvataggio');
    }
});

async function deleteAnnotation(id) {
    try {
        await fetch(`/api/annotations/${id}`, { method: 'DELETE' });
        loadAnnotations();
    } catch (err) {
        console.error('Errore cancellazione:', err);
        alert('Errore nella cancellazione');
    }
}

function editAnnotation(id, date, priority, desc) {
    editMode = true;
    document.getElementById('editId').value = id;
    document.getElementById('date').value = date;
    document.getElementById('priority').value = priority;
    document.getElementById('description').value = desc;
    submitBtn.textContent = 'Modifica';
}

function cancelEdit() {
    editMode = false;
    document.getElementById('editId').value = '';
    form.reset();
    document.getElementById('date').valueAsDate = new Date();
    submitBtn.textContent = 'Aggiungi';
}

function showModal(date, priority, desc) {
    document.getElementById('modalTitle').textContent = `${date} - ${priority.charAt(0).toUpperCase() + priority.slice(1)}`;
    document.getElementById('modalDesc').textContent = desc;
    modal.style.display = 'block';
}

modalClose.addEventListener('click', () => modal.style.display = 'none');
modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

loadAnnotations();