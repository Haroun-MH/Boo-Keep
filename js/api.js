const BookAPI = {
    searchBooks: async function(query) {
        if (!query || query.trim() === '') {
            return [];
        }
        
        try {
            const response = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}`);
            
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.docs || data.docs.length === 0) {
                return [];
            }

            return data.docs.slice(0, 20).map(book => {
                return {
                    id: book.key,
                    title: book.title || 'Unknown Title',
                    authors: book.author_name ? book.author_name.join(', ') : 'Unknown Author',
                    description: 'Click for more details',
                    coverImage: book.cover_i 
                        ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` 
                        : 'https://via.placeholder.com/128x192?text=No+Cover',
                    publishedDate: book.first_publish_year || 'Unknown date',
                    olid: book.key.replace('/works/', ''),
                    subject: book.subject ? book.subject.slice(0, 3).join(', ') : 'Not specified'
                };
            });
        } catch (error) {
            console.error('Error searching books:', error);
            return [];
        }
    },

    getBookDetails: async function(olid) {
        try {
            const response = await fetch(`https://openlibrary.org/works/${olid}.json`);
            
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            
            const data = await response.json();
            console.log(data);
            
            return {
                title: data.title || 'Unknown Title',
                description: data.description ? 
                    (typeof data.description === 'string' ? data.description : data.description.value) 
                    : 'No description available',
                subjects: data.subjects ? data.subjects.join(', ') : 'Not specified',
                coverImage: data.covers && data.covers.length > 0 
                    ? `https://covers.openlibrary.org/b/id/${data.covers[0]}-L.jpg`
                    : 'https://via.placeholder.com/128x192?text=No+Cover'
            };
        } catch (error) {
            console.error('Error getting book details:', error);
            return null;
        }
    }
};