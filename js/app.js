/**
 * app.js - Main application logic
 * Handles DOM manipulation, event listeners, and connects API and storage
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const searchResults = document.getElementById('search-results');
    const bookshelf = document.getElementById('bookshelf');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const bookTemplate = document.getElementById('book-template');
    const modal = document.getElementById('book-detail-modal');
    const closeModal = document.querySelector('.close-modal');
    
    // Current filter state
    let currentFilter = 'all';
    
    // Initialize the application
    init();
    
    /**
     * Initialize the application
     */
    function init() {
        // Load saved books
        renderBookshelf();
        
        // Set up event listeners
        searchButton.addEventListener('click', handleSearch);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
        
        // Filter buttons
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                const filter = this.getAttribute('data-filter');
                setActiveFilter(filter);
                renderBookshelf(filter);
            });
        });
        
        // Modal close button
        closeModal.addEventListener('click', function() {
            modal.classList.remove('show');
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', function(event) {
            if (event.target === modal) {
                modal.classList.remove('show');
            }
        });
        
        // Set up bookshelf as a drop target
        bookshelf.addEventListener('dragover', function(e) {
            e.preventDefault(); // Allow drop
        });
    }
    
    /**
     * Set active filter button
     * @param {string} filter - Filter to set active
     */
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
    
    /**
     * Handle search form submission
     */
    async function handleSearch() {
        const query = searchInput.value.trim();
        
        if (!query) {
            return;
        }
        
        // Show loading state
        searchResults.innerHTML = '<div class="loading">Searching books...</div>';
        
        // Fetch books from API
        const books = await BookAPI.searchBooks(query);
        
        // Display results
        renderSearchResults(books);
    }
    
    /**
     * Render search results
     * @param {Array} books - Array of book objects
     */
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
    
    /**
     * Render the bookshelf with saved books
     * @param {string} filter - Filter to apply ('all', 'read', or 'want-to-read')
     */
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
    
    /**
     * Create a book element from template
     * @param {Object} book - Book object
     * @param {boolean} isInBookshelf - Whether the book is in the bookshelf
     * @returns {HTMLElement} - Book element
     */
    function createBookElement(book, isInBookshelf) {
        const template = bookTemplate.content.cloneNode(true);
        const bookCard = template.querySelector('.book-card');
        
        // Set book data
        bookCard.dataset.id = book.id;
        bookCard.dataset.olid = book.olid;
        
        const coverImg = bookCard.querySelector('.book-cover img');
        coverImg.src = book.coverImage;
        coverImg.alt = `${book.title} cover`;
        
        bookCard.querySelector('.book-title').textContent = book.title;
        bookCard.querySelector('.book-author').textContent = book.authors;
        
        // Set up action buttons
        const addButton = bookCard.querySelector('.add-to-shelf');
        const statusControls = bookCard.querySelector('.status-controls');
        const statusSelect = bookCard.querySelector('.reading-status');
        const removeButton = bookCard.querySelector('.remove-book');
        
        if (isInBookshelf) {
            // Book is in bookshelf - show status controls
            addButton.classList.add('hidden');
            statusControls.classList.remove('hidden');
            
            // Set current status
            statusSelect.value = book.status;
            
            // Add event listeners for bookshelf actions
            statusSelect.addEventListener('change', function() {
                BookStorage.updateBookStatus(book.id, this.value);
                renderBookshelf();
            });
            
            removeButton.addEventListener('click', function() {
                BookStorage.removeBook(book.id);
                renderBookshelf();
            });
            
            // Make bookshelf items draggable
            bookCard.setAttribute('draggable', 'true');
            
            // Add drag event listeners
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
            // Book is in search results - show add button
            addButton.addEventListener('click', function() {
                BookStorage.saveBook(book, 'want-to-read');
                renderBookshelf();
                
                // Show feedback
                this.textContent = 'Added!';
                this.disabled = true;
                setTimeout(() => {
                    this.textContent = 'Add to Shelf';
                    this.disabled = false;
                }, 2000);
            });
        }
        
        // Add click event to show book details
        bookCard.addEventListener('click', function(event) {
            // Don't show details if clicking on buttons or select
            if (event.target.tagName === 'BUTTON' || 
                event.target.tagName === 'SELECT' || 
                event.target.closest('.book-actions')) {
                return;
            }
            
            showBookDetailModal(book.olid);
        });
        
        return bookCard;
    }
    
    /**
     * Show book detail modal
     * @param {string} olid - Open Library ID
     */
    async function showBookDetailModal(olid) {
        // Show loading state
        modal.querySelector('.modal-title').textContent = 'Loading...';
        modal.querySelector('.modal-subjects').textContent = '';
        modal.querySelector('.modal-description').textContent = 'Loading book details...';
        modal.querySelector('.modal-cover img').src = 'https://via.placeholder.com/200x300?text=Loading';
        
        // Show modal with animation
        modal.classList.add('show');
        
        // Fetch book details
        const details = await BookAPI.getBookDetails(olid);
        
        if (details) {
            // Update modal content
            modal.querySelector('.modal-title').textContent = details.title;
            modal.querySelector('.modal-subjects').textContent = details.subjects;
            modal.querySelector('.modal-description').innerHTML = details.description;
            modal.querySelector('.modal-cover img').src = details.coverImage;
        } else {
            // Show error
            modal.querySelector('.modal-title').textContent = 'Error';
            modal.querySelector('.modal-subjects').textContent = '';
            modal.querySelector('.modal-description').textContent = 'Could not load book details. Please try again.';
        }
    }
});