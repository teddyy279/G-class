package com.edu.G_class.entity;

import com.edu.G_class.enums.Role;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;


import java.time.LocalDateTime;

@Entity

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)

@Table(name = "class_members")
public class ClassMember {
    @EmbeddedId
    ClassMemberKey id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("classId")
    @JoinColumn(name = "class_id")
    Classes clazz;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId") //lấy userId từ user table xong tự map sang cho user_id của bảng classmember(current table)
    @JoinColumn(name = "user_id")
    User user;

    @Enumerated(EnumType.STRING)
    Role memberRole;

    @CreationTimestamp
    LocalDateTime joinedAt;
}


