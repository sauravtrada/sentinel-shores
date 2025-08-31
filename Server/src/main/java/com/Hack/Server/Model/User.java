package com.Hack.Server.Model;
import jakarta.validation.constraints.Pattern;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int Id;
    @Pattern(regexp = "^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9+_._]+[a-zA-Z]+$", message = "Ente valide email name!!")
    @Column(unique = true)
    private String email;
    private String password;
    private int Marit;
    private int FoulConunt;
    private String Role;
    // Foreign key to ImageLocation (unique, nullable)
    @OneToOne
    @JoinColumn(name = "image_id", unique = true, nullable = true)
    private ImageLocation imageLocation;





}




