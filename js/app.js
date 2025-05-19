document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const searchResults = document.getElementById('search-results');
    const bookshelf = document.getElementById('bookshelf');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const bookTemplate = document.getElementById('book-template');
    const modal = document.getElementById('book-detail-modal');
    const closeModal = document.querySelector('.close-modal');
    
    let currentFilter = 'all';
    
    init();
    
    function init() {
        renderBookshelf();
        
        searchButton.addEventListener('click', handleSearch);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
        
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                const filter = this.getAttribute('data-filter');
                setActiveFilter(filter);
                renderBookshelf(filter);
            });
        });
        
        closeModal.addEventListener('click', function() {
            modal.classList.remove('show');
        });
        
        window.addEventListener('click', function(event) {
            if (event.target === modal) {
                modal.classList.remove('show');
            }
        });
        
        bookshelf.addEventListener('dragover', function(e) {
            e.preventDefault();
        });
    }
    
    function setActiveFilter(filter) {
        currentFilter = filter;
        
        filterButtons.forEach(button => {
            if (button.getAttribute('data-filter') === filter) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }
    
    async function handleSearch() {
        const query = searchInput.value.trim();
        
        if (!query) {
            return;
        }
        
        searchResults.innerHTML = '<div class="loading">Searching books...</div>';
        
        const books = await BookAPI.searchBooks(query);
        
        renderSearchResults(books);
    }
    
    function renderSearchResults(books) {
        searchResults.innerHTML = '';
        
        if (!books || books.length === 0) {
            searchResults.innerHTML = '<div class="no-results">No books found. Try a different search term.</div>';
            return;
        }
        
        books.forEach(book => {
            const bookElement = createBookElement(book, false);
            searchResults.appendChild(bookElement);
        });
    }
    
    function renderBookshelf(filter = currentFilter) {
        bookshelf.innerHTML = '';
        
        const books = BookStorage.filterBooksByStatus(filter);
        
        if (books.length === 0) {
            bookshelf.innerHTML = '<div class="no-results">No books in your bookshelf yet.</div>';
            return;
        }
        
        books.forEach(book => {
            const bookElement = createBookElement(book, true);
            bookshelf.appendChild(bookElement);
        });
    }
    
    function createBookElement(book, isInBookshelf) {
        const template = bookTemplate.content.cloneNode(true);
        const bookCard = template.querySelector('.book-card');
        
        bookCard.dataset.id = book.id;
        bookCard.dataset.olid = book.olid;
        
        const coverImg = bookCard.querySelector('.book-cover img');
        coverImg.src = book.coverImage;
        coverImg.alt = `${book.title} cover`;
        
        bookCard.querySelector('.book-title').textContent = book.title;
        bookCard.querySelector('.book-author').textContent = book.authors;
        
        const addButton = bookCard.querySelector('.add-to-shelf');
        const statusControls = bookCard.querySelector('.status-controls');
        const statusSelect = bookCard.querySelector('.reading-status');
        const removeButton = bookCard.querySelector('.remove-book');
        
        if (isInBookshelf) {
            addButton.classList.add('hidden');
            statusControls.classList.remove('hidden');
            
            statusSelect.value = book.status;
            
            statusSelect.addEventListener('change', function() {
                BookStorage.updateBookStatus(book.id, this.value);
                renderBookshelf();
            });
            
            removeButton.addEventListener('click', function() {
                BookStorage.removeBook(book.id);
                renderBookshelf();
            });
            
            bookCard.setAttribute('draggable', 'true');
            
            bookCard.addEventListener('dragstart', function(e) {
                e.dataTransfer.setData('text/plain', book.id);
                bookCard.classList.add('dragging');
            });
            
            bookCard.addEventListener('dragend', function() {
                bookCard.classList.remove('dragging');
                document.querySelectorAll('.book-card').forEach(card => {
                    card.classList.remove('drag-over');
                });
            });
            
            bookCard.addEventListener('dragover', function(e) {
                e.preventDefault();
                bookCard.classList.add('drag-over');
            });
            
            bookCard.addEventListener('dragleave', function() {
                bookCard.classList.remove('drag-over');
            });
            
            bookCard.addEventListener('drop', function(e) {
                e.preventDefault();
                bookCard.classList.remove('drag-over');
                
                const sourceId = e.dataTransfer.getData('text/plain');
                const targetId = book.id;
                
                if (sourceId !== targetId) {
                    if (BookStorage.reorderBooks(sourceId, targetId)) {
                        renderBookshelf();
                    }
                }
            });
        } else {
            addButton.addEventListener('click', function() {
                BookStorage.saveBook(book, 'want-to-read');
                renderBookshelf();
                
                this.textContent = 'Added!';
                this.disabled = true;
                setTimeout(() => {
                    this.textContent = 'Add to Shelf';
                    this.disabled = false;
                }, 2000);
            });
        }
        
        bookCard.addEventListener('click', function(event) {
            if (event.target.tagName === 'BUTTON' || 
                event.target.tagName === 'SELECT' || 
                event.target.closest('.book-actions')) {
                return;
            }
            
            showBookDetailModal(book.olid);
        });
        
        return bookCard;
    }
    
    async function showBookDetailModal(olid) {
        modal.querySelector('.modal-title').textContent = 'Loading...';
        modal.querySelector('.modal-subjects').textContent = '';
        modal.querySelector('.modal-description').textContent = 'Loading book details...';
        modal.querySelector('.modal-cover img').src = 'https://via.placeholder.com/200x300?text=Loading';
        
        modal.classList.add('show');
        
        const details = await BookAPI.getBookDetails(olid);
        
        if (details) {
            modal.querySelector('.modal-title').textContent = details.title;
            modal.querySelector('.modal-subjects').textContent = details.subjects;
            modal.querySelector('.modal-description').innerHTML = details.description;
            modal.querySelector('.modal-cover img').src = details.coverImage;
        } else {
            modal.querySelector('.modal-title').textContent = 'Error';
            modal.querySelector('.modal-subjects').textContent = '';
            modal.querySelector('.modal-description').textContent = 'Could not load book details. Please try again.';
        }
    }
});