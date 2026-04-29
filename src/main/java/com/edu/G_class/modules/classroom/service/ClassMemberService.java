package com.edu.G_class.modules.classroom.service;

import com.edu.G_class.common.exception.AppException;
import com.edu.G_class.common.exception.ErrorCode;
import com.edu.G_class.entity.*;
import com.edu.G_class.enums.Role;
import com.edu.G_class.modules.classroom.dto.request.InviteRequest;
import com.edu.G_class.modules.classroom.dto.request.JoinClassRequest;
import com.edu.G_class.modules.classroom.dto.response.ClassMemberResponse;
import com.edu.G_class.modules.classroom.dto.response.MemberResponse;
import com.edu.G_class.modules.classroom.repository.ClassMemberRepository;
import com.edu.G_class.modules.classroom.repository.ClassRepository;
import com.edu.G_class.modules.classroom.repository.InvitationRepository;
import com.edu.G_class.modules.identity.repository.UserRepository;
import com.edu.G_class.modules.notification.dto.NotificationRequest;
import com.edu.G_class.modules.notification.producer.NotificationProducer;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ClassMemberService {
    ClassRepository classRepository;
    ClassMemberRepository classMemberRepository;
    UserRepository userRepository;
    InvitationRepository invitationRepository;
    NotificationProducer notificationProducer;

    @org.springframework.beans.factory.annotation.Value("${app.frontend-url:http://localhost:5173}")
    @lombok.experimental.NonFinal
    String frontendUrl;


    @Transactional
    public void joinClassByCode(JoinClassRequest request) {
        User user = getCurrentUser();
        Classes clazz = classRepository.findByClassCode(request.classCode())
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        // 1. Validation
        if (clazz.getOwner().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.OWNER_CANNOT_JOIN_OWN_CLASS);
        }
        validateUserNotInClass(clazz.getId(), user.getId());

        // 2. Execution
        saveClassMember(clazz, user, Role.STUDENT);
    }

    @Transactional
    public void sendInvitation(InviteRequest request) {
        User teacher = getCurrentUser();
        Classes clazz = getClassOrThrow(request.classId());

        // 1. Kiểm tra quyền của người mời
        validateTeacherPrivilege(clazz.getId(), teacher.getId());

        // 2. Kiểm tra người được mời (invitee)
        userRepository.findByEmail(request.email()).ifPresent(invitee -> {
            validateUserNotInClass(clazz.getId(), invitee.getId());
        });

        // 3. Tạo và gửi invitation
        createAndSendInvitation(clazz, request.email(), request.role());
    }

    @Transactional
    public void acceptInvitation(UUID token) {
        Invitation invite = invitationRepository.findById(token)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_OTP));

        validateInvitation(invite);

        User user = getCurrentUser();
        if (!invite.getEmail().equals(user.getEmail())) {
            throw new AppException(ErrorCode.UNAUTHORIZE);
        }

        // Nếu đã là thành viên rồi thì chỉ cần cập nhật trạng thái invitation
        if (!classMemberRepository.existsById(new ClassMemberKey(invite.getClassId(), user.getId()))) {
            Classes clazz = classRepository.getReferenceById(invite.getClassId());
            saveClassMember(clazz, user, invite.getRole());
        }

        invite.setAccepted(true);
        invitationRepository.save(invite);
    }

    public ClassMemberResponse getClassMember(UUID classId) {
        List<ClassMember> members = classMemberRepository.findAllByClassIdWithUser(classId);

        UUID ownerId = members.isEmpty() ? null : members.get(0).getClazz().getOwner().getId();

        List<MemberResponse> teachers = members.stream()
                .filter(m -> m.getMemberRole().equals(Role.TEACHER))
                .map(m -> MemberResponse.builder()
                        .userId(m.getUser().getId())
                        .fullName(m.getUser().getFullName())
                        .avatar(m.getUser().getAvatar())
                        .isOwner(m.getUser().getId().equals(ownerId))
                        .build())
                .toList();

        List<MemberResponse> students = members.stream()
                .filter(m -> m.getMemberRole().equals(Role.STUDENT))
                .map(m -> MemberResponse.builder()
                        .userId(m.getUser().getId())
                        .fullName(m.getUser().getFullName())
                        .avatar(m.getUser().getAvatar())
                        .isOwner(false)
                        .build())
                .toList();

        return new ClassMemberResponse(teachers, students);
    }

    @Transactional
    public void leaveClass(UUID classId) {
        User currentUser = getCurrentUser();

        Classes clazz = getClassOrThrow(classId);

        if (clazz.getOwner().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.OWNER_CANNOT_LEAVE);
        }

        classMemberRepository.deleteById(new ClassMemberKey(classId, currentUser.getId()));
    }

    @Transactional
    public void removeMember(UUID classId, UUID targetUserId) {
        User currentUser = getCurrentUser();

        ClassMember performer = classMemberRepository.findById(new ClassMemberKey(classId, currentUser.getId()))
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHORIZE));

        if (!performer.getMemberRole().equals(Role.TEACHER)) {
            throw new AppException(ErrorCode.UNAUTHORIZE);
        }

        classMemberRepository.deleteById(new ClassMemberKey(classId, targetUserId));
    }

    private User getCurrentUser() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    private Classes getClassOrThrow(UUID classId) {
        return classRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));
    }

    private void validateUserNotInClass(UUID classId, UUID userId) {
        ClassMemberKey key = new ClassMemberKey(classId, userId);
        classMemberRepository.findById(key).ifPresent(member -> {
            if (member.getMemberRole() == Role.TEACHER) {
                throw new AppException(ErrorCode.ALREADY_IN_CLASS_AS_TEACHER);
            }
            throw new AppException(ErrorCode.USER_ALREADY_IN_CLASS);
        });
    }

    private void validateTeacherPrivilege(UUID classId, UUID userId) {
        ClassMember member = classMemberRepository.findById(new ClassMemberKey(classId, userId))
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHORIZE));

        if (member.getMemberRole() != Role.TEACHER) {
            throw new AppException(ErrorCode.UNAUTHORIZE);
        }
    }

    private void validateInvitation(Invitation invite) {
        if (invite.isAccepted()) throw new AppException(ErrorCode.INVITATION_ALREADY_USED);
        if (invite.getExpiredsAT().isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.INVITATION_EXPIRED);
        }
    }

    private void saveClassMember(Classes clazz, User user, Role role) {
        try {
            ClassMember member = ClassMember.builder()
                    .id(new ClassMemberKey(clazz.getId(), user.getId()))
                    .clazz(clazz)
                    .user(user)
                    .memberRole(role)
                    .build();
            classMemberRepository.saveAndFlush(member);
        } catch (DataIntegrityViolationException e) {
            throw new AppException(ErrorCode.USER_ALREADY_IN_CLASS);
        }
    }

    private void createAndSendInvitation(Classes clazz, String email, Role role) {
        try {
            Invitation invitation = Invitation.builder()
                    .email(email)
                    .classId(clazz.getId())
                    .role(role)
                    .expiredsAT(LocalDateTime.now().plusDays(1))
                    .accepted(false)
                    .build();
            invitationRepository.save(invitation);

            String inviteLink = frontendUrl + "/accept-invite?token=" + invitation.getId();
            notificationProducer.sendInviteMessage(NotificationRequest.builder()
                    .to(email)
                    .subject("Mời bạn tham gia lớp học " + clazz.getName())
                    .body("Bạn được mời tham gia với vai trò " + role + ". Click: " + inviteLink)
                    .build());
        } catch (DataIntegrityViolationException e) {
            throw new AppException(ErrorCode.INVITATION_ALREADY_SENT);
        }
    }
}
/*
public class ClassMemberService {
    ClassRepository classRepository;
    ClassMemberRepository classMemberRepository;
    UserRepository userRepository;
    InvitationRepository invitationRepository;
    NotificationProducer notificationProducer;

    @Transactional
    public void joinClassByCode(JoinClassRequest request) {
        //It's important to understand that if you join using a code, you will be automatically classified as a STUDENT.
        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Classes clazz = classRepository.findByClassCode(request.classCode())
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));


        //Compare the ID of the person joining with the ID of the person who created that class.
        //if the current user is the owner of the class, they cannot join the class.
        if(clazz.getOwner().getId().equals(user.getId())) {
            throw new AppException(ErrorCode.OWNER_CANNOT_JOIN_OWN_CLASS);
        }


        ClassMemberKey memberKey = new ClassMemberKey(clazz.getId(), user.getId());
        //Check if the user already belongs to the class before adding them to the class.

        ClassMember existingMember = classMemberRepository.findById(memberKey).orElse(null);

        if (existingMember != null) {
            if (existingMember.getMemberRole() == Role.TEACHER) {
                throw new AppException(ErrorCode.ALREADY_IN_CLASS_AS_TEACHER);
            }
            throw new AppException(ErrorCode.USER_ALREADY_IN_CLASS);
        }

        ClassMember newMember = ClassMember.builder()
                .id(memberKey)
                .clazz(clazz)
                .user(user)
                .memberRole(Role.STUDENT)
                .build();

        try {
            classMemberRepository.save(newMember);
        } catch (DataIntegrityViolationException exception) {
            throw new AppException(ErrorCode.USER_ALREADY_IN_CLASS);
        }
    }


    @Transactional
    public void sendInvitation (InviteRequest request) {
        // { 1.check người mời có phải là giáo viên hay không
        String currentUseremail = SecurityContextHolder.getContext().getAuthentication().getName();

        User user = userRepository.findByEmail(currentUseremail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Classes clazz = classRepository.findById(request.classId())
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        validateTeacherPrivilege(clazz.getId(), user); // check có phải giáo viên không
        // }
        // ở case này nếu user chưa đăng kí tài khoản vẫn mời vào lớp nên để là optional vì có trường hợp
        // user chưa có trong hệ thống nó có thể trả về null
        // { 2. check xem user đã có trong lớp chưa(cái check chính của đoạn này

        //check user đã có trong hệ thống chưa(đăng kí) -> user có hay chưa có trong hệ thống vẫn mời vào lớp
        //vì thế chỗ này để optional vì có thể user chưa có trong hệ thống optional sẽ trả về null
        Optional<User> invitee = userRepository.findByEmail(request.email());

        // nếu đăng kí rồi thì check user đã ở trong lớp chưa
        if(invitee.isPresent()) {
            ClassMemberKey memberKey = new ClassMemberKey(clazz.getId(), user.getId());
            if(classMemberRepository.existsById(memberKey)) {
                throw new AppException(ErrorCode.USER_ALREADY_IN_CLASS);
            }
        }
        // }

        // 3. user chưa ở trong lớp thì tạo thư mời
        UUID id = null;
        try {
            Invitation invitation = Invitation.builder()
                    .email(request.email())
                    .classId(clazz.getId())
                    .role(request.role())
                    .expiredsAT(LocalDateTime.now().plusDays(1))
                    .accepted(false)
                    .build();

            invitationRepository.save(invitation);

            String inviteLink = frontendUrl + "/accept-invite?token=" + invitation.getId();
            NotificationRequest mailRequest = NotificationRequest.builder()
                    .to(request.email())
                    .subject("mời bạn tham gia lớp học" + clazz.getName())
                    .body("Bạn được mời tham gia lớp học với vai trò " + request.role() + ". Click vào link để chấp nhận: " + inviteLink)
                    .build();

            notificationProducer.sendNotification(mailRequest);

        } catch (DataIntegrityViolationException exception) {
            throw new AppException(ErrorCode.INVITATION_ALREADY_SENT);
        }
    }


    @Transactional
    public void acceptInvitation(UUID token) { //token này là Id của Invitation
        //1. check invitation {
        Invitation invite = invitationRepository.findById(token)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_OTP));

        if (invite.isAccepted()) throw new AppException(ErrorCode.INVITATION_ALREADY_USED);

        if (invite.getExpiredsAT().isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.INVITATION_EXPIRED);
        }
        //}

        // mình là người nhận
        //note: ở đây thằng nhận lời mời nên email của thằng nhận phải trùng với email
        // trong invitation vì email trong invitation là email của thằng nhận (hay là email của request đến đấy)
        // {2. identity Match
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        // compare with email in the invitation
        if(!invite.getEmail().equals(currentUserEmail)) {
            throw new AppException(ErrorCode.UNAUTHORIZE);
        }
        // }

        // {3. JoinClass

        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        ClassMemberKey memberKey = new ClassMemberKey(invite.getClassId(), user.getId());
        if (classMemberRepository.existsById(memberKey)) {
            invite.setAccepted(true);
            invitationRepository.save(invite);
            return;
        }

        ClassMember newMember = ClassMember.builder()
                .id(memberKey)
                .clazz(classRepository.getReferenceById(invite.getClassId()))
                .user(user)
                .memberRole(invite.getRole())
                .build();
        // }
        classMemberRepository.save(newMember);

        invite.setAccepted(true);
        invitationRepository.save(invite);
    }

    public void validateTeacherPrivilege(UUID classId, User currentUser) {
        ClassMemberKey key = new ClassMemberKey(classId, currentUser.getId());
        ClassMember member = classMemberRepository.findById(key)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHORIZE));

        Role role = member.getMemberRole();
        if (role != Role.TEACHER) {
            throw new AppException(ErrorCode.UNAUTHORIZE);
        }
    }
}
*/