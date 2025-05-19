const BookStorage = {
    STORAGE_KEY: 'bookshelf_books',
    
    getBooks: function() {
        const booksJSON = localStorage.getItem(this.STORAGE_KEY);
        return booksJSON ? JSON.parse(booksJSON) : [];
    },
    
    saveBook: function(book, status) {
        if (!book || !book.id) {
            return false;
        }
        
        const books = this.getBooks();
        
        if (books.some(b => b.id === book.id)) {
            return false;
        }
        
        book.status = status || 'want-to-read';
        
        books.push(book);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(books));
        
        return true;
    },
    
    removeBook: function(bookId) {
        if (!bookId) {
            return false;
        }
        
        const books = this.getBooks();
        const updatedBooks = books.filter(book => book.id !== bookId);
        
        if (updatedBooks.length === books.length) {
            return false;
        }
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedBooks));
        return true;
    },
    
    updateBookStatus: function(bookId, status) {
        if (!bookId || !status) {
            return false;
        }
        
        const books = this.getBooks();
        const bookIndex = books.findIndex(book => book.id === bookId);
        
        if (bookIndex === -1) {
            return false;
        }
        
        books[bookIndex].status = status;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(books));
        
        return true;
    },
    
    filterBooksByStatus: function(status) {
        const books = this.getBooks();
        
        if (status === 'all') {
            return books;
        }
        
        return books.filter(book => book.status === status);
    },
    
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
        
        const [sourceBook] = books.splice(sourceIndex, 1);
        
        books.splice(targetIndex, 0, sourceBook);
        
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(books));
        
        return true;
    }
};