package com.xlingsbx.linbackendmaster;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@MapperScan("com.xlingsbx.linbackendmaster.mapper")
@SpringBootApplication
public class LinBackendMasterApplication {

    public static void main(String[] args) {
        SpringApplication.run(LinBackendMasterApplication.class, args);
    }

}
