package com.Hack.Server.Model;

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
public class ImageLocation {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    private Double latitude;
    private Double longitude;
    @Lob
    @Column(name = "image", columnDefinition = "LONGBLOB")
    private byte[] image; // Store base64 or convert to byte[] if needed

    // Getters and Setters


}
