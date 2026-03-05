const form = document.getElementById('annotationForm');
const list = document.getElementById('annotationsList');
const modal = document.getElementById('modal');
const modalClose = document.querySelector('.modal-close');
const submitBtn = document.getElementById('submitBtn');
const searchInput = document.getElementById('search');
const filterPriority = document.getElementById('filterPriority');
const filterTag = document.getElementById('filterTag');
const sortBy = document.getElementById('sortBy');

let editMode = false;
let allAnnotations = [];

document.getElementById('date').valueAsDate = new Date();

async function loadAnnotations() {
    try {
        const res = await fetch('/api/annotations');
        if (!res.ok) throw new Error('Network response was not ok');
        allAnnotations = await res.json();
        updateTagFilter();
        applyFilters();
    } catch (err) {
        console.error('Errore caricamento:', err);
        allAnnotations = [];
        updateTagFilter();
        applyFilters();
    }
}

function updateTagFilter() {
    const tags = new Set();
    allAnnotations.forEach(a => {
        if (a.tags && Array.isArray(a.tags)) a.tags.forEach(t => tags.add(t));
    });
    
    const currentValue = filterTag.value;
    filterTag.innerHTML = '<option value="">Tutti i tag</option>';
    Array.from(tags).forEach(t => {
        filterTag.innerHTML += `<option value="${t}">${t}</option>`;
    });
    filterTag.value = currentValue;
}

function applyFilters() {
    let filtered = [...allAnnotations];
    
    const search = searchInput.value.toLowerCase();
    if (search) {
        filtered = filtered.filter(a => 
            (a.description || '').toLowerCase().includes(search) ||
            (a.tags && Array.isArray(a.tags) && a.tags.some(t => (t || '').toLowerCase().includes(search)))
        );
    }
    
    if (filterPriority.value) {
        filtered = filtered.filter(a => a.priority === filterPriority.value);
    }
    
    if (filterTag.value) {
        filtered = filtered.filter(a => a.tags && Array.isArray(a.tags) && a.tags.includes(filterTag.value));
    }
    
    const sort = sortBy.value;
    if (sort === 'date-desc') {
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sort === 'date-asc') {
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sort === 'priority') {
        const priorityOrder = { alta: 0, media: 1, bassa: 2 };
        filtered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    }
    
    renderAnnotations(filtered);
}

function renderAnnotations(annotations) {
    if (annotations.length === 0) {
        list.innerHTML = '<div class="empty-state">Nessuna annotazione trovata</div>';
        return;
    }
    
    list.innerHTML = annotations.map(a => `
        <div class="annotation ${a.priority}">
            <div class="annotation-content" onclick="showModal('${a.date}', '${a.priority}', '${(a.description || '').replace(/'/g, "\\'")}', '${(a.tags || []).join(',')}')">
                <div class="annotation-date">${a.date}</div>
                <div class="annotation-desc">${a.description || ''}</div>
                ${a.tags && Array.isArray(a.tags) && a.tags.length > 0 ? `<div class="annotation-tags">${a.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>` : ''}
            </div>
            <div class="annotation-actions">
                <button class="annotation-edit" onclick="editAnnotation(${a.id}, '${a.date}', '${a.priority}', '${(a.description || '').replace(/'/g, "\\'")}', '${(a.tags || []).join(',')}')">✎</button>
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
    const tags = document.getElementById('tags').value;
    
    try {
        if (editMode) {
            const editId = document.getElementById('editId').value;
            await fetch(`/api/annotations/${editId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date, priority, description, tags })
            });
            cancelEdit();
        } else {
            await fetch('/api/annotations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date, priority, description, tags })
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

function editAnnotation(id, date, priority, desc, tags) {
    editMode = true;
    document.getElementById('editId').value = id;
    document.getElementById('date').value = date;
    document.getElementById('priority').value = priority;
    document.getElementById('description').value = desc || '';
    document.getElementById('tags').value = tags || '';
    submitBtn.textContent = 'Modifica';
}

function cancelEdit() {
    editMode = false;
    document.getElementById('editId').value = '';
    form.reset();
    document.getElementById('date').valueAsDate = new Date();
    submitBtn.textContent = 'Aggiungi';
}

function showModal(date, priority, desc, tags) {
    document.getElementById('modalTitle').textContent = `${date} - ${priority.charAt(0).toUpperCase() + priority.slice(1)}`;
    document.getElementById('modalDesc').textContent = desc || '';
    document.getElementById('modalTags').innerHTML = tags ? tags.split(',').map(t => `<span class="tag">${t.trim()}</span>`).join('') : '';
    modal.style.display = 'block';
}

modalClose.addEventListener('click', () => modal.style.display = 'none');
modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

searchInput.addEventListener('input', applyFilters);
filterPriority.addEventListener('change', applyFilters);
filterTag.addEventListener('change', applyFilters);
sortBy.addEventListener('change', applyFilters);

loadAnnotations();