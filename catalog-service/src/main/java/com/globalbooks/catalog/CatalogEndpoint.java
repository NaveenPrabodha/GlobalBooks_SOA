package com.globalbooks.catalog;

import org.springframework.ws.server.endpoint.annotation.Endpoint;
import org.springframework.ws.server.endpoint.annotation.PayloadRoot;
import org.springframework.ws.server.endpoint.annotation.RequestPayload;
import org.springframework.ws.server.endpoint.annotation.ResponsePayload;
import javax.xml.bind.JAXBElement;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Endpoint
public class CatalogEndpoint {
    private static final String NAMESPACE_URI = "http://globalbooks.com/catalog";
    
    // Mock database
    private List<Book> books = new ArrayList<>();
    
public CatalogEndpoint() {
        // Initialize with sample data

        // Book 1
        Book book1 = new Book();
        book1.setIsbn("978-0134685991");
        book1.setTitle("Effective Java");
        book1.setAuthor("Joshua Bloch");
        book1.setPrice(new BigDecimal("45.99"));
        book1.setStock(50);
        books.add(book1);

        // Book 2
        Book book2 = new Book();
        book2.setIsbn("978-0596009205");
        book2.setTitle("Head First Java");
        book2.setAuthor("Kathy Sierra");
        book2.setPrice(new BigDecimal("35.99"));
        book2.setStock(30);
        books.add(book2);
        
        // Book 3
        Book book3 = new Book();
        book3.setIsbn("978-0132350884");
        book3.setTitle("Clean Code");
        book3.setAuthor("Robert Martin");
        book3.setPrice(new BigDecimal("40.00"));
        book3.setStock(25);
        books.add(book3);
    }
    
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "GetBookRequest")
    @ResponsePayload
    public GetBookResponse getBook(@RequestPayload GetBookRequest request) {

        System.out.println(">>> Received request for ISBN: [" + request.getIsbn() + "]");

        GetBookResponse response = new GetBookResponse();
        
        for (Book book : books) {
            if (book.getIsbn().equals(request.getIsbn())) {

                 System.out.println(">>> Found book: " + book.getTitle());
                response.setBook(book);
                break;
            }
        }
        
        return response;
    }
    
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "SearchBooksRequest")
    @ResponsePayload
    public SearchBooksResponse searchBooks(@RequestPayload SearchBooksRequest request) {
        SearchBooksResponse response = new SearchBooksResponse();
        String keyword = request.getKeyword().toLowerCase();
        
        for (Book book : books) {
            if (book.getTitle().toLowerCase().contains(keyword) || 
                book.getAuthor().toLowerCase().contains(keyword)) {
                response.getBooks().add(book);
            }
        }
        
        return response;
    }
}