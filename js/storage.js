/**
 * storage.js - Local storage operations
 * Handles saving, retrieving, and managing books in localStorage
 */

const BookStorage = {
    // Storage key for books
    STORAGE_KEY: 'bookshelf_books',
    
    /**
     * Get all books from localStorage
     * @returns {Array} - Array of book objects
     */
    getBooks: function() {
        const booksJSON = localStorage.getItem(this.STORAGE_KEY);
        return booksJSON ? JSON.parse(booksJSON) : [];
    },
    
    /**
     * Save a book to localStorage
     * @param {Object} book - Book object to save
     * @param {string} status - Reading status ('read' or 'want-to-read')
     * @returns {boolean} - Success status
     */
    saveBook: function(book, status) {
        if (!book || !book.id) {
            return false;
        }
        
        const books = this.getBooks();
        
        // Check if book already exists
        if (books.some(b => b.id === book.id)) {
            return false;
        }
        
        // Add status to book object
        book.status = status || 'want-to-read';
        
        // Save to localStorage
        books.push(book);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(books));
        
        return true;
    },
    
    /**
     * Remove a book from localStorage
     * @param {string} bookId - ID of the book to remove
     * @returns {boolean} - Success status
     */
    removeBook: function(bookId) {
        if (!bookId) {
            return false;
        }
        
        const books = this.getBooks();
        const updatedBooks = books.filter(book => book.id !== bookId);
        
        if (updatedBooks.length === books.length) {
            return false; // Book not found
        }
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedBooks));
        return true;
    },
    
    /**
     * Update a book's reading status
     * @param {string} bookId - ID of the book to update
     * @param {string} status - New reading status
     * @returns {boolean} - Success status
     */
    updateBookStatus: function(bookId, status) {
        if (!bookId || !status) {
            return false;
        }
        
        const books = this.getBooks();
        const bookIndex = books.findIndex(book => book.id === bookId);
        
        if (bookIndex === -1) {
            return false; // Book not found
        }
        
        books[bookIndex].status = status;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(books));
        
        return true;
    },
    
    /**
     * Filter books by reading status
     * @param {string} status - Status to filter by ('all', 'read', or 'want-to-read')
     * @returns {Array} - Filtered array of book objects
     */
    filterBooksByStatus: function(status) {
        const books = this.getBooks();
        
        if (status === 'all') {
            return books;
        }
        
        return books.filter(book => book.status === status);
    },
    
    /**
     * Reorder books in the bookshelf
     * @param {string} sourceId - ID of the book being moved
     * @param {string} targetId - ID of the book to insert before
     * @returns {boolean} - Success status
     */
    reorderBooks: function(sourceId, targetId) {
        if (!sourceId || !targetId || sourceId === targetId) {
            return false;
        }
        
        const books = this.getBooks();
        const sourceIndex = books.findIndex(book => book.id === sourceId);
        const targetIndex = books.findIndex(book => book.id === targetId);
        
        if (sourceIndex === -1 || targetIndex === -1) {
            return false;
        }
        
        // Remove the source book
        const [sourceBook] = books.splice(sourceIndex, 1);
        
        // Insert it at the target position
        books.splice(targetIndex, 0, sourceBook);
        
        // Save the updated order
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(books));
        
        return true;
    }
};