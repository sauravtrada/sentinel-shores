package com.Hack.Server.Model;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table
public class Result {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;
    private double vegetation_loss_percent;
    private boolean poisoning_detected;
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;



}
