package com.xlingsbx.linbackendmaster.service;

import com.xlingsbx.linbackendmaster.model.domain.User;
import com.baomidou.mybatisplus.extension.service.IService;

import javax.servlet.http.HttpServletRequest;
import java.util.List;

/**
* @author xiaoling
* @description 针对表【user(用户)】的数据库操作Service
* @createDate 2026-09-17 21:26:34
*/
public interface UserService extends IService<User> {
    long userRegister(String userAccount, String userPassword,String checkPassword,String planetCode) ;

    User userLogin(String userAccount, String userPassword, HttpServletRequest request);

    User getSafetyUser(User originUser);

    int userLogout(HttpServletRequest request);

    boolean isAdmin(HttpServletRequest request);

    User getLoginUser(HttpServletRequest request);

    int updateUser(User user, User loginUser);

    boolean isAdmin(User loginUser);

    List<User> searchUsersByTags(List<String> tagNameList);

    List<User> matchUsers(long num, User loginuser);
}
