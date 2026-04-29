package com.edu.G_class.modules.auth.service;


import com.edu.G_class.common.exception.AppException;
import com.edu.G_class.common.exception.ErrorCode;
import com.edu.G_class.entity.RefreshToken;
import com.edu.G_class.entity.Role;
import com.edu.G_class.entity.User;
import com.edu.G_class.modules.auth.dto.request.AuthenticationRequest;
import com.edu.G_class.modules.auth.dto.request.ExchangeTokenRequest;
import com.edu.G_class.modules.auth.dto.request.IntrospectRequest;
import com.edu.G_class.modules.auth.dto.response.AuthenticationResponse;
import com.edu.G_class.modules.auth.dto.response.IntrospectResponse;
import com.edu.G_class.modules.auth.dto.response.OutboundUserResponse;
import com.edu.G_class.modules.auth.dto.response.TokenResponse;
import com.edu.G_class.modules.auth.repository.*;
import com.edu.G_class.modules.auth.repository.httpClient.OutboundIdentityClient;
import com.edu.G_class.modules.auth.repository.httpClient.OutboundUserClient;
import com.edu.G_class.modules.identity.repository.UserRepository;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Set;
import java.util.StringJoiner;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j

@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)

public class AuthenticationService {
    UserRepository userRepository;
    RoleRepository roleRepository;
    AuthenticationRepository authenticationRepository;
    AuthUserRepository authUserRepositoryuser;
    RefreshTokenRepository refreshTokenRepository;
    InvalidatedTokenRepository invalidatedTokenRepository;
    OutboundIdentityClient outboundIdentityClient;
    OutboundUserClient outboundUserClient;
    PasswordEncoder passwordEncoder;


    @NonFinal
    @Value("${jwt.signerKey}")
    protected String signerKey;

    @NonFinal
    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    String CLIENT_ID;

    @NonFinal
    @Value("${spring.security.oauth2.client.registration.google.client-secret}")
    String CLIENT_SECRET;

    @NonFinal
    @Value("${spring.security.oauth2.client.registration.google.redirect-uri}")
    String REDIRECT_URI;

    public String generateToken(User user) {
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS256);

        JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
                .subject(user.getId().toString())
                .issuer("edu.com")
                .issueTime(new Date())
                .expirationTime(new Date(
                        Instant.now().plus(1, ChronoUnit.HOURS).toEpochMilli()))
                .claim("scope", buildScope(user))
                .claim("email", user.getEmail())
                .build();

        Payload payload = new Payload(jwtClaimsSet.toJSONObject());
        JWSObject jwsObject = new JWSObject(header, payload);

