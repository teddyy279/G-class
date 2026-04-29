package com.edu.G_class.modules.auth.repository.httpClient;


import com.edu.G_class.modules.auth.dto.response.OutboundUserResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "outbound-user", url = "https://www.googleapis.com")
public interface OutboundUserClient {
    @GetMapping(value = "/oauth2/v3/userinfo")
    OutboundUserResponse getUserInfo(@RequestHeader("Authorization") String bearerToken);
}