        try {
            jwsObject.sign(new MACSigner(signerKey.getBytes())); //signature = (header + payload) sign
            return jwsObject.serialize();
        } catch (JOSEException exception) {
            log.error("Cannot get token ", exception);
            throw new RuntimeException();
        }
    }

    public String buildScope(User user) {
        StringJoiner stringJoiner = new StringJoiner(" ");
        if (!CollectionUtils.isEmpty(user.getRoles())){
            user.getRoles().forEach(role -> {
                stringJoiner.add(role.getName());
            });
        }
        return stringJoiner.toString();
    }

    private String getCookieValue(HttpServletRequest httpServletRequest, String name) {
        if (httpServletRequest.getCookies() != null){
            for (var cookie : httpServletRequest.getCookies()){
                if (cookie.getName().equals(name)) return cookie.getValue();
            }
        }
        throw new AppException(ErrorCode.UNAUTHENTICATED);
    }

    public SignedJWT verifyToken(String token) throws JOSEException, ParseException {
        JWSVerifier verifier = new MACVerifier(signerKey.getBytes());

        SignedJWT signedJWT = SignedJWT.parse(token); // chuyển string thành object jwt

        Date expiryTime = signedJWT.getJWTClaimsSet().getExpirationTime();

        boolean verified = signedJWT.verify(verifier);

        //boolean isInvalidated = invalidatedTokenRepository.existsById(signedJWT.getJWTClaimsSet().getJWTID());

        if(!(verified && expiryTime.after(new Date()))) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        return signedJWT;
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request, HttpServletResponse response){
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
        var user = userRepository
                .findByUsername(request.username())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        boolean authenticate = passwordEncoder.matches(request.password(), user.getPassword());

        if(!authenticate) throw new AppException(ErrorCode.UNAUTHENTICATED);

        var accessToken = generateToken(user);

        String refreshTokenStr = UUID.randomUUID().toString();

        RefreshToken refreshToken = RefreshToken.builder()
                .token(refreshTokenStr)
                .user(user)
                .expiryTime(Instant.now().plus(7, ChronoUnit.DAYS))
                .build();
        refreshTokenRepository.save(refreshToken); //lưu vào trong database ở phía server

        ResponseCookie cookie = ResponseCookie.from("refresh-token", refreshTokenStr)
                .httpOnly(true)
                .secure(false) //để test ở local nếu deploy https thì để là true
                .path("/") //áp dụng cho toàn bộ domain -> all domain deu co cookie
                .maxAge(7 * 24 * 60 * 60)
                .sameSite("Lax")  // hỗ trợ gửi cookie khi redirect
                .build();


        //browser sẽ lưu cookie và tự động gửi lại trong request sau
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return AuthenticationResponse.builder().token(accessToken).authenticate(true).build();
    }

    public IntrospectResponse introspect(IntrospectRequest request) throws JOSEException, ParseException{
        var token = request.token();
        boolean isValid = true;

        try {
            verifyToken(token);
        } catch(AppException exception) {
            isValid = false;
        }

        return IntrospectResponse.builder()
                .valid(isValid)
                .build();
    }

    public AuthenticationResponse refreshToken(HttpServletRequest request) throws JOSEException, ParseException {

        String refreshTokenStr = getCookieValue(request, "refresh-token"); //get refreshToken from cookie

        var refreshTokenInDb = refreshTokenRepository.findByToken(refreshTokenStr)
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHENTICATED));

        if(refreshTokenInDb.getExpiryTime().isBefore(Instant.now())) { //check expiryTime in DB < currentTime so delete
            refreshTokenRepository.delete(refreshTokenInDb);
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        var user = refreshTokenInDb.getUser();
        String newAccessToken = generateToken(user);

        return AuthenticationResponse.builder()
                .token(newAccessToken)
                .authenticate(true)
                .build();
    }

    public void logout(HttpServletRequest request, HttpServletResponse response) {
        try {
            String refreshTokenStr = getCookieValue(request, "refresh-token");
            refreshTokenRepository.deleteByToken(refreshTokenStr);
        } catch (Exception exception) {
            log.info("Logout: No refresh token found in cookie or already deleted.");
        }

        ResponseCookie cookie = ResponseCookie.from("refresh-token", "")
                .httpOnly(true)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }



    public AuthenticationResponse outboundAuthenticate(String code, String redirectUri, HttpServletResponse response) {
        org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();

        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_FORM_URLENCODED);

        org.springframework.util.MultiValueMap<String, String> body = new org.springframework.util.LinkedMultiValueMap<>();
        body.add("code", code);
        body.add("client_id", CLIENT_ID);
        body.add("client_secret", CLIENT_SECRET);
        body.add("redirect_uri", redirectUri != null ? redirectUri : REDIRECT_URI);
        body.add("grant_type", "authorization_code");

        org.springframework.http.HttpEntity<org.springframework.util.MultiValueMap<String, String>> request =
                new org.springframework.http.HttpEntity<>(body, headers);

        TokenResponse googleResponse = null;
        try {
            googleResponse = restTemplate.postForObject(
                    "https://oauth2.googleapis.com/token",
                    request,
                    TokenResponse.class
            );
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            log.error("Google Token Exchange Error: Status = {}, Response = {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }

        if (googleResponse == null || googleResponse.accessToken() == null) {
            log.error("Google Token Exchange Error: No access token in response");
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }

        org.springframework.http.HttpHeaders userHeaders = new org.springframework.http.HttpHeaders();
        userHeaders.setBearerAuth(googleResponse.accessToken());
        
        org.springframework.http.HttpEntity<Void> userRequest = new org.springframework.http.HttpEntity<>(userHeaders);
        
        org.springframework.http.ResponseEntity<OutboundUserResponse> userResponse = restTemplate.exchange(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                org.springframework.http.HttpMethod.GET,
                userRequest,
                OutboundUserResponse.class
        );
        
        if (userResponse.getBody() == null) {
            log.error("Google UserInfo Error: Empty response body");
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }

        return loginWithGoogle(userResponse.getBody(), response);
    }

    private AuthenticationResponse loginWithGoogle(OutboundUserResponse googleInfo, HttpServletResponse response) {
        var user = userRepository.findByEmail(googleInfo.email())
            .orElseGet(() -> {
               Role studentRole = roleRepository.findById("USER")
                       .orElseThrow(() -> {
                           log.error("Google Login Error: Role 'USER' not found in database!");
                           return new RuntimeException("Role 'USER' not found in database!");
                       });

               return User.builder()
                       .username(googleInfo.email())
                       .email(googleInfo.email())
                       .fullName(googleInfo.name())
                       .avatar(googleInfo.picture())
                       .authProvider("GOOGLE")
                       .providerID(googleInfo.id())
                       .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                       .roles(Set.of(studentRole))
                       .build();
            });

        try {
            user.setAvatar(googleInfo.picture());
            user.setFullName(googleInfo.name());
            userRepository.save(user);
        } catch (Exception e) {
            log.error("Google Login Error: Failed to save user: ", e);
            throw e;
        }

        var accessToken = generateToken(user);

        String refreshTokenStr = UUID.randomUUID().toString();

        refreshTokenRepository.save(RefreshToken.builder()
                .token(refreshTokenStr)
                .user(user)
                .expiryTime(Instant.now().plus(7, ChronoUnit.DAYS))
                .build());

        ResponseCookie cookie = ResponseCookie.from("refresh-token", refreshTokenStr)
                .httpOnly(true)
                .path("/")
                .maxAge(7 * 24 * 60 * 60)
                .sameSite("Lax")
                .build();

        var token = generateToken(user);

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return AuthenticationResponse.builder()
                .token(token)
                .authenticate(true)
                .build();
    }
}
